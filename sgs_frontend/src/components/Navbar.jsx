import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { LogOut, User, Bell, Search, X, Menu, CheckCheck } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar({ user, api, onLogout, notifications, unreadCount: initialUnread = 0, onSearchToggle, onMenuToggle, onNotificationsUpdate }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") { setShowSearch(false); setShowNotif(false); } };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const notifList = notifications || [];
  const unread = notifList.filter(n => !n.lu).length;

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      onNotificationsUpdate?.(user?.id);
    } catch {}
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('time.justNow');
    if (mins < 60) return t('time.minutesAgo', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('time.hoursAgo', { count: hours });
    return new Date(dateStr).toLocaleDateString(i18n.language?.startsWith('ar') ? 'ar-MA' : 'fr-FR');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all" title={t('nav.menu')}>
            <Menu size={22} />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">{t('app.short')}</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">{t('app.title')}</h1>
            <p className="text-xs text-gray-400 hidden sm:block">{t('app.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="relative"
            onMouseEnter={() => setShowSearch(true)}
            onMouseLeave={() => { if (!searchValue) setShowSearch(false); }}
          >
            {showSearch ? (
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 animate-fade-in">
                <Search size={18} className="ml-3 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={t('nav.search')}
                  className="py-2 px-2 bg-transparent border-none outline-none text-sm text-gray-700 w-48 lg:w-72 focus:ring-0"
                  autoFocus
                />
                <button
                  onClick={() => { setSearchValue(""); setShowSearch(false); }}
                  className="pr-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title={t('common.search')}
              >
                <Search size={20} />
              </button>
            )}
          </div>

          <LanguageSwitcher />

          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title={t('nav.notifications')}>
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow animate-scale-in">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl z-50 border border-gray-200 animate-scale-in origin-top-right">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">{t('nav.notifications')}</span>
                  {unread > 0 && <span className="text-xs text-gray-500">{t('nav.unread', { count: unread })}</span>}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifList.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400">{t('nav.noNotifications')}</div>
                  ) : notifList.map((n) => (
                    <div key={n.id} onClick={() => { if (!n.lu) markAsRead(n.id); }} className={`flex items-start gap-3 p-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-all cursor-pointer ${!n.lu ? "bg-blue-50/50" : ""}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                        n.type?.includes("absence") ? "bg-red-100" :
                        n.type?.includes("Mise à jour") || n.type?.includes("rh") ? "bg-amber-100" :
                        "bg-blue-100"
                      }`}>
                        {n.type?.includes("absence") ? "⚠️" : n.type?.includes("Mise à jour") || n.type?.includes("rh") ? "📋" : "ℹ️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.lu ? "font-semibold text-gray-900" : "text-gray-600"}`}>{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{timeAgo(n.temps)}</p>
                      </div>
                      {!n.lu && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 hover:bg-gray-100 rounded-xl transition-all group"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm group-hover:shadow-md transition-shadow overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-500">
                {user?.photo ? (
                  <img src={`http://localhost:5000${user.photo}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.initiales || user?.nom?.charAt(0) || "U"
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-tight">{user?.prenom} {user?.nom}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-50 border border-gray-200 animate-scale-in origin-top-right">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-bold bg-gradient-to-br from-blue-500 to-indigo-500">
                  {user?.photo ? (
                    <img src={`http://localhost:5000${user.photo}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.initiales || user?.nom?.charAt(0) || "U"
                  )}
                </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user?.prenom} {user?.nom}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                    <User size={16} className="text-gray-400" />
                    {t('nav.profile')}
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all mt-0.5"
                  >
                    <LogOut size={16} />
                    {t('nav.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
