import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SearchInput({ value, onChange, placeholder, expanded = false, onToggle }) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${
        expanded ? "bg-white border border-gray-300 shadow-sm rounded-lg" : ""
      }`}
      onMouseEnter={() => onToggle?.(true)}
      onMouseLeave={() => onToggle?.(false)}
    >
      {expanded ? (
        <>
          <Search size={18} className="text-gray-400 ml-3 flex-shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? t('common.search')}
            className="py-2 pr-2 bg-transparent border-none outline-none text-sm text-gray-700 w-48 lg:w-64 focus:ring-0"
            autoFocus
          />
          {value && (
            <button onClick={() => onChange("")} className="pr-2 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={16} />
            </button>
          )}
        </>
      ) : (
        <button
          onClick={() => onToggle?.(true)}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          title={placeholder ?? t('common.search')}
        >
          <Search size={20} />
        </button>
      )}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder }) {
  const { t } = useTranslation();
  return (
    <div className="relative group">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t('common.search')}
        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
