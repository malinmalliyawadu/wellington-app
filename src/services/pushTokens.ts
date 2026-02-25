import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

export async function registerPushToken(userId: string, token: string): Promise<void> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform },
      { onConflict: 'user_id,token' }
    );

  if (error) {
    console.warn('Failed to register push token:', error);
  }
}

export async function removePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('token', token);

  if (error) {
    console.warn('Failed to remove push token:', error);
  }
}
