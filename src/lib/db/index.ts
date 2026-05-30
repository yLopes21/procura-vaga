import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { requireEnv } from "@/lib/env";
import * as schema from "./schema";

const sql = neon(requireEnv("DATABASE_URL"));

export const db = drizzle(sql, { schema });
export { schema };
