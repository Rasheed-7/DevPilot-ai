import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
  ArrowUpRight,
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
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Predefined topics
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

const difficultyColors = {
  Easy: "bg-green-500/20 text-green-400",
  Medium: "bg-yellow-500/20 text-yellow-400",
  Hard: "bg-red-500/20 text-red-400",
};

const platformColors = {
  LeetCode: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Codeforces: "bg-red-500/10 text-red-400 border-red-500/20",
};

const platformIcons = {
  LeetCode: Code2,
  Codeforces: Code2,
};

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

const Card = ({ children, className = "" }) => {
  const { darkMode } = useTheme();
  return (
    <div
      className={`rounded-2xl border p-5 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'} ${className}`}
    >
      {children}
    </div>
  );
};

// Default target
const DEFAULT_TARGET = 100;
const STORAGE_KEY = "devpilot_dsa_target";
const TOPICS_DISPLAY_LIMIT = 10;

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

  // Fetch platforms
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

  // Fetch problems on mount
  useEffect(() => {
    let mounted = true;

    const fetchProblems = async () => {
      if (!mounted) return;
      setLoading(true);
      try {
        const { data } = await api.get("/dsa");
        if (mounted) {
          setProblems(data.problems || []);
        }
      } catch (error) {
        console.error("Error fetching DSA problems:", error);
        if (mounted) {
          toast.error("Failed to load DSA problems");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const fetchPlatformsData = async () => {
      if (!mounted) return;
      setPlatformsLoading(true);
      try {
        const { data } = await api.get("/platforms");
        if (mounted) {
          setPlatforms(data.platforms || []);
        }
      } catch (error) {
        console.error("Error fetching platforms:", error);
        if (mounted) {
          toast.error("Failed to load platform connections");
        }
      } finally {
        if (mounted) {
          setPlatformsLoading(false);
        }
      }
    };

    fetchProblems();
    fetchPlatformsData();

    return () => {
      mounted = false;
    };
  }, []);

  // Refresh data function with animation
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

  // Check if platform is connected
  const isPlatformConnected = (platformName) => {
    return platforms.some(p => p.platform === platformName);
  };

  // Get platform connection details
  const getPlatformDetails = (platformName) => {
    return platforms.find(p => p.platform === platformName);
  };

  // Format date for display
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

  // Open connect modal
  const openConnectModal = (platform) => {
    setSelectedPlatform(platform);
    setConnectingPlatform({ platform, username: "", profileUrl: "" });
    setVerificationStatus("");
    setShowPlatformModal(true);
  };

  // Handle connect submit with verification for Codeforces and LeetCode
  const handleConnectSubmit = async () => {
    if (!connectingPlatform?.username?.trim()) {
      toast.error("Username is required");
      return;
    }

    setIsConnecting(true);

    try {
      // For Codeforces and LeetCode, verify first
      if (selectedPlatform === "Codeforces" || selectedPlatform === "LeetCode") {
        setVerificationStatus("verifying");
        
        const verifyResponse = await api.post("/platforms/verify", {
          platform: selectedPlatform,
          username: connectingPlatform.username.trim(),
        });

        if (verifyResponse.data?.success === false) {
          setVerificationStatus("failed");
          toast.error(verifyResponse.data?.message || `${selectedPlatform} account not found. Check your username.`);
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
      const message = error.response?.data?.message || `Failed to connect ${selectedPlatform}.`;
      toast.error(message);
      if (selectedPlatform === "Codeforces" || selectedPlatform === "LeetCode") {
        setVerificationStatus("failed");
      }
    } finally {
      setIsConnecting(false);
    }
  };

    const handleDisconnect = async (platform) => {
    if (!window.confirm(`Disconnect ${platform}?`)) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await api.delete(`/platforms/${platform}`);
      toast.success(`${platform} disconnected.`);
      await fetchPlatforms();
      await refreshData();
    } catch (error) {
      console.error("Error disconnecting platform:", error);
      const message = error.response?.data?.message || `Failed to disconnect ${platform}.`;
      toast.error(message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Handle sync now for a platform
  const handleSyncNow = async (platform) => {
    if (syncingPlatform === platform) return;

    setSyncingPlatform(platform);

    try {
      const response = await api.post(`/platforms/${platform}/sync`);

      if (response.data?.success) {
        const stats = response.data?.stats || {};
        const created = stats.created || 0;
        const updated = stats.updated || 0;

        if (created === 0 && updated === 0) {
          toast.success(`${platform} is already up to date.`);
        } else {
          let message = `${platform} synced — `;
          if (created > 0) message += `${created} new problem${created > 1 ? 's' : ''} added`;
          if (created > 0 && updated > 0) message += ', ';
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

  // Derived statistics using useMemo
  const stats = useMemo(() => {
    const totalSolved = problems.filter((p) => p.isSolved !== false).length;
    const easyCount = problems.filter((p) => p.difficulty === "Easy" && p.isSolved !== false).length;
    const mediumCount = problems.filter((p) => p.difficulty === "Medium" && p.isSolved !== false).length;
    const hardCount = problems.filter((p) => p.difficulty === "Hard" && p.isSolved !== false).length;

    const topicMap = {};
    TOPICS.forEach((topic) => {
      topicMap[topic] = { solved: 0 };
    });

    problems.forEach((p) => {
      if (p.isSolved !== false && p.topic && topicMap[p.topic]) {
        topicMap[p.topic].solved += 1;
      }
    });

    const topicProgress = TOPICS.map((topic) => {
      const solved = topicMap[topic]?.solved || 0;
      return {
        name: topic,
        solved,
        icon: topicIcons[topic] || Code2,
      };
    });

    const sortedTopics = [...topicProgress].sort((a, b) => b.solved - a.solved);

    const overallProgress = Math.min((totalSolved / targetProblems) * 100, 100);
    const overallProgressRounded = Math.round(overallProgress * 100) / 100;

    const weakTopics = sortedTopics
      .filter((t) => t.solved <= 2 && t.solved > 0)
      .slice(0, 5)
      .map((t) => t.name);

    const recentProblems = [...problems]
      .filter((p) => p.isSolved !== false)
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

  // Chart data for topic completion
  const chartData = useMemo(() => {
    const allTopics = stats.sortedTopics
      .filter((t) => t.solved > 0)
      .map((topic) => ({
        name: topic.name,
        solved: topic.solved,
      }));

    if (showAllTopics) {
      return allTopics;
    }
    return allTopics.slice(0, TOPICS_DISPLAY_LIMIT);
  }, [stats.sortedTopics, showAllTopics]);

  const hasMoreTopics = useMemo(() => {
    const totalTopics = stats.sortedTopics.filter((t) => t.solved > 0).length;
    return totalTopics > TOPICS_DISPLAY_LIMIT;
  }, [stats.sortedTopics]);

  const totalTopicsCount = useMemo(() => {
    return stats.sortedTopics.filter((t) => t.solved > 0).length;
  }, [stats.sortedTopics]);

  const difficultyData = useMemo(() => {
    return [
      { name: "Easy", value: stats.easyCount },
      { name: "Medium", value: stats.mediumCount },
      { name: "Hard", value: stats.hardCount },
    ].filter((d) => d.value > 0);
  }, [stats.easyCount, stats.mediumCount, stats.hardCount]);

  const COLORS = ["#22c55e", "#6366f1", "#ef4444"];

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
    setValue("solvedDate", problem.solvedDate ? new Date(problem.solvedDate).toISOString().split("T")[0] : "");
    setValue("notes", problem.notes || "");
    setShowModal(true);
  };

  const handleTopicChange = (e) => {
    const value = e.target.value;
    setSelectedTopic(value);
    setValue("topic", value);
    if (value !== "Other") {
      setCustomTopic("");
    }
  };

  const handleCustomTopicChange = (e) => {
    setCustomTopic(e.target.value);
    setValue("topic", e.target.value);
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

  const toggleShowAllTopics = () => {
    setShowAllTopics(!showAllTopics);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const finalTopic = data.topic === "Other" && customTopic.trim() ? customTopic.trim() : data.topic;

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
    if (!window.confirm("Are you sure you want to delete this problem?")) {
      return;
    }

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

  // Custom label for pie chart
  const renderCustomizedLabel = ({ name, value }) => {
    if (value === 0) return null;
    return `${name}: ${value}`;
  };

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`border rounded-xl p-4 shadow-xl ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <p className={`font-semibold text-sm mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
            <p className="text-indigo-400 text-sm">
              Solved: <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{payload[0].value}</span> problems
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get gradient based on solved count
  const getGradient = (solved, maxSolved) => {
    const percentage = maxSolved > 0 ? solved / maxSolved : 0;
    if (percentage > 0.7) return "url(#barGradientGreen)";
    if (percentage > 0.4) return "url(#barGradient)";
    if (percentage > 0.2) return "url(#barGradientYellow)";
    return "url(#barGradientRed)";
  };

  const isLargeDataset = chartData.length > TOPICS_DISPLAY_LIMIT;

  return (
    <div className={`space-y-6 min-h-screen p-4 sm:p-6 ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row"
      >
        <div>
          <h1 className="text-3xl font-bold">DSA Progress</h1>
          <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Track your preparation and identify weak areas.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 hover:bg-indigo-500 text-white"
          >
            <Plus size={18} />
            Add Problem
          </button>
          <button
            onClick={refreshData}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all"
          >
            <RotateCw size={18} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      </motion.div>

      {/* Connected Platforms */}
      <Card>
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Connected Platforms
        </h2>

        {platformsLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className={`rounded-xl border p-4 animate-pulse ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                <div className={`h-6 rounded w-3/4 mb-3 ${darkMode ? 'bg-slate-800' : 'bg-gray-300'}`}></div>
                <div className={`h-4 rounded w-1/2 ${darkMode ? 'bg-slate-800' : 'bg-gray-300'}`}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {PLATFORMS.map((platform) => {
              const connected = isPlatformConnected(platform);
              const details = getPlatformDetails(platform);
              const Icon = platformIcons[platform] || Code2;

              let cardColorClass = darkMode ? "border-slate-800 bg-slate-900/50" : "border-gray-200 bg-white";
              if (connected && platformColors[platform]) {
                cardColorClass = platformColors[platform];
              }

              return (
                <div
                  key={platform}
                  className={`rounded-xl border p-4 transition-all ${cardColorClass}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className={connected ? "text-current" : "text-slate-400"} />
                      <h3 className="font-semibold">{platform}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {connected ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <AlertCircle size={14} className="text-slate-400" />
                      )}
                      <span className={`text-xs ${connected ? "text-green-400" : "text-slate-400"}`}>
                        {connected ? "Connected" : "Not Connected"}
                      </span>
                    </div>
                  </div>

                  {connected && details ? (
                    <div className="space-y-2">
                      <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="text-slate-400">Username:</span> {details.username}
                      </p>
                      {details.lastSyncedAt && (
                        <p className="text-xs text-slate-400">
                          Last synced: {formatDate(details.lastSyncedAt)}
                        </p>
                      )}
                      {!details.lastSyncedAt && (
                        <p className="text-xs text-slate-400">Never synced</p>
                      )}
                      {details.lastSyncStatus === "failed" && (
                        <p className="text-xs text-yellow-400 flex items-center gap-1">
                          <AlertCircle size={12} />
                          Last sync failed
                        </p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleSyncNow(platform)}
                          disabled={syncingPlatform === platform}
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs text-indigo-400 hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
                        >
                          {syncingPlatform === platform ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw size={12} />
                              Sync Now
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDisconnect(platform)}
                          disabled={isDisconnecting}
                          className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          <Unlink size={12} />
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openConnectModal(platform)}
                      className="mt-2 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 transition-colors"
                    >
                      <Link size={14} />
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Overall Progress */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Overall DSA Progress
          </h2>
          <button
            onClick={openTargetModal}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-slate-900'}`}
          >
            <Settings size={16} />
            Set Target
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading statistics...</div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-5">
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border-8 border-indigo-500">
                <span className="text-3xl font-bold">{stats.overallProgress}%</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                {stats.totalSolved} / {targetProblems} solved
              </p>
            </div>

            {[
              ["Problems Solved", stats.totalSolved],
              ["Easy", stats.easyCount],
              ["Medium", stats.mediumCount],
              ["Hard", stats.hardCount],
            ].map(([title, value]) => (
              <div key={title}>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {title}
                </p>
                <h3 className={`mt-2 text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {value}
                </h3>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Topics */}
      <div>
        <h2 className={`mb-4 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Topic Progress
        </h2>

        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading topics...</div>
        ) : stats.sortedTopics.length > 0 && stats.sortedTopics.some(t => t.solved > 0) ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.sortedTopics.filter(t => t.solved > 0).map((topic) => {
              const Icon = topic.icon;
              const percentage = Math.min(Math.round((topic.solved / Math.max(stats.totalSolved, 1)) * 100), 100);

              return (
                <Card key={topic.name}>
                  <div className="flex items-center gap-3">
                    <Icon className="text-cyan-400" size={20} />
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{topic.name}</h3>
                    <span className="ml-auto text-sm text-cyan-400">{topic.solved} solved</span>
                  </div>

                  <div className="mt-3 h-2 rounded bg-slate-800">
                    <div
                      className="h-2 rounded bg-indigo-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <p className={`mt-2 text-right text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {percentage}% of solved
                  </p>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400">
            No problems added yet. Start tracking your DSA progress!
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Topic Completion
              {chartData.length > 0 && (
                <span className={`ml-2 text-sm font-normal ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  ({chartData.length} {chartData.length === 1 ? 'topic' : 'topics'})
                </span>
              )}
            </h2>
            {hasMoreTopics && (
              <button
                onClick={toggleShowAllTopics}
                className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {showAllTopics ? (
                  <>
                    <ChevronUp size={16} />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Show All ({totalTopicsCount})
                  </>
                )}
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-400">Loading chart...</div>
          ) : chartData.length > 0 ? (
            <div className={isLargeDataset ? "max-h-500px overflow-y-auto pr-2" : ""}>
              <ResponsiveContainer 
                width="100%" 
                height={Math.min(Math.max(300, chartData.length * 35), 500)}
              >
                <BarChart 
                  data={chartData} 
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  barSize={isLargeDataset ? 20 : 32}
                  barGap={isLargeDataset ? 4 : 8}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="barGradientGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#4ade80" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="barGradientYellow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="barGradientRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#f87171" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={darkMode ? "#1e293b" : "#e2e8f0"} vertical={false} strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    stroke={darkMode ? "#94a3b8" : "#64748b"} 
                    tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: isLargeDataset ? 9 : 11 }}
                    axisLine={{ stroke: darkMode ? '#334155' : '#cbd5e1' }}
                    tickLine={false}
                    angle={isLargeDataset ? -45 : -35}
                    textAnchor="end"
                    height={isLargeDataset ? 80 : 70}
                    interval={isLargeDataset && chartData.length > 20 ? 1 : 0}
                  />
                  <YAxis 
                    stroke={darkMode ? "#94a3b8" : "#64748b"} 
                    tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: darkMode ? '#334155' : '#cbd5e1' }}
                    tickLine={false}
                  />
                  <Tooltip content={CustomTooltip} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
                  <Bar 
                    dataKey="solved" 
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {chartData.map((entry, index) => {
                      const maxSolved = chartData.length > 0 ? chartData[0].solved : 1;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getGradient(entry.solved, maxSolved)}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">No data to display</div>
          )}
        </Card>

        <Card>
          <h2 className={`mb-5 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Difficulty Breakdown
          </h2>

          {loading ? (
            <div className="py-10 text-center text-slate-400">Loading chart...</div>
          ) : stats.totalSolved > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={difficultyData}
                    dataKey="value"
                    innerRadius={70}
                    outerRadius={100}
                    label={renderCustomizedLabel}
                    labelLine={false}
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: darkMode ? "#1e293b" : "#ffffff", border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0", borderRadius: "8px" }}
                    labelStyle={{ color: darkMode ? "white" : "black" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-4 flex justify-center gap-6">
                {[
                  { name: "Easy", value: stats.easyCount, color: "#22c55e" },
                  { name: "Medium", value: stats.mediumCount, color: "#6366f1" },
                  { name: "Hard", value: stats.hardCount, color: "#ef4444" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">No problems solved yet</div>
          )}
        </Card>
      </div>

      {/* Recent Problems */}
      <Card>
        <h2 className={`mb-5 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Recent Problems
        </h2>

        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading problems...</div>
        ) : stats.recentProblems.length > 0 ? (
          <div className="space-y-3">
            {stats.recentProblems.map((problem) => (
              <div
                key={problem._id}
                className={`flex flex-col justify-between gap-3 rounded-xl border p-4 md:flex-row ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{problem.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${difficultyColors[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {problem.topic} • {problem.platform || "Other"}
                    {problem.solvedDate && ` • ${new Date(problem.solvedDate).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {problem.problemLink && (
                    <a
                      href={problem.problemLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white"
                    >
                      <ArrowUpRight size={18} />
                    </a>
                  )}
                  <button
                    onClick={() => openEditModal(problem)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => deleteProblem(problem._id)}
                    disabled={deletingId === problem._id}
                    className="text-slate-400 hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <Code2 className="mx-auto text-slate-600" size={45} />
            <h3 className={`mt-4 text-xl font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              No problems solved yet
            </h3>
            <p className="text-slate-400">Start tracking your DSA progress by adding problems.</p>
          </div>
        )}
      </Card>

      {/* Weak Topics */}
      <Card>
        <h2 className={`mb-4 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Weak Topics
        </h2>

        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading weak topics...</div>
        ) : stats.weakTopics.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {stats.weakTopics.map((topic) => (
              <div
                key={topic}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400"
              >
                {topic}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">
            {stats.totalSolved > 0 ? "Great job! No weak topics identified." : "Start solving problems to identify your weak topics."}
          </p>
        )}
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4 z-50">
          <div className={`w-full max-w-lg rounded-xl border p-6 max-h-[90vh] overflow-y-auto ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="mb-5 flex justify-between">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {editingProblem ? "Edit Problem" : "Add Problem"}
              </h2>

              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProblem(null);
                  setSelectedTopic("");
                  setCustomTopic("");
                  reset();
                }}
                className={darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-slate-900'}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <input
                  placeholder="Problem Title *"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${errors.title ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("title", { required: "Title is required" })}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div>
                <select
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${errors.topic ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("topic", { required: "Topic is required" })}
                  onChange={handleTopicChange}
                  value={selectedTopic}
                >
                  <option value="">Select Topic *</option>
                  {TOPICS.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
                {errors.topic && (
                  <p className="mt-1 text-sm text-red-500">{errors.topic.message}</p>
                )}
              </div>

              {selectedTopic === "Other" && (
                <div>
                  <input
                    placeholder="Custom Topic"
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                    value={customTopic}
                    onChange={handleCustomTopicChange}
                  />
                </div>
              )}

              <div>
                <select
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${errors.difficulty ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("difficulty", { required: "Difficulty is required" })}
                >
                  <option value="">Select Difficulty *</option>
                  {DIFFICULTIES.map((diff) => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
                {errors.difficulty && (
                  <p className="mt-1 text-sm text-red-500">{errors.difficulty.message}</p>
                )}
              </div>

              <div>
                <select
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("platform")}
                >
                  <option value="LeetCode">LeetCode</option>
                  <option value="Codeforces">Codeforces</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <input
                  placeholder="Problem Link (optional)"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("problemLink")}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                  Solved Date
                </label>
                <input
                  type="date"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("solvedDate")}
                />
              </div>

              <div>
                <textarea
                  placeholder="Notes (optional)"
                  rows="3"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 resize-none ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("notes")}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isSubmitting 
                  ? "Saving..." 
                  : editingProblem 
                    ? "Update Problem" 
                    : "Add Problem"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Target Setting Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4 z-50">
          <div className={`w-full max-w-md rounded-xl border p-6 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="mb-5 flex justify-between">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Set DSA Target</h2>
              <button
                onClick={() => setShowTargetModal(false)}
                className={darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-slate-900'}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                  Target Problems
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="Enter target number of problems"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                />
                <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Enter a positive whole number (e.g., 50, 100, 150)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTargetModal(false)}
                  className={`flex-1 rounded-lg border py-2 ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-gray-300 hover:bg-gray-100 text-slate-900'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTarget}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-500"
                >
                  Save Target
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Connect Modal */}
      {showPlatformModal && selectedPlatform && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4 z-50">
          <div className={`w-full max-w-md rounded-xl border p-6 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="mb-5 flex justify-between">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Connect {selectedPlatform}
              </h2>
              <button
                onClick={() => {
                  setShowPlatformModal(false);
                  setConnectingPlatform(null);
                  setVerificationStatus("");
                }}
                className={darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-slate-900'}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                  Username *
                </label>
                <input
                  type="text"
                  value={connectingPlatform?.username || ""}
                  onChange={(e) => setConnectingPlatform(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter your username"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                  Profile URL (optional)
                </label>
                <input
                  type="url"
                  value={connectingPlatform?.profileUrl || ""}
                  onChange={(e) => setConnectingPlatform(prev => ({ ...prev, profileUrl: e.target.value }))}
                  placeholder="https://..."
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                />
              </div>

              {(selectedPlatform === "Codeforces" || selectedPlatform === "LeetCode") && verificationStatus === "verifying" && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Verifying {selectedPlatform} account...
                </div>
              )}

              {(selectedPlatform === "Codeforces" || selectedPlatform === "LeetCode") && verificationStatus === "verified" && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle size={16} />
                  Account verified! Connecting...
                </div>
              )}

              {(selectedPlatform === "Codeforces" || selectedPlatform === "LeetCode") && verificationStatus === "failed" && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  Verification failed. Please check the username.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPlatformModal(false);
                    setConnectingPlatform(null);
                    setVerificationStatus("");
                  }}
                  className={`flex-1 rounded-lg border py-2 ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-gray-300 hover:bg-gray-100 text-slate-900'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnectSubmit}
                  disabled={isConnecting}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isConnecting 
                    ? (selectedPlatform === "Codeforces" || selectedPlatform === "LeetCode") && verificationStatus === "verifying"
                      ? `Verifying ${selectedPlatform}...`
                      : "Connecting..."
                    : "Connect"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DSA;