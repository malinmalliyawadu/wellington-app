import { supabase } from '../lib/supabase';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    text: row.text,
    createdAt: row.created_at,
  }));
}

export async function createComment(comment: {
  postId: string;
  userId: string;
  text: string;
}): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: comment.postId,
      user_id: comment.userId,
      text: comment.text,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    postId: data.post_id,
    userId: data.user_id,
    text: data.text,
    createdAt: data.created_at,
  };
}
