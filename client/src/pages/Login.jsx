import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Code2, ShieldCheck, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

const Login = () => {
  const { darkMode } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // ✅ Handle specific error cases
      if (error.response?.status === 404) {
        toast.error("Email doesn't exist. Please create an account.");
      } else if (error.response?.status === 401) {
        // ✅ Check if it's a Google-only account
        if (error.response?.data?.message?.includes("created with Google")) {
          toast.error("This account was created with Google. Please use 'Sign in with Google'.");
        } else {
          toast.error("Invalid credentials. Please try again.");
        }
      } else {
        const message = error.response?.data?.message || "Login failed. Please try again.";
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    try {
      window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/google`;
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Failed to login with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  const fieldClass = `mt-2 flex h-[52px] items-center rounded-xl border px-3.5 transition-all focus-within:ring-4 ${darkMode ? "border-white/10 bg-white/[0.035] focus-within:border-sky-400/60 focus-within:ring-sky-400/10" : "border-slate-200 bg-slate-50/60 focus-within:border-sky-400 focus-within:bg-white focus-within:ring-sky-500/10"}`;
  const textClass = darkMode ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400";
  const mutedClass = darkMode ? "text-slate-500" : "text-slate-500";

  return (
    <main className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 ${darkMode ? "bg-[#080a0f]" : "bg-[#f5f6f8]"}`}>
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: `linear-gradient(${darkMode ? "rgba(148,163,184,0.035)" : "rgba(71,85,105,0.035)"} 1px, transparent 1px), linear-gradient(90deg, ${darkMode ? "rgba(148,163,184,0.035)" : "rgba(71,85,105,0.035)"} 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />
      <div className={`pointer-events-none absolute left-1/2 -top-45 h-105 w-170 -translate-x-1/2 rounded-full blur-3xl ${darkMode ? "bg-sky-500/8" : "bg-sky-300/16"}`} />

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className={`relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border shadow-[0_28px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[0.88fr_1.12fr] ${darkMode ? "border-white/9 bg-[#11151d] shadow-black/30" : "border-slate-200/90 bg-white"}`}>
        <section className="relative hidden overflow-hidden bg-[#163b58] p-10 text-white lg:flex lg:min-h-162.5 lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 26, repeat: Infinity, ease: "linear" }} className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full border-24 border-sky-200/8" />
          <div className="relative"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/8"><Code2 size={19} /></div><div><p className="text-base font-semibold tracking-[-0.03em]">DevPilot</p><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-sky-200/60">Career operating system</p></div></div><div className="mt-24 max-w-sm"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200/70"><Sparkles size={14} /> Your next chapter starts here</p><h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.07em]">Make progress feel visible.</h2><p className="mt-5 text-sm leading-7 text-sky-100/65">A focused workspace for applications, preparation, interviews, and the small wins that move your career forward.</p></div></div>
          <div className="relative flex items-center gap-3 border-t border-white/10 pt-5 text-xs text-sky-100/55"><ShieldCheck size={16} className="text-sky-200/70" /> Your workspace is ready when you are.</div>
        </section>

        <section className="flex items-center px-6 py-9 sm:px-12 sm:py-12 lg:px-14">
          <div className="mx-auto w-full max-w-107.5">
            <div className="mb-10 flex items-center gap-3 lg:hidden"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${darkMode ? "bg-sky-400/10 text-sky-300" : "bg-sky-50 text-sky-600"}`}><Code2 size={19} /></div><div><p className={`text-base font-semibold tracking-[-0.03em] ${darkMode ? "text-white" : "text-slate-950"}`}>DevPilot</p><p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${mutedClass}`}>Career operating system</p></div></div>
            <div><p className={`text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500`}>Welcome back</p><h1 className={`mt-3 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl ${darkMode ? "text-white" : "text-slate-950"}`}>Sign in to your workspace.</h1><p className={`mt-3 text-sm leading-6 ${mutedClass}`}>Pick up where you left off and keep your career momentum moving.</p></div>

            <button onClick={handleGoogleLogin} disabled={isGoogleLoading} className={`mt-8 flex h-13 w-full items-center justify-center gap-3 rounded-xl border text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${darkMode ? "border-white/10 bg-white/4 text-slate-200 hover:border-white/20 hover:bg-white/[0.07]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}>
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              {isGoogleLoading ? "Connecting..." : "Continue with Google"}
            </button>

            <div className="relative my-7"><div className={`absolute inset-0 flex items-center border-t ${darkMode ? "border-white/10" : "border-slate-200"}`} /><div className="relative flex justify-center"><span className={`px-3 text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "bg-[#11151d] text-slate-600" : "bg-white text-slate-400"}`}>or continue with email</span></div></div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div><label className={`block text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Email address</label><div className={fieldClass}><Mail size={17} className={darkMode ? "text-slate-500" : "text-slate-400"} /><input type="email" placeholder="you@example.com" className={`w-full bg-transparent px-3 text-sm outline-none ${textClass}`} {...register("email", { required: "Email is required", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Please enter a valid email" } })} /></div>{errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}</div>
              <div><div className="flex items-center justify-between"><label className={`block text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Password</label><span className={`text-[11px] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Your account password</span></div><div className={fieldClass}><Lock size={17} className={darkMode ? "text-slate-500" : "text-slate-400"} /><input type={showPassword ? "text" : "password"} placeholder="Enter your password" className={`w-full bg-transparent px-3 text-sm outline-none ${textClass}`} {...register("password", { required: "Password is required" })} /><button type="button" onClick={() => setShowPassword(!showPassword)} className={`transition-colors ${darkMode ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}</div>
              <button type="submit" disabled={isLoading} className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,116,144,0.22)] transition-all hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-[0_16px_34px_rgba(14,116,144,0.28)] disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? "Signing in..." : "Sign in"}<ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" /></button>
            </form>
            <p className={`mt-8 text-center text-sm ${mutedClass}`}>Don&apos;t have an account? <Link to="/register" className="font-semibold text-sky-500 transition-colors hover:text-sky-400">Create one <span aria-hidden="true">→</span></Link></p>
          </div>
        </section>
      </motion.div>
    </main>
  );
};

export default Login;
