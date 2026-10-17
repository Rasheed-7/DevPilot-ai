import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import {
  TrendingUp,
  Briefcase,
  Target,
  Lightbulb,
  Activity,
  Crosshair,
  Radar,
  Layers3,
  Compass,
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

const colors = ["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#64748b", "#8b5cf6", "#38bdf8"];

const Surface = ({ children, className = "" }) => {
  const { darkMode } = useTheme();
  return (
    <section
      className={`rounded-[26px] border ${
        darkMode ? "border-white/8 bg-[#11161e]" : "border-slate-200/80 bg-white"
      } ${className}`}
    >
      {children}
    </section>
  );
};

const EmptyState = ({ children, icon: Icon = Compass }) => {
  const { darkMode } = useTheme();
  return (
    <div className={`flex min-h-42.5 flex-col items-center justify-center px-6 py-10 text-center ${darkMode ? "text-slate-500" : "text-slate-500"}`}>
      <Icon size={25} className="text-sky-600" />
      <p className="mt-4 max-w-sm text-sm leading-6">{children}</p>
    </div>
  );
};

const Analytics = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("3m");
  const [data, setData] = useState({
    kpis: {
      applications: 0,
      interviews: 0,
      offers: 0,
      interviewConversion: 0,
      offerConversion: 0,
    },
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
        if (mounted) toast.error("Failed to load analytics");
      } finally {
        if (mounted) setLoading(false);
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

  const safeTrend = applicationTrend || [];
  const safeStatus = statusDistribution || [];
  const safeFunnel = funnel || [];
  const safeCompanies = topCompanies || [];
  const safeRoles = topRoles || [];
  const safeMonthly = monthlyPerformance || [];
  const safeInsights = insights || [];

  const chartTheme = {
    grid: darkMode ? "#24303d" : "#e7edf2",
    axis: darkMode ? "#718096" : "#94a3b8",
    tooltipBackground: darkMode ? "#151d27" : "#ffffff",
    tooltipBorder: darkMode ? "#304052" : "#dbe4ea",
  };

  const rangeOptions = [
    ["7d", "Last 7 days"],
    ["30d", "Last 30 days"],
    ["3m", "Last 3 months"],
    ["year", "This year"],
  ];

  const renderLoading = () => (
    <div className="space-y-7">
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className={`h-72 animate-pulse rounded-[26px] ${darkMode ? "bg-white/4" : "bg-slate-100"}`} />
        <div className={`h-72 animate-pulse rounded-[26px] ${darkMode ? "bg-white/4" : "bg-slate-100"}`} />
      </div>
      <div className={`h-80 animate-pulse rounded-[26px] ${darkMode ? "bg-white/4" : "bg-slate-100"}`} />
      <div className="grid gap-7 lg:grid-cols-2"><div className={`h-72 animate-pulse rounded-[26px] ${darkMode ? "bg-white/4" : "bg-slate-100"}`} /><div className={`h-72 animate-pulse rounded-[26px] ${darkMode ? "bg-white/4" : "bg-slate-100"}`} /></div>
    </div>
  );

  const renderTrendTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className={`rounded-xl border px-3 py-2 shadow-xl ${darkMode ? "border-white/10 bg-[#151d27]" : "border-slate-200 bg-white"}`}>
        <p className={`text-xs font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>{label}</p>
        <p className="mt-1 text-xs text-sky-600">Applications: <span className="font-bold">{payload[0].value}</span></p>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return renderLoading();

    return (
      <div className="space-y-7">
        <div className="grid gap-7 xl:grid-cols-[minmax(0,1.25fr)_380px]">
          <Surface className="relative overflow-hidden p-6 sm:p-9">
            <div className="absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full border border-sky-500/10" />
            <div className="relative flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">Placement brief</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.07em]">Where you are right now</h2>
                <p className={`mt-2 max-w-xl text-sm leading-6 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>A live read of your placement activity across the selected period.</p>
              </div>
              <Crosshair size={21} className={darkMode ? "text-slate-600" : "text-slate-400"} />
            </div>
            <div className="relative mt-11 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-7xl font-semibold tracking-[-0.12em]">{kpis.applications}</p>
                <p className={`mt-2 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}>applications in motion</p>
              </div>
              <div className="grid grid-cols-2 gap-x-9 gap-y-5 sm:text-right">
                <div><p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Interviews</p><p className="mt-1 text-2xl font-semibold tracking-[-0.06em]">{kpis.interviews}</p></div>
                <div><p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Offers</p><p className="mt-1 text-2xl font-semibold tracking-[-0.06em]">{kpis.offers}</p></div>
                <div><p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Interview conversion</p><p className="mt-1 text-lg font-semibold text-sky-600">{kpis.interviewConversion}%</p></div>
                <div><p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Offer conversion</p><p className="mt-1 text-lg font-semibold text-teal-600">{kpis.offerConversion}%</p></div>
              </div>
            </div>
            <div className={`relative mt-9 grid grid-cols-3 border-t pt-5 ${darkMode ? "border-white/8" : "border-slate-100"}`}>
              <div><p className={`text-[10px] uppercase tracking-[0.15em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Activity</p><p className="mt-1 text-sm font-semibold">{safeTrend.length ? "Tracked" : "Awaiting data"}</p></div>
              <div><p className={`text-[10px] uppercase tracking-[0.15em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Pipeline</p><p className="mt-1 text-sm font-semibold">{safeFunnel.length ? "Visible" : "No stages"}</p></div>
              <div><p className={`text-[10px] uppercase tracking-[0.15em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Range</p><p className="mt-1 text-sm font-semibold">{range === "7d" ? "7 days" : range === "30d" ? "30 days" : range === "3m" ? "3 months" : "This year"}</p></div>
            </div>
          </Surface>

          <Surface className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600">Pipeline signal</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.07em]">What happens next</h2></div><Radar size={21} className={darkMode ? "text-slate-600" : "text-slate-400"} /></div>
            {safeFunnel.length > 0 ? <div className="mt-8 space-y-2">{safeFunnel.map((item, index) => { const max = Math.max(...safeFunnel.map((entry) => Number(entry.value) || 0), 1); const width = Math.max(Math.round(((Number(item.value) || 0) / max) * 100), 8); return <motion.div key={item.title} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }} className="relative"><div className="flex items-center justify-between gap-3"><span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{item.title}</span><span className="text-sm font-semibold">{item.value}</span></div><div className={`mt-2 h-8 overflow-hidden rounded-lg ${darkMode ? "bg-white/6" : "bg-slate-100"}`}><motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ duration: 0.65, delay: index * 0.06 }} className={`h-full rounded-lg ${index === 0 ? "bg-sky-500" : index === safeFunnel.length - 1 ? "bg-teal-500" : "bg-sky-500/60"}`} /></div></motion.div>; })}</div> : <EmptyState icon={Radar}>Add applications and interviews to reveal how your pipeline moves.</EmptyState>}
            <div className={`mt-7 border-t pt-5 ${darkMode ? "border-white/8" : "border-slate-100"}`}><p className={`text-xs leading-5 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>The funnel mirrors the stages returned by your analytics data.</p></div>
          </Surface>
        </div>

        <Surface className="overflow-hidden">
          <div className={`flex flex-col gap-3 border-b px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 ${darkMode ? "border-white/8" : "border-slate-100"}`}><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">Application cadence</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.07em]">How your activity is moving</h2><p className={`mt-2 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}>Applications recorded across the selected range.</p></div><Activity size={19} className={darkMode ? "text-slate-600" : "text-slate-400"} /></div>
          {safeTrend.length > 0 ? <div className="px-3 pb-5 pt-7 sm:px-8"><ResponsiveContainer width="100%" height={300}><AreaChart data={safeTrend} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}><defs><linearGradient id="analyticsCadence" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} /><stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke={chartTheme.grid} vertical={false} strokeDasharray="3 6" /><XAxis dataKey="month" stroke={chartTheme.axis} tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis stroke={chartTheme.axis} tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip content={renderTrendTooltip} cursor={{ stroke: "#0ea5e9", strokeOpacity: 0.25 }} /><Area type="monotone" dataKey="applications" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#analyticsCadence)" dot={{ r: 3, fill: "#0ea5e9", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#0ea5e9", stroke: darkMode ? "#11161e" : "#ffffff", strokeWidth: 3 }} /></AreaChart></ResponsiveContainer></div> : <EmptyState icon={Activity}>Application activity will become a readable cadence once you begin recording applications.</EmptyState>}
        </Surface>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Surface className="overflow-hidden"><div className={`flex items-end justify-between border-b px-6 py-6 sm:px-8 ${darkMode ? "border-white/8" : "border-slate-100"}`}><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Pipeline composition</p><h2 className="mt-2 text-xl font-semibold tracking-tighter">Where applications are sitting</h2></div><Layers3 size={19} className={darkMode ? "text-slate-600" : "text-slate-400"} /></div>{safeStatus.some((status) => status.value > 0) ? <div className="grid gap-8 p-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center sm:p-8"><div className="relative mx-auto h-52.5 w-52.5"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={safeStatus} dataKey="value" innerRadius={70} outerRadius={96} paddingAngle={3} stroke="none">{safeStatus.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: "10px", color: darkMode ? "white" : "#0f172a" }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><p className="text-3xl font-semibold tracking-[-0.08em]">{kpis.applications}</p><p className={`mt-1 text-[10px] uppercase tracking-[0.15em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>applications</p></div></div><div className="space-y-4">{safeStatus.map((status, index) => <div key={status.name} className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} /><span className={`flex-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{status.name}</span><span className="text-sm font-semibold">{status.value}</span></div>)}</div></div> : <EmptyState icon={Layers3}>Status composition will appear here as applications move through your process.</EmptyState>}</Surface>

          <Surface className="overflow-hidden"><div className={`flex items-end justify-between border-b px-6 py-6 sm:px-8 ${darkMode ? "border-white/8" : "border-slate-100"}`}><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600">Search direction</p><h2 className="mt-2 text-xl font-semibold tracking-tighter">Where your effort is pointed</h2></div><Target size={19} className={darkMode ? "text-slate-600" : "text-slate-400"} /></div><div className="grid gap-7 p-6 sm:p-8"><div><p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Companies</p>{safeCompanies.length > 0 ? <div className="mt-4 space-y-3">{safeCompanies.map((item, index) => { const max = Math.max(...safeCompanies.map((entry) => Number(entry.count) || 0), 1); return <div key={item.name} className="flex items-center gap-3"><span className={`w-5 text-xs ${darkMode ? "text-slate-600" : "text-slate-400"}`}>0{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.name}</span><div className={`hidden h-1.5 w-20 overflow-hidden rounded-full sm:block ${darkMode ? "bg-white/[0.07]" : "bg-slate-100"}`}><div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max((Number(item.count) / max) * 100, 8)}%` }} /></div><span className="w-6 text-right text-sm font-semibold text-sky-600">{item.count}</span></div>; })}</div> : <p className={`mt-4 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}>No company data available.</p>}</div><div><p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Roles</p>{safeRoles.length > 0 ? <div className="mt-4 space-y-3">{safeRoles.map((item, index) => <div key={item.name} className="flex items-center gap-3"><span className={`w-5 text-xs ${darkMode ? "text-slate-600" : "text-slate-400"}`}>0{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.name}</span><span className="w-6 text-right text-sm font-semibold text-teal-600">{item.count}</span></div>)}</div> : <p className={`mt-4 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}>No role data available.</p>}</div></div></Surface>
        </div>

        <Surface className="overflow-hidden">
          <div className={`flex flex-col gap-3 border-b px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 ${darkMode ? "border-white/8" : "border-slate-100"}`}><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">Performance journal</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.07em]">How the journey has changed</h2></div><TrendingUp size={19} className={darkMode ? "text-slate-600" : "text-slate-400"} /></div>{safeMonthly.length > 0 ? <div className={`divide-y px-6 sm:px-8 ${darkMode ? "divide-white/8" : "divide-slate-100"}`}>{safeMonthly.map((row) => <div key={row.month} className="grid gap-4 py-5 sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_90px] sm:items-center"><p className="text-sm font-semibold">{row.month}</p><div><p className={`text-[10px] uppercase tracking-[0.14em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Applications</p><p className="mt-1 text-lg font-semibold">{row.applications}</p></div><div><p className={`text-[10px] uppercase tracking-[0.14em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Interviews</p><p className="mt-1 text-lg font-semibold">{row.interviews}</p></div><div><p className={`text-[10px] uppercase tracking-[0.14em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Offers</p><p className="mt-1 text-lg font-semibold">{row.offers}</p></div><div className="sm:text-right"><p className={`text-[10px] uppercase tracking-[0.14em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Conversion</p><p className="mt-1 text-lg font-semibold text-sky-600">{row.conversion}</p></div></div>)}</div> : <EmptyState icon={TrendingUp}>Monthly performance will form a clearer record as more placement activity is captured.</EmptyState>}</Surface>

        <Surface className="overflow-hidden">
          <div className={`flex flex-col gap-3 border-b px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 ${darkMode ? "border-white/8" : "border-slate-100"}`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Analyst notes</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.07em]">A closer read of your journey</h2>
              <p className={`mt-2 max-w-xl text-sm leading-6 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>
                Real observations from your placement activity, kept together as a concise briefing.
              </p>
            </div>
            <Lightbulb size={19} className="text-amber-500" />
          </div>
          {safeInsights.length > 0 ? (
            <div className={`divide-y ${darkMode ? "divide-white/8" : "divide-slate-100"}`}>
              {safeInsights.map((item, index) => (
                <motion.article
                  key={item}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="group flex gap-5 px-6 py-6 sm:px-8"
                >
                  <div className="flex shrink-0 flex-col items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${darkMode ? "border-amber-300/20 bg-amber-400/10 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {index < safeInsights.length - 1 && <span className={`h-full w-px ${darkMode ? "bg-white/8" : "bg-slate-100"}`} />}
                  </div>
                  <p className={`max-w-4xl pt-1 text-sm leading-7 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    {item}
                  </p>
                </motion.article>
              ))}
            </div>
          ) : (
            <EmptyState icon={Lightbulb}>Add placement activity to start receiving real insights about your journey.</EmptyState>
          )}
        </Surface>
      </div>
    );
  };

  return (
    <main className={`min-h-screen px-4 py-5 sm:px-6 sm:py-8 lg:px-10 ${darkMode ? "bg-[#080a0f] text-white" : "bg-[#f4f6f8] text-slate-900"}`}>
      <div className="mx-auto max-w-360">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col gap-7 border-b pb-8 lg:flex-row lg:items-end lg:justify-between ${darkMode ? "border-white/8" : "border-slate-200"}`}>
          <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-600"><Briefcase size={14} /> DevPilot / Placement intelligence</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.08em] sm:text-6xl">Read the shape of your search.</h1><p className={`mt-4 max-w-2xl text-sm leading-6 sm:text-base ${darkMode ? "text-slate-400" : "text-slate-500"}`}>A data-driven view of your applications, interviews, and offers—organized as one placement story.</p></div>
          <div className={`flex flex-wrap gap-1 rounded-xl border p-1 ${darkMode ? "border-white/10 bg-white/4" : "border-slate-200 bg-white"}`} role="group" aria-label="Analytics range">{rangeOptions.map(([value, label]) => <button key={value} type="button" onClick={() => setRange(value)} disabled={loading} aria-pressed={range === value} title={label} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:px-4 ${range === value ? "bg-sky-600 text-white shadow-sm" : darkMode ? "text-slate-500 hover:text-slate-200" : "text-slate-500 hover:text-slate-900"} disabled:opacity-50`}>{value === "7d" ? "7D" : value === "30d" ? "30D" : value === "3m" ? "3M" : "YEAR"}</button>)}</div>
        </motion.header>

        <div className="mt-8">{renderContent()}</div>
      </div>
    </main>
  );
};

export default Analytics;
