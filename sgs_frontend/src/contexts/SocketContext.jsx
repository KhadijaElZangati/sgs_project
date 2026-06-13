import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children, user }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [teachers, setTeachers] = useState([]);
  const [classFeed, setClassFeed] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const conversationsRef = useRef(conversations);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!user?.id) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const s = io('http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('new_message', (msg) => {
      setConversations(prev => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const idx = prev.findIndex(c => c.other_id === otherId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], message: msg.message, created_at: msg.created_at, sender_id: msg.sender_id, read_at: msg.sender_id === user.id ? new Date().toISOString() : null };
          return updated;
        }
        return prev;
      });
      if (msg.sender_id !== user.id) {
        setUnreadCount(c => c + 1);
      }
    });

    s.on('connect_error', () => {});
    setSocket(s);

    return () => { s.close(); setSocket(null); setConnected(false); };
  }, [user?.id]);

  useEffect(() => {
    if (!socket || !connected) return;
    socket.emit('get_conversations', null, (data) => {
      setConversations(data || []);
      setUnreadCount(data ? data.filter(c => c.read_at === null && c.sender_id !== user?.id).length : 0);
    });

    if (user?.dbRole === 'eleve') {
      socket.emit('get_teachers', null, setTeachers);
      socket.emit('get_class_feed', null, setClassFeed);
    }
  }, [socket, connected, user?.id, user?.dbRole]);

  const sendMessage = useCallback((data) => {
    return new Promise((resolve) => {
      if (!socket?.connected) return resolve(null);
      socket.emit('send_message', data, resolve);
    });
  }, [socket]);

  const markAsRead = useCallback((messageIds) => {
    if (!socket?.connected) return;
    socket.emit('mark_read', { messageIds });
  }, [socket]);

  const loadConversation = useCallback((otherId) => {
    return new Promise((resolve) => {
      if (!socket?.connected) return resolve([]);
      socket.emit('get_conversation', { otherId }, resolve);
    });
  }, [socket]);

  const refreshClassFeed = useCallback((niveau, classe) => {
    if (!socket?.connected) return;
    socket.emit('get_class_feed', niveau && classe ? { niveau, classe } : null, setClassFeed);
  }, [socket]);

  const refreshTeachers = useCallback(() => {
    if (!socket?.connected) return;
    socket.emit('get_teachers', null, setTeachers);
  }, [socket]);

  const refreshTeacherClasses = useCallback(() => {
    if (!socket?.connected) return;
    socket.emit('get_teacher_classes', null, setTeacherClasses);
  }, [socket]);

  const loadStudents = useCallback((niveau, classe) => {
    return new Promise((resolve) => {
      if (!socket?.connected) return resolve([]);
      socket.emit('get_students', { niveau, classe }, (data) => {
        setStudents(data || []);
        resolve(data || []);
      });
    });
  }, [socket]);

  const typing = useCallback((receiverId) => {
    if (!socket?.connected) return;
    socket.emit('typing', { receiver_id: receiverId });
  }, [socket]);

  const stopTyping = useCallback((receiverId) => {
    if (!socket?.connected) return;
    socket.emit('stop_typing', { receiver_id: receiverId });
  }, [socket]);

  return (
    <SocketContext.Provider value={{
      socket, connected, conversations, unreadCount,
      teachers, classFeed, teacherClasses, students,
      sendMessage, markAsRead, loadConversation,
      refreshClassFeed, refreshTeachers,
      refreshTeacherClasses, loadStudents,
      typing, stopTyping,
      setConversations, setUnreadCount, setClassFeed,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
