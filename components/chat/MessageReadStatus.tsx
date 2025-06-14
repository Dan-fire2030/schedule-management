'use client';

import { useState } from 'react';
import { Message, MessageRead } from '@/types/chat';

interface MessageReadStatusProps {
  message: Message;
  isOwn: boolean;
  groupMemberCount?: number;
}

export default function MessageReadStatus({ message, isOwn, groupMemberCount = 0 }: MessageReadStatusProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOwn || !message.reads || message.reads.length === 0) {
    return null;
  }

  const readCount = message.reads.length;
  // 自分を除いたメンバー数から既読数を引いて未読数を計算
  const unreadCount = Math.max(0, groupMemberCount - 1 - readCount);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-xs text-gray-400 mt-1 hover:text-gray-600 transition-colors"
      >
        既読 {readCount}
        {unreadCount > 0 && ` / 未読 ${unreadCount}`}
      </button>

      {/* 既読詳細ポップアップ */}
      {showDetails && (
        <>
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          
          {/* ポップアップ */}
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-48 max-w-64">
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-800 mb-2">
                既読状況
              </h4>
              
              {message.reads.length === 0 ? (
                <p className="text-xs text-gray-500">まだ誰も読んでいません</p>
              ) : (
                <div className="space-y-2">
                  {message.reads.map((read) => (
                    <div key={read.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs">
                          {read.user?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">
                          {read.user?.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(read.read_at).toLocaleString('ja-JP', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 矢印 */}
            <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
          </div>
        </>
      )}
    </div>
  );
}