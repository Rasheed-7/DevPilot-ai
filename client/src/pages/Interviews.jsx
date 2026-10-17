import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowUpRight,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

const resultColors = {
  Upcoming:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-300",
  Passed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  Failed:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-300",
  Pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-300",
};
const difficultyColors = {
  Easy: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  Medium:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-300",
  Hard: "border-red-200 bg-red-50 text-red-700 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-300",
};

const Surface = ({ children, className = "" }) => {
  const { darkMode } = useTheme();
  return (
    <section
      className={`rounded-[26px] border ${darkMode ? "border-white/8 bg-[#11161e]" : "border-slate-200/80 bg-white"} ${className}`}
    >
      {children}
    </section>
  );
};
const ResultTag = ({ result }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${resultColors[result] || resultColors.Pending}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
    {result}
  </span>
);
const DifficultyTag = ({ difficulty }) => (
  <span
    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${difficultyColors[difficulty] || difficultyColors.Medium}`}
  >
    {difficulty}
  </span>
);

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
    if (selectedInterview?._id === interview._id) setSelectedInterview(null);
    else setSelectedInterview(interview);
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
    setValue(
      "questions",
      interview.questions ? interview.questions.join(", ") : "",
    );
    setValue("feedback", interview.feedback || "");
    setValue("difficulty", interview.difficulty || "Medium");
    setValue("result", interview.result || "Upcoming");
    setShowModal(true);
  };
  const handleDateChange = (e) => setSelectedDate(e.target.value);
  const handleTimeChange = (e) => setSelectedTime(e.target.value);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const questionsArray = data.questions
        ? data.questions
            .split(",")
            .map((q) => q.trim())
            .filter((q) => q !== "")
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
      if (editingInterview && selectedInterview?._id === editingInterview._id)
        setSelectedInterview(null);
      setShowModal(false);
      setEditingInterview(null);
      setSelectedDate("");
      setSelectedTime("");
      reset();
    } catch (error) {
      console.error("Error saving interview:", error);
      const message =
        error.response?.data?.message || "Failed to save interview.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteInterview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this interview?"))
      return;
    try {
      await api.delete(`/interviews/${id}`);
      toast.success("Interview deleted successfully.");
      if (selectedInterview?._id === id) setSelectedInterview(null);
      await fetchInterviews();
    } catch (error) {
      console.error("Error deleting interview:", error);
      const message =
        error.response?.data?.message || "Failed to delete interview.";
      toast.error(message);
    }
  };

  const totalInterviews = interviews.length;
  const technicalRounds = interviews.filter((i) =>
    i.round?.toLowerCase().includes("technical"),
  ).length;
  const hrRounds = interviews.filter((i) =>
    i.round?.toLowerCase().includes("hr"),
  ).length;
  const completedInterviews = interviews.filter(
    (i) => i.result !== "Upcoming" && i.result !== "Pending",
  );
  const passedCount = completedInterviews.filter(
    (i) => i.result === "Passed",
  ).length;
  const successRate =
    completedInterviews.length > 0
      ? Math.round((passedCount / completedInterviews.length) * 100)
      : 0;
  const upcomingInterviews = [...interviews]
    .filter((item) => item.result === "Upcoming")
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextInterview = upcomingInterviews[0];
  const inputClass = `w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all focus:ring-4 ${darkMode ? "border-white/10 bg-white/[0.035] text-white placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-sky-400/10" : "border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-sky-500/10"}`;
  const closeModal = () => {
    setShowModal(false);
    setEditingInterview(null);
    setSelectedDate("");
    setSelectedTime("");
    reset();
  };

  const stats = [
    ["Total interviews", totalInterviews, Calendar, "text-sky-500"],
    ["Technical rounds", technicalRounds, Code2, "text-blue-500"],
    ["HR rounds", hrRounds, User, "text-amber-500"],
    ["Success rate", `${successRate}%`, CheckCircle, "text-emerald-500"],
  ];

  return (
    <main
      className={`min-h-screen px-4 py-5 sm:px-6 sm:py-8 lg:px-10 ${darkMode ? "bg-[#080a0f] text-white" : "bg-[#f4f6f8] text-slate-900"}`}
    >
      <div className="mx-auto max-w-350">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col gap-6 border-b pb-7 md:flex-row md:items-end md:justify-between ${darkMode ? "border-white/8" : "border-slate-200"}`}
        >
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">
              <Calendar size={14} /> DevPilot / Interview command center
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">
              Interview room
            </h1>
            <p
              className={`mt-3 max-w-xl text-sm leading-6 ${darkMode ? "text-slate-500" : "text-slate-500"}`}
            >
              A focused place to see what is next, keep your context close, and
              learn from every conversation.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(14,116,144,0.18)] transition-all hover:-translate-y-0.5 hover:bg-sky-500"
          >
            <Plus size={17} />
            Log interview
          </button>
        </motion.header>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([title, value, Icon, color], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={`flex items-center gap-4 border-l-2 px-4 py-2 ${title === "Success rate" ? "border-emerald-500" : "border-sky-500"}`}
            >
              <Icon size={18} className={color} />
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-[0.15em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}
                >
                  {title}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.06em]">
                  {value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1.18fr)_360px]">
          <Surface className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-sky-600" />
            <div className="p-6 sm:p-9">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">
                    Next in the room
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.06em]">
                    {nextInterview
                      ? nextInterview.company
                      : "Your next conversation"}
                  </h2>
                  {nextInterview && (
                    <p
                      className={`mt-1 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}
                    >
                      {nextInterview.role}
                    </p>
                  )}
                </div>
                {nextInterview && <ResultTag result={nextInterview.result} />}
              </div>
              {loading ? (
                <div className="flex min-h-62.5 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
                </div>
              ) : nextInterview ? (
                <div className="mt-9 grid gap-8 md:grid-cols-[170px_1fr] md:items-center">
                  <div
                    className={`flex h-40 w-40 flex-col justify-between border p-5 ${darkMode ? "border-white/10 bg-white/[0.035]" : "border-slate-200 bg-slate-50"}`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}
                    >
                      Scheduled for
                    </p>
                    <div>
                      <p className="text-4xl font-semibold tracking-[-0.08em]">
                        {new Date(nextInterview.date).getDate()}
                      </p>
                      <p className="mt-1 text-sm font-medium text-sky-600">
                        {new Date(nextInterview.date).toLocaleDateString(
                          "en-US",
                          { month: "long" },
                        )}
                      </p>
                    </div>
                    <p
                      className={`flex items-center gap-1.5 text-xs ${darkMode ? "text-slate-500" : "text-slate-500"}`}
                    >
                      <Clock size={13} />
                      {nextInterview.time || "Time not set"}
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${darkMode ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}
                      >
                        <Building2 size={13} />
                        {nextInterview.round}
                      </span>
                      {nextInterview.difficulty && (
                        <span className="flex items-center gap-1.5">
                          <DifficultyTag
                            difficulty={nextInterview.difficulty}
                          />
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-5 text-sm leading-6 ${darkMode ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Make space for the details that matter before this
                      conversation starts.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleDetails(nextInterview)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${darkMode ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        <Eye size={14} />
                        {selectedInterview?._id === nextInterview._id
                          ? "Hide details"
                          : "View details"}
                      </button>
                      <button
                        onClick={() => openEditModal(nextInterview)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${darkMode ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`mt-9 flex min-h-55 flex-col justify-center border-l-2 pl-6 ${darkMode ? "border-white/10" : "border-slate-200"}`}
                >
                  <ClipboardList size={25} className="text-sky-600" />
                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em]">
                    Nothing on the calendar yet.
                  </h3>
                  <p
                    className={`mt-2 max-w-md text-sm leading-6 ${darkMode ? "text-slate-500" : "text-slate-500"}`}
                  >
                    When the next conversation is scheduled, it will take the
                    lead here.
                  </p>
                  <button
                    onClick={openAddModal}
                    className="mt-5 flex w-fit items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-500"
                  >
                    Log your first interview <ArrowUpRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </Surface>

          <Surface className="p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                  Agenda
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tighter">
                  Coming up
                </h2>
              </div>
              <Clock
                size={18}
                className={darkMode ? "text-slate-600" : "text-slate-400"}
              />
            </div>
            <div
              className={`mt-7 border-l ${darkMode ? "border-white/10" : "border-slate-200"}`}
            >
              {loading ? (
                <p
                  className={`pl-5 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}
                >
                  Loading schedule...
                </p>
              ) : upcomingInterviews.length > 0 ? (
                upcomingInterviews.slice(0, 5).map((item, index) => (
                  <motion.button
                    whileHover={{ x: 4 }}
                    key={item._id}
                    onClick={() => toggleDetails(item)}
                    className={`relative block w-full border-b py-3 pl-5 text-left last:border-b-0 ${darkMode ? "border-white/6" : "border-slate-100"}`}
                  >
                    <span
                      className={`absolute -left-1.25 top-4 h-2 w-2 rounded-full ${index === 0 ? "bg-sky-600" : darkMode ? "bg-slate-700" : "bg-slate-300"}`}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={`truncate text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                      >
                        {item.company}
                      </p>
                      <ChevronRight
                        size={14}
                        className={
                          darkMode ? "text-slate-700" : "text-slate-300"
                        }
                      />
                    </div>
                    <p
                      className={`mt-1 truncate text-xs ${darkMode ? "text-slate-600" : "text-slate-400"}`}
                    >
                      {formatDate(item.date)}
                      {item.time ? ` · ${item.time}` : ""}
                    </p>
                  </motion.button>
                ))
              ) : (
                <p
                  className={`pl-5 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}
                >
                  No upcoming interviews.
                </p>
              )}
            </div>
          </Surface>
        </div>

        <Surface className="mt-7 overflow-hidden">
          <div
            className={`flex items-end justify-between border-b px-5 py-5 sm:px-7 ${darkMode ? "border-white/8" : "border-slate-100"}`}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                Your record
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tighter">
                Interview history
              </h2>
            </div>
            <span
              className={`text-xs ${darkMode ? "text-slate-600" : "text-slate-400"}`}
            >
              {totalInterviews} interview{totalInterviews !== 1 ? "s" : ""}
            </span>
          </div>
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
              <p
                className={`text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}
              >
                Loading interviews...
              </p>
            </div>
          ) : interviews.length > 0 ? (
            <div>
              {interviews.map((item) => (
                <div
                  key={item._id}
                  className={`grid gap-4 border-b px-5 py-5 last:border-b-0 sm:px-7 md:grid-cols-[112px_minmax(0,1fr)_180px] md:items-start ${darkMode ? "border-white/[0.07]" : "border-slate-100"}`}
                >
                  <div>
                    <p
                      className={`text-xs font-semibold ${darkMode ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {formatDate(item.date)}
                    </p>
                    <p
                      className={`mt-1 text-[11px] ${darkMode ? "text-slate-600" : "text-slate-400"}`}
                    >
                      {item.time || "Time not set"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${darkMode ? "bg-white/5 text-sky-300" : "bg-sky-50 text-sky-600"}`}
                      >
                        <Building2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                        >
                          {item.company}
                        </p>
                        <p
                          className={`mt-1 truncate text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}
                        >
                          {item.role} <span className="mx-1 opacity-40">·</span>{" "}
                          {item.round}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <ResultTag result={item.result} />
                          {item.difficulty && (
                            <DifficultyTag difficulty={item.difficulty} />
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedInterview?._id === item._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.25 }}
                        className={`mt-5 border-l-2 pl-4 text-sm leading-6 ${darkMode ? "border-sky-500/40 text-slate-400" : "border-sky-200 text-slate-600"}`}
                      >
                        <p>
                          <strong
                            className={
                              darkMode ? "text-slate-200" : "text-slate-800"
                            }
                          >
                            Company:
                          </strong>{" "}
                          {selectedInterview.company}
                        </p>
                        <p>
                          <strong
                            className={
                              darkMode ? "text-slate-200" : "text-slate-800"
                            }
                          >
                            Role:
                          </strong>{" "}
                          {selectedInterview.role}
                        </p>
                        <p>
                          <strong
                            className={
                              darkMode ? "text-slate-200" : "text-slate-800"
                            }
                          >
                            Date:
                          </strong>{" "}
                          {formatDate(selectedInterview.date)}
                        </p>
                        {selectedInterview.time && (
                          <p>
                            <strong
                              className={
                                darkMode ? "text-slate-200" : "text-slate-800"
                              }
                            >
                              Time:
                            </strong>{" "}
                            {selectedInterview.time}
                          </p>
                        )}
                        <p>
                          <strong
                            className={
                              darkMode ? "text-slate-200" : "text-slate-800"
                            }
                          >
                            Round:
                          </strong>{" "}
                          {selectedInterview.round}
                        </p>
                        {selectedInterview.questions &&
                          selectedInterview.questions.length > 0 && (
                            <div className="mt-2">
                              <strong
                                className={
                                  darkMode ? "text-slate-200" : "text-slate-800"
                                }
                              >
                                Questions asked:
                              </strong>
                              <ul className="mt-1 list-disc pl-5">
                                {selectedInterview.questions.map(
                                  (question, questionIndex) => (
                                    <li key={questionIndex}>{question}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                        {selectedInterview.difficulty && (
                          <p>
                            <strong
                              className={
                                darkMode ? "text-slate-200" : "text-slate-800"
                              }
                            >
                              Difficulty:
                            </strong>{" "}
                            {selectedInterview.difficulty}
                          </p>
                        )}
                        <p>
                          <strong
                            className={
                              darkMode ? "text-slate-200" : "text-slate-800"
                            }
                          >
                            Result:
                          </strong>{" "}
                          {selectedInterview.result}
                        </p>
                        {selectedInterview.feedback && (
                          <p>
                            <strong
                              className={
                                darkMode ? "text-slate-200" : "text-slate-800"
                              }
                            >
                              Feedback:
                            </strong>{" "}
                            {selectedInterview.feedback}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 md:justify-end">
                    <button
                      aria-label={
                        selectedInterview?._id === item._id
                          ? "Hide interview details"
                          : "View interview details"
                      }
                      onClick={() => toggleDetails(item)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border ${darkMode ? "border-white/10 text-slate-500 hover:bg-white/5 hover:text-sky-300" : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-sky-600"}`}
                    >
                      {selectedInterview?._id === item._id ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </button>
                    <button
                      aria-label="Edit interview"
                      onClick={() => openEditModal(item)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border ${darkMode ? "border-white/10 text-slate-500 hover:bg-white/5 hover:text-sky-300" : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-sky-600"}`}
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      aria-label="Delete interview"
                      onClick={() => deleteInterview(item._id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border ${darkMode ? "border-white/10 text-slate-500 hover:bg-red-400/10 hover:text-red-300" : "border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500"}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${darkMode ? "bg-sky-400/10 text-sky-300" : "bg-sky-50 text-sky-600"}`}
              >
                <ClipboardList size={24} />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em]">
                No interviews recorded
              </h3>
              <p
                className={`mt-2 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}
              >
                Log your first interview experience when you are ready.
              </p>
              <button
                onClick={openAddModal}
                className="mt-5 flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
              >
                <Plus size={15} />
                Log interview
              </button>
            </div>
          )}
        </Surface>

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
                className={`my-auto w-full max-w-2xl rounded-[26px] border p-6 shadow-2xl sm:p-8 ${darkMode ? "border-white/10 bg-[#11161e]" : "border-slate-200 bg-white"}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                      {editingInterview
                        ? "Update conversation"
                        : "New conversation"}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tighter">
                      {editingInterview ? "Edit interview" : "Log interview"}
                    </h2>
                    <p
                      className={`mt-1 text-sm ${darkMode ? "text-slate-500" : "text-slate-500"}`}
                    >
                      Capture the schedule and context while it is fresh.
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${darkMode ? "text-slate-500 hover:bg-white/6 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"}`}
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
                      className={`mb-3 text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}
                    >
                      Interview
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                        >
                          Company<span className="ml-1 text-sky-500">*</span>
                        </span>
                        <input
                          placeholder="e.g. Acme Inc."
                          className={`mt-2 ${inputClass} ${errors.company ? "border-red-500" : ""}`}
                          {...register("company", {
                            required: "Company is required",
                          })}
                        />
                        {errors.company && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.company.message}
                          </p>
                        )}
                      </label>
                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                        >
                          Role<span className="ml-1 text-sky-500">*</span>
                        </span>
                        <input
                          placeholder="e.g. Software Engineer"
                          className={`mt-2 ${inputClass} ${errors.role ? "border-red-500" : ""}`}
                          {...register("role", {
                            required: "Role is required",
                          })}
                        />
                        {errors.role && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.role.message}
                          </p>
                        )}
                      </label>
                      <label className="block sm:col-span-2">
                        <span
                          className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                        >
                          Round<span className="ml-1 text-sky-500">*</span>
                        </span>
                        <input
                          placeholder="e.g. Technical interview"
                          className={`mt-2 ${inputClass} ${errors.round ? "border-red-500" : ""}`}
                          {...register("round", {
                            required: "Round is required",
                          })}
                        />
                        {errors.round && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.round.message}
                          </p>
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <p
                      className={`mb-3 text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}
                    >
                      Schedule
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                        >
                          Interview date
                          <span className="ml-1 text-sky-500">*</span>
                        </span>
                        <div className="relative mt-2">
                          <Calendar
                            size={16}
                            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                          />
                          <input
                            type="date"
                            className={`pl-10 ${inputClass} ${errors.date ? "border-red-500" : ""}`}
                            {...register("date", {
                              required: "Date is required",
                              onChange: handleDateChange,
                            })}
                          />
                        </div>
                        {errors.date && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.date.message}
                          </p>
                        )}
                        {selectedDate && (
                          <p
                            className={`mt-1 text-xs ${darkMode ? "text-slate-600" : "text-slate-400"}`}
                          >
                            Selected:{" "}
                            {new Date(selectedDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </p>
                        )}
                      </label>
                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                        >
                          Time{" "}
                          <span
                            className={`font-normal ${darkMode ? "text-slate-600" : "text-slate-400"}`}
                          >
                            (optional)
                          </span>
                        </span>
                        <div className="relative mt-2">
                          <Clock
                            size={16}
                            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                          />
                          <input
                            type="time"
                            className={`pl-10 ${inputClass}`}
                            {...register("time", {
                              onChange: handleTimeChange,
                            })}
                          />
                        </div>
                        {selectedTime && (
                          <p
                            className={`mt-1 text-xs ${darkMode ? "text-slate-600" : "text-slate-400"}`}
                          >
                            Selected: {selectedTime}
                          </p>
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <p
                      className={`mb-3 text-[10px] font-bold uppercase tracking-[0.16em] ${darkMode ? "text-slate-600" : "text-slate-400"}`}
                    >
                      Reflection
                    </p>
                    <div className="grid gap-4">
                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                        >
                          Questions{" "}
                          <span
                            className={`font-normal ${darkMode ? "text-slate-600" : "text-slate-400"}`}
                          >
                            (comma separated, optional)
                          </span>
                        </span>
                        <input
                          placeholder="e.g. system design, closures"
                          className={`mt-2 ${inputClass}`}
                          {...register("questions")}
                        />
                      </label>
                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                        >
                          Feedback{" "}
                          <span
                            className={`font-normal ${darkMode ? "text-slate-600" : "text-slate-400"}`}
                          >
                            (optional)
                          </span>
                        </span>
                        <textarea
                          rows="3"
                          placeholder="What do you want to remember?"
                          className={`mt-2 resize-none ${inputClass}`}
                          {...register("feedback")}
                        />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span
                            className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                          >
                            Difficulty
                          </span>
                          <select
                            className={`mt-2 ${inputClass}`}
                            {...register("difficulty")}
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </label>
                        <label className="block">
                          <span
                            className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                          >
                            Result<span className="ml-1 text-sky-500">*</span>
                          </span>
                          <select
                            className={`mt-2 ${inputClass} ${errors.result ? "border-red-500" : ""}`}
                            {...register("result", {
                              required: "Result is required",
                            })}
                          >
                            <option value="Upcoming">Upcoming</option>
                            <option value="Passed">Passed</option>
                            <option value="Failed">Failed</option>
                            <option value="Pending">Pending</option>
                          </select>
                          {errors.result && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors.result.message}
                            </p>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end ${darkMode ? "border-white/8" : "border-slate-100"}`}
                  >
                    <button
                      type="button"
                      onClick={closeModal}
                      className={`rounded-xl border px-5 py-3 text-sm font-semibold ${darkMode ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
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
                        : editingInterview
                          ? "Update interview"
                          : "Save interview"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default Interviews;
