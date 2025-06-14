'use client';

interface TypingIndicatorProps {
  typingUsers: string[];
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]}が入力中...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]}と${typingUsers[1]}が入力中...`;
    } else {
      return `${typingUsers.length}人が入力中...`;
    }
  };

  return (
    <div className="px-4 py-2">
      <div className="flex items-center space-x-2">
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
        <span className="text-sm text-gray-500">{getTypingText()}</span>
      </div>
    </div>
  );
}