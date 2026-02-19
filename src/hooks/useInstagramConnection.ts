import { useState, useEffect, useCallback } from 'react';
import {
  connectInstagram,
  disconnectInstagram,
  getInstagramConnection,
  refreshTokenIfNeeded,
} from '../services/instagram';
import type { InstagramConnection } from '../types/Instagram';

export function useInstagramConnection() {
  const [connection, setConnection] = useState<InstagramConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchConnection = useCallback(async () => {
    try {
      const conn = await getInstagramConnection();
      setConnection(conn);

      // Auto-refresh token if needed
      if (conn) {
        const expiresAt = new Date(conn.tokenExpiresAt).getTime();
        if (expiresAt < Date.now()) {
          // Token expired, clear connection display
          setConnection({ ...conn, accessToken: '' });
        } else {
          await refreshTokenIfNeeded();
        }
      }
    } catch (error) {
      console.error('Failed to fetch Instagram connection:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const conn = await connectInstagram();
      setConnection(conn);
      return conn;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectInstagram();
    setConnection(null);
  }, []);

  const isConnected = connection !== null && connection.accessToken !== '';
  const isExpired = connection !== null && connection.accessToken === '';

  return {
    connection,
    isConnected,
    isExpired,
    loading,
    connecting,
    connect,
    disconnect,
    refetch: fetchConnection,
  };
}
