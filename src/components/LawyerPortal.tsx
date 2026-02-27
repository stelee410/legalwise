import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bot, UserCircle, Database, LogOut, Scale } from 'lucide-react';
import { cn } from '../lib/utils';
import AssistantView from './lawyer/AssistantView';
import DigitalTwinView from './lawyer/DigitalTwinView';
import KnowledgeBaseView from './lawyer/KnowledgeBaseView';
import { clearAuth } from '../lib/authStorage';

type Tab = 'assistant' | 'twin' | 'knowledge';

export default function LawyerPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('assistant');

  const handleLogout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [navigate]);

  const tabs = [
    { id: 'assistant', label: '律助对话', icon: Bot },
    { id: 'twin', label: '数字分身', icon: UserCircle },
    { id: 'knowledge', label: '知识库', icon: Database },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA]">
      <header className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <Scale className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-gray-900">律师端控制台</h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 overflow-hidden">
        {activeTab === 'assistant' ? (
          <AssistantView />
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {activeTab === 'twin' && <DigitalTwinView />}
              {activeTab === 'knowledge' && <KnowledgeBaseView />}
            </div>
          </div>
        )}
      </main>

      <nav className="bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center sticky bottom-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              'flex flex-col items-center gap-1 transition-all',
              activeTab === tab.id ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <tab.icon className={cn('w-6 h-6', activeTab === tab.id && 'scale-110')} />
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
