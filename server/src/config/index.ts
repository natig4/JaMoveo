interface Config {
  port: number;
  nodeEnv: string;
  dataPath: string;
  clientUrl: string;
  corsOrigin: string[];
}

const development: Config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: "development",
  dataPath: process.env.DATA_PATH || "./data/dev",
  clientUrl: "http://localhost:5173",
  corsOrigin: ["http://localhost:5173"],
};

const production: Config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: "production",
  dataPath: process.env.DATA_PATH || "./data/prod",
  clientUrl: process.env.CLIENT_URL || "https://jamoveo.example.com",
  corsOrigin: [process.env.CLIENT_URL || "https://jamoveo.example.com"],
};

const env = process.env.NODE_ENV || "development";
const config: Record<string, Config> = {
  development,
  production,
};

export default config[env];
