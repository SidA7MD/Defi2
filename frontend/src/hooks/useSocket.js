import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socket';

export function useSocket(event, callback) {
  useEffect(() => {
    if (!event || !callback) return;

    socketService.on(event, callback);

    return () => {
      socketService.off(event, callback);
    };
  }, [event, callback]);
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    setNotifications((prev) => [{ id, ...notification, read: false }, ...prev]);
    return id;
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, addNotification, markRead, clearAll };
}
