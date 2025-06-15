export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string | null;
  message_type: 'text';
  edited_at: string | null;
  created_at: string;
  
  // Join data
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  reads?: MessageRead[];
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
  
  // Join data
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

export interface SendMessageParams {
  group_id: string;
  content?: string | null;
  message_type: 'text';
}

export interface UpdateMessageParams {
  id: string;
  content: string;
}

export interface MessageWithReads extends Message {
  read_count: number;
  is_read_by_current_user: boolean;
}