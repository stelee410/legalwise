export type Role = 'individual' | 'lawyer' | 'judiciary' | null;

export interface MessageAttachment {
  type: 'image' | 'file';
  token: string;
  mime_type?: string;
  name?: string;
  size?: number;
  /** 仅前端展示用：图片预览 URL（object URL 或 token 下载地址） */
  previewUrl?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: MessageAttachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  role: Role;
}
