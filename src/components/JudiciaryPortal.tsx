import React from 'react';
import { motion } from 'motion/react';
import { Clock, ArrowLeft } from 'lucide-react';

export default function JudiciaryPortal({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6 max-w-sm"
      >
        <div className="w-20 h-20 bg-stone-100 rounded-full mx-auto flex items-center justify-center text-stone-400">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">司法端系统</h1>
          <p className="text-gray-500">
            该模块正在开发中，将为司法机关提供案件管理、政务公开与智能辅助决策支持。
          </p>
        </div>

        <div className="pt-4">
          <span className="px-4 py-2 bg-stone-100 text-stone-600 text-sm font-bold rounded-full">
            Coming Soon
          </span>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-2 mx-auto text-gray-400 hover:text-gray-600 transition-colors pt-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回选择角色
        </button>
      </motion.div>
    </div>
  );
}
