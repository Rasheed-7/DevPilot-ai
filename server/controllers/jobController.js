import Job from "../models/Job.js";

// Get all non-archived jobs for the authenticated user
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      user: req.user._id,
      isArchived: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs.",
    });
  }
};

// Get a single job
export const getJob = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job.",
    });
  }
};

// Create a new job
export const createJob = async (req, res) => {
  try {
    const { company, role, ...rest } = req.body;

    if (!company || !role) {
      return res.status(400).json({
        success: false,
        message: "Company and role are required.",
      });
    }

    const job = await Job.create({
      user: req.user._id,
      company,
      role,
      ...rest,
    });

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      job,
    });
  }  catch(error) {
  console.error("Create Job Error:", error);

  return res.status(500).json({
    success: false,
    message: "Failed to create job.",
    error: error.message,
  });
}
};

// Update an existing job
export const updateJob = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.user;

    const job = await Job.findOneAndUpdate(
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

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update job.",
    });
  }
};

// Delete a job
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete job.",
    });
  }
};

// Toggle archive status
export const archiveJob = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    job.isArchived = !job.isArchived;
    await job.save();

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to archive job.",
    });
  }
};

// Get all archived jobs for the authenticated user
export const getArchivedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      user: req.user._id,
      isArchived: true,
    }).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Get Archived Jobs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch archived jobs.",
    });
  }
};

// Restore an archived job
export const restoreJob = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    job.isArchived = false;
    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job restored successfully.",
      job,
    });
  } catch (error) {
    console.error("Restore Job Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to restore job.",
    });
  }
};
