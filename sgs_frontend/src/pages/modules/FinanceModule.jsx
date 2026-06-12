import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { Plus, List, BarChart3, Loader2, Search, TrendingUp, DollarSign, ArrowUpCircle, ArrowDownCircle, Receipt } from "lucide-react";
import { DataTable, StatusBadge } from "../../components/ui/DataTable";
import { pushToast } from "../../components/Notifications";
import { useTranslation } from "react-i18next";

const CATEGORIES = {
  revenu: ["Inscription", "Frais Scolaires", "Subventions", "Dons", "Autre"],
  depense: ["Maintenance", "Matériel", "Salaires", "Électricité", "Eau", "Fournitures", "Autre"],
};

function FinanceHeader({ hasPermission }) {
  const { t } = useTranslation();
  const location = useLocation();
  const isActive = (path) => location.pathname.includes(path);
  const [periodFilter, setPeriodFilter] = useState("month");

  const periods = [
    { key: "year", label: t('finance.year') },
    { key: "month", label: t('finance.month') },
    { key: "quarter", label: t('finance.quarter') },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('finance.title')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{t('finance.headerSubtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {periods.map(p => (
              <button key={p.key} onClick={() => setPeriodFilter(p.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-all ${
                  periodFilter === p.key ? "text-gray-900 bg-white shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}>{p.label}</button>
            ))}
          </div>
          {hasPermission("finance:manage_expense") && (
            <Link to="/finance/new"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive("new") ? "bg-blue-600 text-white shadow-sm" : "bg-blue-600 text-white shadow-sm"
              }`}><Plus size={16} /> {t('finance.newOperation')}</Link>
          )}
          {isActive("report") && (
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              {t('finance.exportPDF')}
            </button>
          )}
          {hasPermission("finance:generate_bilan") && (
            <Link to="/finance/report"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive("report") ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}><BarChart3 size={16} /></Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FinanceModule({ user, api, hasPermission }) {
  return (
    <div className="min-h-full bg-gray-50 animate-fade-in">
      <FinanceHeader hasPermission={hasPermission} />
      <div className="p-6">
        <Routes>
          <Route index element={<Navigate to="list" replace />} />
          <Route path="list" element={<OperationsList api={api} />} />
          <Route path="new" element={<NewOperation api={api} user={user} />} />
          <Route path="report" element={<BilanReport api={api} />} />
        </Routes>
      </div>
    </div>
  );
}

function Sparkline({ values, color }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8 mt-2">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm" style={{ height: `${(v / max) * 100}%`, background: color }} />
      ))}
    </div>
  );
}

function OperationsList({ api }) {
  const { t } = useTranslation();
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    api.get("/operations").then(r => setOps(r.data.data || r.data)).catch(() => pushToast("error", t('finance.loadError'))).finally(() => setLoading(false));
  }, []);

  const filtered = typeFilter === "all" ? ops : ops.filter(o => o.type === typeFilter);
  const totalRevenus = ops.filter(o => o.type === "revenu").reduce((a, b) => a + parseFloat(b.montant || 0), 0);
  const totalDepenses = ops.filter(o => o.type === "depense").reduce((a, b) => a + parseFloat(b.montant || 0), 0);
  const solde = totalRevenus - totalDepenses;

  const columns = [
    { key: "type", label: t('finance.type'), sortable: true, render: (o) => (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
        o.type === "revenu" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}>
        {o.type === "revenu" ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
        {o.type === "revenu" ? t('finance.revenu') : t('finance.depense')}
      </span>
    )},
    { key: "categorie", label: t('finance.category'), sortable: true, render: (o) => <span className="font-medium text-gray-600">{o.categorie || "—"}</span> },
    { key: "description", label: t('finance.description'), render: (o) => <span className="text-gray-700">{o.description || "—"}</span> },
    { key: "montant", label: t('finance.amount'), sortable: true, render: (o) => <span className="font-bold text-gray-900">{parseFloat(o.montant).toLocaleString()} DH</span> },
    { key: "date", label: t('finance.date'), sortable: true, render: (o) => o.date ? new Date(o.date).toLocaleDateString("fr-FR") : "—" },
  ];

  const sparkRev = [50, 70, 45, 80, 60, 95];
  const sparkDep = [60, 40, 75, 55, 65, 80];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" style={{ borderTop: "3px solid #059669" }}>
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">{t('finance.totalRevenus')}</p>
          <p className="text-2xl font-black text-gray-900 tracking-tight">{totalRevenus.toLocaleString()}</p>
          <p className="text-[11px] text-gray-500">{t('finance.period')}</p>
          <Sparkline values={sparkRev} color="#86EFAC" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" style={{ borderTop: "3px solid #DC2626" }}>
          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">{t('finance.totalDepenses')}</p>
          <p className="text-2xl font-black text-gray-900 tracking-tight">{totalDepenses.toLocaleString()}</p>
          <p className="text-[11px] text-gray-500">{t('finance.period')}</p>
          <Sparkline values={sparkDep} color="#FCA5A5" />
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-blue-950 rounded-2xl p-5 shadow-sm text-white">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">{t('finance.balance')}</p>
          <p className="text-2xl font-black tracking-tight text-white">+{solde.toLocaleString()}</p>
          <p className="text-[11px] text-blue-300">{t('finance.balanceLabel')}</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs">
              <span className="text-blue-300">{t('finance.budgetRate')}</span>
              <span className="text-blue-400 font-bold">71%</span>
            </div>
            <div className="bg-white/10 rounded-full h-1.5 mt-1 overflow-hidden">
              <div className="h-full rounded-full bg-blue-400" style={{ width: "71%" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-gray-900">{t('finance.latestOps')}</h2>
        <div className="flex gap-2 flex-wrap">
          {["all", "revenu", "depense"].map(typ => (
            <button key={typ} onClick={() => setTypeFilter(typ)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === typ ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {typ === "all" ? t('finance.allTypes') : typ === "revenu" ? t('finance.revenus') : t('finance.depenses')}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchable
        searchKeys={["description", "categorie"]}
        searchPlaceholder={t('finance.searchPlaceholder')}
        pageSize={10}
        emptyTitle={t('finance.noOps')}
        emptyDescription={t('finance.noOpsDesc')}
      />
    </div>
  );
}

function NewOperation({ api, user }) {
  const { t } = useTranslation();
  const [type, setType] = useState("revenu");
  const [categorie, setCategorie] = useState(CATEGORIES.revenu[0]);
  const [description, setDescription] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setCategorie(CATEGORIES[type][0]); }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!montant || parseFloat(montant) <= 0) {
      pushToast("error", t('finance.invalidAmount'));
      return;
    }
    setSaving(true);
    try {
      await api.post("/operations", { type, categorie, description, montant: parseFloat(montant), date });
      pushToast("success", t('finance.savedSuccess'));
      setDescription(""); setMontant(""); setDate(new Date().toISOString().split("T")[0]);
    } catch {
      pushToast("error", t('finance.saveError'));
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('finance.newOpTitle')}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{t('finance.type')}</label>
              <div className="flex gap-2 flex-wrap">
                {["revenu", "depense"].map(typ => (
                  <button key={typ} type="button" onClick={() => setType(typ)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      type === typ ? (typ === "revenu" ? "bg-emerald-600 text-white shadow-sm" : "bg-red-600 text-white shadow-sm") : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>
                    {typ === "revenu" ? t('finance.revenu') : t('finance.depense')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{t('finance.category')}</label>
              <select value={categorie} onChange={e => setCategorie(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none bg-white transition-all">
                {CATEGORIES[type]?.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{t('finance.description')}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
              placeholder={t('finance.descriptionPlaceholder')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{t('finance.amountLabel')}</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" step="0.01" min="0" value={montant} onChange={e => setMontant(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="0.00" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{t('finance.date')}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="animate-spin" size={18} /> {t('finance.saving')}</> : <><Plus size={18} /> {t('finance.save')}</>}
          </button>
        </form>
      </div>
    </div>
  );
}

function BilanReport({ api }) {
  const { t } = useTranslation();
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/operations").then(r => setOps(r.data.data || r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalRevenus = ops.filter(o => o.type === "revenu").reduce((a, b) => a + parseFloat(b.montant || 0), 0);
  const totalDepenses = ops.filter(o => o.type === "depense").reduce((a, b) => a + parseFloat(b.montant || 0), 0);
  const solde = totalRevenus - totalDepenses;

  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-blue-500" size={30} />
        <p className="text-sm text-gray-400">{t('finance.loadingReport')}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="print-only text-center mb-8">
        <p className="text-lg font-bold">Collège Borj Azaitoune</p>
        <p className="text-sm">Année scolaire 2025/2026</p>
        <hr className="my-2 border-gray-400" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm no-print">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Receipt size={28} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">{t('finance.reportTitle')}</h2>
        <p className="text-gray-500">{t('finance.reportDate')} {today}</p>
      </div>

      <h2 className="hidden print:block text-xl font-bold text-center mb-4">{t('finance.reportTitle')} — {today}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">{t('finance.totalRevenus')}</p>
          <p className="text-3xl font-black text-emerald-700">{totalRevenus.toLocaleString()} DH</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-red-200 p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">{t('finance.totalDepenses')}</p>
          <p className="text-3xl font-black text-red-700">{totalDepenses.toLocaleString()} DH</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">{t('finance.solde')}</p>
          <p className={`text-3xl font-black ${solde >= 0 ? "text-blue-700" : "text-red-700"}`}>{solde.toLocaleString()} DH</p>
        </div>
      </div>

      {ops.length > 0 && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">{t('finance.detailByCategory')}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-semibold text-gray-600">{t('finance.category')}</th>
                  <th className="text-right py-2 font-semibold text-emerald-600">{t('finance.revenus')}</th>
                  <th className="text-right py-2 font-semibold text-red-600">{t('finance.depenses')}</th>
                  <th className="text-right py-2 font-semibold text-gray-700">{t('finance.solde')}</th>
                </tr>
              </thead>
              <tbody>
                {[...new Set(ops.map(o => o.categorie).filter(Boolean))].map(cat => {
                  const catRevenus = ops.filter(o => o.type === "revenu" && o.categorie === cat).reduce((a, b) => a + parseFloat(b.montant || 0), 0);
                  const catDepenses = ops.filter(o => o.type === "depense" && o.categorie === cat).reduce((a, b) => a + parseFloat(b.montant || 0), 0);
                  return (
                    <tr key={cat} className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-800">{cat}</td>
                      <td className="py-2 text-right text-emerald-700 font-medium">{catRevenus > 0 ? `${catRevenus.toLocaleString()} DH` : "—"}</td>
                      <td className="py-2 text-right text-red-700 font-medium">{catDepenses > 0 ? `${catDepenses.toLocaleString()} DH` : "—"}</td>
                      <td className={`py-2 text-right font-bold ${(catRevenus - catDepenses) >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {(catRevenus - catDepenses).toLocaleString()} DH
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-bold text-base">
                  <td className="py-3 text-gray-900">{t('finance.total')}</td>
                  <td className="py-3 text-right text-emerald-700">{totalRevenus.toLocaleString()} DH</td>
                  <td className="py-3 text-right text-red-700">{totalDepenses.toLocaleString()} DH</td>
                  <td className={`py-3 text-right ${solde >= 0 ? "text-emerald-700" : "text-red-700"}`}>{solde.toLocaleString()} DH</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <h3 className="font-bold text-gray-900 px-6 pt-5 pb-0">{t('finance.operationsList')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('finance.type')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('finance.category')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('finance.description')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">{t('finance.amount')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">{t('finance.date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ops.map(op => (
                    <tr key={op.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                          op.type === "revenu" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          {op.type === "revenu" ? t('finance.revenu') : t('finance.depense')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{op.categorie || "—"}</td>
                      <td className="px-4 py-2.5 text-gray-600 max-w-xs truncate">{op.description || "—"}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-900">{parseFloat(op.montant).toLocaleString()} DH</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{op.date ? new Date(op.date).toLocaleDateString("fr-FR") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {ops.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-gray-400 text-center py-4">{t('finance.noData')}</p>
        </div>
      )}

      <div className="print-only text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-300">
        <p>{t('finance.reportGenerated')} {today} — Collège Borj Azaitoune</p>
      </div>
    </div>
  );
}
