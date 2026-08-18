import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import {
  TrendingUp,
  Briefcase,
  Users,
  Award,
  Target,
  Lightbulb,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const colors = [
  "#6366F1",
  "#06B6D4",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#64748B",
];

const Card = ({ children }) => {
  const { darkMode } = useTheme();
  return (
    <div className={`rounded-2xl border p-5 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
      {children}
    </div>
  );
};

const Analytics = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("3m");
  const [data, setData] = useState({
    kpis: { applications: 0, interviews: 0, offers: 0, interviewConversion: 0, offerConversion: 0 },
    applicationTrend: [],
    statusDistribution: [],
    funnel: [],
    topCompanies: [],
    topRoles: [],
    monthlyPerformance: [],
    dsa: { solved: 0, byDifficulty: {}, byTopic: {}, byPlatform: {} },
    goals: { active: 0, completed: 0, total: 0, completionRate: 0 },
    insights: [],
  });

  // Fetch analytics when range changes
  useEffect(() => {
    let mounted = true;

    const fetchAnalytics = async () => {
      if (!mounted) return;
      setLoading(true);
      try {
        const response = await api.get(`/analytics?range=${range}`);
        if (mounted && response.data?.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
        if (mounted) {
          toast.error("Failed to load analytics");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      mounted = false;
    };
  }, [range]);

  const {
    kpis,
    applicationTrend,
    statusDistribution,
    funnel,
    topCompanies,
    topRoles,
    monthlyPerformance,
    insights,
  } = data;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="py-20 text-center text-slate-400">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* KPI */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Applications", kpis.applications, Briefcase],
            ["Interviews", kpis.interviews, Users],
            ["Offers", kpis.offers, Award],
            ["Interview Conversion", `${kpis.interviewConversion}%`, TrendingUp],
            ["Offer Conversion", `${kpis.offerConversion}%`, Target],
          ].map(([title, value, Icon]) => (
            <Card key={title}>
              <Icon className="text-indigo-400" />
              <p className={`mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{title}</p>
              <h2 className={`mt-2 text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</h2>
            </Card>
          ))}
        </div>

        {/* Applications Chart */}
        <Card>
          <h2 className={`mb-5 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Applications Over Time
          </h2>
          {applicationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={applicationTrend}>
                <CartesianGrid stroke={darkMode ? "#1e293b" : "#e2e8f0"} />
                <XAxis dataKey="month" stroke={darkMode ? "#94a3b8" : "#64748b"} />
                <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} />
                <Tooltip
                  contentStyle={{ backgroundColor: darkMode ? "#1e293b" : "#ffffff", border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0" }}
                  labelStyle={{ color: darkMode ? "white" : "black" }}
                />
                <Area
                  dataKey="applications"
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-10 text-center text-slate-400">
              No application data available yet.
            </div>
          )}
        </Card>

        {/* Status Distribution */}
        <Card>
          <h2 className={`mb-5 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Application Status Distribution
          </h2>
          {statusDistribution.some((s) => s.value > 0) ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  innerRadius={80}
                  outerRadius={120}
                >
                  {statusDistribution.map((_, index) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: darkMode ? "#1e293b" : "#ffffff", border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0" }}
                  labelStyle={{ color: darkMode ? "white" : "black" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-10 text-center text-slate-400">
              No status data available yet.
            </div>
          )}
        </Card>

        {/* Funnel */}
        <Card>
          <h2 className={`mb-5 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Interview Conversion Funnel
          </h2>
          <div className="space-y-4">
            {funnel.map((item, index) => (
              <div key={item.title}>
                <div className={`flex justify-between rounded-lg p-4 ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <span className={darkMode ? 'text-white' : 'text-slate-900'}>{item.title}</span>
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.value}</span>
                </div>
                {index !== funnel.length - 1 && (
                  <p className="py-2 text-center text-cyan-400">↓</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Companies + Roles */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className={`mb-4 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Most Applied Companies
            </h2>
            {topCompanies.length > 0 ? (
              topCompanies.map(({ name, count }) => (
                <div key={name} className={`flex justify-between border-b py-3 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                  <span className={darkMode ? 'text-white' : 'text-slate-900'}>{name}</span>
                  <span className="text-cyan-400">{count}</span>
                </div>
              ))
            ) : (
              <p className={`text-center py-4 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>No companies data available.</p>
            )}
          </Card>

          <Card>
            <h2 className={`mb-4 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Most Applied Roles
            </h2>
            {topRoles.length > 0 ? (
              topRoles.map(({ name, count }) => (
                <div key={name} className={`flex justify-between border-b py-3 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                  <span className={darkMode ? 'text-white' : 'text-slate-900'}>{name}</span>
                  <span className="text-cyan-400">{count}</span>
                </div>
              ))
            ) : (
              <p className={`text-center py-4 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>No roles data available.</p>
            )}
          </Card>
        </div>

        {/* Monthly Performance */}
        <Card>
          <h2 className={`mb-5 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Monthly Performance
          </h2>
          {monthlyPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={darkMode ? 'text-slate-400' : 'text-gray-500'}>
                  <tr>
                    <th className="pb-3">Month</th>
                    <th>Applications</th>
                    <th>Interviews</th>
                    <th>Offers</th>
                    <th>Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyPerformance.map((row) => (
                    <tr key={row.month} className={`border-t ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                      <td className={`py-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{row.month}</td>
                      <td className={darkMode ? 'text-white' : 'text-slate-900'}>{row.applications}</td>
                      <td className={darkMode ? 'text-white' : 'text-slate-900'}>{row.interviews}</td>
                      <td className={darkMode ? 'text-white' : 'text-slate-900'}>{row.offers}</td>
                      <td className={darkMode ? 'text-white' : 'text-slate-900'}>{row.conversion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              No monthly data available yet.
            </div>
          )}
        </Card>

        {/* Insights */}
        <Card>
          <h2 className={`mb-5 flex items-center gap-2 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <Lightbulb className="text-yellow-400" />
            Insights
          </h2>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4 text-indigo-200"
                >
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              Add some placement activity to start generating insights.
            </div>
          )}
        </Card>
      </>
    );
  };

  return (
    <div className={`space-y-6 min-h-screen p-4 sm:p-6 ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row"
      >
        <div>
          <h1 className="text-3xl font-bold">Placement Analytics</h1>
          <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Understand your application and interview performance.
          </p>
        </div>

        <select
          className={`rounded-lg border px-4 py-2 ${darkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
          value={range}
          onChange={(e) => setRange(e.target.value)}
          disabled={loading}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="3m">Last 3 months</option>
          <option value="year">This year</option>
        </select>
      </motion.div>

      {renderContent()}
    </div>
  );
};

export default Analytics;