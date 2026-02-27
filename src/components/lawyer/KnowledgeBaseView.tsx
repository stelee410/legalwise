import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Database,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  FileText as FileTextIcon,
} from 'lucide-react';
import {
  listKnowledgeBases,
  createKnowledgeBase,
  deleteKnowledgeBase,
  listDocuments,
  uploadDocument,
  deleteDocument,
  formatFileSize,
  type KnowledgeBaseInfo,
  type DocumentInfo,
} from '../../services/knowledge';

export default function KnowledgeBaseView() {
  const [kbList, setKbList] = useState<KnowledgeBaseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedKb, setSelectedKb] = useState<KnowledgeBaseInfo | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadKbList = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const list = await listKnowledgeBases();
      setKbList(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKbList();
  }, [loadKbList]);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    try {
      setCreating(true);
      await createKnowledgeBase({
        name: createName.trim(),
        description: createDesc.trim() || undefined,
      });
      setShowCreate(false);
      setCreateName('');
      setCreateDesc('');
      await loadKbList();
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (kb: KnowledgeBaseInfo) => {
    if (!confirm(`确定删除知识库「${kb.name}」吗？此操作不可撤销。`)) return;
    try {
      await deleteKnowledgeBase(kb.id);
      if (selectedKb?.id === kb.id) {
        setSelectedKb(null);
        setDocuments([]);
      }
      await loadKbList();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    }
  };

  const openKbDetail = async (kb: KnowledgeBaseInfo) => {
    setSelectedKb(kb);
    setDocsLoading(true);
    try {
      const docs = await listDocuments(kb.id);
      setDocuments(docs);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载文档失败');
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedKb) return;
    handleUpload(file);
    e.target.value = '';
  };

  const handleUpload = async (file: File) => {
    if (!selectedKb) return;
    try {
      setUploading(true);
      const doc = await uploadDocument(selectedKb.id, file);
      setDocuments((prev) => [...prev, doc]);
      await loadKbList();
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (doc: DocumentInfo) => {
    if (!confirm(`确定删除文档「${doc.name || doc.filename}」吗？`)) return;
    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      await loadKbList();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除文档失败');
    }
  };

  const filteredKb = kbList.filter(
    (kb) => !searchTerm || (kb.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (selectedKb) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedKb(null)}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{selectedKb.name}</h2>
            {selectedKb.description && (
              <p className="text-sm text-gray-500">{selectedKb.description}</p>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? '上传中...' : '上传文档'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={handleFileSelect}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {docsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无文档</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold hover:bg-emerald-200"
            >
              上传第一个文档
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                  <FileTextIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{doc.name || doc.filename}</h4>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(doc.size)}
                    {doc.chunk_count ? ` · ${doc.chunk_count} 个分块` : ''}
                    {doc.status ? ` · ${doc.status}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteDoc(doc)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">知识库管理</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 text-emerald-600 text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          新建库
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索知识库..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : filteredKb.length === 0 ? (
        <div className="text-center py-12">
          <Database className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">
            {searchTerm ? '未找到匹配的知识库' : '暂无知识库'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold hover:bg-emerald-200"
            >
              创建第一个知识库
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredKb.map((kb) => (
            <div
              key={kb.id}
              onClick={() => openKbDetail(kb)}
              className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Database className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900">{kb.name || '未命名知识库'}</h4>
                <p className="text-xs text-gray-400 mt-1">
                  {kb.document_count ?? 0} 个文档
                  {kb.total_size ? ` · ${formatFileSize(kb.total_size)}` : ''}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(kb);
                }}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="删除"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-gray-900">新建知识库</h3>
            <input
              type="text"
              placeholder="知识库名称"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <textarea
              placeholder="描述（可选）"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!createName.trim() || creating}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {creating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
