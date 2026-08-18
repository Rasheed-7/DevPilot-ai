import PlatformConnection from "../models/PlatformConnection.js";
import {
  verifyCodeforcesUser,
  getCodeforcesSubmissions,
  normalizeCodeforcesSubmission,
} from "../services/codeforcesService.js";
import {
  verifyLeetCodeUser,
  syncLeetCodeProblems,
  getBestTopic,
} from "../services/leetcodeService.js";
import DSAProblem from "../models/DSAProblem.js";

const ALLOWED_PLATFORMS = [
  "LeetCode",
  "Codeforces",
];

// Get all connected platforms
export const getPlatforms = async (req, res) => {
  try {
    const platforms = await PlatformConnection.find({
      user: req.user._id,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      platforms,
    });
  } catch (error) {
    console.error("Get Platforms Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch platform connections.",
    });
  }
};

// Connect or update a platform
export const connectPlatform = async (req, res) => {
  try {
    const { platform, username, profileUrl } = req.body;

    if (!platform || !ALLOWED_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: "Invalid platform.",
      });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    const connection = await PlatformConnection.findOneAndUpdate(
      {
        user: req.user._id,
        platform,
      },
      {
        user: req.user._id,
        platform,
        username: username.trim(),
        profileUrl: profileUrl?.trim() || "",
        connected: true,
        lastSyncStatus: "never",
        lastSyncMessage: "",
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: `${platform} connected successfully.`,
      platform: connection,
    });
  } catch (error) {
    console.error("Connect Platform Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to connect platform.",
    });
  }
};

// Disconnect a platform
export const disconnectPlatform = async (req, res) => {
  try {
    const { platform } = req.params;

    if (!ALLOWED_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: "Invalid platform.",
      });
    }

    const connection = await PlatformConnection.findOne({
      user: req.user._id,
      platform,
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Platform connection not found.",
      });
    }

    const deleteResult = await DSAProblem.deleteMany({
      user: req.user._id,
      platform: platform,
      source: "sync",
    });

    console.log(`Deleted ${deleteResult.deletedCount} synced problems from ${platform}`);

    await PlatformConnection.findOneAndDelete({
      user: req.user._id,
      platform,
    });

    return res.status(200).json({
      success: true,
      message: `${platform} disconnected successfully. ${deleteResult.deletedCount} synced problems removed.`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Disconnect Platform Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to disconnect platform.",
    });
  }
};

