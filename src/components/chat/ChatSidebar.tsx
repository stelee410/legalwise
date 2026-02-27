import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MessageSquare, Trash2, LogOut, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ChatSession } from '../../types';

type Variant = 'individual' | 'lawyer';

const variantStyles = {
  individual: {
    active: 'bg-blue-50 text-blue-700 border-blue-100',
    inactive: 'hover:bg-gray-100 text-gray-600',
  },
  lawyer: {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    inactive: 'hover:bg-gray-100 text-gray-600',
  },
};

interface ChatSidebarProps {
  variant?: Variant;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onLogout?: () => void;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
  creatingSession?: boolean;
}

export default function ChatSidebar({
  variant = 'individual',
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onLogout,
  isSidebarOpen,
  onCloseSidebar,
  creatingSession = false,
}: ChatSidebarProps) {
  const styles = variantStyles[variant];

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseSidebar}
            className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-[#F8F9FA] border-r border-gray-100 flex flex-col transition-transform md:relative md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900">历史对话</h2>
          <button onClick={onCloseSidebar} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={onCreateSession}
            disabled={creatingSession}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {creatingSession ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            发起新对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all group border',
                activeSessionId === session.id
                  ? `${styles.active} border`
                  : `${styles.inactive} border-transparent`
              )}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{session.title}</span>
              <Trash2
                className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                onClick={(e) => onDeleteSession(session.id, e)}
              />
            </button>
          ))}
        </div>

        {onLogout && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
}
