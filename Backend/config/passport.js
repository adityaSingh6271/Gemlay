import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Debugging logs to check if environment variables are loaded
console.log("Google Client ID:", process.env.GOOGLE_CLIENT_ID);
console.log("Google Client Secret:", process.env.GOOGLE_CLIENT_SECRET);
console.log("GitHub Client ID:", process.env.GITHUB_CLIENT_ID);
console.log("GitHub Client Secret:", process.env.GITHUB_CLIENT_SECRET);

// Ensure the required OAuth environment variables are set
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth environment variables");
}

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  throw new Error("Missing GitHub OAuth environment variables");
}

// Passport.js serialization
passport.serializeUser((user, done) => {
  console.log("Serializing user:", user);
  // Serialize the user by storing the user ID in the session
  done(null, user._id); // Or use `user.providerId` if you want to store the provider ID
});

// Passport.js deserialization
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log("Deserialized user:", user);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          providerId: profile.id,
          provider: "google",
        });

        // If the user does not exist, create a new one
        if (!user) {
          user = await User.create({
            providerId: profile.id,
            provider: "google",
            name: profile.displayName,
            email: profile.emails[0].value,
            profileImage: profile.photos[0].value,
          });
        }

        return done(null, user); // Pass the user to the next step (serializeUser)
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          providerId: profile.id,
          provider: "github",
        });

        // If the user does not exist, create a new one
        if (!user) {
          user = await User.create({
            providerId: profile.id,
            provider: "github",
            name: profile.username,
            email: profile.emails?.[0]?.value || "No public email", // GitHub may not always have a public email
            profileImage: profile.photos[0].value,
          });
        }

        return done(null, user); // Pass the user to the next step (serializeUser)
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
