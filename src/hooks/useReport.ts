import { Alert, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createReport } from '../services/reports';
import type { ReportContentType, ReportReason } from '../types';

interface ReportTarget {
  contentType: ReportContentType;
  contentId?: string;
  reportedUserId: string;
}

export function useReport() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const submitReport = async (target: ReportTarget, reason: ReportReason, details?: string) => {
    if (!profile) return;
    try {
      await createReport({
        reporterId: profile.id,
        reportedUserId: target.reportedUserId,
        contentType: target.contentType,
        contentId: target.contentId,
        reason,
        details,
      });
      showToast({ message: 'Report submitted' });
    } catch (err: any) {
      if (err?.code === '23505') {
        showToast({ message: 'You already reported this', type: 'error' });
      } else {
        showToast({ message: 'Failed to submit report', type: 'error' });
      }
    }
  };

  const showReportAlert = (target: ReportTarget) => {
    Alert.alert('Report', 'Why are you reporting this?', [
      {
        text: 'Spam',
        onPress: () => submitReport(target, 'spam'),
      },
      {
        text: 'Inappropriate',
        onPress: () => submitReport(target, 'inappropriate'),
      },
      {
        text: 'Harassment',
        onPress: () => submitReport(target, 'harassment'),
      },
      {
        text: 'Other',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Alert.prompt(
              'Report',
              'Please provide details (optional)',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Submit',
                  onPress: (text?: string) => submitReport(target, 'other', text || undefined),
                },
              ],
              'plain-text',
            );
          } else {
            submitReport(target, 'other');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return { showReportAlert };
}
