import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, DollarSign, BookOpen, FileText, Settings, Bot,
  ChevronRight, X, ClipboardCheck, GraduationCap, BookMarked, MessageCircle,
} from "lucide-react";

function useNavSections() {
  const { t } = useTranslation();
  return [
    {
      label: t('sidebar.principal'),
      items: [
        { label: t('sidebar.dashboard'), path: "/dashboard", icon: LayoutDashboard, permission: null },
      ],
    },
    {
      label: t('sidebar.modules'),
      items: [
        { label: t('sidebar.rh'), path: "/rh", icon: Users, permission: ["hr:read_own", "hr:read_all"], badge: 3 },
        { label: t('sidebar.finance'), path: "/finance", icon: DollarSign, permission: ["finance:read", "finance:manage_expense", "finance:manage_revenue"] },
        { label: t('sidebar.school'), path: "/school-life", icon: BookOpen, permission: ["students:read", "students:manage"], excludeAdmin: true },
        { label: t('sidebar.documents'), path: "/documents", icon: FileText, permission: ["certificates:generate", "grades:manage"] },
        { label: t('sidebar.presence'), path: "/school-life/presence", icon: ClipboardCheck, permission: ["students:read"], employeeOnly: true },
        { label: t('sidebar.teacher'), path: "/teacher", icon: GraduationCap, permission: ["courses:read"], teacherOnly: true },
        { label: t('sidebar.student'), path: "/student", icon: BookMarked, permission: null, studentOnly: true },
        { label: t('sidebar.messages'), path: "#chat", icon: MessageCircle, permission: null, clickHandler: true },
        { label: t('sidebar.assistantIA'), path: "/assistant", icon: Bot, permission: null, adminDirectionOnly: true },
      ],
    },
    {
      label: t('sidebar.system'),
      items: [
        { label: t('sidebar.admin'), path: "/admin/users", icon: Settings, permission: "users:manage", adminOnly: true },
      ],
    },
  ];
}

export default function Sidebar({ isOpen, onToggle, user, hasPermission }) {
  const navigate = useNavigate();
  const navSections = useNavSections();
  const location = useLocation();

  const allNavPaths = navSections.flatMap(s => s.items.map(i => i.path));

  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (!location.pathname.startsWith(path + '/') && !location.pathname.startsWith(path)) return false;
    const moreSpecificMatch = allNavPaths.some(p =>
      p !== path && p.startsWith(path) && location.pathname.startsWith(p)
    );
    return !moreSpecificMatch;
  };

  const isItemVisible = (item) => {
    if (item.adminOnly) return user?.role === "administrateur";
    if (item.employeeOnly) return user?.role === "enseignant";
    if (item.teacherOnly) return user?.role === "enseignant";
    if (item.studentOnly) return user?.role === "eleve";
    if (item.excludeAdmin && user?.role === "administrateur") return false;
    if (item.adminDirectionOnly) return user?.role === "administrateur" || user?.role === "direction";
    if (item.permission) return hasPermission(item.permission);
    return true;
  };

  return (
    <>
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:relative lg:translate-x-0 z-30 h-screen w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col`}
      >
        <div className="p-5 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
              SGS
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">SGS</h2>
              <p className="text-[10px] text-gray-400 tracking-wide">Collège Borj Azzaitoune</p>
            </div>
            <button onClick={onToggle} className="lg:hidden ml-auto p-1 text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 mx-3 mt-3 bg-white/5 rounded-xl backdrop-blur-sm border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold shadow-sm bg-gradient-to-br from-blue-400 to-indigo-500">
              {user?.photo ? (
                <img src={`http://localhost:5000${user.photo}`} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.initiales || user?.nom?.charAt(0) || "U"
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-[11px] text-gray-400 capitalize truncate">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label} className="mb-6">
                <div className="px-3 mb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{section.label}</span>
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (item.clickHandler) { if (window.innerWidth < 1024) onToggle(); window.dispatchEvent(new CustomEvent('open-chat')); return; }
                        if (window.innerWidth < 1024) onToggle();
                      }}
                      className={`group flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 ${
                        active
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className={active ? "" : "text-gray-400 group-hover:text-white transition-colors"} />
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.badge && (
                          <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full">{item.badge}</span>
                        )}
                        {active && <ChevronRight size={16} className="animate-fade-in" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-gray-700/50 bg-gray-800/50">
          <div className="text-[11px] text-gray-500 space-y-0.5">
            <p>SGS v2.0</p>
            <p>© 2026 College Borj Azaitoune</p>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden animate-fade-in" onClick={onToggle} />
      )}
    </>
  );
}
