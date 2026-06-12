import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("ar") ? "ar" : "fr";

  const toggle = () => {
    const next = current === "fr" ? "ar" : "fr";
    i18n.changeLanguage(next);
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = next;
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-100 transition-all text-gray-500 hover:text-gray-700"
      title={current === "fr" ? "العربية" : "Français"}
    >
      <Globe size={14} />
      {current === "fr" ? "FR" : "AR"}
    </button>
  );
}
