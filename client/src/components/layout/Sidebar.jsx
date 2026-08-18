import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Video,
  Code2,
  Target,
  BarChart3,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

const Sidebar = () => {
  const { darkMode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/jobs", label: "Jobs", icon: Briefcase },
    { path: "/resumes", label: "Resumes", icon: FileText },
    { path: "/interviews", label: "Interviews", icon: Video },
    { path: "/dsa", label: "DSA", icon: Code2 },
    { path: "/goals", label: "Goals", icon: Target },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: User },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className={`flex h-full w-64 flex-col border-r transition-all duration-300 ${
        darkMode ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
          D
        </div>
        <span className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
          DevPilot
        </span>
      </div>

      {/* Navigation - scrollable only if needed */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : darkMode
                        ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section - fixed at bottom */}
      <div className={`border-t p-4 ${darkMode ? "border-slate-800" : "border-gray-200"}`}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            darkMode
              ? "text-slate-400 hover:bg-slate-800 hover:text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-slate-900"
          }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            darkMode
              ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
              : "text-red-600 hover:bg-red-50 hover:text-red-700"
          }`}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;