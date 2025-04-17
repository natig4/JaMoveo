import express, { Request, Response, NextFunction } from "express";
import { join } from "path";
import cors from "cors";
import helmet from "helmet";
import cookieSession from "cookie-session";
import passport from "./config/passport";
import config from "./config/index";
import { authRouter } from "./routes/auth.router";
import { songsRouter } from "./routes/songs.router";

const app = express();

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

app.use(
  cookieSession({
    name: "session",
    keys: [config.sessionSecret, config.sessionSecret2],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: config.nodeEnv === "production",
    httpOnly: true,
    sameSite: config.nodeEnv === "production" ? "none" : "lax",
  })
);

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = (cb: (err?: any) => void) => {
      cb();
    };
  }
  if (req.session && !req.session.save) {
    req.session.save = (cb: (err?: any) => void) => {
      cb();
    };
  }
  next();
});

app.use(passport.initialize());
app.use(passport.session());

// TODO: remember to remove it.
if (config.nodeEnv === "development") {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
    next();
  });
}

app.use("/auth", authRouter);
app.use("/song", songsRouter);

if (config.nodeEnv === "production") {
  app.use(express.static(join(__dirname, "../../client/dist")));

  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(join(__dirname, "../../client/dist/index.html"));
  });
}

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Resource not found",
  });
});

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = toErrorWithMessage(err);
  console.error("Error:", error);

  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: config.nodeEnv === "development" ? error.message : undefined,
  });
});

export default app;
