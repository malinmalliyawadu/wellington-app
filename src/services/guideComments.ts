import { supabase } from '../lib/supabase';

export interface GuideComment {
  id: string;
  guideId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export async function getGuideComments(guideId: string): Promise<GuideComment[]> {
  const { data, error } = await supabase
    .from('guide_comments')
    .select('*')
    .eq('guide_id', guideId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    guideId: row.guide_id,
    userId: row.user_id,
    text: row.text,
    createdAt: row.created_at,
  }));
}

export async function createGuideComment(comment: {
  guideId: string;
  userId: string;
  text: string;
}): Promise<GuideComment> {
  const { data, error } = await supabase
    .from('guide_comments')
    .insert({
      guide_id: comment.guideId,
      user_id: comment.userId,
      text: comment.text,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    guideId: data.guide_id,
    userId: data.user_id,
    text: data.text,
    createdAt: data.created_at,
  };
}

export async function updateGuideComment(id: string, text: string): Promise<void> {
  const { error } = await supabase
    .from('guide_comments')
    .update({ text })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteGuideComment(id: string): Promise<void> {
  const { error } = await supabase
    .from('guide_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
