import { z } from "zod";

const envSchema = z.object({
  VITE_APP_TITLE: z.string().min(1).default("Admin Template"),
  VITE_API_BASE_URL: z.string().min(1).default("/api"),
});

export const env = envSchema.parse(import.meta.env);
