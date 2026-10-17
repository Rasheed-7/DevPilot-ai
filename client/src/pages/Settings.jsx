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

const Card = ({ title, icon: Icon, children, className = "" }) => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`rounded-[28px] border p-6 sm:p-8 ${
        darkMode
          ? "border-white/8 bg-[#11161e]"
          : "border-slate-200/80 bg-white"
      } ${className}`}
    >
      <div className="mb-6 flex items-center gap-3">
        <Icon
          className={darkMode ? "text-slate-500" : "text-slate-400"}
          size={19}
        />

        <div>
          <h2
            className={`text-2xl font-semibold tracking-[-0.07em] ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            {title}
          </h2>
        </div>
      </div>

      {children}
    </div>
  );
};

const Toggle = ({ enabled, setEnabled }) => (
  <button
    type="button"
    onClick={() => setEnabled(!enabled)}
    className={`relative h-6 w-12 shrink-0 rounded-full transition ${
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
      const { data } = await api.get("/settings");

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
        const { data } = await api.get("/settings");

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

    setSettings((prev) => ({
      ...prev,
      [key]: newValue,
    }));

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
        settings: {
          [key]: newValue,
        },
      });

      toast.success(`${label} ${status} successfully`);
    } catch (error) {
      console.error("Error updating setting:", error);

      setSettings((prev) => ({
        ...prev,
        [key]: !newValue,
      }));

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

      toast.error(
        error.response?.data?.message ||
          "Failed to save profile changes"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (
      passwordData.newPassword !== passwordData.confirmPassword
    ) {
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

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to change password"
      );
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

      toast.error(
        error.response?.data?.message ||
          "Failed to delete account"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const page = darkMode
    ? "bg-[#080a0f] text-white"
    : "bg-[#f7f8fa] text-slate-900";

  const muted = "text-slate-500";

  const heading = darkMode
    ? "text-white"
    : "text-slate-900";

  const field = `w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:ring-4 ${
    darkMode
      ? "border-white/10 bg-white/[0.035] text-white placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-sky-400/10"
      : "border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-sky-500/10"
  }`;

  if (loading) {
    return (
      <div
        className={`flex min-h-130 items-center justify-center ${page}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
          <p className={muted}>Loading settings...</p>
        </div>
      </div>
    );
  }

  const preferenceRows = [
    [
      "Dark mode",
      "Use the darker DevPilot interface.",
      "theme",
    ],
    [
      "Compact mode",
      "Reduce spacing across supported views.",
      "compact",
    ],
  ];

  const notificationRows = [
    [
      "Interview reminders",
      "interviewReminder",
      "Upcoming interviews and preparation.",
    ],
    [
      "Application reminders",
      "applicationReminder",
      "Follow-ups and application momentum.",
    ],
    [
      "Goal reminders",
      "goalReminder",
      "Nudges for active career commitments.",
    ],
    [
      "Weekly progress summary",
      "weeklySummary",
      "A weekly view of career activity.",
    ],
  ];

  return (
    <main
      className={`min-h-screen px-4 py-5 sm:px-6 sm:py-8 lg:px-10 ${page}`}
    >
      <div className="mx-auto max-w-360">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-8 dark:border-white/8 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-600">
              DevPilot / Preferences
            </p>

            <h1 className="mt-4 text-4xl font-semibold -tracking-widest sm:text-6xl">
              Your workspace, tuned.
            </h1>

            <p
              className={`mt-4 max-w-2xl text-sm leading-6 sm:text-base ${muted}`}
            >
              A quieter, more considered way to manage the settings
              behind your career system.
            </p>
          </div>

          <div className={`flex items-center gap-2 text-xs ${muted}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Preferences are saved as you change them
          </div>
        </motion.header>

        <div className="grid gap-7 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">

          {/* PROFILE */}
          <motion.section
            id="profile"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 h-56 w-56 translate-x-1/3 -translate-y-1/3 rounded-full border border-sky-500/10" />

            <Card
              title="The information behind your identity"
              icon={User}
              className="relative"
            >
              <div
                className={`mb-7 flex flex-col gap-2 border-b pb-6 sm:flex-row sm:items-end sm:justify-between ${
                  darkMode
                    ? "border-white/8"
                    : "border-slate-100"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">
                  01 / Profile registry
                </p>

                <span className={`text-xs ${muted}`}>
                  {userData.email || "Account profile"}
                </span>
              </div>

              <form
                onSubmit={handleSubmit(onSaveProfile)}
                className="grid gap-5 sm:grid-cols-2"
              >
                {/* Full name */}
                <div>
                  <label
                    className={`mb-2 block text-xs font-semibold ${
                      darkMode
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Full name
                  </label>

                  <div className="relative">
                    <User
                      size={16}
                      className={`pointer-events-none absolute left-3.5 top-3.5 ${muted}`}
                    />

                    <input
                      {...register("name", {
                        required: "Name is required",
                      })}
                      className={`${field} pl-10`}
                      placeholder="Your name"
                    />
                  </div>

                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    className={`mb-2 block text-xs font-semibold ${
                      darkMode
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={16}
                      className={`pointer-events-none absolute left-3.5 top-3.5 ${muted}`}
                    />

                    <input
                      value={userData.email}
                      disabled
                      className={`${field} cursor-not-allowed pl-10 opacity-60`}
                    />
                  </div>

                  <p className={`mt-1.5 text-[11px] ${muted}`}>
                    Email cannot be changed.
                  </p>
                </div>

                {/* Target role */}
                <div>
                  <label
                    className={`mb-2 block text-xs font-semibold ${
                      darkMode
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Target role
                  </label>

                  <div className="relative">
                    <Briefcase
                      size={16}
                      className={`pointer-events-none absolute left-3.5 top-3.5 ${muted}`}
                    />

                    <input
                      {...register("targetRole")}
                      className={`${field} pl-10`}
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label
                    className={`mb-2 block text-xs font-semibold ${
                      darkMode
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Location
                  </label>

                  <div className="relative">
                    <MapPin
                      size={16}
                      className={`pointer-events-none absolute left-3.5 top-3.5 ${muted}`}
                    />

                    <input
                      {...register("location")}
                      className={`${field} pl-10`}
                      placeholder="e.g. India"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="sm:col-span-2">
                  <label
                    className={`mb-2 block text-xs font-semibold ${
                      darkMode
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Professional bio
                  </label>

                  <textarea
                    {...register("bio")}
                    rows="4"
                    className={`${field} resize-none`}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Save */}
                <div
                  className={`flex flex-col gap-3 border-t pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between ${
                    darkMode
                      ? "border-white/8"
                      : "border-slate-100"
                  }`}
                >
                  <p className={`text-xs ${muted}`}>
                    Changes update your profile across DevPilot.
                  </p>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                  >
                    <Save size={16} />

                    {isSaving
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                </div>
              </form>
            </Card>
          </motion.section>

          {/* RIGHT COLUMN */}
          <div className="space-y-7">

            {/* PREFERENCES */}
            <section id="preferences">
              <Card
                title="Workspace feel"
                icon={Moon}
              >
                <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
                  02 / Interface
                </p>

                <div className="space-y-5">
                  {preferenceRows.map(
                    ([title, description, key]) => (
                      <div
                        key={key}
                        className={`flex items-center justify-between gap-4 border-b pb-5 last:border-b-0 last:pb-0 ${
                          darkMode
                            ? "border-white/8"
                            : "border-slate-100"
                        }`}
                      >
                        <div>
                          <p
                            className={`text-sm font-semibold ${heading}`}
                          >
                            {title}
                          </p>

                          <p
                            className={`mt-1 text-xs leading-5 ${muted}`}
                          >
                            {description}
                          </p>
                        </div>

                        <Toggle
                          enabled={
                            key === "theme"
                              ? darkMode
                              : settings.compactMode
                          }
                          setEnabled={
                            key === "theme"
                              ? toggleTheme
                              : () =>
                                  updateToggle(
                                    "compactMode"
                                  )
                          }
                        />
                      </div>
                    )
                  )}
                </div>
              </Card>
            </section>

            {/* ACCOUNT */}
            <section id="account">
              <Card
                title="Account control"
                icon={Lock}
              >
                <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  03 / Access
                </p>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordModal(true)
                    }
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      darkMode
                        ? "border-white/10 text-slate-200 hover:bg-white/5"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Lock size={15} />
                      Change password
                    </span>

                    <span className={muted}>→</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      darkMode
                        ? "border-white/10 text-slate-200 hover:bg-white/5"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <LogOut size={15} />
                      Log out
                    </span>

                    <span className={muted}>→</span>
                  </button>
                </div>
              </Card>
            </section>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <section
          id="notifications"
          className="mt-7"
        >
          <Card
            title="Notification rhythm"
            icon={Bell}
          >
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">
                04 / Signal routing
              </p>

              <p className={`mt-2 text-sm ${muted}`}>
                Choose the moments when DevPilot should interrupt
                your focus.
              </p>
            </div>

            <div className="grid sm:grid-cols-2">
              {notificationRows.map(
                ([title, key, description], index) => (
                  <div
                    key={key}
                    className={`flex items-start justify-between gap-5 border-b p-6 last:border-b-0 sm:p-8 ${
                      index % 2 === 0
                        ? "sm:border-r"
                        : ""
                    } ${
                      darkMode
                        ? "border-white/8"
                        : "border-slate-100"
                    }`}
                  >
                    <div>
                      <span
                        className={`font-mono text-[10px] ${muted}`}
                      >
                        0{index + 1}
                      </span>

                      <p
                        className={`mt-2 text-sm font-semibold ${heading}`}
                      >
                        {title}
                      </p>

                      <p
                        className={`mt-1 max-w-xs text-xs leading-5 ${muted}`}
                      >
                        {description}
                      </p>
                    </div>

                    <Toggle
                      enabled={settings[key]}
                      setEnabled={() =>
                        updateToggle(key)
                      }
                    />
                  </div>
                )
              )}
            </div>
          </Card>
        </section>

        {/* PRIVACY */}
        <section
          id="privacy"
          className="mt-7"
        >
          <Card
            title="Privacy controls"
            icon={Shield}
          >
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                05 / Data boundaries
              </p>

              <p className={`mt-2 text-sm ${muted}`}>
                Make deliberate choices about visibility and analytics
                data.
              </p>
            </div>

            <div className="grid sm:grid-cols-2">
              {/* Profile visibility */}
              <div
                className={`flex items-start justify-between gap-5 border-b p-6 sm:border-r sm:border-b-0 sm:p-9 ${
                  darkMode
                    ? "border-white/8"
                    : "border-slate-100"
                }`}
              >
                <div className="flex gap-3">
                  <Eye
                    size={18}
                    className="mt-0.5 text-emerald-500"
                  />

                  <div>
                    <p
                      className={`text-sm font-semibold ${heading}`}
                    >
                      Profile visibility
                    </p>

                    <p
                      className={`mt-1 text-xs leading-5 ${muted}`}
                    >
                      Allow your professional profile to be
                      visible where supported.
                    </p>
                  </div>
                </div>

                <Toggle
                  enabled={settings.profileVisibility}
                  setEnabled={() =>
                    updateToggle(
                      "profileVisibility"
                    )
                  }
                />
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-5 p-6 sm:p-9">
                <div className="flex gap-3">
                  <BarChart3
                    size={18}
                    className="mt-0.5 text-emerald-500"
                  />

                  <div>
                    <p
                      className={`text-sm font-semibold ${heading}`}
                    >
                      Analytics data
                    </p>

                    <p
                      className={`mt-1 text-xs leading-5 ${muted}`}
                    >
                      Allow your activity to contribute to
                      analytics.
                    </p>
                  </div>
                </div>

                <Toggle
                  enabled={settings.analyticsData}
                  setEnabled={() =>
                    updateToggle("analyticsData")
                  }
                />
              </div>
            </div>
          </Card>
        </section>

        {/* DANGER ZONE */}
        <section className="mt-7">
          <Card
            title="Danger zone"
            icon={Trash2}
            className={
              darkMode
                ? "border-red-500/25 bg-[#161216]"
                : "border-red-500/25 bg-red-50/70"
            }
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">
                  06 / Irreversible
                </p>

                <p
                  className={`mt-2 max-w-2xl text-sm leading-6 ${muted}`}
                >
                  Permanently delete your account and all associated
                  workspace data. This cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowDeleteModal(true)
                }
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/40 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/10"
              >
                <Trash2 size={16} />
                Delete account
              </button>
            </div>
          </Card>
        </section>

        {/* CHANGE PASSWORD MODAL */}
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 12,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl sm:p-8 ${
                darkMode
                  ? "border-white/10 bg-[#11161e]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                    Account security
                  </p>

                  <h2
                    className={`mt-2 text-2xl font-semibold tracking-[-0.07em] ${heading}`}
                  >
                    Change password
                  </h2>

                  <p className={`mt-2 text-sm ${muted}`}>
                    Use at least 8 characters for your new password.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowPasswordModal(false)
                  }
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    darkMode
                      ? "text-slate-500 hover:bg-white/6"
                      : "text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold ${heading}`}
                  >
                    Current password
                  </label>

                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    className={field}
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold ${heading}`}
                  >
                    New password
                  </label>

                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className={field}
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold ${heading}`}
                  >
                    Confirm new password
                  </label>

                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className={field}
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordModal(false)
                    }
                    className={`flex-1 rounded-xl border py-3 text-sm font-semibold ${
                      darkMode
                        ? "border-white/10 text-slate-300 hover:bg-white/5"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="flex-1 rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                  >
                    {isChangingPassword
                      ? "Changing..."
                      : "Change password"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* DELETE ACCOUNT MODAL */}
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 12,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl sm:p-8 ${
                darkMode
                  ? "border-red-400/20 bg-[#11161e]"
                  : "border-red-200 bg-white"
              }`}
            >
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-500">
                    Irreversible action
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.07em] text-red-500">
                    Delete account?
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDeleteModal(false)
                  }
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    darkMode
                      ? "text-slate-500 hover:bg-white/6"
                      : "text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              <p
                className={`text-sm leading-6 ${
                  darkMode
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                This action will permanently delete your account and
                all associated data including:
              </p>

              <ul
                className={`mt-4 grid gap-2 text-sm sm:grid-cols-2 ${muted}`}
              >
                <li>• All job applications</li>
                <li>• All resumes</li>
                <li>• All interviews</li>
                <li>• All DSA problems</li>
                <li>• All goals</li>
                <li>• All platform connections</li>
              </ul>

              <p className="mt-5 text-sm font-semibold text-red-500">
                This action cannot be undone.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    setShowDeleteModal(false)
                  }
                  className={`flex-1 rounded-xl border py-3 text-sm font-semibold ${
                    darkMode
                      ? "border-white/10 text-slate-300 hover:bg-white/5"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {isDeleting
                    ? "Deleting..."
                    : "Delete my account"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default Settings;