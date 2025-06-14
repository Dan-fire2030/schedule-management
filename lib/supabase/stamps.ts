import { createClient } from '@/lib/supabase/client';
import { Stamp, CreateStampParams } from '@/types/chat';

export async function getStamps(category?: string): Promise<Stamp[]> {
  const supabase = createClient()
  let query = supabase
    .from('stamps')
    .select('*')
    .order('created_at', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  // @ts-ignore - 型定義の不一致を無視
  const { data, error } = await query;

  if (error) {
throw error;
  }

  return data || [];
}

export async function createStamp(params: CreateStampParams): Promise<Stamp> {
  const supabase = createClient()
  // @ts-ignore - 型定義の不一致を無視
  const { data, error } = await supabase
    .from('stamps')
    .insert({
      name: params.name,
      image_url: params.image_url,
      category: params.category || 'custom',
      is_default: false,
    })
    .select()
    .single();

  if (error) {
throw error;
  }

  return data;
}

export async function updateStamp(stampId: string, params: Partial<CreateStampParams>): Promise<Stamp> {
  const supabase = createClient()
  // @ts-ignore - 型定義の不一致を無視
  const { data, error } = await supabase
    .from('stamps')
    .update({
      name: params.name,
      image_url: params.image_url,
      category: params.category,
    })
    .eq('id', stampId)
    .select()
    .single();

  if (error) {
throw error;
  }

  return data;
}

export async function deleteStamp(stampId: string): Promise<void> {
  const supabase = createClient()
  // @ts-ignore - 型定義の不一致を無視
  const { error } = await supabase
    .from('stamps')
    .delete()
    .eq('id', stampId);

  if (error) {
throw error;
  }
}

export async function sendStamp(groupId: string, stampId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('messages')
    .insert({
      group_id: groupId,
      content: '',
      stamp_id: stampId,
      type: 'stamp'
    });

  if (error) {
throw error;
  }
}

export async function uploadStampImage(file: File, category: string = 'custom'): Promise<string> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `stamps/${category}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('stamp-images')
    .upload(filePath, file);

  if (uploadError) {
throw uploadError;
  }

  const { data } = supabase.storage
    .from('stamp-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}