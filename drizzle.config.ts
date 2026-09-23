import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema/*.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // biome-ignore lint: env read in config
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
