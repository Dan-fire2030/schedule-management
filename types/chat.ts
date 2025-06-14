export interface Stamp {
  id: string;
  name: string;
  image_url: string;
  category: string;
  created_by: string | null;
  is_default: boolean;
  is_custom?: boolean;
  emoji?: string;
  created_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string | null;
  message_type: 'text' | 'stamp';
  stamp_id: string | null;
  edited_at: string | null;
  created_at: string;
  
  // Join data
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  stamp?: Stamp;
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
  message_type: 'text' | 'stamp';
  stamp_id?: string | null;
}

export interface UpdateMessageParams {
  id: string;
  content: string;
}

export interface CreateStampParams {
  name: string;
  image_url: string;
  category?: string;
}

export interface MessageWithReads extends Message {
  read_count: number;
  is_read_by_current_user: boolean;
}