import { Bell, ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../services/api";

const Navbar = ({ title = "Dashboard" }) => {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const { data } = await api.get("/notifications");
      if (data.success) {
        setNotifications(data.notifications || []);
        setNotifCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer the initial fetch to a timer callback so setState is not called
    // synchronously within the effect body (avoids cascading renders).
    const initialFetch = setTimeout(fetchNotifications, 0);
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setDropdownOpen(false);
  };

  const handleSettingsClick = () => {
    navigate("/settings");
    setDropdownOpen(false);
  };

  const handleNotificationClick = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) {
      fetchNotifications();
    }
  };

  const getInitials = () => {
    if (!user?.name) return "U";
    const parts = user.name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getDisplayName = () => {
    if (!user?.name) return "User";
    return user.name;
  };

  const getProfilePicture = () => {
    if (user?.profilePicture && user.profilePicture.length > 0) {
      return user.profilePicture;
    }
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser?.profilePicture && storedUser.profilePicture.length > 0) {
        return storedUser.profilePicture;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const profilePicture = getProfilePicture();

  return (
    <header className={`relative z-20 flex h-16 items-center justify-between border-b px-4 sm:px-6 ${darkMode ? 'border-slate-800 bg-slate-950 text-white' : 'border-gray-200 bg-white text-slate-900'}`}>
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className={`hidden text-sm sm:block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative z-50" ref={notifRef}>
          <button
            onClick={handleNotificationClick}
            className={`relative rounded-lg p-2 transition hover:bg-slate-800 hover:text-white ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            <Bell size={20} />
            {notifCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className={`absolute right-0 mt-2 w-80 rounded-xl border py-2 shadow-2xl z-9999 ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
              <div className={`px-4 py-2 border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Notifications
                </p>
              </div>

              {notifLoading ? (
                <div className="px-4 py-6 text-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    No new notifications
                  </p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <button
                      key={`${notif.type}-${notif.id}`}
                      onClick={() => {
                        setNotifOpen(false);
                        if (notif.type === "interview") navigate("/interviews");
                        if (notif.type === "goal") navigate("/goals");
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition border-b last:border-b-0 ${
                        darkMode
                          ? 'border-slate-800 hover:bg-slate-800'
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`mt-0.5 rounded-lg p-1.5 ${notif.type === "interview" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"}`}>
                        {notif.type === "interview" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {notif.title}
                        </p>
                        <p className={`mt-0.5 text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {notif.message}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative z-50" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white overflow-hidden shrink-0">
              {profilePicture ? (
                <img src={profilePicture} alt={user?.name || "User"} className="h-full w-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>

            <div className="hidden text-left sm:block">
              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {getDisplayName()}
              </p>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {user?.role || "Member"}
              </p>
            </div>

            <ChevronDown size={16} className={`hidden sm:block transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''} ${darkMode ? 'text-slate-400' : 'text-gray-500'}`} />
          </button>

          {dropdownOpen && (
            <div className={`absolute right-0 mt-2 w-48 rounded-xl border py-1 shadow-2xl z-9999 ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
              <button
                onClick={handleProfileClick}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition ${darkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-slate-900'}`}
              >
                <UserCircle size={16} />
                Profile
              </button>
              <button
                onClick={handleSettingsClick}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition ${darkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-slate-900'}`}
              >
                <Settings size={16} />
                Settings
              </button>
              <div className={`my-1 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`} />
              <button
                onClick={handleLogout}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition ${darkMode ? 'hover:bg-slate-800 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;