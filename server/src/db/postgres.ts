import { Pool, QueryResult, QueryResultRow } from "pg";
import { env } from "../config/env";

let pool: Pool | null = null;

export function isPostgresConfigured() {
  return Boolean(env.databaseUrl);
}

function getPostgresPool() {
  if (!isPostgresConfigured()) {
    return null;
  }

  if (!pool) {
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

  try {
    return await postgresPool.query<T>(text, params);
  } catch (error) {
    console.error(
      "PostgreSQL query skipped after failure:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
