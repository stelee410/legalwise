import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Send, MessageSquare, Menu, X, LogOut, Trash2, Scale } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatSession, Message } from '../types';
import { getGeminiResponse, generateChatTitle } from '../services/gemini';
import { cn } from '../lib/utils';

export default function IndividualPortal({ onLogout }: { onLogout: () => void }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      createdAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions[0]?.id || null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: '新对话',
        messages: [],
        createdAt: Date.now()
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      currentSessionId = newSession.id;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const updatedSessions = sessions.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: [...s.messages, userMessage] };
      }
      return s;
    });
    setSessions(updatedSessions);
    setInput('');
    setIsLoading(true);

    try {
      const currentMessages = updatedSessions.find(s => s.id === currentSessionId)?.messages || [];
      const aiResponse = await getGeminiResponse(currentMessages);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now()
      };

      setSessions(prev => {
        const next = prev.map(s => {
          if (s.id === currentSessionId) {
            const newMessages = [...s.messages, assistantMessage];
            // Auto generate title after 2-3 messages
            if (newMessages.length === 3 || newMessages.length === 4) {
              generateChatTitle(newMessages).then(title => {
                setSessions(latest => latest.map(ls => ls.id === currentSessionId ? { ...ls, title } : ls));
              });
            }
            return { ...s, messages: newMessages };
          }
          return s;
        });
        return next;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#F8F9FA] border-r border-gray-100 flex flex-col transition-transform md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-bottom border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900">历史对话</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            发起新对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => {
                setActiveSessionId(session.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all group",
                activeSessionId === session.id 
                  ? "bg-blue-50 text-blue-700 border border-blue-100" 
                  : "hover:bg-gray-100 text-gray-600 border border-transparent"
              )}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{session.title}</span>
              <Trash2 
                className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity" 
                onClick={(e) => deleteSession(session.id, e)}
              />
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-gray-100 flex items-center px-4 gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 truncate">
              {activeSession?.title || '法律AI助手'}
            </h1>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Scale className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">您好，我是您的法律助手</h2>
                <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                  您可以向我咨询法律问题、合同审查或法律程序相关建议。
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-8">
                {['如何起诉欠款不还？', '劳动合同解除补偿标准', '房屋租赁纠纷处理'].map(q => (
                  <button 
                    key={q}
                    onClick={() => {
                      setInput(q);
                      // Trigger send manually or just set input
                    }}
                    className="p-3 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeSession.messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex w-full",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none"
                )}>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="描述您的法律问题..."
              className="w-full p-4 pr-14 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[60px] max-h-[200px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                "absolute right-2 bottom-2 p-2 rounded-xl transition-all",
                input.trim() && !isLoading 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-2">
            AI 助手仅供参考，不构成正式法律意见。
          </p>
        </div>
      </main>
    </div>
  );
}
