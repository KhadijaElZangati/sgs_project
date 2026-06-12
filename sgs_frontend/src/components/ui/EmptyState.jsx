import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EmptyState({ icon: Icon = Inbox, title, description = "", action }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-600 mb-1">{title ?? t('common.noData')}</h3>
      {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
      {action}
    </div>
  );
}
