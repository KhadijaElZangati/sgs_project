import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users, DollarSign, BookOpen, FileText, AlertCircle,
  Clock, CheckCircle, XCircle, Plus, ArrowRight,
  TrendingUp, Briefcase, Sparkles, GraduationCap,
  Receipt, ShieldCheck, UserCheck, School,
  Loader2, ClipboardList,
} from "lucide-react";
import { LoadingPage, LoadingCard } from "../components/ui/LoadingSpinner";

function useStatusConfig() {
  const { t } = useTranslation();
  return {
    "en attente": { label: t('dashboard.status.pending'), bg: "bg-amber-100 text-amber-800", dot: "bg-amber-400" },
    "approuvé":   { label: t('dashboard.status.approved'), bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
    "rejeté":     { label: t('dashboard.status.rejected'), bg: "bg-red-100 text-red-800", dot: "bg-red-500" },
    "approuve":   { label: t('dashboard.status.approved'), bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
    "refuse":     { label: t('dashboard.status.rejected'), bg: "bg-red-100 text-red-800", dot: "bg-red-500" },
  };
}

function useTypeLabels() {
  const { t } = useTranslation();
  return {
    attestation_travail: t('rh.workCertificate'),
    conge_maladie: t('rh.sickLeave'),
    conge_annuel: t('rh.annualLeave'),
    conge_exceptionnel: t('rh.exceptionalLeave'),
  };
}

function useTimeAgo() {
  const { t, i18n } = useTranslation();
  return (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return t('time.today');
    if (days === 1) return t('time.yesterday');
    if (days < 7) return t('time.daysAgo', { count: days });
    return new Date(dateStr).toLocaleDateString(i18n.language?.startsWith('ar') ? 'ar-MA' : 'fr-FR');
  };
}

function StatCard({ icon: Icon, color, value, label, trend }) {
  const colorClasses = {
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
    cyan: "bg-cyan-500",
    orange: "bg-orange-500",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-slide-up">
      <div className={`w-10 h-10 ${colorClasses[color] || colorClasses.blue} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-2xl font-black text-gray-900">{value ?? "—"}</p>
      <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      {trend !== undefined && (
        <p className={`text-xs font-semibold mt-1 ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </p>
      )}
    </div>
  );
}

function DashboardHeader({ icon: Icon, label, title, subtitle, gradient, actions }) {
  const gradients = {
    admin: "from-slate-900 via-blue-950 to-indigo-900",
    direction: "from-emerald-900 via-teal-950 to-green-900",
    finance: "from-cyan-900 via-blue-950 to-indigo-900",
    surveillant: "from-amber-900 via-orange-950 to-yellow-900",
    employe: "from-slate-900 via-blue-950 to-indigo-900",
  };

  return (
    <div className={`bg-gradient-to-br ${gradients[gradient] || gradients.employe} px-4 lg:px-6 py-6 lg:py-10 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500 rounded-full opacity-5 blur-3xl translate-y-1/2 -translate-x-1/4" />
      <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon size={14} className="text-blue-300" />
            <span className="text-blue-300 text-xs font-medium uppercase tracking-widest">{label}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-blue-200 mt-1 text-sm">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </div>
  );
}

function RequestCard({ req, onClick }) {
  const { t } = useTranslation();
  const STATUS_CONFIG = useStatusConfig();
  const TYPE_LABELS = useTypeLabels();
  const timeAgo = useTimeAgo();
  const sc = STATUS_CONFIG[req.statut?.toLowerCase()] || { label: req.statut, bg: "bg-gray-100 text-gray-700" };
  return (
    <div onClick={onClick} className="bg-gray-50 rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-100 transition-all duration-200 group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${sc.bg}`}>
        <Clock size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{TYPE_LABELS[req.type] || req.type}</p>
        <p className="text-xs text-gray-500">{req.employeeName || timeAgo(req.date_creation)}</p>
      </div>
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} flex-shrink-0`}>
        {sc.label}
      </span>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick, color = "blue" }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    red: "bg-red-50 text-red-700 hover:bg-red-100",
    amber: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    orange: "bg-orange-50 text-orange-700 hover:bg-orange-100",
    purple: "bg-purple-50 text-purple-700 hover:bg-purple-100",
  };

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${colorMap[color] || colorMap.blue}`}>
      <Icon size={16} />
      {label}
    </button>
  );
}

