import Goal from "../models/Goal.js";

export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ deadline: 1 });
    res.status(200).json({ success: true, goals });
  } catch (error) {
    console.error("Get Goals Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch goals." });
  }
};

export const getGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: "Goal not found." });
    }
    res.status(200).json({ success: true, goal });
  } catch (error) {
    console.error("Get Goal Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch goal." });
  }
};

export const createGoal = async (req, res) => {
  try {
    console.log("Creating goal for user:", req.user._id);
    console.log("Request body:", req.body);

    const { title, description, category, current, target, deadline, priority } = req.body;

    // Validate
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: "Category is required." });
    }
    if (!target || target <= 0) {
      return res.status(400).json({ success: false, message: "Target must be greater than 0." });
    }
    if (!deadline) {
      return res.status(400).json({ success: false, message: "Deadline is required." });
    }

    const currentValue = current || 0;
    const isCompleted = currentValue >= target;
    const status = isCompleted ? "Completed" : "Active";

    const goal = await Goal.create({
      user: req.user._id,
      title: title.trim(),
      description: description?.trim() || "",
      category,
      current: Math.min(currentValue, target),
      target: Number(target),
      deadline: new Date(deadline),
      priority: priority || "Medium",
      status,
      completedAt: isCompleted ? new Date() : null,
    });

    console.log("Goal created successfully:", goal._id);

    res.status(201).json({
      success: true,
      message: "Goal created successfully.",
      goal,
    });
  } catch (error) {
    console.error("Create Goal Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create goal.",
    });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });

    if (!goal) {
      return res.status(404).json({ success: false, message: "Goal not found." });
    }

    const { title, description, category, current, target, deadline, priority } = req.body;

    if (title) goal.title = title.trim();
    if (description !== undefined) goal.description = description?.trim() || "";
    if (category) goal.category = category;
    if (priority) goal.priority = priority;
    if (deadline) goal.deadline = new Date(deadline);

    if (current !== undefined) {
      const targetValue = target || goal.target;
      goal.current = Math.min(current, targetValue);
    }

    if (target !== undefined) {
      const currentValue = current || goal.current;
      goal.target = target;
      if (currentValue > target) {
        goal.current = target;
      }
    }

    const isCompleted = goal.current >= goal.target;
    goal.status = isCompleted ? "Completed" : "Active";
    goal.completedAt = isCompleted ? new Date() : null;

    await goal.save();

    res.status(200).json({
      success: true,
      message: "Goal updated successfully.",
      goal,
    });
  } catch (error) {
    console.error("Update Goal Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update goal.",
    });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });

    if (!goal) {
      return res.status(404).json({ success: false, message: "Goal not found." });
    }

    await goal.deleteOne();

    res.status(200).json({
      success: true,
      message: "Goal deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Goal Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete goal.",
    });
  }
};