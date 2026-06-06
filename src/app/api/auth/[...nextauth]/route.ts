import { handlers } from "@/auth";

// authorize() usa node:crypto (scrypt) via verifyPassword → exige runtime Node, não edge.
export const runtime = "nodejs";
export const { GET, POST } = handlers;
