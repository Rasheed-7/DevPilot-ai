import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  FileText,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Video,
  Activity,
  Layers,
} from "lucide-react";

// ============================================================
// Helpers
// ============================================================

const formatRelativeTime = (date) => {
  if (!date) return "recently";

  const now = new Date();
  const diff = now - new Date(date);

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }

  return "just now";
};

const formatDeadlineDate = (date) => {
  if (!date) return "Scheduled";

  const target = new Date(date);
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const targetDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  const diffDays = Math.round(
    (targetDay - today) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${
      Math.abs(diffDays) > 1 ? "s" : ""
    } ago`;
  }

  if (diffDays <= 7) {
    return `In ${diffDays} days`;
  }

  return target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// ============================================================
// Dashboard
// ============================================================

const Dashboard = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeJobs: 0,
      resumes: 0,
      interviews: 0,
      dsaProblems: 0,
    },

    quickStats: {
      goalsCompleted: 0,
      successRate: 0,
      interviews: 0,
      offers: 0,
    },

    recentActivity: [],
    activeGoals: [],
    upcomingInterviews: [],
    totalApplications: 0,
  });

  // ============================================================
  // Fetch Dashboard
  // ============================================================

  const fetchDashboard = useCallback(
    async (signal, isRetry = false) => {
      try {
        /*
         * On initial mount loading is already true.
         *
         * Only set loading/error here for an explicit retry.
         * This avoids the synchronous setState-in-effect warning.
         */
        if (isRetry) {
          setLoading(true);
          setError(null);
        }

        const response = await api.get("/dashboard", {
          signal,
        });

        if (signal?.aborted) {
          return;
        }

        const data = response?.data;

        if (data?.success) {
          const incoming = data?.data || {};

          setDashboardData({
            stats: {
              activeJobs:
                Number(incoming?.stats?.activeJobs) || 0,

              resumes:
                Number(incoming?.stats?.resumes) || 0,

              interviews:
                Number(incoming?.stats?.interviews) || 0,

              dsaProblems:
                Number(incoming?.stats?.dsaProblems) || 0,
            },

            quickStats: {
              goalsCompleted:
                Number(
                  incoming?.quickStats?.goalsCompleted
                ) || 0,

              successRate:
                Number(
                  incoming?.quickStats?.successRate
                ) || 0,

              interviews:
                Number(
                  incoming?.quickStats?.interviews
                ) || 0,

              offers:
                Number(
                  incoming?.quickStats?.offers
                ) || 0,
            },

            recentActivity: Array.isArray(
              incoming?.recentActivity
            )
              ? incoming.recentActivity
              : [],

            activeGoals: Array.isArray(
              incoming?.activeGoals
            )
              ? incoming.activeGoals
              : [],

            upcomingInterviews: Array.isArray(
              incoming?.upcomingInterviews
            )
              ? incoming.upcomingInterviews
              : [],

            totalApplications:
              Number(incoming?.totalApplications) || 0,
          });
        } else {
          const message =
            data?.message ||
            "Failed to load dashboard";

          if (!signal?.aborted) {
            setError(message);
            toast.error(message);
          }
        }
      } catch (err) {
        /*
         * Axios cancellation
         */
        if (
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED"
        ) {
          return;
        }

        if (signal?.aborted) {
          return;
        }

        console.error(
          "Dashboard fetch error:",
          err
        );

        const message =
          err?.response?.data?.message ||
          "Failed to load dashboard";

        setError(message);
        toast.error(message);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  // ============================================================
  // Initial Dashboard Load
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      await fetchDashboard(controller.signal, false);
    };

    loadDashboard();

    return () => {
      controller.abort();
    };
  }, [fetchDashboard]);

  // ============================================================
  // Retry
  // ============================================================

  const handleRetry = useCallback(() => {
    const controller = new AbortController();

    fetchDashboard(controller.signal, true).finally(() => {
      controller.abort();
    });
  }, [fetchDashboard]);

  // ============================================================
  // Derived Values
  // ============================================================

  const welcomeName = user?.name || "";

  const pageBackground = darkMode
    ? "bg-[#07111C] text-slate-100"
    : "bg-[#F7FAFC] text-slate-900";

  // ============================================================
  // Activity Icons
  // ============================================================

  const activityIconMap = {
    application: Briefcase,
    dsa: Code2,
    interview: Video,
    resume: FileText,
    goal: Target,
  };

  // ============================================================
  // Upcoming Moves
  // ============================================================

  const upcomingMoves = [
    ...dashboardData.upcomingInterviews.map(
      (item) => ({
        id: item._id,
        type: "Interview",
        title: `Interview with ${item.company}`,
        date: item.date,
        time: item.time,
        route: "/interviews",
        icon: Video,
        badgeTone: darkMode
          ? "bg-cyan-500/12 text-cyan-400 border-sky-500/20"
          : "bg-sky-50 text-sky-700 border-sky-200",
      })
    ),

    ...dashboardData.activeGoals
      .filter((item) => item.deadline)
      .map((item) => ({
        id: item._id,
        type: "Goal Target",
        title: item.title,
        date: item.deadline,
        time: null,
        route: "/goals",
        icon: Target,
        badgeTone: darkMode
          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
          : "bg-amber-50 text-amber-700 border-amber-200",
      })),
  ]
    .sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date)
    )
    .slice(0, 5);

  const successRateNum = Math.min(
    100,
    Math.max(
      0,
      Number(
        dashboardData.quickStats.successRate
      ) || 0
    )
  );

  // ============================================================
  // Loading State
  // ============================================================

  if (loading) {
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center ${pageBackground}`}
      >
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-sky-500/20 border-t-sky-500" />

          <div className="absolute flex h-6 w-6 items-center justify-center text-sky-500">
            <Code2 size={16} />
          </div>
        </div>

        <p
          className={`mt-4 text-xs font-medium tracking-wide uppercase ${
            darkMode
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          Synchronizing Career Workspace...
        </p>
      </div>
    );
  }

  // ============================================================
  // Error State
  // ============================================================

  if (error) {
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center px-4 ${pageBackground}`}
      >
        <div
          className={`max-w-md rounded-2xl border p-8 text-center ${
            darkMode
              ? "border-rose-500/20 bg-rose-500/5"
              : "border-rose-200 bg-rose-50"
          }`}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <Activity size={24} />
          </div>

          <h2
            className={`mt-4 text-lg font-bold ${
              darkMode
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            Unable to Load Workspace Data
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-rose-400">
            {error}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-cyan-500"
          >
            <RefreshCw size={13} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Main Dashboard
  // ============================================================

  return (
    <main
      className={`min-h-screen pb-16 antialiased transition-colors duration-200 ${pageBackground}`} style={{ fontFamily: '"Inter", "Avenir Next", ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* Ambient Light */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className={`absolute -top-32 left-1/2 h-87.5 w-175 -translate-x-1/2 rounded-full blur-[120px] transition-opacity ${
            darkMode
              ? "bg-cyan-600/10 opacity-60"
              : "bg-cyan-300/25 opacity-70"
          }`}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-350 px-4 pt-6 sm:px-6 lg:px-8">
        {/* ====================================================== */}
        {/* HEADER */}
        {/* ====================================================== */}

        <header className="mb-8 flex flex-col gap-5 border-b border-slate-200/80 pb-6 dark:border-slate-800/80 sm:flex-row sm:items-end sm:justify-between">
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.35,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  darkMode
                    ? "border-sky-500/30 bg-cyan-500/12 text-sky-300"
                    : "border-sky-200 bg-sky-50 text-sky-700"
                }`}
              >
                <Sparkles size={11} />
                <span>
                  Placement Command Center
                </span>
              </span>

              <span
                className={`text-xs ${
                  darkMode
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                •
              </span>

              <span
                className={`font-mono text-xs font-medium ${
                  darkMode
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                {new Date().toLocaleDateString(
                  "en-US",
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </span>
            </div>

            <h1
              className={`mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl ${
                darkMode
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              {welcomeName
                ? `Welcome back, ${welcomeName}`
                : "Placement Command Center"}
            </h1>

            <p
              className={`mt-1.5 max-w-2xl text-xs leading-relaxed sm:text-sm ${
                darkMode
                  ? "text-slate-400"
                  : "text-slate-600"
              }`}
            >
              {dashboardData.totalApplications >
                0 ||
              dashboardData.stats.dsaProblems > 0
                ? "Your real-time placement telemetry, pipeline trajectory, preparation signals, and upcoming commitments."
                : "Your placement journey starts here. Record applications, track algorithmic mastery, log interviews, and version resumes."}
            </p>
          </motion.div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium sm:inline-flex ${
                darkMode
                  ? "border-slate-800 bg-slate-900/60 text-slate-400"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              <span>Workspace Live</span>
            </div>

            <button
              type="button"
              onClick={() => navigate("/jobs")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                darkMode
                  ? "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Briefcase
                size={13}
                className="text-cyan-400"
              />
              <span>Jobs</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/dsa")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                darkMode
                  ? "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Code2
                size={13}
                className="text-emerald-400"
              />
              <span>DSA</span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/interviews")
              }
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                darkMode
                  ? "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Video
                size={13}
                className="text-cyan-400"
              />
              <span>Interviews</span>
            </button>
          </div>
        </header>

        {/* ====================================================== */}
        {/* PIPELINE TELEMETRY */}
        {/* ====================================================== */}

        <section
          className={`relative overflow-hidden rounded-2xl border transition-colors ${
            darkMode
              ? "border-slate-800/90 bg-linear-to-b from-slate-900/80 to-[#0B0F17] shadow-xl shadow-black/40"
              : "border-slate-200/90 bg-white shadow-md shadow-slate-200/60"
          }`}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 85% 15%, rgba(99,102,241,0.12), transparent 30%), linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
              backgroundSize:
                "100% 100%, 36px 36px, 36px 36px",
            }}
          />

          <div className="relative grid lg:grid-cols-12">
            {/* LEFT */}
            <div className="p-6 sm:p-8 lg:col-span-8 lg:border-r border-slate-200/80 dark:border-slate-800/80">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      darkMode
                        ? "text-cyan-400"
                        : "text-sky-600"
                    }`}
                  >
                    Pipeline Trajectory
                  </span>

                  <h2
                    className={`mt-1 text-xl font-bold tracking-tight ${
                      darkMode
                        ? "text-white"
                        : "text-slate-900"
                    }`}
                  >
                    Placement Pipeline Telemetry
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/jobs")}
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    darkMode
                      ? "text-cyan-400 hover:text-sky-300"
                      : "text-sky-600 hover:text-sky-700"
                  }`}
                >
                  <span>Manage Pipeline</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>

              {/* Metrics */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Applications */}
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() =>
                    navigate("/jobs")
                  }
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    darkMode
                      ? "border-slate-800 bg-slate-950/60 hover:border-sky-500/40 hover:bg-slate-900/60"
                      : "border-slate-100 bg-slate-50/70 hover:border-sky-200 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        darkMode
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      Outreach
                    </span>

                    <Briefcase
                      size={13}
                      className="text-cyan-400"
                    />
                  </div>

                  <div
                    className={`mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl ${
                      darkMode
                        ? "text-white"
                        : "text-slate-900"
                    }`}
                  >
                    {dashboardData.totalApplications}
                  </div>

                  <p className="mt-1 truncate text-[11px] text-slate-500">
                    Total Applications
                  </p>
                </motion.div>

                {/* Active Jobs */}
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() =>
                    navigate("/jobs")
                  }
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    darkMode
                      ? "border-slate-800 bg-slate-950/60 hover:border-blue-500/40 hover:bg-slate-900/60"
                      : "border-slate-100 bg-slate-50/70 hover:border-blue-200 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        darkMode
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      Active
                    </span>

                    <Layers
                      size={13}
                      className="text-blue-400"
                    />
                  </div>

                  <div
                    className={`mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl ${
                      darkMode
                        ? "text-white"
                        : "text-slate-900"
                    }`}
                  >
                    {dashboardData.stats.activeJobs}
                  </div>

                  <p className="mt-1 truncate text-[11px] text-slate-500">
                    In Active Process
                  </p>
                </motion.div>

                {/* Interviews */}
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() =>
                    navigate("/interviews")
                  }
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    darkMode
                      ? "border-slate-800 bg-slate-950/60 hover:border-sky-500/40 hover:bg-slate-900/60"
                      : "border-slate-100 bg-slate-50/70 hover:border-sky-200 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        darkMode
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      Interviews
                    </span>

                    <Video
                      size={13}
                      className="text-cyan-400"
                    />
                  </div>

                  <div
                    className={`mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl ${
                      darkMode
                        ? "text-white"
                        : "text-slate-900"
                    }`}
                  >
                    {
                      dashboardData.quickStats
                        .interviews
                    }
                  </div>

                  <p className="mt-1 truncate text-[11px] text-slate-500">
                    Interview Rounds
                  </p>
                </motion.div>

                {/* Offers */}
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() =>
                    navigate("/jobs")
                  }
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    darkMode
                      ? "border-slate-800 bg-slate-950/60 hover:border-emerald-500/40 hover:bg-slate-900/60"
                      : "border-slate-100 bg-slate-50/70 hover:border-emerald-200 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        darkMode
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      Offers
                    </span>

                    <CheckCircle2
                      size={13}
                      className="text-emerald-400"
                    />
                  </div>

                  <div
                    className={`mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl ${
                      darkMode
                        ? "text-emerald-400"
                        : "text-emerald-600"
                    }`}
                  >
                    {
                      dashboardData.quickStats
                        .offers
                    }
                  </div>

                  <p className="mt-1 truncate text-[11px] text-slate-500">
                    Offers Landed
                  </p>
                </motion.div>
              </div>

              {/* Connected Pathway */}
              <div
                className={`mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs ${
                  darkMode
                    ? "border-slate-800 text-slate-400"
                    : "border-slate-100 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />

                  <span>
                    Goals Completed:{" "}
                    <strong
                      className={
                        darkMode
                          ? "text-white"
                          : "text-slate-900"
                      }
                    >
                      {
                        dashboardData.quickStats
                          .goalsCompleted
                      }
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  <span>
                    DSA Records:{" "}
                    <strong
                      className={
                        darkMode
                          ? "text-white"
                          : "text-slate-900"
                      }
                    >
                      {
                        dashboardData.stats
                          .dsaProblems
                      }
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />

                  <span>
                    Verified Resumes:{" "}
                    <strong
                      className={
                        darkMode
                          ? "text-white"
                          : "text-slate-900"
                      }
                    >
                      {
                        dashboardData.stats
                          .resumes
                      }
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div
              className={`flex flex-col justify-between p-6 sm:p-8 lg:col-span-4 ${
                darkMode
                  ? "bg-slate-900/30"
                  : "bg-slate-50/50"
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    darkMode
                      ? "text-emerald-400"
                      : "text-emerald-700"
                  }`}
                >
                  Conversion Telemetry
                </span>

                <h3
                  className={`mt-1 text-base font-bold ${
                    darkMode
                      ? "text-white"
                      : "text-slate-900"
                  }`}
                >
                  Interview Success Rate
                </h3>

                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Real conversion efficiency from
                  pipeline stages to verified technical
                  outcomes.
                </p>
              </div>

              {/* Gauge */}
              <div className="my-6 flex items-center gap-5">
                <div
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full shadow-inner"
                  style={{
                    background: `conic-gradient(${
                      darkMode
                        ? "#10B981"
                        : "#059669"
                    } ${successRateNum}%, ${
                      darkMode
                        ? "rgba(255,255,255,0.06)"
                        : "#E2E8F0"
                    } 0)`,
                  }}
                >
                  <div
                    className={`flex h-15 w-15 items-center justify-center rounded-full font-mono text-base font-bold ${
                      darkMode
                        ? "bg-[#0E131F] text-emerald-300"
                        : "bg-white text-emerald-700 shadow-sm"
                    }`}
                  >
                    {
                      dashboardData.quickStats
                        .successRate
                    }
                    %
                  </div>
                </div>

                <div>
                  <div
                    className={`text-xl font-bold tracking-tight ${
                      darkMode
                        ? "text-white"
                        : "text-slate-900"
                    }`}
                  >
                    {
                      dashboardData.quickStats
                        .offers
                    }{" "}
                    {
                      dashboardData.quickStats
                        .offers === 1
                        ? "Offer"
                        : "Offers"
                    }
                  </div>

                  <div className="text-xs text-slate-500">
                    from{" "}
                    {
                      dashboardData.quickStats
                        .interviews
                    }{" "}
                    {
                      dashboardData.quickStats
                        .interviews === 1
                        ? "interview"
                        : "interviews"
                    }
                  </div>

                  <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                    <CheckCircle2 size={12} />
                    <span>
                      Real Diagnostic Signal
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center justify-between border-t pt-3 text-xs ${
                  darkMode
                    ? "border-slate-800 text-slate-400"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <span>
                  Full Telemetry Diagnostics
                </span>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/analytics")
                  }
                  className={`inline-flex items-center gap-1 font-semibold ${
                    darkMode
                      ? "text-cyan-400 hover:text-sky-300"
                      : "text-sky-600 hover:text-sky-700"
                  }`}
                >
                  <span>Analytics</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================== */}
        {/* HORIZON RADAR + CAPABILITY ENGINE */}
        {/* ====================================================== */}

        <div className="mt-8 grid gap-7 lg:grid-cols-12">
          {/* Horizon Radar */}
          <div
            className={`flex flex-col justify-between rounded-2xl border p-6 transition-colors sm:p-7 lg:col-span-7 ${
              darkMode
                ? "border-slate-800 bg-[#0E131F]"
                : "border-slate-200 bg-white shadow-sm"
            }`}
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                      darkMode
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    <Calendar size={16} />
                  </div>

                  <div>
                    <h3
                      className={`text-base font-bold ${
                        darkMode
                          ? "text-white"
                          : "text-slate-900"
                      }`}
                    >
                      Horizon Radar
                    </h3>

                    <p className="text-[11px] text-slate-500">
                      Upcoming interviews and active
                      goal deadlines
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/interviews")
                    }
                    className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                      darkMode
                        ? "border-slate-800 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    + Interview
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/goals")
                    }
                    className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                      darkMode
                        ? "border-slate-800 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    + Goal
                  </button>
                </div>
              </div>

              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/70">
                {upcomingMoves.length > 0 ? (
                  upcomingMoves.map(
                    (move, index) => {
                      const Icon = move.icon;

                      return (
                        <motion.div
                          key={`${move.type}-${move.id}-${index}`}
                          whileHover={{ x: 3 }}
                          onClick={() =>
                            navigate(move.route)
                          }
                          className={`group flex cursor-pointer items-center justify-between rounded-lg px-2 py-3.5 transition-colors ${
                            darkMode
                              ? "hover:bg-slate-800/40"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${move.badgeTone}`}
                            >
                              <Icon size={14} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p
                                className={`truncate text-xs font-bold ${
                                  darkMode
                                    ? "text-slate-200"
                                    : "text-slate-800"
                                }`}
                              >
                                {move.title}
                              </p>

                              <span className="text-[11px] text-slate-500">
                                {move.type}{" "}
                                {move.time
                                  ? `• ${move.time}`
                                  : ""}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                                formatDeadlineDate(
                                  move.date
                                ) === "Today" ||
                                formatDeadlineDate(
                                  move.date
                                ) === "Tomorrow"
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                  : darkMode
                                  ? "border-slate-800 bg-slate-900 text-slate-400"
                                  : "border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              {formatDeadlineDate(
                                move.date
                              )}
                            </span>

                            <ArrowUpRight
                              size={13}
                              className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
                            />
                          </div>
                        </motion.div>
                      );
                    }
                  )
                ) : (
                  <div className="py-10 text-center">
                    <div
                      className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${
                        darkMode
                          ? "bg-slate-900 text-slate-500"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Calendar size={18} />
                    </div>

                    <p
                      className={`mt-3 text-xs font-bold ${
                        darkMode
                          ? "text-slate-300"
                          : "text-slate-700"
                      }`}
                    >
                      No Scheduled Interviews or
                      Goal Deadlines
                    </p>

                    <p className="mx-auto mt-1 max-w-xs text-[11px] leading-relaxed text-slate-500">
                      Stay proactive by logging an
                      upcoming interview or defining
                      your weekly milestone target.
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate("/interviews")
                        }
                        className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
                      >
                        Schedule Interview
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate("/goals")
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                          darkMode
                            ? "border-slate-800 text-slate-300 hover:bg-slate-800"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Set Goal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`mt-4 flex items-center justify-between border-t pt-3 text-xs ${
                darkMode
                  ? "border-slate-800 text-slate-500"
                  : "border-slate-100 text-slate-400"
              }`}
            >
              <span>
                Active Goals:{" "}
                {dashboardData.activeGoals.length}
              </span>

              <span>
                Upcoming Interviews:{" "}
                {
                  dashboardData.upcomingInterviews
                    .length
                }
              </span>
            </div>
          </div>

          {/* Right Capability Cards */}
          <div className="flex flex-col justify-between space-y-4 lg:col-span-5">
            {/* DSA */}
            <motion.div
              whileHover={{ y: -2 }}
              onClick={() => navigate("/dsa")}
              className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                darkMode
                  ? "border-slate-800 bg-[#0E131F] hover:border-emerald-500/40"
                  : "border-slate-200 bg-white shadow-sm hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                      darkMode
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-emerald-200 bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <Code2 size={16} />
                  </div>

                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        darkMode
                          ? "text-white"
                          : "text-slate-900"
                      }`}
                    >
                      DSA Problem Solving
                    </h4>

                    <span className="text-[11px] text-slate-500">
                      Algorithmic Practice Mastery
                    </span>
                  </div>
                </div>

                <ArrowUpRight
                  size={14}
                  className="text-emerald-500"
                />
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div
                    className={`text-3xl font-extrabold tracking-tight ${
                      darkMode
                        ? "text-white"
                        : "text-slate-900"
                    }`}
                  >
                    {
                      dashboardData.stats
                        .dsaProblems
                    }
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Solved problems recorded in
                    workspace
                  </p>
                </div>

                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                    darkMode
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {dashboardData.stats
                    .dsaProblems > 0
                    ? "Active Practice"
                    : "Ready to Start"}
                </span>
              </div>
            </motion.div>

            {/* Resumes */}
            <motion.div
              whileHover={{ y: -2 }}
              onClick={() => navigate("/resumes")}
              className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                darkMode
                  ? "border-slate-800 bg-[#0E131F] hover:border-sky-500/40"
                  : "border-slate-200 bg-white shadow-sm hover:border-sky-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                      darkMode
                        ? "border-sky-500/20 bg-cyan-500/12 text-cyan-400"
                        : "border-sky-200 bg-sky-50 text-sky-600"
                    }`}
                  >
                    <FileText size={16} />
                  </div>

                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        darkMode
                          ? "text-white"
                          : "text-slate-900"
                      }`}
                    >
                      Resume Profiles
                    </h4>

                    <span className="text-[11px] text-slate-500">
                      Personal Document Library
                    </span>
                  </div>
                </div>

                <ArrowUpRight
                  size={14}
                  className="text-sky-500"
                />
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div
                    className={`text-3xl font-extrabold tracking-tight ${
                      darkMode
                        ? "text-white"
                        : "text-slate-900"
                    }`}
                  >
                    {
                      dashboardData.stats
                        .resumes
                    }
                  </div>

                  <p className="text-[11px] text-slate-500">
                    {dashboardData.stats
                      .resumes === 0
                      ? "No personal resume on file"
                      : `Personal file${
                          dashboardData.stats
                            .resumes === 1
                            ? ""
                            : "s"
                        } ready`}
                  </p>
                </div>

                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                    darkMode
                      ? "border-sky-500/30 bg-cyan-500/12 text-sky-300"
                      : "border-sky-200 bg-sky-50 text-sky-700"
                  }`}
                >
                  {dashboardData.stats
                    .resumes > 0
                    ? "Library Synchronized"
                    : "Upload Required"}
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* ACTIVITY STREAM */}
        {/* ====================================================== */}

        <section
          className={`mt-8 rounded-2xl border p-6 transition-colors sm:p-7 ${
            darkMode
              ? "border-slate-800 bg-[#0E131F]"
              : "border-slate-200 bg-white shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                  darkMode
                    ? "border-sky-500/20 bg-cyan-500/12 text-cyan-400"
                    : "border-sky-200 bg-sky-50 text-sky-600"
                }`}
              >
                <TrendingUp size={16} />
              </div>

              <div>
                <h3
                  className={`text-base font-bold ${
                    darkMode
                      ? "text-white"
                      : "text-slate-900"
                  }`}
                >
                  Career Chrono-Stream
                </h3>

                <p className="text-[11px] text-slate-500">
                  Chronological activity record across
                  all DevPilot modules
                </p>
              </div>
            </div>

            <span
              className={`font-mono text-[11px] ${
                darkMode
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              {dashboardData.recentActivity.length}{" "}
              Events Logged
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/70">
            {dashboardData.recentActivity.length >
            0 ? (
              dashboardData.recentActivity
                .slice(0, 6)
                .map((act, index) => {
                  const Icon =
                    activityIconMap[act.type] ||
                    Briefcase;

                  const routeTarget =
                    act.type === "application"
                      ? "/jobs"
                      : act.type === "dsa"
                      ? "/dsa"
                      : act.type === "interview"
                      ? "/interviews"
                      : act.type === "resume"
                      ? "/resumes"
                      : act.type === "goal"
                      ? "/goals"
                      : "/jobs";

                  return (
                    <motion.div
                      key={`${act.type}-${act.time}-${index}`}
                      whileHover={{ x: 3 }}
                      onClick={() =>
                        navigate(routeTarget)
                      }
                      className={`group flex cursor-pointer items-center justify-between rounded-lg px-2 py-3.5 transition-colors ${
                        darkMode
                          ? "hover:bg-slate-800/40"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                            darkMode
                              ? "border-slate-800 bg-slate-900 text-slate-300"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          <Icon size={14} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-xs font-semibold ${
                              darkMode
                                ? "text-slate-200"
                                : "text-slate-800"
                            }`}
                          >
                            {act.title}
                          </p>

                          <span className="text-[11px] capitalize text-slate-500">
                            {act.type} event
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono text-[11px] ${
                            darkMode
                              ? "text-slate-400"
                              : "text-slate-500"
                          }`}
                        >
                          {formatRelativeTime(
                            act.time
                          )}
                        </span>

                        <ArrowUpRight
                          size={13}
                          className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </div>
                    </motion.div>
                  );
                })
            ) : (
              <div className="py-12 text-center">
                <div
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${
                    darkMode
                      ? "bg-slate-900 text-slate-500"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Clock size={18} />
                </div>

                <p
                  className={`mt-3 text-xs font-bold ${
                    darkMode
                      ? "text-slate-300"
                      : "text-slate-700"
                  }`}
                >
                  Your Activity Stream is Waiting
                </p>

                <p className="mx-auto mt-1 max-w-xs text-[11px] leading-relaxed text-slate-500">
                  Add a job application, solve a DSA
                  problem, log an interview, or
                  version your resume to build your
                  career activity log.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ====================================================== */}
        {/* QUICK LAUNCH */}
        {/* ====================================================== */}

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between px-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                darkMode
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              DevPilot Sub-Systems Quick Launch
            </span>

            <span
              className={`text-xs ${
                darkMode
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              6 Integrated Modules
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              {
                label: "Job Tracker",
                count: `${dashboardData.stats.activeJobs} Active`,
                icon: Briefcase,
                path: "/jobs",
                color: "text-blue-400",
              },
              {
                label: "DSA Matrix",
                count: `${dashboardData.stats.dsaProblems} Solved`,
                icon: Code2,
                path: "/dsa",
                color: "text-emerald-400",
              },
              {
                label: "Interviews",
                count: `${dashboardData.stats.interviews} Logged`,
                icon: Video,
                path: "/interviews",
                color: "text-cyan-400",
              },
              {
                label: "Goals & CTC",
                count: `${dashboardData.activeGoals.length} Active`,
                icon: Target,
                path: "/goals",
                color: "text-amber-400",
              },
              {
                label: "Resume Vault",
                count: `${dashboardData.stats.resumes} Files`,
                icon: FileText,
                path: "/resumes",
                color: "text-cyan-400",
              },
              {
                label: "Analytics",
                count: `${dashboardData.quickStats.successRate}% Rate`,
                icon: BarChart3,
                path: "/analytics",
                color: "text-cyan-400",
              },
            ].map((mod) => (
              <motion.button
                key={mod.label}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  navigate(mod.path)
                }
                className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                  darkMode
                    ? "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <mod.icon
                    size={15}
                    className={mod.color}
                  />

                  <ArrowUpRight
                    size={12}
                    className={`opacity-60 ${
                      darkMode
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  />
                </div>

                <div className="mt-3">
                  <div
                    className={`text-xs font-bold ${
                      darkMode
                        ? "text-slate-200"
                        : "text-slate-800"
                    }`}
                  >
                    {mod.label}
                  </div>

                  <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                    {mod.count}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
