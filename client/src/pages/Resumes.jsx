import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Download,
  Eye,
  Edit,
  X,
  Tag,
  Clock3,
  Archive,
  Trash2,
  Sparkles,
} from "lucide-react";

import api from "../services/api";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

const availableTags = [
  "Frontend",
  "Backend",
  "Full Stack",
  "MERN",
  "Java",
  "General",
];

/* -------------------------------------------------------------------------- */
/* UI COMPONENTS                                                              */
/* -------------------------------------------------------------------------- */

const Frame = ({ children, className = "" }) => {
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

const Action = ({
  label,
  onClick,
  disabled = false,
  children,
  primary = false,
  danger = false,
}) => {
  const { darkMode } = useTheme();

  let colors;

  if (primary) {
    colors =
      "border-sky-600 bg-sky-600 text-white shadow-[0_8px_20px_rgba(14,116,144,0.18)] hover:-translate-y-0.5 hover:bg-sky-500";
  } else if (danger) {
    colors = darkMode
      ? "border-red-300/10 text-red-300/70 hover:bg-red-400/10"
      : "border-red-100 text-red-500 hover:bg-red-50";
  } else {
    colors = darkMode
      ? "border-white/10 text-slate-300 hover:border-sky-300/30 hover:bg-sky-400/10 hover:text-sky-300"
      : "border-slate-200 text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700";
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-45 ${colors}`}
    >
      {children}
    </button>
  );
};

const TagChip = ({ tag, selected, onClick }) => {
  const { darkMode } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
        selected
          ? "border-sky-600 bg-sky-600 text-white"
          : darkMode
          ? "border-white/10 bg-white/4 text-slate-400 hover:border-sky-300/30 hover:text-sky-300"
          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-sky-200 hover:text-sky-700"
      }`}
    >
      {tag}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

const Resumes = () => {
  const { darkMode } = useTheme();

  /* ------------------------------------------------------------------------ */
  /* STATE                                                                    */
  /* ------------------------------------------------------------------------ */

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [archivingId, setArchivingId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [resumeType, setResumeType] = useState("mine");
  const [personName, setPersonName] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const [showUploadModal, setShowUploadModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResume, setEditingResume] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPersonName, setEditPersonName] = useState("");
  const [editTags, setEditTags] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* AI ANALYSIS STATE                                                        */
  /* ------------------------------------------------------------------------ */

  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysisResume, setAnalysisResume] = useState(null);

  const [activeTab, setActiveTab] = useState("mine");

  /* ------------------------------------------------------------------------ */
  /* AI ANALYSIS                                                              */
  /* ------------------------------------------------------------------------ */

  const handleAnalyze = async (resume) => {
    const resumeId = getResumeId(resume);

    if (!resumeId || analyzingId === resumeId) return;

    if (resume.resumeType !== "mine") {
      toast.error("Only your personal resumes can be analyzed.");
      return;
    }

    setAnalyzingId(resumeId);

    try {
      const response = await api.post(
        `/resumes/${resumeId}/analyze`
      );

      if (response.data?.analysis) {
        setAnalysisResume({
          ...resume,
          aiAnalysis: response.data.analysis,
        });

        toast.success(
          response.data.cached
            ? "Showing saved AI analysis."
            : "Resume analyzed successfully."
        );
      }
    } catch (error) {
      console.error("Resume analysis error:", error);

      const message =
        error.response?.data?.message ||
        "Failed to analyze resume.";

      toast.error(message);
    } finally {
      setAnalyzingId(null);
    }
  };

  /*
   * IMPORTANT:
   *
   * We keep the preview as ONE object instead of separately doing:
   *
   * setDocumentPreviewUrl(null)
   * setDocumentPreviewLoading(true)
   *
   * inside useEffect.
   *
   * This avoids the React "setState synchronously in effect" warning.
   */
  const [documentPreview, setDocumentPreview] = useState({
    resumeId: null,
    url: null,
  });

  /* ------------------------------------------------------------------------ */
  /* FETCH RESUMES                                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    const fetchResumes = async () => {
      try {
        const { data } = await api.get("/resumes");

        if (mounted) {
          setResumes(data?.resumes || data || []);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching resumes:", error);

        if (mounted) {
          toast.error("Failed to load resumes");
          setLoading(false);
        }
      }
    };

    fetchResumes();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshResumes = async () => {
    try {
      const { data } = await api.get("/resumes");
      setResumes(data?.resumes || data || []);
    } catch (error) {
      console.error("Error refreshing resumes:", error);
      toast.error("Failed to refresh resumes");
    }
  };

  /* ------------------------------------------------------------------------ */
  /* FILE HELPERS                                                             */
  /* ------------------------------------------------------------------------ */

  const getResumeId = (resume) => {
    return resume?._id || resume?.id || null;
  };

  const removeExtension = (filename = "") => {
    return filename.replace(/\.[^/.]+$/, "");
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(1)) +
      " " +
      sizes[i]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /* ------------------------------------------------------------------------ */
  /* INLINE PDF PREVIEW                                                       */
  /* ------------------------------------------------------------------------ */

  const filteredResumes = resumes.filter((resume) => {
    if (activeTab === "archived") {
      return resume.isArchived === true;
    }

    return (
      resume.resumeType === activeTab &&
      resume.isArchived !== true
    );
  });

  const activeResume =
    filteredResumes.find((resume) => resume.isActive) || null;

  const latestResume =
    filteredResumes.length > 0 ? filteredResumes[0] : null;

  const visibleResume = activeResume || latestResume;

  const visibleResumeId = getResumeId(visibleResume);

  /*
   * THIS IS THE IMPORTANT FIX.
   *
   * There is NO:
   *
   * setDocumentPreviewLoading(true)
   * setDocumentPreviewUrl(null)
   *
   * at the beginning of the effect.
   *
   * The loading state is derived instead.
   */
  const documentPreviewLoading =
    Boolean(visibleResumeId) &&
    documentPreview.resumeId !== visibleResumeId;

  const documentPreviewUrl =
    documentPreview.resumeId === visibleResumeId
      ? documentPreview.url
      : null;

  useEffect(() => {
    let cancelled = false;

    if (!visibleResumeId) {
      return () => {
        cancelled = true;
      };
    }

    const loadPreview = async () => {
      try {
        const response = await api.get(
          `/resumes/${visibleResumeId}/preview`
        );

        if (!cancelled) {
          setDocumentPreview({
            resumeId: visibleResumeId,
            url: response.data?.url || null,
          });
        }
      } catch (error) {
        console.error("Inline preview error:", error);

        if (!cancelled) {
          setDocumentPreview({
            resumeId: visibleResumeId,
            url: null,
          });
        }
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [visibleResumeId]);

  /* ------------------------------------------------------------------------ */
  /* FILE SELECT                                                              */
  /* ------------------------------------------------------------------------ */

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setResumeName(removeExtension(file.name));
    setResumeType("mine");
    setPersonName("");
    setSelectedTags([]);
    setShowUploadModal(true);

    event.target.value = "";
  };

  /* ------------------------------------------------------------------------ */
  /* UPLOAD                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF resume.");
      return;
    }

    if (resumeType === "other" && !personName.trim()) {
      toast.error("Please enter the person's name.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("resumeFile", selectedFile);
      formData.append(
        "name",
        resumeName.trim() || removeExtension(selectedFile.name)
      );
      formData.append("resumeType", resumeType);

      if (resumeType === "other") {
        formData.append("personName", personName.trim());
      }

      if (selectedTags.length > 0) {
        formData.append("tags", JSON.stringify(selectedTags));
      }

      const response = await api.post("/resumes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        response.data?.message || "Resume uploaded successfully."
      );

      setSelectedFile(null);
      setResumeName("");
      setResumeType("mine");
      setPersonName("");
      setSelectedTags([]);
      setShowUploadModal(false);

      await refreshResumes();
    } catch (error) {
      console.error("Upload error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to upload resume."
      );
    } finally {
      setUploading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* PREVIEW                                                                  */
  /* ------------------------------------------------------------------------ */

  const handlePreview = async (resumeId) => {
    if (!resumeId || previewing) return;

    setPreviewing(true);

    try {
      const response = await api.get(
        `/resumes/${resumeId}/preview`
      );

      if (response.data?.url) {
        window.open(
          response.data.url,
          "_blank",
          "noopener,noreferrer"
        );
      } else {
        toast.error("No preview URL available.");
      }
    } catch (error) {
      console.error("Preview error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to preview resume."
      );
    } finally {
      setPreviewing(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* DOWNLOAD                                                                 */
  /* ------------------------------------------------------------------------ */

  const handleDownload = async (resumeId, name) => {
    if (!resumeId || downloadingId === resumeId) return;

    setDownloadingId(resumeId);

    try {
      const response = await api.get(
        `/resumes/${resumeId}/download`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `${name || "resume"}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      toast.success("Resume downloaded successfully.");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download resume.");
    } finally {
      setDownloadingId(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* DELETE                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleDelete = async (resumeId) => {
    if (!resumeId || deletingId === resumeId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?"
    );

    if (!confirmed) return;

    setDeletingId(resumeId);

    try {
      await api.delete(`/resumes/${resumeId}`);

      toast.success("Resume deleted successfully.");

      await refreshResumes();

      /*
       * Don't call setDocumentPreviewUrl(null) here.
       *
       * The preview automatically disappears because visibleResumeId
       * changes and documentPreview.resumeId no longer matches it.
       */
    } catch (error) {
      console.error("Delete error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to delete resume."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* ARCHIVE                                                                  */
  /* ------------------------------------------------------------------------ */

  const handleArchiveToggle = async (
    resumeId,
    isArchived
  ) => {
    if (!resumeId || archivingId === resumeId) return;

    setArchivingId(resumeId);

    try {
      const response = await api.patch(
        `/resumes/${resumeId}/archive`
      );

      const updatedResume = response.data?.resume;

      toast.success(
        isArchived
          ? "Resume unarchived successfully."
          : "Resume archived successfully."
      );

      if (updatedResume) {
        setResumes((prev) =>
          prev.map((resume) =>
            getResumeId(resume) === resumeId
              ? {
                  ...resume,
                  isArchived:
                    updatedResume.isArchived,
                }
              : resume
          )
        );
      } else {
        await refreshResumes();
      }
    } catch (error) {
      console.error("Archive toggle error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to update resume."
      );
    } finally {
      setArchivingId(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* EDIT                                                                     */
  /* ------------------------------------------------------------------------ */

  const handleEditClick = (resume) => {
    setEditingResume(resume);
    setEditName(resume.name || "");
    setEditPersonName(resume.personName || "");
    setEditTags(resume.tags || []);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editingResume) return;

    if (!editName.trim()) {
      toast.error("Resume name is required.");
      return;
    }

    if (
      editingResume.resumeType === "other" &&
      !editPersonName.trim()
    ) {
      toast.error("Person name is required.");
      return;
    }

    setIsSaving(true);

    try {
      const resumeId = getResumeId(editingResume);

      const payload = {
        name: editName.trim(),
        personName: editPersonName.trim(),
        tags: editTags,
      };

      await api.put(`/resumes/${resumeId}`, payload);

      toast.success("Resume updated successfully.");

      closeEdit();

      await refreshResumes();
    } catch (error) {
      console.error("Edit error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to update resume."
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* TAGS                                                                     */
  /* ------------------------------------------------------------------------ */

  const toggleTag = (tag) => {
    setSelectedTags((previous) =>
      previous.includes(tag)
        ? previous.filter((item) => item !== tag)
        : [...previous, tag]
    );
  };

  const toggleEditTag = (tag) => {
    setEditTags((previous) =>
      previous.includes(tag)
        ? previous.filter((item) => item !== tag)
        : [...previous, tag]
    );
  };

  /* ------------------------------------------------------------------------ */
  /* MODAL CLOSE                                                              */
  /* ------------------------------------------------------------------------ */

  const closeUpload = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setResumeName("");
    setResumeType("mine");
    setPersonName("");
    setSelectedTags([]);
  };

  const closeEdit = () => {
    setShowEditModal(false);
    setEditingResume(null);
    setEditName("");
    setEditPersonName("");
    setEditTags([]);
  };

  /* ------------------------------------------------------------------------ */
  /* COUNTS                                                                   */
  /* ------------------------------------------------------------------------ */

  const mineCount = resumes.filter(
    (resume) =>
      resume.resumeType === "mine" &&
      !resume.isArchived
  ).length;

  const otherCount = resumes.filter(
    (resume) =>
      resume.resumeType === "other" &&
      !resume.isArchived
  ).length;

  const archivedCount = resumes.filter(
    (resume) => resume.isArchived === true
  ).length;

  /* ------------------------------------------------------------------------ */
  /* CLASSES                                                                  */
  /* ------------------------------------------------------------------------ */

  const inputClass = `w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all focus:ring-4 ${
    darkMode
      ? "border-white/10 bg-white/[0.035] text-white placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-sky-400/10"
      : "border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-sky-500/10"
  }`;

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <main
      className={`min-h-screen px-4 py-5 sm:px-6 sm:py-8 lg:px-10 ${
        darkMode
          ? "bg-[#080a0f] text-white"
          : "bg-[#f4f6f8] text-slate-900"
      }`}
    >
      <div className="mx-auto max-w-345">

        {/* HEADER */}

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
              <FileText size={14} />
              DevPilot / Professional identity
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">
              Resume workspace
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Keep the version that represents your next move
              close, clear, and ready.
            </p>
          </div>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(14,116,144,0.18)] transition-all hover:-translate-y-0.5 hover:bg-sky-500">
            <Upload size={16} />
            Upload resume

            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </motion.header>

        {/* COUNTS */}

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="border-l-2 border-sky-500 px-4 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              My resumes
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {mineCount}
            </p>
          </div>

          <div className="border-l-2 border-slate-300 px-4 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Other resumes
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {otherCount}
            </p>
          </div>

          <div className="border-l-2 border-amber-400 px-4 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Archived
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {archivedCount}
            </p>
          </div>
        </div>

        {/* TABS */}

        <div
          className={`mt-8 flex items-center gap-1 overflow-x-auto border-b ${
            darkMode
              ? "border-white/8"
              : "border-slate-200"
          }`}
        >
          {[
            ["mine", "My resumes", mineCount],
            ["other", "Other resumes", otherCount],
            ["archived", "Archived", archivedCount],
          ].map(([tab, label, count]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? "border-sky-600 text-sky-600"
                  : `border-transparent ${
                      darkMode
                        ? "text-slate-500 hover:text-white"
                        : "text-slate-500 hover:text-slate-900"
                    }`
              }`}
            >
              {label}
              <span className="ml-1 text-xs opacity-60">
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* MAIN GRID */}

        <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1.18fr)_340px]">

          {/* CURRENT RESUME */}

          <section
            className={`relative min-h-107.5 overflow-hidden rounded-[28px] border ${
              darkMode
                ? "border-white/8 bg-[#141a24]"
                : "border-slate-200 bg-white"
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 ${
                activeResume
                  ? "bg-sky-600"
                  : "bg-slate-300"
              }`}
            />

            <div className="relative p-6 sm:p-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Current document
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.06em]">
                    {visibleResume
                      ? visibleResume.name
                      : "Your professional identity"}
                  </h2>
                </div>

                {visibleResume && (
                  <span className="rounded-lg bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-600">
                    {visibleResume.isActive
                      ? "Active version"
                      : "Latest version"}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex min-h-70 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
                </div>
              ) : visibleResume ? (
                <div className="mt-8 grid gap-8 md:grid-cols-[180px_1fr] md:items-center">

                  {/* INLINE PDF */}

                  <motion.button
                    type="button"
                    onClick={() =>
                      handlePreview(visibleResumeId)
                    }
                    disabled={
                      previewing ||
                      documentPreviewLoading
                    }
                    initial={{
                      opacity: 0,
                      rotate: -2,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      rotate: 0,
                      y: 0,
                    }}
                    whileHover={{
                      y: -5,
                      rotate: 1,
                    }}
                    whileTap={{
                      scale: 0.985,
                    }}
                    className={`relative mx-auto h-57.5 w-43 shrink-0 overflow-hidden rounded-sm border text-left shadow-[12px_16px_35px_rgba(15,23,42,0.18)] outline-none transition-shadow hover:shadow-[16px_22px_42px_rgba(15,23,42,0.25)] focus-visible:ring-4 focus-visible:ring-sky-500/30 md:mx-0 ${
                      darkMode
                        ? "border-white/15 bg-white text-slate-800"
                        : "border-slate-200 bg-white text-slate-800"
                    }`}
                    aria-label="Open resume preview"
                  >
                    {documentPreviewUrl ? (
                      <iframe
                        title={`${visibleResume.name} preview`}
                        src={`${documentPreviewUrl}#page=1&view=FitH`}
                        className="pointer-events-none h-full w-full bg-white"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
                        <div className="h-1 w-12 bg-sky-600" />

                        {documentPreviewLoading ? (
                          <>
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />

                            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                              Loading PDF
                            </span>
                          </>
                        ) : (
                          <>
                            <FileText
                              size={28}
                              className="text-sky-600"
                            />

                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                              Open PDF preview
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </motion.button>

                  {/* DETAILS */}

                  <div>
                    <div className="flex flex-wrap gap-2">
                      {visibleResume.tags?.map((tag) => (
                        <span
                          key={tag}
                          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                            darkMode
                              ? "border-white/10 text-slate-400"
                              : "border-slate-200 text-slate-500"
                          }`}
                        >
                          <Tag size={11} />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <dl
                      className={`mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-y py-5 text-sm ${
                        darkMode
                          ? "border-white/8"
                          : "border-slate-100"
                      }`}
                    >
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Version
                        </dt>
                        <dd className="mt-1.5 font-semibold">
                          v{visibleResume.version || 1}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          File size
                        </dt>
                        <dd className="mt-1.5 font-semibold">
                          {formatFileSize(
                            visibleResume.fileSize
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Updated
                        </dt>
                        <dd className="mt-1.5 font-semibold">
                          {formatDate(
                            visibleResume.updatedAt
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Type
                        </dt>
                        <dd className="mt-1.5 font-semibold">
                          {visibleResume.resumeType ===
                          "other"
                            ? visibleResume.personName ||
                              "Other"
                            : "My resume"}
                        </dd>
                      </div>
                    </dl>

                    {/* ACTIONS */}

                    <div className="mt-6 flex flex-wrap gap-2">
                      {visibleResume.resumeType === "mine" && (
                        <Action
                          label={
                            analyzingId === visibleResumeId
                              ? "Analyzing resume"
                              : visibleResume.aiAnalysis?.score != null
                              ? "View AI analysis"
                              : "Analyze resume with AI"
                          }
                          onClick={() =>
                            handleAnalyze(visibleResume)
                          }
                          disabled={
                            analyzingId === visibleResumeId
                          }
                        >
                          <Sparkles
                            size={14}
                            className={
                              analyzingId === visibleResumeId
                                ? "animate-pulse"
                                : ""
                            }
                          />

                          {analyzingId === visibleResumeId
                            ? "Analyzing..."
                            : visibleResume.aiAnalysis?.score != null
                            ? "View AI Analysis"
                            : "Analyze with AI"}
                        </Action>
                      )}

                      <Action
                        label="Preview resume"
                        onClick={() =>
                          handlePreview(visibleResumeId)
                        }
                        disabled={previewing}
                      >
                        <Eye size={14} />
                        Preview
                      </Action>

                      <Action
                        label="Download resume"
                        onClick={() =>
                          handleDownload(
                            visibleResumeId,
                            visibleResume.name
                          )
                        }
                        disabled={
                          downloadingId === visibleResumeId
                        }
                      >
                        <Download size={14} />
                        Download
                      </Action>

                      <Action
                        label="Edit resume"
                        onClick={() =>
                          handleEditClick(visibleResume)
                        }
                      >
                        <Edit size={14} />
                        Edit
                      </Action>

                      <Action
                        label={
                          visibleResume.isArchived
                            ? "Unarchive resume"
                            : "Archive resume"
                        }
                        onClick={() =>
                          handleArchiveToggle(
                            visibleResumeId,
                            visibleResume.isArchived
                          )
                        }
                        disabled={
                          archivingId === visibleResumeId
                        }
                      >
                        <Archive size={14} />
                        {visibleResume.isArchived
                          ? "Unarchive"
                          : "Archive"}
                      </Action>

                      <Action
                        label="Delete resume"
                        danger
                        onClick={() =>
                          handleDelete(visibleResumeId)
                        }
                        disabled={
                          deletingId === visibleResumeId
                        }
                      >
                        <Trash2 size={14} />
                        Delete
                      </Action>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  className={`mt-10 flex min-h-67.5 cursor-pointer flex-col items-center justify-center border border-dashed text-center transition-colors ${
                    darkMode
                      ? "border-white/15 hover:border-sky-300/50 hover:bg-white/2.5"
                      : "border-slate-300 hover:border-sky-400 hover:bg-sky-50/40"
                  }`}
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                      darkMode
                        ? "bg-sky-400/10 text-sky-300"
                        : "bg-sky-50 text-sky-600"
                    }`}
                  >
                    <Upload size={24} />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    Place your next version here.
                  </h3>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                    {activeTab === "archived"
                      ? "Archived documents will appear here."
                      : activeTab === "other"
                      ? "Upload a resume you want to keep on hand."
                      : "Upload a PDF to make your professional identity easy to find."}
                  </p>

                  <span className="mt-5 text-sm font-semibold text-sky-600">
                    Browse PDF files
                  </span>

                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              )}
            </div>
          </section>

          {/* SIDEBAR */}

          <aside className="space-y-7">

            {/* VERSION HISTORY */}

            <Frame className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                    Library
                  </p>

                  <h2 className="mt-2 text-xl font-semibold tracking-tighter">
                    Version history
                  </h2>
                </div>

                <Clock3
                  size={18}
                  className="text-slate-400"
                />
              </div>

              <div
                className={`mt-6 space-y-1 border-l ${
                  darkMode
                    ? "border-white/10"
                    : "border-slate-200"
                }`}
              >
                {loading ? (
                  <p className="pl-4 text-sm text-slate-500">
                    Loading resumes...
                  </p>
                ) : filteredResumes.length > 0 ? (
                  filteredResumes
                    .slice(0, 5)
                    .map((resume) => {
                      const id = getResumeId(resume);

                      return (
                        <motion.div
                          whileHover={{ x: 4 }}
                          key={id}
                          className={`relative border-b py-3 pl-4 last:border-b-0 ${
                            darkMode
                              ? "border-white/6"
                              : "border-slate-100"
                          }`}
                        >
                          <span
                            className={`absolute -left-1.25 top-4 h-2 w-2 rounded-full ${
                              resume.isActive &&
                              !resume.isArchived
                                ? "bg-sky-600"
                                : darkMode
                                ? "bg-slate-700"
                                : "bg-slate-300"
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              handleEditClick(resume)
                            }
                            className="w-full text-left"
                          >
                            <p
                              className={`truncate text-sm font-semibold ${
                                darkMode
                                  ? "text-slate-300"
                                  : "text-slate-700"
                              }`}
                            >
                              {resume.name}
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                              v{resume.version || 1} ·{" "}
                              {formatDate(resume.createdAt)}
                            </p>
                          </button>

                          <div className="mt-2 flex flex-wrap gap-1">
                            {resume.resumeType === "mine" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleAnalyze(resume)
                                }
                                disabled={
                                  analyzingId === id
                                }
                                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                                  darkMode
                                    ? "text-violet-300 hover:bg-violet-400/10"
                                    : "text-violet-700 hover:bg-violet-50"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                                title={
                                  analyzingId === id
                                    ? "Analyzing..."
                                    : resume.aiAnalysis?.score != null
                                    ? "View AI Analysis"
                                    : "Analyze with AI"
                                }
                              >
                                <Sparkles
                                  size={13}
                                  className={
                                    analyzingId === id
                                      ? "animate-pulse"
                                      : ""
                                  }
                                />

                                {analyzingId === id
                                  ? "Analyzing..."
                                  : resume.aiAnalysis?.score != null
                                  ? "AI Analysis"
                                  : "Analyze"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleArchiveToggle(
                                  id,
                                  resume.isArchived
                                )
                              }
                              disabled={
                                archivingId === id
                              }
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sky-600 dark:hover:bg-white/10"
                              title={
                                resume.isArchived
                                  ? "Unarchive"
                                  : "Archive"
                              }
                            >
                              <Archive size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(id)
                              }
                              disabled={
                                deletingId === id
                              }
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-400/10"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                ) : (
                  <p className="pl-4 text-sm text-slate-500">
                    No versions in this view.
                  </p>
                )}
              </div>
            </Frame>

            {/* TAGS */}

            <Frame className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-white/5 text-sky-300"
                      : "bg-sky-50 text-sky-600"
                  }`}
                >
                  <Tag size={16} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600">
                    Organize
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    Resume tags
                  </h2>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Choose the focus areas that describe the
                document you are about to upload.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    selected={selectedTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </Frame>
          </aside>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* UPLOAD MODAL                                                       */}
        {/* ------------------------------------------------------------------ */}

        <AnimatePresence>
          {showUploadModal && selectedFile && (
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
                className={`my-auto w-full max-w-xl rounded-[26px] border p-6 shadow-2xl sm:p-8 ${
                  darkMode
                    ? "border-white/10 bg-[#11161e]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                      New document
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold">
                      Upload resume
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Give this version a clear identity before
                      it enters your library.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeUpload}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/6"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div
                  className={`mt-7 flex items-center gap-3 border p-4 ${
                    darkMode
                      ? "border-white/8 bg-white/3"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white">
                    <FileText size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatFileSize(selectedFile.size)} · PDF
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">

                  <label className="block">
                    <span className="text-xs font-semibold">
                      Resume name
                    </span>

                    <input
                      type="text"
                      value={resumeName}
                      onChange={(e) =>
                        setResumeName(e.target.value)
                      }
                      placeholder="e.g. Frontend Engineer — 2026"
                      className={`mt-2 ${inputClass}`}
                    />
                  </label>

                  <div>
                    <p className="text-xs font-semibold">
                      Document owner
                    </p>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className="flex cursor-pointer items-center gap-2 border p-3 text-sm">
                        <input
                          type="radio"
                          name="resumeType"
                          value="mine"
                          checked={
                            resumeType === "mine"
                          }
                          onChange={(e) => {
                            setResumeType(
                              e.target.value
                            );
                            setPersonName("");
                          }}
                          className="accent-sky-600"
                        />
                        My resume
                      </label>

                      <label className="flex cursor-pointer items-center gap-2 border p-3 text-sm">
                        <input
                          type="radio"
                          name="resumeType"
                          value="other"
                          checked={
                            resumeType === "other"
                          }
                          onChange={(e) =>
                            setResumeType(
                              e.target.value
                            )
                          }
                          className="accent-sky-600"
                        />
                        Other resume
                      </label>
                    </div>
                  </div>

                  {resumeType === "other" && (
                    <label className="block">
                      <span className="text-xs font-semibold">
                        Person name
                      </span>

                      <input
                        type="text"
                        value={personName}
                        onChange={(e) =>
                          setPersonName(e.target.value)
                        }
                        placeholder="Whose resume is this?"
                        className={`mt-2 ${inputClass}`}
                      />
                    </label>
                  )}

                  <div>
                    <p className="text-xs font-semibold">
                      Tags
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <TagChip
                          key={tag}
                          tag={tag}
                          selected={selectedTags.includes(
                            tag
                          )}
                          onClick={() =>
                            toggleTag(tag)
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeUpload}
                    className="rounded-xl border px-5 py-3 text-sm font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                  >
                    {uploading
                      ? "Uploading..."
                      : "Upload resume"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------------------------------------------------------ */}
        {/* EDIT MODAL                                                         */}
        {/* ------------------------------------------------------------------ */}

        <AnimatePresence>
          {showEditModal && editingResume && (
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
                className={`my-auto w-full max-w-xl rounded-[26px] border p-6 shadow-2xl sm:p-8 ${
                  darkMode
                    ? "border-white/10 bg-[#11161e]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                      Document details
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold">
                      Edit resume
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={closeEdit}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/6"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-7 space-y-5">
                  <label className="block">
                    <span className="text-xs font-semibold">
                      Resume name
                    </span>

                    <input
                      type="text"
                      value={editName}
                      onChange={(e) =>
                        setEditName(e.target.value)
                      }
                      placeholder="Enter resume name"
                      className={`mt-2 ${inputClass}`}
                    />
                  </label>

                  {editingResume.resumeType === "other" && (
                    <label className="block">
                      <span className="text-xs font-semibold">
                        Person name
                      </span>

                      <input
                        type="text"
                        value={editPersonName}
                        onChange={(e) =>
                          setEditPersonName(e.target.value)
                        }
                        placeholder="Whose resume is this?"
                        className={`mt-2 ${inputClass}`}
                      />
                    </label>
                  )}

                  <div>
                    <p className="text-xs font-semibold">
                      Tags
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <TagChip
                          key={tag}
                          tag={tag}
                          selected={editTags.includes(tag)}
                          onClick={() =>
                            toggleEditTag(tag)
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="rounded-xl border px-5 py-3 text-sm font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleEditSave}
                    disabled={isSaving}
                    className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                  >
                    {isSaving
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------------------------------------------------------ */}
        {/* AI ANALYSIS MODAL                                                  */}
        {/* ------------------------------------------------------------------ */}

        <AnimatePresence>
          {analysisResume?.aiAnalysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
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
                exit={{
                  opacity: 0,
                  y: 10,
                  scale: 0.98,
                }}
                className={`max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border p-6 shadow-2xl ${
                  darkMode
                    ? "border-white/10 bg-[#11161e] text-white"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles
                        className="text-violet-400"
                        size={20}
                      />

                      <h2 className="text-xl font-bold">
                        AI Resume Analysis
                      </h2>
                    </div>

                    <p
                      className={`mt-1 text-sm ${
                        darkMode
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      {analysisResume.name}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setAnalysisResume(null)
                    }
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/5"
                    aria-label="Close AI analysis"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* SCORE */}

                <div
                  className={`mb-6 rounded-2xl border p-5 ${
                    darkMode
                      ? "border-white/10 bg-white/3"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-sm text-slate-400">
                    Resume Score
                  </p>

                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-5xl font-bold">
                      {analysisResume.aiAnalysis.score}
                    </span>

                    <span className="mb-2 text-slate-400">
                      / 100
                    </span>
                  </div>
                </div>

                {/* SUMMARY */}

                <section className="mb-6">
                  <h3 className="mb-2 font-semibold">
                    Overall Assessment
                  </h3>

                  <p
                    className={`text-sm leading-6 ${
                      darkMode
                        ? "text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    {analysisResume.aiAnalysis.summary}
                  </p>
                </section>

                {/* SKILLS */}

                <section className="mb-6">
                  <h3 className="mb-3 font-semibold">
                    Detected Skills
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {analysisResume.aiAnalysis.skills?.map(
                      (skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                            darkMode
                              ? "bg-sky-400/10 text-sky-300"
                              : "bg-sky-50 text-sky-700"
                          }`}
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </section>

                {/* STRENGTHS / WEAKNESSES */}

                <div className="grid gap-5 md:grid-cols-2">
                  <section>
                    <h3 className="mb-3 font-semibold">
                      Strengths
                    </h3>

                    <ul className="space-y-2">
                      {analysisResume.aiAnalysis.strengths?.map(
                        (item, index) => (
                          <li
                            key={index}
                            className={`text-sm leading-6 ${
                              darkMode
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            <span className="mr-2 text-emerald-500">
                              ✓
                            </span>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </section>

                  <section>
                    <h3 className="mb-3 font-semibold">
                      Areas to Improve
                    </h3>

                    <ul className="space-y-2">
                      {analysisResume.aiAnalysis.weaknesses?.map(
                        (item, index) => (
                          <li
                            key={index}
                            className={`text-sm leading-6 ${
                              darkMode
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            <span className="mr-2 text-amber-500">
                              ⚠
                            </span>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </section>
                </div>

                {/* SUGGESTIONS */}

                <section className="mt-6">
                  <h3 className="mb-3 font-semibold">
                    Suggestions
                  </h3>

                  <ul className="space-y-3">
                    {analysisResume.aiAnalysis.suggestions?.map(
                      (item, index) => (
                        <li
                          key={index}
                          className={`rounded-xl p-3 text-sm leading-6 ${
                            darkMode
                              ? "bg-white/3 text-slate-300"
                              : "bg-slate-50 text-slate-600"
                          }`}
                        >
                          <span className="mr-2 font-semibold text-violet-500">
                            {index + 1}.
                          </span>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </section>

                <div className="mt-6 flex justify-end border-t pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      setAnalysisResume(null)
                    }
                    className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default Resumes;
