import React, { useState, useEffect, useRef } from 'react';
import { UserCircle, Image, FileText as FileTextIcon } from 'lucide-react';
import {
  getAgent,
  updateAgent,
  uploadAgentAvatar,
  deleteAgentAvatar,
  getAgentPreSkills,
  addPreSkillImageUpload,
  addPreSkillDocumentUpload,
  putAgentPreSkills,
  getAgentAvatarUrl,
  type AgentInfo,
  type PreSkillItem,
} from '../../services/agents';
import { listKnowledgeBases, type KnowledgeBaseInfo } from '../../services/knowledge';
import { ensureCreatorHasSkill } from '../../services/skills';
import { AVATAR_BASE_URL } from '../../config/api';
import AvatarCropModal from '../AvatarCropModal';

interface DigitalTwinEditViewProps {
  agentId: string;
  onRefresh: () => Promise<void>;
}

export default function DigitalTwinEditView({ agentId, onRefresh }: DigitalTwinEditViewProps) {
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseInfo[]>([]);
  const [preSkills, setPreSkills] = useState<PreSkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedKbId, setSelectedKbId] = useState('');

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [addingSkill, setAddingSkill] = useState<'image' | 'doc' | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [agent?.id, avatarVersion]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [a, kbs, skills] = await Promise.all([
          getAgent(agentId),
          listKnowledgeBases(),
          getAgentPreSkills(agentId),
        ]);
        if (cancelled) return;
        setAgent(a);
        setKnowledgeBases(kbs);
        setPreSkills(skills);
        setName(a.name || '');
        setDescription(a.description || '');
        setCode(a.code || '');
        setSystemPrompt(a.system_prompt || '');
        const ragKb = (a.rag_config as { knowledge_base_id?: string })?.knowledge_base_id;
        setSelectedKbId(ragKb || '');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const avatarBase = getAgentAvatarUrl(agent, AVATAR_BASE_URL);
  const latestAvatarUrl = avatarBase ? `${avatarBase}?v=${avatarVersion}` : null;
  const showAvatar = latestAvatarUrl && !avatarLoadError;

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAvatarCropConfirm = async (blob: Blob) => {
    setAvatarCropSrc(null);
    if (!agent) return;
    setAvatarUploading(true);
    setError('');
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      await uploadAgentAvatar(agent.id, file);
      const updated = await getAgent(agent.id);
      setAgent(updated);
      setAvatarVersion((v) => v + 1);
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传头像失败');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!agent) return;
    setAvatarUploading(true);
    setError('');
    try {
      await deleteAgentAvatar(agent.id);
      const updated = await getAgent(agent.id);
      setAgent(updated);
      setAvatarVersion((v) => v + 1);
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除头像失败');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAddImageUpload = async () => {
    if (!agent) return;
    setAddingSkill('image');
    setError('');
    try {
      const found = await ensureCreatorHasSkill(/image[_-]?upload/i);
      if (!found) {
        setError('技能市场中未找到图像上传技能，请先在技能市场添加');
        return;
      }
      await addPreSkillImageUpload(agent.id);
      const skills = await getAgentPreSkills(agent.id);
      setPreSkills(skills);
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加图像上传失败');
    } finally {
      setAddingSkill(null);
    }
  };

  const handleAddDocUpload = async () => {
    if (!agent) return;
    setAddingSkill('doc');
    setError('');
    try {
      const found = await ensureCreatorHasSkill(/document[_-]?upload/i);
      if (!found) {
        setError('技能市场中未找到文档上传技能，请先在技能市场添加');
        return;
      }
      await addPreSkillDocumentUpload(agent.id);
      const skills = await getAgentPreSkills(agent.id);
      setPreSkills(skills);
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加文档上传失败');
    } finally {
      setAddingSkill(null);
    }
  };

  const handleRemovePreSkill = async (skillId: string) => {
    if (!agent) return;
    try {
      const newSkills = preSkills.filter((s) => s.id !== skillId);
      await putAgentPreSkills(agent.id, newSkills.map((s) => ({ id: s.id })));
      setPreSkills(newSkills);
    } catch (e) {
      setError(e instanceof Error ? e.message : '移除技能失败');
    }
  };

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        system_prompt: systemPrompt.trim() || undefined,
      };
      if (selectedKbId) {
        body.rag_config = { knowledge_base_id: selectedKbId };
      } else {
        body.rag_config = null;
      }
      await updateAgent(agent.id, body);
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !agent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm">加载中...</p>
      </div>
    );
  }

  const hasImageUpload = preSkills.some(
    (s) => /image[_-]?upload/i.test(s.code ?? '') || /image[_-]?upload/i.test(s.name ?? '')
  );
  const hasDocUpload = preSkills.some(
    (s) => /document[_-]?upload/i.test(s.code ?? '') || /document[_-]?upload/i.test(s.name ?? '')
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-xl font-bold text-gray-900">编辑数字分身</h2>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {showAvatar ? (
              <img
                key={latestAvatarUrl}
                src={latestAvatarUrl!}
                alt="头像"
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-100"
                onError={() => setAvatarLoadError(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <UserCircle className="w-8 h-8" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{agent.name || '数字分身'}</p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="text-emerald-600 text-xs font-bold"
              >
                {avatarUploading ? '上传中...' : '上传'}
              </button>
              {showAvatar && (
                <button
                  onClick={handleAvatarRemove}
                  disabled={avatarUploading}
                  className="text-red-500 text-xs font-bold"
                >
                  删除
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">唯一编码 (code)</label>
          <input
            type="text"
            value={code}
            disabled
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">2-64 字符，小写字母、数字、下划线、连字符</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">系统提示词</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
            placeholder="描述 AI 的性格、背景、对话风格等"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">知识库(RAG)</label>
          <p className="text-xs text-gray-500 mb-2">绑定知识库后，AI 会基于知识库内容回答问题</p>
          <select
            value={selectedKbId}
            onChange={(e) => setSelectedKbId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">不绑定</option>
            {knowledgeBases.map((kb) => (
              <option key={kb.id} value={kb.id}>
                {kb.name || kb.code || kb.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">对话前技能</label>
          <div className="flex flex-wrap gap-2">
            {preSkills.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm"
              >
                <span className="text-sm">{s.name ?? s.code ?? '技能'}</span>
                <button
                  onClick={() => handleRemovePreSkill(s.id)}
                  className="text-emerald-400 hover:text-red-500"
                  title="删除"
                >
                  ×
                </button>
              </div>
            ))}
            {!hasImageUpload && (
              <button
                type="button"
                onClick={handleAddImageUpload}
                disabled={!!addingSkill}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50 text-sm"
              >
                <Image className="w-5 h-5" />
                {addingSkill === 'image' ? '添加中...' : '图像上传'}
              </button>
            )}
            {!hasDocUpload && (
              <button
                type="button"
                onClick={handleAddDocUpload}
                disabled={!!addingSkill}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50 text-sm"
              >
                <FileTextIcon className="w-5 h-5" />
                {addingSkill === 'doc' ? '添加中...' : '文档上传'}
              </button>
            )}
          </div>
        </div>

        {avatarCropSrc && (
          <AvatarCropModal
            imageSrc={avatarCropSrc}
            onConfirm={handleAvatarCropConfirm}
            onCancel={() => setAvatarCropSrc(null)}
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
