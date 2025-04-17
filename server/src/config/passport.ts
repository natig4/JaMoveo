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
      return done(new Error("User not found"), null);
    }

    const { password, ...userWithoutPassword } = user;
    done(null, userWithoutPassword);
  } catch (error) {
    done(error, null);
  }
});

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

        const isMatch = await comparePasswords(password, user.password || "");

        if (!isMatch) {
          return done(null, false, {
            message: "Incorrect username or password",
          });
        }

        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    }
  )
);
console.log("config", config);

passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: `${config.serverUrl}/auth/google/callback`,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateGoogleUser({
          googleId: profile.id,
          username: profile.displayName || `user_${profile.id}`,
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName,
          role: "user",
        });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
