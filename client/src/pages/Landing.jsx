import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  Sparkles,
  Briefcase,
  FileText,
  Video,
  Code2,
  Target,
  BarChart3,
  ArrowRight,
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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      {/* Hero Section */}
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-sm text-indigo-400">
            <Sparkles size={16} />
            <span>Your Career Operating System</span>
          </div>

          <h1 className="mt-6 text-5xl font-bold sm:text-6xl lg:text-7xl">
            <span className="bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              DevPilot
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg sm:text-xl">
            The all-in-one platform to track your placement journey,
            from applications to offers.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-500 transition"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className={`rounded-lg border px-6 py-3 transition ${darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-300 hover:bg-gray-100'}`}
            >
              Sign In
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            {[
              ["Users", "500+"],
              ["Applications Tracked", "5,000+"],
              ["Interviews Logged", "1,200+"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className={`border-t py-16 px-4 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Everything You Need to Succeed
            </h2>
            <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Track, analyze, and optimize your placement preparation.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`rounded-2xl border p-6 transition ${darkMode ? 'border-slate-800 bg-slate-900 hover:border-slate-700' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/20">
                    <Icon className="text-indigo-400" size={24} />
                  </div>
                  <h3 className={`mt-4 text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {feature.title}
                  </h3>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`border-t py-16 px-4 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Ready to Take Control of Your Career?
          </h2>
          <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Join thousands of students using DevPilot to land their dream jobs.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 text-white hover:bg-indigo-500 transition"
          >
            Start Your Journey
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;