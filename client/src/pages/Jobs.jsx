import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import {
  Plus,
  Search,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  X,
  Eye,
  Edit,
  Trash2,
  Archive,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Layers,
  Filter,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const statuses = [
  "All Statuses",
  "Wishlist",
  "Applied",
  "OA",
  "Interview",
  "HR",
  "Offer",
  "Rejected",
];

const statusColors = {
  Wishlist: "bg-slate-700 text-slate-200",
  Applied: "bg-blue-500/20 text-blue-400",
  OA: "bg-yellow-500/20 text-yellow-400",
  Interview: "bg-purple-500/20 text-purple-400",
  HR: "bg-cyan-500/20 text-cyan-400",
  Offer: "bg-green-500/20 text-green-400",
  Rejected: "bg-red-500/20 text-red-400",
};

const stages = [
  "Wishlist",
  "Applied",
  "OA",
  "Interview",
  "HR",
  "Offer",
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "company-asc", label: "Company A-Z" },
  { value: "company-desc", label: "Company Z-A" },
];

const JOBS_PER_PAGE = 10;

const Card = ({ children }) => {
  const { darkMode } = useTheme();
  return (
    <div className={`rounded-xl border p-5 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
      {children}
    </div>
  );
};

// Helper function to process jobs (filter + sort)
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

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "company-asc":
        return (a.company || "").localeCompare(b.company || "", undefined, {
          sensitivity: "base",
        });
      case "company-desc":
        return (b.company || "").localeCompare(a.company || "", undefined, {
          sensitivity: "base",
        });
      default:
        return 0;
    }
  });

  return sorted;
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

  const processedJobs = useMemo(() => {
    return processJobs(jobs, search, statusFilter, sortBy);
  }, [jobs, search, statusFilter, sortBy]);

  const processedArchivedJobs = useMemo(() => {
    return processJobs(archivedJobs, search, statusFilter, sortBy);
  }, [archivedJobs, search, statusFilter, sortBy]);

  const currentJobs = viewMode === "active" ? processedJobs : processedArchivedJobs;
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

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    return currentJobs.slice(startIndex, endIndex);
  }, [currentJobs, currentPage]);

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "All Statuses" || sortBy !== "newest";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All Statuses");
    setSortBy("newest");
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className={`rounded-lg p-2 ${
            currentPage === 1
              ? "cursor-not-allowed bg-slate-800 text-slate-600"
              : "bg-slate-800 text-white hover:bg-slate-700"
          }`}
        >
          <ChevronLeft size={18} />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`rounded-lg px-4 py-2 ${
              currentPage === page
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className={`rounded-lg p-2 ${
            currentPage === totalPages
              ? "cursor-not-allowed bg-slate-800 text-slate-600"
              : "bg-slate-800 text-white hover:bg-slate-700"
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    );
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

        const response = await api.put(`/jobs/${editingJob._id}`, payload);
        const updatedJob = response.data.job || response.data;

        setJobs((prev) =>
          prev.map((job) => (job._id === editingJob._id ? updatedJob : job))
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
          (isEditMode ? "Failed to update job" : "Failed to add job")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteJob = async (job) => {
    const confirmed = window.confirm("Are you sure you want to delete this job?");

    if (!confirmed) return;

    if (!job?._id) {
      alert("Invalid job selected");
      return;
    }

    try {
      setDeletingId(job._id);

      await api.delete(`/jobs/${job._id}`);

      setJobs((prev) => prev.filter((j) => j._id !== job._id));
      setArchivedJobs((prev) => prev.filter((j) => j._id !== job._id));

      alert("Job deleted successfully");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to delete job");
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

      setJobs((prev) => prev.filter((j) => j._id !== job._id));

      alert("Job archived successfully");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to archive job");
    } finally {
      setArchivingId(null);
    }
  };

  const restoreJob = async (job) => {
    const confirmed = window.confirm("Are you sure you want to restore this job?");

    if (!confirmed) return;

    if (!job?._id) {
      alert("Invalid job selected");
      return;
    }

    try {
      setRestoringId(job._id);

      const response = await api.patch(`/jobs/${job._id}/restore`);
      const restoredJob = response.data.job || response.data;

      setArchivedJobs((prev) => prev.filter((j) => j._id !== job._id));
      setJobs((prev) => [...prev, restoredJob]);

      alert("Job restored successfully");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to restore job");
    } finally {
      setRestoringId(null);
    }
  };

  const renderJobActions = (job, isArchived = false) => (
    <td className="flex gap-2 py-4">
      {!isArchived && (
        <>
          <button onClick={() => setSelectedJob(job)} className="text-slate-400 hover:text-white">
            <Eye size={17} />
          </button>
          <button onClick={() => openEditModal(job)} className="text-slate-400 hover:text-white">
            <Edit size={17} />
          </button>
          <button
            disabled={archivingId === job._id}
            onClick={() => archiveJob(job)}
            className="text-slate-400 hover:text-white"
          >
            <Archive size={17} />
          </button>
        </>
      )}
      {isArchived && (
        <button
          disabled={restoringId === job._id}
          onClick={() => restoreJob(job)}
          className="text-slate-400 hover:text-white"
        >
          <RotateCcw size={17} />
        </button>
      )}
      <button
        disabled={deletingId === job._id}
        onClick={() => deleteJob(job)}
        className="text-slate-400 hover:text-white"
      >
        <Trash2 size={17} />
      </button>
    </td>
  );

  const renderJobCard = (job, isArchived = false) => (
    <div key={job._id} className={`rounded-lg border p-4 ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
      <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{job.company}</h3>

      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{job.role}</p>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <MapPin size={14} className={darkMode ? 'text-slate-400' : 'text-gray-500'} />
        <span className={darkMode ? 'text-slate-400' : 'text-gray-500'}>{job.location}</span>
      </div>

      <span
        className={`mt-3 inline-block rounded-full px-3 py-1 text-xs ${statusColors[job.status]}`}
      >
        {job.status}
      </span>

      <div className="mt-3 flex gap-2">
        {!isArchived && (
          <>
            <button
              onClick={() => setSelectedJob(job)}
              className="text-slate-400 hover:text-white"
            >
              <Eye size={17} />
            </button>
            <button
              onClick={() => openEditModal(job)}
              className="text-slate-400 hover:text-white"
            >
              <Edit size={17} />
            </button>
            <button
              disabled={archivingId === job._id}
              onClick={() => archiveJob(job)}
              className="text-slate-400 hover:text-white"
            >
              <Archive size={17} />
            </button>
          </>
        )}
        {isArchived && (
          <button
            disabled={restoringId === job._id}
            onClick={() => restoreJob(job)}
            className="text-slate-400 hover:text-white"
          >
            <RotateCcw size={17} />
          </button>
        )}
        <button
          disabled={deletingId === job._id}
          onClick={() => deleteJob(job)}
          className="text-slate-400 hover:text-white"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (viewMode === "active") {
      if (loading) {
        return (
          <div className="py-16 text-center text-slate-400">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              <p>Loading your jobs...</p>
            </div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle size={48} className="text-red-400" />
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => fetchJobs()}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
        );
      }

      if (jobs.length === 0 && !hasActiveFilters) {
        return (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Briefcase size={48} className="text-slate-600" />
              <p className={`text-xl font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>No jobs yet</p>
              <p className="text-slate-400">
                Add your first job application to start tracking your placement journey.
              </p>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
              >
                <Plus size={16} />
                Add Your First Job
              </button>
            </div>
          </div>
        );
      }

      if (processedJobs.length === 0 && hasActiveFilters) {
        return (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Search size={48} className="text-slate-600" />
              <p className={`text-xl font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>No jobs found</p>
              <p className="text-slate-400">Try changing your search or filters.</p>
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
              >
                <X size={16} />
                Clear Filters
              </button>
            </div>
          </div>
        );
      }

      if (paginatedJobs.length > 0) {
        return (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  <tr>
                    <th className="pb-4">Company</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th>Package</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedJobs.map((job) => (
                    <tr key={job._id} className={`border-t ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                      <td className={`py-4 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{job.company}</td>
                      <td className={darkMode ? 'text-white' : 'text-slate-900'}>{job.role}</td>
                      <td className={darkMode ? 'text-white' : 'text-slate-900'}>{job.location}</td>
                      <td className={darkMode ? 'text-white' : 'text-slate-900'}>{job.package}</td>

                      <td>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${statusColors[job.status]}`}
                        >
                          {job.status}
                        </span>
                      </td>

                      {renderJobActions(job, false)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 md:hidden">
              {paginatedJobs.map((job) => renderJobCard(job, false))}
            </div>

            <div className={`mt-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Showing {paginatedJobs.length} of {totalJobs} job{totalJobs !== 1 ? "s" : ""}
            </div>

            {renderPagination()}
          </>
        );
      }

      return null;
    } else {
      if (archivedLoading) {
        return (
          <div className="py-16 text-center text-slate-400">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              <p>Loading archived jobs...</p>
            </div>
          </div>
        );
      }

      if (archivedError) {
        return (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle size={48} className="text-red-400" />
              <p className="text-red-400">{archivedError}</p>
              <button
                onClick={() => fetchArchivedJobs()}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
        );
      }

      if (archivedJobs.length === 0 && !hasActiveFilters) {
        return (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Layers size={48} className="text-slate-600" />
              <p className={`text-xl font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>No archived jobs</p>
              <p className="text-slate-400">Jobs you archive will appear here.</p>
            </div>
          </div>
        );
      }

      if (processedArchivedJobs.length === 0 && hasActiveFilters) {
        return (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Search size={48} className="text-slate-600" />
              <p className={`text-xl font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>No archived jobs found</p>
              <p className="text-slate-400">Try changing your search or filters.</p>
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
              >
                <X size={16} />
                Clear Filters
              </button>
            </div>
          </div>
        );
      }

      if (paginatedJobs.length > 0) {
        return (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  <tr>
                    <th className="pb-4">Company</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th>Package</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedJobs.map((job) => (
                    <tr key={job._id} className={`border-t ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                      <td className={`py-4 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{job.company}</td>
                      <td className={darkMode ? 'text-white' : 'text-slate-900'}>{job.role}</td>
                      <td className={darkMode ? 'text-white' : 'text-slate-900'}>{job.location}</td>
                      <td className={darkMode ? 'text-white' : 'text-slate-900'}>{job.package}</td>

                      <td>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${statusColors[job.status]}`}
                        >
                          {job.status}
                        </span>
                      </td>

                      {renderJobActions(job, true)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 md:hidden">
              {paginatedJobs.map((job) => renderJobCard(job, true))}
            </div>

            <div className={`mt-4 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Showing {paginatedJobs.length} of {totalJobs} archived job{totalJobs !== 1 ? "s" : ""}
            </div>

            {renderPagination()}
          </>
        );
      }

      return null;
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
          <h1 className="text-3xl font-bold">Job Applications</h1>
          <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Track every opportunity from wishlist to offer.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode("active")}
            className={`flex items-center gap-2 rounded-lg px-5 py-3 ${
              viewMode === "active"
                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                : darkMode
                ? "bg-slate-800 hover:bg-slate-700 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-slate-900"
            }`}
          >
            <Briefcase size={18} />
            Active Jobs
          </button>
          <button
            onClick={() => setViewMode("archived")}
            className={`flex items-center gap-2 rounded-lg px-5 py-3 ${
              viewMode === "archived"
                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                : darkMode
                ? "bg-slate-800 hover:bg-slate-700 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-slate-900"
            }`}
          >
            <Layers size={18} />
            Archived Jobs
          </button>
          {viewMode === "active" && !loading && !error && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 hover:bg-indigo-500 text-white"
            >
              <Plus size={18} />
              Add Job
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Applications", jobs.length, Briefcase],
          ["Wishlist", jobs.filter((j) => j.status === "Wishlist").length, Archive],
          ["Interviews", jobs.filter((j) => j.status === "Interview").length, Calendar],
          ["Offers", jobs.filter((j) => j.status === "Offer").length, DollarSign],
        ].map(([title, value, Icon]) => (
          <Card key={title}>
            <Icon className={`${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
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
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className={`flex flex-1 items-center gap-2 rounded-lg border px-3 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-gray-300 bg-white'}`}>
            <Search size={18} className={darkMode ? 'text-slate-400' : 'text-gray-400'} />
            <input
              placeholder="Search companies, roles, location..."
              className={`w-full bg-transparent py-3 outline-none ${darkMode ? 'text-white' : 'text-slate-900'}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading || error}
            />
            {search && (
              <button onClick={() => setSearch("")} className={darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-slate-900'}>
                <X size={16} />
              </button>
            )}
          </div>

          <select
            className={`rounded-lg border px-4 py-3 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={loading || error}
          >
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>

          <select
            className={`rounded-lg border px-4 py-3 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            disabled={loading || error}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && !loading && !error && (
            <button
              onClick={clearFilters}
              className={`flex items-center gap-2 rounded-lg px-4 py-3 ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>

        {hasActiveFilters && !loading && !error && (
          <div className={`mt-3 flex flex-wrap items-center gap-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            <Filter size={14} />
            <span>Active filters:</span>
            {search && (
              <span className={`rounded px-2 py-1 ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
                Search: "{search}"
              </span>
            )}
            {statusFilter !== "All Statuses" && (
              <span className={`rounded px-2 py-1 ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
                Status: {statusFilter}
              </span>
            )}
            {sortBy !== "newest" && (
              <span className={`rounded px-2 py-1 ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
                Sort: {sortOptions.find((o) => o.value === sortBy)?.label}
              </span>
            )}
          </div>
        )}
      </Card>

      <Card>{renderContent()}</Card>

      {selectedJob && (
        <Card>
          <h2 className={`mb-4 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{selectedJob.company} Progress</h2>

          <div className="flex flex-wrap gap-3">
            {stages.map((stage) => (
              <span
                key={stage}
                className={`rounded-full px-4 py-2 text-sm ${
                  stages.indexOf(stage) <= stages.indexOf(selectedJob.status)
                    ? "bg-indigo-600 text-white"
                    : darkMode
                    ? "bg-slate-800 text-white"
                    : "bg-gray-200 text-slate-900"
                }`}
              >
                {stage}
              </span>
            ))}
          </div>
        </Card>
      )}

      {modal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4 z-50">
          <div className={`w-full max-w-lg rounded-xl border p-6 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="mb-5 flex justify-between">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {isEditMode ? "Edit Job" : "Add Job"}
              </h2>

              <button onClick={() => setModal(false)} className={darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-slate-900'}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit(saveJob)} className="space-y-3">
              {[
                ["company", true],
                ["role", true],
                ["location", false],
                ["package", false],
                ["appliedDate", false],
                ["jobLink", false],
                ["notes", false],
              ].map(([field, required]) => (
                <input
                  key={field}
                  placeholder={required ? field : `${field} (optional)`}
                  className={`w-full rounded-lg border px-3 py-2 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  {...register(field, {
                    required: required ? `${field} is required` : false,
                  })}
                />
              ))}

              <select
                className={`w-full rounded-lg border px-3 py-2 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                {...register("referral", {
                  setValueAs: (value) => value === "true",
                })}
              >
                <option value="">Referral (optional)</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>

              <select
                className={`w-full rounded-lg border px-3 py-2 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                {...register("status", {
                  required: "status is required",
                })}
              >
                <option value="">Select Status</option>

                {statuses.slice(1).map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>

              <button
                disabled={submitting}
                className="w-full rounded-lg bg-indigo-600 py-3 text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {submitting ? "Saving..." : isEditMode ? "Update Job" : "Save Job"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;