// Verify Platform - Supports Codeforces and LeetCode
export const verifyPlatform = async (req, res) => {
  try {
    const { platform, username } = req.body;

    if (!platform || !username?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Platform and username are required.",
      });
    }

    let verificationResult;

    switch (platform) {
      case 'Codeforces':
        verificationResult = await verifyCodeforcesUser(username.trim());
        break;
      case 'LeetCode':
        verificationResult = await verifyLeetCodeUser(username.trim());
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Platform "${platform}" does not support verification.`,
        });
    }

    return res.status(200).json({
      success: true,
      message: `${platform} account verified successfully.`,
      user: verificationResult,
    });

  } catch (error) {
    console.error('Verification error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to verify account. Please try again.',
    });
  }
};

// Sync Codeforces
export const syncCodeforces = async (req, res) => {
  try {
    console.log('=== CODEFORCES SYNC STARTED ===');
    
    const connection = await PlatformConnection.findOne({
      user: req.user._id,
      platform: "Codeforces",
      connected: true,
    });

    if (!connection) {
      console.log('Codeforces not connected');
      return res.status(404).json({
        success: false,
        message: "Codeforces is not connected.",
      });
    }

    console.log(`Username: ${connection.username}`);

    const submissions = await getCodeforcesSubmissions(connection.username);

    const acceptedSubmissions = submissions.filter(
      (submission) => submission.verdict === "OK"
    );

    console.log(`Found ${acceptedSubmissions.length} accepted submissions`);

    const uniqueProblems = new Map();

    for (const submission of acceptedSubmissions) {
      const normalized = normalizeCodeforcesSubmission(submission);
      if (!uniqueProblems.has(normalized.externalId)) {
        uniqueProblems.set(normalized.externalId, normalized);
      }
    }

    console.log(`${uniqueProblems.size} unique solved problems`);

    let created = 0;
    let updated = 0;

    for (const problem of uniqueProblems.values()) {
      const existing = await DSAProblem.findOne({
        user: req.user._id,
        platform: "Codeforces",
        externalId: problem.externalId,
      });

      if (existing) {
        console.log(`Updating existing: ${problem.title}`);
        existing.title = problem.title;
        existing.topic = problem.topic;
        existing.difficulty = problem.difficulty;
        existing.problemLink = problem.problemUrl;
        existing.isSolved = true;
        existing.source = "sync";
        existing.solvedDate = problem.solvedAt;
        await existing.save();
        updated++;
      } else {
        console.log(`Creating new: ${problem.title}`);
        await DSAProblem.create({
          user: req.user._id,
          title: problem.title,
          topic: problem.topic,
          difficulty: problem.difficulty,
          platform: "Codeforces",
          problemLink: problem.problemUrl,
          solvedDate: problem.solvedAt,
          isSolved: true,
          source: "sync",
          externalId: problem.externalId,
          notes: "",
        });
        created++;
      }
    }

    connection.lastSyncedAt = new Date();
    connection.lastSyncStatus = "success";
    connection.lastSyncMessage =
      `Synced ${uniqueProblems.size} Codeforces problems (${created} new, ${updated} updated).`;
    await connection.save();

    console.log(`Sync complete: ${created} created, ${updated} updated`);
    console.log('=== CODEFORCES SYNC ENDED ===');

    return res.status(200).json({
      success: true,
      message: "Codeforces sync completed.",
      stats: {
        fetched: submissions.length,
        solved: uniqueProblems.size,
        created,
        updated,
      },
    });

  } catch (error) {
    console.error('Codeforces Sync Error:', error);

    try {
      await PlatformConnection.findOneAndUpdate(
        {
          user: req.user._id,
          platform: "Codeforces",
        },
        {
          lastSyncStatus: "failed",
          lastSyncMessage: error.message || "Sync failed.",
        }
      );
    } catch (updateError) {
      console.error('Failed to update sync status:', updateError);
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Codeforces sync failed.",
    });
  }
};

// Sync LeetCode
export const syncLeetCode = async (req, res) => {
  try {
    console.log('=== LEETCODE SYNC STARTED ===');
    
    const connection = await PlatformConnection.findOne({
      user: req.user._id,
      platform: "LeetCode",
      connected: true,
    });

    if (!connection) {
      console.log('LeetCode not connected');
      return res.status(404).json({
        success: false,
        message: "LeetCode is not connected.",
      });
    }

    console.log(`Username: ${connection.username}`);

    const result = await syncLeetCodeProblems(connection.username);

    if (result.error) {
      console.log(`Sync error: ${result.error}`);
      connection.lastSyncedAt = new Date();
      connection.lastSyncStatus = "failed";
      connection.lastSyncMessage = result.error;
      await connection.save();

      return res.status(200).json({
        success: true,
        message: `LeetCode sync completed with issues: ${result.error}`,
        stats: {
          fetched: 0,
          created: 0,
          updated: 0,
          skipped: 0,
          error: result.error,
        },
      });
    }

    const { problems, fetched } = result;

    console.log(`Fetched ${fetched} problems from LeetCode`);

    if (fetched === 0) {
      connection.lastSyncedAt = new Date();
      connection.lastSyncStatus = "success";
      connection.lastSyncMessage = "No solved problems found on LeetCode.";
      await connection.save();

      return res.status(200).json({
        success: true,
        message: "LeetCode sync completed.",
        stats: {
          fetched: 0,
          created: 0,
          updated: 0,
          skipped: 0,
        },
      });
    }

    let created = 0;
    let updated = 0;

    for (const problem of problems) {
      console.log(`Processing: ${problem.title}`);
      
      const existing = await DSAProblem.findOne({
        user: req.user._id,
        platform: "LeetCode",
        externalId: problem.titleSlug,
      });

      if (existing) {
        console.log(`Updating existing: ${problem.title}`);
        existing.title = problem.title;
        existing.topic = problem.topic || 'Other';
        existing.difficulty = problem.difficulty || 'Medium';
        existing.problemLink = problem.problemLink;
        existing.isSolved = true;
        existing.source = "sync";
        if (problem.timestamp) {
          existing.solvedDate = new Date(problem.timestamp * 1000);
        }
        await existing.save();
        updated++;
      } else {
        console.log(`Creating new: ${problem.title}`);
        await DSAProblem.create({
          user: req.user._id,
          title: problem.title,
          topic: problem.topic || 'Other',
          difficulty: problem.difficulty || 'Medium',
          platform: "LeetCode",
          problemLink: problem.problemLink,
          solvedDate: problem.timestamp ? new Date(problem.timestamp * 1000) : new Date(),
          isSolved: true,
          source: "sync",
          externalId: problem.titleSlug,
          notes: "",
        });
        created++;
      }
    }

    connection.lastSyncedAt = new Date();
    connection.lastSyncStatus = "success";
    connection.lastSyncMessage = `Synced ${fetched} LeetCode problems (${created} new, ${updated} updated).`;
    await connection.save();

    console.log(`Sync complete: ${created} created, ${updated} updated`);
    console.log('=== LEETCODE SYNC ENDED ===');

    return res.status(200).json({
      success: true,
      message: "LeetCode sync completed.",
      stats: {
        fetched,
        created,
        updated,
        skipped: 0,
      },
    });
  } catch (error) {
    console.error('LeetCode Sync Error:', error);

    try {
      await PlatformConnection.findOneAndUpdate(
        {
          user: req.user._id,
          platform: "LeetCode",
        },
        {
          lastSyncStatus: "failed",
          lastSyncMessage: error.message || "Sync failed.",
        }
      );
    } catch (updateError) {
      console.error('Failed to update sync status:', updateError);
    }

    return res.status(500).json({
      success: false,
      message: error.message || "LeetCode sync failed.",
    });
  }
};