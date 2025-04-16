import express, { Request, Response, NextFunction } from "express";
import { join } from "path";
import cors from "cors";
import config from "./config/index";
import { usersRouter } from "./routes/users.router";
import { songsRouter } from "./routes/songs.router";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: config.corsOrigin,
  })
);

// TODO: remember to remove it once I finish
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

app.use("/user", usersRouter);
app.use("/song", songsRouter);

if (config.nodeEnv === "production") {
  app.use(express.static(join(__dirname, "../../client/dist")));

  app.get("*", (req: Request, res: Response) => {
    res.sendFile(join(__dirname, "../../client/dist/index.html"));
  });
}

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Resource not found",
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
