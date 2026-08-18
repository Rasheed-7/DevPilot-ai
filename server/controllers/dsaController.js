import DSAProblem from "../models/DSAProblem.js";

export const getDSAProblems = async (req, res) => {
  try {
    const problems = await DSAProblem.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    console.log(`Found ${problems.length} DSA problems for user`);
    console.log(`Problems:`, problems.map(p => p.title).join(', '));
    
    res.status(200).json({
      success: true,
      problems,
    });
  } catch (error) {
    console.error("Error fetching DSA problems:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch DSA problems.",
    });
  }
};

// Get a single DSA problem
export const getDSAProblem = async (req, res) => {
  try {
    const problem = await DSAProblem.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "DSA problem not found.",
      });
    }

    return res.status(200).json({
      success: true,
      problem,
    });
  } catch (error) {
    console.error("Get DSA Problem Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch DSA problem.",
    });
  }
};

// Create a new DSA problem
export const createDSAProblem = async (req, res) => {
  try {
    const {
      title,
      topic,
      difficulty,
      platform,
      problemLink,
      solvedDate,
      notes,
      isSolved,
      source,
      externalId,
    } = req.body;

    if (!title || !topic || !difficulty) {
      return res.status(400).json({
        success: false,
        message: "Title, topic, and difficulty are required.",
      });
    }

    const problem = await DSAProblem.create({
      user: req.user._id,
      title: title.trim(),
      topic: topic.trim(),
      difficulty,
      platform: platform || "Other",
      problemLink: problemLink || "",
      solvedDate: solvedDate || new Date(),
      notes: notes || "",
      isSolved: isSolved !== undefined ? isSolved : true,
      source: source || "manual",
      externalId: externalId || "",
    });

    return res.status(201).json({
      success: true,
      message: "DSA problem created successfully.",
      problem,
    });
  } catch (error) {
    console.error("Create DSA Problem Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create DSA problem.",
    });
  }
};

// Update a DSA problem
export const updateDSAProblem = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Never allow ownership to be changed
    delete updates.user;

    const problem = await DSAProblem.findOneAndUpdate(
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

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "DSA problem not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "DSA problem updated successfully.",
      problem,
    });
  } catch (error) {
    console.error("Update DSA Problem Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update DSA problem.",
    });
  }
};

// Delete a DSA problem
export const deleteDSAProblem = async (req, res) => {
  try {
    const problem = await DSAProblem.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "DSA problem not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "DSA problem deleted successfully.",
    });
  } catch (error) {
    console.error("Delete DSA Problem Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete DSA problem.",
    });
  }
};