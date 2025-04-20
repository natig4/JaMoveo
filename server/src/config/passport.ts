import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import {
  getUserByUsername,
  getUserById,
  findOrCreateGoogleUser,
} from "../services/users.service";
import { comparePasswords } from "../utils/auth";
import config from "./index";

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  try {
    const user = getUserById(id);
    if (!user) {
      return done(null, false);
    }

    const { password, googleId, ...userWithoutSensitiveInfo } = user;
    done(null, userWithoutSensitiveInfo);
  } catch (error) {
    done(null, false);
  }
});

// Local strategy for username/password login
passport.use(
  new LocalStrategy(
    { usernameField: "username" },
    async (username, password, done) => {
      try {
        const user = getUserByUsername(username);

        if (!user) {
          return done(null, false, {
            message: "Incorrect username or password",
          });
        }

        // If user has no password (Google-only user), deny login
        if (!user.password) {
          return done(null, false, {
            message: "This account cannot use password login",
          });
        }

        const isMatch = await comparePasswords(password, user.password);

        if (!isMatch) {
          return done(null, false, {
            message: "Incorrect username or password",
          });
        }

        const { password: _, googleId, ...userWithoutSensitiveInfo } = user;
        return done(null, userWithoutSensitiveInfo);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: `${config.serverUrl}/auth/google/callback`,
      scope: ["profile", "email"],
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateGoogleUser({
          googleId: profile.id,
          username: profile.displayName || `user_${profile.id}`,
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName,
          imageUrl: profile.photos?.[0]?.value,
          role: "user",
        });

        const { password, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
