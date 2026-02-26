export type Role = 'individual' | 'lawyer' | 'judiciary' | null;

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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
