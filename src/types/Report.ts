export type ReportReason = 'spam' | 'inappropriate' | 'harassment' | 'other';

export type ReportContentType = 'post' | 'user' | 'comment';

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  contentType: ReportContentType;
  contentId?: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}
