import React from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getApiUrl } from '../../config/api';
import type { Message } from '../../types';

/** 图片预览 URL：优先 previewUrl，其次用 token 构造下载地址 */
function getImagePreviewUrl(att: { token?: string; previewUrl?: string; type?: string }): string | undefined {
  if (att.type !== 'image') return undefined;
  if (att.previewUrl) return att.previewUrl;
  if (att.token) return `${getApiUrl(`/api/v1/files/${att.token}/download`)}?preview=1`;
  return undefined;
}

type Variant = 'individual' | 'lawyer';

const variantStyles = {
  individual: {
    user: 'bg-blue-600 text-white rounded-tr-none',
    assistant: 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none prose-pre:bg-gray-200 prose-pre:text-gray-800 prose-code:bg-gray-200 prose-code:text-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
  },
  lawyer: {
    user: 'bg-emerald-600 text-white rounded-tr-none',
    assistant: 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none prose-emerald prose-pre:bg-gray-200 prose-pre:text-gray-800 prose-code:bg-gray-200 prose-code:text-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
  },
};

interface ChatMessageBubbleProps {
  message: Message;
  variant?: Variant;
}

export default function ChatMessageBubble({ message, variant = 'individual' }: ChatMessageBubbleProps) {
  const styles = variantStyles[variant];
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm',
          isUser ? styles.user : styles.assistant
        )}
      >
        {message.attachments?.length ? (
          <div className={cn('flex flex-wrap gap-2 mb-2', isUser ? 'opacity-90' : '')}>
            {message.attachments.map((att, i) => {
              const imgUrl = getImagePreviewUrl(att);
              return imgUrl ? (
                <img
                  key={i}
                  src={imgUrl}
                  alt={att.name ?? ''}
                  className="rounded-lg max-h-24 object-cover border border-white/20"
                />
              ) : (
                <span
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs',
                    isUser ? 'bg-white/20' : 'bg-gray-200/80 text-gray-700'
                  )}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  {att.name ?? '附件'}
                </span>
              );
            })}
          </div>
        ) : null}
        <div
          className={cn(
            'prose prose-sm max-w-none dark:prose-invert',
            isUser ? 'prose-invert' : ''
          )}
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
