import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Briefcase,
  FileText,
  Video,
  Code2,
  ArrowUpRight,
  Target,
  Calendar,
  Upload,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

// ===== Card Component =====
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

// ===== Stat Card =====
const StatCard = ({ title, value, icon: Icon, color = "indigo" }) => {
  const { darkMode } = useTheme();
  const colorClasses = {
    indigo: darkMode ? 'text-indigo-400' : 'text-indigo-600',
    green: darkMode ? 'text-green-400' : 'text-green-600',
    blue: darkMode ? 'text-blue-400' : 'text-blue-600',
    purple: darkMode ? 'text-purple-400' : 'text-purple-600',
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Icon className={colorClasses[color]} size={24} />
      </div>
      <p className={`mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
        {title}
      </p>
      <h2 className={`mt-1 text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </h2>
    </Card>
  );
};

// ===== Activity Item =====
const ActivityItem = ({ activity }) => {
  const { darkMode } = useTheme();
  const iconMap = {
    application: Briefcase,
    dsa: Code2,
    interview: Video,
    resume: FileText,
    goal: Target,
  };
  const Icon = iconMap[activity.type] || Briefcase;

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return "just now";
  };

  return (
    <div
      className={`flex items-center gap-3 border-b pb-3 last:border-b-0 last:pb-0 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}
    >
      <div className={`p-1.5 rounded-lg shrink-0 ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
        <Icon size={16} className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {activity.title}
        </p>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          {formatRelativeTime(activity.time)}
        </p>
      </div>
    </div>
  );
};

// ===== Smart Greeting =====
const SmartGreeting = ({ name }) => {
  const { darkMode } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", emoji: "🌅" };
    if (hour < 17) return { text: "Good afternoon", emoji: "☀️" };
    if (hour < 21) return { text: "Good evening", emoji: "🌇" };
    return { text: "Good night", emoji: "🌙" };
  };

  const quotes = [
    "Every expert was once a beginner. Keep going!",
    "Success is the sum of small efforts repeated daily.",
    "Your future is created by what you do today, not tomorrow.",
    "The only way to do great work is to love what you do.",
    "You don't have to be great to start, but you have to start to be great.",
    "Believe you can and you're halfway there.",
    "The best time to apply was yesterday. The next best time is now.",
    "Small daily improvements lead to stunning results over time.",
  ];

  const [randomQuote] = useState(() => {
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  const greeting = getGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center gap-3">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {greeting.text}{name ? `, ${name}` : ""}! {greeting.emoji}
        </h1>
        <Sparkles size={20} className={darkMode ? 'text-indigo-400' : 'text-indigo-500'} />
      </div>
      <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'} italic flex items-center gap-2`}>
        <span>“{randomQuote}”</span>
      </p>
    </motion.div>
  );
};

// ===== Upcoming Deadlines =====
const UpcomingDeadlines = ({ interviews, goals }) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff < 0) return `${Math.abs(diff)} days ago`;
    return `In ${diff} days`;
  };

  const deadlines = [];

  interviews.forEach((interview) => {
    deadlines.push({
      id: interview._id,
      type: "interview",
      title: `Interview with ${interview.company}`,
      date: interview.date,
      time: interview.time,
      formattedDate: formatDate(interview.date),
      priority: "high",
      route: "/interviews",
    });
  });

  goals.forEach((goal) => {
    if (goal.deadline) {
      deadlines.push({
        id: goal._id,
        type: "goal",
        title: `Goal: ${goal.title}`,
        date: goal.deadline,
        time: null,
        formattedDate: formatDate(goal.deadline),
        priority: goal.priority === "High" ? "high" : "normal",
        route: "/goals",
      });
    }
  });

  deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcoming = deadlines.slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center py-8">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={20} className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} />
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Upcoming Deadlines
          </h2>
        </div>
        <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>No upcoming deadlines! 🎉</p>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>You're all caught up.</p>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={20} className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} />
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Upcoming Deadlines
        </h2>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
          {upcoming.length}
        </span>
      </div>
      <div className="space-y-3">
        {upcoming.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(item.route)}
            className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all ${darkMode ? 'border-slate-800 hover:border-indigo-500/50' : 'border-gray-200 hover:border-indigo-400'}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-1.5 rounded-lg shrink-0 ${
                item.type === 'interview' 
                  ? darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                  : darkMode ? 'bg-purple-500/20' : 'bg-purple-100'
              }`}>
                {item.type === 'interview' ? (
                  <Video size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                ) : (
                  <Target size={16} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
                )}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock size={12} className={darkMode ? 'text-slate-500' : 'text-gray-400'} />
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {item.formattedDate}
                    {item.time && ` at ${item.time}`}
                  </span>
                </div>
              </div>
            </div>
            {item.priority === 'high' && (
              <AlertCircle size={16} className="text-red-400 shrink-0 ml-2" />
            )}
            <ArrowUpRight size={16} className={`shrink-0 ml-2 ${darkMode ? 'text-slate-600' : 'text-gray-400'}`} />
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

// ===== Quick Actions =====
const QuickActions = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const actions = [
    { label: "Add Job", icon: Briefcase, path: "/jobs", color: "indigo" },
    { label: "Add DSA", icon: Code2, path: "/dsa", color: "purple" },
    { label: "Add Interview", icon: Video, path: "/interviews", color: "blue" },
    { label: "Add Goal", icon: Target, path: "/goals", color: "green" },
    { label: "Upload Resume", icon: Upload, path: "/resumes", color: "cyan" },
  ];

  const colorMap = {
    indigo: darkMode ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200',
    purple: darkMode ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
    blue: darkMode ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
    green: darkMode ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20' : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
    cyan: darkMode ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-cyan-200',
  };

  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} />
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Quick Actions
        </h2>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-3">
        <div className="grid grid-cols-3 gap-2">
          {actions.slice(0, 3).map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-3 text-xs font-medium transition-all ${colorMap[action.color]} ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}
            >
              <action.icon size={20} />
              <span className="text-center leading-tight">{action.label}</span>
            </motion.button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mx-auto w-full max-w-[66.666%]">
          {actions.slice(3).map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-3 text-xs font-medium transition-all ${colorMap[action.color]} ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}
            >
              <action.icon size={20} />
              <span className="text-center leading-tight">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </Card>
  );
};

// ===== Main Dashboard =====
const Dashboard = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: { activeJobs: 0, resumes: 0, interviews: 0, dsaProblems: 0 },
    quickStats: { goalsCompleted: 0, successRate: 0, interviews: 0, offers: 0 },
    recentActivity: [],
    activeGoals: [],
    upcomingInterviews: [],
    totalApplications: 0,
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get("/dashboard");
        if (data.success) {
          setDashboardData(data.data);
        } else {
          setError(data.message || "Failed to load dashboard");
          toast.error(data.message || "Failed to load dashboard");
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        const message = error.response?.data?.message || "Failed to load dashboard";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const welcomeName = user?.name || "";

  if (loading) {
    return (
      <div className={`flex h-96 items-center justify-center ${darkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className={darkMode ? 'text-slate-400' : 'text-gray-500'}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex h-96 flex-col items-center justify-center ${darkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${darkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Smart Greeting */}
      <SmartGreeting name={welcomeName} />

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Jobs"
          value={dashboardData.stats.activeJobs}
          icon={Briefcase}
          color="indigo"
        />
        <StatCard
          title="Resumes"
          value={dashboardData.stats.resumes}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Interviews"
          value={dashboardData.stats.interviews}
          icon={Video}
          color="blue"
        />
        <StatCard
          title="DSA Problems"
          value={dashboardData.stats.dsaProblems}
          icon={Code2}
          color="purple"
        />
      </div>

      {/* Middle Row: Recent Activity + Upcoming Deadlines */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} />
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Recent Activity
              </h2>
            </div>
            <div className="space-y-4">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <ActivityItem key={index} activity={activity} />
                ))
              ) : (
                <div className={`text-center py-8 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  <p>No recent activity yet.</p>
                  <p className="text-sm mt-1">Start adding jobs, resumes, or solving DSA problems!</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <UpcomingDeadlines
            interviews={dashboardData.upcomingInterviews}
            goals={dashboardData.activeGoals}
          />
        </div>
      </div>

      {/* Bottom Row: Quick Stats + Quick Actions */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} />
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Quick Stats
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-lg border p-4 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Goals Completed</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {dashboardData.quickStats.goalsCompleted}
              </p>
            </div>
            <div className={`rounded-lg border p-4 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Success Rate</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {dashboardData.quickStats.successRate}%
              </p>
            </div>
            <div className={`rounded-lg border p-4 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total Interviews</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {dashboardData.quickStats.interviews}
              </p>
            </div>
            <div className={`rounded-lg border p-4 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Offers Received</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {dashboardData.quickStats.offers}
              </p>
            </div>
          </div>
        </Card>

        <QuickActions />
      </div>
    </div>
  );
};

export default Dashboard;