import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import {
  Plus, Search, Briefcase, MapPin, DollarSign, Calendar, X, Eye, Edit, Trash2, Archive,
  ChevronLeft, ChevronRight, RotateCcw, Layers, Filter, AlertCircle, RefreshCw,
  ExternalLink, SlidersHorizontal, UserRound, Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

const statuses = ["All Statuses", "Wishlist", "Applied", "OA", "Interview", "HR", "Offer", "Rejected"];

const statusColors = {
  Wishlist: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-400",
  Applied: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-300",
  OA: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-300",
  Interview: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-300/20 dark:bg-blue-400/10 dark:text-blue-300",
  HR: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-300/20 dark:bg-orange-400/10 dark:text-orange-300",
  Offer: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  Rejected: "border-red-200 bg-red-50 text-red-700 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-300",
};

const stages = ["Wishlist", "Applied", "OA", "Interview", "HR", "Offer"];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "company-asc", label: "Company A-Z" },
  { value: "company-desc", label: "Company Z-A" },
];

const JOBS_PER_PAGE = 10;

const Surface = ({ children, className = "" }) => {
  const { darkMode } = useTheme();

  return (
    <section
      className={`rounded-3xl border shadow-[0_18px_55px_rgba(15,23,42,0.055)] ${
        darkMode
          ? "border-white/8 bg-[#11161e] shadow-black/20"
          : "border-slate-200/80 bg-white"
      } ${className}`}
    >
      {children}
    </section>
  );
};

const StatusMark = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
      statusColors[status] || statusColors.Wishlist
    }`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
    {status || "Unknown"}
  </span>
);

const processJobs = (jobsToProcess, search, statusFilter, sortBy) => {
  let filtered = jobsToProcess;

  if (search.trim()) {
    const searchLower = search.toLowerCase().trim();

    filtered = filtered.filter((job) => {
      const company = (job.company || "").toLowerCase();
      const role = (job.role || "").toLowerCase();
      const location = (job.location || "").toLowerCase();

      return (
        company.includes(searchLower) ||
        role.includes(searchLower) ||
        location.includes(searchLower)
      );
    });
  }

  if (statusFilter !== "All Statuses") {
    filtered = filtered.filter((job) => job.status === statusFilter);
  }

  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "company-asc":
        return (a.company || "").localeCompare(
          b.company || "",
          undefined,
          { sensitivity: "base" }
        );
      case "company-desc":
        return (b.company || "").localeCompare(
          a.company || "",
          undefined,
          { sensitivity: "base" }
        );
      default:
        return 0;
    }
  });
};

const ActionButton = ({
  label,
  onClick,
  disabled,
  children,
  danger = false,
}) => {
  const { darkMode } = useTheme();

  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? darkMode
            ? "border-red-300/10 text-red-300/70 hover:border-red-300/30 hover:bg-red-400/10"
            : "border-red-100 text-red-500 hover:bg-red-50"
          : darkMode
          ? "border-white/8 text-slate-500 hover:border-sky-300/30 hover:bg-sky-400/10 hover:text-sky-300"
          : "border-slate-200 text-slate-400 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
      }`}
    >
      {children}
    </button>
  );
};

