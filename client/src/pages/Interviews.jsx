import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import {
  Plus,
  Calendar,
  Clock,
  Building2,
  User,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  X,
  Code2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const resultColors = {
  Upcoming: "bg-blue-500/20 text-blue-400",
  Passed: "bg-green-500/20 text-green-400",
  Failed: "bg-red-500/20 text-red-400",
  Pending: "bg-yellow-500/20 text-yellow-400",
};

const difficultyColors = {
  Easy: "bg-green-500/20 text-green-400",
  Medium: "bg-yellow-500/20 text-yellow-400",
  Hard: "bg-red-500/20 text-red-400",
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

const Interviews = () => {
  const { darkMode } = useTheme();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  // FETCH INTERVIEWS - DECLARED FIRST
  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/interviews");
      setInterviews(data.interviews || data || []);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      toast.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  // FETCH INTERVIEWS ON MOUNT
  useEffect(() => {
    let mounted = true;

    const loadInterviews = async () => {
      if (!mounted) return;
      await fetchInterviews();
    };

    loadInterviews();

    return () => {
      mounted = false;
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const toggleDetails = (interview) => {
    if (selectedInterview?._id === interview._id) {
      setSelectedInterview(null);
    } else {
      setSelectedInterview(interview);
    }
  };

  const openAddModal = () => {
    setEditingInterview(null);
    setSelectedDate("");
    setSelectedTime("");
    reset({
      company: "",
      role: "",
      date: "",
      time: "",
      round: "",
      questions: "",
      feedback: "",
      difficulty: "Medium",
      result: "Upcoming",
    });
    setShowModal(true);
  };

  const openEditModal = (interview) => {
    setEditingInterview(interview);
    const dateValue = formatDateInput(interview.date) || "";
    setSelectedDate(dateValue);
    setSelectedTime(interview.time || "");
    setValue("company", interview.company || "");
    setValue("role", interview.role || "");
    setValue("date", dateValue);
    setValue("time", interview.time || "");
    setValue("round", interview.round || "");
    setValue("questions", interview.questions ? interview.questions.join(", ") : "");
    setValue("feedback", interview.feedback || "");
    setValue("difficulty", interview.difficulty || "Medium");
    setValue("result", interview.result || "Upcoming");
    setShowModal(true);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const questionsArray = data.questions
        ? data.questions.split(",").map((q) => q.trim()).filter((q) => q !== "")
        : [];

      const payload = {
        company: data.company,
        role: data.role,
        date: data.date,
        time: data.time || "",
        round: data.round,
        questions: questionsArray,
        feedback: data.feedback || "",
        difficulty: data.difficulty,
        result: data.result,
      };

      if (editingInterview) {
        await api.put(`/interviews/${editingInterview._id}`, payload);
        toast.success("Interview updated successfully.");
      } else {
        await api.post("/interviews", payload);
        toast.success("Interview added successfully.");
      }

      await fetchInterviews();

      if (editingInterview && selectedInterview?._id === editingInterview._id) {
        setSelectedInterview(null);
      }

      setShowModal(false);
      setEditingInterview(null);
      setSelectedDate("");
      setSelectedTime("");
      reset();

    } catch (error) {
      console.error("Error saving interview:", error);
      const message = error.response?.data?.message || "Failed to save interview.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteInterview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this interview?")) {
      return;
    }

    try {
      await api.delete(`/interviews/${id}`);
      toast.success("Interview deleted successfully.");
      
      if (selectedInterview?._id === id) {
        setSelectedInterview(null);
      }
      
      await fetchInterviews();
    } catch (error) {
      console.error("Error deleting interview:", error);
      const message = error.response?.data?.message || "Failed to delete interview.";
      toast.error(message);
    }
  };

  // Calculate dynamic statistics
  const totalInterviews = interviews.length;
  const technicalRounds = interviews.filter((i) =>
    i.round?.toLowerCase().includes("technical")
  ).length;
  const hrRounds = interviews.filter((i) =>
    i.round?.toLowerCase().includes("hr")
  ).length;

  const completedInterviews = interviews.filter(
    (i) => i.result !== "Upcoming" && i.result !== "Pending"
  );
  const passedCount = completedInterviews.filter((i) => i.result === "Passed").length;
  const successRate = completedInterviews.length > 0
    ? Math.round((passedCount / completedInterviews.length) * 100)
    : 0;

  return (
    <div className={`space-y-6 min-h-screen p-4 sm:p-6 ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row"
      >
        <div>
          <h1 className="text-3xl font-bold">Interview Tracker</h1>
          <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Record interviews, questions, feedback, and outcomes.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 hover:bg-indigo-500 text-white"
        >
          <Plus size={18} />
          Log Interview
        </button>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Interviews", totalInterviews, Calendar],
          ["Technical Rounds", technicalRounds, Code2],
          ["HR Rounds", hrRounds, User],
          ["Success Rate", `${successRate}%`, CheckCircle],
        ].map(([title, value, Icon]) => (
          <Card key={title}>
            <Icon className="text-indigo-400" />
            <p className={`mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              {title}
            </p>
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {value}
            </h2>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className={`mb-5 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Upcoming Interviews
        </h2>

        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading interviews...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {interviews
              .filter((item) => item.result === "Upcoming")
              .map((item) => (
                <div key={item._id} className={`rounded-xl border p-4 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                  <Building2 className="text-cyan-400" />
                  <h3 className={`mt-3 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {item.company}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {item.role}
                  </p>
                  <div className="mt-3 text-sm">
                    <p className={darkMode ? 'text-white' : 'text-slate-900'}>{item.round}</p>
                    <p className={`mt-1 flex gap-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      <Calendar size={14} />
                      {formatDate(item.date)}
                    </p>
                    {item.time && (
                      <p className={`flex gap-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        <Clock size={14} />
                        {item.time}
                      </p>
                    )}
                  </div>
                  <span className="mt-3 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-400">
                    Upcoming
                  </span>
                </div>
              ))}
          </div>
        )}

        {!loading && interviews.filter((i) => i.result === "Upcoming").length === 0 && (
          <div className="py-8 text-center text-slate-400">No upcoming interviews.</div>
        )}
      </Card>

      <Card>
        <h2 className={`mb-5 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Interview History
        </h2>

        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading interviews...</div>
        ) : interviews.length > 0 ? (
          <div className="space-y-4">
            {interviews.map((item) => (
              <div key={item._id}>
                <div
                  className={`flex flex-col justify-between gap-4 rounded-xl border p-4 md:flex-row ${
                    selectedInterview?._id === item._id
                      ? "border-indigo-500 bg-indigo-950/20"
                      : darkMode
                      ? "border-slate-800"
                      : "border-gray-200"
                  }`}
                >
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {item.company}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {item.role} • {item.round}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${resultColors[item.result]}`}
                      >
                        {item.result}
                      </span>
                      {item.difficulty && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${difficultyColors[item.difficulty]}`}
                        >
                          {item.difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleDetails(item)}
                      className={`hover:text-white ${
                        selectedInterview?._id === item._id
                          ? "text-indigo-400"
                          : "text-slate-400"
                      }`}
                    >
                      {selectedInterview?._id === item._id ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit size={18} />
                    </button>

                    <button
                      onClick={() => deleteInterview(item._id)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {selectedInterview?._id === item._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 rounded-xl border border-indigo-500/30 bg-indigo-950/10 p-4"
                  >
                    <div className="space-y-3 text-slate-300">
                      <p><strong>Company:</strong> {selectedInterview.company}</p>
                      <p><strong>Role:</strong> {selectedInterview.role}</p>
                      <p><strong>Date:</strong> {formatDate(selectedInterview.date)}</p>
                      {selectedInterview.time && (
                        <p><strong>Time:</strong> {selectedInterview.time}</p>
                      )}
                      <p><strong>Round:</strong> {selectedInterview.round}</p>
                      {selectedInterview.questions && selectedInterview.questions.length > 0 && (
                        <div>
                          <strong>Questions Asked:</strong>
                          <ul className="mt-2 list-disc pl-5 text-slate-400">
                            {selectedInterview.questions.map((question, index) => (
                              <li key={index}>{question}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedInterview.difficulty && (
                        <p><strong>Difficulty:</strong> {selectedInterview.difficulty}</p>
                      )}
                      <p><strong>Result:</strong> {selectedInterview.result}</p>
                      {selectedInterview.feedback && (
                        <p><strong>Feedback:</strong> {selectedInterview.feedback}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <AlertCircle className="mx-auto text-slate-600" size={45} />
            <h3 className={`mt-4 text-xl font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              No interviews recorded
            </h3>
            <p className="text-slate-400">Log your first interview experience.</p>
          </div>
        )}
      </Card>

      {/* Modal - Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4 z-50">
          <div className={`w-full max-w-lg rounded-xl border p-6 max-h-[90vh] overflow-y-auto ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="mb-5 flex justify-between">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {editingInterview ? "Edit Interview" : "Log Interview"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingInterview(null);
                  setSelectedDate("");
                  setSelectedTime("");
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
                  placeholder="Company *"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${errors.company ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("company", { required: "Company is required" })}
                />
                {errors.company && (
                  <p className="mt-1 text-sm text-red-500">{errors.company.message}</p>
                )}
              </div>

              <div>
                <input
                  placeholder="Role *"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${errors.role ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("role", { required: "Role is required" })}
                />
                {errors.role && (
                  <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                  Interview Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className={`w-full rounded-lg border px-3 py-2 pl-10 outline-none focus:border-indigo-500 ${errors.date ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                    {...register("date", { 
                      required: "Date is required",
                      onChange: handleDateChange 
                    })}
                  />
                  <Calendar className={`absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} size={18} />
                </div>
                {errors.date && (
                  <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>
                )}
                {selectedDate && (
                  <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Selected: {new Date(selectedDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                  Time (optional)
                </label>
                <div className="relative">
                  <input
                    type="time"
                    className={`w-full rounded-lg border px-3 py-2 pl-10 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                    {...register("time", { onChange: handleTimeChange })}
                  />
                  <Clock className={`absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} size={18} />
                </div>
                {selectedTime && (
                  <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Selected: {selectedTime}
                  </p>
                )}
              </div>

              <div>
                <input
                  placeholder="Round *"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${errors.round ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("round", { required: "Round is required" })}
                />
                {errors.round && (
                  <p className="mt-1 text-sm text-red-500">{errors.round.message}</p>
                )}
              </div>

              <div>
                <input
                  placeholder="Questions (comma separated, optional)"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("questions")}
                />
              </div>

              <div>
                <input
                  placeholder="Feedback (optional)"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("feedback")}
                />
              </div>

              <div>
                <select
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("difficulty")}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <select
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${errors.result ? 'border-red-500' : darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register("result", { required: "Result is required" })}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                  <option value="Pending">Pending</option>
                </select>
                {errors.result && (
                  <p className="mt-1 text-sm text-red-500">{errors.result.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isSubmitting 
                  ? "Saving..." 
                  : editingInterview 
                    ? "Update Interview" 
                    : "Save Interview"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interviews;