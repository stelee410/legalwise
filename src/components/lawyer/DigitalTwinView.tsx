import React, { useState, useEffect } from 'react';
import { UserCircle, Plus } from 'lucide-react';
import {
  listAgents,
  createAgent,
  nameToCode,
  type AgentInfo,
} from '../../services/agents';
import DigitalTwinEditView from './DigitalTwinEditView';

export default function DigitalTwinView() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await listAgents({ limit: 100 });
        if (!cancelled) setAgents(list);
      } catch {
        if (!cancelled) setAgents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasTwin = agents.length > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm">加载中...</p>
      </div>
    );
  }

  const handleCreate = async () => {
    const name = createName.trim() || '我的数字分身';
    setCreating(true);
    setCreateError('');
    try {
      const code = nameToCode(name);
      await createAgent({ name, code, description: createDesc.trim() || undefined });
      setShowCreate(false);
      setCreateName('');
      setCreateDesc('');
      const list = await listAgents({ limit: 100 });
      setAgents(list);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  if (!hasTwin) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4 py-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto flex items-center justify-center text-emerald-600">
            <UserCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">数字分身</h2>
          <p className="text-sm text-gray-500 mt-2">让 AI 学习您的办案风格，为您初步接待客户</p>
        </div>
        <p className="text-gray-500 text-sm">您还没有建立数字分身</p>
        <button
          onClick={() => setShowCreate(true)}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          添加你的数字分身
        </button>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4">
              <h3 className="text-lg font-bold text-gray-900">新建数字分身</h3>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
              <input
                type="text"
                placeholder="例如：张三律师"
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
                  disabled={creating}
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

  const firstAgent = agents[0];
  return (
    <DigitalTwinEditView
      agentId={firstAgent.id}
      onRefresh={async () => {
        const list = await listAgents({ limit: 100 });
        setAgents(list);
      }}
    />
  );
}
