import { Request, Response } from "express";
import Problem from "../models/Problem.model";
import Submission from "../models/Submission.model";
import User from "../models/User.model";
import { reviewCode } from "../services/ai.service";
import { AuthRequest } from "../middlewares/auth.middleware";

// POST /api/submissions/submit
export const submitSolution = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { code, language, problemId, testResults, allPassed } = req.body;
    const userId = req.user?.userId;

    console.log("--- SUBMISSION REQUEST START ---");
    console.log("Incoming body:", req.body);
    console.log("Incoming problemId:", problemId);
    console.log("UserId:", userId);

    if (!code || !language || !problemId) {
      res
        .status(400)
        .json({
          success: false,
          message: "Code, language and problemId are required",
        });
      return;
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      res.status(404).json({ success: false, message: "Problem not found" });
      return;
    }

    console.log(`Submitting solution for: ${problem.title} by user: ${userId}`);
    console.log("Getting AI code review...");

    // Get AI code review
    const aiReview = await reviewCode(
      problem.title,
      problem.description,
      code,
      language,
      allPassed,
    );

    console.log("AI Review score:", aiReview.score);

    // Determine status
    const status = allPassed ? "accepted" : "wrong_answer";

    // Save submission to DB
    const submission = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status,
      testResults: testResults || [],
      aiReview,
      executionTime: 0,
    });

    // Update user stats if accepted
    if (allPassed && userId) {
  const user = await User.findById(userId)

  if (user) {
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    const lastActive = user.stats.lastActiveDate
      ? (() => {
          const d = new Date(user.stats.lastActiveDate)
          d.setHours(0, 0, 0, 0)
          return d
        })()
      : null

    let newStreak = user.stats.streak || 0

    if (!lastActive) {
      newStreak = 1
    } else {
      const diffDays = Math.round(
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      )
      console.log('diffDays:', diffDays, 'current streak:', newStreak)

      if (diffDays === 0) {
        // same day — keep streak
      } else if (diffDays === 1) {
        newStreak = newStreak + 1
      } else {
        newStreak = 1
      }
    }

    // Check if already solved this problem before (for unique count)
    const alreadySolved = await Submission.findOne({
      userId,
      problemId,
      status: 'accepted',
      _id: { $ne: submission._id },
    })

    // console.log('Already solved before:', !!alreadySolved)
    // console.log('New streak:', newStreak)

    // Use updateOne with dot notation for nested fields
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          'stats.lastActiveDate': now,
          'stats.streak': newStreak,
        },
        ...(!alreadySolved ? { $inc: { 'stats.problemsSolved': 1 } } : {}),
      }
    )

    // console.log('Stats updated successfully')
  }
}

    res.status(201).json({
      success: true,
      message: allPassed ? "Solution accepted! 🎉" : "Some test cases failed",
      data: {
        submission: {
          id: submission._id,
          status,
          aiReview,
          language,
          createdAt: submission.createdAt,
        },
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Submit solution error:", err.message);
    res.status(500).json({ success: false, message: "Submission failed" });
  }
};

// GET /api/submissions/problem/:problemId
export const getSubmissionsByProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const { problemId } = req.params

    const submissions = await Submission.find({ userId, problemId })
      .select('status language createdAt executionTime aiReview code')
      .sort({ createdAt: -1 })
      .limit(10)

    res.status(200).json({
      success: true,
      data: { submissions },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/submissions/me
export const getUserSubmissions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const submissions = await Submission.find({ userId })
      .populate("problemId", "title slug difficulty")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: { submissions },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/submissions/:id
export const getSubmissionById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user?.userId,
    }).populate("problemId", "title slug difficulty");

    if (!submission) {
      res.status(404).json({ success: false, message: "Submission not found" });
      return;
    }

    res.status(200).json({ success: true, data: { submission } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
