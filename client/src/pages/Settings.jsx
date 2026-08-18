import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  Moon,
  Bell,
  Shield,
  Lock,
  LogOut,
  Trash2,
  Save,
  Eye,
  BarChart3,
  X,
} from "lucide-react";

const Card = ({ title, icon: Icon, children }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`rounded-2xl border p-6 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
      <div className="mb-6 flex items-center gap-3">
        <Icon className="text-indigo-400" size={22} />
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
};

const Toggle = ({ enabled, setEnabled }) => (
  <button
    type="button"
    onClick={() => setEnabled(!enabled)}
    className={`relative h-6 w-12 rounded-full transition ${
      enabled ? "bg-indigo-600" : "bg-slate-700"
    }`}
  >
    <span
      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
        enabled ? "left-7" : "left-1"
      }`}
    />
  </button>
);

const Settings = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    targetRole: "",
    location: "",
    bio: "",
    skills: [],
  });
  const [settings, setSettings] = useState({
    darkMode: true,
    compactMode: false,
    interviewReminder: true,
    applicationReminder: true,
    goalReminder: false,
    weeklySummary: true,
    profileVisibility: true,
    analyticsData: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const refreshSettings = async () => {
  try {
    const { data } = await api.get("/settings"); // Removed custom headers
    if (data.success) {
      setUserData(data.data.user);
      setSettings(data.data.settings);
      setValue("name", data.data.user.name);
      setValue("targetRole", data.data.user.targetRole || "");
      setValue("location", data.data.user.location || "");
      setValue("bio", data.data.user.bio || "");
    }
  } catch (error) {
    console.error("Error refreshing settings:", error);
  }
};
  useEffect(() => {
    let mounted = true;

    const fetchSettings = async () => {
  if (!mounted) return;
  setLoading(true);
  try {
    const { data } = await api.get("/settings"); // Removed custom headers
    if (mounted && data.success) {
      setUserData(data.data.user);
      setSettings(data.data.settings);
      setValue("name", data.data.user.name);
      setValue("targetRole", data.data.user.targetRole || "");
      setValue("location", data.data.user.location || "");
      setValue("bio", data.data.user.bio || "");
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    if (mounted) {
      toast.error("Failed to load settings");
    }
  } finally {
    if (mounted) {
      setLoading(false);
    }
  }
};

    fetchSettings();

    return () => {
      mounted = false;
    };
  }, [setValue]);

  const updateToggle = async (key) => {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));

    const labelMap = {
      darkMode: "Dark Mode",
      compactMode: "Compact Mode",
      interviewReminder: "Interview reminders",
      applicationReminder: "Application reminders",
      goalReminder: "Goal reminders",
      weeklySummary: "Weekly progress summary",
      profileVisibility: "Profile visibility",
      analyticsData: "Analytics data",
    };

    const label = labelMap[key] || key;
    const status = newValue ? "enabled" : "disabled";

    try {
      await api.put("/settings", {
        settings: { [key]: newValue },
      });
      toast.success(`${label} ${status} successfully`);
    } catch (error) {
      console.error("Error updating setting:", error);
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
      toast.error(`Failed to update ${label}`);
    }
  };

  const onSaveProfile = async (data) => {
    setIsSaving(true);
    try {
      const payload = {
        name: data.name,
        targetRole: data.targetRole || "",
        location: data.location || "",
        bio: data.bio || "",
        skills: userData.skills || [],
      };

      const response = await api.put("/settings", payload);
      
      if (response.data.success) {
        await refreshSettings();
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error.response?.data?.message || "Failed to save profile changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.put("/settings/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      toast.success("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      localStorage.removeItem("devpilot_dsa_target");
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete("/settings/account");
      toast.success("Account deleted successfully");
      setShowDeleteModal(false);
      navigate("/register");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex h-96 items-center justify-center ${darkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className={`${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen space-y-6 p-4 sm:p-6 ${darkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Settings</h1>
        <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          Manage your DevPilot preferences and account settings.
        </p>
      </motion.div>

      {/* Profile Settings */}
      <Card title="Profile Settings" icon={User}>
        <form onSubmit={handleSubmit(onSaveProfile)} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={`mb-2 block text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Full Name</label>
            <div className={`flex items-center rounded-lg border px-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-gray-300 bg-gray-50'}`}>
              <User size={18} className={darkMode ? 'text-slate-500' : 'text-gray-400'} />
              <input
                {...register("name", { required: "Name is required" })}
                className={`w-full bg-transparent px-3 py-3 outline-none ${darkMode ? 'text-white' : 'text-slate-900'}`}
                placeholder="Your name"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className={`mb-2 block text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Email</label>
            <div className={`flex items-center rounded-lg border px-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-gray-300 bg-gray-50'}`}>
              <Mail size={18} className={darkMode ? 'text-slate-500' : 'text-gray-400'} />
              <input
                value={userData.email}
                disabled
                className={`w-full bg-transparent px-3 py-3 outline-none opacity-70 cursor-not-allowed ${darkMode ? 'text-white' : 'text-slate-900'}`}
              />
            </div>
            <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Email cannot be changed</p>
          </div>

          <div>
            <label className={`mb-2 block text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Target Role</label>
            <div className={`flex items-center rounded-lg border px-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-gray-300 bg-gray-50'}`}>
              <Briefcase size={18} className={darkMode ? 'text-slate-500' : 'text-gray-400'} />
              <input
                {...register("targetRole")}
                className={`w-full bg-transparent px-3 py-3 outline-none ${darkMode ? 'text-white' : 'text-slate-900'}`}
                placeholder="e.g., Software Engineer"
              />
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Location</label>
            <div className={`flex items-center rounded-lg border px-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-gray-300 bg-gray-50'}`}>
              <MapPin size={18} className={darkMode ? 'text-slate-500' : 'text-gray-400'} />
              <input
                {...register("location")}
                className={`w-full bg-transparent px-3 py-3 outline-none ${darkMode ? 'text-white' : 'text-slate-900'}`}
                placeholder="e.g., India"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={`mb-2 block text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Bio</label>
            <textarea
              {...register("bio")}
              rows="3"
              className={`w-full rounded-lg border px-3 py-3 outline-none focus:border-indigo-500 resize-none ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-gray-50 text-slate-900'}`}
              placeholder="Tell us about yourself..."
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 md:col-span-2 hover:bg-indigo-500 disabled:opacity-50 text-white"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Card>

      {/* Appearance */}
      <Card title="Appearance" icon={Moon}>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className={darkMode ? 'text-white' : 'text-slate-900'}>Dark Mode</p>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Use dark interface</p>
            </div>
            <Toggle enabled={darkMode} setEnabled={toggleTheme} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={darkMode ? 'text-white' : 'text-slate-900'}>Compact Mode</p>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Reduce spacing</p>
            </div>
            <Toggle
              enabled={settings.compactMode}
              setEnabled={() => updateToggle("compactMode")}
            />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card title="Notifications" icon={Bell}>
        <div className="space-y-5">
          {[
            ["Interview reminders", "interviewReminder"],
            ["Application reminders", "applicationReminder"],
            ["Goal reminders", "goalReminder"],
            ["Weekly progress summary", "weeklySummary"],
          ].map(([title, key]) => (
            <div key={key} className="flex items-center justify-between">
              <p className={darkMode ? 'text-white' : 'text-slate-900'}>{title}</p>
              <Toggle
                enabled={settings[key]}
                setEnabled={() => updateToggle(key)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Privacy */}
      <Card title="Privacy" icon={Shield}>
        <div className="space-y-5">
          {[
            ["Profile visibility", "profileVisibility", Eye],
            ["Analytics data", "analyticsData", BarChart3],
          ].map(([title, key, Icon]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon size={18} className={darkMode ? 'text-slate-400' : 'text-gray-400'} />
                <p className={darkMode ? 'text-white' : 'text-slate-900'}>{title}</p>
              </div>
              <Toggle
                enabled={settings[key]}
                setEnabled={() => updateToggle(key)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Account */}
      <Card title="Account" icon={Lock}>
        <div className="flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className={`flex items-center justify-center gap-2 rounded-lg border px-5 py-3 transition ${darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            <Lock size={18} className={darkMode ? 'text-white' : 'text-slate-900'} />
            <span className={darkMode ? 'text-white' : 'text-slate-900'}>Change Password</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center justify-center gap-2 rounded-lg border px-5 py-3 transition ${darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            <LogOut size={18} className={darkMode ? 'text-white' : 'text-slate-900'} />
            <span className={darkMode ? 'text-white' : 'text-slate-900'}>Logout</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-red-500/40 px-5 py-3 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={18} />
            Delete Account
          </button>
        </div>
      </Card>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4 z-50">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex justify-between">
              <h2 className="text-xl font-bold text-white">Change Password</h2>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 text-white"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 text-white"
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 text-white"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2 hover:bg-slate-800 text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 hover:bg-indigo-500 disabled:opacity-50 text-white"
                >
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4 z-50">
          <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-slate-900 p-6">
            <div className="mb-5 flex justify-between">
              <h2 className="text-xl font-bold text-red-400">Delete Account</h2>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-slate-300">
                This action will permanently delete your account and all associated data including:
              </p>
              <ul className="list-disc pl-5 text-sm text-slate-400 space-y-1">
                <li>All job applications</li>
                <li>All resumes</li>
                <li>All interviews</li>
                <li>All DSA problems</li>
                <li>All goals</li>
                <li>All platform connections</li>
              </ul>
              <p className="text-red-400 font-semibold">This action cannot be undone.</p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2 hover:bg-slate-800 text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg bg-red-600 py-2 hover:bg-red-500 disabled:opacity-50 text-white"
                >
                  {isDeleting ? "Deleting..." : "Delete My Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;