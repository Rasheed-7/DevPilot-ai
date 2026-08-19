import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Check,
  Code2,
  FileText,
  Play,
  Sparkles,
  Target,
  Video,
} from "lucide-react";

const Landing = () => {
  const { darkMode } = useTheme();

  const features = [
    { icon: Briefcase, title: "Job Tracker", description: "Track applications, interviews, and offers in one place." },
    { icon: FileText, title: "Resume Manager", description: "Upload, version, and manage your resumes." },
    { icon: Video, title: "Interview Prep", description: "Log interviews, questions, and feedback." },
    { icon: Code2, title: "DSA Progress", description: "Track your problem-solving journey." },
    { icon: Target, title: "Goal Setting", description: "Set and achieve your career goals." },
    { icon: BarChart3, title: "Analytics", description: "Get insights into your placement progress." },
  ];

  const stats = [
    ["Users", "500+"],
    ["Applications Tracked", "5,000+"],
    ["Interviews Logged", "1,200+"],
  ];

  return (
    <div
      className={`min-h-screen overflow-hidden transition-colors duration-300 ${
        darkMode ? "bg-[#0a0d12] text-white" : "bg-[#f8f9fb] text-[#10141c]"
      }`}
    >
      <section className="relative border-b border-black/[0.07] dark:border-white/8">
        <div className="pointer-events-none absolute inset-0">
          <div className={`absolute left-1/2 top-0 h-130 w-190 -translate-x-1/2 rounded-full blur-3xl ${darkMode ? "bg-indigo-500/6" : "bg-indigo-300/16"}`} />
          <div className={`absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.04),transparent)] ${darkMode ? "opacity-100" : "opacity-60"}`} />
        </div>

        <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${darkMode ? "border-indigo-400/20 bg-indigo-400/10" : "border-indigo-200 bg-indigo-50"}`}>
              <Code2 size={18} className="text-indigo-500" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-[-0.03em]">DevPilot</span>
          </div>
          <Link
            to="/login"
            className={`text-sm font-medium transition-colors ${darkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-950"}`}
          >
            Sign in <span className="ml-1 hidden sm:inline">to your workspace</span>
          </Link>
        </header>

        <div className="relative mx-auto grid min-h-170 max-w-7xl items-center gap-16 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:px-10 lg:pb-28 lg:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className={`inline-flex items-center gap-2 border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${darkMode ? "border-white/10 bg-white/4 text-indigo-300" : "border-indigo-200/80 bg-white text-indigo-600 shadow-sm"}`}>
              <Sparkles size={14} />
              Your career operating system
            </div>

            <h1 className={`mt-7 max-w-xl text-5xl font-semibold leading-[1.04] tracking-[-0.065em] sm:text-6xl lg:text-[76px] ${darkMode ? "text-white" : "text-[#111827]"}`}>
              Build the career you&apos;re <span className="text-indigo-500">capable of.</span>
            </h1>
            <p className={`mt-7 max-w-xl text-base leading-7 sm:text-lg ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              The all-in-one platform to track your placement journey, from applications to offers. Replace scattered notes with a clear path forward.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(79,70,229,0.22)] transition-all hover:bg-indigo-500 hover:shadow-[0_16px_32px_rgba(79,70,229,0.28)]"
              >
                Get started free
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-semibold transition-colors ${darkMode ? "border-white/15 text-slate-200 hover:border-white/25 hover:bg-white/5" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"}`}
              >
                <Play size={15} fill="currentColor" />
                Explore the workspace
              </Link>
            </div>

            <div className={`mt-12 flex flex-wrap gap-x-8 gap-y-5 border-t pt-7 sm:gap-x-12 ${darkMode ? "border-white/10" : "border-slate-200"}`}>
              {stats.map(([label, value]) => (
                <div key={label}>
                  <p className={`text-2xl font-semibold tracking-[-0.04em] ${darkMode ? "text-white" : "text-slate-950"}`}>{value}</p>
                  <p className={`mt-1 text-xs font-medium uppercase tracking-[0.12em] ${darkMode ? "text-slate-500" : "text-slate-500"}`}>{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative mx-auto w-full max-w-132.5 lg:ml-auto"
          >
            <div className={`absolute -inset-4 border ${darkMode ? "border-white/4" : "border-indigo-100/70"}`} />
            <div className={`relative border p-3 shadow-2xl ${darkMode ? "border-white/10 bg-[#11151d] shadow-black/30" : "border-slate-200 bg-white shadow-slate-200/70"}`}>
              <div className={`flex items-center justify-between border-b px-3 pb-3 ${darkMode ? "border-white/10" : "border-slate-100"}`}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Career overview</span>
                </div>
                <span className={`text-[10px] font-medium uppercase tracking-[0.14em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>This week</span>
              </div>
              <div className="grid gap-3 p-2 pt-5 sm:grid-cols-[1.05fr_0.95fr]">
                <div className={`border p-5 ${darkMode ? "border-white/10 bg-white/2.5" : "border-slate-100 bg-slate-50/70"}`}>
                  <p className={`text-xs font-medium ${darkMode ? "text-slate-500" : "text-slate-500"}`}>Placement workspace</p>
                  <p className={`mt-3 text-2xl font-semibold tracking-tighter ${darkMode ? "text-white" : "text-slate-950"}`}>Stay in motion.</p>
                  <div className="mt-6 space-y-4">
                    {["Applications", "Resume versions", "Interview prep"].map((item, index) => (
                      <div key={item}>
                        <div className="mb-2 flex items-center justify-between text-xs"><span className="text-slate-500">{item}</span><Check size={14} className={index === 1 ? "text-slate-400" : "text-emerald-500"} /></div>
                        <div className={`h-1.5 ${darkMode ? "bg-white/10" : "bg-slate-200"}`}><div className={`h-full ${index === 1 ? "w-1/2 bg-slate-300 dark:bg-slate-600" : index === 2 ? "w-3/4 bg-indigo-400" : "w-full bg-indigo-500"}`} /></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-rows-2">
                  {[['Job Tracker', Briefcase], ['Analytics', BarChart3]].map(([label, Icon]) => (
                    <div key={label} className={`border p-4 ${darkMode ? "border-white/10 bg-white/2.5" : "border-slate-100 bg-white"}`}>
                      <Icon size={18} className="text-indigo-500" />
                      <p className={`mt-5 text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{label}</p>
                      <p className="mt-1 text-xs text-slate-500">Keep your progress visible.</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`mx-2 mt-1 border p-4 ${darkMode ? "border-white/10" : "border-slate-100"}`}>
                <div className="flex items-center justify-between"><p className="text-xs font-semibold">Your career, organized</p><Target size={16} className="text-indigo-500" /></div>
                <div className="mt-5 flex h-2 gap-1.5"><div className="h-full flex-1 bg-indigo-500" /><div className="h-full flex-1 bg-indigo-400" /><div className="h-full flex-1 bg-indigo-300" /><div className={`h-full flex-1 ${darkMode ? "bg-white/10" : "bg-slate-200"}`} /><div className={`h-full flex-1 ${darkMode ? "bg-white/10" : "bg-slate-200"}`} /></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className={`px-5 py-24 sm:px-8 lg:px-10 ${darkMode ? "bg-[#0d1118]" : "bg-white"}`}>
        <div className="mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">One focused workspace</p>
            <h2 className={`mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl ${darkMode ? "text-white" : "text-slate-950"}`}>Everything you need to move forward.</h2>
            <p className={`mt-4 max-w-xl leading-7 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Track, analyze, and optimize your placement preparation without losing sight of the bigger picture.</p>
          </motion.div>

          {/* ✅ Feature Cards with Smooth Hover Effect */}
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {features.map((feature, index) => {
    const Icon = feature.icon;
    return (
      <motion.div
        key={feature.title}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 * index }}
        className={`
          group min-h-55 p-7 backdrop-blur-sm 
          rounded-2xl 
          border 
          transition-all duration-500 ease-out
          hover:scale-[1.003] hover:-translate-y-0.5
          ${darkMode 
            ? "bg-[#0d1118]/75 border-white/10 hover:border-white/15 hover:bg-[#121823]/80" 
            : "bg-white/80 border-slate-200/60 hover:border-slate-300/80 hover:bg-white/90"
          }
        `}
      >
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-300 ${darkMode ? "border-indigo-400/20 bg-indigo-400/10 group-hover:border-indigo-400/30 group-hover:bg-indigo-400/15" : "border-indigo-100 bg-indigo-50 group-hover:border-indigo-200 group-hover:bg-indigo-100/80"}`}>
          <Icon size={19} className="text-indigo-500" />
        </div>
        <h3 className={`mt-8 text-lg font-semibold tracking-[-0.02em] ${darkMode ? "text-white" : "text-slate-950"}`}>
          {feature.title}
        </h3>
        <p className={`mt-2 max-w-xs text-sm leading-6 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          {feature.description}
        </p>
      </motion.div>
    );
  })}
</div>
        </div>
      </section>

      <section className={`border-t px-5 py-24 sm:px-8 lg:px-10 ${darkMode ? "border-white/10 bg-[#0a0d12]" : "border-slate-200 bg-[#f8f9fb]"}`}>
        <div className={`relative mx-auto max-w-5xl overflow-hidden border px-6 py-14 text-center sm:px-12 ${darkMode ? "border-white/10 bg-[#11151d]" : "border-slate-200 bg-white"}`}>
          <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-64 -translate-x-1/2 bg-indigo-500/10 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">Start with clarity</p>
            <h2 className={`mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl ${darkMode ? "text-white" : "text-slate-950"}`}>Ready to take control of your career?</h2>
            <p className={`mx-auto mt-4 max-w-lg leading-7 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Join thousands of students using DevPilot to turn preparation into progress and land their dream jobs.</p>
            <Link to="/register" className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">
              Start your journey <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;