import Job from "../models/Job.js";
import Interview from "../models/Interview.js";
import DSAProblem from "../models/DSAProblem.js";
import Goal from "../models/Goal.js";

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { range } = req.query;

    // Calculate date range
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "3m":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 3);
    }

    // Fetch all data
    const [jobs, interviews, dsaProblems, goals] = await Promise.all([
      Job.find({ user: userId }),
      Interview.find({ user: userId }),
      DSAProblem.find({ user: userId }),
      Goal.find({ user: userId }),
    ]);

    // Filter jobs by date range
    const filteredJobs = jobs.filter((job) => {
      if (!job.appliedDate) return false;
      return new Date(job.appliedDate) >= startDate;
    });

    // Filter interviews by date range
    const filteredInterviews = interviews.filter((interview) => {
      if (!interview.date) return false;
      return new Date(interview.date) >= startDate;
    });

    // 1. KPI Calculations
    const totalApplications = jobs.length;
    const totalInterviews = interviews.length;
    const totalOffers = jobs.filter((job) => job.status === "Offer").length;

    const interviewConversion =
      totalApplications > 0
        ? Math.round((totalInterviews / totalApplications) * 100)
        : 0;

    const offerConversion =
      totalApplications > 0
        ? Math.round((totalOffers / totalApplications) * 100)
        : 0;

    // 2. Application Trend (group by month)
    const applicationTrend = [];
    const monthMap = {};

    filteredJobs.forEach((job) => {
      if (!job.appliedDate) return;
      const date = new Date(job.appliedDate);
      const monthKey = date.toLocaleString("default", { month: "long" });
      const yearKey = date.getFullYear();
      const key = `${monthKey} ${yearKey}`;

      if (!monthMap[key]) {
        monthMap[key] = { month: monthKey, year: yearKey, applications: 0 };
      }
      monthMap[key].applications += 1;
    });

    // Sort by year and month
    const sortedMonths = Object.values(monthMap).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return new Date(Date.parse(a.month + " 1, 2000")) -
             new Date(Date.parse(b.month + " 1, 2000"));
    });

    sortedMonths.forEach((item) => {
      applicationTrend.push({
        month: `${item.month} ${item.year}`,
        applications: item.applications,
      });
    });

    // 3. Status Distribution
    const statusMap = {};
    const statuses = ["Wishlist", "Applied", "OA", "Interview", "HR", "Offer", "Rejected"];

    jobs.forEach((job) => {
      const status = job.status || "Applied";
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    const statusDistribution = statuses.map((status) => ({
      name: status,
      value: statusMap[status] || 0,
    }));

    // 4. Interview Funnel
    const funnel = [
      { title: "Applications", value: jobs.length },
      { title: "OA", value: jobs.filter((j) => j.status === "OA").length },
      { title: "Technical Interviews", value: interviews.filter((i) => i.type === "Technical").length },
      { title: "HR", value: interviews.filter((i) => i.type === "HR").length },
      { title: "Offers", value: jobs.filter((j) => j.status === "Offer").length },
    ];

    // 5. Top Companies
    const companyMap = {};
    jobs.forEach((job) => {
      if (!job.company) return;
      companyMap[job.company] = (companyMap[job.company] || 0) + 1;
    });

    const topCompanies = Object.entries(companyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // 6. Top Roles
    const roleMap = {};
    jobs.forEach((job) => {
      if (!job.role) return;
      roleMap[job.role] = (roleMap[job.role] || 0) + 1;
    });

    const topRoles = Object.entries(roleMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // 7. Monthly Performance
    const monthlyPerformance = [];
    const monthlyMap = {};

    filteredJobs.forEach((job) => {
      if (!job.appliedDate) return;
      const date = new Date(job.appliedDate);
      const monthKey = date.toLocaleString("default", { month: "long" });
      const yearKey = date.getFullYear();
      const key = `${monthKey} ${yearKey}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: monthKey,
          year: yearKey,
          applications: 0,
          interviews: 0,
          offers: 0,
        };
      }
      monthlyMap[key].applications += 1;
    });

    filteredInterviews.forEach((interview) => {
      if (!interview.date) return;
      const date = new Date(interview.date);
      const monthKey = date.toLocaleString("default", { month: "long" });
      const yearKey = date.getFullYear();
      const key = `${monthKey} ${yearKey}`;

      if (monthlyMap[key]) {
        monthlyMap[key].interviews += 1;
      }
    });

    jobs.forEach((job) => {
      if (!job.appliedDate || job.status !== "Offer") return;
      const date = new Date(job.appliedDate);
      const monthKey = date.toLocaleString("default", { month: "long" });
      const yearKey = date.getFullYear();
      const key = `${monthKey} ${yearKey}`;

      if (monthlyMap[key]) {
        monthlyMap[key].offers += 1;
      }
    });

    const sortedMonthly = Object.values(monthlyMap).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return new Date(Date.parse(a.month + " 1, 2000")) -
             new Date(Date.parse(b.month + " 1, 2000"));
    });

    sortedMonthly.forEach((item) => {
      const conversion =
        item.applications > 0
          ? Math.round((item.interviews / item.applications) * 100)
          : 0;
      monthlyPerformance.push({
        month: `${item.month} ${item.year}`,
        applications: item.applications,
        interviews: item.interviews,
        offers: item.offers,
        conversion: `${conversion}%`,
      });
    });

    // 8. DSA Analytics
    const totalSolved = dsaProblems.filter((p) => p.isSolved !== false).length;
    const dsaByDifficulty = {};
    const dsaByTopic = {};
    const dsaByPlatform = {};

    dsaProblems.forEach((p) => {
      if (p.isSolved === false) return;
      dsaByDifficulty[p.difficulty] = (dsaByDifficulty[p.difficulty] || 0) + 1;
      dsaByTopic[p.topic] = (dsaByTopic[p.topic] || 0) + 1;
      dsaByPlatform[p.platform] = (dsaByPlatform[p.platform] || 0) + 1;
    });

    // 9. Goal Analytics
    const activeGoals = goals.filter((g) => g.status === "Active").length;
    const completedGoals = goals.filter((g) => g.status === "Completed").length;
    const totalGoals = goals.length;
    const goalCompletionRate =
      totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    // 10. Insights
    const insights = [];

    // Check interview conversion
    if (totalApplications > 0 && totalInterviews > 0) {
      insights.push(`You have ${totalInterviews} interviews from ${totalApplications} applications.`);
    }

    // Check top role vs others
    if (topRoles.length > 0) {
      const topRole = topRoles[0];
      const totalRoles = topRoles.reduce((sum, r) => sum + r.count, 0);
      const topRolePercentage = Math.round((topRole.count / totalRoles) * 100);
      if (topRolePercentage > 50) {
        insights.push(`You applied mostly to ${topRole.name} roles (${topRolePercentage}% of applications).`);
      }
    }

    // Check DSA weak topics
    if (dsaProblems.length > 0) {
      const sortedTopics = Object.entries(dsaByTopic).sort((a, b) => a[1] - b[1]);
      if (sortedTopics.length > 0) {
        insights.push(`Your weakest DSA topic is ${sortedTopics[0][0]} with only ${sortedTopics[0][1]} problems solved.`);
      }
    }

    // Check goal completion
    if (totalGoals > 0 && completedGoals === totalGoals) {
      insights.push("Amazing! You've completed all your goals!");
    } else if (totalGoals > 0 && completedGoals > 0) {
      insights.push(`You've completed ${completedGoals} out of ${totalGoals} goals. Keep going!`);
    }

    if (insights.length === 0) {
      insights.push("Add some applications, interviews, or DSA problems to start generating insights.");
    }

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          applications: totalApplications,
          interviews: totalInterviews,
          offers: totalOffers,
          interviewConversion: interviewConversion,
          offerConversion: offerConversion,
        },
        applicationTrend,
        statusDistribution,
        funnel,
        topCompanies,
        topRoles,
        monthlyPerformance,
        dsa: {
          solved: totalSolved,
          byDifficulty: dsaByDifficulty,
          byTopic: dsaByTopic,
          byPlatform: dsaByPlatform,
        },
        goals: {
          active: activeGoals,
          completed: completedGoals,
          total: totalGoals,
          completionRate: goalCompletionRate,
        },
        insights,
      },
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate analytics.",
    });
  }
};