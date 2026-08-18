import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

const Register = () => {
  const { darkMode } = useTheme();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [password, setPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await registerUser(data.name, data.email, data.password);
      
      if (result.success) {
        // ✅ Check if it was a Google-only user who set password
        if (result.message?.includes("Password set successfully")) {
          toast.success("Password set successfully! You can now login with email and password.");
        } else {
          toast.success("Account created successfully! Welcome to DevPilot!");
        }
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle duplicate email with password
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes("already registered")) {
        toast.error("Email already registered. Please login instead.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        const message = error.response?.data?.message || "Registration failed. Please try again.";
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    setIsGoogleLoading(true);
    try {
      window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/google`;
    } catch (error) {
      console.error("Google registration error:", error);
      toast.error("Failed to register with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center p-4 ${darkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md rounded-2xl border p-8 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}
      >
        <div className="text-center">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Create Account</h1>
          <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Start your placement journey with DevPilot
          </p>
        </div>

        {/* Google Register Button */}
        <button
          onClick={handleGoogleRegister}
          disabled={isGoogleLoading}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {isGoogleLoading ? "Connecting..." : "Sign up with Google"}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${darkMode ? 'border-slate-700' : 'border-gray-300'}`} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={`px-4 ${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-gray-500'}`}>
              or
            </span>
          </div>
        </div>

        {/* Manual Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Full Name
            </label>
            <div className={`mt-1 flex items-center rounded-lg border px-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-gray-300 bg-white'}`}>
              <User size={18} className={darkMode ? 'text-slate-400' : 'text-gray-400'} />
              <input
                type="text"
                placeholder="John Doe"
                className={`w-full bg-transparent px-3 py-3 outline-none ${darkMode ? 'text-white' : 'text-slate-900'}`}
                {...register("name", { required: "Name is required" })}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Email
            </label>
            <div className={`mt-1 flex items-center rounded-lg border px-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-gray-300 bg-white'}`}>
              <Mail size={18} className={darkMode ? 'text-slate-400' : 'text-gray-400'} />
              <input
                type="email"
                placeholder="you@example.com"
                className={`w-full bg-transparent px-3 py-3 outline-none ${darkMode ? 'text-white' : 'text-slate-900'}`}
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Please enter a valid email"
                  }
                })}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Password
            </label>
            <div className={`mt-1 flex items-center rounded-lg border px-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-gray-300 bg-white'}`}>
              <Lock size={18} className={darkMode ? 'text-slate-400' : 'text-gray-400'} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full bg-transparent px-3 py-3 outline-none ${darkMode ? 'text-white' : 'text-slate-900'}`}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Password must be at least 8 characters" },
                  onChange: (e) => setPassword(e.target.value),
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Confirm Password
            </label>
            <div className={`mt-1 flex items-center rounded-lg border px-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-gray-300 bg-white'}`}>
              <Lock size={18} className={darkMode ? 'text-slate-400' : 'text-gray-400'} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full bg-transparent px-3 py-3 outline-none ${darkMode ? 'text-white' : 'text-slate-900'}`}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => value === password || "Passwords do not match",
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-white hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {isLoading ? "Creating account..." : "Create Account"}
            <ArrowRight size={18} />
          </button>
        </form>

        <p className={`mt-6 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;