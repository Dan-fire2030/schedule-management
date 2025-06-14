'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Stamp } from '@/types/chat';
import { getStamps, deleteStamp, updateStamp } from '@/lib/supabase/stamps';
import { useAuthSimplified } from '@/hooks/useAuthSimplified';

interface StampManagerProps {
  groupId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function StampManager({ groupId, onClose, onUpdate }: StampManagerProps) {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStamp, setEditingStamp] = useState<Stamp | null>(null);
  const [editName, setEditName] = useState('');
  const { user } = useAuthSimplified();

  const loadStamps = useCallback(async () => {
    try {
      setLoading(true);
      const stampsData = await getStamps(groupId);
      setStamps(stampsData.filter(stamp => !stamp.is_default));
    } catch (error) {
} finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadStamps();
  }, [loadStamps]);

  const handleDelete = async (stampId: string) => {
    if (!confirm('このスタンプを削除しますか？')) return;

    try {
      await deleteStamp(stampId);
      setStamps(prev => prev.filter(stamp => stamp.id !== stampId));
      onUpdate();
    } catch (error) {
alert('スタンプの削除に失敗しました');
    }
  };

  const handleEdit = async () => {
    if (!editingStamp || !editName.trim()) return;

    try {
      const updatedStamp = await updateStamp(editingStamp.id, { name: editName });
      setStamps(prev => prev.map(stamp => 
        stamp.id === editingStamp.id ? updatedStamp : stamp
      ));
      setEditingStamp(null);
      setEditName('');
      onUpdate();
    } catch (error) {
alert('スタンプの更新に失敗しました');
    }
  };

  const startEdit = (stamp: Stamp) => {
    setEditingStamp(stamp);
    setEditName(stamp.name);
  };

  const cancelEdit = () => {
    setEditingStamp(null);
    setEditName('');
  };

  const canManageStamp = (stamp: Stamp) => {
    return stamp.created_by === user?.id;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">カスタムスタンプ管理</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : stamps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-gray-500 mb-2">カスタムスタンプがありません</p>
              <p className="text-gray-400 text-sm">
                スタンプピッカーから画像をアップロードして<br />
                独自のスタンプを作成しましょう
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stamps.map((stamp) => (
                <div
                  key={stamp.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {/* スタンプ表示 */}
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                    {stamp.image_url ? (
                      <Image
                        src={stamp.image_url}
                        alt={stamp.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{stamp.emoji}</span>
                    )}
                  </div>

                  {/* スタンプ情報 */}
                  <div className="flex-1">
                    {editingStamp?.id === stamp.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="スタンプ名"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleEdit}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            保存
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium text-gray-800">{stamp.name}</h4>
                        <p className="text-sm text-gray-500">
                          作成日: {new Date(stamp.created_at).toLocaleDateString('ja-JP')}
                        </p>
                        {stamp.created_by && (
                          <p className="text-xs text-gray-400">
                            作成者: {stamp.created_by === user?.id ? 'あなた' : '他のユーザー'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  {canManageStamp(stamp) && editingStamp?.id !== stamp.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(stamp)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="編集"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(stamp.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="削除"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>ヒント:</strong>
            </p>
            <ul className="space-y-1 text-xs">
              <li>• 自分が作成したスタンプのみ編集・削除できます</li>
              <li>• スタンプは5MB以下の画像ファイルでアップロードできます</li>
              <li>• グループメンバー全員がカスタムスタンプを使用できます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}