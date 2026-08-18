import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
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
} from "lucide-react";

const categories = [
  "DSA",
  "Career",
  "Learning",
  "Projects",
  "Applications",
];

const priorityColors = {
  Low: "bg-green-500/20 text-green-400",
  Medium: "bg-yellow-500/20 text-yellow-400",
  High: "bg-red-500/20 text-red-400",
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

  // FETCH GOALS ON MOUNT
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

  const activeGoals = goals.filter((g) => g.status === "Active");
  const completedGoals = goals.filter((g) => g.status === "Completed");
  const totalGoals = goals.length;

  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const dueThisWeek = activeGoals.filter((g) => {
    const deadline = new Date(g.deadline);
    return deadline >= today && deadline <= sevenDaysFromNow;
  }).length;

  const completionRate = totalGoals > 0
    ? Math.round((completedGoals.length / totalGoals) * 100)
    : 0;

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
        current: parseInt(data.current) || 0,
        target: parseInt(data.target),
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
      const message = error.response?.data?.message || "Failed to save goal.";
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
      const message = error.response?.data?.message || "Failed to delete goal.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`space-y-6 min-h-screen p-4 sm:p-6 ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row"
      >
        <div>
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Turn your placement plans into measurable progress.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 hover:bg-indigo-500 text-white"
        >
          <Plus size={18} />
          Create Goal
        </button>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Active Goals", activeGoals.length],
          ["Completed", completedGoals.length],
          ["Due This Week", dueThisWeek],
          ["Completion Rate", `${completionRate}%`],
        ].map(([title, value]) => (
          <Card key={title}>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{title}</p>
            <h2 className={`mt-2 text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</h2>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className={`mb-4 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Goal Categories
        </h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <span
              key={category}
              className="rounded-full bg-indigo-500/20 px-4 py-2 text-sm text-indigo-300"
            >
              {category}
            </span>
          ))}
        </div>
      </Card>

      <div>
        <h2 className={`mb-4 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Active Goals
        </h2>

        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading goals...</div>
        ) : activeGoals.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {activeGoals.map((goal) => {
              const percentage = Math.min(Math.round((goal.current / goal.target) * 100), 100);

              return (
                <Card key={goal._id}>
                  <div className="flex justify-between">
                    <div>
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {goal.title}
                      </h3>
                      <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        {goal.description || "No description"}
                      </p>
                    </div>
                    <Target className="text-cyan-400" />
                  </div>

                  <div className={`mt-4 flex items-center justify-between text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <span>{goal.current}/{goal.target}</span>
                    <span>{percentage}%</span>
                  </div>

                  <div className="mt-2 h-2 rounded bg-slate-800">
                    <div
                      className="h-2 rounded bg-indigo-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className={`mt-4 space-y-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    <p className="flex gap-2">
                      <Calendar size={15} />
                      {formatDate(goal.deadline)}
                    </p>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs ${priorityColors[goal.priority]}`}
                    >
                      {goal.priority}
                    </span>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => openEditModal(goal)}
                      className={`rounded-lg border p-2 hover:bg-slate-800 ${darkMode ? 'border-slate-700 text-white' : 'border-gray-300 text-slate-900'}`}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal._id)}
                      disabled={deletingId === goal._id}
                      className={`rounded-lg border p-2 hover:bg-slate-800 disabled:opacity-50 ${darkMode ? 'border-slate-700 text-white' : 'border-gray-300 text-slate-900'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400">
            <Target className="mx-auto text-slate-600" size={50} />
            <h3 className={`mt-4 text-xl font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              No active goals
            </h3>
            <p className="text-slate-400">
              Create your first goal to start tracking your progress.
            </p>
          </div>
        )}
      </div>

      <Card>
        <h2 className={`mb-4 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Completed Goals
        </h2>

        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading goals...</div>
        ) : completedGoals.length > 0 ? (
          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <div
                key={goal._id}
                className={`flex items-center justify-between rounded-lg border p-4 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}
              >
                <div>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {goal.title}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {goal.category} • {formatDate(goal.completedAt || goal.updatedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openDetailsModal(goal)}
                    className={`rounded-lg border p-2 hover:bg-slate-800 ${darkMode ? 'border-slate-700 text-white' : 'border-gray-300 text-slate-900'}`}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => deleteGoal(goal._id)}
                    disabled={deletingId === goal._id}
                    className={`rounded-lg border p-2 hover:bg-slate-800 disabled:opacity-50 ${darkMode ? 'border-slate-700 text-white' : 'border-gray-300 text-slate-900'}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400">
            <CheckCircle className="mx-auto text-slate-600" size={45} />
            <h3 className={`mt-4 text-xl font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              No completed goals
            </h3>
            <p className="text-slate-400">
              Complete your goals to see them here.
            </p>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4 z-50">
          <div className={`w-full max-w-lg rounded-xl border p-6 max-h-[90vh] overflow-y-auto ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="mb-5 flex justify-between">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {editingGoal ? "Edit Goal" : "Create Goal"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingGoal(null);
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
                  placeholder="Goal Title *"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${errors.title ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("title", { required: "Title is required" })}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div>
                <textarea
                  placeholder="Description (optional)"
                  rows="3"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 resize-none ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("description")}
                />
              </div>

              <div>
                <select
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${errors.category ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("category", { required: "Category is required" })}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Current"
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${errors.current ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                    {...register("current", {
                      min: { value: 0, message: "Cannot be negative" },
                    })}
                  />
                  {errors.current && (
                    <p className="mt-1 text-sm text-red-500">{errors.current.message}</p>
                  )}
                </div>

                <div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Target *"
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${errors.target ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                    {...register("target", {
                      required: "Target is required",
                      min: { value: 1, message: "Must be greater than 0" },
                    })}
                  />
                  {errors.target && (
                    <p className="mt-1 text-sm text-red-500">{errors.target.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                  Deadline *
                </label>
                <input
                  type="date"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${errors.deadline ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("deadline", { required: "Deadline is required" })}
                />
                {errors.deadline && (
                  <p className="mt-1 text-sm text-red-500">{errors.deadline.message}</p>
                )}
              </div>

              <div>
                <select
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("priority")}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingGoal
                  ? "Update Goal"
                  : "Save Goal"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Goal Details Modal */}
      {showDetailsModal && selectedGoal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4 z-50">
          <div className={`w-full max-w-lg rounded-xl border p-6 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="mb-5 flex justify-between">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Goal Details
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedGoal(null);
                }}
                className={darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-slate-900'}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Title</p>
                <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {selectedGoal.title}
                </p>
              </div>

              <div>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Description</p>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                  {selectedGoal.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Category</p>
                  <p className={darkMode ? 'text-white' : 'text-slate-900'}>{selectedGoal.category}</p>
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Priority</p>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs ${priorityColors[selectedGoal.priority]}`}
                  >
                    {selectedGoal.priority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Progress</p>
                  <p className={darkMode ? 'text-white' : 'text-slate-900'}>
                    {selectedGoal.current} / {selectedGoal.target}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Completion</p>
                  <p className={darkMode ? 'text-white' : 'text-slate-900'}>
                    {Math.min(Math.round((selectedGoal.current / selectedGoal.target) * 100), 100)}%
                  </p>
                </div>
              </div>

              <div>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Deadline</p>
                <p className={darkMode ? 'text-white' : 'text-slate-900'}>{formatDate(selectedGoal.deadline)}</p>
              </div>

              <div>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Status</p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs ${
                    selectedGoal.status === "Completed"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {selectedGoal.status}
                </span>
              </div>

              {selectedGoal.completedAt && (
                <div>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Completed On</p>
                  <p className={darkMode ? 'text-white' : 'text-slate-900'}>
                    {formatDateTime(selectedGoal.completedAt)}
                  </p>
                </div>
              )}

              <div>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Created</p>
                <p className={darkMode ? 'text-slate-400' : 'text-gray-500'}>
                  {formatDateTime(selectedGoal.createdAt)}
                </p>
              </div>

              <div>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Last Updated</p>
                <p className={darkMode ? 'text-slate-400' : 'text-gray-500'}>
                  {formatDateTime(selectedGoal.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;