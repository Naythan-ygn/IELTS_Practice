import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["node:sqlite", "@libsql/client"],
  outputFileTracingIncludes: { "/**": ["./db/migrations/*.sql"] },
  devIndicators: false,
};
export default config;
