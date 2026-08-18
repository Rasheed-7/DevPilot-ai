import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import Interview from "../models/Interview.js";
import DSAProblem from "../models/DSAProblem.js";
import Goal from "../models/Goal.js";

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all counts in parallel
    const [
      allJobs,
      resumes,
      interviews,
      dsaProblems,
      allGoals,
      activeJobs,
      offers,
      completedGoals,
      upcomingInterviews,
      activeGoalsList,
    ] = await Promise.all([
      Job.find({ user: userId }),
      Resume.find({ user: userId }),
      Interview.find({ user: userId }),
      DSAProblem.find({ user: userId, isSolved: true }), // Fixed: isSolved (not solved)
      Goal.find({ user: userId }),
      Job.countDocuments({
        user: userId,
        status: { $nin: ["Rejected", "Offer"] },
      }),
      Job.countDocuments({
        user: userId,
        status: "Offer",
      }),
      Goal.countDocuments({
        user: userId,
        status: "Completed",
      }),
      Interview.find({
        user: userId,
        date: { $gte: new Date() },
      }).sort({ date: 1 }).limit(3),
      Goal.find({
        user: userId,
        status: "Active",
      }).limit(3),
    ]);

    // Calculate success rate
    const totalApplications = allJobs.length;
    const successRate = totalApplications === 0 ? 0 : Math.round((offers / totalApplications) * 100);

    // Build recent activity feed
    const activities = [];

    // Job activities
    allJobs.forEach((job) => {
      let action = "";
      if (job.status === "Applied") action = `Applied to ${job.company}`;
      else if (job.status === "Interview") action = `Interview scheduled with ${job.company}`;
      else if (job.status === "Offer") action = `Received offer from ${job.company}`;
      else if (job.status === "Rejected") action = `Rejected from ${job.company}`;
      else action = `Updated application for ${job.company}`;

      activities.push({
        title: action,
        time: job.updatedAt || job.createdAt,
        type: "application",
        id: job._id,
      });
    });

    // DSA activities - only include solved problems
    dsaProblems.forEach((problem) => {
      activities.push({
        title: `Solved "${problem.title}"`,
        time: problem.solvedDate || problem.createdAt,
        type: "dsa",
        id: problem._id,
      });
    });

    // Interview activities
    interviews.forEach((interview) => {
      activities.push({
        title: `Interview with ${interview.company}`,
        time: interview.createdAt,
        type: "interview",
        id: interview._id,
      });
    });

    // Resume activities
    resumes.forEach((resume) => {
      activities.push({
        title: `Uploaded "${resume.name}"`,
        time: resume.updatedAt || resume.createdAt,
        type: "resume",
        id: resume._id,
      });
    });

    // Goal activities
    allGoals.forEach((goal) => {
      if (goal.status === "Completed") {
        activities.push({
          title: `Completed goal: "${goal.title}"`,
          time: goal.completedAt || goal.updatedAt,
          type: "goal",
          id: goal._id,
        });
      } else if (goal.status === "Active") {
        activities.push({
          title: `Working on goal: "${goal.title}"`,
          time: goal.updatedAt || goal.createdAt,
          type: "goal",
          id: goal._id,
        });
      }
    });

    // Sort activities by time descending and take top 5
    const recentActivity = activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        stats: {
          activeJobs: activeJobs,
          resumes: resumes.length,
          interviews: interviews.length,
          dsaProblems: dsaProblems.length, //Now counts isSolved: true problems
        },
        quickStats: {
          goalsCompleted: completedGoals,
          successRate: successRate,
          interviews: interviews.length,
          offers: offers,
        },
        recentActivity: recentActivity,
        activeGoals: activeGoalsList,
        upcomingInterviews: upcomingInterviews,
        totalApplications: totalApplications,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: error.message,
    });
  }
};