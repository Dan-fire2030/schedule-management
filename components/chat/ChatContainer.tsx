'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, ChatState } from '@/types/chat';
import { getMessages, subscribeToMessages } from '@/lib/supabase/messages';
import { useAuthSimplified } from '@/hooks/useAuthSimplified';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import StampPicker from './StampPicker';
import TypingIndicator from './TypingIndicator';

interface ChatContainerProps {
  groupId: string;
  groupName?: string;
  groupTheme?: string;
}

export default function ChatContainer({ groupId, groupName, groupTheme }: ChatContainerProps) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    loading: true,
    error: null,
    hasMore: true,
  });
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'failed' | 'polling'>('connecting');
  const { user } = useAuthSimplified();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
setChatState(prev => ({ ...prev, loading: true, error: null }));
      // @ts-ignore - 型定義の不一致を無視
      const messages = await getMessages(groupId);
setChatState(prev => ({
        ...prev,
        messages: messages.reverse(), // 古い順に表示
        loading: false,
      }));
      scrollToBottom();
    } catch (error) {
setChatState(prev => ({
        ...prev,
        loading: false,
        error: 'メッセージの読み込みに失敗しました',
      }));
    }
  }, [groupId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!groupId) return;

    let unsubscribe: (() => void) | null = null;
    let isCancelled = false;

    const setupSubscription = async () => {
      try {
// @ts-ignore - 型定義の不一致を無視
        unsubscribe = await subscribeToMessages(groupId, (newMessage) => {
          if (!isCancelled) {
setChatState(prev => {
              // 重複チェック：既に同じIDのメッセージが存在しないかチェック
              const messageExists = prev.messages.some(msg => msg.id === newMessage.id);
              if (messageExists) {
return prev;
              }
              
              // 新しいメッセージを配列の最後に追加（時系列順）
              const updatedMessages = [...prev.messages, newMessage];
return {
                ...prev,
                messages: updatedMessages,
                error: null // リアルタイム接続成功時はエラーをクリア
              };
            });
            
            // 少し遅延を入れてからスクロール（DOM更新を待つため）
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          }
        });
        
        if (!isCancelled) {
setRealtimeStatus('connected');
          // 接続成功時はエラーをクリア
          setChatState(prev => ({
            ...prev,
            error: null
          }));
        }
      } catch (error) {
        if (!isCancelled) {
setRealtimeStatus('polling');
          
          // リアルタイム接続に失敗した場合は警告表示（エラーではなく）
          setChatState(prev => ({
            ...prev,
            error: null // エラー表示はしない
          }));
          
          // フォールバック: 定期的にメッセージを再読み込み（頻度を下げる）
          const pollInterval = setInterval(() => {
            if (!isCancelled) {
// ポーリング時は無音でメッセージを取得
              // @ts-ignore - 型定義の不一致を無視
              getMessages(groupId).then(messages => {
                setChatState(prev => {
                  const newMessages = messages.reverse();
                  // 新しいメッセージがある場合のみ更新
                  if (newMessages.length !== prev.messages.length) {
                    return {
                      ...prev,
                      messages: newMessages,
                    };
                  }
                  return prev;
                });
              }).catch(err => {
});
            }
          }, 5000); // 5秒ごとにポーリング（頻度を下げる）
          
          // クリーンアップ関数を更新
          unsubscribe = () => {
            clearInterval(pollInterval);
          };
        }
      }
    };

    setupSubscription();

    return () => {
      isCancelled = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [groupId, loadMessages]);

  const loadMoreMessages = async () => {
    if (!chatState.hasMore || chatState.loading) return;

    try {
      const offset = chatState.messages.length;
      const newMessages = await getMessages(groupId, 20, offset);
      
      if (newMessages.length === 0) {
        setChatState(prev => ({ ...prev, hasMore: false }));
        return;
      }

      setChatState(prev => ({
        ...prev,
        messages: [...newMessages.reverse(), ...prev.messages],
      }));
    } catch (error) {
}
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOptimisticMessage = (message: any) => {
setChatState(prev => {
      // 重複チェック
      const messageExists = prev.messages.some(msg => msg.id === message.id);
      if (messageExists) {
        return prev;
      }
      
      return {
        ...prev,
        messages: [...prev.messages, message],
      };
    });
    
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  const handleMessageSent = () => {
    // リアルタイムでメッセージが反映されるので、再読み込みは不要
};

  if (chatState.loading && chatState.messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">メッセージを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (chatState.error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{chatState.error}</p>
          <button
            onClick={loadMessages}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 to-blue-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">チャット</h2>
          <div className="flex items-center space-x-2">
            {realtimeStatus === 'connected' && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">リアルタイム</span>
              </>
            )}
            {realtimeStatus === 'polling' && (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">ポーリング</span>
              </>
            )}
            {realtimeStatus === 'connecting' && (
              <>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">接続中</span>
              </>
            )}
            {realtimeStatus === 'failed' && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">オフライン</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* メッセージリスト */}
      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={chatState.messages}
          currentUserId={user?.id}
          onLoadMore={loadMoreMessages}
          hasMore={chatState.hasMore}
          loading={chatState.loading}
        />
        <div ref={messagesEndRef} />
        <TypingIndicator typingUsers={typingUsers} />
      </div>

      {/* スタンプピッカー */}
      {showStampPicker && (
        <StampPicker
          groupId={groupId}
          onClose={() => setShowStampPicker(false)}
          onSent={() => {
            setShowStampPicker(false);
          }}
        />
      )}

      {/* メッセージ入力 */}
      <MessageInput
        groupId={groupId}
        onSent={handleMessageSent}
        onStampClick={() => setShowStampPicker(true)}
        onOptimisticMessage={handleOptimisticMessage}
      />
    </div>
  );
}