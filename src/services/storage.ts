import { supabase } from '../lib/supabase';

const BUCKET = 'post-media';

export async function uploadMedia(
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const filePath = `${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw error;

  return getPublicUrl(filePath);
}

export function getPublicUrl(filePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
