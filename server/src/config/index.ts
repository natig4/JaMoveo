interface Config {
  port: number;
  nodeEnv: string;
  dataPath: string;
  clientUrl: string;
  serverUrl: string;
  corsOrigin: string[] | boolean;
  sessionSecret: string;
  sessionSecret2: string;
  googleClientId: string;
  googleClientSecret: string;
  useHttps: boolean;
}

const development: Config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: "development",
  dataPath: process.env.DATA_PATH || "./data",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  serverUrl: process.env.SERVER_URL || "https://localhost:8000",
  corsOrigin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://localhost:8000",
    "http://localhost:8000",
  ],
  sessionSecret: process.env.SESSION_SECRET || "jamoveo-secret-key-1",
  sessionSecret2: process.env.SESSION_SECRET2 || "jamoveo-secret-key-2",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  useHttps: process.env.USE_HTTPS === "true",
};

const production: Config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: "production",
  dataPath: process.env.DATA_PATH || "./data",
  clientUrl: process.env.CLIENT_URL || "https://jamoveo-8qpb.onrender.com",
  serverUrl: process.env.SERVER_URL || "https://jamoveo-8qpb.onrender.com",
  corsOrigin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [
        "https://jamoveo-8qpb.onrender.com",
        "https://jamoveo-production-13d0.up.railway.app",
      ],
  sessionSecret: process.env.SESSION_SECRET || "replace-with-secure-secret-1",
  sessionSecret2: process.env.SESSION_SECRET2 || "replace-with-secure-secret-2",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  useHttps: false,
};

const env = process.env.NODE_ENV || "development";
const config: Record<string, Config> = {
  development,
  production,
};

export default config[env];
