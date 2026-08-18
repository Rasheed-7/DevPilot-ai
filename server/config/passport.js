import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log("========== GOOGLE STRATEGY ==========");
        
        if (!profile.emails || profile.emails.length === 0) {
          return done(new Error("No email found in Google profile"), null);
        }

        const email = profile.emails[0].value;
        console.log("Email from Google:", email);

        //Check if user exists with this email
        let user = await User.findOne({ email });

        if (user) {
          console.log("Existing user found:");
          console.log("  - Has Google ID:", user.googleId ? "Yes" : "No");
          console.log("  - Has Password:", user.password ? "Yes" : "No");

          if (!user.googleId) {
            console.log("Linking Google account to existing user...");
            user.googleId = profile.id;
            if (profile.photos && profile.photos.length > 0) {
              user.profilePicture = profile.photos[0].value || user.profilePicture;
            }
            await user.save();
            console.log("Google account linked successfully!");
          } else {
            console.log("Google account already linked");
          }
          
          return done(null, { user });
        }

        console.log("Creating new user from Google data...");
        const newUser = await User.create({
          googleId: profile.id,
          name: profile.displayName || email.split("@")[0],
          email: email,
          password: null, // No password – Google-only
          profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "",
        });

        console.log("New user created:", newUser.email);
        console.log("========== GOOGLE STRATEGY END ==========");
        return done(null, { user: newUser });
      } catch (error) {
        console.error("Google Strategy Error:", error);
        return done(error, null);
      }
    }
  )
);

export default passport;