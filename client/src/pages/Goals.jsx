import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import api from "../services/api";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import {
  Plus,
  Target,
  Trash2,
  Edit,
  Calendar,
  CheckCircle,
  X,
  Eye,
  Compass,
  Flag,
  Layers3,
  Clock3,
} from "lucide-react";

const categories = ["DSA", "Career", "Learning", "Projects", "Applications"];

const priorityColors = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  Medium:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-300",
  High: "border-red-200 bg-red-50 text-red-700 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-300",
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

const Goals = () => {
  const { darkMode } = useTheme();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    let mounted = true;

    const fetchGoals = async () => {
      if (!mounted) return;

      setLoading(true);

      try {
        const { data } = await api.get("/goals");

        if (mounted) {
          setGoals(data.goals || []);
        }
      } catch (error) {
        console.error("Error fetching goals:", error);

        if (mounted) {
          toast.error("Failed to load goals");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchGoals();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshGoals = async () => {
    try {
      const { data } = await api.get("/goals");
      setGoals(data.goals || []);
    } catch (error) {
      console.error("Error refreshing goals:", error);
      toast.error("Failed to refresh goals");
    }
  };

  /*
   * IMPORTANT:
   * These are derived values, so we don't use activeGoals as a
   * dependency of another useMemo. That was causing the
   * "existing memoization could not be preserved" warning.
   */
  const activeGoals = goals.filter((goal) => goal.status === "Active");

  const completedGoals = goals.filter(
    (goal) => goal.status === "Completed"
  );

  const totalGoals = goals.length;

  const today = new Date();

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const dueThisWeek = activeGoals.filter((goal) => {
    const deadline = new Date(goal.deadline);

    return deadline >= today && deadline <= sevenDaysFromNow;
  }).length;

  const completionRate =
    totalGoals > 0
      ? Math.round((completedGoals.length / totalGoals) * 100)
      : 0;

  /*
   * No useMemo here.
   * The list is small and this avoids the unstable-array dependency issue.
   */
  const soonestGoal = [...activeGoals].sort(
    (a, b) => new Date(a.deadline) - new Date(b.deadline)
  )[0];

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateInput = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toISOString().split("T")[0];
  };

  const openCreateModal = () => {
    setEditingGoal(null);

    reset({
      title: "",
      description: "",
      category: "DSA",
      current: 0,
      target: "",
      deadline: "",
      priority: "Medium",
    });

    setShowModal(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);

    setValue("title", goal.title || "");
    setValue("description", goal.description || "");
    setValue("category", goal.category || "DSA");
    setValue("current", goal.current || 0);
    setValue("target", goal.target || "");
    setValue("deadline", formatDateInput(goal.deadline) || "");
    setValue("priority", goal.priority || "Medium");

    setShowModal(true);
  };

  const openDetailsModal = (goal) => {
    setSelectedGoal(goal);
    setShowDetailsModal(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const payload = {
        title: data.title,
        description: data.description || "",
        category: data.category,
        current: parseInt(data.current, 10) || 0,
        target: parseInt(data.target, 10),
        deadline: data.deadline,
        priority: data.priority,
      };

      if (editingGoal) {
        await api.put(`/goals/${editingGoal._id}`, payload);
        toast.success("Goal updated successfully.");
      } else {
        await api.post("/goals", payload);
        toast.success("Goal created successfully.");
      }

      setShowModal(false);
      setEditingGoal(null);
      reset();

      await refreshGoals();
    } catch (error) {
      console.error("Error saving goal:", error);

      const message =
        error.response?.data?.message || "Failed to save goal.";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteGoal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) {
      return;
    }

    setDeletingId(id);

    try {
      await api.delete(`/goals/${id}`);

      toast.success("Goal deleted successfully.");

      await refreshGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);

      const message =
        error.response?.data?.message || "Failed to delete goal.";

      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const closeCreateModal = () => {
    setShowModal(false);
    setEditingGoal(null);
    reset();
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedGoal(null);
  };

  const inputClass = `w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all focus:ring-4 ${
    darkMode
      ? "border-white/10 bg-white/[0.035] text-white placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-sky-400/10"
      : "border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-sky-500/10"
  }`;

  return (
    <main
      className={`min-h-screen px-4 py-5 sm:px-6 sm:py-8 lg:px-10 ${
        darkMode
          ? "bg-[#080a0f] text-white"
          : "bg-[#f4f6f8] text-slate-900"
      }`}
    >
      <div className="mx-auto max-w-360">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col gap-7 border-b pb-8 lg:flex-row lg:items-end lg:justify-between ${
            darkMode ? "border-white/8" : "border-slate-200"
          }`}
        >
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-600">
              <Flag size={14} />
              DevPilot / Commitments
            </p>

            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.08em] sm:text-6xl">
              Turn intention into a visible path.
            </h1>

            <p
              className={`mt-4 max-w-2xl text-sm leading-6 sm:text-base ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Keep the commitments that shape your career close, measurable,
              and easy to return to.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(14,116,144,0.18)] transition-all hover:-translate-y-0.5 hover:bg-sky-500"
          >
            <Plus size={17} />
            Define a goal
          </button>
        </motion.header>

        {/* MAIN GRID */}
        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          {/* ACTIVE GOALS */}
          <Surface className="relative overflow-hidden p-6 sm:p-9">
            <div className="absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full border border-sky-500/10" />

            <div className="relative flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">
                  The commitment board
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.07em]">
                  What you are carrying forward
                </h2>

                <p
                  className={`mt-2 text-sm ${
                    darkMode ? "text-slate-500" : "text-slate-500"
                  }`}
                >
                  {activeGoals.length > 0
                    ? `${activeGoals.length} active ${
                        activeGoals.length === 1
                          ? "commitment"
                          : "commitments"
                      } in motion.`
                    : "Your next meaningful commitment starts here."}
                </p>
              </div>

              <Compass
                size={22}
                className={
                  darkMode ? "text-slate-600" : "text-slate-400"
                }
              />
            </div>

            {loading ? (
              <div className="mt-10 space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className={`h-20 animate-pulse rounded-xl ${
                      darkMode ? "bg-white/4" : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>
            ) : activeGoals.length > 0 ? (
              <div
                className={`relative mt-10 border-l ${
                  darkMode
                    ? "border-white/12"
                    : "border-slate-200"
                }`}
              >
                {activeGoals.map((goal, index) => {
                  const percentage =
                    goal.target > 0
                      ? Math.min(
                          Math.round(
                            (goal.current / goal.target) * 100
                          ),
                          100
                        )
                      : 0;

                  return (
                    <motion.article
                      key={goal._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="relative pb-8 pl-7 last:pb-0"
                    >
                      <span className="absolute -left-1.25 top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500 ring-4 ring-sky-500/10" />

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-semibold tracking-[-0.04em]">
                              {goal.title}
                            </h3>

                            <span
                              className={`rounded-lg border px-2 py-1 text-[10px] font-semibold ${
                                priorityColors[goal.priority] ||
                                priorityColors.Medium
                              }`}
                            >
                              {goal.priority}
                            </span>
                          </div>

                          <p
                            className={`mt-2 max-w-2xl text-sm leading-6 ${
                              darkMode
                                ? "text-slate-500"
                                : "text-slate-500"
                            }`}
                          >
                            {goal.description || "No description"}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                            <span
                              className={`flex items-center gap-1.5 ${
                                darkMode
                                  ? "text-slate-500"
                                  : "text-slate-500"
                              }`}
                            >
                              <Layers3 size={13} />
                              {goal.category}
                            </span>

                            <span
                              className={`flex items-center gap-1.5 ${
                                darkMode
                                  ? "text-slate-500"
                                  : "text-slate-500"
                              }`}
                            >
                              <Calendar size={13} />
                              {formatDate(goal.deadline)}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 sm:pt-1">
                          <button
                            onClick={() => openEditModal(goal)}
                            aria-label={`Edit ${goal.title}`}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                              darkMode
                                ? "border-white/10 text-slate-500 hover:text-sky-300"
                                : "border-slate-200 text-slate-400 hover:text-sky-600"
                            }`}
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            onClick={() => deleteGoal(goal._id)}
                            disabled={deletingId === goal._id}
                            aria-label={`Delete ${goal.title}`}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-50 ${
                              darkMode
                                ? "border-white/10 text-slate-500 hover:border-red-300/20 hover:text-red-300"
                                : "border-slate-200 text-slate-400 hover:border-red-100 hover:text-red-500"
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-3">
                        <div
                          className={`h-2 flex-1 overflow-hidden rounded-full ${
                            darkMode
                              ? "bg-white/[0.07]"
                              : "bg-slate-100"
                          }`}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{
                              duration: 0.7,
                              delay: index * 0.05,
                            }}
                            className="h-full rounded-full bg-sky-500"
                          />
                        </div>

                        <span
                          className={`w-20 text-right text-xs font-semibold ${
                            darkMode
                              ? "text-slate-400"
                              : "text-slate-600"
                          }`}
                        >
                          {goal.current}/{goal.target} · {percentage}%
                        </span>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            ) : (
              <div
                className={`mt-10 border-l-2 border-sky-500 px-5 py-8 ${
                  darkMode
                    ? "bg-sky-400/4"
                    : "bg-sky-50/70"
                }`}
              >
                <Target size={25} className="text-sky-600" />

                <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em]">
                  Make the next commitment concrete.
                </h3>

                <p
                  className={`mt-2 max-w-md text-sm leading-6 ${
                    darkMode
                      ? "text-slate-500"
                      : "text-slate-500"
                  }`}
                >
                  Give an important career objective a name, a target,
                  and a date you can work toward.
                </p>

                <button
                  onClick={openCreateModal}
                  className="mt-5 flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-500"
                >
                  <Plus size={15} />
                  Define your first goal
                </button>
              </div>
            )}
          </Surface>

          {/* SIDEBAR */}
          <div className="space-y-7">
            <Surface className="p-6 sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">
                The pulse
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.07em]">
                Your current field of view
              </h2>

              <div
                className={`mt-7 divide-y ${
                  darkMode
                    ? "divide-white/8"
                    : "divide-slate-100"
                }`}
              >
                <div className="flex items-center justify-between py-4">
                  <span
                    className={`text-sm ${
                      darkMode
                        ? "text-slate-500"
                        : "text-slate-500"
                    }`}
                  >
                    Active commitments
                  </span>

                  <span className="text-2xl font-semibold tracking-tighter">
                    {activeGoals.length}
                  </span>
                </div>

                <div className="flex items-center justify-between py-4">
                  <span
                    className={`text-sm ${
                      darkMode
                        ? "text-slate-500"
                        : "text-slate-500"
                    }`}
                  >
                    Due this week
                  </span>

                  <span className="text-2xl font-semibold tracking-tighter">
                    {dueThisWeek}
                  </span>
                </div>

                <div className="flex items-center justify-between py-4">
                  <span
                    className={`text-sm ${
                      darkMode
                        ? "text-slate-500"
                        : "text-slate-500"
                    }`}
                  >
                    Completed
                  </span>

                  <span className="text-2xl font-semibold tracking-tighter">
                    {completedGoals.length}
                  </span>
                </div>

                <div className="flex items-center justify-between py-4">
                  <span
                    className={`text-sm ${
                      darkMode
                        ? "text-slate-500"
                        : "text-slate-500"
                    }`}
                  >
                    Completion rate
                  </span>

                  <span className="text-2xl font-semibold tracking-tighter">
                    {completionRate}%
                  </span>
                </div>
              </div>
            </Surface>

            <Surface className="p-6 sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">
                Nearest commitment
              </p>

              {soonestGoal ? (
                <>
                  <h2 className="mt-3 text-xl font-semibold tracking-tighter">
                    {soonestGoal.title}
                  </h2>

                  <div className="mt-5 flex items-center gap-2 text-sm text-amber-600">
                    <Clock3 size={15} />
                    {formatDate(soonestGoal.deadline)}
                  </div>

                  <div
                    className={`mt-5 h-1.5 overflow-hidden rounded-full ${
                      darkMode
                        ? "bg-white/[0.07]"
                        : "bg-slate-100"
                    }`}
                  >
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{
                        width: `${
                          soonestGoal.target > 0
                            ? Math.min(
                                Math.round(
                                  (soonestGoal.current /
                                    soonestGoal.target) *
                                    100
                                ),
                                100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <p
                  className={`mt-4 text-sm leading-6 ${
                    darkMode
                      ? "text-slate-500"
                      : "text-slate-500"
                  }`}
                >
                  When you add an active goal, the nearest deadline will
                  appear here.
                </p>
              )}
            </Surface>
          </div>
        </div>

        {/* CATEGORIES */}
        <Surface className="mt-8 overflow-hidden">
          <div
            className={`flex flex-col gap-4 border-b px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 ${
              darkMode
                ? "border-white/8"
                : "border-slate-100"
            }`}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">
                Commitment vocabulary
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tighter">
                The areas your goals can shape
              </h2>
            </div>

            <span
              className={`text-xs ${
                darkMode
                  ? "text-slate-600"
                  : "text-slate-400"
              }`}
            >
              {categories.length} categories
            </span>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-4 px-6 py-6 sm:px-8">
            {categories.map((category, index) => (
              <div
                key={category}
                className="flex items-center gap-3"
              >
                <span
                  className={`text-xs font-semibold ${
                    index === 0
                      ? "text-sky-600"
                      : darkMode
                      ? "text-slate-500"
                      : "text-slate-500"
                  }`}
                >
                  0{index + 1}
                </span>

                <span
                  className={`text-sm ${
                    darkMode
                      ? "text-slate-300"
                      : "text-slate-700"
                  }`}
                >
                  {category}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        {/* COMPLETED GOALS */}
        <Surface className="mt-8 overflow-hidden">
          <div
            className={`flex flex-col gap-4 border-b px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 ${
              darkMode
                ? "border-white/8"
                : "border-slate-100"
            }`}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                The archive
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.07em]">
                Completed commitments
              </h2>

              <p
                className={`mt-2 text-sm ${
                  darkMode
                    ? "text-slate-500"
                    : "text-slate-500"
                }`}
              >
                A quiet record of what has been accomplished.
              </p>
            </div>

            <CheckCircle
              size={19}
              className={
                darkMode
                  ? "text-slate-600"
                  : "text-slate-400"
              }
            />
          </div>

          {loading ? (
            <div className="space-y-3 p-6 sm:p-8">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className={`h-16 animate-pulse rounded-xl ${
                    darkMode
                      ? "bg-white/4"
                      : "bg-slate-100"
                  }`}
                />
              ))}
            </div>
          ) : completedGoals.length > 0 ? (
            <div>
              {completedGoals.map((goal, index) => (
                <motion.div
                  key={goal._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col gap-4 border-b px-6 py-5 last:border-b-0 sm:flex-row sm:items-center sm:px-8"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                      <CheckCircle size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {goal.title}
                      </p>

                      <p
                        className={`mt-1 text-xs ${
                          darkMode
                            ? "text-slate-500"
                            : "text-slate-500"
                        }`}
                      >
                        {goal.category}
                        <span className="mx-1 opacity-40">·</span>
                        {formatDate(
                          goal.completedAt || goal.updatedAt
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <button
                      onClick={() => openDetailsModal(goal)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                        darkMode
                          ? "border-white/10 text-slate-300 hover:text-sky-300"
                          : "border-slate-200 text-slate-600 hover:text-sky-600"
                      }`}
                    >
                      <Eye size={14} />
                      Details
                    </button>

                    <button
                      onClick={() => deleteGoal(goal._id)}
                      disabled={deletingId === goal._id}
                      aria-label={`Delete ${goal.title}`}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-50 ${
                        darkMode
                          ? "border-white/10 text-slate-500 hover:border-red-300/20 hover:text-red-300"
                          : "border-slate-200 text-slate-400 hover:border-red-100 hover:text-red-500"
                      }`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-14 text-center sm:px-8">
              <CheckCircle
                size={29}
                className="mx-auto text-emerald-600"
              />

              <p
                className={`mt-4 text-sm ${
                  darkMode
                    ? "text-slate-500"
                    : "text-slate-500"
                }`}
              >
                Completed goals will become part of this record.
              </p>
            </div>
          )}
        </Surface>

        {/* CREATE / EDIT MODAL */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`my-auto w-full max-w-2xl rounded-[26px] border p-6 shadow-2xl sm:p-8 ${
                  darkMode
                    ? "border-white/10 bg-[#11161e]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                      Career commitment
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.06em]">
                      {editingGoal
                        ? "Refine this goal"
                        : "Define a goal"}
                    </h2>

                    <p
                      className={`mt-1 text-sm ${
                        darkMode
                          ? "text-slate-500"
                          : "text-slate-500"
                      }`}
                    >
                      Give the commitment enough shape to act on it.
                    </p>
                  </div>

                  <button
                    onClick={closeCreateModal}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      darkMode
                        ? "text-slate-500 hover:bg-white/6 hover:text-white"
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-7 space-y-6"
                >
                  <div>
                    <p
                      className={`mb-3 text-[10px] font-bold uppercase tracking-[0.16em] ${
                        darkMode
                          ? "text-slate-600"
                          : "text-slate-400"
                      }`}
                    >
                      Goal identity
                    </p>

                    <div className="space-y-4">
                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${
                            darkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          Title
                          <span className="ml-1 text-sky-500">
                            *
                          </span>
                        </span>

                        <input
                          placeholder="e.g. Become interview-ready for frontend roles"
                          className={`mt-2 ${inputClass} ${
                            errors.title
                              ? "border-red-500"
                              : ""
                          }`}
                          {...register("title", {
                            required: "Title is required",
                          })}
                        />

                        {errors.title && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.title.message}
                          </p>
                        )}
                      </label>

                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${
                            darkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          Description{" "}
                          <span
                            className={`font-normal ${
                              darkMode
                                ? "text-slate-600"
                                : "text-slate-400"
                            }`}
                          >
                            (optional)
                          </span>
                        </span>

                        <textarea
                          rows="3"
                          placeholder="What will this goal make possible?"
                          className={`mt-2 resize-none ${inputClass}`}
                          {...register("description")}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <p
                      className={`mb-3 text-[10px] font-bold uppercase tracking-[0.16em] ${
                        darkMode
                          ? "text-slate-600"
                          : "text-slate-400"
                      }`}
                    >
                      Planning frame
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${
                            darkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          Category
                          <span className="ml-1 text-sky-500">
                            *
                          </span>
                        </span>

                        <select
                          className={`mt-2 ${inputClass} ${
                            errors.category
                              ? "border-red-500"
                              : ""
                          }`}
                          {...register("category", {
                            required: "Category is required",
                          })}
                        >
                          {categories.map((category) => (
                            <option
                              key={category}
                              value={category}
                            >
                              {category}
                            </option>
                          ))}
                        </select>

                        {errors.category && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.category.message}
                          </p>
                        )}
                      </label>

                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${
                            darkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          Priority
                        </span>

                        <select
                          className={`mt-2 ${inputClass}`}
                          {...register("priority")}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </label>

                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${
                            darkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          Current progress
                        </span>

                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          className={`mt-2 ${inputClass} ${
                            errors.current
                              ? "border-red-500"
                              : ""
                          }`}
                          {...register("current", {
                            min: {
                              value: 0,
                              message: "Cannot be negative",
                            },
                          })}
                        />

                        {errors.current && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.current.message}
                          </p>
                        )}
                      </label>

                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${
                            darkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          Target
                          <span className="ml-1 text-sky-500">
                            *
                          </span>
                        </span>

                        <input
                          type="number"
                          min="1"
                          placeholder="Target *"
                          className={`mt-2 ${inputClass} ${
                            errors.target
                              ? "border-red-500"
                              : ""
                          }`}
                          {...register("target", {
                            required: "Target is required",
                            min: {
                              value: 1,
                              message: "Must be greater than 0",
                            },
                          })}
                        />

                        {errors.target && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.target.message}
                          </p>
                        )}
                      </label>

                      <label className="block sm:col-span-2">
                        <span
                          className={`text-xs font-semibold ${
                            darkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          Deadline
                          <span className="ml-1 text-sky-500">
                            *
                          </span>
                        </span>

                        <input
                          type="date"
                          className={`mt-2 ${inputClass} ${
                            errors.deadline
                              ? "border-red-500"
                              : ""
                          }`}
                          {...register("deadline", {
                            required: "Deadline is required",
                          })}
                        />

                        {errors.deadline && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.deadline.message}
                          </p>
                        )}
                      </label>
                    </div>
                  </div>

                  <div
                    className={`flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end ${
                      darkMode
                        ? "border-white/8"
                        : "border-slate-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      className={`rounded-xl border px-5 py-3 text-sm font-semibold ${
                        darkMode
                          ? "border-white/10 text-slate-300 hover:bg-white/5"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "Saving..."
                        : editingGoal
                        ? "Update goal"
                        : "Save goal"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DETAILS MODAL */}
        <AnimatePresence>
          {showDetailsModal && selectedGoal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`my-auto w-full max-w-2xl rounded-[26px] border p-6 shadow-2xl sm:p-8 ${
                  darkMode
                    ? "border-white/10 bg-[#11161e]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                      Completed commitment
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.06em]">
                      {selectedGoal.title}
                    </h2>
                  </div>

                  <button
                    onClick={closeDetailsModal}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      darkMode
                        ? "text-slate-500 hover:bg-white/6 hover:text-white"
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-8 space-y-6">
                  <div
                    className={`border-l-2 border-emerald-500 px-4 py-4 ${
                      darkMode
                        ? "bg-emerald-400/4"
                        : "bg-emerald-50/70"
                    }`}
                  >
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                      This commitment has been accomplished.
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        darkMode
                          ? "text-slate-500"
                          : "text-slate-500"
                      }`}
                    >
                      {selectedGoal.status}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                        darkMode
                          ? "text-slate-600"
                          : "text-slate-400"
                      }`}
                    >
                      Description
                    </p>

                    <p
                      className={`mt-2 text-sm leading-6 ${
                        darkMode
                          ? "text-slate-300"
                          : "text-slate-700"
                      }`}
                    >
                      {selectedGoal.description ||
                        "No description provided."}
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                          darkMode
                            ? "text-slate-600"
                            : "text-slate-400"
                        }`}
                      >
                        Category
                      </p>

                      <p className="mt-2 text-sm font-semibold">
                        {selectedGoal.category}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                          darkMode
                            ? "text-slate-600"
                            : "text-slate-400"
                        }`}
                      >
                        Priority
                      </p>

                      <span
                        className={`mt-2 inline-block rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                          priorityColors[selectedGoal.priority] ||
                          priorityColors.Medium
                        }`}
                      >
                        {selectedGoal.priority}
                      </span>
                    </div>

                    <div>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                          darkMode
                            ? "text-slate-600"
                            : "text-slate-400"
                        }`}
                      >
                        Progress
                      </p>

                      <p className="mt-2 text-sm font-semibold">
                        {selectedGoal.current} /{" "}
                        {selectedGoal.target}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                          darkMode
                            ? "text-slate-600"
                            : "text-slate-400"
                        }`}
                      >
                        Completion
                      </p>

                      <p className="mt-2 text-sm font-semibold">
                        {selectedGoal.target > 0
                          ? Math.min(
                              Math.round(
                                (selectedGoal.current /
                                  selectedGoal.target) *
                                  100
                              ),
                              100
                            )
                          : 0}
                        %
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                          darkMode
                            ? "text-slate-600"
                            : "text-slate-400"
                        }`}
                      >
                        Deadline
                      </p>

                      <p className="mt-2 text-sm font-semibold">
                        {formatDate(selectedGoal.deadline)}
                      </p>
                    </div>

                    {selectedGoal.completedAt && (
                      <div>
                        <p
                          className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                            darkMode
                              ? "text-slate-600"
                              : "text-slate-400"
                          }`}
                        >
                          Completed on
                        </p>

                        <p className="mt-2 text-sm font-semibold">
                          {formatDateTime(
                            selectedGoal.completedAt
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className={`grid gap-5 border-t pt-5 sm:grid-cols-2 ${
                      darkMode
                        ? "border-white/8"
                        : "border-slate-100"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                          darkMode
                            ? "text-slate-600"
                            : "text-slate-400"
                        }`}
                      >
                        Created
                      </p>

                      <p
                        className={`mt-2 text-xs ${
                          darkMode
                            ? "text-slate-500"
                            : "text-slate-500"
                        }`}
                      >
                        {formatDateTime(selectedGoal.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                          darkMode
                            ? "text-slate-600"
                            : "text-slate-400"
                        }`}
                      >
                        Last updated
                      </p>

                      <p
                        className={`mt-2 text-xs ${
                          darkMode
                            ? "text-slate-500"
                            : "text-slate-500"
                        }`}
                      >
                        {formatDateTime(selectedGoal.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default Goals;