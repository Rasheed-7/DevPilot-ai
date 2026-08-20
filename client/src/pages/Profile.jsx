import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  GraduationCap,
  Building2,
  Trash2,
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

const Card = ({ title, icon: Icon, children }) => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`rounded-2xl border p-6 ${
        darkMode
          ? "border-slate-800 bg-slate-900"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-5 flex items-center gap-3">
        <Icon className="text-indigo-400" size={22} />

        <h2
          className={`text-xl font-semibold ${
            darkMode ? "text-white" : "text-slate-900"
          }`}
        >
          {title}
        </h2>
      </div>

      {children}
    </div>
  );
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

  if (loading) {
    return (
      <div
        className={`flex h-96 items-center justify-center ${
          darkMode
            ? "bg-slate-950"
            : "bg-gray-50"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />

          <p
            className={
              darkMode
                ? "text-slate-400"
                : "text-gray-500"
            }
          >
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div
        className={`flex h-96 flex-col items-center justify-center ${
          darkMode
            ? "bg-slate-950"
            : "bg-gray-50"
        }`}
      >
        <p className="text-red-400">
          {error}
        </p>

        <button
          onClick={() =>
            window.location.reload()
          }
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className={`flex h-96 items-center justify-center ${
          darkMode
            ? "bg-slate-950"
            : "bg-gray-50"
        }`}
      >
        <p
          className={
            darkMode
              ? "text-slate-400"
              : "text-gray-500"
          }
        >
          No profile data available
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen space-y-6 p-4 sm:p-6 ${
        darkMode
          ? "bg-slate-950 text-white"
          : "bg-gray-50 text-slate-900"
      }`}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className={`rounded-2xl border p-6 ${
          darkMode
            ? "border-slate-800 bg-slate-900"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 shrink-0">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-4xl font-bold text-white">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={`${profile.name || "User"} profile`}
                    className="h-full w-full object-cover"
                    onError={() =>
                      setPictureLoadFailed(true)
                    }
                  />
                ) : (
                  getInitials(
                    profile.name
                  )
                )}
              </div>

              <button
                type="button"
                onClick={handleProfilePictureClick}
                disabled={uploadingPicture}
                aria-label="Change profile picture"
                title="Change profile picture"
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingPicture ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Camera size={17} />
                )}
              </button>

              {profilePicture && (
                <button
                  type="button"
                  onClick={handleRemoveProfilePicture}
                  disabled={uploadingPicture}
                  aria-label="Remove profile picture"
                  title="Remove profile picture"
                  className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-500 text-white shadow-lg transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={14} />
                </button>
              )}

              <input
                ref={profilePictureInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
            </div>

            <div>
              <h1
                className={`text-3xl font-bold ${
                  darkMode
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                {profile.name}
              </h1>

              <p className="mt-1 flex items-center gap-2 text-cyan-400">
                <Briefcase size={16} />

                {profile.role ||
                  profile.targetRole ||
                  "Not specified"}
              </p>

              <p
                className={`mt-2 flex items-center gap-2 ${
                  darkMode
                    ? "text-slate-400"
                    : "text-gray-500"
                }`}
              >
                <Mail size={16} />
                {profile.email}
              </p>

              {profile.location && (
                <p
                  className={`mt-1 flex items-center gap-2 ${
                    darkMode
                      ? "text-slate-400"
                      : "text-gray-500"
                  }`}
                >
                  <MapPin size={16} />
                  {profile.location}
                </p>
              )}

              {socialLinks.some(
                (link) => link.url
              ) && (
                <div className="mt-4 flex items-center gap-2">
                  {socialLinks.map(
                    (social) => {
                      if (!social.url) {
                        return null;
                      }

                      const Icon =
                        social.icon;

                      return (
                        <a
                          key={social.key}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={
                            social.label
                          }
                          title={
                            social.label
                          }
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                            darkMode
                              ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-500 hover:bg-indigo-500/20 hover:text-white"
                              : "border-gray-200 bg-gray-50 text-gray-600 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
                          }`}
                        >
                          <Icon size={19} />
                        </a>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={openEditModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-white hover:bg-indigo-500"
          >
            <Edit size={18} />
            Edit Profile
          </button>
        </div>

        <div className="mt-6">
          <div
            className={`mb-2 flex justify-between text-sm ${
              darkMode
                ? "text-slate-400"
                : "text-gray-500"
            }`}
          >
            <span>
              Profile Completion
            </span>

            <span>
              {profileCompletion}%
            </span>
          </div>

          <div className="h-2 rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    profileCompletion
                  )
                )}%`,
              }}
            />
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="About"
          icon={Briefcase}
        >
          <p
            className={`leading-relaxed ${
              darkMode
                ? "text-slate-400"
                : "text-gray-600"
            }`}
          >
            {profile.bio ||
              "No bio added yet."}
          </p>

          <div className="mt-5">
            <p
              className={`text-sm ${
                darkMode
                  ? "text-slate-400"
                  : "text-gray-500"
              }`}
            >
              Target Role
            </p>

            <p
              className={`mt-1 font-medium ${
                darkMode
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              {profile.role ||
                profile.targetRole ||
                "Not specified"}
            </p>
          </div>
        </Card>

        <Card
          title="Skills"
          icon={Code2}
        >
          {profile.skills &&
          profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {profile.skills.map(
                (skill) => (
                  <div
                    key={skill}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                      darkMode
                        ? "bg-slate-800 text-white"
                        : "bg-gray-200 text-slate-900"
                    }`}
                  >
                    <Code2
                      size={16}
                      className="text-cyan-400"
                    />

                    {skill}
                  </div>
                )
              )}
            </div>
          ) : (
            <p
              className={
                darkMode
                  ? "text-slate-400"
                  : "text-gray-500"
              }
            >
              No skills added yet.
            </p>
          )}
        </Card>
      </div>

      {hasEducation && (
        <Card
          title="Education"
          icon={GraduationCap}
        >
          <div
            className={`rounded-xl border p-5 ${
              darkMode
                ? "border-slate-800 bg-slate-950"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {profile.education
              ?.college && (
              <h3
                className={`text-lg font-semibold ${
                  darkMode
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                {
                  profile.education
                    .college
                }
              </h3>
            )}

            {profile.education
              ?.degree && (
              <p
                className={`mt-2 ${
                  darkMode
                    ? "text-slate-300"
                    : "text-gray-600"
                }`}
              >
                {
                  profile.education
                    .degree
                }
              </p>
            )}

            {profile.education
              ?.graduationYear && (
              <p
                className={`mt-2 text-sm ${
                  darkMode
                    ? "text-slate-400"
                    : "text-gray-500"
                }`}
              >
                Graduation Year:{" "}
                {
                  profile.education
                    .graduationYear
                }
              </p>
            )}
          </div>
        </Card>
      )}

      {hasExperience && (
        <Card
          title="Experience"
          icon={Building2}
        >
          <div
            className={`rounded-xl border p-5 ${
              darkMode
                ? "border-slate-800 bg-slate-950"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {profile.experience
              ?.company && (
              <h3
                className={`text-lg font-semibold ${
                  darkMode
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                {
                  profile.experience
                    .company
                }
              </h3>
            )}

            {profile.experience
              ?.role && (
              <p
                className={`mt-2 ${
                  darkMode
                    ? "text-slate-300"
                    : "text-gray-600"
                }`}
              >
                {
                  profile.experience
                    .role
                }
              </p>
            )}

            {(profile.experience
              ?.startDate ||
              profile.experience
                ?.endDate ||
              profile.experience
                ?.current) && (
              <p
                className={`mt-2 text-sm ${
                  darkMode
                    ? "text-slate-400"
                    : "text-gray-500"
                }`}
              >
                {profile.experience
                  ?.startDate || ""}

                {profile.experience
                  ?.startDate &&
                (profile.experience
                  ?.endDate ||
                  profile.experience
                    ?.current)
                  ? " - "
                  : ""}

                {profile.experience
                  ?.current
                  ? "Present"
                  : profile.experience
                      ?.endDate || ""}
              </p>
            )}
          </div>
        </Card>
      )}

      <Card
        title="Placement Statistics"
        icon={Target}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "Applications",
              stats.applications,
            ],
            [
              "Interviews",
              stats.interviews,
            ],
            [
              "Offers",
              stats.offers,
            ],
            [
              "DSA Problems",
              stats.dsaProblems,
            ],
          ].map(([title, value]) => (
            <div
              key={title}
              className={`rounded-xl border p-5 ${
                darkMode
                  ? "border-slate-800 bg-slate-950"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <p
                className={`text-sm ${
                  darkMode
                    ? "text-slate-400"
                    : "text-gray-500"
                }`}
              >
                {title}
              </p>

              <h3
                className={`mt-2 text-3xl font-bold ${
                  darkMode
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                {value}
              </h3>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Current Goals"
        icon={Target}
      >
        {goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map(
              (goal, index) => (
                <div
                  key={
                    goal._id || index
                  }
                  className={`flex items-center gap-3 rounded-lg border p-4 ${
                    darkMode
                      ? "border-slate-800"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                    {index + 1}
                  </div>

                  <p
                    className={
                      darkMode
                        ? "text-white"
                        : "text-slate-900"
                    }
                  >
                    {goal.title}
                  </p>
                </div>
              )
            )}
          </div>
        ) : (
          <div>
            <p
              className={
                darkMode
                  ? "text-slate-400"
                  : "text-gray-500"
              }
            >
              No active goals.
            </p>

            <button
              onClick={() =>
                navigate("/goals")
              }
              className="mt-3 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Create Goal →
            </button>
          </div>
        )}
      </Card>

      {/* ✅ RESUME CARD – now shows only personal, non-archived, latest resume */}
      <Card
        title="Resume"
        icon={FileText}
      >
        {resume ? (
          <div
            className={`flex flex-col justify-between gap-4 rounded-xl border p-5 md:flex-row md:items-center ${
              darkMode
                ? "border-slate-800"
                : "border-gray-200"
            }`}
          >
            <div>
              <h3
                className={`font-semibold ${
                  darkMode
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                {resume.name}
              </h3>

              <p
                className={`mt-1 text-sm ${
                  darkMode
                    ? "text-slate-400"
                    : "text-gray-500"
                }`}
              >
                Last Updated:{" "}
                {new Date(
                  resume.updatedAt || resume.createdAt
                ).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
            </div>

            <button
              onClick={handleViewResume}
              disabled={previewingResume}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              <Eye size={16} />

              {previewingResume
                ? "Loading..."
                : "View Resume"}
            </button>
          </div>
        ) : (
          <div
            className={`flex flex-col justify-between gap-4 rounded-xl border p-5 md:flex-row md:items-center ${
              darkMode
                ? "border-slate-800"
                : "border-gray-200"
            }`}
          >
            <div>
              <h3
                className={`font-semibold ${
                  darkMode
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                No resume uploaded yet
              </h3>

              <p
                className={`mt-1 text-sm ${
                  darkMode
                    ? "text-slate-400"
                    : "text-gray-500"
                }`}
              >
                Upload your resume to get started.
              </p>
            </div>

            <button
              onClick={handleUploadResume}
              className="rounded-lg bg-cyan-600 px-5 py-2 text-white hover:bg-cyan-500"
            >
              Upload Resume
            </button>
          </div>
        )}
      </Card>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 ${
              darkMode
                ? "border-slate-800 bg-slate-900"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="mb-5 flex justify-between">
              <h2
                className={`text-xl font-bold ${
                  darkMode
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                Edit Profile
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSkillInput("");
                  setFilteredSkills([]);
                  setShowSkillSuggestions(
                    false
                  );
                }}
                className={
                  darkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-gray-400 hover:text-slate-900"
                }
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(
                onSubmit
              )}
              className="space-y-4"
            >
              <div>
                <input
                  placeholder="Name *"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                    errors.name
                      ? "border-red-500"
                      : darkMode
                      ? "border-slate-700 bg-slate-950 text-white"
                      : "border-gray-300 bg-white text-slate-900"
                  }`}
                  {...register("name", {
                    required:
                      "Name is required",
                  })}
                />

                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <input
                  placeholder="Location"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                    darkMode
                      ? "border-slate-700 bg-slate-950 text-white"
                      : "border-gray-300 bg-white text-slate-900"
                  }`}
                  {...register(
                    "location"
                  )}
                />
              </div>

              <div>
                <textarea
                  placeholder="Bio"
                  rows="3"
                  className={`w-full resize-none rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                    darkMode
                      ? "border-slate-700 bg-slate-950 text-white"
                      : "border-gray-300 bg-white text-slate-900"
                  }`}
                  {...register("bio")}
                />
              </div>

              <div>
                <input
                  placeholder="Target Role"
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                    darkMode
                      ? "border-slate-700 bg-slate-950 text-white"
                      : "border-gray-300 bg-white text-slate-900"
                  }`}
                  {...register(
                    "targetRole"
                  )}
                />
              </div>

              <div>
                <label
                  className={`mb-1 block text-sm font-medium ${
                    darkMode
                      ? "text-slate-400"
                      : "text-gray-500"
                  }`}
                >
                  Skills
                </label>

                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a skill or choose from suggestions"
                      className={`flex-1 rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                        darkMode
                          ? "border-slate-700 bg-slate-950 text-white"
                          : "border-gray-300 bg-white text-slate-900"
                      }`}
                      value={skillInput}
                      onChange={
                        handleSkillInputChange
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter"
                        ) {
                          e.preventDefault();

                          if (
                            skillInput.trim()
                          ) {
                            addTypedSkill();
                          }
                        }
                      }}
                      onFocus={() => {
                        if (
                          skillInput.trim()
                            .length > 0
                        ) {
                          const filtered =
                            SUGGESTED_SKILLS.filter(
                              (skill) =>
                                skill
                                  .toLowerCase()
                                  .includes(
                                    skillInput.toLowerCase()
                                  )
                            );

                          setFilteredSkills(
                            filtered
                          );

                          setShowSkillSuggestions(
                            true
                          );
                        }
                      }}
                      onBlur={() => {
                        setTimeout(
                          () =>
                            setShowSkillSuggestions(
                              false
                            ),
                          200
                        );
                      }}
                    />
                  </div>

                  {showSkillSuggestions &&
                    filteredSkills.length >
                      0 && (
                      <div
                        className={`absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border shadow-lg ${
                          darkMode
                            ? "border-slate-700 bg-slate-800"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        {filteredSkills.map(
                          (skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() =>
                                handleSelectSuggestion(
                                  skill
                                )
                              }
                              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                                darkMode
                                  ? "text-white hover:bg-slate-700"
                                  : "text-slate-900 hover:bg-gray-100"
                              }`}
                            >
                              {skill}

                              {profile?.skills?.includes(
                                skill
                              ) && (
                                <span className="ml-2 text-xs text-green-400">
                                  ✓ Added
                                </span>
                              )}
                            </button>
                          )
                        )}

                        {skillInput.trim()
                          .length > 0 &&
                          !filteredSkills.some(
                            (skill) =>
                              skill.toLowerCase() ===
                              skillInput.toLowerCase()
                          ) && (
                            <button
                              type="button"
                              onClick={
                                addTypedSkill
                              }
                              className={`w-full border-t px-4 py-2 text-left text-sm ${
                                darkMode
                                  ? "border-slate-700 text-indigo-400 hover:bg-slate-700"
                                  : "border-gray-200 text-indigo-600 hover:bg-gray-100"
                              }`}
                            >
                              + Add "{
                                skillInput.trim()
                              }"
                            </button>
                          )}
                      </div>
                    )}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {(profile.skills || []).map(
                    (skill) => (
                      <span
                        key={skill}
                        className={`flex items-center gap-1 rounded-lg px-3 py-1 text-sm ${
                          darkMode
                            ? "bg-slate-800"
                            : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={
                            darkMode
                              ? "text-white"
                              : "text-slate-900"
                          }
                        >
                          {skill}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveSkill(
                              skill
                            )
                          }
                          className="text-slate-400 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    )
                  )}
                </div>
              </div>

              <div
                className={`border-t pt-4 ${
                  darkMode
                    ? "border-slate-800"
                    : "border-gray-200"
                }`}
              >
                <h3
                  className={`mb-3 font-semibold ${
                    darkMode
                      ? "text-white"
                      : "text-slate-900"
                  }`}
                >
                  Social Links
                </h3>

                <div className="space-y-3">
                  <div className="relative">
                    <FaGithub
                      size={17}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                        darkMode
                          ? "text-slate-400"
                          : "text-gray-500"
                      }`}
                    />

                    <input
                      placeholder="GitHub URL"
                      className={`w-full rounded-lg border py-2 pl-10 pr-3 outline-none focus:border-indigo-500 ${
                        darkMode
                          ? "border-slate-700 bg-slate-950 text-white"
                          : "border-gray-300 bg-white text-slate-900"
                      }`}
                      {...register(
                        "socialLinks.github"
                      )}
                    />
                  </div>

                  <div className="relative">
                    <FaLinkedin
                      size={17}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                        darkMode
                          ? "text-slate-400"
                          : "text-gray-500"
                      }`}
                    />

                    <input
                      placeholder="LinkedIn URL"
                      className={`w-full rounded-lg border py-2 pl-10 pr-3 outline-none focus:border-indigo-500 ${
                        darkMode
                          ? "border-slate-700 bg-slate-950 text-white"
                          : "border-gray-300 bg-white text-slate-900"
                      }`}
                      {...register(
                        "socialLinks.linkedin"
                      )}
                    />
                  </div>

                  <div className="relative">
                    <Globe
                      size={17}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                        darkMode
                          ? "text-slate-400"
                          : "text-gray-500"
                      }`}
                    />

                    <input
                      placeholder="Portfolio URL"
                      className={`w-full rounded-lg border py-2 pl-10 pr-3 outline-none focus:border-indigo-500 ${
                        darkMode
                          ? "border-slate-700 bg-slate-950 text-white"
                          : "border-gray-300 bg-white text-slate-900"
                      }`}
                      {...register(
                        "socialLinks.portfolio"
                      )}
                    />
                  </div>

                  <div className="relative">
                    <FaTwitter
                      size={17}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                        darkMode
                          ? "text-slate-400"
                          : "text-gray-500"
                      }`}
                    />

                    <input
                      placeholder="Twitter URL"
                      className={`w-full rounded-lg border py-2 pl-10 pr-3 outline-none focus:border-indigo-500 ${
                        darkMode
                          ? "border-slate-700 bg-slate-950 text-white"
                          : "border-gray-300 bg-white text-slate-900"
                      }`}
                      {...register(
                        "socialLinks.twitter"
                      )}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`border-t pt-4 ${
                  darkMode
                    ? "border-slate-800"
                    : "border-gray-200"
                }`}
              >
                <h3
                  className={`mb-3 font-semibold ${
                    darkMode
                      ? "text-white"
                      : "text-slate-900"
                  }`}
                >
                  Education
                </h3>

                <div className="space-y-3">
                  <input
                    placeholder="College / University"
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                      darkMode
                        ? "border-slate-700 bg-slate-950 text-white"
                        : "border-gray-300 bg-white text-slate-900"
                    }`}
                    {...register(
                      "education.college"
                    )}
                  />

                  <input
                    placeholder="Degree"
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                      darkMode
                        ? "border-slate-700 bg-slate-950 text-white"
                        : "border-gray-300 bg-white text-slate-900"
                    }`}
                    {...register(
                      "education.degree"
                    )}
                  />

                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Graduation Year"
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                      darkMode
                        ? "border-slate-700 bg-slate-950 text-white"
                        : "border-gray-300 bg-white text-slate-900"
                    }`}
                    {...register(
                      "education.graduationYear"
                    )}
                  />
                </div>
              </div>

              <div
                className={`border-t pt-4 ${
                  darkMode
                    ? "border-slate-800"
                    : "border-gray-200"
                }`}
              >
                <h3
                  className={`mb-3 font-semibold ${
                    darkMode
                      ? "text-white"
                      : "text-slate-900"
                  }`}
                >
                  Experience
                </h3>

                <div className="space-y-3">
                  <input
                    placeholder="Company"
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                      darkMode
                        ? "border-slate-700 bg-slate-950 text-white"
                        : "border-gray-300 bg-white text-slate-900"
                    }`}
                    {...register(
                      "experience.company"
                    )}
                  />

                  <input
                    placeholder="Role"
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                      darkMode
                        ? "border-slate-700 bg-slate-950 text-white"
                        : "border-gray-300 bg-white text-slate-900"
                    }`}
                    {...register(
                      "experience.role"
                    )}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        className={`mb-1 block text-sm ${
                          darkMode
                            ? "text-slate-400"
                            : "text-gray-500"
                        }`}
                      >
                        Start Date
                      </label>

                      <input
                        type="date"
                        className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                          darkMode
                            ? "border-slate-700 bg-slate-950 text-white"
                            : "border-gray-300 bg-white text-slate-900"
                        }`}
                        {...register(
                          "experience.startDate"
                        )}
                      />
                    </div>

                    <div>
                      <label
                        className={`mb-1 block text-sm ${
                          darkMode
                            ? "text-slate-400"
                            : "text-gray-500"
                        }`}
                      >
                        End Date
                      </label>

                      <input
                        type="date"
                        disabled={Boolean(
                          profile.experience
                            ?.current
                        )}
                        className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                          darkMode
                            ? "border-slate-700 bg-slate-950 text-white"
                            : "border-gray-300 bg-white text-slate-900"
                        }`}
                        {...register(
                          "experience.endDate"
                        )}
                      />
                    </div>
                  </div>

                  <label
                    className={`flex cursor-pointer items-center gap-2 text-sm ${
                      darkMode
                        ? "text-slate-300"
                        : "text-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      {...register(
                        "experience.current"
                      )}
                      onChange={(event) => {
                        setValue(
                          "experience.current",
                          event.target.checked
                        );

                        if (event.target.checked) {
                          setValue(
                            "experience.endDate",
                            ""
                          );
                        }
                      }}
                    />

                    I currently work here
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;