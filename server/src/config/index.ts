interface Config {
  port: number;
  nodeEnv: string;
  dataPath: string;
  clientUrl: string;
  corsOrigin: string[];
}

const isVercel = !!process.env.VERCEL;

const development: Config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: "development",
  dataPath: process.env.DATA_PATH || "./data",
  clientUrl: "http://localhost:5173",
  corsOrigin: ["http://localhost:5173"],
};

const production: Config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: "production",
  dataPath: process.env.DATA_PATH || (isVercel ? "/tmp" : "./data"),
  clientUrl: process.env.CLIENT_URL || "https://jamoveo-8qpb.onrender.com/",
  corsOrigin: ["*"],
};

const env = process.env.NODE_ENV || "development";
const config: Record<string, Config> = {
  development,
  production,
};

export default config[env];
