import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Routes, Route, Link, useLocation, useParams, useNavigate, Navigate } from "react-router-dom";
import { Loader2, RefreshCw, Search, Save, Download, Upload, X, Eye, History, FileText, BarChart3, Users, Calendar, CheckCircle, AlertTriangle, Plus, Pencil, Trash2, Mail, Clock, ClipboardCheck, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import { pushToast } from "../../components/Notifications";

function SchoolLifeHeader() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const base = '/school-life';

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('school.title')}</h1>
        {!pathname.includes('/school-life/students') ? null : null}
      </div>
    </div>
  );
}

export default function SchoolLifeModule({ user, api, hasPermission }) {
  return (
    <div className="min-h-full bg-gray-50 animate-fade-in">
      <SchoolLifeHeader />
      <div className="p-6">
        <Routes>
          <Route index element={<Navigate to="students" replace />} />
          <Route path="students" element={<NiveauSelector api={api} />} />
          <Route path="students/:niveau" element={<ClasseSelector api={api} />} />
          <Route path="students/:niveau/:classe" element={<ClasseDashboard api={api} />} />
          <Route path="absences" element={<AbsencesManagement api={api} user={user} />} />
          <Route path="presence" element={<PresenceManagement api={api} user={user} />} />
        </Routes>
      </div>
    </div>
  );
}


