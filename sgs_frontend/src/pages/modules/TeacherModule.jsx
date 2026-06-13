import { useState, useEffect, useRef, useMemo } from "react";
import { BookOpen, FileEdit, Plus, Pencil, Trash2, X, Loader2, Calendar, FileText, ChevronRight, ArrowLeft, GraduationCap, Upload, Video, Eye, CheckCircle2, XCircle, Users, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { pushToast } from "../../components/Notifications";

const TABS = [
  { key: "courses", icon: BookOpen },
  { key: "exercises", icon: FileEdit },
];

export default function TeacherModule({ user, api, hasPermission }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("courses");
  const [assignments, setAssignments] = useState([]);
  const [subject, setSubject] = useState(null);
  const [view, setView] = useState("niveaux");
  const [selectedNiveau, setSelectedNiveau] = useState(null);
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressItem, setProgressItem] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsItem, setCommentsItem] = useState(null);
  const [commentsData, setCommentsData] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const groups = useMemo(() => {
    const map = {};
    for (const a of assignments) {
      if (!map[a.niveau]) map[a.niveau] = [];
      map[a.niveau].push(a);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [assignments]);

  useEffect(() => {
    api.get("/teacher/assignments").then(res => {
      setAssignments(res.data.assignments || []);
      setSubject(res.data.subject);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClasse || !selectedNiveau) return;
    setLoading(true);
    const endpoint = tab === "courses" ? "/courses" : "/exercises";
    api.get(endpoint, { params: { niveau: selectedNiveau, classe: selectedClasse } })
      .then(res => { setItems(res.data.data || []); })
      .catch(() => { pushToast(t('errors.generic'), "error"); })
      .finally(() => setLoading(false));
  }, [tab, selectedNiveau, selectedClasse, api, t]);

  const handleNiveauClick = (niveau) => { setSelectedNiveau(niveau); setView("classes"); };
  const handleClasseClick = (classe) => { setSelectedClasse(classe); setView("content"); };
  const handleBack = () => {
    if (view === "classes") { setView("niveaux"); setSelectedNiveau(null); }
    else if (view === "content") { setView("classes"); setSelectedClasse(null); }
  };

  const handleSave = async (form) => {
    if (!selectedNiveau || !selectedClasse) return;
    setSaving(true);
    try {
      const payload = { ...form, subject: subject || selectedNiveau, niveau: selectedNiveau, classe: selectedClasse };
      if (editItem) {
        await api.put(`/${tab}/${editItem.id}`, payload);
        pushToast(t('teacher.saved'), "success");
      } else {
        await api.post(`/${tab}`, payload);
        pushToast(t('teacher.created'), "success");
      }
      setShowModal(false);
      setEditItem(null);
      const res = await api.get(`/${tab}`, { params: { niveau: selectedNiveau, classe: selectedClasse } });
      setItems(res.data.data || []);
    } catch (err) {
      pushToast(err.response?.data?.error || t('errors.generic'), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('teacher.confirmDelete'))) return;
    try {
      await api.delete(`/${tab}/${id}`);
      pushToast(t('teacher.deleted'), "success");
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      pushToast(err.response?.data?.error || t('errors.generic'), "error");
    }
  };

  const handleShowProgress = async (item) => {
    setProgressItem(item);
    setShowProgressModal(true);
    setProgressLoading(true);
    try {
      const endpoint = tab === "courses"
        ? `/progress/teacher/progress/${item.id}`
        : `/progress/teacher/progress/exercise/${item.id}`;
      const res = await api.get(endpoint);
      setProgressData(res.data);
    } catch {
      pushToast(t('errors.generic'), "error");
    } finally {
      setProgressLoading(false);
    }
  };

  const handleShowComments = async (item) => {
    setCommentsItem(item);
    setShowCommentsModal(true);
    setCommentsLoading(true);
    try {
      const itemType = tab === "courses" ? "course" : "exercise";
      const res = await api.get(`/comments/${itemType}/${item.id}`);
      setCommentsData(res.data || []);
    } catch {
      setCommentsData([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteTeacherComment = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setCommentsData(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  const classesForNiveau = useMemo(() => {
    if (!selectedNiveau) return [];
    const niveauGroups = groups.find(([n]) => n === selectedNiveau);
    return niveauGroups ? niveauGroups[1] : [];
  }, [selectedNiveau, groups]);

  return (
    <div className="min-h-full bg-gray-50 animate-fade-in">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('teacher.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{subject && `${t('teacher.mySubject')} : ${subject}`}</p>
          </div>
          <div className="flex gap-2">
            {TABS.map(({ key, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  tab === key ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                <Icon size={16} /> {t(`teacher.${key}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {view !== "niveaux" && (
          <button onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft size={16} /> {view === "classes" ? t('teacher.backToNiveaux') : t('teacher.backToClasses')}
          </button>
        )}

        {view === "niveaux" && (
          <>
            <p className="text-sm text-gray-500 mb-4">{t('teacher.selectNiveau')}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groups.map(([niveau, classes]) => (
                <button key={niveau} onClick={() => handleNiveauClick(niveau)}
                  className="bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-blue-300 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                    <GraduationCap size={24} className="text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{niveau}</h3>
                  <p className="text-sm text-gray-500">{classes.length} {t(classes.length > 1 ? 'teacher.classes' : 'teacher.classe')}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {view === "classes" && (
          <>
            <p className="text-sm text-gray-500 mb-4">{selectedNiveau}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classesForNiveau.map(a => (
                <button key={a.id} onClick={() => handleClasseClick(a.classe)}
                  className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between hover:border-blue-300 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <BookOpen size={20} className="text-blue-600" />
                    </div>
                    <span className="text-base font-semibold text-gray-800">{t('class')} {a.classe}</span>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
              ))}
            </div>
          </>
        )}

        {view === "content" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedNiveau} · {t('class')} {selectedClasse}
              </h2>
              <button onClick={() => { setEditItem(null); setShowModal(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm">
                <Plus size={16} /> {t(`teacher.new${tab === "courses" ? "Course" : "Exercise"}`)}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">{t(`teacher.no${tab === "courses" ? "Courses" : "Exercises"}`)}</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(item => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          {tab === "courses" ? <BookOpen size={16} className="text-blue-600" /> : <FileEdit size={16} className="text-blue-600" />}
                        </div>
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditItem(item); setShowModal(true); }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleShowProgress(item)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleShowComments(item)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors">
                          <MessageSquare size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {item.status === 'draft' && (
                        <span className="inline-flex px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded">{t('teacher.draft')}</span>
                      )}
                      {item.status === 'published' && (
                        <span className="inline-flex px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded">{t('teacher.published')}</span>
                      )}
                    </div>
                    {item.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {item.due_date && (
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(item.due_date).toLocaleDateString()}</span>
                      )}
                      {item.file_url && (
                        <a href={`http://localhost:5000${item.file_url}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline">
                          <FileText size={12} /> {t('teacher.file')}
                        </a>
                      )}
                      {item.video_url && (
                        <a href={item.video_url.startsWith('http') ? item.video_url : `http://localhost:5000${item.video_url}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-purple-600 hover:underline">
                          <Video size={12} /> Vidéo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <EditorModal
          api={api}
          tab={tab}
          editItem={editItem}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          t={t}
        />
      )}
      {showProgressModal && (
        <ProgressModal
          item={progressItem}
          data={progressData}
          loading={progressLoading}
          tab={tab}
          onClose={() => { setShowProgressModal(false); setProgressItem(null); setProgressData(null); }}
          t={t}
        />
      )}
      {showCommentsModal && (
        <CommentsModal
          item={commentsItem}
          comments={commentsData}
          loading={commentsLoading}
          onDelete={handleDeleteTeacherComment}
          onClose={() => { setShowCommentsModal(false); setCommentsItem(null); setCommentsData([]); }}
          t={t}
        />
      )}
    </div>
  );
}

function EditorModal({ api, tab, editItem, saving, onSave, onClose, t }) {
  const [form, setForm] = useState({
    title: editItem?.title || "",
    description: editItem?.description || "",
    content: editItem?.content || "",
    file_url: editItem?.file_url || "",
    video_url: editItem?.video_url || "",
    status: editItem?.status || "draft",
    due_date: editItem?.due_date ? editItem.due_date.split("T")[0] : "",
  });
  const [uploading, setUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const fileRef = useRef(null);
  const videoRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { pushToast("error", t('teacher.fileTooLarge')); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const endpoint = tab === "courses" ? "/courses/upload" : "/exercises/upload";
      const res = await api.post(endpoint, fd);
      setForm(p => ({ ...p, file_url: res.data.file_url }));
      pushToast("success", t('teacher.fileUploaded'));
    } catch (err) {
      pushToast("error", t('teacher.fileUploadError'));
    } finally { setUploading(false); }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { pushToast("error", t('teacher.videoTooLarge')); return; }
    setVideoUploading(true);
    try {
      const fd = new FormData();
      fd.append('video', file);
      const res = await api.post('/videos/upload', fd);
      setForm(p => ({ ...p, video_url: res.data.video_url }));
      pushToast("success", t('teacher.videoUploaded'));
    } catch (err) {
      pushToast("error", t('teacher.videoUploadError'));
    } finally { setVideoUploading(false); }
  };

  const handleSubmit = (status) => {
    if (!form.title.trim()) return;
    onSave({ ...form, status });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {editItem ? t(`teacher.edit${tab === "courses" ? "Course" : "Exercise"}`) : t(`teacher.new${tab === "courses" ? "Course" : "Exercise"}`)}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); handleSubmit(form.status); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('teacher.title')}</label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('teacher.description')}</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('teacher.content')}</label>
            <div className="border border-gray-300 rounded-xl overflow-hidden [&_.ql-editor]:min-h-[200px] [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:bg-gray-50 [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:border-0 [&_.ql-editor]:text-sm">
              <ReactQuill
                value={form.content}
                onChange={v => setForm(p => ({ ...p, content: v }))}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link', 'image'],
                    ['clean'],
                  ],
                }}
                placeholder={t('teacher.contentPlaceholder')}
              />
            </div>
          </div>
          {tab === "exercises" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('teacher.dueDate')}</label>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('teacher.file')}</label>
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition cursor-pointer">
                {uploading ? <Loader2 size={20} className="animate-spin mx-auto text-blue-500" />
                  : <Upload size={20} className="mx-auto text-gray-400 mb-1" />}
                <p className="text-xs text-gray-600">{t('teacher.dropFile')}</p>
              </div>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
              {form.file_url && (
                <div className="flex items-center justify-between mt-1 px-3 py-2 bg-blue-50 rounded-lg text-xs">
                  <span className="text-blue-700 truncate">{form.file_url.split('/').pop()}</span>
                  <button type="button" onClick={() => setForm(p => ({ ...p, file_url: '' }))} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('teacher.video')}</label>
              <input type="text" value={form.video_url || ''} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))}
                placeholder="https://youtube.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <div onClick={() => videoRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-3 text-center hover:border-purple-400 transition cursor-pointer">
                {videoUploading ? <Loader2 size={16} className="animate-spin mx-auto text-purple-500" />
                  : <Video size={16} className="mx-auto text-gray-400 mb-1" />}
                <p className="text-[11px] text-gray-600">{t('teacher.uploadVideo')}</p>
              </div>
              <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={handleVideoUpload} />
            </div>
          </div>
          {form.video_url && (
            <div className="flex items-center justify-between px-3 py-2 bg-purple-50 rounded-lg text-xs">
              <span className="text-purple-700 truncate">{form.video_url}</span>
              <button type="button" onClick={() => setForm(p => ({ ...p, video_url: '' }))} className="text-red-500 hover:text-red-700"><X size={14} /></button>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              {t('teacher.cancel')}
            </button>
            <button type="button" onClick={() => handleSubmit('draft')} disabled={saving || !form.title.trim()}
              className="flex-1 px-4 py-2.5 border border-amber-300 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-50 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('teacher.saveDraft')}
            </button>
            <button type="button" onClick={() => handleSubmit('published')} disabled={saving || !form.title.trim()}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('teacher.publish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CommentsModal({ item, comments, loading, onDelete, onClose, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-600" />
            Commentaires — {item?.title}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Aucun commentaire</p>
        ) : (
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className={`p-3 rounded-xl ${c.is_note ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {c.is_note && <span className="text-[10px] text-amber-600 font-semibold uppercase">Note privée</span>}
                    <span className="text-sm font-semibold text-gray-800">{c.prenom} {c.nom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button onClick={() => onDelete(c.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{c.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressModal({ item, data, loading, tab, onClose, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            {item?.title}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
        ) : data ? (
          <>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-4">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${data.total ? (data.viewed / data.total) * 100 : 0}%` }} />
              </div>
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                {data.viewed}/{data.total}
              </span>
            </div>

            <div className="space-y-2">
              {data.students.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-sm font-medium text-gray-800">{s.prenom} {s.nom}</span>
                  <div className="flex items-center gap-2">
                    {s.viewed ? (
                      <>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-xs text-gray-500">{new Date(s.viewed_at).toLocaleDateString()} {new Date(s.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} className="text-red-400" />
                        <span className="text-xs text-gray-400">Pas encore</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-4">Erreur de chargement</p>
        )}
      </div>
    </div>
  );
}
