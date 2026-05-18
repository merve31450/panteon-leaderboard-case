import { Pool, QueryResult, QueryResultRow } from "pg";
import { env } from "../config/env";

let pool: Pool | null = null;
let loggedPostgresTarget = false;

export function isPostgresConfigured() {
  return Boolean(env.databaseUrl);
}

export function getPostgresTarget() {
  if (!env.databaseUrl) {
    return "unconfigured";
  }

  try {
    const url = new URL(env.databaseUrl);
    return `${url.hostname}:${url.port || "5432"}/${url.pathname.replace("/", "")}`;
  } catch {
    return "configured";
  }
}

function getPostgresPool() {
  if (!isPostgresConfigured()) {
    return null;
  }

  if (!pool) {
    if (!loggedPostgresTarget) {
      console.log(`PostgreSQL persistence target: ${getPostgresTarget()}`);
      loggedPostgresTarget = true;
    }

    pool = new Pool({
      connectionString: env.databaseUrl
    });

    pool.on("error", (error) => {
      console.error("PostgreSQL pool error:", error.message);
    });
  }

  return pool;
}

export async function queryPostgres<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T> | null> {
  const postgresPool = getPostgresPool();

  if (!postgresPool) {
    return null;
  }

  return postgresPool.query<T>(text, params);
}
