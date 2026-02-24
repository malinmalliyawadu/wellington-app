import { supabase } from '../lib/supabase';
import type { ReportContentType, ReportReason } from '../types';

export async function createReport(params: {
  reporterId: string;
  reportedUserId: string;
  contentType: ReportContentType;
  contentId?: string;
  reason: ReportReason;
  details?: string;
}): Promise<void> {
  const { error } = await supabase.from('reports' as any).insert({
    reporter_id: params.reporterId,
    reported_user_id: params.reportedUserId,
    content_type: params.contentType,
    content_id: params.contentId ?? null,
    reason: params.reason,
    details: params.details ?? null,
  });

  if (error) throw error;
}
