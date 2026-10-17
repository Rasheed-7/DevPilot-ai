import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  MapPin,
  Mail,
  Briefcase,
  Code2,
  FileText,
  Target,
  Edit,
  X,
  Eye,
  Globe,
  Camera,
  Building2,
  Trash2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
} from "react-icons/fa";

const SUGGESTED_SKILLS = [
  "React",
  "Node.js",
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "GraphQL",
  "REST APIs",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Git",
  "CI/CD",
  "Agile",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Bootstrap",
  "Express.js",
  "Django",
  "Flask",
  "Spring Boot",
  "PHP",
  "Ruby on Rails",
  "Swift",
  "Kotlin",
  "Flutter",
  "React Native",
  "Angular",
  "Vue.js",
  "Next.js",
  "Nuxt.js",
  "Svelte",
  "Redux",
  "Zustand",
  "Jest",
  "Cypress",
  "Webpack",
  "Vite",
];

const EMPTY_SOCIAL_LINKS = {
  github: "",
  linkedin: "",
  portfolio: "",
  twitter: "",
};

const EMPTY_EDUCATION = {
  college: "",
  degree: "",
  graduationYear: "",
};

const EMPTY_EXPERIENCE = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  current: false,
};



const getSafeUrl = (value) => {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  try {
    const url = new URL(
      /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`
    );

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
};

const Profile = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  const [stats, setStats] = useState({
    applications: 0,
    interviews: 0,
    offers: 0,
    dsaProblems: 0,
  });

  const [goals, setGoals] = useState([]);
  const [resume, setResume] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [showSkillSuggestions, setShowSkillSuggestions] =
    useState(false);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [previewingResume, setPreviewingResume] =
    useState(false);
  const [uploadingPicture, setUploadingPicture] =
    useState(false);
  const [pictureLoadFailed, setPictureLoadFailed] =
    useState(false);

  const profilePictureInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (isInitial = true) => {
      if (!mounted) return;

      if (isInitial) {
        setLoading(true);
        setError(null);
      }

      try {
        // ✅ Fetch profile data
        const { data } = await api.get("/profile");

        if (data && data.success) {
          const userData =
            data.data?.user || data.user;

          const statsData =
            data.data?.stats || data.stats;

          const goalsData =
            data.data?.goals ||
            data.goals ||
            [];

          if (userData) {
            setProfile(userData);

            setStats(
              statsData || {
                applications: 0,
                interviews: 0,
                offers: 0,
                dsaProblems: 0,
              }
            );

            setGoals(goalsData);

            setProfileCompletion(
              userData.profileCompletion || 0
            );

            setPictureLoadFailed(false);

            if (isInitial) {
              setError(null);
            }
          } else if (isInitial) {
            setError("No user data in response");
            toast.error("No user data in response");
          }
        } else if (isInitial) {
          const msg =
            data?.message ||
            "Failed to load profile";

          setError(msg);
          toast.error(msg);
        }
      } catch (error) {
        console.error("Fetch error:", error);

        if (isInitial) {
          const message =
            error.response?.data?.message ||
            error.message ||
            "Failed to load profile";

          setError(message);
          toast.error(message);
        }
      } finally {
        if (isInitial && mounted) {
          setLoading(false);
        }
      }
    };

    // ✅ Fetch resumes separately to get the latest personal resume
    const fetchResumes = async () => {
      try {
        const { data } = await api.get("/resumes");
        const resumes = data?.resumes || data || [];

        // ✅ Filter: only "mine" (personal) and NOT archived
        const personalResumes = resumes.filter(
          (r) => r.resumeType === "mine" && !r.isArchived
        );

        // ✅ Sort by newest first (updatedAt or createdAt)
        const sorted = personalResumes.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB - dateA;
        });

        // ✅ Set the latest personal resume, or null if none
        setResume(sorted.length > 0 ? sorted[0] : null);
      } catch (error) {
        console.error("Error fetching resumes for profile:", error);
        // Do not show toast here to avoid spamming the user
        setResume(null);
      }
    };

    // ✅ Fetch both in parallel
    const loadAll = async () => {
      await Promise.all([fetchProfile(true), fetchResumes()]);
      setLoading(false);
    };

    loadAll();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshProfile = async () => {
    try {
      // ✅ Refresh profile data
      const { data } = await api.get("/profile");

      if (data.success) {
        const userData =
          data.data?.user || data.user;

        const statsData =
          data.data?.stats || data.stats;

        const goalsData =
          data.data?.goals ||
          data.goals ||
          [];

        if (userData) {
          setProfile(userData);

          setStats(
            statsData || {
              applications: 0,
              interviews: 0,
              offers: 0,
              dsaProblems: 0,
            }
          );

          setGoals(goalsData);

          setProfileCompletion(
            userData.profileCompletion || 0
          );

          setPictureLoadFailed(false);
          setError(null);
        }
      }

      // ✅ Refresh resumes
      const { data: resumeData } = await api.get("/resumes");
      const resumes = resumeData?.resumes || resumeData || [];

      const personalResumes = resumes.filter(
        (r) => r.resumeType === "mine" && !r.isArchived
      );

      const sorted = personalResumes.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return dateB - dateA;
      });

      setResume(sorted.length > 0 ? sorted[0] : null);
    } catch (error) {
      console.error("Refresh failed:", error);
      toast.error("Failed to refresh profile");
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return (
        parts[0][0]?.toUpperCase() || "U"
      );
    }

    return (
      (parts[0][0] || "") +
      (parts[parts.length - 1][0] || "")
    ).toUpperCase();
  };

  const openEditModal = () => {
    if (profile) {
      setValue("name", profile.name || "");
      setValue(
        "location",
        profile.location || ""
      );
      setValue("bio", profile.bio || "");
      setValue(
        "targetRole",
        profile.role ||
          profile.targetRole ||
          ""
      );

      const socialLinks = {
        ...EMPTY_SOCIAL_LINKS,
        ...(profile.socialLinks || {}),
      };

      const education = {
        ...EMPTY_EDUCATION,
        ...(profile.education || {}),
      };

      const experience = {
        ...EMPTY_EXPERIENCE,
        ...(profile.experience || {}),
      };

      setValue(
        "socialLinks.github",
        socialLinks.github
      );

      setValue(
        "socialLinks.linkedin",
        socialLinks.linkedin
      );

      setValue(
        "socialLinks.portfolio",
        socialLinks.portfolio
      );

      setValue(
        "socialLinks.twitter",
        socialLinks.twitter
      );

      setValue(
        "education.college",
        education.college
      );

      setValue(
        "education.degree",
        education.degree
      );

      setValue(
        "education.graduationYear",
        education.graduationYear
      );

      setValue(
        "experience.company",
        experience.company
      );

      setValue(
        "experience.role",
        experience.role
      );

      setValue(
        "experience.startDate",
        experience.startDate
      );

      setValue(
        "experience.endDate",
        experience.endDate
      );

      setValue(
        "experience.current",
        experience.current
      );

      setSkillInput("");
      setFilteredSkills([]);
      setShowSkillSuggestions(false);
    }

    setShowEditModal(true);
  };

  const handleSkillInputChange = (e) => {
    const value = e.target.value;

    setSkillInput(value);

    if (value.trim().length > 0) {
      const filtered =
        SUGGESTED_SKILLS.filter((skill) =>
          skill
            .toLowerCase()
            .includes(value.toLowerCase())
        );

      setFilteredSkills(filtered);
      setShowSkillSuggestions(true);
    } else {
      setFilteredSkills([]);
      setShowSkillSuggestions(false);
    }
  };

  const handleSelectSuggestion = (skill) => {
    if (
      profile &&
      !(profile.skills || []).includes(skill)
    ) {
      const updatedSkills = [
        ...(profile.skills || []),
        skill,
      ];

      setProfile({
        ...profile,
        skills: updatedSkills,
      });
    }

    setSkillInput("");
    setFilteredSkills([]);
    setShowSkillSuggestions(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    if (profile) {
      const updatedSkills =
        (profile.skills || []).filter(
          (skill) => skill !== skillToRemove
        );

      setProfile({
        ...profile,
        skills: updatedSkills,
      });
    }
  };

  const addTypedSkill = () => {
    const skillToAdd = skillInput.trim();

    if (!skillToAdd || !profile) {
      return;
    }

    const currentSkills =
      profile.skills || [];

    if (
      currentSkills.includes(skillToAdd)
    ) {
      toast.error("Skill already added");
      setSkillInput("");
      setFilteredSkills([]);
      setShowSkillSuggestions(false);
      return;
    }

    setProfile({
      ...profile,
      skills: [
        ...currentSkills,
        skillToAdd,
      ],
    });

    setSkillInput("");
    setFilteredSkills([]);
    setShowSkillSuggestions(false);

    toast.success(
      `Added "${skillToAdd}"`
    );
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const payload = {
        name: data.name,
        location: data.location || "",
        bio: data.bio || "",
        targetRole: data.targetRole || "",
        skills: profile?.skills || [],

        socialLinks: {
          github:
            data.socialLinks?.github || "",
          linkedin:
            data.socialLinks?.linkedin || "",
          portfolio:
            data.socialLinks?.portfolio || "",
          twitter:
            data.socialLinks?.twitter || "",
        },

        education: {
          college:
            data.education?.college || "",
          degree:
            data.education?.degree || "",
          graduationYear:
            data.education?.graduationYear ||
            "",
        },

        experience: {
          company:
            data.experience?.company || "",
          role:
            data.experience?.role || "",
          startDate:
            data.experience?.startDate || "",
          endDate:
            data.experience?.endDate || "",
          current: Boolean(
            data.experience?.current
          ),
        },
      };

      const response = await api.put(
        "/profile",
        payload
      );

      if (response.data.success) {
        toast.success(
          "Profile updated successfully"
        );

        setShowEditModal(false);

        await refreshProfile();
      } else {
        toast.error(
          response.data?.message ||
            "Failed to update profile"
        );
      }
    } catch (error) {
      console.error(
        "Update error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to update profile"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfilePictureClick = () => {
    if (uploadingPicture) return;

    profilePictureInputRef.current?.click();
  };

  const handleProfilePictureChange = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Please select a JPEG or PNG image."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        "Profile picture must be 5MB or smaller."
      );
      return;
    }

    const formData = new FormData();

    formData.append(
      "profilePicture",
      file
    );

    setUploadingPicture(true);

    try {
      const response = await api.post(
        "/profile/upload-picture",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      if (response.data?.success) {
        const uploadedPicture =
          response.data?.profilePicture ||
          response.data?.data
            ?.profilePicture ||
          "";

        setProfile(
          (currentProfile) => {
            if (!currentProfile) {
              return currentProfile;
            }

            return {
              ...currentProfile,
              profilePicture:
                uploadedPicture,
            };
          }
        );

        setPictureLoadFailed(false);

        toast.success(
          "Profile picture updated successfully"
        );

        await refreshUser();

        await refreshProfile();
      } else {
        toast.error(
          response.data?.message ||
            "Failed to upload profile picture"
        );
      }
    } catch (error) {
      console.error(
        "Profile picture upload error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to upload profile picture"
      );
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!window.confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setUploadingPicture(true);

    try {
      const response = await api.delete("/profile/upload-picture");

      if (response.data?.success) {
        setProfile((currentProfile) => {
          if (!currentProfile) return currentProfile;
          return {
            ...currentProfile,
            profilePicture: "",
          };
        });

        setPictureLoadFailed(false);
        toast.success("Profile picture removed successfully");

        await refreshUser();
        await refreshProfile();
      } else {
        toast.error(response.data?.message || "Failed to remove profile picture");
      }
    } catch (error) {
      console.error("Remove profile picture error:", error);
      toast.error(error.response?.data?.message || "Failed to remove profile picture");
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleViewResume = async () => {
    if (!resume) {
      navigate("/resumes");
      return;
    }

    setPreviewingResume(true);

    try {
      const response = await api.get(
        `/resumes/${resume._id}/preview`
      );

      if (response.data?.url) {
        window.open(
          response.data.url,
          "_blank"
        );
      } else {
        toast.error(
          "No preview URL available"
        );
        navigate("/resumes");
      }
    } catch (error) {
      console.error(
        "Preview error:",
        error
      );

      toast.error(
        "Failed to preview resume"
      );

      navigate("/resumes");
    } finally {
      setPreviewingResume(false);
    }
  };

  const handleUploadResume = () => {
    navigate("/resumes");
  };

  const socialLinks = [
    {
      key: "github",
      label: "GitHub",
      icon: FaGithub,
      url: getSafeUrl(
        profile?.socialLinks?.github
      ),
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: FaLinkedin,
      url: getSafeUrl(
        profile?.socialLinks?.linkedin
      ),
    },
    {
      key: "portfolio",
      label: "Portfolio",
      icon: Globe,
      url: getSafeUrl(
        profile?.socialLinks?.portfolio
      ),
    },
    {
      key: "twitter",
      label: "Twitter",
      icon: FaTwitter,
      url: getSafeUrl(
        profile?.socialLinks?.twitter
      ),
    },
  ];

  const hasEducation =
    Boolean(
      profile?.education?.college
    ) ||
    Boolean(
      profile?.education?.degree
    ) ||
    Boolean(
      profile?.education?.graduationYear
    );

  const hasExperience =
    Boolean(
      profile?.experience?.company
    ) ||
    Boolean(
      profile?.experience?.role
    ) ||
    Boolean(
      profile?.experience?.startDate
    ) ||
    Boolean(
      profile?.experience?.endDate
    ) ||
    Boolean(
      profile?.experience?.current
    );

  const profilePicture =
    profile?.profilePicture &&
    !pictureLoadFailed
      ? profile.profilePicture
      : "";

  const surface = darkMode
    ? "border-white/[0.08] bg-[#11161e]"
    : "border-slate-200/80 bg-white";
  const muted = darkMode ? "text-slate-500" : "text-slate-500";
  const heading = darkMode ? "text-white" : "text-slate-900";
  const inputClass = `w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all focus:ring-4 ${
    darkMode
      ? "border-white/10 bg-white/[0.035] text-white placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-sky-400/10"
      : "border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-sky-500/10"
  }`;

  if (loading) {
    return <div className={`flex min-h-screen items-center justify-center ${darkMode ? "bg-[#080a0f]" : "bg-[#f7f8fa]"}`}><div className="flex flex-col items-center gap-4"><div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" /><p className={muted}>Loading profile...</p></div></div>;
  }

  if (error && !profile) {
    return <div className={`flex min-h-screen flex-col items-center justify-center ${darkMode ? "bg-[#080a0f]" : "bg-[#f7f8fa]"}`}><p className="text-red-500">{error}</p><button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500">Try Again</button></div>;
  }

  if (!profile) {
    return <div className={`flex min-h-screen items-center justify-center ${darkMode ? "bg-[#080a0f] text-slate-400" : "bg-[#f7f8fa] text-slate-500"}`}>No profile data available</div>;
  }

  const currentRole = profile.role || profile.targetRole || "Not specified";
  const hasSocialLinks = socialLinks.some((link) => link.url);
  const statItems = [["Applications", stats.applications], ["Interviews", stats.interviews], ["Offers", stats.offers], ["DSA solved", stats.dsaProblems]];

  return (
    <main className={`min-h-screen px-4 py-5 sm:px-6 sm:py-8 lg:px-10 ${darkMode ? "bg-[#080a0f] text-white" : "bg-[#f7f8fa] text-slate-900"}`}>
      <div className="mx-auto max-w-360">
        <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col gap-6 border-b border-slate-200 pb-8 dark:border-white/8 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-sky-600"><Sparkles size={14} /> DevPilot / Career profile</p><h1 className="mt-4 max-w-4xl text-4xl font-semibold -tracking-widest sm:text-6xl">Make your next move legible.</h1><p className={`mt-4 max-w-2xl text-sm leading-6 sm:text-base ${muted}`}>A focused view of your direction, evidence, and career momentum.</p></div><button onClick={openEditModal} className="flex items-center justify-center gap-2 self-start rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,116,144,0.18)] transition-all hover:-translate-y-0.5 hover:bg-sky-500 sm:self-auto"><Edit size={17} /> Edit profile</button></motion.header>

        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`overflow-hidden rounded-[22px] border-l-4 border-sky-500 ${surface}`}>
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="flex min-w-0 flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
              <div className="relative h-20 w-20 shrink-0">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] bg-sky-600 text-2xl font-bold text-white shadow-lg shadow-sky-900/10">{profilePicture ? <img src={profilePicture} alt={`${profile.name || "User"} profile`} className="h-full w-full object-cover" onError={() => setPictureLoadFailed(true)} /> : getInitials(profile.name)}</div>
                <button type="button" onClick={handleProfilePictureClick} disabled={uploadingPicture} aria-label="Change profile picture" title="Change profile picture" className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white bg-sky-600 text-white shadow-md hover:bg-sky-500 disabled:opacity-60">{uploadingPicture ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera size={14} />}</button>
                {profilePicture && <button type="button" onClick={handleRemoveProfilePicture} disabled={uploadingPicture} aria-label="Remove profile picture" title="Remove profile picture" className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-md border-2 border-white bg-red-500 text-white hover:bg-red-400 disabled:opacity-60"><Trash2 size={10} /></button>}
                <input ref={profilePictureInputRef} type="file" accept="image/jpeg,image/png" onChange={handleProfilePictureChange} className="hidden" />
              </div>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h2 className={`truncate text-2xl font-semibold tracking-[-0.08em] ${heading}`}>{profile.name}</h2><span className="text-[9px] font-bold uppercase tracking-[0.18em] text-sky-600">Profile display</span></div><p className="mt-2 flex items-center gap-2 text-sm font-semibold text-sky-600"><Briefcase size={14} />{currentRole}</p><div className={`mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs ${muted}`}><span className="flex items-center gap-1.5"><Mail size={13} />{profile.email}</span>{profile.location && <span className="flex items-center gap-1.5"><MapPin size={13} />{profile.location}</span>}</div>{hasSocialLinks && <div className="mt-4 flex flex-wrap gap-3">{socialLinks.map((social) => { if (!social.url) return null; const Icon = social.icon; return <a key={social.key} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label} title={social.label} className={`flex items-center gap-1.5 text-xs font-semibold transition ${darkMode ? "text-slate-400 hover:text-sky-300" : "text-slate-500 hover:text-sky-600"}`}><Icon size={14} />{social.label}</a>; })}</div>}</div>
              <button onClick={openEditModal} className={`flex shrink-0 items-center justify-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition ${darkMode ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}><Edit size={13} />Edit</button>
            </div>
            <div className={`border-t p-5 sm:p-6 lg:border-l lg:border-t-0 ${darkMode ? "border-white/8 bg-white/2" : "border-slate-200/80 bg-slate-50/60"}`}><div className="flex items-center justify-between"><div><p className={`text-[9px] font-bold uppercase tracking-[0.16em] ${muted}`}>Profile health</p><p className={`mt-1 text-3xl font-semibold tracking-[-0.08em] ${heading}`}>{profileCompletion}%</p></div><Target size={18} className="text-sky-500" /></div><div className={`mt-3 h-1.5 overflow-hidden rounded-full ${darkMode ? "bg-white/8" : "bg-slate-200"}`}><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, profileCompletion))}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-sky-500" /></div><div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">{statItems.map(([label, value]) => <div key={label}><p className={`text-[9px] uppercase tracking-widest ${muted}`}>{label}</p><p className={`mt-1 text-lg font-semibold tracking-tighter ${heading}`}>{value}</p></div>)}</div></div>
          </div>
        </motion.section>

        <section className={`mt-7 overflow-hidden rounded-[28px] border ${surface}`}><div className={`flex items-end justify-between border-b px-6 py-6 sm:px-9 ${darkMode ? "border-white/8" : "border-slate-100"}`}><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">Capabilities</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.07em]">Technical strengths</h2></div><Code2 size={20} className={darkMode ? "text-slate-600" : "text-slate-400"} /></div>{profile.skills?.length > 0 ? <div className="grid gap-x-8 gap-y-0 p-6 sm:grid-cols-2 sm:p-9 lg:grid-cols-3">{profile.skills.map((skill, index) => <div key={skill} className={`flex items-center gap-4 border-b py-4 text-sm font-semibold ${darkMode ? "border-white/[0.07] text-slate-300" : "border-slate-100 text-slate-700"}`}><span className="font-mono text-xs text-violet-600">{String(index + 1).padStart(2, "0")}</span>{skill}</div>)}</div> : <p className={`px-6 py-9 text-sm sm:px-9 ${muted}`}>No skills added yet.</p>}</section>

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><section className={`rounded-[28px] border p-6 sm:p-9 ${surface}`}><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Objectives</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.07em]">Career objectives</h2></div><Target size={19} className={darkMode ? "text-slate-600" : "text-slate-400"} /></div>{goals.length > 0 ? <div className="mt-8 space-y-4">{goals.map((goal, index) => <motion.div key={goal._id || index} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }} className={`flex items-start gap-4 border-b pb-4 last:border-b-0 last:pb-0 ${darkMode ? "border-white/[0.07]" : "border-slate-100"}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-bold text-amber-600">{index + 1}</span><div><p className={`text-sm font-semibold ${heading}`}>{goal.title}</p><p className={`mt-1 text-xs ${muted}`}>Active career commitment</p></div></motion.div>)}</div> : <div className={`mt-8 border-l-2 border-amber-500 px-4 py-4 ${darkMode ? "bg-amber-400/4" : "bg-amber-50/70"}`}><p className="text-sm font-semibold text-amber-600">No active goals yet.</p><button onClick={() => navigate("/goals")} className="mt-3 flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-500">Define a goal <ArrowUpRight size={14} /></button></div>}</section><section className={`rounded-[28px] border p-6 sm:p-9 ${surface}`}><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600">Career record</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.07em]">Experience and education</h2></div><Building2 size={19} className={darkMode ? "text-slate-600" : "text-slate-400"} /></div><div className="mt-8 space-y-7">{hasExperience && <div className="border-l-2 border-teal-500/40 pl-6"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-600">Experience</p><h3 className={`mt-2 text-lg font-semibold ${heading}`}>{profile.experience?.role || "Role not specified"}</h3><p className="mt-1 text-sm font-semibold text-teal-600">{profile.experience?.company || "Company not specified"}</p>{(profile.experience?.startDate || profile.experience?.endDate || profile.experience?.current) && <p className={`mt-3 text-sm ${muted}`}>{profile.experience?.startDate || ""}{profile.experience?.startDate && (profile.experience?.endDate || profile.experience?.current) ? " — " : ""}{profile.experience?.current ? "Present" : profile.experience?.endDate || ""}</p>}</div>}{hasEducation && <div className="border-l-2 border-sky-500/40 pl-6"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sky-600">Education</p><h3 className={`mt-2 text-lg font-semibold ${heading}`}>{profile.education?.degree || "Degree not specified"}</h3><p className="mt-1 text-sm font-semibold text-sky-600">{profile.education?.college || "Institution not specified"}</p>{profile.education?.graduationYear && <p className={`mt-3 text-sm ${muted}`}>Graduation year · {profile.education.graduationYear}</p>}</div>}{!hasExperience && !hasEducation && <p className={`text-sm ${muted}`}>Add experience or education to build this record.</p>}</div></section></div>

        <section className={`mt-7 overflow-hidden rounded-[28px] border ${surface}`}><div className={`flex items-end justify-between border-b px-6 py-6 sm:px-9 ${darkMode ? "border-white/8" : "border-slate-100"}`}><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">Professional document</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.07em]">Primary resume</h2></div><FileText size={20} className={darkMode ? "text-slate-600" : "text-slate-400"} /></div>{resume ? <div className="grid gap-7 p-6 sm:p-9 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div className="flex items-start gap-5"><div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border ${darkMode ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-300" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}><FileText size={25} /></div><div><h3 className={`text-xl font-semibold tracking-[-0.04em] ${heading}`}>{resume.name}</h3><p className={`mt-2 text-sm ${muted}`}>Latest personal resume · updated {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p><p className={`mt-3 text-xs ${muted}`}>Verified from your active “My Resumes” collection.</p></div></div><div className="flex flex-wrap gap-3"><button onClick={handleViewResume} disabled={previewingResume} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"><Eye size={16} />{previewingResume ? "Opening..." : "View resume"}</button><button onClick={() => navigate("/resumes")} className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold ${darkMode ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Manage resumes <ArrowUpRight size={15} /></button></div></div> : <div className={`flex flex-col gap-5 border-l-2 border-cyan-500 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-9 ${darkMode ? "bg-cyan-400/3" : "bg-cyan-50/60"}`}><div><h3 className={`text-lg font-semibold ${heading}`}>No personal resume on file</h3><p className={`mt-2 max-w-xl text-sm leading-6 ${muted}`}>Upload a resume in My Resumes to make it part of your professional identity.</p></div><button onClick={handleUploadResume} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-500"><FileText size={16} />Open resumes</button></div>}</section>
        <AnimatePresence>
          {showEditModal && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm"><motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`my-auto w-full max-w-3xl rounded-[28px] border p-6 shadow-2xl sm:p-8 ${darkMode ? "border-white/10 bg-[#11161e]" : "border-slate-200 bg-white"}`}><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">Professional identity</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.07em]">Edit your profile</h2><p className={`mt-2 text-sm ${muted}`}>Keep the information behind your profile current.</p></div><button type="button" onClick={() => { setShowEditModal(false); setSkillInput(""); setFilteredSkills([]); setShowSkillSuggestions(false); }} className={`flex h-9 w-9 items-center justify-center rounded-lg ${darkMode ? "text-slate-500 hover:bg-white/6 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"}`}><X size={18} /></button></div><form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-7"><div><p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Identity</p><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Name *</span><input placeholder="Name *" className={`mt-2 ${inputClass} ${errors.name ? "border-red-500" : ""}`} {...register("name", { required: "Name is required" })} />{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}</label><label className="block"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Location</span><input placeholder="Location" className={`mt-2 ${inputClass}`} {...register("location")} /></label><label className="block sm:col-span-2"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Target role</span><input placeholder="Target Role" className={`mt-2 ${inputClass}`} {...register("targetRole")} /></label><label className="block sm:col-span-2"><span className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Professional summary</span><textarea rows="4" placeholder="Bio" className={`mt-2 resize-none ${inputClass}`} {...register("bio")} /></label></div></div><div><p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Technical identity</p><div className="relative"><div className="flex gap-2"><input type="text" placeholder="Type a skill or choose from suggestions" className={`flex-1 ${inputClass}`} value={skillInput} onChange={handleSkillInputChange} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (skillInput.trim()) addTypedSkill(); } }} onFocus={() => { if (skillInput.trim().length > 0) { const filtered = SUGGESTED_SKILLS.filter((skill) => skill.toLowerCase().includes(skillInput.toLowerCase())); setFilteredSkills(filtered); setShowSkillSuggestions(true); } }} onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)} /></div>{showSkillSuggestions && filteredSkills.length > 0 && <div className={`absolute z-10 mt-2 max-h-48 w-full overflow-y-auto rounded-xl border shadow-lg ${darkMode ? "border-white/10 bg-[#151d27]" : "border-slate-200 bg-white"}`}>{filteredSkills.map((skill) => <button key={skill} type="button" onClick={() => handleSelectSuggestion(skill)} className={`w-full px-4 py-2.5 text-left text-sm ${darkMode ? "text-slate-200 hover:bg-white/6" : "text-slate-700 hover:bg-slate-50"}`}>{skill}{profile?.skills?.includes(skill) && <span className="ml-2 text-xs text-emerald-500">Added</span>}</button>)}{skillInput.trim().length > 0 && !filteredSkills.some((skill) => skill.toLowerCase() === skillInput.toLowerCase()) && <button type="button" onClick={addTypedSkill} className={`w-full border-t px-4 py-2.5 text-left text-sm ${darkMode ? "border-white/10 text-sky-300 hover:bg-white/6" : "border-slate-100 text-sky-600 hover:bg-slate-50"}`}>+ Add "{skillInput.trim()}"</button>}</div>}</div><div className="mt-4 flex flex-wrap gap-2">{(profile.skills || []).map((skill) => <span key={skill} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${darkMode ? "border-white/10 bg-white/[0.035] text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}>{skill}<button type="button" onClick={() => handleRemoveSkill(skill)} className="text-slate-400 hover:text-red-400"><X size={13} /></button></span>)}</div></div><div><p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Professional links</p><div className="grid gap-3 sm:grid-cols-2"><input placeholder="GitHub URL" className={inputClass} {...register("socialLinks.github")} /><input placeholder="LinkedIn URL" className={inputClass} {...register("socialLinks.linkedin")} /><input placeholder="Portfolio URL" className={inputClass} {...register("socialLinks.portfolio")} /><input placeholder="Twitter URL" className={inputClass} {...register("socialLinks.twitter")} /></div></div><div><p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Education</p><div className="grid gap-3 sm:grid-cols-3"><input placeholder="College / University" className={inputClass} {...register("education.college")} /><input placeholder="Degree" className={inputClass} {...register("education.degree")} /><input type="text" inputMode="numeric" placeholder="Graduation Year" className={inputClass} {...register("education.graduationYear")} /></div></div><div><p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Experience</p><div className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><input placeholder="Company" className={inputClass} {...register("experience.company")} /><input placeholder="Role" className={inputClass} {...register("experience.role")} /></div><div className="grid gap-3 sm:grid-cols-2"><label><span className={`mb-2 block text-xs ${muted}`}>Start date</span><input type="date" className={inputClass} {...register("experience.startDate")} /></label><label><span className={`mb-2 block text-xs ${muted}`}>End date</span><input type="date" disabled={Boolean(profile.experience?.current)} className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`} {...register("experience.endDate")} /></label></div><label className={`flex cursor-pointer items-center gap-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" {...register("experience.current")} onChange={(event) => { setValue("experience.current", event.target.checked); if (event.target.checked) setValue("experience.endDate", ""); }} />I currently work here</label></div></div><div className={`flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end ${darkMode ? "border-white/8" : "border-slate-100"}`}><button type="button" onClick={() => { setShowEditModal(false); setSkillInput(""); setFilteredSkills([]); setShowSkillSuggestions(false); }} className={`rounded-xl border px-5 py-3 text-sm font-semibold ${darkMode ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>Cancel</button><button type="submit" disabled={isSubmitting} className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50">{isSubmitting ? "Saving..." : "Save changes"}</button></div></form></motion.div></motion.div>}
        </AnimatePresence>
      </div>
    </main>
  );
};


export default Profile;