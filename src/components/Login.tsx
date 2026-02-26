import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Scale, Smartphone, Lock, ShieldCheck, ChevronDown } from 'lucide-react';
import { Role } from '../types';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: (role: Role) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<Role>('individual');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    { id: 'individual', title: '个人用户', accent: 'bg-blue-600' },
    { id: 'lawyer', title: '律师端', accent: 'bg-emerald-600' },
    { id: 'judiciary', title: '司法端', accent: 'bg-stone-600' }
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onLogin(selectedRole);
      setIsSubmitting(false);
    }, 800);
  };

  const currentRoleData = roles.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-emerald-600 to-stone-600" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl text-white mb-4 shadow-xl"
          >
            <Scale className="w-8 h-8" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">法智通</h1>
          <p className="text-gray-500 mt-2">专业的法律AI智能平台</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-100/50"
        >
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900">欢迎登录</h2>
            <p className="text-sm text-gray-500">请输入您的账号信息并选择登录身份</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">用户名 / 手机号</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input 
                  type="text"
                  required
                  placeholder="请输入用户名或手机号"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">登录密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input 
                  type="password"
                  required
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">登录身份</label>
              <div className="relative">
                <select
                  value={selectedRole || ''}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="w-full pl-4 pr-10 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all appearance-none cursor-pointer text-gray-700"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm px-1">
              <label className="flex items-center gap-2 text-gray-500 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                记住我
              </label>
              <button type="button" className="text-blue-600 font-medium hover:underline">忘记密码？</button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-4 rounded-2xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2",
                currentRoleData?.accent || 'bg-gray-900',
                isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  立即登录
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-500">
              还没有账号？ <button className="text-blue-600 font-bold hover:underline">立即注册</button>
            </p>
          </div>
        </motion.div>

        <p className="text-center text-xs text-gray-400 mt-12">
          © 2026 法智通 LegalWise AI. 守护您的法律权益。<br/>
          京ICP备20260001号-1
        </p>
      </motion.div>
    </div>
  );
}
