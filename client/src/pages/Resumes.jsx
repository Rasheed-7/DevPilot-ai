import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  X,
  Archive,
  RotateCcw,
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

const Resumes = () => {
  const { darkMode } = useTheme();
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
  const [activeTab, setActiveTab] = useState("mine");

  // Fetch resumes on mount
  useEffect(() => {
    let mounted = true;

    const fetchResumes = async () => {
      if (!mounted) return;
      setLoading(true);
      try {
        const { data } = await api.get("/resumes");
        if (mounted) {
          setResumes(data.resumes || data || []);
        }
      } catch (error) {
        console.error("Error fetching resumes:", error);
        if (mounted) {
          toast.error("Failed to load resumes");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchResumes();

    return () => {
      mounted = false;
    };
  }, []);

  // Helper function to refresh the list
  const refreshResumes = async () => {
    try {
      const { data } = await api.get("/resumes");
      setResumes(data.resumes || data || []);
    } catch (error) {
      console.error("Error refreshing resumes:", error);
      toast.error("Failed to refresh resumes");
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
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
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setResumeName(nameWithoutExt);
    setResumeType("mine");
    setPersonName("");
    setShowUploadModal(true);
    event.target.value = "";
  };

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
    formData.append("resumeFile", selectedFile); // Changed from "resume" to "resumeFile"
    formData.append("name", resumeName || selectedFile.name.replace(/\.[^/.]+$/, ""));
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

    toast.success(response.data?.message || "Resume uploaded successfully.");
    
    setSelectedFile(null);
    setResumeName("");
    setResumeType("mine");
    setPersonName("");
    setSelectedTags([]);
    setShowUploadModal(false);
    
    await refreshResumes();
  } catch (error) {
    console.error("Upload error:", error);
    const message = error.response?.data?.message || "Failed to upload resume.";
    toast.error(message);
  } finally {
    setUploading(false);
  }
};
  const handlePreview = async (resumeId) => {
    if (previewing) return;
    
    setPreviewing(true);
    try {
      const response = await api.get(`/resumes/${resumeId}/preview`);
      
      if (response.data?.url) {
        window.open(response.data.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("No preview URL available.");
      }
    } catch (error) {
      console.error("Preview error:", error);
      const message = error.response?.data?.message || "Failed to preview resume.";
      toast.error(message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownload = async (resumeId, resumeName) => {
    if (downloadingId === resumeId) return;

    setDownloadingId(resumeId);

    try {
      const response = await api.get(`/resumes/${resumeId}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${resumeName || "resume"}.pdf`;

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

  const handleDelete = async (resumeId) => {
    if (deletingId === resumeId) return;

    if (!window.confirm("Are you sure you want to delete this resume?")) {
      return;
    }

    setDeletingId(resumeId);

    try {
      await api.delete(`/resumes/${resumeId}`);
      toast.success("Resume deleted successfully.");
      await refreshResumes();
    } catch (error) {
      console.error("Delete error:", error);
      const message = error.response?.data?.message || "Failed to delete resume.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleArchiveToggle = async (resumeId, isArchived) => {
    if (archivingId === resumeId) return;

    setArchivingId(resumeId);

    try {
      const response = await api.patch(`/resumes/${resumeId}/archive`);
      
      const updatedResume = response.data.resume;
      
      if (isArchived) {
        toast.success("Resume unarchived successfully.");
      } else {
        toast.success("Resume archived successfully.");
      }
      
      setResumes((prevResumes) =>
        prevResumes.map((resume) =>
          (resume._id === resumeId || resume.id === resumeId)
            ? { ...resume, isArchived: updatedResume.isArchived }
            : resume
        )
      );
      
    } catch (error) {
      console.error("Archive toggle error:", error);
      const message = error.response?.data?.message || "Failed to update resume.";
      toast.error(message);
    } finally {
      setArchivingId(null);
    }
  };

  const handleEditClick = (resume) => {
    setEditingResume(resume);
    setEditName(resume.name || "");
    setEditPersonName(resume.personName || "");
    setEditTags(resume.tags || []);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editName.trim()) {
      toast.error("Resume name is required.");
      return;
    }

    if (editingResume?.resumeType === "other" && !editPersonName.trim()) {
      toast.error("Person name is required.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: editName.trim(),
        personName: editPersonName.trim(),
        tags: editTags,
      };

      await api.put(`/resumes/${editingResume._id}`, payload);

      toast.success("Resume updated successfully.");
      setShowEditModal(false);
      setEditingResume(null);
      setEditName("");
      setEditPersonName("");
      setEditTags([]);
      
      await refreshResumes();
    } catch (error) {
      console.error("Edit error:", error);
      const message = error.response?.data?.message || "Failed to update resume.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag]
    );
  };

  const toggleEditTag = (tag) => {
    setEditTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag]
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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

  const mineCount = resumes.filter((r) => r.resumeType === "mine" && !r.isArchived).length;
  const otherCount = resumes.filter((r) => r.resumeType === "other" && !r.isArchived).length;
  const archivedCount = resumes.filter((r) => r.isArchived === true).length;

  const filteredResumes = resumes.filter((resume) => {
    if (activeTab === "archived") {
      return resume.isArchived === true;
    }
    return resume.resumeType === activeTab && !resume.isArchived;
  });

  const activeResume = filteredResumes.find((r) => r.isActive);
  const latestResume = filteredResumes.length > 0 ? filteredResumes[0] : null;

  return (
    <div className={`space-y-6 min-h-screen p-4 sm:p-6 ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row"
      >
        <div>
          <h1 className="text-3xl font-bold">Resume Manager</h1>
          <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Keep every version of your resume organized and ready.
          </p>
        </div>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 hover:bg-indigo-500 text-white">
          <Upload size={18} />
          Upload Resume

          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total Resumes", resumes.length],
          ["Latest Version", latestResume ? `v${latestResume.version}` : "N/A"],
          ["Last Updated", latestResume ? formatDate(latestResume.updatedAt) : "N/A"],
        ].map(([title, value]) => (
          <Card key={title}>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              {title}
            </p>
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {value}
            </h2>
          </Card>
        ))}
      </div>

      <div className={`flex gap-1 border-b ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
        <button
          onClick={() => setActiveTab("mine")}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "mine"
              ? "border-b-2 border-indigo-500 text-indigo-400"
              : darkMode
              ? "text-slate-400 hover:text-white"
              : "text-gray-500 hover:text-slate-900"
          }`}
        >
          My Resumes ({mineCount})
        </button>
        <button
          onClick={() => setActiveTab("other")}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "other"
              ? "border-b-2 border-indigo-500 text-indigo-400"
              : darkMode
              ? "text-slate-400 hover:text-white"
              : "text-gray-500 hover:text-slate-900"
          }`}
        >
          Other Resumes ({otherCount})
        </button>
        <button
          onClick={() => setActiveTab("archived")}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "archived"
              ? "border-b-2 border-indigo-500 text-indigo-400"
              : darkMode
              ? "text-slate-400 hover:text-white"
              : "text-gray-500 hover:text-slate-900"
          }`}
        >
          Archived ({archivedCount})
        </button>
      </div>

      {activeResume && (
        <Card>
          <div className="flex flex-col justify-between gap-5 md:flex-row">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="text-indigo-400" size={28} />
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {activeResume.name}
                </h2>
              </div>

              <p className={`mt-3 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Version: v{activeResume.version}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {activeResume.tags && activeResume.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs text-indigo-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className={`mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Updated: {formatDate(activeResume.updatedAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePreview(activeResume._id || activeResume.id)}
                disabled={previewing}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-gray-300 hover:bg-gray-100 text-slate-900'} disabled:opacity-50`}
              >
                <Eye size={16} />
                Preview
              </button>
              <button
                onClick={() => handleDownload(activeResume._id || activeResume.id, activeResume.name)}
                disabled={downloadingId === (activeResume._id || activeResume.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-gray-300 hover:bg-gray-100 text-slate-900'} disabled:opacity-50`}
              >
                <Download size={16} />
                Download
              </button>
              <button
                onClick={() => handleEditClick(activeResume)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-gray-300 hover:bg-gray-100 text-slate-900'}`}
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => handleArchiveToggle(activeResume._id || activeResume.id, activeResume.isArchived)}
                disabled={archivingId === (activeResume._id || activeResume.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-gray-300 hover:bg-gray-100 text-slate-900'} disabled:opacity-50`}
              >
                {activeResume.isArchived ? (
                  <>
                    <RotateCcw size={16} />
                    Unarchive
                  </>
                ) : (
                  <>
                    <Archive size={16} />
                    Archive
                  </>
                )}
              </button>
              <button
                onClick={() => handleDelete(activeResume._id || activeResume.id)}
                disabled={deletingId === (activeResume._id || activeResume.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-gray-300 hover:bg-gray-100 text-slate-900'} disabled:opacity-50`}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <label className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 text-center hover:border-indigo-500 ${darkMode ? 'border-slate-700' : 'border-gray-300'}`}>
          <Upload size={35} className="text-cyan-400" />
          <h3 className={`mt-4 text-lg font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Drop your resume here or browse files
          </h3>
          <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Accepted format: PDF (Max 5 MB)
          </p>

          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      </Card>

      <Card>
        <h2 className={`mb-4 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Resume Tags
        </h2>

        <div className="flex flex-wrap gap-3">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-4 py-2 text-sm ${
                selectedTags.includes(tag)
                  ? "bg-indigo-600 text-white"
                  : darkMode
                  ? "bg-slate-800 text-white"
                  : "bg-gray-200 text-slate-900"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className={`mb-5 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {activeTab === "archived" ? "Archived Resumes" : "Resume Version History"}
        </h2>

        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading resumes...</div>
        ) : filteredResumes.length > 0 ? (
          <div className="space-y-4">
            {filteredResumes.map((resume) => (
              <div
                key={resume._id || resume.id}
                className={`flex flex-col justify-between gap-4 rounded-xl border p-4 md:flex-row ${
                  resume.isActive && !resume.isArchived
                    ? "border-indigo-600 bg-indigo-950/20"
                    : resume.isArchived
                    ? darkMode
                      ? "border-slate-600 bg-slate-800/50"
                      : "border-gray-300 bg-gray-100"
                    : darkMode
                    ? "border-slate-800"
                    : "border-gray-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-indigo-400" />
                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {resume.name}
                    </h3>

                    {resume.isActive && !resume.isArchived && (
                      <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
                        Active
                      </span>
                    )}
                    {resume.isArchived && (
                      <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">
                        Archived
                      </span>
                    )}
                  </div>

                  <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Version: v{resume.version} • {formatDate(resume.createdAt)} • {formatFileSize(resume.fileSize)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {resume.tags && resume.tags.map((tag) => (
                      <span className={`rounded px-2 py-1 text-xs ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handlePreview(resume._id || resume.id)}
                    disabled={previewing}
                    className="text-slate-400 hover:text-white disabled:opacity-50"
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    onClick={() => handleDownload(resume._id || resume.id, resume.name)}
                    disabled={downloadingId === (resume._id || resume.id)}
                    className="text-slate-400 hover:text-white disabled:opacity-50"
                  >
                    <Download size={18} />
                  </button>

                  <button
                    onClick={() => handleEditClick(resume)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit size={18} />
                  </button>

                  <button
                    onClick={() => handleArchiveToggle(resume._id || resume.id, resume.isArchived)}
                    disabled={archivingId === (resume._id || resume.id)}
                    className="text-slate-400 hover:text-white disabled:opacity-50"
                  >
                    {resume.isArchived ? <RotateCcw size={18} /> : <Archive size={18} />}
                  </button>

                  <button
                    onClick={() => handleDelete(resume._id || resume.id)}
                    disabled={deletingId === (resume._id || resume.id)}
                    className="text-slate-400 hover:text-white disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <FileText size={45} className="mx-auto text-slate-600" />
            <h3 className={`mt-4 text-xl font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {activeTab === "archived" 
                ? "No archived resumes." 
                : activeTab === "mine"
                ? "No resumes uploaded yet."
                : "No other resumes saved yet."}
            </h3>
            <p className="text-slate-400">
              {activeTab === "archived" 
                ? "Archived resumes will appear here." 
                : activeTab === "mine"
                ? "Upload your first resume to get started."
                : "Upload other people's resumes to keep track of them."}
            </p>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      {showUploadModal && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className={`w-full max-w-lg rounded-xl border p-6 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="mb-5 flex justify-between">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Upload Resume</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setResumeName("");
                  setResumeType("mine");
                  setPersonName("");
                  setSelectedTags([]);
                }}
                className={darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-slate-900'}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                  File
                </label>
                <div className={`rounded-lg border px-3 py-2 ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-gray-300 bg-white'}`}>
                  <p className={darkMode ? 'text-white' : 'text-slate-900'}>{selectedFile.name}</p>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                  Resume Name
                </label>
                <input
                  type="text"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  placeholder="Enter resume name"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-2`}>
                  Resume Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="resumeType"
                      value="mine"
                      checked={resumeType === "mine"}
                      onChange={(e) => {
                        setResumeType(e.target.value);
                        setPersonName("");
                      }}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className={darkMode ? 'text-white' : 'text-slate-900'}>My Resume</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="resumeType"
                      value="other"
                      checked={resumeType === "other"}
                      onChange={(e) => {
                        setResumeType(e.target.value);
                      }}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className={darkMode ? 'text-white' : 'text-slate-900'}>Other Resume</span>
                  </label>
                </div>
              </div>

              {resumeType === "other" && (
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                    Person Name
                  </label>
                  <input
                    type="text"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="Whose resume is this?"
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  />
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3 py-1 text-sm ${
                        selectedTags.includes(tag)
                          ? "bg-indigo-600 text-white"
                          : darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-gray-200 text-slate-900"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Resume"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className={`w-full max-w-lg rounded-xl border p-6 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="mb-5 flex justify-between">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Edit Resume</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingResume(null);
                  setEditName("");
                  setEditPersonName("");
                  setEditTags([]);
                }}
                className={darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-slate-900'}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                  Resume Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter resume name"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                />
              </div>

              {editingResume.resumeType === "other" && (
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                    Person Name
                  </label>
                  <input
                    type="text"
                    value={editPersonName}
                    onChange={(e) => setEditPersonName(e.target.value)}
                    placeholder="Whose resume is this?"
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-gray-300 bg-white text-slate-900'}`}
                  />
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleEditTag(tag)}
                      className={`rounded-full px-3 py-1 text-sm ${
                        editTags.includes(tag)
                          ? "bg-indigo-600 text-white"
                          : darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-gray-200 text-slate-900"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleEditSave}
                disabled={isSaving}
                className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resumes;