import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, MessageCircle, Users, ArrowLeft, Loader2, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSocket } from "../contexts/SocketContext";

export default function ChatDrawer({ open, onClose, user }) {
  const { t } = useTranslation();
  const socketCtx = useSocket();

  const [tab, setTab] = useState("messages");
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [teacherClassFilter, setTeacherClassFilter] = useState(null);
  const [teacherSubject, setTeacherSubject] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (user?.dbRole === 'enseignant' && socketCtx?.connected) {
      socketCtx.refreshTeacherClasses();
    }
  }, [user?.dbRole, socketCtx?.connected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socketCtx?.socket) return;
    const onMsg = (msg) => {
      const selId = selectedUser ? getOtherId(selectedUser) : null;
      if (selId && (msg.sender_id === selId || msg.receiver_id === selId)) {
        setMessages(prev => [...prev, msg]);
      }
    };
    const onTyping = (data) => {
      const selId = selectedUser ? getOtherId(selectedUser) : null;
      if (data.userId === selId) setTypingUser(data);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(null), 2000);
    };
    const onStopTyping = () => setTypingUser(null);
    socketCtx.socket.on('new_message', onMsg);
    socketCtx.socket.on('typing', onTyping);
    socketCtx.socket.on('stop_typing', onStopTyping);
    return () => {
      socketCtx.socket.off('new_message', onMsg);
      socketCtx.socket.off('typing', onTyping);
      socketCtx.socket.off('stop_typing', onStopTyping);
    };
  }, [socketCtx?.socket, selectedUser]);

  const getOtherId = (u) => u.other_id || u.id;

  const openConversation = async (other) => {
    setSelectedUser(other);
    const otherId = getOtherId(other);
    const msgs = await socketCtx.loadConversation(otherId);
    setMessages(msgs || []);
    const unreadIds = (msgs || []).filter(m => m.sender_id === otherId && !m.read_at).map(m => m.id);
    if (unreadIds.length) socketCtx.markAsRead(unreadIds);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedUser) return;
    const otherId = getOtherId(selectedUser);
    const msg = await socketCtx.sendMessage({
      receiver_id: otherId,
      message: input.trim(),
    });
    if (msg) setMessages(prev => [...prev, msg]);
    setInput("");
    socketCtx.stopTyping(otherId);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (selectedUser) {
      const otherId = getOtherId(selectedUser);
      socketCtx.typing(otherId);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => socketCtx.stopTyping(otherId), 1000);
    }
  };

  const handleSendClassFeed = async () => {
    if (!input.trim()) return;
    const isTeacher = user?.dbRole === 'enseignant';
    if (isTeacher && !teacherClassFilter) return;
    await socketCtx.sendMessage({
      niveau: isTeacher ? teacherClassFilter.niveau : user?.niveau,
      class_id: isTeacher ? teacherClassFilter.classe : user?.classe,
      communaute: true,
      message: input.trim(),
    });
    setInput("");
    if (isTeacher && teacherClassFilter) {
      socketCtx.refreshClassFeed(teacherClassFilter.niveau, teacherClassFilter.classe);
    } else {
      socketCtx.refreshClassFeed();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            {selectedUser && (
              <button onClick={() => { setSelectedUser(null); setMessages([]); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={18} />
              </button>
            )}
            <MessageCircle size={20} className="text-blue-600" />
            <h2 className="font-bold text-gray-900">{t('chat.title')}</h2>
          </div>
          <div className="flex items-center gap-2">
            {!selectedUser && (
              <button onClick={() => setShowNew(!showNew)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors">
                {t('chat.newMessage')}
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
          </div>
        </div>

        {!selectedUser && (
          <div className="flex border-b border-gray-200">
            <button onClick={() => setTab("messages")}
              className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${tab === "messages" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
              💬 {t('chat.privateMessages')}
            </button>
            {(user?.dbRole === 'eleve' || user?.dbRole === 'enseignant') && (
              <button onClick={() => setTab("class")}
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${tab === "class" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                👥 {t('chat.classFeed')}
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {selectedUser ? (
            <div className="flex flex-col h-full">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="font-semibold text-gray-900">{selectedUser.prenom} {selectedUser.nom}</p>
                {selectedUser.subject && <p className="text-xs text-gray-500">{selectedUser.subject}</p>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={msg.id || i} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.sender_id === user?.id ? "bg-blue-600 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}>
                      <p>{msg.message}</p>
                      <div className={`flex items-center gap-1 mt-1 ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                        <span className={`text-[10px] ${msg.sender_id === user?.id ? "text-blue-200" : "text-gray-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender_id === user?.id && (
                          <CheckCheck size={12} className={msg.read_at ? "text-blue-300" : "text-gray-400"} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {typingUser && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm text-gray-500 italic">
                      {t('chat.typing')}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <input value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
                    placeholder={t('chat.placeholder')}
                    className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleSend} disabled={!input.trim()}
                    className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : tab === "messages" ? (
            <div className="p-3 space-y-1">
              {socketCtx?.conversations?.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">{t('chat.noConversations')}</div>
              )}
              {socketCtx?.conversations?.map((c, i) => (
                <div key={c.other_id || i} onClick={() => openConversation(c)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {c.initiales || `${c.prenom?.[0] || ''}${c.nom?.[0] || ''}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-gray-900 truncate">{c.prenom} {c.nom}</p>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate">{c.message}</p>
                      {c.read_at === null && c.sender_id !== user?.id && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 ml-1" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {showNew && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    {user?.dbRole === 'eleve' ? t('chat.selectTeacher') : t('chat.selectStudent')}
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {user?.dbRole === 'eleve' && socketCtx?.teachers?.map(t => (
                      <button key={t.id} onClick={() => { openConversation(t); setShowNew(false); }}
                        className="w-full text-left p-2 rounded-lg hover:bg-white text-sm text-gray-700 transition-colors">
                        {t.prenom} {t.nom} <span className="text-gray-400">({t.subject})</span>
                      </button>
                    ))}
                    {user?.dbRole === 'enseignant' && (
                      <>
                        {!teacherClassFilter ? (
                          <div className="space-y-1">
                            {socketCtx?.teacherClasses?.map((c, i) => (
                              <button key={i} onClick={() => { setTeacherClassFilter(c); setTeacherSubject(c.subject); socketCtx.loadStudents(c.niveau, c.classe); }}
                                className="w-full text-left p-2 rounded-lg hover:bg-white text-sm text-gray-700 transition-colors">
                                {c.niveau} {c.classe} <span className="text-gray-400">({c.subject})</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <button onClick={() => { setTeacherClassFilter(null); setTeacherSubject(""); }}
                              className="text-xs text-blue-600 hover:text-blue-800 mb-2">
                              ← {t('common.back')}
                            </button>
                            <p className="text-xs text-gray-500 mb-2">{teacherClassFilter.niveau} {teacherClassFilter.classe} — {teacherSubject}</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {socketCtx?.students?.map(s => (
                                <button key={s.id} onClick={() => { openConversation({ ...s, id: s.user_id }); setShowNew(false); }}
                                  className="w-full text-left p-2 rounded-lg hover:bg-white text-sm text-gray-700 transition-colors">
                                  {s.prenom} {s.nom}
                                </button>
                              ))}
                              {(!socketCtx?.students || socketCtx.students.length === 0) && (
                                <p className="text-xs text-gray-400">Aucun élève lié dans cette classe</p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {user?.dbRole === 'enseignant' && (
                <div className="flex gap-2 mb-2">
                  {!teacherClassFilter ? (
                    <div className="flex flex-wrap gap-1">
                      {socketCtx?.teacherClasses?.map((c, i) => (
                        <button key={i} onClick={() => { setTeacherClassFilter(c); setTeacherSubject(c.subject); socketCtx.refreshClassFeed(c.niveau, c.classe); }}
                          className="px-2 py-1 text-xs rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 transition-colors">
                          {c.niveau} {c.classe}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <button onClick={() => { setTeacherClassFilter(null); setTeacherSubject(""); }}
                        className="text-xs text-blue-600 hover:text-blue-800">←</button>
                      <span className="text-xs font-semibold text-gray-700">{teacherClassFilter.niveau} {teacherClassFilter.classe} — {teacherSubject}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendClassFeed(); }}}
                  placeholder={t('chat.placeholder')}
                  className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={handleSendClassFeed} disabled={!input.trim() || (user?.dbRole === 'enseignant' && !teacherClassFilter)}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <Send size={18} />
                </button>
              </div>
              {socketCtx?.classFeed?.map(msg => (
                <div key={msg.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                      {msg.sender_prenom?.[0] || ''}{msg.sender_nom?.[0] || ''}
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{msg.sender_prenom} {msg.sender_nom}</p>
                    <span className="text-[10px] text-gray-400 ml-auto">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-9">{msg.message}</p>
                </div>
              ))}
              {(!socketCtx?.classFeed || socketCtx.classFeed.length === 0) && (
                <div className="text-center py-8 text-gray-400 text-sm">{t('chat.noConversations')}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
