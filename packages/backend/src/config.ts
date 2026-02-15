import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

const envSchema = z.object({
    DATABASE_URL: z.string().default("postgresql://notebook:notebook@localhost:5432/notebook"),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    GEMINI_API_KEY: z.string().default(""),
    UPLOAD_DIR: z.string().default("./uploads"),
    STORAGE_MODE: z.enum(["local", "s3"]).default("local"),
    PORT: z.coerce.number().default(3001),
    FRONTEND_URL: z.string().default("http://localhost:5173"),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
