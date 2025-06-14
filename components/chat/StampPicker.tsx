'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Stamp } from '@/types/chat';
import { getStamps, createStamp, uploadStampImage } from '@/lib/supabase/stamps';
import { sendMessage } from '@/lib/supabase/messages';

interface StampPickerProps {
  groupId: string;
  onClose: () => void;
  onSent: () => void;
}

export default function StampPicker({ groupId, onClose, onSent }: StampPickerProps) {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'default' | 'custom' | 'categories'>('default');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadStamps();
  }, [groupId]);

  const loadStamps = async () => {
    try {
      setLoading(true);
      const stampsData = await getStamps();
      setStamps(stampsData);
    } catch (error) {
      // Silent error handling for stamp loading
    } finally {
      setLoading(false);
    }
  };

  const handleStampSend = async (stamp: Stamp) => {
    try {
      // @ts-ignore - 型定義の不一致を無視
      await sendMessage({
        group_id: groupId,
        message_type: 'stamp',
        stamp_id: stamp.id,
      });
      onSent();
    } catch (error) {
      // Silent error handling for stamp sending
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    try {
      setUploadingImage(true);
      
      // 画像をアップロード
      const imageUrl = await uploadStampImage(file, 'custom');
      
      // カスタムスタンプを作成
      const newStamp = await createStamp({
        name: file.name.split('.')[0],
        image_url: imageUrl,
        category: 'custom',
      });

      // スタンプリストを更新
      setStamps(prev => [...prev, newStamp]);
      
      // 即座に送信
      await handleStampSend(newStamp);
    } catch (error) {
      alert('スタンプのアップロードに失敗しました')
    } finally {
      setUploadingImage(false);
    }
  };

  const defaultStamps = stamps.filter(stamp => !stamp.is_custom);
  const customStamps = stamps.filter(stamp => stamp.is_custom);
  
  const getCategoryStamps = (category: string) => {
    if (category === 'all') return defaultStamps;
    return defaultStamps.filter(stamp => stamp.category === category);
  };

  const filteredStamps = activeTab === 'default' ? getCategoryStamps(selectedCategory) : customStamps;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[70vh] flex flex-col stamp-picker-enter">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">スタンプを選択</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b">
          <button
            onClick={() => {
              setActiveTab('default');
              setSelectedCategory('all');
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'default'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            デフォルト
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'custom'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            カスタム
          </button>
        </div>

        {/* カテゴリフィルター (デフォルトタブのみ) */}
        {activeTab === 'default' && (
          <div className="px-4 py-2 border-b bg-gray-50">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 text-xs rounded-full ${
                  selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setSelectedCategory('emotions')}
                className={`px-3 py-1 text-xs rounded-full ${
                  selectedCategory === 'emotions'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                感情 😊
              </button>
              <button
                onClick={() => setSelectedCategory('gestures')}
                className={`px-3 py-1 text-xs rounded-full ${
                  selectedCategory === 'gestures'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                ジェスチャー 👋
              </button>
              <button
                onClick={() => setSelectedCategory('objects')}
                className={`px-3 py-1 text-xs rounded-full ${
                  selectedCategory === 'objects'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                物 ☕
              </button>
              <button
                onClick={() => setSelectedCategory('nature')}
                className={`px-3 py-1 text-xs rounded-full ${
                  selectedCategory === 'nature'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                自然 ✨
              </button>
              <button
                onClick={() => setSelectedCategory('symbols')}
                className={`px-3 py-1 text-xs rounded-full ${
                  selectedCategory === 'symbols'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                記号 🔥
              </button>
              <button
                onClick={() => setSelectedCategory('special')}
                className={`px-3 py-1 text-xs rounded-full ${
                  selectedCategory === 'special'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                特別 👑
              </button>
            </div>
          </div>
        )}

        {/* スタンプグリッド */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {filteredStamps.map((stamp) => (
                <button
                  key={stamp.id}
                  onClick={() => handleStampSend(stamp)}
                  className="aspect-square flex items-center justify-center hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 overflow-hidden"
                  title={stamp.name}
                >
                  {stamp.image_url ? (
                    <Image
                      src={stamp.image_url}
                      alt={stamp.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <span className="text-3xl">{stamp.emoji}</span>
                  )}
                </button>
              ))}

              {/* カスタムタブでアップロードボタンを表示 */}
              {activeTab === 'custom' && (
                <label className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer hover:bg-gray-50">
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl mb-1 text-gray-400">+</div>
                      <div className="text-xs text-gray-500">追加</div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>
          )}

          {/* 空の状態 */}
          {!loading && activeTab === 'custom' && customStamps.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎨</div>
              <p className="text-gray-500 mb-2">カスタムスタンプがありません</p>
              <p className="text-gray-400 text-sm">画像をアップロードして独自のスタンプを作成しましょう</p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              カスタムスタンプは5MB以下の画像ファイルをアップロードできます
            </p>
            {activeTab === 'custom' && customStamps.length > 0 && (
              <button
                onClick={() => {
                  // スタンプ管理画面を開く (親コンポーネントで実装)
                  // TODO: Implement stamp management
                }}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                管理
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}