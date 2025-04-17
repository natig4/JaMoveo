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

if (config.nodeEnv === "production") {
  app.use(helmet());
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
}

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

if (config.nodeEnv === "development") {
  // In development, we need to proxy to the Vite dev server
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    // Skip API routes
    if (req.url.startsWith("/auth") || req.url.startsWith("/song")) {
      return next();
    }

    // Try to serve from client/dist if it exists
    const clientDistPath = join(__dirname, "../../client/dist");
    const indexPath = join(clientDistPath, "index.html");

    try {
      if (require("fs").existsSync(indexPath)) {
        if (req.url === "/" || !req.url.includes(".")) {
          return res.sendFile(indexPath);
        } else {
          const filePath = join(clientDistPath, req.url);
          return res.sendFile(filePath, (err) => {
            if (err) {
              // If file not found, serve index.html for SPA routing
              return res.sendFile(indexPath);
            }
          });
        }
      } else {
        // No dist folder, redirect to client dev server
        console.log(
          `Redirecting ${req.url} to client dev server at ${config.clientUrl}`
        );
        return res.redirect(`${config.clientUrl}${req.url}`);
      }
    } catch (err) {
      console.error("Error serving client files:", err);
      return res.redirect(`${config.clientUrl}${req.url}`);
    }
  });
} else {
  const clientDistPath = join(__dirname, "../../client/dist");
  app.use(express.static(clientDistPath));

  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(join(clientDistPath, "index.html"));
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

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: config.nodeEnv === "development" ? err.message : undefined,
  });
});

export default app;
