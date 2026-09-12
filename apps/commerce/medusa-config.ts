import { defineConfig, loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:9000",
      authCors: process.env.AUTH_CORS || "http://localhost:3000,http://localhost:9000",
      jwtSecret: process.env.JWT_SECRET || "change-me-before-production",
      cookieSecret: process.env.COOKIE_SECRET || "change-me-before-production"
    },
    workerMode: (process.env.WORKER_MODE as "shared" | "server" | "worker") || "shared"
  },
  modules: [{ resolve: "./src/modules/tcg-catalog" }]
})
