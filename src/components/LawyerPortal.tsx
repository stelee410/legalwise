import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Bot, 
  UserCircle, 
  Database, 
  MessageSquare, 
  Plus, 
  Settings, 
  LogOut, 
  Search,
  FileText,
  Upload,
  ChevronRight,
  Scale
} from 'lucide-react';
import { cn } from '../lib/utils';

type Tab = 'assistant' | 'twin' | 'knowledge';

export default function LawyerPortal({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('assistant');

  const tabs = [
    { id: 'assistant', label: '律助对话', icon: Bot },
    { id: 'twin', label: '数字分身', icon: UserCircle },
    { id: 'knowledge', label: '知识库', icon: Database },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <Scale className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-gray-900">律师端控制台</h1>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {activeTab === 'assistant' && <AssistantView />}
          {activeTab === 'twin' && <DigitalTwinView />}
          {activeTab === 'knowledge' && <KnowledgeBaseView />}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center sticky bottom-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === tab.id ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <tab.icon className={cn("w-6 h-6", activeTab === tab.id && "scale-110")} />
            <span className="text-[10px] font-medium">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="w-1 h-1 bg-emerald-600 rounded-full mt-0.5"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

function AssistantView() {
  return (
    <div className="space-y-6">
      <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-100">
        <h2 className="text-xl font-bold">您好，张律师</h2>
        <p className="text-emerald-100 text-sm mt-1">今天有 3 个案件需要跟进，AI 助手已为您准备好摘要。</p>
        <button className="mt-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm">
          查看今日待办
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left space-y-2">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm">文书起草</h3>
          <p className="text-xs text-gray-400">快速生成起诉状、答辩状</p>
        </button>
        <button className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left space-y-2">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm">法条检索</h3>
          <p className="text-xs text-gray-400">精准定位相关法律法规</p>
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 px-1">最近对话</h3>
        {[1, 2].map(i => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">关于“王某某离婚纠纷案”的证据分析</h4>
              <p className="text-xs text-gray-400 mt-0.5">2小时前 · 已完成分析</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DigitalTwinView() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 py-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto flex items-center justify-center text-emerald-600">
          <UserCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">数字分身</h2>
        <p className="text-sm text-gray-500">让 AI 学习您的办案风格，为您初步接待客户</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">当前状态</h3>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">运行中</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium">风格设置：专业、严谨</span>
            </div>
            <button className="text-emerald-600 text-xs font-bold">修改</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium">今日接待：12 人次</span>
            </div>
            <button className="text-emerald-600 text-xs font-bold">查看详情</button>
          </div>
        </div>

        <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-colors">
          训练新分身
        </button>
      </div>
    </div>
  );
}

function KnowledgeBaseView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">知识库管理</h2>
        <button className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
          <Plus className="w-4 h-4" />
          新建库
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="搜索文档或知识点..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { name: '婚姻法案例集', count: 45, size: '12.4 MB' },
          { name: '公司合规手册', count: 12, size: '2.1 MB' },
          { name: '个人办案笔记', count: 128, size: '45.8 MB' },
        ].map(kb => (
          <div key={kb.name} className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Database className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900">{kb.name}</h4>
              <p className="text-xs text-gray-400 mt-1">{kb.count} 个文档 · {kb.size}</p>
            </div>
            <button className="p-2 text-gray-300 hover:text-emerald-600 transition-colors">
              <Upload className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

