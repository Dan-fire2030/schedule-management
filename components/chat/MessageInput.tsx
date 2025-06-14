'use client';

import { useState, useRef } from 'react';
import { sendMessage } from '@/lib/supabase/messages';
import { useAuthSimplified } from '@/hooks/useAuthSimplified';

interface MessageInputProps {
  groupId: string;
  onSent: () => void;
  onStampClick: () => void;
  onOptimisticMessage?: (message: any) => void;
}

export default function MessageInput({ groupId, onSent, onStampClick, onOptimisticMessage }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user, profile } = useAuthSimplified();

  const handleSend = async () => {
    if (!content.trim() || sending || !user) return;

    const messageContent = content.trim();
    
    try {
      setSending(true);
// 楽観的更新: メッセージを即座に表示
      if (onOptimisticMessage) {
        const optimisticMessage = {
          id: `temp-${Date.now()}`, // 一時的なID
          group_id: groupId,
          user_id: user.id,
          content: messageContent,
          message_type: 'text',
          stamp_id: null,
          edited_at: null,
          created_at: new Date().toISOString(),
          user: {
            id: user.id,
            username: profile?.username || user.email?.split('@')[0] || 'ユーザー',
            avatar_url: profile?.avatar_url || null
          },
          stamp: null
        };
onOptimisticMessage(optimisticMessage);
      }
      
      // 実際のメッセージ送信
      // @ts-ignore - 型定義の不一致を無視
      await sendMessage({
        group_id: groupId,
        content: messageContent,
        message_type: 'text',
      });
      
      setContent('');
      onSent();
      
      // Focus back to textarea
      textareaRef.current?.focus();
} catch (error) {
// ユーザーにエラーを表示（簡易的にalert使用）
      alert('メッセージの送信に失敗しました。もう一度お試しください。');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border-t border-purple-200 p-4">
      <div className="flex items-end space-x-3">
        {/* スタンプボタン */}
        <button
          onClick={onStampClick}
          className="flex-shrink-0 p-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full hover:shadow-lg transition-all duration-200 hover:scale-105"
          title="スタンプ"
        >
          <span className="text-lg">😊</span>
        </button>

        {/* メッセージ入力 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            onFocus={(e) => e.target.classList.add('chat-input-focus')}
            onBlur={(e) => e.target.classList.remove('chat-input-focus')}
            placeholder="メッセージを入力..."
            className="w-full p-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
            rows={1}
            maxLength={1000}
            disabled={sending}
          />
          
          {/* 文字数カウンター */}
          <div className="absolute bottom-1 right-12 text-xs text-gray-400">
            {content.length}/1000
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="flex-shrink-0 p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          title="送信"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>

      {/* 入力のヒント */}
      <div className="mt-2 text-xs text-gray-500">
        <span>Enter: 送信 / Shift+Enter: 改行</span>
      </div>
    </div>
  );
}