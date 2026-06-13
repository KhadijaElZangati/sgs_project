import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, FileEdit, Loader2, Calendar, FileText, GraduationCap, User, Video, Eye, Download, MessageSquare, StickyNote } from "lucide-react";
import { useTranslation } from "react-i18next";

import DOMPurify from "dompurify";


const TABS = [
  { key: "courses", icon: BookOpen },
  { key: "exercises", icon: FileEdit },
];

export default function StudentModule({ api }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { subject } = useParams();
  const [tab, setTab] = useState("courses");
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [postingNote, setPostingNote] = useState(false);


  useEffect(() => {
    api.get("/student/profile").then(res => setProfile(res.data)).catch(() => {});
  }, [api]);

  useEffect(() => {
    if (subject) return;
    setSubjectsLoading(true);
    api.get("/student/subjects").then(res => setSubjects(res.data || [])).catch(() => {}).finally(() => setSubjectsLoading(false));
  }, [api, subject]);

  useEffect(() => {
    if (!profile || !subject) return;
    setLoading(true);
    setSelectedItem(null);
    const endpoint = tab === "courses" ? "/student/courses" : "/student/exercises";
    api.get(endpoint, { params: { subject } })
      .then(res => setItems(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, subject, profile, api]);

  useEffect(() => {
    if (!selectedItem) return;
    const payload = tab === "courses"
      ? { course_id: selectedItem.id }
      : { exercise_id: selectedItem.id };
    api.post('/progress/student/view', payload).catch(() => {});
  }, [selectedItem, tab, api]);

  useEffect(() => {
    if (!selectedItem) return;
    setCommentsLoading(true);
    api.get(`/comments/${tab === "courses" ? "course" : "exercise"}/${selectedItem.id}`)
      .then(res => setComments(res.data || []))
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [selectedItem, tab, api]);

  const handlePostComment = async () => {
    if (!commentInput.trim()) return;
    setPostingComment(true);
    try {
      const res = await api.post('/comments', {
        item_type: tab === "courses" ? "course" : "exercise",
        item_id: selectedItem.id,
        content: commentInput.trim(),
        is_note: false,
      });
      setComments(prev => [res.data, ...prev]);
      setCommentInput("");
    } catch {} finally { setPostingComment(false); }
  };

  const handlePostNote = async () => {
    if (!noteInput.trim()) return;
    setPostingNote(true);
    try {
      const res = await api.post('/comments', {
        item_type: tab === "courses" ? "course" : "exercise",
        item_id: selectedItem.id,
        content: noteInput.trim(),
        is_note: true,
      });
      setComments(prev => [res.data, ...prev]);
      setNoteInput("");
    } catch {} finally { setPostingNote(false); }
  };

  const handleDeleteComment = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  const handleBackToSubject = () => {
    setSelectedItem(null);
  };

  return (
    <div className="min-h-full bg-gray-50 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 px-6 py-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {subject && !selectedItem && (
                <button onClick={() => navigate('/student')} className="text-blue-300 hover:text-white text-sm flex items-center gap-1 mr-2 transition-colors">
                  ← {t('common.back')}
                </button>
              )}
              <GraduationCap size={16} className="text-blue-300" />
              <span className="text-blue-300 text-xs font-medium uppercase tracking-widest">{t('student.title')}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {profile?.prenom} {profile?.nom}
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              {profile?.niveau} · {t('class')} {profile?.classe}
              {subject && <span> · {subject}</span>}
            </p>
          </div>
          {subject && !selectedItem && (
            <div className="flex items-center gap-2">
              {TABS.map(({ key, icon: Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    tab === key ? "bg-white text-blue-900 shadow-sm" : "bg-white/10 text-white hover:bg-white/20"
                  }`}>
                  <Icon size={16} /> {t(`student.${key}`)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {selectedItem ? (
          <div>
            <button onClick={() => setSelectedItem(null)}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors">
              <Eye size={16} /> {t('student.backToList')}
            </button>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedItem.title}</h2>
                  {selectedItem.teacher_prenom && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <User size={14} />
                      <span>{selectedItem.teacher_prenom} {selectedItem.teacher_nom}</span>
                    </div>
                  )}
                </div>
              </div>
              {selectedItem.description && (
                <p className="text-gray-600 mb-4">{selectedItem.description}</p>
              )}
              {selectedItem.content && (
                <div className="prose prose-sm max-w-none mb-4"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedItem.content) }} />
              )}
              {selectedItem.video_url && <VideoPlayer url={selectedItem.video_url} />}
              <div className="flex items-center gap-3 text-sm text-gray-500 border-t border-gray-100 pt-4 mt-4">
                {selectedItem.due_date && (
                  <span className="flex items-center gap-1"><Calendar size={14} /> {t('student.dueDate')} {new Date(selectedItem.due_date).toLocaleDateString()}</span>
                )}
                {selectedItem.file_url && (
                  <a href={`http://localhost:5000${selectedItem.file_url}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline">
                    <FileText size={14} /> {t('student.file')}
                  </a>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-4">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600" />
                Commentaires
              </h3>

              <div className="flex gap-2 mb-4">
                <input value={commentInput} onChange={e => setCommentInput(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={handlePostComment} disabled={!commentInput.trim() || postingComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {postingComment ? <Loader2 size={16} className="animate-spin" /> : "Envoyer"}
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
                  placeholder="Écrire une note privée..."
                  className="flex-1 px-4 py-2.5 bg-amber-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 border border-amber-200" />
                <button onClick={handlePostNote} disabled={!noteInput.trim() || postingNote}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors">
                  {postingNote ? <Loader2 size={16} className="animate-spin" /> : "Note"}
                </button>
              </div>

              {commentsLoading ? (
                <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucun commentaire pour l'instant</p>
              ) : (
                <div className="space-y-3">
                  {comments.map(c => (
                    <div key={c.id} className={`p-3 rounded-xl ${c.is_note ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {c.is_note && <StickyNote size={14} className="text-amber-600" />}
                          <span className="text-sm font-semibold text-gray-800">{c.prenom} {c.nom}</span>
                          {c.is_note && <span className="text-[10px] text-amber-600 font-semibold uppercase">Note privée</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {c.user_id === profile?.user_id && (
                            <button onClick={() => handleDeleteComment(c.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : !subject ? (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('student.selectSubject')}</h2>
            {subjectsLoading ? (
              <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-16">
                <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">{t('sidebar.student')}</p>
                <p className="text-sm text-gray-400 mt-1">Aucune matière disponible pour votre classe</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map(s => (
                  <button key={s.subject} onClick={() => navigate(`/student/${encodeURIComponent(s.subject)}`)}
                    className="bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-3">
                      <BookOpen size={24} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{s.subject}</h3>
                    {s.teacher_prenom && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <User size={14} /> {s.teacher_prenom} {s.teacher_nom}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">{t(`student.no${tab === "courses" ? "Courses" : "Exercises"}`)}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(item => (
              <div key={item.id} onClick={() => setSelectedItem(item)}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    {tab === "courses" ? <BookOpen size={16} className="text-blue-600" /> : <FileEdit size={16} className="text-blue-600" />}
                  </div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                  <User size={12} />
                  <span>{item.teacher_prenom} {item.teacher_nom}</span>
                </div>
                {item.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {item.due_date && (
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(item.due_date).toLocaleDateString()}</span>
                  )}
                  {item.file_url && (
                    <span className="flex items-center gap-1 text-blue-600"><FileText size={12} /> {t('student.file')}</span>
                  )}
                  {item.video_url && (
                    <span className="flex items-center gap-1 text-purple-600"><Video size={12} /> Vidéo</span>
                  )}
                  {item.content && (
                    <span className="flex items-center gap-1 text-emerald-600"><Eye size={12} /> Contenu</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoPlayer({ url }) {
  const [error, setError] = useState(false);
  const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;

  if (error) {
    return (
      <div className="mb-4 rounded-xl p-6 text-center bg-red-50 border border-red-200">
        <p className="text-sm text-red-700 mb-2">Format vidéo non supporté par le navigateur</p>
        <a href={fullUrl} target="_blank" rel="noopener noreferrer" download
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
          <Download size={16} /> Télécharger la vidéo
        </a>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
      <video
        src={fullUrl}
        controls
        className="w-full h-full max-h-full max-w-full object-contain"
        onError={() => setError(true)}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
