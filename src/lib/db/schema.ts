import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  jsonb,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ============================================================
 * Auth.js (next-auth) — schema padrão do Drizzle adapter
 * ============================================================ */
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ============================================================
 * Catálogo de vagas (sem PII de recrutador)
 * ============================================================ */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull(), // greenhouse|lever|ashby|jsearch|adzuna|jooble|linkedin|gupy|...
    sourceJobId: text("source_job_id").notNull(),
    applyUrl: text("apply_url").notNull(),
    company: text("company").notNull(),
    title: text("title").notNull(),
    titleNorm: text("title_norm").notNull(),
    locationUf: text("location_uf"), // sigla UF, "remoto" ou null/unknown
    locationCity: text("location_city"),
    remoteFlag: boolean("remote_flag").default(false).notNull(),
    employmentType: text("employment_type").notNull().default("unknown"), // estagio|trainee|efetivo|unknown
    seniority: text("seniority").notNull().default("unknown"), // junior|pleno|senior|unknown
    snippet: text("snippet"), // <= 100 palavras, com link-out (nunca descrição integral)
    cineArea: text("cine_area"),
    status: text("status").notNull().default("active"), // active|closed|unknown
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastValidatedAt: timestamp("last_validated_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    dedupClusterId: text("dedup_cluster_id"),
    confidence: text("confidence").notNull().default("low"), // high|low
    collectedAt: timestamp("collected_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("jobs_source_unique").on(t.source, t.sourceJobId),
    index("jobs_location_idx").on(t.locationUf),
    index("jobs_type_idx").on(t.employmentType),
    index("jobs_area_idx").on(t.cineArea),
    index("jobs_status_idx").on(t.status),
  ],
);

/* ============================================================
 * Perfil/CV do dono — privado, atrás do login; apagável
 * ============================================================ */
export const profile = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull(), // CV estruturado por campos
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ============================================================
 * Vagas já alertadas no digest diário (evita repetir)
 * ============================================================ */
export const seenJobs = pgTable(
  "seen_jobs",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    notifiedAt: timestamp("notified_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.jobId] })],
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
