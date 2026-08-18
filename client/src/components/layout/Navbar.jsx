import { Search, Bell, ChevronDown, LogOut, Settings, UserCircle } from "lucide-react"; // ✅ removed unused 'User'
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const Navbar = ({ title = "Dashboard" }) => {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
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
      // ignore – no need for the error variable
    }
    return null;
  };

  const profilePicture = getProfilePicture();

  return (
    <header className={`flex h-16 items-center justify-between border-b px-4 sm:px-6 ${darkMode ? 'border-slate-800 bg-slate-950 text-white' : 'border-gray-200 bg-white text-slate-900'}`}>
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className={`hidden text-sm sm:block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className={`hidden items-center gap-2 rounded-lg border px-3 py-2 md:flex ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-300 bg-gray-50'}`}>
          <Search size={17} className={darkMode ? 'text-slate-400' : 'text-gray-400'} />
          <input
            type="text"
            placeholder="Search..."
            className={`w-40 bg-transparent text-sm outline-none placeholder:text-slate-500 ${darkMode ? 'text-white' : 'text-slate-900'}`}
          />
        </div>

        {/* Mobile Search Button */}
        <button className={`rounded-lg p-2 transition hover:bg-slate-800 hover:text-white md:hidden ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          <Search size={20} />
        </button>

        {/* Notifications */}
        <button className={`relative rounded-lg p-2 transition hover:bg-slate-800 hover:text-white ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
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

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className={`absolute right-0 mt-2 w-48 rounded-xl border py-1 shadow-lg ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
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