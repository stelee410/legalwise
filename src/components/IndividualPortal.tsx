import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Menu, RefreshCw } from 'lucide-react';
import { ChatSession, Message, MessageAttachment } from '../types';
import { getGeminiResponse, generateChatTitle, type ImagePart } from '../services/gemini';
import {
  getSystemAgentId,
  listGroupChats,
  createGroupChat,
  getGroupChatMessages,
  sendGroupChatMessage,
  deleteGroupChat,
  updateGroupChat,
  pollForAssistantResponse,
  filterSingleAgentGroupChats,
  type GroupChatInfo,
} from '../services/groupChat';
import { generateSessionTitle, getSystemServiceAgentId, type MessageItem } from '../services/chat';
import { SYSTEM_AGENT_CODE } from '../config/api';
import { ChatSidebar, ChatMessageBubble, ChatEmptyState, ChatInput } from './chat';
import { useFileUpload } from '../hooks/useFileUpload';
import { resolvePendingAttachments } from '../services/files';

const useLinkyunChat = !!SYSTEM_AGENT_CODE?.trim();

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function IndividualPortal({ onLogout }: { onLogout: () => void }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);
  const agentIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { pendingFiles, addFiles, removePendingFile, clearPendingFiles } = useFileUpload();

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const loadGroupChatHistory = React.useCallback(async () => {
    if (!useLinkyunChat) return;
    try {
      const agentId = agentIdRef.current ?? (await getSystemAgentId());
      agentIdRef.current = agentId;
      const groupList = await listGroupChats({ agent_id: agentId, limit: 50 });
      // 严格过滤：只保留 participants 中有且只有一个 Agent 且与系统 Agent ID 一致的群聊
      const filteredList = filterSingleAgentGroupChats(groupList, agentId);
      const chatSessions: ChatSession[] = filteredList.map((g: GroupChatInfo) => ({
        id: String(g.id),
        title: (g.title ?? (g as { topic?: string }).topic ?? '新对话') as string,
        messages: [],
        createdAt: g.created_at ? new Date(g.created_at as string).getTime() : Date.now(),
      }));
      chatSessions.sort((a, b) => b.createdAt - a.createdAt);
      setSessions((prev) => {
        const byId = new Map(prev.map((s) => [s.id, s]));
        return chatSessions.map((s) => ({
          ...s,
          messages: byId.get(s.id)?.messages ?? s.messages,
          title: byId.get(s.id)?.title ?? s.title,
        }));
      });
    } catch (e) {
      console.error('加载历史群聊失败', e);
    }
  }, []);

  useEffect(() => {
    if (!useLinkyunChat) return;
    loadGroupChatHistory();
  }, [loadGroupChatHistory]);

  useEffect(() => {
    if (useLinkyunChat && isSidebarOpen) {
      loadGroupChatHistory();
    }
  }, [useLinkyunChat, isSidebarOpen, loadGroupChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const createNewSession = async () => {
    if (creatingSession) return;
    if (useLinkyunChat) {
      setCreatingSession(true);
      try {
        const agentId = agentIdRef.current ?? await getSystemAgentId();
        agentIdRef.current = agentId;
        const group = await createGroupChat(agentId);
        const newSession: ChatSession = {
          id: String(group.id),
          title: '新对话',
          messages: [],
          createdAt: Date.now(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setIsSidebarOpen(false);
      } catch (e) {
        console.error(e);
      } finally {
        setCreatingSession(false);
      }
    } else {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: '新对话',
        messages: [],
        createdAt: Date.now(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setIsSidebarOpen(false);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const newSessions = sessions.filter((s) => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions[0]?.id || null);
    }

    if (useLinkyunChat) {
      try {
        await deleteGroupChat(id);
      } catch (e) {
        console.error('删除群聊失败', e);
      }
    }
  };

  const refreshSessionMessages = React.useCallback(async (sessionId: string) => {
    setSessionLoadError(null);
    try {
      const messages = await getGroupChatMessages(sessionId);
      const localMessages: Message[] = messages
        .filter((m) => m.role !== 'system')
        .map((m, idx) => ({
          id: m.id || `${sessionId}-${idx}`,
          role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.content || '',
          timestamp: m.created_at ? new Date(m.created_at as string).getTime() : Date.now(),
          attachments: m.attachments?.map((att) => ({
            type: (att.type === 'image' ? 'image' : 'file') as 'image' | 'file',
            token: att.token ?? '',
            mime_type: att.mime_type,
            name: att.name,
            size: att.size as number | undefined,
          })),
        }));
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, messages: localMessages } : s))
      );
    } catch (e) {
      console.error('刷新消息失败', e);
    }
  }, []);

  const selectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setSessionLoadError(null);
    setIsSidebarOpen(false);

    const session = sessions.find((s) => s.id === sessionId);
    if (session && session.messages.length === 0 && useLinkyunChat) {
      try {
        const messages = await getGroupChatMessages(sessionId);
        const localMessages: Message[] = messages
          .filter((m) => m.role !== 'system')
          .map((m, idx) => ({
            id: m.id || `${sessionId}-${idx}`,
            role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
            content: m.content || '',
            timestamp: m.created_at ? new Date(m.created_at as string).getTime() : Date.now(),
          attachments: m.attachments?.map((att) => ({
            type: (att.type === 'image' ? 'image' : 'file') as 'image' | 'file',
            token: att.token ?? '',
            mime_type: att.mime_type,
            name: att.name,
            size: att.size as number | undefined,
          })),
        }));
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, messages: localMessages } : s))
        );
      } catch (e) {
        console.error('加载消息失败', e);
      }
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    const filesToSend = pendingFiles.filter((p) => !p.error);
    if ((!text && filesToSend.length === 0) || isLoading) return;

    const imageFilesForGemini = filesToSend.filter((p) => p.type === 'image');
    setInput('');
    setIsLoading(true);

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      if (useLinkyunChat) {
        setCreatingSession(true);
        try {
          const agentId = agentIdRef.current ?? await getSystemAgentId();
          agentIdRef.current = agentId;
          const group = await createGroupChat(agentId);
          const newSession: ChatSession = {
            id: String(group.id),
            title: '新对话',
            messages: [],
            createdAt: Date.now(),
          };
          setSessions((prev) => [newSession, ...prev]);
          setActiveSessionId(newSession.id);
          currentSessionId = newSession.id;
        } catch (e) {
          console.error(e);
          setCreatingSession(false);
          setIsLoading(false);
          return;
        } finally {
          setCreatingSession(false);
        }
      } else {
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: '新对话',
          messages: [],
          createdAt: Date.now(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        currentSessionId = newSession.id;
      }
    }

    // §5.2 步骤 1：上传文件获取 token（在构造消息之前完成）
    let resolved: Awaited<ReturnType<typeof resolvePendingAttachments>> = [];
    if (filesToSend.length > 0) {
      try {
        resolved = await resolvePendingAttachments(filesToSend);
      } catch (e) {
        console.error(e);
        setIsLoading(false);
        return;
      }
    }

    // §5.2 步骤 2：用已上传的 token 构造用户消息（乐观更新）
    const msgAttachments: MessageAttachment[] = resolved.map((a) => ({
      type: a.type,
      token: a.token,
      mime_type: a.mime_type,
      name: a.name,
      size: a.size,
      previewUrl: a.preview_url ?? a.download_url,
    }));

    const hasImage = resolved.some((a) => a.type === 'image');
    const defaultContent = hasImage ? '请分析这个图片' : '(附带文档)';

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || defaultContent,
      timestamp: Date.now(),
      attachments: msgAttachments.length ? msgAttachments : undefined,
    };

    setSessions((prev) => {
      const found = prev.find((s) => s.id === currentSessionId);
      if (found) {
        return prev.map((s) =>
          s.id === currentSessionId ? { ...s, messages: [...s.messages, userMessage] } : s
        );
      }
      return [
        { id: currentSessionId!, title: '新对话', messages: [userMessage], createdAt: Date.now() },
        ...prev,
      ];
    });
    clearPendingFiles();

    // §5.2 步骤 3：发 API 只传 { type, token }
    const attachForApi = resolved.length
      ? resolved.map((a) => ({ type: a.type, token: a.token }))
      : undefined;

    const appendAssistantMessage = (content: string) => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
      };
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSessionId) return s;
          const newMessages = [...s.messages, assistantMessage];
          if (newMessages.length === 3 || newMessages.length === 4) {
            const msgList = newMessages.map((m) => ({ role: m.role, content: m.content }));
            const genTitle = useLinkyunChat
              ? getSystemServiceAgentId().then((serviceAgentId) =>
                  generateSessionTitle(serviceAgentId, msgList)
                )
              : generateChatTitle(msgList);
            genTitle
              .then((title) => {
                setSessions((latest) =>
                  latest.map((ls) => (ls.id === currentSessionId ? { ...ls, title } : ls))
                );
                if (useLinkyunChat && currentSessionId) {
                  updateGroupChat(currentSessionId, { title }).catch(() => {});
                }
              })
              .catch(() => {});
          }
          return { ...s, messages: newMessages };
        })
      );
    };

    const msgCountBefore = sessions.find((s) => s.id === currentSessionId)?.messages?.length ?? 0;
    const minCount = msgCountBefore + 1;

    const extractFromResponse = (res: MessageItem | { messages?: MessageItem[] }): string | null => {
      const m = res as MessageItem;
      if (m?.role === 'assistant' && typeof m?.content === 'string' && m.content.trim()) return m.content.trim();
      const arr = (res as { messages?: MessageItem[] }).messages;
      if (Array.isArray(arr) && arr.length > minCount) {
        const last = arr[arr.length - 1];
        if (last?.role === 'assistant' && typeof last?.content === 'string' && (last.content as string).trim()) {
          return (last.content as string).trim();
        }
      }
      return null;
    };

    try {
      if (useLinkyunChat) {
        const res = await sendGroupChatMessage(currentSessionId!, {
          content: text || defaultContent,
          attachments: attachForApi,
          stream: false,
        });
        let content = extractFromResponse(res);
        if (!content) {
          content = await pollForAssistantResponse(currentSessionId!, 30000, minCount);
        }
        if (content) {
          appendAssistantMessage(content);
          setSessionLoadError(null);
        } else {
          setSessionLoadError(currentSessionId!);
        }
      } else {
        const currentMessages = (
          sessions.find((s) => s.id === currentSessionId)?.messages ?? []
        ).concat(userMessage);
        let lastMessageImages: ImagePart[] | undefined;
        if (imageFilesForGemini.length) {
          lastMessageImages = await Promise.all(
            imageFilesForGemini.map(async (p) => ({
              mimeType: p.file.type || 'image/jpeg',
              data: await fileToBase64(p.file),
            }))
          );
        }
        const aiResponse = await getGeminiResponse(
          currentMessages.map((m) => ({ role: m.role, content: m.content })),
          undefined,
          lastMessageImages
        );
        appendAssistantMessage(aiResponse);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = ['如何起诉欠款不还？', '劳动合同解除补偿标准', '房屋租赁纠纷处理'];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <ChatSidebar
        variant="individual"
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={selectSession}
        onCreateSession={createNewSession}
        onDeleteSession={deleteSession}
        onLogout={onLogout}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        creatingSession={creatingSession}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
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

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!activeSession || activeSession.messages.length === 0 ? (
            <ChatEmptyState
              variant="individual"
              title="您好，我是您的法律助手"
              description="您可以向我咨询法律问题、合同审查或法律程序相关建议。"
              suggestions={suggestions}
              onSuggestionClick={setInput}
            />
          ) : (
            activeSession.messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} variant="individual" />
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
          {sessionLoadError === activeSessionId && activeSession && (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-gray-500 text-sm">系统正在忙，请稍后刷新</p>
              <button
                onClick={() => refreshSessionMessages(activeSessionId!)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                刷新
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          variant="individual"
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isLoading}
          placeholder="描述您的法律问题，可上传图片或文档..."
          pendingFiles={pendingFiles}
          onAddFiles={addFiles}
          onRemoveFile={removePendingFile}
          hint="支持图片（jpg/png/gif/webp）与文档（pdf/doc/docx/txt/md）。AI 助手仅供参考，不构成正式法律意见。"
        />
      </main>
    </div>
  );
}
