import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X, Filter } from "lucide-react";
import { Pagination } from "./Pagination";
import { EmptyState } from "./EmptyState";
import { LoadingSpinner } from "./LoadingSpinner";
import { useTranslation } from "react-i18next";

function SortIcon({ direction }) {
  if (direction === "asc") return <ChevronUp size={14} className="text-blue-600" />;
  if (direction === "desc") return <ChevronDown size={14} className="text-blue-600" />;
  return <ChevronsUpDown size={14} className="text-gray-300" />;
}

export function DataTable({
  columns = [],
  data = [],
  loading = false,
  pageSize = 10,
  searchable = false,
  searchPlaceholder,
  searchKeys = [],
  emptyTitle,
  emptyDescription = "",
  emptyAction,
  onRowClick,
  actions,
  className = "",
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(null);
  const { t } = useTranslation();

  const filtered = useMemo(() => {
    if (!search || !searchKeys.length) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const val = key.split(".").reduce((o, k) => o?.[k], row);
        return val?.toString().toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = sortKey.split(".").reduce((o, k) => o?.[k], a) ?? "";
      const vb = sortKey.split(".").reduce((o, k) => o?.[k], b) ?? "";
      const cmp = va.toString().localeCompare(vb.toString(), "fr", { numeric: true });
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="animate-pulse p-6 space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="h-10 bg-gray-50 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {searchable && (
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder={searchPlaceholder ?? t('common.search')}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </div>
        )}
        <EmptyState title={emptyTitle ?? t('common.noData')} description={emptyDescription} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {searchable && (
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder={searchPlaceholder ?? t('common.search')}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                    col.sortable ? "cursor-pointer select-none hover:bg-gray-100/50 transition-colors" : ""
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <SortIcon direction={sortKey === col.key ? sortDir : null} />}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={`transition-all duration-150 ${
                  onRowClick ? "cursor-pointer hover:bg-blue-50/50" : "hover:bg-gray-50/50"
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {col.render ? col.render(row) : col.key.split(".").reduce((o, k) => o?.[k], row) ?? "-"}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 border-t border-gray-100">
        <div className="flex items-center justify-between py-3">
          <p className="text-xs text-gray-500">
            {t('common.result', { count: sorted.length })}
            {search ? ` (${t('common.filteredOn')} ${data.length})` : ""}
          </p>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status, config }) {
  const s = config?.[status] || {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-700",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg || "bg-gray-100"} ${s.text || "text-gray-700"}`}>
      {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
      {s.label || status}
    </span>
  );
}

export function QuickActionButton({ icon: Icon, label, onClick, color = "blue" }) {
  const colorMap = {
    blue: "text-blue-600 hover:bg-blue-50",
    green: "text-emerald-600 hover:bg-emerald-50",
    red: "text-red-600 hover:bg-red-50",
    amber: "text-amber-600 hover:bg-amber-50",
    gray: "text-gray-600 hover:bg-gray-100",
  };
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-2 rounded-lg transition-all ${colorMap[color] || colorMap.blue}`}
    >
      <Icon size={16} />
    </button>
  );
}
