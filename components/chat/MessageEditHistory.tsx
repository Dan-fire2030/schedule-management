'use client';

import { useState } from 'react';
import { Message } from '@/types/chat';

interface MessageEditHistoryProps {
  message: Message;
  onClose: () => void;
}

export default function MessageEditHistory({ message, onClose }: MessageEditHistoryProps) {
  if (!message.edited_at) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">編集履歴</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 現在のメッセージ */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-600">現在</span>
              <span className="text-xs text-gray-500">
                {new Date(message.edited_at || message.created_at).toLocaleString('ja-JP')}
              </span>
            </div>
            <p className="text-gray-800">{message.content}</p>
          </div>

          {/* 編集前の状態 */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">編集前</span>
              <span className="text-xs text-gray-500">
                {new Date(message.created_at).toLocaleString('ja-JP')}
              </span>
            </div>
            <p className="text-gray-600 italic">
              編集履歴の詳細データは現在利用できません
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            編集されたメッセージは「(編集済み)」マークが表示されます
          </p>
        </div>
      </div>
    </div>
  );
}