function AddStudentModal({ api, onClose, onAdded }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ id_massar: '', nom: '', prenom: '', classe: '', niveau: '', date_naissance: '', email_parent: '', telephone_parent: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      pushToast("error", t('school.fieldsRequired'));
      return;
    }
    setSaving(true);
    try {
      await api.post('/eleves', form);
      pushToast("success", t('school.studentAdded'));
      onAdded();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || t('school.studentAddError');
      pushToast("error", msg);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{t('school.addStudentTitle')}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('profile.nom')} *</label>
              <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('profile.prenom')} *</label>
              <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('school.massarOptional')}</label>
              <input value={form.id_massar} onChange={e => setForm(f => ({ ...f, id_massar: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('school.niveau')}</label>
              <input value={form.niveau} onChange={e => setForm(f => ({ ...f, niveau: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('school.classe')}</label>
              <input value={form.classe} onChange={e => setForm(f => ({ ...f, classe: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('school.dateNaissance')}</label>
              <input type="date" value={form.date_naissance} onChange={e => setForm(f => ({ ...f, date_naissance: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('school.emailParent')}</label>
              <input type="email" value={form.email_parent} onChange={e => setForm(f => ({ ...f, email_parent: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('school.telephoneParent')}</label>
              <input value={form.telephone_parent} onChange={e => setForm(f => ({ ...f, telephone_parent: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">{t('school.cancel')}</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {t('school.saveStudent')}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditStudentModal({ api, student, onClose, onUpdated }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    id_massar: student?.id_massar || '',
    nom: student?.nom || '',
    prenom: student?.prenom || '',
    classe: student?.classe || '',
    niveau: student?.niveau || '',
    date_naissance: student?.date_naissance ? String(student.date_naissance).split('T')[0] : '',
    email_parent: student?.email_parent || '',
    telephone_parent: student?.telephone_parent || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      pushToast("error", t('school.fieldsRequired'));
      return;
    }
    setSaving(true);
    try {
      await api.put(`/eleves/${student.id}`, form);
      pushToast("success", t('school.studentUpdated'));
      onUpdated();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || t('school.studentUpdateError');
      pushToast("error", msg);
    } finally { setSaving(false); }
  };

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{t('school.editStudentTitle')}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('profile.nom')} *</label>
              <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('profile.prenom')} *</label>
              <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('school.massarOptional')}</label>
              <input value={form.id_massar} onChange={e => setForm(f => ({ ...f, id_massar: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('school.niveau')}</label>
              <input value={form.niveau} onChange={e => setForm(f => ({ ...f, niveau: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('school.classe')}</label>
              <input value={form.classe} onChange={e => setForm(f => ({ ...f, classe: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('school.dateNaissance')}</label>
              <input type="date" value={form.date_naissance} onChange={e => setForm(f => ({ ...f, date_naissance: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('school.emailParent')}</label>
              <input type="email" value={form.email_parent} onChange={e => setForm(f => ({ ...f, email_parent: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{t('school.telephoneParent')}</label>
              <input value={form.telephone_parent} onChange={e => setForm(f => ({ ...f, telephone_parent: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">{t('school.cancel')}</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {t('school.saveStudent')}
          </button>
        </div>
      </div>
    </div>
  );
}

function NiveauSelector({ api }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [niveaux, setNiveaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalResults, setGlobalResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    api.get('/eleves/niveaux')
      .then(r => setNiveaux(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!globalQuery.trim()) { setGlobalResults([]); setShowResults(false); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await api.get('/eleves/search-global', { params: { q: globalQuery } });
        setGlobalResults(r.data);
        setShowResults(true);
      } catch {}
      setSearching(false);
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [globalQuery, api]);

  useEffect(() => {
    const handleClick = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const colors = [
    { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'from-amber-500 to-red-600', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ];

  if (loading) return <div className="text-center py-20"><Loader2 size={32} className="animate-spin text-blue-500 mx-auto" /></div>;

  return (
    <div className="animate-fade-in">
      <div ref={searchRef} className="relative mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={globalQuery} onChange={e => setGlobalQuery(e.target.value)}
            placeholder={t('school.globalSearch')}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
          {searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />}
        </div>
        {showResults && globalResults.length > 0 && (
          <div className="absolute top-full mt-1 left-0 w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto">
            {globalResults.map(s => (
              <button key={s.id} onClick={() => { setShowResults(false); setGlobalQuery(''); navigate(`/school-life/students/${encodeURIComponent(s.niveau || '')}/${encodeURIComponent(s.classe || '')}`); }}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-blue-50 text-left border-b border-gray-50 last:border-b-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
                  {(s.prenom?.[0] || "") + (s.nom?.[0] || "")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.prenom} {s.nom}</p>
                  <p className="text-xs text-gray-500 truncate">{s.niveau || ''} {s.classe ? `· ${s.classe}` : ''} · Massar: {s.id_massar || '—'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-6">{t('school.selectLevel')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {niveaux.map((n, i) => (
          <button key={n.niveau} onClick={() => navigate(`/school-life/students/${encodeURIComponent(n.niveau)}`)}
            className={`relative bg-white rounded-2xl border ${colors[i % 3]?.border || 'border-gray-200'} shadow-sm hover:shadow-md transition-all p-6 text-left group`}>
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors[i % 3]?.bg || 'from-gray-500 to-gray-600'} flex items-center justify-center mb-4`}>
              <Users size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{n.niveau}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span><strong className="text-gray-900">{n.nb_classes}</strong> {t('school.classes')}</span>
              <span><strong className="text-gray-900">{n.nb_eleves}</strong> {t('school.students')}</span>
            </div>
            <span className="absolute top-4 right-4 text-gray-300 group-hover:text-blue-500 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ClasseSelector({ api }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { niveau } = useParams();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalResults, setGlobalResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const decodedNiveau = decodeURIComponent(niveau);

  useEffect(() => {
    api.get('/eleves/classes', { params: { niveau: decodedNiveau } })
      .then(r => setClasses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api, decodedNiveau]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!globalQuery.trim()) { setGlobalResults([]); setShowResults(false); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await api.get('/eleves/search-global', { params: { q: globalQuery } });
        setGlobalResults(r.data);
        setShowResults(true);
      } catch {}
      setSearching(false);
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [globalQuery, api]);

  useEffect(() => {
    const handleClick = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (loading) return <div className="text-center py-20"><Loader2 size={32} className="animate-spin text-blue-500 mx-auto" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <button onClick={() => navigate('/school-life/students')} className="hover:text-blue-600 transition">{t('school.levels')}</button>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{decodedNiveau}</span>
      </div>
      <div ref={searchRef} className="relative mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={globalQuery} onChange={e => setGlobalQuery(e.target.value)}
            placeholder={t('school.globalSearch')}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
          {searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />}
        </div>
        {showResults && globalResults.length > 0 && (
          <div className="absolute top-full mt-1 left-0 w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto">
            {globalResults.map(s => (
              <button key={s.id} onClick={() => { setShowResults(false); setGlobalQuery(''); navigate(`/school-life/students/${encodeURIComponent(s.niveau || '')}/${encodeURIComponent(s.classe || '')}`); }}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-blue-50 text-left border-b border-gray-50 last:border-b-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
                  {(s.prenom?.[0] || "") + (s.nom?.[0] || "")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.prenom} {s.nom}</p>
                  <p className="text-xs text-gray-500 truncate">{s.niveau || ''} {s.classe ? `· ${s.classe}` : ''} · Massar: {s.id_massar || '—'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-6">{decodedNiveau} — {t('school.selectClass')}</h2>
      {classes.length === 0 ? (
        <div className="text-center py-12 text-gray-400 font-medium">{t('school.noClasses')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => (
            <button key={c.classe} onClick={() => navigate(`/school-life/students/${niveau}/${encodeURIComponent(c.classe)}`)}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-5 text-left group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{c.classe}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    <strong className="text-gray-900">{c.nb_eleves}</strong> {t('school.students')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                  <Users size={20} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Student Card ---
function StudentCard({ student, onEdit, onDelete, onClick, onSendEmail, onMarkAbsence }) {
  const { t } = useTranslation();
  const isAlert = student.absences >= 10;
  const isWarning = student.absences >= 5 && student.absences < 10;
  const avatarColors = [
    "from-red-500 to-orange-600", "from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600",
    "from-amber-500 to-red-600", "from-purple-500 to-pink-600", "from-cyan-500 to-blue-600", "from-rose-500 to-red-600",
  ];
  const colorIdx = (student.id || 1) % avatarColors.length;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-all ${isAlert ? "bg-red-50/50" : ""}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br ${avatarColors[colorIdx]} flex-shrink-0`}>
        {(student.prenom?.[0] || "") + (student.nom?.[0] || "")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{student.prenom} {student.nom}</p>
        <p className="text-xs text-gray-500 truncate">
          Massar: {student.id_massar || '—'} · {student.classe || '—'}
          {student.absences > 0 && (
            <strong className={`ml-1 ${isAlert ? "text-red-600" : isWarning ? "text-amber-600" : "text-gray-500"}`}>
              · {student.absences}{t('school.hoursAbsences')}
            </strong>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {isAlert ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">{t('school.alert')}</span>
        ) : isWarning ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{t('school.warning')}</span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{t('school.normal')}</span>
        )}
        <button onClick={() => onClick?.(student)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title={t('school.dossier')}>
          <Eye size={14} />
        </button>
        {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(student); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title={t('common.edit')}>
          <Pencil size={14} />
        </button>}
        {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(student); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title={t('school.deleteStudent')}>
          <Trash2 size={14} />
        </button>}
        {onSendEmail && <button onClick={(e) => { e.stopPropagation(); onSendEmail(student); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title={t('school.sendAlertEmail')}>
          <Mail size={14} />
        </button>}
        {onMarkAbsence && <button onClick={(e) => { e.stopPropagation(); onMarkAbsence(student); }} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title={t('school.markAbsence')}>
          <Calendar size={14} />
        </button>}
      </div>
    </div>
  );
}

// --- Mark Absence Modal ---
function MarkAbsenceModal({ api, student, onClose, onSaved }) {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [justifie, setJustifie] = useState(false);
  const [motif, setMotif] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/eleves/absences/records', { eleve_id: student.id, date, justifie, motif: motif || null });
      pushToast("success", t('school.absenceRecorded'));
      onSaved();
      onClose();
    } catch {
      pushToast("error", t('school.absenceRecordError'));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{t('school.markAbsence')} — {student.prenom} {student.nom}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t('school.date')}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-600">{t('school.justifieLabel')}</span>
            <button type="button" onClick={() => setJustifie(!justifie)}
              className={`relative w-10 h-5 rounded-full transition-colors ${justifie ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${justifie ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t('school.motif')}</label>
            <input value={motif} onChange={e => setMotif(e.target.value)} placeholder={t('school.motifPlaceholder')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">{t('school.cancel')}</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {t('school.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Mapping Confirm Modal (AI column mapping) ---
const SCHEMA_FIELDS = ['id_massar', 'nom', 'prenom', 'classe', 'niveau', 'date_naissance', 'email_parent', 'telephone_parent'];
const FIELD_LABELS = {
  id_massar: 'MASSAR', nom: 'Nom', prenom: 'Prénom', classe: 'Classe',
  niveau: 'Niveau', date_naissance: 'Date naissance',
  email_parent: 'Email parent', telephone_parent: 'Téléphone parent'
};

function MappingConfirmModal({ fileName, totalRows, headers, rows, initialMapping, unmapped, detectedNiveau, detectedClasse, api, onClose, onImported }) {
  const { t } = useTranslation();
  const [niveau, setNiveau] = useState(detectedNiveau || '');
  const [classe, setClasse] = useState(detectedClasse || '');
  const [mapping, setMapping] = useState(() => {
    const m = {};
    for (const field of SCHEMA_FIELDS) {
      m[field] = initialMapping[field] || null;
    }
    for (const h of unmapped) {
      m[`_unmap_${h}`] = h;
    }
    return m;
  });
  const [fieldToHeader, setFieldToHeader] = useState(() => {
    const fth = {};
    for (const field of SCHEMA_FIELDS) {
      if (initialMapping[field]) fth[initialMapping[field]] = field;
    }
    return fth;
  });
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(() => rows.slice(0, 3));

  const assignedHeaders = Object.keys(fieldToHeader).filter(h => fieldToHeader[h] !== 'ignorer');
  const ignoredHeaders = Object.keys(fieldToHeader).filter(h => fieldToHeader[h] === 'ignorer');

  const handleFieldChange = (header, newField) => {
    setFieldToHeader(prev => {
      const next = { ...prev };
      const oldField = prev[header];
      if (oldField && oldField !== 'ignorer') {
        next[header] = newField;
      } else {
        next[header] = newField;
      }
      return next;
    });
    setMapping(prev => {
      const next = { ...prev, [newField]: header };
      return next;
    });
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const usedFields = Object.entries(fieldToHeader).filter(([, f]) => f && f !== 'ignorer');
      const students = rows.map(row => {
        const s = {};
        for (const [header, field] of usedFields) {
          const val = String(row[header] || '').trim();
          if (field === 'date_naissance' && val) {
            s[field] = typeof row[header] === 'number' ? XLSX.SSF.format('yyyy-mm-dd', row[header]) : val;
          } else if (['email_parent', 'telephone_parent'].includes(field)) {
            s[field] = val || null;
          } else if (!['niveau', 'classe'].includes(field)) {
            s[field] = val;
          }
        }
        s.niveau = niveau;
        s.classe = classe;
        return s;
      }).filter(s => s.nom || s.prenom);
      const res = await api.post("/eleves/import", { students });
      if (res.data.skipped > 0) {
        pushToast("success", t('school.importPartial', { imported: res.data.imported, skipped: res.data.skipped }));
      } else {
        pushToast("success", t('school.importSuccess', { count: res.data.imported }));
      }
      onImported();
      onClose();
    } catch {
      pushToast("error", t('school.importError'));
    } finally { setImporting(false); }
  };

  const allFields = ['ignorer', ...SCHEMA_FIELDS];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('school.mappingTitle')}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{fileName} — {totalRows} {t('school.students').toLowerCase()} {t('school.detected').toLowerCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          <div className="flex gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-blue-700 mb-1">{t('school.niveau')}</label>
              <input value={niveau} onChange={e => setNiveau(e.target.value)}
                className="w-full border border-blue-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-blue-700 mb-1">{t('school.classe')}</label>
              <input value={classe} onChange={e => setClasse(e.target.value)}
                className="w-full border border-blue-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('school.mappingColumns')}</p>
          {headers.map(header => {
            const currentField = fieldToHeader[header] || 'ignorer';
            const isUnmapped = unmapped.includes(header);
            return (
              <div key={header} className={`flex items-center gap-3 p-3 rounded-xl border ${isUnmapped ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 bg-white'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{header}</p>
                  {isUnmapped && <p className="text-[10px] text-amber-600 font-medium">{t('school.unmappedHint')}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">→</span>
                  <select value={currentField} onChange={e => handleFieldChange(header, e.target.value)}
                    className={`text-sm border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 ${currentField === 'ignorer' ? 'text-gray-400 border-gray-200' : 'text-gray-900 border-blue-200 bg-blue-50/50'}`}>
                    {allFields.map(f => (
                      <option key={f} value={f}>{f === 'ignorer' ? `— ${t('school.ignoreCol')} —` : FIELD_LABELS[f] || f}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold">{assignedHeaders.length} {t('school.mapped')}</span>
            {ignoredHeaders.length > 0 && <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg font-semibold">{ignoredHeaders.length} {t('school.ignored')}</span>}
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-semibold">{totalRows} lignes</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">{t('school.cancel')}</button>
          <button onClick={handleImport} disabled={importing || assignedHeaders.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 flex items-center gap-2">
            {importing ? <Loader2 size={16} className="animate-spin" /> : null}
            {t('school.importStudents', { count: totalRows })}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClasseDashboard({ api }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { niveau, classe } = useParams();
  const decodedNiveau = decodeURIComponent(niveau);
  const decodedClasse = decodeURIComponent(classe);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [dossierStudent, setDossierStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [markingAbsence, setMarkingAbsence] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [mappingData, setMappingData] = useState(null);
  const fileInputRef = useRef(null);

  const loadData = () => {
    setLoading(true);
    api.get('/eleves/by-classe', { params: { niveau: decodedNiveau, classe: decodedClasse } })
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [api, decodedNiveau, decodedClasse]);

  const handleDelete = (student) => {
    if (!confirm(t('school.deleteStudentConfirm', { name: `${student.prenom} ${student.nom}` }))) return;
    api.delete(`/eleves/${student.id}`)
      .then(() => { pushToast("success", t('school.studentDeleted')); loadData(); })
      .catch(() => pushToast("error", t('school.studentDeleteError')));
  };

  const handleSendEmail = async (student) => {
    try {
      const res = await api.post(`/eleves/${student.id}/alert-email`);
      if (res.data.sent) pushToast("success", t('school.emailAlertSent'));
      else pushToast("warning", t('school.emailNotConfigured'));
    } catch { pushToast("error", t('school.emailFailed')); }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      // Detect niveau/classe from metadata rows
      const NIVEAU_MAP = {
        "الأولى إعدادي": "1ère année collège",
        "الثانية إعدادي": "2ème année collège",
        "الثالثة إعدادي": "3ème année collège",
      };
      let detectedNiveau = decodedNiveau;
      let detectedClasse = decodedClasse;
      for (const row of rawRows) {
        const text = row.join(' ');
        const nm = text.match(/المستوى\s*:?\s*(.+)/i);
        if (nm) {
          const raw = nm[1].trim();
          for (const [ar, fr] of Object.entries(NIVEAU_MAP)) {
            if (raw.includes(ar)) { detectedNiveau = fr; break; }
          }
        }
        const cm = text.match(/القسم\s*:?\s*(.+)/i);
        if (cm) {
          const raw = cm[1].trim();
          const parts = raw.split('-');
          detectedClasse = parts.length >= 2 ? parts[parts.length - 1].trim() : raw;
        }
      }

      // Find header row (first row with >=3 non-numeric text cells)
      let headerRowIdx = -1;
      for (let i = 0; i < rawRows.length; i++) {
        const nonEmpty = rawRows[i].filter(c => String(c).trim().length > 0);
        if (nonEmpty.length >= 3 && !nonEmpty.every(c => /^\d+$/.test(String(c).trim()))) {
          headerRowIdx = i; break;
        }
      }
      if (headerRowIdx === -1) { pushToast("error", t('school.importError')); setImportLoading(false); return; }

      // Build headers from discovered row
      const headerRow = rawRows[headerRowIdx];
      const validCols = headerRow.map((h, idx) => ({ h: String(h).trim(), idx })).filter(x => x.h.length > 0);
      const headersList = validCols.map(x => x.h);

      // Build data rows as objects
      const rows = [];
      for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
        const r = rawRows[i];
        const obj = {};
        let hasData = false;
        for (const { h, idx } of validCols) {
          const val = r[idx] !== undefined ? String(r[idx]).trim() : '';
          obj[h] = val; if (val) hasData = true;
        }
        if (hasData) rows.push(obj);
      }
      if (rows.length === 0) { pushToast("error", t('school.importError')); setImportLoading(false); return; }

      const res = await api.post("/eleves/import/ai-mapping", { headers: headersList });
      const { mapping, unmapped, source } = res.data;
      setMappingData({ fileName: file.name, totalRows: rows.length, headers: headersList, rows, mapping, unmapped, source, detectedNiveau, detectedClasse });
    } catch {
      pushToast("error", t('school.importError'));
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) return <div className="text-center py-20"><Loader2 size={32} className="animate-spin text-blue-500 mx-auto" /></div>;
  if (!data) return null;

  const { students, stats } = data;
  const q = searchQuery.toLowerCase();
  const filteredStudents = students.filter(s =>
    !q || (s.nom || "").toLowerCase().includes(q) || (s.prenom || "").toLowerCase().includes(q) || (s.id_massar || "").toLowerCase().includes(q)
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <button onClick={() => navigate('/school-life/students')} className="hover:text-blue-600 transition">{t('school.levels')}</button>
        <span>/</span>
        <button onClick={() => navigate(`/school-life/students/${niveau}`)} className="hover:text-blue-600 transition">{decodedNiveau}</button>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{decodedClasse}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">{t('school.students')}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.total_eleves}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">{t('school.totalAbsences')}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.total_absences}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">{t('school.justifiedCount')}</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.total_justifiees}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">{t('school.alerts')}</p>
          <p className="text-2xl font-black text-red-600 mt-1">{stats.alert_count}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('school.searchStudent')}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
          </div>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <button onClick={() => fileInputRef.current?.click()} disabled={importLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:bg-gray-300">
            {importLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {t('school.importExcel')}
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm">
            <Plus size={16} />
            {t('school.addStudent')}
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-medium">{t('school.noStudents')}</div>
          ) : (
            filteredStudents.map(s => (
              <StudentCard key={s.id} student={s} onEdit={setEditingStudent} onDelete={handleDelete} onClick={setDossierStudent} onSendEmail={handleSendEmail} onMarkAbsence={setMarkingAbsence} />
            ))
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
          {students.length} {t('school.totalStudents', { count: students.length })}
        </div>
      </div>

      {showAddModal && (
        <AddStudentModal api={api} onClose={() => setShowAddModal(false)} onAdded={loadData} />
      )}
      {editingStudent && (
        <EditStudentModal api={api} student={editingStudent} onClose={() => setEditingStudent(null)} onUpdated={loadData} />
      )}
      {dossierStudent && (
        <StudentDossierModal api={api} student={dossierStudent} onClose={() => setDossierStudent(null)} />
      )}
      {markingAbsence && (
        <MarkAbsenceModal api={api} student={markingAbsence} onClose={() => setMarkingAbsence(null)} onSaved={loadData} />
      )}
      {mappingData && (
        <MappingConfirmModal
          fileName={mappingData.fileName} totalRows={mappingData.totalRows}
          headers={mappingData.headers} rows={mappingData.rows}
          initialMapping={mappingData.mapping} unmapped={mappingData.unmapped}
          detectedNiveau={mappingData.detectedNiveau} detectedClasse={mappingData.detectedClasse}
          api={api} onClose={() => setMappingData(null)} onImported={loadData} />
      )}
    </div>
  );
}

// --- Student Dossier Modal ---
function StudentDossierModal({ api, student, onClose }) {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!student || typeof student.id !== 'number') return;
    setLoading(true);
    api.get('/eleves/absences/records', { params: { eleve_id: student.id } })
      .then(r => setRecords(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student, api]);

  if (!student) return null;

  const isAlert = student.absences >= 10;
  const isWarning = student.absences >= 5 && student.absences < 10;
  const justified = student.absences_justifiees || 0;
  const unjustified = (student.absences || 0) - justified;
  const avatarColors = [
    "from-red-500 to-orange-600", "from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600",
    "from-amber-500 to-red-600", "from-purple-500 to-pink-600", "from-cyan-500 to-blue-600", "from-rose-500 to-red-600",
  ];
  const colorIdx = (student.id || 1) % avatarColors.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-gray-100">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold bg-gradient-to-br ${avatarColors[colorIdx]} flex-shrink-0`}>
            {(student.prenom?.[0] || "") + (student.nom?.[0] || "")}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{student.prenom} {student.nom}</h2>
            <p className="text-sm text-gray-500 truncate">{t('school.massarCode')}: {student.id_massar || '—'} · {student.niveau || '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAlert ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">{t('school.alert')}</span>
            ) : isWarning ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{t('school.warning')}</span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{t('school.normal')}</span>
            )}
            <button onClick={async () => {
              setSendingEmail(true);
              try {
                const res = await api.post(`/eleves/${student.id}/alert-email`);
                if (res.data.sent) pushToast("success", t('school.emailAlertSent'));
                else pushToast("warning", t('school.emailNotConfigured'));
              } catch { pushToast("error", t('school.emailFailed')); }
              finally { setSendingEmail(false); }
            }} disabled={sendingEmail} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title={t('school.sendAlertEmail')}>
              {sendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {/* Info cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">{t('school.classe')}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{student.classe || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">{t('school.niveau')}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{student.niveau || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">{t('school.dateNaissance')}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {student.date_naissance ? new Date(student.date_naissance).toLocaleDateString("fr-FR") : '—'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">{t('school.totalAbs')}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{student.absences || 0}h</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">{t('school.emailParent')}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{student.email_parent || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">{t('school.telephoneParent')}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{student.telephone_parent || '—'}</p>
            </div>
          </div>

          {/* Absence stats bar */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">{t('school.absencesStats')}</h3>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{t('school.justifiees')}</span>
                  <span className="font-bold text-emerald-600">{justified}h</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(student.absences || 0) > 0 ? (justified / student.absences) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{t('school.injustifiees')}</span>
                  <span className="font-bold text-red-600">{unjustified}h</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${(student.absences || 0) > 0 ? (unjustified / student.absences) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {student.absences > 0
                ? `${Math.round((justified / student.absences) * 100)}% ${t('school.justified').toLowerCase()}, ${Math.round((unjustified / student.absences) * 100)}% ${t('school.unjustified').toLowerCase()}`
                : t('school.noAbsences')}
            </p>
          </div>

          {/* Absence history */}
          <h3 className="text-sm font-bold text-gray-900 mb-3">{t('school.absenceHistory')}</h3>
          {loading ? (
            <div className="text-center py-8"><Loader2 className="animate-spin text-blue-500 mx-auto" size={24} /></div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-gray-400 font-medium">{t('school.noHistory')}</div>
          ) : (
            <div className="space-y-2">
              {records.map(r => (
                <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border ${r.justifie ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${r.justifie ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {r.justifie ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{new Date(r.date).toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-xs text-gray-500">{r.justifie ? t('school.justifieLabel') : t('school.unjustified')}{r.motif ? ` — ${r.motif}` : ''}</p>
                  </div>
                  {r.justificatif && (
                    <span className="text-xs text-blue-600 flex items-center gap-1"><FileText size={12} /> {t('school.justificatif')}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AbsenceDetailModal({ record, api, user, onClose, onUpdated }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(record?.justifie ? 'justified' : 'unjustified');
  const canJustify = user && (user.role === 'surveillant_general' || user.role === 'surveillant' || user.role === 'direction' || user.role === 'administrateur');

  useEffect(() => {
    if (record) {
      setStatus(record.justifie ? 'justified' : 'unjustified');
      api.get('/eleves/absences/records', { params: { eleve_id: record.eleve_id } })
        .then(r => setHistory(r.data))
        .catch(() => {})
        .finally(() => setHistoryLoading(false));
    }
  }, [record, api]);

  if (!record) return null;

  const seanceTime = record.seance_heure ? record.seance_heure.slice(0, 5) : '—';
  const totalUnjustified = history.filter(h => !h.justifie).reduce((s, h) => s + parseFloat(h.duree || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{t('school.absenceDetails')}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Student Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase mb-2">{t('school.student')}</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                {record.prenom?.[0]}{record.nom?.[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900">{record.prenom} {record.nom}</p>
                <p className="text-sm text-gray-600">{t('school.massarCode')}: {record.id_massar || '—'} · {record.niveau} {record.classe}</p>
              </div>
            </div>
          </div>

          {/* Absence Details */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('school.absenceInfo')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-500">{t('school.date')}</p>
                <p className="font-semibold text-gray-900">{new Date(record.date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-500">{t('school.time')}</p>
                <p className="font-semibold text-gray-900">{seanceTime}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-500">{t('school.matiere')}</p>
                <p className="font-semibold text-gray-900">{record.matiere || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-500">{t('school.duree')}</p>
                <p className="font-semibold text-gray-900">{record.duree ? `${record.duree}h` : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-500">{t('school.status')}</p>
                {status === 'justified' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{t('school.justifieLabel')}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">{t('school.unjustified')}</span>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-500">{t('school.motif')}</p>
                <p className="font-semibold text-gray-900">{record.motif || '—'}</p>
              </div>
            </div>
          </div>

          {/* Student Absence History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                {t('school.absenceHistory')} ({history.length})
              </p>
              <span className="text-xs text-red-600 font-semibold">{totalUnjustified}h {t('school.unjustified')}</span>
            </div>
            {historyLoading ? (
              <div className="text-center py-6"><Loader2 size={20} className="animate-spin text-blue-500 mx-auto" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">{t('school.noAbsences')}</div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                {history.map(h => (
                  <div key={h.id} className={`flex items-center gap-3 px-3 py-2 text-sm ${h.id === record.id ? 'bg-blue-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-900 font-medium">{new Date(h.date).toLocaleDateString('fr-FR')}</span>
                      <span className="text-gray-400 mx-1">·</span>
                      <span className="text-gray-600">{h.matiere || '—'}</span>
                      <span className="text-gray-400 mx-1">·</span>
                      <span className="text-gray-600">{h.duree}h</span>
                    </div>
                    {(h.id === record.id ? status === 'justified' : h.justifie) ? (
                      <span className="text-xs font-bold text-emerald-600">{t('school.justifieLabel')}</span>
                    ) : (
                      <span className="text-xs font-bold text-red-600">{t('school.unjustified')}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action */}
          {canJustify && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <label className="block text-xs font-semibold text-gray-600 mb-2">{t('school.status')}</label>
              <div className="flex items-center gap-3">
                <select
                  value={status}
                  onChange={e => {
                    const newVal = e.target.value;
                    if (newVal === status) return;
                    const willBeJustified = newVal === 'justified';
                    if (!window.confirm(willBeJustified ? t('school.justifyConfirm') : t('school.unjustifyConfirm'))) {
                      return;
                    }
                    setSaving(true);
                    api.patch(`/eleves/absences/records/${record.id}/justify`, { justifie: willBeJustified })
                      .then(() => {
                        setStatus(newVal);
                        pushToast("success", t('school.justifySuccess'));
                        onUpdated();
                      })
                      .catch(() => {
                        pushToast("error", t('school.justifyError'));
                      })
                      .finally(() => setSaving(false));
                  }}
                  disabled={saving}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-bold border-2 outline-none transition-all appearance-none cursor-pointer
                    ${status === 'justified'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-red-50 border-red-300 text-red-700'
                    } disabled:opacity-50`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '36px'
                  }}>
                  <option value="unjustified" className="text-red-700 bg-white">{t('school.unjustified')}</option>
                  <option value="justified" className="text-emerald-700 bg-white">{t('school.justifieLabel')}</option>
                </select>
                {saving && <Loader2 size={18} className="animate-spin text-gray-400 shrink-0" />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AbsencesManagement({ api, user }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const canJustify = user && (user.role === 'surveillant_general' || user.role === 'surveillant' || user.role === 'direction' || user.role === 'administrateur');

  const loadData = () => {
    setLoading(true);
    const params = {};
    if (filterDate) params.date = filterDate;
    if (filterNiveau) params.niveau = filterNiveau;
    Promise.all([
      api.get('/eleves/absences/records', { params }),
      api.get('/eleves/absences/stats'),
    ])
      .then(([recRes, statRes]) => {
        setRecords(recRes.data);
        setStats(statRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [filterDate, filterNiveau]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <button onClick={() => navigate('/school-life/students')} className="hover:text-blue-600 transition">{t('school.levels')}</button>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{t('school.manageAbsences')}</span>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase">{t('school.totalAbsences')}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{stats.summary.total_records}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase">{t('school.justifiedCount')}</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.summary.total_justifiees}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase">{t('school.unjustified')}</p>
            <p className="text-2xl font-black text-red-600 mt-1">{stats.summary.total_records - stats.summary.total_justifiees}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase">{t('school.studentsConcerned')}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{stats.summary.total_eleves}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-gray-400" />
            <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">{t('school.allLevels')}</option>
              <option value="1AC">1AC</option>
              <option value="2AC">2AC</option>
              <option value="3AC">3AC</option>
            </select>
          </div>
          <button onClick={() => { setFilterDate(''); setFilterNiveau(''); }}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium">
            {t('school.resetFilters')}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 size={32} className="animate-spin text-blue-500 mx-auto" /></div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-medium">{t('school.noRecords')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">{t('documents.student')}</th>
                  <th className="px-4 py-3">{t('school.classe')}</th>
                  <th className="px-4 py-3">{t('school.date')}</th>
                  <th className="px-4 py-3">{t('school.matiere')}</th>
                  <th className="px-4 py-3">{t('school.duree')}</th>
                  <th className="px-4 py-3">{t('school.status')}</th>
                  <th className="px-4 py-3">{t('school.motif')}</th>
                  {canJustify && <th className="px-4 py-3 text-center">{t('school.justify')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r => (
                  <tr key={r.id} onClick={() => setSelectedRecord(r)}
                    className="hover:bg-gray-50 transition-all cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="font-bold text-sm text-gray-900">{r.prenom} {r.nom}</p>
                      <p className="text-xs text-gray-500">{r.id_massar || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.classe || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(r.date).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.matiere || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.duree ? `${r.duree}h` : '—'}</td>
                    <td className="px-4 py-3">
                      {r.justifie ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{t('school.justifieLabel')}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">{t('school.unjustified')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.motif || '—'}</td>
                    {canJustify && (
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedRecord(r)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            r.justifie
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}>
                          {r.justifie ? t('school.justifieLabel') : t('school.unjustified')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRecord && (
        <AbsenceDetailModal
          record={selectedRecord}
          api={api}
          user={user}
          onClose={() => setSelectedRecord(null)}
          onUpdated={loadData}
        />
      )}
    </div>
  );
}

function PresenceManagement({ api, user }) {
  const { t } = useTranslation();
  const [step, setStep] = useState('form');
  const [niveau, setNiveau] = useState('');
  const [classe, setClasse] = useState('');
  const [dateSeance, setDateSeance] = useState(new Date().toISOString().split('T')[0]);
  const [heure, setHeure] = useState(new Date().toTimeString().slice(0, 5));
  const [students, setStudents] = useState([]);
  const [absents, setAbsents] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [seanceId, setSeanceId] = useState(null);
  const [niveaux, setNiveaux] = useState([]);
  const [classes, setClasses] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [matiere, setMatiere] = useState('');
  const [duree, setDuree] = useState('1');

  useEffect(() => {
    api.get('/eleves/niveaux').then(r => setNiveaux(r.data)).catch(() => {});
    api.get('/eleves/seances').then(r => setHistory(r.data)).catch(() => {}).finally(() => setHistoryLoading(false));
  }, [api]);

  useEffect(() => {
    if (niveau) {
      api.get('/eleves/classes', { params: { niveau } }).then(r => setClasses(r.data)).catch(() => setClasses([]));
      setClasse('');
    }
  }, [niveau, api]);

  const startSeance = async () => {
    if (!niveau || !classe || !heure) { pushToast("error", t('school.fieldsRequired')); return; }
    setLoading(true);
    try {
      const res = await api.post('/eleves/seances', { niveau, classe, date_seance: dateSeance, heure, matiere, duree: parseFloat(duree) || 1 });
      setSeanceId(res.data.id);
      const studentsRes = await api.get('/eleves/by-classe', { params: { niveau, classe } });
      setStudents(studentsRes.data.students || studentsRes.data);
      setAbsents(new Set());
      setStep('presence');
      pushToast("success", "Séance créée, veuillez marquer les absents");
    } catch (err) {
      pushToast("error", err.response?.data?.error || "Erreur lors de la création");
    } finally { setLoading(false); }
  };

  const toggleAbsent = (id) => {
    setAbsents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const submitPresence = async () => {
    setSubmitting(true);
    try {
      await api.post(`/eleves/seances/${seanceId}/presence`, { absents: [...absents] });
      pushToast("success", `Séance enregistrée — ${absents.size} absent(s)`);
      api.get('/seances').then(r => setHistory(r.data)).catch(() => {});
      setStep('form');
      setStudents([]);
      setSeanceId(null);
    } catch (err) {
      pushToast("error", err.response?.data?.error || "Erreur");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      {step === 'form' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <ClipboardCheck size={20} className="text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{t('school.takePresence')}</h2>
              <p className="text-xs text-gray-500">{t('school.selectSession')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-5">
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('school.niveau')}</label>
              <select value={niveau} onChange={e => setNiveau(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all">
                <option value="">{t('common.select')}</option>
                {niveaux.map(n => <option key={n.niveau || n} value={n.niveau || n}>{n.niveau || n}</option>)}
              </select>
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('school.classe')}</label>
              <select value={classe} onChange={e => setClasse(e.target.value)} disabled={!niveau}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all disabled:opacity-50">
                <option value="">{t('common.select')}</option>
                {classes.map(c => <option key={c.classe || c} value={c.classe || c}>{c.classe || c}</option>)}
              </select>
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('school.date')}</label>
              <input type="date" value={dateSeance} onChange={e => setDateSeance(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all" />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('school.time')}</label>
              <input type="time" value={heure} onChange={e => setHeure(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all" />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('school.matiere')}</label>
              <input type="text" value={matiere} onChange={e => setMatiere(e.target.value)}
                placeholder={t('school.subjectPlaceholder')}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all" />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('school.duree')}</label>
              <input type="number" value={duree} onChange={e => setDuree(e.target.value)} min="0.5" max="8" step="0.5"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all" />
            </div>
          </div>
          <button onClick={startSeance} disabled={loading || !niveau || !classe || !heure}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition disabled:opacity-50 shadow-sm">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
            {t('school.startSession')}
          </button>
        </div>
      )}

      {step === 'presence' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{classe} — {new Date(dateSeance).toLocaleDateString('fr-FR')}</h2>
                <p className="text-xs text-gray-500">{heure} · {students.length} {t('school.studentCount')} · {absents.size} absent(s)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('form')} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">{t('common.cancel')}</button>
              <button onClick={submitPresence} disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {t('common.save')}
              </button>
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('school.studentName')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('school.studentId')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('school.absent')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s, i) => (
                  <tr key={s.id} className={`transition-all ${absents.has(s.id) ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.nom} {s.prenom}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.id_massar || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleAbsent(s.id)}
                        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                          absents.has(s.id)
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'border-gray-300 text-transparent hover:border-red-300'
                        }`}>
                        {absents.has(s.id) && <X size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">{t('school.presentCount')}: <strong className="text-emerald-600">{students.length - absents.size}</strong></span>
            <span className="text-gray-500">{t('school.absentCount')}: <strong className="text-red-600">{absents.size}</strong></span>
            <span className="text-gray-500">{t('school.total')}: <strong>{students.length}</strong></span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">{t('school.recentSeances')}</h3>
        {historyLoading ? (
          <div className="text-center py-8"><Loader2 className="animate-spin text-violet-500 mx-auto" size={24} /></div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-400 font-medium">{t('school.noSeances')}</div>
        ) : (
          <div className="space-y-2">
            {history.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                  <ClipboardCheck size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{s.niveau} — {s.classe}</p>
                  <p className="text-xs text-gray-500">{new Date(s.date_seance).toLocaleDateString('fr-FR')} à {s.heure?.slice(0, 5)} · {s.enseignant_nom}{s.matiere ? ` · ${s.matiere}` : ''}{s.duree ? ` · ${s.duree}h` : ''}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{s.statut}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
