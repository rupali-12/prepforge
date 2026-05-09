import { Server, Socket } from "socket.io";
import Session from "../models/Session.model";
import Problem from "../models/Problem.model";
import User from "../models/User.model";
import { generateInterviewResponse } from "../services/ai.service";
import { verifyAccessToken } from "../utils/jwt.utils";

interface AuthSocket extends Socket {
  userId?: string;
  userName?: string;
}

export const setupInterviewSocket = (io: Server) => {
  // Auth middleware for socket connections
  io.use((socket: AuthSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.userName = decoded.email;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthSocket) => {
    console.log(`Socket connected: ${socket.id} | User: ${socket.userId}`);

    // ── Join session room ─────────────────────────────
    socket.on(
      "interview:join",
      async ({ sessionId }: { sessionId: string }) => {
        try {
          const session =
            await Session.findById(sessionId).populate("problemId");

          if (!session) {
            socket.emit("interview:error", { message: "Session not found" });
            return;
          }

          if (session.userId.toString() !== socket.userId) {
            socket.emit("interview:error", { message: "Unauthorized" });
            return;
          }

          socket.join(sessionId);
          console.log(`User ${socket.userId} joined session ${sessionId}`);

          // Send session data back to client
          socket.emit("interview:joined", {
            session: {
              id: session._id,
              status: session.status,
              duration: session.duration,
              transcript: session.transcript,
              startedAt: session.startedAt,
            },
          });

          // If new session — send opening message from AI
          if (session.transcript.length === 0) {
            const problem = session.problemId as unknown as {
              title: string;
              description: string;
              difficulty: string;
            };

            const openingMessage = `Hello! I'm your interviewer today. Let's get started.

I'd like you to solve the following problem:

**${problem.title}** (${problem.difficulty})

${problem.description}

Take a moment to read through it carefully. When you're ready, please start by sharing your initial thoughts — what's your first instinct about how to approach this problem? Don't worry about having the perfect solution right away; I'm interested in how you think through problems.`;

            // Save opening message to transcript
            await Session.findByIdAndUpdate(sessionId, {
              $push: {
                transcript: {
                  role: "assistant",
                  content: openingMessage,
                  timestamp: new Date(),
                },
              },
            });

            socket.emit("interview:message", {
              role: "assistant",
              content: openingMessage,
              timestamp: new Date(),
            });
          }
        } catch (error) {
          console.error("interview:join error:", error);
          socket.emit("interview:error", { message: "Failed to join session" });
        }
      },
    );

    // ── User sends message ────────────────────────────
    socket.on(
      "interview:send_message",
      async ({
        sessionId,
        message,
        code,
      }: {
        sessionId: string;
        message: string;
        code: string;
      }) => {
        try {
          const session =
            await Session.findById(sessionId).populate("problemId");

          if (!session) {
            socket.emit("interview:error", { message: "Session not found" });
            return;
          }

          const problem = session.problemId as unknown as {
            title: string;
            description: string;
            difficulty: string;
          };

          // Save user message
          await Session.findByIdAndUpdate(sessionId, {
            $push: {
              transcript: {
                role: "user",
                content: message,
                timestamp: new Date(),
              },
            },
          });

          // Show AI is typing
          // Show AI is typing
          socket.emit("interview:typing", { isTyping: true });

          console.log("Getting AI interview response...");
          console.log("User message:", message);

          // Get AI response
          const conversationHistory = session.transcript.map((t) => ({
            role: t.role,
            content: t.content,
          }));

          const aiResponse = await generateInterviewResponse(
            problem.title,
            problem.description,
            conversationHistory,
            message,
            code || "",
          );

          console.log("AI response generated:", aiResponse.substring(0, 100));

          // Save AI response
          await Session.findByIdAndUpdate(sessionId, {
            $push: {
              transcript: {
                role: "assistant",
                content: aiResponse,
                timestamp: new Date(),
              },
            },
          });

          socket.emit("interview:typing", { isTyping: false });

          // In interview.socket.ts — this emits user message back:
          socket.emit("interview:message", {
            role: "user",
            content: message,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("interview:send_message error:", error);
          socket.emit("interview:typing", { isTyping: false });
          socket.emit("interview:message", {
            role: "assistant",
            content:
              "I apologize, I'm having a brief technical issue. Please continue with your explanation — I'm listening.",
            timestamp: new Date(),
          });
        }
      },
    );

    // ── End session ───────────────────────────────────
    socket.on(
      "interview:end",
      async ({
        sessionId,
        finalCode,
      }: {
        sessionId: string;
        finalCode: string;
      }) => {
        try {
          const session =
            await Session.findById(sessionId).populate("problemId");
          if (!session) return;

          const problem = session.problemId as unknown as {
            title: string;
            description: string;
            difficulty: string;
          };

          socket.emit("interview:evaluating", {
            message: "Evaluating your performance...",
          });

          // Generate final evaluation
          const evalPrompt = `You are evaluating a technical interview performance.

Problem: ${problem.title}
${problem.description}

Full interview transcript:
${session.transcript.map((t) => `${t.role === "user" ? "Candidate" : "Interviewer"}: ${t.content}`).join("\n\n")}

Final code submitted:
\`\`\`
${finalCode || "No code submitted"}
\`\`\`

Evaluate the candidate on these 4 dimensions (0-100 each):
1. Problem Understanding — Did they understand the problem correctly?
2. Approach Quality — Was their algorithmic approach sound?
3. Code Quality — Is the code clean, correct, efficient?
4. Communication — Did they explain their thinking clearly?

Respond with ONLY valid JSON:
{
  "scores": {
    "overall": <average of all 4>,
    "problemUnderstanding": <0-100>,
    "approachQuality": <0-100>,
    "codeQuality": <0-100>,
    "communication": <0-100>
  },
  "summary": "<3-4 sentences overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"],
  "verdict": "<Hire / Consider / No Hire>"
}`;

          let scores = {
            overall: 60,
            problemUnderstanding: 60,
            approachQuality: 60,
            codeQuality: 60,
            communication: 60,
          };
          let summary = "Interview completed. Good effort overall.";
          let strengths = [
            "Participated in the interview",
            "Attempted the problem",
          ];
          let improvements = [
            "Practice more problems",
            "Work on communication",
            "Focus on edge cases",
          ];
          let verdict = "Consider";

          try {
            const { generateWithRetry } =
              await import("../services/ai.service");
            const evalText = await generateWithRetry(evalPrompt);
            const cleaned = evalText
              .replace(/```json/gi, "")
              .replace(/```/g, "")
              .trim();
            const evalResult = JSON.parse(cleaned);
            scores = evalResult.scores;
            summary = evalResult.summary;
            strengths = evalResult.strengths;
            improvements = evalResult.improvements;
            verdict = evalResult.verdict;
          } catch {
            console.log("Evaluation AI failed — using fallback scores");
          }

          // Update session in DB
          await Session.findByIdAndUpdate(sessionId, {
            status: "completed",
            finalCode,
            scores,
            aiSummary: summary,
            completedAt: new Date(),
          });

          // Update user mock interview count
          await User.findByIdAndUpdate(socket.userId, {
            $inc: { "stats.mockInterviews": 1 },
          });

          socket.emit("interview:completed", {
            scores,
            summary,
            strengths,
            improvements,
            verdict,
          });
        } catch (error) {
          console.error("interview:end error:", error);
          socket.emit("interview:error", { message: "Failed to end session" });
        }
      },
    );

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