const JobRow = ({
  job,
  isArchived,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  archivingId,
  restoringId,
  deletingId,
  index,
}) => {
  const { darkMode } = useTheme();
  const initials = (job.company || "?").slice(0, 1).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035 }}
      className={`group grid gap-4 border-b px-5 py-5 last:border-b-0 sm:px-7 lg:grid-cols-[minmax(220px,1.35fr)_minmax(110px,0.75fr)_minmax(110px,0.7fr)_130px_132px] lg:items-center ${
        darkMode
          ? "border-white/[0.07] hover:bg-white/[0.018]"
          : "border-slate-100 hover:bg-slate-50/60"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
            darkMode
              ? "bg-sky-400/10 text-sky-300"
              : "bg-sky-50 text-sky-700"
          }`}
        >
          {initials}
        </div>

        <div className="min-w-0">
          <p
            className={`truncate text-sm font-bold ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            {job.company || "Unnamed company"}
          </p>

          <p
            className={`mt-1 truncate text-xs ${
              darkMode ? "text-slate-500" : "text-slate-500"
            }`}
          >
            {job.role || "Role not specified"}
          </p>

          <div
            className={`mt-2 flex items-center gap-1.5 text-[11px] lg:hidden ${
              darkMode ? "text-slate-600" : "text-slate-400"
            }`}
          >
            <MapPin size={11} />
            {job.location || "Location not specified"}
          </div>
        </div>
      </div>

      <div
        className={`hidden text-xs lg:block ${
          darkMode ? "text-slate-400" : "text-slate-600"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-sky-500" />
          {job.location || "—"}
        </div>
      </div>

      <div
        className={`hidden text-xs lg:block ${
          darkMode ? "text-slate-400" : "text-slate-600"
        }`}
      >
        {job.package ? (
          <span className="flex items-center gap-1.5">
            <DollarSign size={13} className="text-emerald-500" />
            {job.package}
          </span>
        ) : (
          "—"
        )}
      </div>

      <div className="flex items-center justify-between lg:block">
        <StatusMark status={job.status} />

        <p
          className={`mt-1.5 flex items-center gap-1 text-[11px] ${
            darkMode ? "text-slate-600" : "text-slate-400"
          }`}
        >
          <Calendar size={11} />
          {job.appliedDate || "Not applied"}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 lg:justify-end">
        <div className="flex items-center gap-1.5">
          <ActionButton label="View job" onClick={onView}>
            <Eye size={15} />
          </ActionButton>

          {!isArchived && (
            <>
              <ActionButton label="Edit job" onClick={onEdit}>
                <Edit size={15} />
              </ActionButton>

              <ActionButton
                label="Archive job"
                disabled={archivingId === job._id}
                onClick={onArchive}
              >
                <Archive size={15} />
              </ActionButton>
            </>
          )}

          {isArchived && (
            <ActionButton
              label="Restore job"
              disabled={restoringId === job._id}
              onClick={onRestore}
            >
              <RotateCcw size={15} />
            </ActionButton>
          )}

          <ActionButton
            label="Delete job"
            danger
            disabled={deletingId === job._id}
            onClick={onDelete}
          >
            <Trash2 size={15} />
          </ActionButton>
        </div>

        <div
          className={`text-[11px] lg:hidden ${
            darkMode ? "text-slate-600" : "text-slate-400"
          }`}
        >
          {job.package || ""}
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ archived, filtered, onAdd, onClear }) => {
  const { darkMode } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
          darkMode
            ? "bg-sky-400/10 text-sky-300"
            : "bg-sky-50 text-sky-600"
        }`}
      >
        {filtered ? (
          <Search size={24} />
        ) : archived ? (
          <Layers size={24} />
        ) : (
          <Briefcase size={24} />
        )}
      </div>

      <h3
        className={`mt-5 text-xl font-semibold tracking-[-0.04em] ${
          darkMode ? "text-white" : "text-slate-900"
        }`}
      >
        {filtered
          ? archived
            ? "No archived jobs found"
            : "No jobs found"
          : archived
          ? "No archived jobs"
          : "No jobs yet"}
      </h3>

      <p
        className={`mt-2 max-w-sm text-sm leading-6 ${
          darkMode ? "text-slate-500" : "text-slate-500"
        }`}
      >
        {filtered
          ? "Try adjusting the search or status filters to find what you need."
          : archived
          ? "Jobs you archive will appear here."
          : "Add your first job application to start tracking your placement journey."}
      </p>

      {filtered ? (
        <button
          onClick={onClear}
          className="mt-6 flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
        >
          <X size={15} /> Clear filters
        </button>
      ) : (
        !archived && (
          <button
            onClick={onAdd}
            className="mt-6 flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
          >
            <Plus size={15} /> Add your first job
          </button>
        )
      )}
    </div>
  );
};

const Jobs = () => {
  const { darkMode } = useTheme();

  const [jobs, setJobs] = useState([]);
  const [archivedJobs, setArchivedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [sortBy, setSortBy] = useState("newest");
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedError, setArchivedError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [archivingId, setArchivingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [viewMode, setViewMode] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);

  const { register, handleSubmit, reset, setValue } = useForm();

  // Matcher state
  const [showMatcherModal, setShowMatcherModal] = useState(false);
  const [matcherLoading, setMatcherLoading] = useState(false);
  const [matcherResult, setMatcherResult] = useState(null);
  const [matcherError, setMatcherError] = useState(null);
  const [resumesList, setResumesList] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [matcherCompany, setMatcherCompany] = useState("");
  const [matcherJobDesc, setMatcherJobDesc] = useState("");
  const [fetchingResumes, setFetchingResumes] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/jobs");
      setJobs(response.data.jobs || response.data);
      setError(null);
    } catch (error) {
      console.error(error);
      setError("Unable to load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchArchivedJobs = useCallback(async () => {
    setArchivedLoading(true);
    setArchivedError(null);

    try {
      const response = await api.get("/jobs/archived");
      setArchivedJobs(response.data.jobs || response.data || []);
    } catch (error) {
      console.error(error);
      setArchivedError("Unable to load archived jobs.");
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadJobs = async () => {
      if (!mounted) return;
      await fetchJobs();
    };

    loadJobs();

    return () => {
      mounted = false;
    };
  }, [fetchJobs]);

  useEffect(() => {
    if (viewMode !== "archived") return;

    let mounted = true;

    const loadArchived = async () => {
      if (!mounted) return;
      await fetchArchivedJobs();
    };

    loadArchived();

    return () => {
      mounted = false;
    };
  }, [viewMode, fetchArchivedJobs]);

  const processedJobs = useMemo(
    () => processJobs(jobs, search, statusFilter, sortBy),
    [jobs, search, statusFilter, sortBy]
  );

  const processedArchivedJobs = useMemo(
    () => processJobs(archivedJobs, search, statusFilter, sortBy),
    [archivedJobs, search, statusFilter, sortBy]
  );

  const currentJobs =
    viewMode === "active" ? processedJobs : processedArchivedJobs;

  const totalJobs = currentJobs.length;
  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (totalPages === 0 && currentPage !== 1) {
      queueMicrotask(() => setCurrentPage(1));
    } else if (currentPage > totalPages && totalPages > 0) {
      queueMicrotask(() => setCurrentPage(totalPages));
    }
  }, [currentPage, totalPages]);

  const paginatedJobs = useMemo(
    () =>
      currentJobs.slice(
        (currentPage - 1) * JOBS_PER_PAGE,
        currentPage * JOBS_PER_PAGE
      ),
    [currentJobs, currentPage]
  );

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "All Statuses" ||
    sortBy !== "newest";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All Statuses");
    setSortBy("newest");
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingJob(null);

    reset({
      company: "",
      role: "",
      location: "",
      package: "",
      appliedDate: "",
      status: "",
      referral: "",
      jobLink: "",
      notes: "",
    });

    setModal(true);
  };

  const openEditModal = (job) => {
    setIsEditMode(true);
    setEditingJob(job);
    setValue("company", job.company || "");
    setValue("role", job.role || "");
    setValue("location", job.location || "");
    setValue("package", job.package || "");
    setValue("appliedDate", job.appliedDate || "");
    setValue("status", job.status || "");
    setValue("referral", String(job.referral));
    setValue("jobLink", job.jobLink || "");
    setValue("notes", job.notes || "");
    setModal(true);
  };

  const saveJob = async (data) => {
    try {
      setSubmitting(true);

      const payload = {
        company: data.company,
        role: data.role,
        location: data.location,
        package: data.package,
        appliedDate: data.appliedDate,
        status: data.status,
        referral: data.referral,
        jobLink: data.jobLink,
        notes: data.notes,
      };

      if (isEditMode) {
        if (!editingJob?._id) {
          alert("No job selected for editing");
          return;
        }

        const response = await api.put(
          `/jobs/${editingJob._id}`,
          payload
        );

        const updatedJob = response.data.job || response.data;

        setJobs((prev) =>
          prev.map((job) =>
            job._id === editingJob._id ? updatedJob : job
          )
        );

        setModal(false);
        setEditingJob(null);
        setIsEditMode(false);
        alert("Job updated successfully");
      } else {
        const response = await api.post("/jobs", payload);
        const newJob = response.data.job || response.data;

        setJobs((prev) => [...prev, newJob]);
        setModal(false);
        alert("Job added successfully");
      }

      reset();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          (isEditMode
            ? "Failed to update job"
            : "Failed to add job")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteJob = async (job) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job?"
    );

    if (!confirmed) return;

    if (!job?._id) {
      alert("Invalid job selected");
      return;
    }

    try {
      setDeletingId(job._id);

      await api.delete(`/jobs/${job._id}`);

      setJobs((prev) => prev.filter((j) => j._id !== job._id));
      setArchivedJobs((prev) =>
        prev.filter((j) => j._id !== job._id)
      );

      alert("Job deleted successfully");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to delete job"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const archiveJob = async (job) => {
    if (!job?._id) {
      alert("Invalid job selected");
      return;
    }

    try {
      setArchivingId(job._id);

      await api.patch(`/jobs/${job._id}/archive`);

      setJobs((prev) =>
        prev.filter((j) => j._id !== job._id)
      );

      alert("Job archived successfully");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to archive job"
      );
    } finally {
      setArchivingId(null);
    }
  };

  const restoreJob = async (job) => {
    const confirmed = window.confirm(
      "Are you sure you want to restore this job?"
    );

    if (!confirmed) return;

    if (!job?._id) {
      alert("Invalid job selected");
      return;
    }

    try {
      setRestoringId(job._id);

      const response = await api.patch(
        `/jobs/${job._id}/restore`
      );

      const restoredJob =
        response.data.job || response.data;

      setArchivedJobs((prev) =>
        prev.filter((j) => j._id !== job._id)
      );

      setJobs((prev) => [...prev, restoredJob]);

      alert("Job restored successfully");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to restore job"
      );
    } finally {
      setRestoringId(null);
    }
  };

  // Matcher handlers
  const fetchResumesForMatcher = async () => {
    setFetchingResumes(true);

    try {
      const { data } = await api.get("/resumes");

      const allResumes = data?.resumes || data || [];

      const personal = allResumes.filter(
        (r) => r.resumeType === "mine" && !r.isArchived
      );

      setResumesList(personal);

      if (personal.length > 0) {
        setSelectedResumeId(personal[0]._id);
      } else {
        setSelectedResumeId("");
      }
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
      toast.error("Could not load your resumes.");
    } finally {
      setFetchingResumes(false);
    }
  };

  const openMatcherModal = () => {
    setMatcherResult(null);
    setMatcherError(null);
    setMatcherCompany("");
    setMatcherJobDesc("");
    setShowMatcherModal(true);
    fetchResumesForMatcher();
  };

  const handleMatcherAnalyze = async () => {
    if (!matcherJobDesc.trim()) {
      toast.error("Please paste a job description.");
      return;
    }

    if (!selectedResumeId) {
      toast.error("Please select a resume.");
      return;
    }

    setMatcherLoading(true);
    setMatcherError(null);
    setMatcherResult(null);

    try {
      const response = await api.post("/resumes/match", {
        resumeId: selectedResumeId,
        jobDescription: matcherJobDesc.trim(),
        company: matcherCompany.trim(),
      });

      if (response.data.success) {
        setMatcherResult(response.data.data);
        toast.success("Analysis complete!");
      } else {
        setMatcherError(
          response.data.message || "Analysis failed."
        );
      }
    } catch (error) {
      console.error("Matcher error:", error);

      const msg =
        error.response?.data?.message ||
        "Failed to analyze match.";

      setMatcherError(msg);
      toast.error(msg);
    } finally {
      setMatcherLoading(false);
    }
  };

  const stats = [
    [
      "Total applications",
      jobs.length,
      Briefcase,
      "text-sky-500",
    ],
    [
      "Wishlist",
      jobs.filter((j) => j.status === "Wishlist").length,
      Archive,
      "text-slate-400",
    ],
    [
      "Interviews",
      jobs.filter((j) => j.status === "Interview").length,
      Calendar,
      "text-blue-500",
    ],
    [
      "Offers",
      jobs.filter((j) => j.status === "Offer").length,
      DollarSign,
      "text-emerald-500",
    ],
  ];

  const renderPagination = () =>
    totalPages > 1 && (
      <div
        className={`flex items-center justify-between border-t px-5 py-4 sm:px-7 ${
          darkMode ? "border-white/8" : "border-slate-100"
        }`}
      >
        <span
          className={`text-xs ${
            darkMode ? "text-slate-500" : "text-slate-500"
          }`}
        >
          Page {currentPage} of {totalPages}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-40 ${
              darkMode
                ? "border-white/10 text-slate-400 hover:bg-white/5"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <ChevronLeft size={15} />
          </button>

          {Array.from(
            { length: totalPages },
            (_, i) => i + 1
          ).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`hidden h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold sm:flex ${
                currentPage === page
                  ? "bg-sky-600 text-white"
                  : darkMode
                  ? "text-slate-500 hover:bg-white/5"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-40 ${
              darkMode
                ? "border-white/10 text-slate-400 hover:bg-white/5"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    );

  const renderRows = (items, archived) => (
    <>
      <div
        className={`hidden grid-cols-[minmax(220px,1.35fr)_minmax(110px,0.75fr)_minmax(110px,0.7fr)_130px_132px] gap-4 border-b px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] lg:grid sm:px-7 ${
          darkMode
            ? "border-white/8 text-slate-600"
            : "border-slate-100 text-slate-400"
        }`}
      >
        <span>Company / role</span>
        <span>Location</span>
        <span>Package</span>
        <span>Status / date</span>
        <span className="text-right">Actions</span>
      </div>

      {items.map((job, index) => (
        <JobRow
          key={job._id}
          job={job}
          isArchived={archived}
          index={index}
          onView={() => setSelectedJob(job)}
          onEdit={() => openEditModal(job)}
          onArchive={() => archiveJob(job)}
          onRestore={() => restoreJob(job)}
          onDelete={() => deleteJob(job)}
          archivingId={archivingId}
          restoringId={restoringId}
          deletingId={deletingId}
        />
      ))}
    </>
  );

  const renderContent = () => {
    if (viewMode === "active") {
      if (loading) {
        return (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
            <p
              className={`text-sm ${
                darkMode
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Loading your jobs...
            </p>
          </div>
        );
      }

      if (error) {
        return (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <AlertCircle size={42} className="text-red-400" />
            <p className="text-sm text-red-400">{error}</p>

            <button
              onClick={() => fetchJobs()}
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        );
      }

      if (jobs.length === 0 && !hasActiveFilters) {
        return (
          <EmptyState
            archived={false}
            filtered={false}
            onAdd={openCreateModal}
          />
        );
      }

      if (processedJobs.length === 0 && hasActiveFilters) {
        return (
          <EmptyState
            archived={false}
            filtered
            onClear={clearFilters}
          />
        );
      }

      return (
        <>
          {renderRows(paginatedJobs, false)}

          <div
            className={`px-5 py-3 text-xs sm:px-7 ${
              darkMode
                ? "text-slate-500"
                : "text-slate-500"
            }`}
          >
            Showing {paginatedJobs.length} of {totalJobs} job
            {totalJobs !== 1 ? "s" : ""}
          </div>

          {renderPagination()}
        </>
      );
    }

    if (archivedLoading) {
      return (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />

          <p
            className={`text-sm ${
              darkMode
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Loading archived jobs...
          </p>
        </div>
      );
    }

    if (archivedError) {
      return (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <AlertCircle size={42} className="text-red-400" />

          <p className="text-sm text-red-400">
            {archivedError}
          </p>

          <button
            onClick={() => fetchArchivedJobs()}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      );
    }

    if (archivedJobs.length === 0 && !hasActiveFilters) {
      return (
        <EmptyState
          archived
          filtered={false}
        />
      );
    }

    if (
      processedArchivedJobs.length === 0 &&
      hasActiveFilters
    ) {
      return (
        <EmptyState
          archived
          filtered
          onClear={clearFilters}
        />
      );
    }

    return (
      <>
        {renderRows(paginatedJobs, true)}

        <div
          className={`px-5 py-3 text-xs sm:px-7 ${
            darkMode
              ? "text-slate-500"
              : "text-slate-500"
          }`}
        >
          Showing {paginatedJobs.length} of {totalJobs} archived
          job{totalJobs !== 1 ? "s" : ""}
        </div>

        {renderPagination()}
      </>
    );
  };

  const formFields = [
    ["company", "Company", true, "e.g. Acme Inc."],
    ["role", "Role", true, "e.g. Software Engineer"],
    [
      "location",
      "Location",
      false,
      "e.g. Bengaluru / Remote",
    ],
    ["package", "Package", false, "e.g. 18 LPA"],
  ];

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
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col gap-6 border-b pb-7 md:flex-row md:items-end md:justify-between ${
            darkMode
              ? "border-white/8"
              : "border-slate-200"
          }`}
        >
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">
              <Briefcase size={14} />
              DevPilot / Applications
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">
              Job command center
            </h1>

            <p
              className={`mt-3 max-w-lg text-sm leading-6 ${
                darkMode
                  ? "text-slate-500"
                  : "text-slate-500"
              }`}
            >
              Keep every opportunity visible, organized, and
              moving toward the next stage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setViewMode("active")}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                viewMode === "active"
                  ? "border-sky-600 bg-sky-600 text-white"
                  : darkMode
                  ? "border-white/10 text-slate-400 hover:bg-white/5"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Briefcase size={16} />
              Active
            </button>

            <button
              onClick={() => setViewMode("archived")}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                viewMode === "archived"
                  ? "border-sky-600 bg-sky-600 text-white"
                  : darkMode
                  ? "border-white/10 text-slate-400 hover:bg-white/5"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Layers size={16} />
              Archived
            </button>

            {viewMode === "active" &&
              !loading &&
              !error && (
                <>
                  <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(14,116,144,0.18)] transition-all hover:-translate-y-0.5 hover:bg-sky-500"
                  >
                    <Plus size={17} />
                    Add job
                  </button>

                  {/* ONLY THIS BUTTON WAS CHANGED */}
                  <button
                    onClick={openMatcherModal}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all shadow-[0_8px_20px_rgba(168,85,247,0.18)] ${
                      darkMode
                        ? "border-violet-300/30 bg-violet-400/15 text-violet-200 hover:bg-violet-400/25 hover:text-white"
                        : "border-violet-500/40 bg-violet-100 text-violet-800 hover:bg-violet-200 hover:text-violet-950"
                    }`}
                  >
                    <Sparkles size={17} />
                    Match My Resume
                  </button>
                </>
              )}
          </div>
        </motion.header>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(
            ([title, value, Icon, color], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className={`flex items-center gap-4 rounded-2xl border px-5 py-4 ${
                  darkMode
                    ? "border-white/8 bg-[#11161e]"
                    : "border-slate-200/80 bg-white"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-white/5"
                      : "bg-slate-50"
                  }`}
                >
                  <Icon size={18} className={color} />
                </div>

                <div>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                      darkMode
                        ? "text-slate-600"
                        : "text-slate-400"
                    }`}
                  >
                    {title}
                  </p>

                  <p className="mt-1 text-2xl font-semibold tracking-[-0.06em]">
                    {value}
                  </p>
                </div>
              </motion.div>
            )
          )}
        </section>

        <Surface className="mt-7 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 ${
                darkMode
                  ? "border-white/10 bg-white/2.5"
                  : "border-slate-200 bg-slate-50/60"
              }`}
            >
              <Search
                size={17}
                className={
                  darkMode
                    ? "text-slate-500"
                    : "text-slate-400"
                }
              />

              <input
                placeholder="Search companies, roles, or locations..."
                className={`w-full bg-transparent py-3 text-sm outline-none ${
                  darkMode
                    ? "text-white placeholder:text-slate-600"
                    : "text-slate-900 placeholder:text-slate-400"
                }`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading || error}
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className={
                    darkMode
                      ? "text-slate-500 hover:text-white"
                      : "text-slate-400 hover:text-slate-900"
                  }
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div
                className={`flex items-center gap-2 rounded-xl border px-3 ${
                  darkMode
                    ? "border-white/10 bg-white/2.5"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <Filter size={15} className="text-sky-500" />

                <select
                  className={`bg-transparent py-3 text-sm outline-none ${
                    darkMode
                      ? "text-slate-200 scheme-dark"
                      : "text-slate-700 scheme-light"
                  }`}
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                  disabled={loading || error}
                >
                  {statuses.map((status) => (
                    <option
                      key={status}
                      className={
                        darkMode
                          ? "bg-[#11161e] text-white"
                          : "bg-white text-slate-900"
                      }
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`flex items-center gap-2 rounded-xl border px-3 ${
                  darkMode
                    ? "border-white/10 bg-white/2.5"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <SlidersHorizontal
                  size={15}
                  className="text-sky-500"
                />

                <select
                  className={`bg-transparent py-3 text-sm outline-none ${
                    darkMode
                      ? "text-slate-200 scheme-dark"
                      : "text-slate-700 scheme-light"
                  }`}
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                  disabled={loading || error}
                >
                  {sortOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className={
                        darkMode
                          ? "bg-[#11161e] text-white"
                          : "bg-white text-slate-900"
                      }
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters &&
                !loading &&
                !error && (
                  <button
                    onClick={clearFilters}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                      darkMode
                        ? "bg-white/6 text-slate-300 hover:bg-white/10"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <X size={15} />
                    Clear
                  </button>
                )}
            </div>
          </div>

          {hasActiveFilters &&
            !loading &&
            !error && (
              <div
                className={`mt-4 flex flex-wrap items-center gap-2 border-t pt-3 text-xs ${
                  darkMode
                    ? "border-white/8 text-slate-500"
                    : "border-slate-100 text-slate-500"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Filter size={13} />
                  Active filters
                </span>

                {search && (
                  <span
                    className={`rounded-lg px-2.5 py-1 ${
                      darkMode
                        ? "bg-white/6"
                        : "bg-slate-100"
                    }`}
                  >
                    Search: &quot;{search}&quot;
                  </span>
                )}

                {statusFilter !== "All Statuses" && (
                  <span
                    className={`rounded-lg px-2.5 py-1 ${
                      darkMode
                        ? "bg-white/6"
                        : "bg-slate-100"
                    }`}
                  >
                    Status: {statusFilter}
                  </span>
                )}

                {sortBy !== "newest" && (
                  <span
                    className={`rounded-lg px-2.5 py-1 ${
                      darkMode
                        ? "bg-white/6"
                        : "bg-slate-100"
                    }`}
                  >
                    Sort:{" "}
                    {
                      sortOptions.find(
                        (o) => o.value === sortBy
                      )?.label
                    }
                  </span>
                )}
              </div>
            )}
        </Surface>

        <Surface className="mt-7 overflow-hidden">
          <div
            className={`flex items-center justify-between border-b px-5 py-5 sm:px-7 ${
              darkMode
                ? "border-white/8"
                : "border-slate-100"
            }`}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                {viewMode === "active"
                  ? "Current pipeline"
                  : "Stored history"}
              </p>

              <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.04em]">
                {viewMode === "active"
                  ? "Applications"
                  : "Archived applications"}
              </h2>
            </div>

            <span
              className={`text-xs ${
                darkMode
                  ? "text-slate-600"
                  : "text-slate-400"
              }`}
            >
              {totalJobs} result
              {totalJobs !== 1 ? "s" : ""}
            </span>
          </div>

          {renderContent()}
        </Surface>

        {/* ============================================================ */}
        {/* SELECTED JOB */}
        {/* ============================================================ */}

        <AnimatePresence>
          {selectedJob && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className={`fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l p-6 shadow-2xl sm:p-8 ${
                darkMode
                  ? "border-white/8 bg-[#10151d]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                    Application detail
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tighter">
                    {selectedJob.company}
                  </h2>

                  <p
                    className={`mt-1 text-sm ${
                      darkMode
                        ? "text-slate-500"
                        : "text-slate-500"
                    }`}
                  >
                    {selectedJob.role}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedJob(null)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    darkMode
                      ? "text-slate-500 hover:bg-white/6 hover:text-white"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-7">
                <StatusMark status={selectedJob.status} />

                <div
                  className={`mt-6 grid grid-cols-2 gap-3 border-y py-5 text-sm ${
                    darkMode
                      ? "border-white/8"
                      : "border-slate-100"
                  }`}
                >
                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                        darkMode
                          ? "text-slate-600"
                          : "text-slate-400"
                      }`}
                    >
                      Location
                    </p>

                    <p className="mt-2 flex items-center gap-1.5">
                      <MapPin
                        size={14}
                        className="text-sky-500"
                      />
                      {selectedJob.location || "—"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                        darkMode
                          ? "text-slate-600"
                          : "text-slate-400"
                      }`}
                    >
                      Package
                    </p>

                    <p className="mt-2 flex items-center gap-1.5">
                      <DollarSign
                        size={14}
                        className="text-emerald-500"
                      />
                      {selectedJob.package || "—"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                        darkMode
                          ? "text-slate-600"
                          : "text-slate-400"
                      }`}
                    >
                      Applied
                    </p>

                    <p className="mt-2 flex items-center gap-1.5">
                      <Calendar
                        size={14}
                        className="text-sky-500"
                      />
                      {selectedJob.appliedDate || "—"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                        darkMode
                          ? "text-slate-600"
                          : "text-slate-400"
                      }`}
                    >
                      Referral
                    </p>

                    <p className="mt-2 flex items-center gap-1.5">
                      <UserRound
                        size={14}
                        className="text-sky-500"
                      />
                      {selectedJob.referral ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                <div className="mt-7">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                      darkMode
                        ? "text-slate-600"
                        : "text-slate-400"
                    }`}
                  >
                    Application progress
                  </p>

                  <div className="mt-5 space-y-3">
                    {stages.map((stage, index) => {
                      const active =
                        stages.indexOf(stage) <=
                        stages.indexOf(selectedJob.status);

                      return (
                        <div
                          key={stage}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                              active
                                ? "bg-sky-600 text-white"
                                : darkMode
                                ? "bg-white/6 text-slate-600"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {index + 1}
                          </div>

                          <span
                            className={`text-sm ${
                              active
                                ? darkMode
                                  ? "text-slate-200"
                                  : "text-slate-800"
                                : darkMode
                                ? "text-slate-600"
                                : "text-slate-400"
                            }`}
                          >
                            {stage}
                          </span>

                          {index < stages.length - 1 && (
                            <div
                              className={`ml-[-1.6rem] mt-10 h-3 w-px ${
                                active
                                  ? "bg-sky-500/60"
                                  : darkMode
                                  ? "bg-white/10"
                                  : "bg-slate-200"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedJob.jobLink && (
                  <a
                    href={selectedJob.jobLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-8 flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-500"
                  >
                    Open job link
                    <ExternalLink size={14} />
                  </a>
                )}

                {selectedJob.notes && (
                  <div
                    className={`mt-7 rounded-xl border p-4 ${
                      darkMode
                        ? "border-white/8 bg-white/3"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                        darkMode
                          ? "text-slate-600"
                          : "text-slate-400"
                      }`}
                    >
                      Notes
                    </p>

                    <p
                      className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${
                        darkMode
                          ? "text-slate-300"
                          : "text-slate-700"
                      }`}
                    >
                      {selectedJob.notes}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* ADD / EDIT JOB MODAL */}
        {/* ============================================================ */}

        <AnimatePresence>
          {modal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                className={`my-auto w-full max-w-2xl rounded-[26px] border p-6 shadow-2xl sm:p-8 ${
                  darkMode
                    ? "border-white/10 bg-[#11161e]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                      {isEditMode
                        ? "Update pipeline record"
                        : "New pipeline record"}
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tighter">
                      {isEditMode
                        ? "Edit job"
                        : "Add job"}
                    </h2>

                    <p
                      className={`mt-1 text-sm ${
                        darkMode
                          ? "text-slate-500"
                          : "text-slate-500"
                      }`}
                    >
                      Keep the details that help you move
                      this opportunity forward.
                    </p>
                  </div>

                  <button
                    onClick={() => setModal(false)}
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
                  onSubmit={handleSubmit(saveJob)}
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
                      Job information
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {formFields.map(
                        ([
                          field,
                          label,
                          required,
                          placeholder,
                        ]) => (
                          <label
                            key={field}
                            className="block"
                          >
                            <span
                              className={`text-xs font-semibold ${
                                darkMode
                                  ? "text-slate-300"
                                  : "text-slate-700"
                              }`}
                            >
                              {label}

                              {required && (
                                <span className="ml-1 text-sky-500">
                                  *
                                </span>
                              )}
                            </span>

                            <input
                              placeholder={placeholder}
                              className={`mt-2 ${inputClass}`}
                              {...register(field, {
                                required: required
                                  ? `${field} is required`
                                  : false,
                              })}
                            />
                          </label>
                        )
                      )}
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
                      Application details
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
                          Applied date
                        </span>

                        <input
                          type="date"
                          className={inputClass}
                          {...register("appliedDate")}
                        />
                      </label>

                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${
                            darkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          Status
                          <span className="ml-1 text-sky-500">
                            *
                          </span>
                        </span>

                        <select
                          className={`mt-2 ${inputClass}`}
                          {...register("status", {
                            required:
                              "status is required",
                          })}
                        >
                          <option value="">
                            Select Status
                          </option>

                          {statuses
                            .slice(1)
                            .map((status) => (
                              <option key={status}>
                                {status}
                              </option>
                            ))}
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
                          Referral
                        </span>

                        <select
                          className={`mt-2 ${inputClass}`}
                          {...register("referral", {
                            setValueAs: (value) =>
                              value === "true",
                          })}
                        >
                          <option value="">
                            Referral (optional)
                          </option>
                          <option value="true">
                            Yes
                          </option>
                          <option value="false">
                            No
                          </option>
                        </select>
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
                      Additional context
                    </p>

                    <div className="grid gap-4">
                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${
                            darkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          Job link
                        </span>

                        <input
                          placeholder="https://... (optional)"
                          className={`mt-2 ${inputClass}`}
                          {...register("jobLink")}
                        />
                      </label>

                      <label className="block">
                        <span
                          className={`text-xs font-semibold ${
                            darkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          Notes
                        </span>

                        <textarea
                          rows="3"
                          placeholder="Add useful context (optional)"
                          className={`mt-2 resize-none ${inputClass}`}
                          {...register("notes")}
                        />
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
                      onClick={() => setModal(false)}
                      className={`rounded-xl border px-5 py-3 text-sm font-semibold ${
                        darkMode
                          ? "border-white/10 text-slate-300 hover:bg-white/5"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Cancel
                    </button>

                    <button
                      disabled={submitting}
                      className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
                    >
                      {submitting
                        ? "Saving..."
                        : isEditMode
                        ? "Update job"
                        : "Save job"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* AI JOB–RESUME MATCHER MODAL */}
        {/* ============================================================ */}

        <AnimatePresence>
          {showMatcherModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{
                  opacity: 0,
                  y: 14,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                className={`my-auto w-full max-w-2xl rounded-[26px] border p-6 shadow-2xl sm:p-8 ${
                  darkMode
                    ? "border-white/10 bg-[#11161e]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-500">
                      AI Job–Resume Matcher
                    </p>

                    <h2
                      className="mt-2 text-2xl font-bold tracking-tighter"
                      style={{
                        color: darkMode
                          ? "#d8b4fe"
                          : "#6b21a8",
                      }}
                    >
                      ✨ Match My Resume
                    </h2>

                    <p
                      className={`mt-1 text-sm ${
                        darkMode
                          ? "text-slate-500"
                          : "text-slate-500"
                      }`}
                    >
                      Paste a job description to see how
                      your resume aligns.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setShowMatcherModal(false)
                    }
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      darkMode
                        ? "text-slate-500 hover:bg-white/6 hover:text-white"
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>

                {!matcherResult ? (
                  <div className="mt-7 space-y-6">
                    <label className="block">
                      <span
                        className={`text-xs font-semibold ${
                          darkMode
                            ? "text-slate-300"
                            : "text-slate-700"
                        }`}
                      >
                        Company (optional)
                      </span>

                      <input
                        type="text"
                        placeholder="e.g. Google"
                        value={matcherCompany}
                        onChange={(e) =>
                          setMatcherCompany(
                            e.target.value
                          )
                        }
                        className={`mt-2 ${inputClass}`}
                        disabled={matcherLoading}
                      />
                    </label>

                    <label className="block">
                      <span
                        className={`text-xs font-semibold ${
                          darkMode
                            ? "text-slate-300"
                            : "text-slate-700"
                        }`}
                      >
                        Job Description{" "}
                        <span className="ml-1 text-violet-500">
                          *
                        </span>
                      </span>

                      <textarea
                        rows="6"
                        placeholder="Paste the complete job description here..."
                        value={matcherJobDesc}
                        onChange={(e) =>
                          setMatcherJobDesc(
                            e.target.value
                          )
                        }
                        className={`mt-2 resize-none ${inputClass}`}
                        disabled={matcherLoading}
                      />
                    </label>

                    <label className="block">
                      <span
                        className={`text-xs font-semibold ${
                          darkMode
                            ? "text-slate-300"
                            : "text-slate-700"
                        }`}
                      >
                        Select Resume{" "}
                        <span className="ml-1 text-violet-500">
                          *
                        </span>
                      </span>

                      <select
                        value={selectedResumeId}
                        onChange={(e) =>
                          setSelectedResumeId(
                            e.target.value
                          )
                        }
                        className={`mt-2 ${inputClass}`}
                        disabled={
                          matcherLoading ||
                          fetchingResumes
                        }
                      >
                        {fetchingResumes ? (
                          <option value="">
                            Loading resumes...
                          </option>
                        ) : resumesList.length === 0 ? (
                          <option value="">
                            No personal resumes found
                          </option>
                        ) : (
                          resumesList.map((r) => (
                            <option
                              key={r._id}
                              value={r._id}
                            >
                              {r.name}{" "}
                              {r.version
                                ? `(v${r.version})`
                                : ""}
                            </option>
                          ))
                        )}
                      </select>

                      {resumesList.length === 0 &&
                        !fetchingResumes && (
                          <p
                            className={`mt-1 text-xs ${
                              darkMode
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            You need to{" "}
                            <button
                              onClick={() => {
                                setShowMatcherModal(
                                  false
                                );
                              }}
                              className="text-violet-500 underline"
                            >
                              upload a personal resume
                            </button>{" "}
                            first.
                          </p>
                        )}
                    </label>

                    {matcherError && (
                      <div
                        className={`rounded-xl border p-4 ${
                          darkMode
                            ? "border-red-300/20 bg-red-400/10 text-red-300"
                            : "border-red-200 bg-red-50 text-red-600"
                        }`}
                      >
                        {matcherError}
                      </div>
                    )}

                    <div
                      className={`flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end ${
                        darkMode
                          ? "border-white/8"
                          : "border-slate-100"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setShowMatcherModal(false)
                        }
                        className={`rounded-xl border px-5 py-3 text-sm font-semibold ${
                          darkMode
                            ? "border-white/10 text-slate-300 hover:bg-white/5"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                        disabled={matcherLoading}
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleMatcherAnalyze}
                        disabled={
                          matcherLoading ||
                          !selectedResumeId ||
                          !matcherJobDesc.trim()
                        }
                        className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                      >
                        {matcherLoading ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles size={17} />
                            Analyze Match
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-7 space-y-6">
                    <div
                      className={`rounded-2xl border p-5 ${
                        darkMode
                          ? "border-white/10 bg-white/3"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative inline-flex items-center justify-center">
                          <svg className="h-24 w-24 -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke={
                                darkMode
                                  ? "#1e293b"
                                  : "#e2e8f0"
                              }
                              strokeWidth="6"
                              fill="none"
                            />

                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke="#8b5cf6"
                              strokeWidth="6"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${matcherResult.matchScore * 2.51} 251`}
                              className="transition-all duration-700"
                            />
                          </svg>

                          <div className="absolute text-center">
                            <span
                              className={`text-3xl font-bold ${
                                darkMode
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {matcherResult.matchScore}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              darkMode
                                ? "text-white"
                                : "text-slate-900"
                            }`}
                          >
                            {matcherResult.company
                              ? `${matcherResult.company}`
                              : "Job Match"}
                          </p>

                          <p
                            className={`text-xs ${
                              darkMode
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            Resume–Job Description Alignment
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3
                        className={`mb-2 font-semibold ${
                          darkMode
                            ? "text-white"
                            : "text-slate-900"
                        }`}
                      >
                        Strong Matches
                      </h3>

                      {matcherResult.strongMatches
                        ?.length > 0 ? (
                        <ul className="space-y-1">
                          {matcherResult.strongMatches.map(
                            (item, i) => (
                              <li
                                key={i}
                                className={`text-sm ${
                                  darkMode
                                    ? "text-slate-300"
                                    : "text-slate-700"
                                }`}
                              >
                                • {item}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p
                          className={`text-sm ${
                            darkMode
                              ? "text-slate-400"
                              : "text-slate-500"
                          }`}
                        >
                          No strong matches identified.
                        </p>
                      )}
                    </div>

                    <div>
                      <h3
                        className={`mb-2 font-semibold ${
                          darkMode
                            ? "text-white"
                            : "text-slate-900"
                        }`}
                      >
                        Missing / Weak Areas
                      </h3>

                      {matcherResult.weakAreas?.length >
                      0 ? (
                        <ul className="space-y-1">
                          {matcherResult.weakAreas.map(
                            (item, i) => (
                              <li
                                key={i}
                                className={`text-sm ${
                                  darkMode
                                    ? "text-slate-300"
                                    : "text-slate-700"
                                }`}
                              >
                                • {item}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p
                          className={`text-sm ${
                            darkMode
                              ? "text-slate-400"
                              : "text-slate-500"
                          }`}
                        >
                          No major gaps detected.
                        </p>
                      )}
                    </div>

                    <div>
                      <h3
                        className={`mb-2 font-semibold ${
                          darkMode
                            ? "text-white"
                            : "text-slate-900"
                        }`}
                      >
                        Resume Strengths
                      </h3>

                      {matcherResult.resumeStrengths
                        ?.length > 0 ? (
                        <ul className="space-y-1">
                          {matcherResult.resumeStrengths.map(
                            (item, i) => (
                              <li
                                key={i}
                                className={`text-sm ${
                                  darkMode
                                    ? "text-slate-300"
                                    : "text-slate-700"
                                }`}
                              >
                                • {item}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p
                          className={`text-sm ${
                            darkMode
                              ? "text-slate-400"
                              : "text-slate-500"
                          }`}
                        >
                          No strengths listed.
                        </p>
                      )}
                    </div>

                    <div>
                      <h3
                        className={`mb-2 font-semibold ${
                          darkMode
                            ? "text-white"
                            : "text-slate-900"
                        }`}
                      >
                        Recommendations
                      </h3>

                      {matcherResult.recommendations
                        ?.length > 0 ? (
                        <ul className="space-y-1">
                          {matcherResult.recommendations.map(
                            (item, i) => (
                              <li
                                key={i}
                                className={`text-sm ${
                                  darkMode
                                    ? "text-slate-300"
                                    : "text-slate-700"
                                }`}
                              >
                                {i + 1}. {item}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p
                          className={`text-sm ${
                            darkMode
                              ? "text-slate-400"
                              : "text-slate-500"
                          }`}
                        >
                          No specific recommendations.
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end border-t pt-5">
                      <button
                        onClick={() => {
                          setMatcherResult(null);
                          setMatcherError(null);
                        }}
                        className={`rounded-xl border px-5 py-2.5 text-sm font-semibold ${
                          darkMode
                            ? "border-white/10 text-slate-300 hover:bg-white/5"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Analyze Another Job
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default Jobs;
