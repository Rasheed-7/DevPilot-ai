import Interview from "../models/Interview.js";

// Get all interviews for the authenticated user
export const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({
      user: req.user._id,
    }).sort({ date: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      interviews,
    });
  } catch (error) {
    console.error("Get Interviews Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch interviews.",
    });
  }
};

// Get a single interview
export const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    return res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error("Get Interview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch interview.",
    });
  }
};

// Create a new interview
export const createInterview = async (req, res) => {
  try {
    const {
      company,
      role,
      round,
      date,
      time,
      result,
      difficulty,
      questions,
      feedback,
    } = req.body;

    // Required fields
    if (!company || !role || !round || !date || !result) {
      return res.status(400).json({
        success: false,
        message: "Company, role, round, date, and result are required.",
      });
    }

    const interview = await Interview.create({
      user: req.user._id,
      company: company.trim(),
      role: role.trim(),
      round: round.trim(),
      date,
      time: time || "",
      result,
      difficulty: difficulty || "Medium",
      questions: Array.isArray(questions) ? questions : [],
      feedback: feedback || "",
    });

    return res.status(201).json({
      success: true,
      message: "Interview created successfully.",
      interview,
    });
  } catch (error) {
    console.error("Create Interview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create interview.",
    });
  }
};

// Update an existing interview
export const updateInterview = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Never allow the frontend to change ownership
    delete updates.user;

    const interview = await Interview.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview updated successfully.",
      interview,
    });
  } catch (error) {
    console.error("Update Interview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update interview.",
    });
  }
};

// Delete an interview
export const deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Interview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete interview.",
    });
  }
};