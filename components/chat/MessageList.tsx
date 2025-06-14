'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export default function MessageList({
  messages,
  currentUserId,
  onLoadMore,
  hasMore,
  loading,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <div ref={scrollRef} className="p-4 space-y-4">
      {/* Load more sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="h-1 flex items-center justify-center">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          )}
        </div>
      )}

      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const isFirstInGroup = !prevMessage || 
          prevMessage.user_id !== message.user_id ||
          new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000; // 5分

        return (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={message.user_id === currentUserId}
            isFirstInGroup={isFirstInGroup}
          />
        );
      })}

      {messages.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-gray-500">まだメッセージがありません</p>
          <p className="text-gray-400 text-sm">最初のメッセージを送信してみましょう！</p>
        </div>
      )}
    </div>
  );
}