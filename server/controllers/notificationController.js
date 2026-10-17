import Interview from "../models/Interview.js";
import Goal from "../models/Goal.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Interviews within the next 2 days (including today)
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const upcomingInterviews = await Interview.find({
      user: userId,
      date: { $gte: now, $lte: twoDaysFromNow },
    }).sort({ date: 1 });

    // Goals with deadlines within the next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcomingGoals = await Goal.find({
      user: userId,
      status: "Active",
      deadline: { $gte: now, $lte: threeDaysFromNow },
    }).sort({ deadline: 1 });

    const notifications = [];

    upcomingInterviews.forEach((interview) => {
      notifications.push({
        id: interview._id,
        type: "interview",
        title: `Interview with ${interview.company || "a company"}`,
        message: `Scheduled on ${new Date(interview.date).toLocaleDateString()}${
          interview.time ? ` at ${interview.time}` : ""
        }`,
        date: interview.date,
      });
    });

    upcomingGoals.forEach((goal) => {
      notifications.push({
        id: goal._id,
        type: "goal",
        title: `Goal deadline approaching: ${goal.title}`,
        message: `Due on ${new Date(goal.deadline).toLocaleDateString()}`,
        date: goal.deadline,
      });
    });

    // Sort by date (closest first)
    notifications.sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load notifications.",
    });
  }
};