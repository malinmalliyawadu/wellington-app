-- Add UPDATE policy for push_tokens to allow upsert operations
CREATE POLICY "Users can update own push tokens"
  ON push_tokens FOR UPDATE USING (auth.uid() = user_id);