function EmployeeDashboard({ user, api, navigate }) {
  const { t, i18n } = useTranslation();
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/demandes-rh")
      .then(r => setMyRequests((r.data.data || r.data).filter(req => req.employe_id === user.id)))
      .catch(e => setError(t('dashboard.loadError')))
      .finally(() => setLoading(false));
  }, [api, user.id, t]);

  if (error) {
    return (
      <div className="min-h-full bg-gray-50">
        <DashboardHeader icon={Sparkles} label={t('dashboard.employeeSpace')} gradient="employe"
          title={`${t('dashboard.greeting')}, ${user?.prenom} !`}
          subtitle={new Date().toLocaleDateString(i18n.language?.startsWith('ar') ? 'ar-MA' : 'fr-FR', { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          actions={<button onClick={() => navigate("/rh/new")} className="flex items-center gap-2 px-5 py-3 bg-white text-blue-900 rounded-xl font-semibold text-sm hover:bg-blue-50 transition shadow-lg"><Plus size={16} /> {t('rh.newRequest')}</button>}
        />
        <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div></div>
      </div>
    );
  }

  const pending  = myRequests.filter(r => r.statut === "en attente");
  const approved = myRequests.filter(r => r.statut === "approuvé" || r.statut === "approuve");
  const rejected = myRequests.filter(r => r.statut === "rejeté" || r.statut === "refuse");
  const recent   = [...myRequests].slice(0, 4);

  return (
    <div className="min-h-full bg-gray-50 animate-fade-in">
      <DashboardHeader icon={Sparkles} label={t('dashboard.employeeSpace')} gradient="employe"
        title={`${t('dashboard.greeting')}, ${user?.prenom} !`}
        subtitle={new Date().toLocaleDateString(i18n.language?.startsWith('ar') ? 'ar-MA' : 'fr-FR', { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={<button onClick={() => navigate("/rh/new")} className="flex items-center gap-2 px-5 py-3 bg-white text-blue-900 rounded-xl font-semibold text-sm hover:bg-blue-50 transition shadow-lg"><Plus size={16} /> {t('rh.newRequest')}</button>}
      />
      <div className="p-6 space-y-6 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{t('dashboard.myRequests')}</h2>
              <button onClick={() => navigate("/rh/list")} className="text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors">
                {t('common.seeAll')} <ArrowRight size={12} className="inline" />
              </button>
            </div>
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 size={22} className="animate-spin text-blue-400" /></div>
            ) : recent.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText size={22} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm font-medium">{t('dashboard.noRequests')}</p>
                <button onClick={() => navigate("/rh/new")} className="mt-3 text-sm text-blue-600 font-semibold hover:text-blue-800">
                  {t('dashboard.createRequest')} →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map(req => <RequestCard key={req.id} req={req} onClick={() => navigate("/rh/list")} />)}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-slide-up">
              <h2 className="font-bold text-gray-900 mb-4">{t('common.quickActions')}</h2>
              <div className="space-y-2.5">
                <QuickAction icon={FileText} label={t('rh.workCertificate')} onClick={() => navigate("/rh/new")} color="blue" />
                <QuickAction icon={Briefcase} label={t('rh.sickLeave')} onClick={() => navigate("/rh/new")} color="red" />
                <QuickAction icon={Clock} label={t('rh.annualLeave')} onClick={() => navigate("/rh/new")} color="amber" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ user, api, navigate }) {
  const { t } = useTranslation();
  const STATUS_CONFIG = useStatusConfig();
  const TYPE_LABELS = useTypeLabels();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/dashboard/stats")
      .then(r => setStats(r.data))
      .catch(() => setError(t('dashboard.statsError')))
      .finally(() => setLoading(false));
  }, [api, t]);

  if (loading) return <div className="min-h-full bg-gray-50"><div className="p-6"><LoadingCard /></div></div>;
  if (error) return <div className="min-h-full bg-gray-50 p-6"><div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div></div>;

  return (
    <div className="min-h-full bg-gray-50 animate-fade-in">
      <DashboardHeader icon={ShieldCheck} label={t('dashboard.adminPanel')} gradient="admin"
        title={`${t('dashboard.greeting')}, ${user?.prenom} !`}
        subtitle={t('dashboard.adminSubtitle')}
      />
      <div className="p-6 space-y-6 -mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} color="blue" value={stats?.activeUsers} label={t('dashboard.activeAccounts')} trend={stats?.usersTrend} />
          <StatCard icon={Clock} color="amber" value={stats?.recentRequests?.filter(r => (r.statut === "en attente")).length || 0} label={t('dashboard.rhToValidate')} />
          <StatCard icon={DollarSign} color="emerald" value={stats?.monthlyRevenue ? `${(stats.monthlyRevenue/1000).toFixed(1)}k` : "—"} label={t('dashboard.monthlyRevenue')} trend={stats?.revenueTrend} />
          <StatCard icon={GraduationCap} color="purple" value={stats?.totalStudents} label={t('dashboard.enrolledStudents')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-slide-up">
            <h2 className="font-bold text-gray-900 mb-4">{t('dashboard.rhGlobalView')}</h2>
            {stats?.recentRequests?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentRequests.slice(0, 6).map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3.5 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{TYPE_LABELS[req.type] || req.type}</p>
                      <p className="text-xs text-gray-500">{req.employeeName}</p>
                    </div>
                    <button onClick={() => navigate("/rh/validation")} className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${(STATUS_CONFIG[req.statut?.toLowerCase()] || {bg:"bg-gray-100 text-gray-700"}).bg}`}>
                      {(STATUS_CONFIG[req.statut?.toLowerCase()] || {label:req.statut}).label}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-6 text-center">{t('dashboard.noRecentRequests')}</p>
            )}
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-slide-up">
              <h2 className="font-bold text-gray-900 mb-4">{t('common.tasks')}</h2>
              <div className="space-y-2.5">
                <QuickAction icon={CheckCircle} label={t('dashboard.validateRH')} onClick={() => navigate("/rh/validation")} color="amber" />
                <QuickAction icon={Users} label={t('dashboard.manageUsers')} onClick={() => navigate("/admin/users")} color="blue" />
                <QuickAction icon={FileText} label={t('dashboard.schoolCertificates')} onClick={() => navigate("/documents/certificates")} color="orange" />
                <QuickAction icon={DollarSign} label={t('dashboard.seeFinance')} onClick={() => navigate("/finance/list")} color="emerald" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DirectionDashboard({ user, api, navigate }) {
  const { t, i18n } = useTranslation();
  const TYPE_LABELS = useTypeLabels();
  const [stats, setStats] = useState(null);
  const [financeStats, setFinanceStats] = useState(null);
  const [absenceChart, setAbsenceChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/stats"),
      api.get("/dashboard/finance-stats"),
      api.get("/dashboard/absence-chart"),
    ]).then(([s, f, a]) => {
      setStats(s.data);
      setFinanceStats(f.data);
      setAbsenceChart(a.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [api]);

  const handleApprove = async (id, statut) => {
    setApproving(id);
    try {
      await api.put(`/demandes-rh/${id}`, { statut });
      const s = await api.get("/dashboard/stats");
      setStats(s.data);
    } catch {}
    finally { setApproving(null); }
  };

  const now = new Date();
  const locale = i18n.language?.startsWith('ar') ? 'ar-MA' : 'fr-FR';
  const dateStr = now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (loading) return <div className="min-h-full bg-gray-50"><div className="p-6"><LoadingCard /></div></div>;

  const pendingReqs = stats?.recentRequests?.filter(r => r.statut === "en attente") || [];
  const maxBar = Math.max(...(absenceChart?.weeks || [1]), 1);

  return (
    <div className="min-h-full bg-gray-50 animate-fade-in">
      <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-green-900 px-6 py-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500 rounded-full opacity-5 blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <School size={14} className="text-emerald-300" />
              <span className="text-emerald-300 text-xs font-medium uppercase tracking-widest">{t('dashboard.direction')}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{t('dashboard.greeting')}, {user?.prenom || t('dashboard.director')}</h1>
            <p className="text-emerald-200 mt-1 text-sm">{dateStr} · {t('dashboard.schoolYear', { year: '2025–2026' })}</p>
          </div>
          <div className="flex gap-2">
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6 -mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={GraduationCap} color="blue" value={stats?.totalStudents ?? 0} label={t('dashboard.enrolledStudents')} />
          <StatCard icon={Users} color="emerald" value={stats?.staffCount ?? 0} label={t('dashboard.staffCount')} />
          <StatCard icon={ClipboardList} color="amber" value={pendingReqs.length} label={t('dashboard.rhRequests')} />
          <StatCard icon={DollarSign} color="red" value={financeStats?.solde ? `${(financeStats.solde/1000).toFixed(0)}k` : "0"} label={t('dashboard.monthlyBalance')} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">{t('dashboard.absences')} — {now.toLocaleDateString(locale, { month: "long", year: "numeric" })}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{t('dashboard.perWeek')}</p>
              </div>
            </div>
            <div className="flex items-end gap-1 h-16 mt-2">
              {(absenceChart?.weeks || Array(12).fill(0)).map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-sm transition-all hover:opacity-75"
                    style={{
                      height: `${Math.max((val / maxBar) * 100, 8)}%`,
                      backgroundColor: i % 3 === 0 ? '#2563EB' : i % 2 === 0 ? '#60A5FA' : '#93C5FD',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-500 font-mono">
              {["S1","S2","S3","S4","S5","S6","S7","S8","S9","S10","S11","S12"].map((s, i) => (
                <span key={i} className="flex-1 text-center text-[9px] text-gray-400">{s}</span>
              ))}
            </div>
            <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">{t('dashboard.totalAbsences')} : <strong className="text-gray-900">{absenceChart?.total || 0}</strong></span>
              <span className="text-xs text-gray-500">{t('dashboard.justified')} : <strong className="text-emerald-600">{absenceChart?.justifieesPercent || 0}%</strong></span>
              <span className="text-xs text-gray-500">{t('dashboard.unjustified')} : <strong className="text-red-600">{absenceChart?.injustifieesPercent || 0}%</strong></span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">{t('dashboard.recentRHRequests')}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{t('dashboard.pendingValidation')}</p>
              </div>
              <button onClick={() => navigate("/rh/validation")} className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                {t('common.seeAll')} →
              </button>
            </div>
            <div className="space-y-3">
              {pendingReqs.slice(0, 3).map(req => (
                <div key={req.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-blue-500 to-indigo-600">
                    {(req.employeeName?.[0] || "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{req.employeeName || t('common.notAvailable')}</p>
                    <p className="text-xs text-gray-500 truncate">{TYPE_LABELS[req.type] || req.type}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {t('dashboard.status.pending')}
                  </span>
                  <button
                    onClick={() => handleApprove(req.id, "approuvé")}
                    disabled={approving === req.id}
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 text-xs font-bold"
                  >
                    ✓
                  </button>
                </div>
              ))}
              {pendingReqs.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">{t('dashboard.noPendingRequests')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanceDashboard({ user, api, navigate }) {
  const { t } = useTranslation();
  const [financeStats, setFinanceStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/finance-stats")
      .then(r => setFinanceStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  if (loading) return <div className="min-h-full bg-gray-50"><div className="p-6"><LoadingCard /></div></div>;

  return (
    <div className="min-h-full bg-gray-50 animate-fade-in">
      <DashboardHeader icon={Receipt} label={t('dashboard.financeService')} gradient="finance"
        title={`${t('dashboard.greeting')}, ${user?.prenom} !`}
        subtitle={t('dashboard.financeSubtitle')}
      />
      <div className="p-6 space-y-6 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={TrendingUp} color="emerald" value={`${financeStats?.totalRevenus?.toLocaleString() ?? 0} DH`} label={t('finance.revenue')} />
          <StatCard icon={TrendingUp} color="red" value={`${financeStats?.totalDepenses?.toLocaleString() ?? 0} DH`} label={t('finance.expenses')} />
          <StatCard icon={DollarSign} color="blue" value={`${financeStats?.solde?.toLocaleString() ?? 0} DH`} label={t('finance.balance')} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-slide-up">
          <h2 className="font-bold text-gray-900 mb-4">{t('common.quickActions')}</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("/finance/new")} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition shadow-sm"><Plus size={16}/> {t('finance.newOperation')}</button>
            <button onClick={() => navigate("/finance/list")} className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"><TrendingUp size={16}/> {t('finance.viewOperations')}</button>
            <button onClick={() => navigate("/finance/report")} className="flex items-center gap-2 px-5 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-semibold text-sm hover:bg-emerald-200 transition"><Receipt size={16}/> {t('finance.financialReport')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SurveillantDashboard({ user, api, navigate }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/school-life-stats")
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  if (loading) return <div className="min-h-full bg-gray-50"><div className="p-6"><LoadingCard /></div></div>;

  return (
    <div className="min-h-full bg-gray-50 animate-fade-in">
      <DashboardHeader icon={UserCheck} label={t('dashboard.surveillance')} gradient="surveillant"
        title={`${t('dashboard.greeting')}, ${user?.prenom} !`}
        subtitle={t('dashboard.surveillanceSubtitle')}
      />
      <div className="p-6 space-y-6 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={GraduationCap} color="blue" value={stats?.totalEleves} label={t('school.students')} />
          <StatCard icon={BookOpen} color="purple" value={stats?.niveaux} label={t('school.levels')} />
          <StatCard icon={Clock} color="orange" value={stats?.absentsToday} label={t('dashboard.absentToday')} />
          <StatCard icon={AlertCircle} color="red" value={stats?.alertes} label={t('dashboard.alertes')} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-slide-up">
            <h2 className="font-bold text-gray-900 mb-4">{t('dashboard.absences')}</h2>
            <div className="flex gap-4">
              <div className="flex-1 bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-emerald-700">{stats?.justifieesToday ?? 0}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">{t('dashboard.justified')}</p>
              </div>
              <div className="flex-1 bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-red-700">{stats?.injustifieesToday ?? 0}</p>
                <p className="text-xs text-red-600 font-medium mt-1">{t('dashboard.unjustified')}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-500">{t('school.totalAbsences')} : <strong className="text-gray-900">{stats?.totalAbsences ?? 0}</strong></span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{t('dashboard.alerts')}</h2>
                <p className="text-xs text-gray-500">{t('dashboard.alertThreshold')}</p>
              </div>
            </div>
            <p className="text-3xl font-black text-red-600">{stats?.alertes ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">{t('dashboard.studentsExceedThreshold')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-slide-up">
          <h2 className="font-bold text-gray-900 mb-4">{t('common.quickActions')}</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("/school-life/students")} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition shadow-sm"><Users size={16}/> {t('school.studentList')}</button>
            <button onClick={() => navigate("/school-life/absences")} className="flex items-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition shadow-sm"><Clock size={16}/> {t('school.manageAbsences')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ user, api, hasPermission }) {
  const navigate = useNavigate();
  const role = user?.role;
  if (role === "administrateur") return <AdminDashboard user={user} api={api} navigate={navigate} />;
  if (role === "direction") return <DirectionDashboard user={user} api={api} navigate={navigate} />;
  if (role === "service_financier") return <FinanceDashboard user={user} api={api} navigate={navigate} />;
  if (role === "surveillant_general") return <SurveillantDashboard user={user} api={api} navigate={navigate} />;
  return <EmployeeDashboard user={user} api={api} navigate={navigate} />;
}
