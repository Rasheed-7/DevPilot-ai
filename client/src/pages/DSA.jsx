import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import api from "../services/api";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import {
  Code2,
  Target,
  Layers,
  Database,
  GitBranch,
  Network,
  Box,
  List,
  Plus,
  X,
  Trash2,
  Edit,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Link,
  Unlink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Compass,
  Activity,
  SlidersHorizontal,
  ExternalLink,
  Waypoints,
} from "lucide-react";

const TOPICS = [
  "Arrays",
  "Strings",
  "Hashing",
  "Two Pointers",
  "Sliding Window",
  "Linked List",
  "Stack",
  "Queue",
  "Binary Search",
  "Trees",
  "Binary Search Tree",
  "Heap / Priority Queue",
  "Graphs",
  "Greedy",
  "Backtracking",
  "Dynamic Programming",
  "Recursion",
  "Bit Manipulation",
  "Sorting",
  "Math",
  "Other",
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const PLATFORMS = ["LeetCode", "Codeforces"];
const DEFAULT_TARGET = 100;
const STORAGE_KEY = "devpilot_dsa_target";
const TOPICS_DISPLAY_LIMIT = 10;

const difficultyColors = {
  Easy: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  Medium: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-300",
  Hard: "border-red-200 bg-red-50 text-red-700 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-300",
};

const platformColors = {
  LeetCode: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-300/20 dark:bg-orange-400/10 dark:text-orange-300",
  Codeforces: "border-red-200 bg-red-50 text-red-700 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-300",
};

const platformIcons = { LeetCode: Code2, Codeforces: Code2 };
const topicIcons = {
  Arrays: Layers,
  Strings: Code2,
  Hashing: Database,
  "Two Pointers": Target,
  "Sliding Window": TrendingUp,
  "Linked List": GitBranch,
  Stack: List,
  Queue: List,
  "Binary Search": Code2,
  Trees: Network,
  "Binary Search Tree": Network,
  "Heap / Priority Queue": Box,
  Graphs: Box,
  Greedy: Target,
  Backtracking: Target,
  "Dynamic Programming": Target,
  Recursion: Code2,
  "Bit Manipulation": Code2,
  Sorting: Layers,
  Math: Code2,
  Other: Code2,
};

const Surface = ({ children, className = "" }) => {
  const { darkMode } = useTheme();
  return (
    <section
      className={`rounded-[26px] border ${
        darkMode
          ? "border-white/8 bg-[#11161e]"
          : "border-slate-200/80 bg-white"
      } ${className}`}
    >
      {children}
    </section>
  );
};

const DifficultyBadge = ({ difficulty }) => (
  <span
    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
      difficultyColors[difficulty] || difficultyColors.Medium
    }`}
  >
    {difficulty}
  </span>
);

const DSA = () => {
  const { darkMode } = useTheme();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [targetProblems, setTargetProblems] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_TARGET;
  });
  const [targetInput, setTargetInput] = useState(targetProblems.toString());
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [platformsLoading, setPlatformsLoading] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const fetchPlatforms = async () => {
    setPlatformsLoading(true);
    try {
      const { data } = await api.get("/platforms");
      setPlatforms(data.platforms || []);
    } catch (error) {
      console.error("Error fetching platforms:", error);
      toast.error("Failed to load platform connections");
    } finally {
      setPlatformsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchProblems = async () => {
      if (!mounted) return;
      setLoading(true);
      try {
        const { data } = await api.get("/dsa");
        if (mounted) setProblems(data.problems || []);
      } catch (error) {
        console.error("Error fetching DSA problems:", error);
        if (mounted) toast.error("Failed to load DSA problems");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const fetchPlatformsData = async () => {
      if (!mounted) return;
      setPlatformsLoading(true);
      try {
        const { data } = await api.get("/platforms");
        if (mounted) setPlatforms(data.platforms || []);
      } catch (error) {
        console.error("Error fetching platforms:", error);
        if (mounted) toast.error("Failed to load platform connections");
      } finally {
        if (mounted) setPlatformsLoading(false);
      }
    };

    fetchProblems();
    fetchPlatformsData();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshData = async () => {
    setSyncing(true);
    try {
      const { data } = await api.get("/dsa");
      setProblems(data.problems || []);
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing DSA problems:", error);
      toast.error("Failed to refresh data");
    } finally {
      setSyncing(false);
    }
  };

  const isPlatformConnected = (platformName) =>
    platforms.some((platform) => platform.platform === platformName);

  const getPlatformDetails = (platformName) =>
    platforms.find((platform) => platform.platform === platformName);

  const formatDate = (dateString) => {
    if (!dateString) return "Never synced";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const openConnectModal = (platform) => {
    setSelectedPlatform(platform);
    setConnectingPlatform({ platform, username: "", profileUrl: "" });
    setVerificationStatus("");
    setShowPlatformModal(true);
  };

  const handleConnectSubmit = async () => {
    if (!connectingPlatform?.username?.trim()) {
      toast.error("Username is required");
      return;
    }

    setIsConnecting(true);

    try {
      if (selectedPlatform === "Codeforces" || selectedPlatform === "LeetCode") {
        setVerificationStatus("verifying");
        const verifyResponse = await api.post("/platforms/verify", {
          platform: selectedPlatform,
          username: connectingPlatform.username.trim(),
        });

        if (verifyResponse.data?.success === false) {
          setVerificationStatus("failed");
          toast.error(
            verifyResponse.data?.message ||
              `${selectedPlatform} account not found. Check your username.`
          );
          setIsConnecting(false);
          return;
        }

        setVerificationStatus("verified");
        await api.post("/platforms", {
          platform: selectedPlatform,
          username: connectingPlatform.username.trim(),
          profileUrl: connectingPlatform.profileUrl?.trim() || "",
        });

        toast.success(`${selectedPlatform} connected successfully.`);
        setShowPlatformModal(false);
        setConnectingPlatform(null);
        setVerificationStatus("");
        await fetchPlatforms();
      }
    } catch (error) {
      console.error("Error connecting platform:", error);
      const message =
        error.response?.data?.message || `Failed to connect ${selectedPlatform}.`;
      toast.error(message);
      if (selectedPlatform === "Codeforces" || selectedPlatform === "LeetCode") {
        setVerificationStatus("failed");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (platform) => {
    if (!window.confirm(`Disconnect ${platform}?`)) return;

    setIsDisconnecting(true);
    try {
      await api.delete(`/platforms/${platform}`);
      toast.success(`${platform} disconnected.`);
      await fetchPlatforms();
      await refreshData();
    } catch (error) {
      console.error("Error disconnecting platform:", error);
      const message =
        error.response?.data?.message || `Failed to disconnect ${platform}.`;
      toast.error(message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSyncNow = async (platform) => {
    if (syncingPlatform === platform) return;

    setSyncingPlatform(platform);
    try {
      const response = await api.post(`/platforms/${platform}/sync`);

      if (response.data?.success) {
        const syncStats = response.data?.stats || {};
        const created = syncStats.created || 0;
        const updated = syncStats.updated || 0;

        if (created === 0 && updated === 0) {
          toast.success(`${platform} is already up to date.`);
        } else {
          let message = `${platform} synced — `;
          if (created > 0) {
            message += `${created} new problem${created > 1 ? "s" : ""} added`;
          }
          if (created > 0 && updated > 0) message += ", ";
          if (updated > 0) message += `${updated} updated`;
          toast.success(message);
        }

        await refreshData();
        await fetchPlatforms();
      } else {
        toast.error(response.data?.message || `Failed to sync ${platform}.`);
      }
    } catch (error) {
      console.error(`Sync ${platform} error:`, error);
      const message = error.response?.data?.message || `Failed to sync ${platform}.`;
      toast.error(message);
    } finally {
      setSyncingPlatform(null);
    }
  };

  const stats = useMemo(() => {
    const totalSolved = problems.filter((problem) => problem.isSolved !== false).length;
    const easyCount = problems.filter(
      (problem) => problem.difficulty === "Easy" && problem.isSolved !== false
    ).length;
    const mediumCount = problems.filter(
      (problem) => problem.difficulty === "Medium" && problem.isSolved !== false
    ).length;
    const hardCount = problems.filter(
      (problem) => problem.difficulty === "Hard" && problem.isSolved !== false
    ).length;

    const topicMap = {};
    TOPICS.forEach((topic) => {
      topicMap[topic] = { solved: 0 };
    });

    problems.forEach((problem) => {
      if (problem.isSolved !== false && problem.topic && topicMap[problem.topic]) {
        topicMap[problem.topic].solved += 1;
      }
    });

    const topicProgress = TOPICS.map((topic) => ({
      name: topic,
      solved: topicMap[topic]?.solved || 0,
      icon: topicIcons[topic] || Code2,
    }));

    const sortedTopics = [...topicProgress].sort((a, b) => b.solved - a.solved);
    const overallProgress = Math.min((totalSolved / targetProblems) * 100, 100);
    const overallProgressRounded = Math.round(overallProgress * 100) / 100;
    const weakTopics = sortedTopics
      .filter((topic) => topic.solved <= 2 && topic.solved > 0)
      .slice(0, 5)
      .map((topic) => topic.name);
    const recentProblems = [...problems]
      .filter((problem) => problem.isSolved !== false)
      .sort((a, b) => {
        const dateA = new Date(a.solvedDate || a.createdAt);
        const dateB = new Date(b.solvedDate || b.createdAt);
        return dateB - dateA;
      })
      .slice(0, 5);

    return {
      totalSolved,
      easyCount,
      mediumCount,
      hardCount,
      topicProgress,
      sortedTopics,
      overallProgress: overallProgressRounded,
      weakTopics,
      recentProblems,
    };
  }, [problems, targetProblems]);

  const chartData = useMemo(() => {
    const allTopics = stats.sortedTopics
      .filter((topic) => topic.solved > 0)
      .map((topic) => ({ name: topic.name, solved: topic.solved }));

    return showAllTopics ? allTopics : allTopics.slice(0, TOPICS_DISPLAY_LIMIT);
  }, [stats.sortedTopics, showAllTopics]);

  const hasMoreTopics = useMemo(
    () => stats.sortedTopics.filter((topic) => topic.solved > 0).length > TOPICS_DISPLAY_LIMIT,
    [stats.sortedTopics]
  );

  const totalTopicsCount = useMemo(
    () => stats.sortedTopics.filter((topic) => topic.solved > 0).length,
    [stats.sortedTopics]
  );

  const difficultyData = useMemo(
    () => [
      { name: "Easy", value: stats.easyCount },
      { name: "Medium", value: stats.mediumCount },
      { name: "Hard", value: stats.hardCount },
    ].filter((difficulty) => difficulty.value > 0),
    [stats.easyCount, stats.mediumCount, stats.hardCount]
  );

  const openAddModal = () => {
    setEditingProblem(null);
    setSelectedTopic("");
    setCustomTopic("");
    reset({
      title: "",
      topic: "",
      difficulty: "Medium",
      platform: "Other",
      problemLink: "",
      solvedDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShowModal(true);
  };

  const openEditModal = (problem) => {
    setEditingProblem(problem);
    setSelectedTopic(problem.topic || "");
    setCustomTopic("");
    setValue("title", problem.title || "");
    setValue("topic", problem.topic || "");
    setValue("difficulty", problem.difficulty || "Medium");
    setValue("platform", problem.platform || "Other");
    setValue("problemLink", problem.problemLink || "");
    setValue(
      "solvedDate",
      problem.solvedDate ? new Date(problem.solvedDate).toISOString().split("T")[0] : ""
    );
    setValue("notes", problem.notes || "");
    setShowModal(true);
  };

  const handleTopicChange = (event) => {
    const value = event.target.value;
    setSelectedTopic(value);
    setValue("topic", value);
    if (value !== "Other") setCustomTopic("");
  };

  const handleCustomTopicChange = (event) => {
    setCustomTopic(event.target.value);
    setValue("topic", event.target.value);
  };

  const openTargetModal = () => {
    setTargetInput(targetProblems.toString());
    setShowTargetModal(true);
  };

  const handleSaveTarget = () => {
    const value = parseInt(targetInput, 10);
    if (isNaN(value) || value <= 0 || !Number.isInteger(value)) {
      toast.error("Please enter a valid positive whole number.");
      return;
    }
    setTargetProblems(value);
    localStorage.setItem(STORAGE_KEY, value.toString());
    setShowTargetModal(false);
    toast.success(`Target set to ${value} problems.`);
  };

  const toggleShowAllTopics = () => setShowAllTopics(!showAllTopics);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const finalTopic =
        data.topic === "Other" && customTopic.trim() ? customTopic.trim() : data.topic;

      if (!finalTopic || finalTopic === "Other") {
        toast.error("Please select a valid topic.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title: data.title,
        topic: finalTopic,
        difficulty: data.difficulty,
        platform: data.platform || "Other",
        problemLink: data.problemLink || "",
        solvedDate: data.solvedDate || new Date().toISOString(),
        notes: data.notes || "",
        isSolved: true,
        source: "manual",
      };

      if (editingProblem) {
        await api.put(`/dsa/${editingProblem._id}`, payload);
        toast.success("Problem updated successfully.");
      } else {
        await api.post("/dsa", payload);
        toast.success("Problem added successfully.");
      }

      await refreshData();
      setShowModal(false);
      setEditingProblem(null);
      setSelectedTopic("");
      setCustomTopic("");
      reset();
    } catch (error) {
      console.error("Error saving problem:", error);
      const message = error.response?.data?.message || "Failed to save problem.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProblem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this problem?")) return;

    setDeletingId(id);
    try {
      await api.delete(`/dsa/${id}`);
      toast.success("Problem deleted successfully.");
      await refreshData();
    } catch (error) {
      console.error("Error deleting problem:", error);
      const message = error.response?.data?.message || "Failed to delete problem.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass = `w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all focus:ring-4 ${
    darkMode
      ? "border-white/10 bg-white/[0.035] text-white placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-sky-400/10"
      : "border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-sky-500/10"
  }`;

  const closeProblemModal = () => {
    setShowModal(false);
    setEditingProblem(null);
    setSelectedTopic("");
    setCustomTopic("");
    reset();
  };

  const closePlatformModal = () => {
    setShowPlatformModal(false);
    setConnectingPlatform(null);
    setVerificationStatus("");
  };

  const difficultyTotal = difficultyData.reduce((sum, item) => sum + item.value, 0);
  const remainingTarget = Math.max(targetProblems - stats.totalSolved, 0);

  return (
    <main
      className={`min-h-screen px-4 py-5 sm:px-6 sm:py-8 lg:px-10 ${
        darkMode ? "bg-[#080a0f] text-white" : "bg-[#f4f6f8] text-slate-900"
      }`}
    >
      <div className="mx-auto max-w-355">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-[30px] border px-6 py-7 sm:px-9 sm:py-10 ${
            darkMode
              ? "border-white/8 bg-[#111821]"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="absolute right-0 top-0 h-56 w-56 translate-x-1/3 -translate-y-1/3 rounded-full border border-sky-500/10" />
          <div className="absolute right-10 top-8 hidden h-24 w-24 rounded-full border border-sky-500/10 sm:block" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-600">
                <Code2 size={14} /> DevPilot / Technical preparation
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.08em] sm:text-6xl">
                Build the kind of progress you can trust.
              </h1>
              <p
                className={`mt-4 max-w-2xl text-sm leading-6 sm:text-base ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                A clear technical preparation workspace for the problems you have solved,
                the topics you are building, and the target still ahead.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={openAddModal}
                className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(14,116,144,0.18)] transition-all hover:-translate-y-0.5 hover:bg-sky-500"
              >
                <Plus size={17} /> Add problem
              </button>
              <button
                onClick={refreshData}
                disabled={syncing}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50 ${
                  darkMode
                    ? "border-white/10 text-slate-300 hover:bg-white/5"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <RotateCw size={16} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Refreshing" : "Refresh data"}
              </button>
            </div>
          </div>

          <div className={`relative mt-9 border-t pt-6 ${darkMode ? "border-white/8" : "border-slate-100"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>
                  Preparation target
                </p>
                <p className="mt-2 text-xl font-semibold tracking-tighter">
                  {stats.totalSolved} solved <span className={`font-normal ${darkMode ? "text-slate-600" : "text-slate-400"}`}>of {targetProblems}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}>{stats.overallProgress}% complete</span>
                <button
                  onClick={openTargetModal}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${darkMode ? "text-slate-400 hover:bg-white/5 hover:text-sky-300" : "text-slate-500 hover:bg-slate-50 hover:text-sky-600"}`}
                >
                  <Settings size={13} /> Adjust target
                </button>
              </div>
            </div>
            <div className={`mt-4 h-3 overflow-hidden rounded-full ${darkMode ? "bg-white/[0.07]" : "bg-slate-100"}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.overallProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-sky-600"
              />
            </div>
            <div className={`mt-2 flex justify-between text-[11px] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>
              <span>Current position</span>
              <span>{remainingTarget} remaining to target</span>
            </div>
          </div>
        </motion.header>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Problems solved", stats.totalSolved, "text-sky-500", Activity],
            ["Easy", stats.easyCount, "text-emerald-500", Compass],
            ["Medium", stats.mediumCount, "text-amber-500", Waypoints],
            ["Hard", stats.hardCount, "text-red-500", Target],
          ].map(([label, value, color, Icon], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={`flex items-center gap-4 border-l-2 px-4 py-2 ${
                label === "Hard" ? "border-red-500" : "border-sky-500"
              }`}
            >
              <Icon size={18} className={color} />
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>
                  {label}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.06em]">{value}</p>
              </div>
            </motion.div>
          ))}
        </section>

        <Surface className="mt-8 overflow-hidden">
          <div className={`flex flex-col gap-4 border-b px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 ${darkMode ? "border-white/8" : "border-slate-100"}`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Platform pulse</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.06em]">Your connected practice surface</h2>
              <p className={`mt-2 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}>Keep synchronized problems and manual work in one technical record.</p>
            </div>
            <span className={`flex items-center gap-2 text-xs ${darkMode ? "text-slate-600" : "text-slate-400"}`}><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Real account status</span>
          </div>
          <div className="grid gap-0 divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
            {platformsLoading ? [1, 2].map((item) => <div key={item} className="p-6"><div className={`h-4 w-32 animate-pulse rounded ${darkMode ? "bg-white/[0.07]" : "bg-slate-100"}`} /><div className={`mt-4 h-3 w-48 animate-pulse rounded ${darkMode ? "bg-white/5" : "bg-slate-100"}`} /></div>) : PLATFORMS.map((platform) => {
              const connected = isPlatformConnected(platform);
              const details = getPlatformDetails(platform);
              const Icon = platformIcons[platform] || Code2;
              return (
                <div key={platform} className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${connected ? platformColors[platform] : darkMode ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-400"}`}><Icon size={18} /></div>
                      <div><p className="text-sm font-bold">{platform}</p><p className={`mt-1 text-xs ${darkMode ? "text-slate-600" : "text-slate-400"}`}>{connected ? details?.username : "No account connected"}</p></div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${connected ? "text-emerald-600 dark:text-emerald-300" : darkMode ? "text-slate-600" : "text-slate-400"}`}><span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : darkMode ? "bg-slate-700" : "bg-slate-300"}`} />{connected ? "Connected" : "Not connected"}</span>
                  </div>
                  {connected && details ? <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Last synchronization</p><p className={`mt-1.5 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{details.lastSyncedAt ? formatDate(details.lastSyncedAt) : "Never synced"}</p>{details.lastSyncStatus === "failed" && <p className="mt-2 flex items-center gap-1 text-xs text-amber-500"><AlertCircle size={12} />Last sync failed</p>}</div><div className="flex gap-2"><button onClick={() => handleSyncNow(platform)} disabled={syncingPlatform === platform} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${darkMode ? "border-white/10 text-sky-300 hover:bg-sky-400/10" : "border-sky-200 text-sky-700 hover:bg-sky-50"}`}>{syncingPlatform === platform ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}{syncingPlatform === platform ? "Syncing" : "Sync now"}</button><button onClick={() => handleDisconnect(platform)} disabled={isDisconnecting} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${darkMode ? "border-white/10 text-red-300 hover:bg-red-400/10" : "border-red-100 text-red-600 hover:bg-red-50"}`}><Unlink size={13} />Disconnect</button></div></div> : <button onClick={() => openConnectModal(platform)} className={`mt-6 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${darkMode ? "border-white/10 text-sky-300 hover:bg-sky-400/10" : "border-sky-200 text-sky-700 hover:bg-sky-50"}`}><Link size={13} />Connect {platform}</button>}
                </div>
              );
            })}
          </div>
        </Surface>

        <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <Surface className="overflow-hidden">
            <div className={`flex flex-col gap-4 border-b px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 ${darkMode ? "border-white/8" : "border-slate-100"}`}>
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Skill landscape</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.06em]">Where your practice is landing</h2><p className={`mt-2 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}>{totalTopicsCount > 0 ? `${totalTopicsCount} active topics from your solved record` : "Your active topics will appear here as you solve."}</p></div>{hasMoreTopics && <button onClick={toggleShowAllTopics} className={`flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-500`}>{showAllTopics ? <><ChevronUp size={14} />Show less</> : <><ChevronDown size={14} />Show all ({totalTopicsCount})</>}</button>}</div>
            {loading ? <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">{[1, 2, 3, 4].map((item) => <div key={item} className={`h-16 animate-pulse rounded-xl ${darkMode ? "bg-white/4" : "bg-slate-100"}`} />)}</div> : chartData.length > 0 ? <div className="grid gap-x-8 gap-y-1 p-6 sm:grid-cols-2 sm:p-8">{chartData.map((topic, index) => { const Icon = topicIcons[topic.name] || Code2; const percentage = Math.min(Math.round((topic.solved / Math.max(stats.totalSolved, 1)) * 100), 100); return <motion.div key={topic.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.025 }} className={`group border-b py-4 last:border-b-0 ${darkMode ? "border-white/6" : "border-slate-100"}`}><div className="flex items-center gap-3"><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${darkMode ? "bg-white/5 text-sky-300" : "bg-sky-50 text-sky-600"}`}><Icon size={15} /></div><span className={`min-w-0 flex-1 truncate text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{topic.name}</span><span className={`text-xs font-semibold ${darkMode ? "text-slate-500" : "text-slate-500"}`}>{topic.solved} solved</span></div><div className="mt-3 flex items-center gap-3"><div className={`h-1.5 flex-1 overflow-hidden rounded-full ${darkMode ? "bg-white/[0.07]" : "bg-slate-100"}`}><motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.6, delay: index * 0.025 }} className={`h-full rounded-full ${index < 3 ? "bg-sky-500" : "bg-slate-400 dark:bg-slate-600"}`} /></div><span className={`w-10 text-right text-[11px] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>{percentage}%</span></div></motion.div>; })}</div> : <div className="px-6 py-16 text-center"><Compass size={28} className="mx-auto text-sky-600" /><p className={`mt-4 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}>No solved topics yet. Add a completed problem to start mapping your preparation.</p></div>}
          </Surface>

          <Surface className="p-6 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Difficulty lens</p><h2 className="mt-2 text-xl font-semibold tracking-tighter">What your record contains</h2></div><SlidersHorizontal size={18} className={darkMode ? "text-slate-600" : "text-slate-400"} /></div>{loading ? <div className={`mt-8 h-40 animate-pulse rounded-2xl ${darkMode ? "bg-white/4" : "bg-slate-100"}`} /> : stats.totalSolved > 0 ? <div className="mt-8"><div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.07]">{difficultyData.map((item) => <motion.div key={item.name} initial={{ width: 0 }} animate={{ width: `${(item.value / difficultyTotal) * 100}%` }} transition={{ duration: 0.7 }} className={item.name === "Easy" ? "bg-emerald-500" : item.name === "Medium" ? "bg-amber-500" : "bg-red-500"} />)}</div><div className="mt-7 space-y-4">{difficultyData.map((item) => <div key={item.name} className="flex items-center gap-3"><span className={`h-2 w-2 rounded-full ${item.name === "Easy" ? "bg-emerald-500" : item.name === "Medium" ? "bg-amber-500" : "bg-red-500"}`} /><span className={`flex-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{item.name}</span><span className="text-sm font-semibold">{item.value}</span><span className={`w-12 text-right text-xs ${darkMode ? "text-slate-600" : "text-slate-400"}`}>{Math.round((item.value / difficultyTotal) * 100)}%</span></div>)}</div><div className={`mt-8 border-t pt-5 ${darkMode ? "border-white/8" : "border-slate-100"}`}><p className={`text-xs leading-5 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>Difficulty is calculated from the problems marked solved in your real record.</p></div></div> : <div className="mt-8 border-l-2 border-sky-500/40 py-4 pl-4"><p className={`text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}>No difficulty data yet.</p></div>}</Surface>
        </div>

        <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <Surface className="overflow-hidden"><div className={`flex items-end justify-between border-b px-6 py-6 sm:px-8 ${darkMode ? "border-white/8" : "border-slate-100"}`}><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Recent record</p><h2 className="mt-2 text-xl font-semibold tracking-tighter">Problems you have completed</h2></div><Activity size={18} className={darkMode ? "text-slate-600" : "text-slate-400"} /></div>{loading ? <div className="space-y-3 p-6 sm:p-8">{[1, 2, 3].map((item) => <div key={item} className={`h-14 animate-pulse rounded-xl ${darkMode ? "bg-white/4" : "bg-slate-100"}`} />)}</div> : stats.recentProblems.length > 0 ? <div>{stats.recentProblems.map((problem, index) => <motion.div key={problem._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`flex flex-col gap-3 border-b px-6 py-5 last:border-b-0 sm:flex-row sm:items-center sm:px-8`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${darkMode ? "bg-white/5 text-sky-300" : "bg-sky-50 text-sky-600"}`}><CheckCircle size={16} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className={`truncate text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{problem.title}</p>{problem.difficulty && <DifficultyBadge difficulty={problem.difficulty} />}</div><p className={`mt-1 truncate text-xs ${darkMode ? "text-slate-500" : "text-slate-500"}`}>{problem.topic} <span className="mx-1 opacity-40">·</span> {problem.platform || "Other"}{problem.solvedDate && <><span className="mx-1 opacity-40">·</span>{new Date(problem.solvedDate).toLocaleDateString()}</>}</p></div><div className="flex items-center gap-3 sm:justify-end">{problem.problemLink && <a href={problem.problemLink} target="_blank" rel="noopener noreferrer" aria-label={`Open ${problem.title}`} className={`flex h-8 w-8 items-center justify-center rounded-lg border ${darkMode ? "border-white/10 text-slate-500 hover:text-sky-300" : "border-slate-200 text-slate-400 hover:text-sky-600"}`}><ExternalLink size={14} /></a>}<button onClick={() => openEditModal(problem)} aria-label={`Edit ${problem.title}`} className={`flex h-8 w-8 items-center justify-center rounded-lg border ${darkMode ? "border-white/10 text-slate-500 hover:text-sky-300" : "border-slate-200 text-slate-400 hover:text-sky-600"}`}><Edit size={14} /></button><button onClick={() => deleteProblem(problem._id)} disabled={deletingId === problem._id} aria-label={`Delete ${problem.title}`} className={`flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-50 ${darkMode ? "border-white/10 text-slate-500 hover:border-red-300/20 hover:text-red-300" : "border-slate-200 text-slate-400 hover:border-red-100 hover:text-red-500"}`}><Trash2 size={14} /></button></div></motion.div>)}</div> : <div className="flex flex-col items-center px-6 py-16 text-center"><Code2 size={28} className="text-sky-600" /><h3 className="mt-4 text-lg font-semibold">No problems solved yet</h3><p className={`mt-2 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}>Start your technical record by adding a completed problem.</p><button onClick={openAddModal} className="mt-5 flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"><Plus size={15} />Add problem</button></div>}</Surface>

          <Surface className="p-6 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Attention map</p><h2 className="mt-2 text-xl font-semibold tracking-tighter">Topics to revisit</h2></div><Target size={18} className={darkMode ? "text-slate-600" : "text-slate-400"} /></div>{loading ? <div className={`mt-7 h-32 animate-pulse rounded-xl ${darkMode ? "bg-white/4" : "bg-slate-100"}`} /> : stats.weakTopics.length > 0 ? <div className="mt-7 space-y-2">{stats.weakTopics.map((topic) => <div key={topic} className={`flex items-center gap-3 border-l-2 border-amber-500 px-3 py-3 ${darkMode ? "bg-amber-400/4" : "bg-amber-50/70"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-lg ${darkMode ? "bg-amber-400/10 text-amber-300" : "bg-amber-100 text-amber-700"}`}><Target size={14} /></span><span className="text-sm font-semibold">{topic}</span></div>)}</div> : <div className={`mt-7 border-l-2 border-emerald-500 px-4 py-4 ${darkMode ? "bg-emerald-400/4" : "bg-emerald-50/70"}`}><p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">{stats.totalSolved > 0 ? "No weak topics identified." : "Your focus areas will appear as you solve."}</p></div>}</Surface>
        </div>

        <AnimatePresence>
          {showModal && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm"><motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`my-auto w-full max-w-2xl rounded-[26px] border p-6 shadow-2xl sm:p-8 ${darkMode ? "border-white/10 bg-[#11161e]" : "border-slate-200 bg-white"}`}><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Technical record</p><h2 className="mt-2 text-2xl font-semibold tracking-tighter">{editingProblem ? "Edit problem" : "Add completed problem"}</h2><p className={`mt-1 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}>Keep the details that make this problem useful later.</p></div><button onClick={closeProblemModal} className={`flex h-9 w-9 items-center justify-center rounded-lg ${darkMode ? "text-slate-500 hover:bg-white/6 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"}`}><X size={18} /></button></div><form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-6"><div><p className={`mb-3 text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Problem identity</p><div className="grid gap-4 sm:grid-cols-2"><label className="block sm:col-span-2"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Problem title<span className="ml-1 text-sky-500">*</span></span><input placeholder="e.g. Longest Substring Without Repeating Characters" className={`mt-2 ${inputClass} ${errors.title ? "border-red-500" : ""}`} {...register("title", { required: "Title is required" })} />{errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}</label><label className="block"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Topic<span className="ml-1 text-sky-500">*</span></span><select className={`mt-2 ${inputClass} ${errors.topic ? "border-red-500" : ""}`} {...register("topic", { required: "Topic is required" })} onChange={handleTopicChange} value={selectedTopic}><option value="">Select topic</option>{TOPICS.map((topic) => <option key={topic} value={topic}>{topic}</option>)}</select>{errors.topic && <p className="mt-1 text-xs text-red-500">{errors.topic.message}</p>}</label><label className="block"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Difficulty<span className="ml-1 text-sky-500">*</span></span><select className={`mt-2 ${inputClass} ${errors.difficulty ? "border-red-500" : ""}`} {...register("difficulty", { required: "Difficulty is required" })}><option value="">Select difficulty</option>{DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}</select>{errors.difficulty && <p className="mt-1 text-xs text-red-500">{errors.difficulty.message}</p>}</label></div></div>{selectedTopic === "Other" && <label className="block"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Custom topic</span><input placeholder="Enter a topic" className={`mt-2 ${inputClass}`} value={customTopic} onChange={handleCustomTopicChange} /></label>}<div><p className={`mb-3 text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Source and reflection</p><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Platform</span><select className={`mt-2 ${inputClass}`} {...register("platform")}><option value="LeetCode">LeetCode</option><option value="Codeforces">Codeforces</option><option value="Other">Other</option></select></label><label className="block"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Solved date</span><input type="date" className={`mt-2 ${inputClass}`} {...register("solvedDate")} /></label><label className="block sm:col-span-2"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Problem link <span className={`font-normal ${darkMode ? "text-slate-600" : "text-slate-400"}`}>(optional)</span></span><input placeholder="https://..." className={`mt-2 ${inputClass}`} {...register("problemLink")} /></label><label className="block sm:col-span-2"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Notes <span className={`font-normal ${darkMode ? "text-slate-600" : "text-slate-400"}`}>(optional)</span></span><textarea rows="3" placeholder="What pattern or insight should you remember?" className={`mt-2 resize-none ${inputClass}`} {...register("notes")} /></label></div></div><div className={`flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end ${darkMode ? "border-white/8" : "border-slate-100"}`}><button type="button" onClick={closeProblemModal} className={`rounded-xl border px-5 py-3 text-sm font-semibold ${darkMode ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Cancel</button><button type="submit" disabled={isSubmitting} className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50">{isSubmitting ? "Saving..." : editingProblem ? "Update problem" : "Add problem"}</button></div></form></motion.div></motion.div>}
        </AnimatePresence>

        <AnimatePresence>
          {showTargetModal && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"><motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`w-full max-w-md rounded-[26px] border p-6 shadow-2xl ${darkMode ? "border-white/10 bg-[#11161e]" : "border-slate-200 bg-white"}`}><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Preparation target</p><h2 className="mt-2 text-xl font-semibold tracking-tighter">Set DSA target</h2></div><button onClick={() => setShowTargetModal(false)} className={`flex h-9 w-9 items-center justify-center rounded-lg ${darkMode ? "text-slate-500 hover:bg-white/6 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"}`}><X size={18} /></button></div><div className="mt-7"><label className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Target problems</label><input type="number" min="1" step="1" value={targetInput} onChange={(event) => setTargetInput(event.target.value)} placeholder="Enter target number of problems" className={`mt-2 ${inputClass}`} /><p className={`mt-2 text-xs ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Enter a positive whole number such as 50, 100, or 150.</p></div><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row"><button onClick={() => setShowTargetModal(false)} className={`flex-1 rounded-xl border py-3 text-sm font-semibold ${darkMode ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Cancel</button><button onClick={handleSaveTarget} className="flex-1 rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-500">Save target</button></div></motion.div></motion.div>}
        </AnimatePresence>

        <AnimatePresence>
          {showPlatformModal && selectedPlatform && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"><motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`w-full max-w-md rounded-[26px] border p-6 shadow-2xl ${darkMode ? "border-white/10 bg-[#11161e]" : "border-slate-200 bg-white"}`}><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Platform connection</p><h2 className="mt-2 text-xl font-semibold tracking-tighter">Connect {selectedPlatform}</h2></div><button onClick={closePlatformModal} className={`flex h-9 w-9 items-center justify-center rounded-lg ${darkMode ? "text-slate-500 hover:bg-white/6 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"}`}><X size={18} /></button></div><div className="mt-7 space-y-5"><label className="block"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Username<span className="ml-1 text-sky-500">*</span></span><input type="text" value={connectingPlatform?.username || ""} onChange={(event) => setConnectingPlatform((previous) => ({ ...previous, username: event.target.value }))} placeholder="Enter your username" className={`mt-2 ${inputClass}`} /></label><label className="block"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Profile URL <span className={`font-normal ${darkMode ? "text-slate-600" : "text-slate-400"}`}>(optional)</span></span><input type="url" value={connectingPlatform?.profileUrl || ""} onChange={(event) => setConnectingPlatform((previous) => ({ ...previous, profileUrl: event.target.value }))} placeholder="https://..." className={`mt-2 ${inputClass}`} /></label>{(selectedPlatform === "Codeforces" || selectedPlatform === "LeetCode") && verificationStatus === "verifying" && <p className="flex items-center gap-2 text-sm text-amber-500"><Loader2 size={16} className="animate-spin" />Verifying {selectedPlatform} account...</p>}{(selectedPlatform === "Codeforces" || selectedPlatform === "LeetCode") && verificationStatus === "verified" && <p className="flex items-center gap-2 text-sm text-emerald-500"><CheckCircle size={16} />Account verified. Connecting...</p>}{(selectedPlatform === "Codeforces" || selectedPlatform === "LeetCode") && verificationStatus === "failed" && <p className="flex items-center gap-2 text-sm text-red-500"><AlertCircle size={16} />Verification failed. Please check the username.</p>}<div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row"><button onClick={closePlatformModal} className={`flex-1 rounded-xl border py-3 text-sm font-semibold ${darkMode ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Cancel</button><button onClick={handleConnectSubmit} disabled={isConnecting} className="flex-1 rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50">{isConnecting ? (selectedPlatform === "Codeforces" || selectedPlatform === "LeetCode") && verificationStatus === "verifying" ? `Verifying ${selectedPlatform}...` : "Connecting..." : "Connect"}</button></div></div></motion.div></motion.div>}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default DSA;
