import { Alert, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useBlock } from '../context/BlockContext';
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
  const { toggleBlock, isBlocked } = useBlock();
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
      showToast({ message: 'Report submitted. We will review this within 24 hours.' });
    } catch (err: any) {
      if (err?.code === '23505') {
        showToast({ message: 'You already reported this', type: 'error' });
      } else {
        showToast({ message: 'Failed to submit report', type: 'error' });
      }
    }
  };

  const offerBlock = (target: ReportTarget) => {
    if (isBlocked(target.reportedUserId)) return;

    Alert.alert(
      'Block this user too?',
      'Blocking will hide all their content from your feed and prevent them from seeing yours.',
      [
        { text: 'No thanks', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => toggleBlock(target.reportedUserId),
        },
      ]
    );
  };

  const showReportAlert = (target: ReportTarget) => {
    Alert.alert('Report', 'Why are you reporting this?', [
      {
        text: 'Spam',
        onPress: () => {
          submitReport(target, 'spam');
          offerBlock(target);
        },
      },
      {
        text: 'Inappropriate',
        onPress: () => {
          submitReport(target, 'inappropriate');
          offerBlock(target);
        },
      },
      {
        text: 'Harassment',
        onPress: () => {
          submitReport(target, 'harassment');
          offerBlock(target);
        },
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
                  onPress: (text?: string) => {
                    submitReport(target, 'other', text || undefined);
                    offerBlock(target);
                  },
                },
              ],
              'plain-text',
            );
          } else {
            submitReport(target, 'other');
            offerBlock(target);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return { showReportAlert };
}
