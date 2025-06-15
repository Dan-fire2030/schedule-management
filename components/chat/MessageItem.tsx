'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Message } from '@/types/chat';
import { updateMessage, deleteMessage, markMessageAsRead } from '@/lib/supabase/messages';
import { useAuthSimplified } from '@/hooks/useAuthSimplified';
import MessageReadStatus from './MessageReadStatus';
import MessageEditHistory from './MessageEditHistory';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  isFirstInGroup: boolean;
}

export default function MessageItem({ message, isOwn, isFirstInGroup }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const { user } = useAuthSimplified();

  const handleEdit = async () => {
    if (!editContent.trim()) return;

    try {
      await updateMessage({ id: message.id, content: editContent });
      setIsEditing(false);
    } catch (error) {
}
  };

  const handleDelete = async () => {
    if (!confirm('このメッセージを削除しますか？')) return;

    try {
      setIsDeleting(true);
      await deleteMessage(message.id);
    } catch (error) {
setIsDeleting(false);
    }
  };

  const handleMarkAsRead = async () => {
    if (!isOwn && user?.id) {
      try {
        await markMessageAsRead(message.id);
      } catch (error) {
}
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleEdit();
              }
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditContent(message.content || '');
              }
            }}
            autoFocus
          />
          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              保存
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(message.content || '');
              }}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
            >
              キャンセル
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {message.edited_at && (
          <button
            onClick={() => setShowEditHistory(true)}
            className="text-xs text-gray-400 mt-1 hover:text-gray-600 hover:underline"
          >
            (編集済み)
          </button>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} message-enter`}
      onClick={handleMarkAsRead}
    >
      <div className={`max-w-xs md:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* ユーザー名と時刻 */}
        {isFirstInGroup && (
          <div className={`flex items-center space-x-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {!isOwn && (
              <span className="text-sm font-medium text-gray-700">
                {message.user?.username}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {formatTime(message.created_at)}
            </span>
          </div>
        )}

        {/* メッセージバブル */}
        <div
          className={`relative px-4 py-2 rounded-2xl shadow-sm message-bubble ${
            isOwn
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'bg-white text-gray-800 border border-gray-200'
          } ${isDeleting ? 'opacity-50' : ''}`}
        >
          {renderContent()}

          {/* アクションメニュー */}
          <div className={`absolute top-0 ${isOwn ? 'left-0 transform -translate-x-full' : 'right-0 transform translate-x-full'} 
                          opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 bg-white rounded-lg shadow-lg border p-1`}>
            {isOwn && message.message_type === 'text' && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-500 hover:text-green-600 text-xs"
                title="編集"
              >
                ✏️
              </button>
            )}
            {isOwn && (
              <button
                onClick={handleDelete}
                className="p-1 text-gray-500 hover:text-red-600 text-xs"
                title="削除"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* 既読表示 */}
        <MessageReadStatus message={message} isOwn={isOwn} />
      </div>

      {/* 編集履歴モーダル */}
      {showEditHistory && (
        <MessageEditHistory
          message={message}
          onClose={() => setShowEditHistory(false)}
        />
      )}
    </div>
  );
}