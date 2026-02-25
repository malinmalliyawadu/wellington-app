import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { registerPushToken } from '../services/pushTokens';

// Suppress foreground notifications — we use in-app banners instead
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications() {
  const { session } = useAuth();
  const router = useRouter();
  const tokenRef = useRef<string | null>(null);

  // Register push token
  useEffect(() => {
    if (!session?.user?.id) return;

    async function register() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn('Missing EAS projectId for push notifications');
        return;
      }

      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        tokenRef.current = token;
        await registerPushToken(session!.user.id, token);
      } catch (e) {
        console.warn('Failed to get push token:', e);
      }
    }

    register();
  }, [session?.user?.id]);

  // Handle notification tap — navigate to the relevant screen
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (!data) return;

        if (data.postId) {
          router.push(`/feed/post/${data.postId}` as any);
        } else if (data.eventId) {
          router.push(`/events/${data.eventId}` as any);
        } else if (data.actorId) {
          router.push(`/feed/user/${data.actorId}` as any);
        }
      }
    );

    return () => subscription.remove();
  }, [router]);
}
