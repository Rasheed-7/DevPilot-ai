import express from "express";
import passport from "passport";
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  googleCallback,
  setPassword,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===== Email/Password Routes =====
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.post("/logout", logoutUser);

// ===== Password Management Routes =====
router.post("/set-password", protect, setPassword);
router.post("/change-password", protect, changePassword);

// ===== Google OAuth Routes =====
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  googleCallback
);

// ===== Protected test route =====
router.get("/protected", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You are authenticated",
    user: req.user,
  });
});

export default router;