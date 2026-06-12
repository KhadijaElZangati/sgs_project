import { useState, useEffect, useRef } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { Plus, List, Clock, FileText, CheckCircle, XCircle, Printer, Loader2, AlertTriangle } from "lucide-react";
import { DataTable, StatusBadge, QuickActionButton } from "../../components/ui/DataTable";
import { pushToast } from "../../components/Notifications";

const getTypeLabels = (t) => ({
  attestation_travail: t('rh.workCertificate'),
  conge_maladie: t('rh.sickLeave'),
  conge_annuel: t('rh.annualLeave'),
  conge_exceptionnel: t('rh.exceptionalLeave'),
});

const getStatusConfig = (t) => ({
  "en attente": { label: t('rh.pending'), bg: "bg-amber-100 text-amber-800", dot: "bg-amber-400" },
  "approuvé":   { label: t('rh.approved'), bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  "approuve":   { label: t('rh.approved'), bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  "rejeté":     { label: t('rh.rejected'), bg: "bg-red-100 text-red-800", dot: "bg-red-500" },
  "refuse":     { label: t('rh.rejected'), bg: "bg-red-100 text-red-800", dot: "bg-red-500" },
});

function RHHeader({ user, hasPermission }) {
  const { t } = useTranslation();
  const location = useLocation();
  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-5 print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('rh.title')}</h1>
        <div className="flex gap-2 flex-wrap">
          <Link to="/rh/list"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              isActive("list") ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            <List size={16} /> {t('rh.myRequests')}
          </Link>
          {hasPermission("hr:create_request") && user.role !== "administrateur" && user.role !== "direction" && (
            <Link to="/rh/new"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive("new") ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              <Plus size={16} /> {t('rh.newRequest')}
            </Link>
          )}
          {hasPermission("hr:validate") && (
            <Link to="/rh/validation"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive("validation") ? "bg-amber-600 text-white shadow-sm" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}>
              <Clock size={16} /> {t('rh.toValidate')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RHModule({ user, api, hasPermission }) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const r = await api.get("/demandes-rh");
      setRequests(r.data.data || r.data);
    } catch { pushToast("error", t('rh.loadError')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  // Fixed filter: admins see all, employees see own
  const myRequests = requests.filter(r => hasPermission("hr:read_all") || r.employe_id === user?.id);

  return (
    <div className="min-h-full bg-gray-50 animate-fade-in">
      <RHHeader user={user} hasPermission={hasPermission} />
      <div className="p-6">
        <Routes>
          <Route index element={<Navigate to={user.role === "administrateur" || user.role === "direction" ? "validation" : "list"} replace />} />
          <Route path="list" element={<RHRequestsList requests={hasPermission("hr:read_all") ? requests : myRequests} user={user} loading={loading} />} />
          <Route path="new" element={<NewRHRequest api={api} user={user} onSuccess={fetchRequests} />} />
          <Route path="validation" element={<RHValidation requests={requests} api={api} onRefresh={fetchRequests} />} />
        </Routes>
      </div>
    </div>
  );
}

function RHRequestsList({ requests, user, loading }) {
  const { t } = useTranslation();
  const typeLabels = getTypeLabels(t);
  const statusConfig = getStatusConfig(t);
  const [printData, setPrintData] = useState(null);

  const handlePrint = (req) => {
    setPrintData(req);
    setTimeout(() => { window.print(); setPrintData(null); }, 500);
  };

  const columns = [
    { key: "employe_nom", label: t('rh.employee'), sortable: true, render: (r) => (
      <span className="font-medium text-gray-900">{r.employe_prenom} {r.employe_nom}</span>
    )},
    { key: "type", label: t('rh.type'), sortable: true, render: (r) => typeLabels[r.type] || r.type },
    { key: "statut", label: t('rh.status'), sortable: true, render: (r) => (
      <StatusBadge status={r.statut?.toLowerCase()} config={statusConfig} />
    )},
    { key: "date_creation", label: t('rh.date'), sortable: true, render: (r) => r.date_creation ? new Date(r.date_creation).toLocaleDateString("fr-FR") : "-" },
  ];

  const actions = (r) => (
    (user.role === "administrateur" || user.role === "direction") && r.type === "attestation_travail" && (r.statut === "approuvé" || r.statut === "approuve")
      ? <QuickActionButton icon={Printer} label={t('rh.print')} onClick={() => handlePrint(r)} color="blue" />
      : null
  );

  if (loading) return <DataTable columns={columns} data={[]} loading />;

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        searchable
        searchKeys={["employe_nom", "employe_prenom", "type"]}
        searchPlaceholder={t('rh.searchPlaceholder')}
        pageSize={10}
        emptyTitle={t('rh.noRequests')}
        emptyDescription={t('rh.noRequestsDesc')}
        actions={actions}
      />

      {printData && (
        <div className="hidden print:block fixed inset-0 z-50 bg-white p-12 text-black font-serif" dir="ltr">
          <div className="text-center mb-16 border-b-2 border-black pb-6">
            <h1 className="text-2xl font-black uppercase">{t('rh.printKingdom')}</h1>
            <h2 className="text-xl font-bold mt-2">{t('rh.printMinistry')}</h2>
            <p className="text-lg mt-1">{t('rh.printSchool')}</p>
          </div>
          <h1 className="text-4xl font-black text-center mb-16 uppercase underline underline-offset-8">{t('rh.printTitle')}</h1>
          <div className="text-xl leading-loose space-y-6 max-w-3xl mx-auto text-justify">
            <p>{t('rh.printCertify')}</p>
            <p>{t('rh.printCertifies')} <strong>{t('rh.printMrMme')} {printData.employe_prenom} {printData.employe_nom}</strong>,</p>
            <p>{t('rh.printEmployed')}</p>
            <p>{t('rh.printPurpose')}</p>
          </div>
          <div className="mt-32 text-right text-xl font-bold mr-12">
            <p>{t('rh.printDate')} {new Date().toLocaleDateString("fr-FR")}</p>
            <p className="mt-8">{t('rh.printSignature')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function NewRHRequest({ api, user, onSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ type: "attestation_travail", date_debut: "", date_fin: "", motif: "" });
  const [saving, setSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((formData.type === "conge_maladie" || formData.type === "conge_exceptionnel") && (!formData.date_debut || !formData.date_fin)) {
      pushToast("error", t('rh.datesRequired'));
      return;
    }
    setSaving(true);
    try {
      await api.post("/demandes-rh", { ...formData, employe_id: user.id });
      pushToast("success", t('rh.sentSuccess'));
      setFormData({ type: "attestation_travail", date_debut: "", date_fin: "", motif: "" });
      setUploadedFile(null);
      onSuccess();
    } catch {
      pushToast("error", t('rh.sendError'));
    } finally { setSaving(false); }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (file) setUploadedFile(file);
  };

  const isConge = formData.type === "conge_maladie" || formData.type === "conge_exceptionnel";

  return (
    <div className="animate-slide-up">
      <div className="flex flex-col lg:flex-row items-start gap-6">
        <div className="flex-1 w-full lg:max-w-2xl">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{t('rh.newFormTitle')}</h2>
            <p className="text-sm text-gray-500 mb-5">{t('rh.newFormDesc')}</p>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-5 text-sm text-blue-800">
              <span className="text-lg">ℹ️</span>
              <Trans i18nKey="rh.leaveBalance" values={{ days: 12 }} components={{ bold: <strong /> }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('rh.requestType')}</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all">
                  <option value="attestation_travail">{t('rh.attestationWork')}</option>
                  <option value="conge_maladie">{t('rh.sickLeave')}</option>
                  <option value="conge_exceptionnel">{t('rh.exceptionalLeave')}</option>
                </select>
              </div>

              {isConge && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('rh.startDate')}</label>
                    <input type="date" required value={formData.date_debut}
                      onChange={e => setFormData({...formData, date_debut: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('rh.endDate')}</label>
                    <input type="date" required value={formData.date_fin}
                      onChange={e => setFormData({...formData, date_fin: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('rh.reason')}</label>
                <textarea required value={formData.motif} onChange={e => setFormData({...formData, motif: e.target.value})}
                  placeholder={t('rh.reasonPlaceholder')}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('rh.attachment')}</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    dragOver ? "border-blue-400 bg-blue-50" : uploadedFile ? "border-emerald-300 bg-emerald-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFileDrop} className="hidden" />
                  {uploadedFile ? (
                    <div>
                      <div className="text-2xl mb-1">📎</div>
                      <div className="font-semibold text-sm text-gray-800">{uploadedFile.name}</div>
                      <div className="text-xs text-emerald-600 font-semibold mt-1">✓ {t('rh.fileLoaded')} · {Math.round(uploadedFile.size / 1024)} KB</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl mb-1">📎</div>
                      <div className="text-sm text-gray-500 font-medium">{t('rh.dropFile')}</div>
                      <div className="text-xs text-gray-400 mt-1">{t('rh.dropFileHint')}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setFormData({ type: "attestation_travail", date_debut: "", date_fin: "", motif: "" }); setUploadedFile(null); }}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  {t('rh.cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
                  {saving ? <><Loader2 size={16} className="animate-spin" /> {t('rh.sending')}</> : t('rh.send')}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-3">{t('rh.leaveBalanceCard')}</h3>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{t('rh.annual')}</span>
                <span className="font-bold text-gray-800">12 / 20 j</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: "60%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{t('rh.used')}</span>
                <span className="font-bold text-gray-800">8 j</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500" style={{ width: "40%" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-3">{t('rh.myRecentRequests')}</h3>
            <div className="space-y-4">
              {[
                { title: t('rh.workCertificate'), meta: t('rh.approved') + " · 02/02/2026", dot: "bg-emerald-500" },
                { title: t('rh.exceptionalLeave') + " (2 j)", meta: t('rh.pending') + " · 18/01/2026", dot: "bg-amber-500" },
                { title: t('rh.annualLeave') + " (5 j)", meta: t('rh.approved') + " · 12/12/2025", dot: "bg-emerald-500" },
                { title: t('rh.workCertificate'), meta: t('rh.approved') + " · 04/11/2025", dot: "bg-emerald-500" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${item.dot} border-2 border-white shadow-sm mt-0.5`} />
                    {i < 3 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RHValidation({ requests, api, onRefresh }) {
  const { t } = useTranslation();
  const typeLabels = getTypeLabels(t);
  const [modalReq, setModalReq] = useState(null);
  const [commentaire, setCommentaire] = useState("");
  const [actionType, setActionType] = useState(null);

  const pending = requests.filter(r => r.statut === "en attente");

  const openModal = (req, action) => {
    setModalReq(req);
    setActionType(action);
    setCommentaire("");
  };

  const executeAction = async () => {
    if (!modalReq || !actionType) return;
    try {
      await api.put(`/demandes-rh/${modalReq.id}`, { statut: actionType, commentaire });
      pushToast("success", actionType === "approuvé" ? t('rh.requestApproved') : t('rh.requestRejected'));
      onRefresh();
      setModalReq(null);
    } catch {
      pushToast("error", t('rh.updateError'));
    }
  };

  if (pending.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-600">{t('rh.noPending')}</h3>
        <p className="text-sm text-gray-400 mt-1">{t('rh.noPendingDesc')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {pending.map(req => (
        <div key={req.id} className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm hover:shadow-md transition-all animate-slide-up">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${
                req.employe_nom === "Benali" ? "from-blue-500 to-indigo-600" :
                req.employe_nom === "Ouahbi" ? "from-emerald-500 to-teal-600" :
                "from-amber-500 to-red-600"
              }`}>
                {(req.employe_prenom?.[0] || "") + (req.employe_nom?.[0] || "")}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">{t('rh.pending')}</span>
                  <span className="text-sm font-semibold text-gray-500">{typeLabels[req.type] || req.type}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{req.employe_prenom} {req.employe_nom}</h3>
                <p className="text-sm text-gray-600 mt-1">{req.motif}</p>
                {req.date_debut && (
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    {t('rh.period')}: {new Date(req.date_debut).toLocaleDateString("fr-FR")} → {new Date(req.date_fin).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <button onClick={() => openModal(req, "approuvé")}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all hover:-translate-y-0.5 shadow-sm">
              <CheckCircle size={16} /> {t('rh.approve')}
            </button>
            <button onClick={() => openModal(req, "rejeté")}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-all hover:-translate-y-0.5 shadow-sm">
              <XCircle size={16} /> {t('rh.reject')}
            </button>
          </div>
        </div>
      ))}

      {modalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{t('rh.validateTitle')}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{t('rh.ref')}: RH-2026-{String(modalReq.id).padStart(4, "0")}</p>
              </div>
              <button onClick={() => setModalReq(null)} className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200 transition text-lg">×</button>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                <span className="text-2xl">👤</span>
                <div>
                  <p className="font-bold text-sm text-gray-900">{modalReq.employe_prenom} {modalReq.employe_nom} — {typeLabels[modalReq.type] || modalReq.type}</p>
                  <p className="text-xs text-blue-700">
                    {modalReq.date_debut ? `${new Date(modalReq.date_debut).toLocaleDateString("fr-FR")} ${t('rh.periodFrom')} ${new Date(modalReq.date_fin).toLocaleDateString("fr-FR")}` : ""}
                    {modalReq.date_debut ? ` · ${Math.ceil((new Date(modalReq.date_fin) - new Date(modalReq.date_debut)) / 86400000) + 1} ${t('rh.joursOuvres')}` : ""}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{t('rh.attachments')}</p>
                  <p className="text-sm font-semibold text-gray-800">📎 certificat-médical.pdf</p>
                  <p className="text-xs text-emerald-600 mt-0.5">{t('rh.verified')}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{t('rh.leaveSolde')}</p>
                  <p className="text-sm font-semibold text-gray-800">12 {t('rh.daysAvailable')}</p>
                  <p className="text-xs text-blue-600 mt-0.5">{t('rh.afterLeave')} 7 {t('rh.daysRemaining')}</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('rh.comment')}</label>
                <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
                  placeholder={t('rh.commentPlaceholder')}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button onClick={() => { setModalReq(null); }}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  {t('rh.close')}
                </button>
                <button onClick={() => { setActionType("rejeté"); executeAction(); }}
                  className="px-4 py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-100 transition flex items-center gap-1.5">
                  ✗ {t('rh.refuse')}
                </button>
                <button onClick={() => { setActionType("approuvé"); executeAction(); }}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm">
                  ✓ {t('rh.approve')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
