import React, { useRef } from 'react';
import { Send, ImagePlus, FileText, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IMAGE_ACCEPT, DOC_ACCEPT } from '../../hooks/useFileUpload';
import type { PendingFile } from '../../types/chat';

type Variant = 'individual' | 'lawyer';

const variantStyles = {
  individual: {
    focus: 'focus:ring-blue-500/20 focus:border-blue-500',
    sendActive: 'bg-blue-600 shadow-lg shadow-blue-200 hover:bg-blue-700',
    sendDisabled: 'bg-gray-200 text-gray-400 cursor-not-allowed',
  },
  lawyer: {
    focus: 'focus:ring-emerald-500/20 focus:border-emerald-500',
    sendActive: 'bg-emerald-600 shadow-lg shadow-emerald-200 hover:bg-emerald-700',
    sendDisabled: 'bg-gray-200 text-gray-400 cursor-not-allowed',
  },
};

interface ChatInputProps {
  variant?: Variant;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  pendingFiles: PendingFile[];
  onAddFiles: (files: FileList | null, type: 'image' | 'document') => void;
  onRemoveFile: (index: number) => void;
  hint?: string;
}

export default function ChatInput({
  variant = 'individual',
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = '描述您的问题',
  pendingFiles,
  onAddFiles,
  onRemoveFile,
  hint = '支持图片（jpg/png/gif/webp）与文档（pdf/doc/docx/txt/md）。AI 助手仅供参考。',
}: ChatInputProps) {
  const styles = variantStyles[variant];
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const hasContent = value.trim() || pendingFiles.length > 0;
  const canSend = hasContent && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingFiles.map((p, i) => (
              <div
                key={i}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-2 py-1.5 text-sm',
                  p.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50 text-gray-700'
                )}
              >
                {p.type === 'image' && p.previewUrl ? (
                  <img src={p.previewUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 shrink-0 text-gray-500" />
                )}
                <span className="max-w-[120px] truncate">{p.file.name}</span>
                {p.error ? (
                  <span className="text-xs">{p.error}</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onRemoveFile(i)}
                  className="p-0.5 rounded hover:bg-black/10"
                  aria-label="移除"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'w-full p-4 pr-24 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 transition-all resize-none min-h-[60px] max-h-[200px]',
              variant === 'individual' ? 'focus:ring-blue-500/20 focus:border-blue-500' : 'focus:ring-emerald-500/20 focus:border-emerald-500'
            )}
            rows={1}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <input
              ref={imageInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => onAddFiles(e.target.files, 'image')}
            />
            <input
              ref={docInputRef}
              type="file"
              accept={DOC_ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => onAddFiles(e.target.files, 'document')}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              title="上传图片"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              title="上传文档"
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={onSend}
              disabled={!canSend}
              className={cn(
                'p-2 rounded-xl transition-all',
                canSend ? styles.sendActive : styles.sendDisabled
              )}
              title="发送"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-center text-gray-400 mt-2">{hint}</p>
    </div>
  );
}
