import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { parse } from "pg-connection-string";

const DATABASE_URL = process.env.DATABASE_URL;
const prisma = new PrismaClient();
let pgPool = null;

function parseDbUrl(url) {
  const config = parse(url);
  return {
    host: config.host || "localhost",
    port: parseInt(config.port || "5432"),
    database: config.database || "neondb",
    user: config.user || "neondb_owner",
    password: config.password || "",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  };
}

function getPool() {
  if (!pgPool) {
    pgPool = new pg.Pool(parseDbUrl(DATABASE_URL));
  }
  return pgPool;
}

async function pgQuery(sql, params = []) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
  ]);
}

const prismaProxy = new Proxy(prisma, {
  get(target, prop) {
    if (prop === "$connect") return target.$connect.bind(target);
    if (prop === "$disconnect") {
      return async () => {
        try { await target.$disconnect(); } catch {}
        if (pgPool) await pgPool.end().catch(() => {});
      };
    }
    if (prop === "$on") return target.$on.bind(target);
    if (prop === "$use") return target.$use.bind(target);

    const model = target[prop];
    if (!model) return undefined;

    return new Proxy(model, {
      get(modelTarget, method) {
        const prismaMethod = modelTarget[method];
        if (!prismaMethod) return undefined;

        return async (...args) => {
          try {
            return await withTimeout(prismaMethod(...args), 3000);
          } catch (err) {
            if (
              err?.message?.includes?.("Can't reach database server") ||
              err?.message === "TIMEOUT"
            ) {
              return pgFallback(prop, method, args[0]);
            }
            throw err;
          }
        };
      },
    });
  },
});

function buildSelect(table, where) {
  const conditions = [];
  const params = [];
  let idx = 1;

  for (const [key, val] of Object.entries(where || {})) {
    if (val === undefined || val === null) continue;
    if (val && typeof val === "object" && "in" in val && Array.isArray(val.in)) {
      if (val.in.length === 0) { conditions.push("FALSE"); continue; }
      const placeholders = val.in.map(() => `$${idx++}`).join(",");
      conditions.push(`"${key}" IN (${placeholders})`);
      params.push(...val.in);
    } else if (val && typeof val === "object" && "not" in val) {
      conditions.push(`"${key}" != $${idx++}`);
      params.push(val.not);
    } else if (val && typeof val === "object" && "contains" in val) {
      conditions.push(`"${key}"::text ILIKE $${idx++}`);
      params.push(`%${val.contains}%`);
    } else if (val && typeof val === "object" && "startsWith" in val) {
      conditions.push(`"${key}"::text ILIKE $${idx++}`);
      params.push(`${val.startsWith}%`);
    } else {
      conditions.push(`"${key}" = $${idx++}`);
      params.push(val);
    }
  }
  return { conditions, params };
}

function buildOrderBy(orderBy) {
  if (!orderBy) return "";
  const orders = Object.entries(orderBy).map(([k, v]) => `"${k}" ${v === "desc" ? "DESC" : "ASC"}`);
  return orders.length ? `ORDER BY ${orders.join(", ")}` : "";
}

async function pgFallback(model, method, args) {
  const tableMap = {
    user: '"User"',
    scraperSource: '"ScraperSource"',
    application: '"Application"',
    scholarship: '"Scholarship"',
    document: '"Document"',
    activityLog: '"ActivityLog"',
    scrapedOpportunity: '"ScrapedOpportunity"',
    analyticsSnapshot: '"AnalyticsSnapshot"',
  };

  const table = tableMap[model];
  if (!table) throw new Error(`Unknown model: ${model}`);

  if (method === "findMany" || method === "findFirst") {
    const { conditions, params } = buildSelect(table, args?.where);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = buildOrderBy(args?.orderBy);
    const limit = args?.take ? `LIMIT ${args.take}` : "";
    const offset = args?.skip ? `OFFSET ${args.skip}` : "";
    const sql = `SELECT * FROM ${table} ${whereClause} ${orderClause} ${limit} ${offset}`;
    const rows = await pgQuery(sql, params);
    return method === "findFirst" ? (rows[0] || null) : rows;
  }

  if (method === "findUnique") {
    const { conditions, params } = buildSelect(table, args?.where);
    if (!conditions.length) return null;
    const sql = `SELECT * FROM ${table} WHERE ${conditions.join(" AND ")} LIMIT 1`;
    const rows = await pgQuery(sql, params);
    return rows[0] || null;
  }

  if (method === "count") {
    const { conditions, params } = buildSelect(table, args?.where);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT COUNT(*)::int as count FROM ${table} ${whereClause}`;
    const rows = await pgQuery(sql, params);
    return parseInt(rows[0]?.count || "0");
  }

  if (method === "create") {
    const data = args?.data || {};
    const keys = Object.keys(data);
    const cols = keys.map((k) => `"${k}"`).join(", ");
    const vals = [];
    const params = [];
    let idx = 1;
    for (const key of keys) {
      const v = data[key];
      if (v === undefined) continue;
      vals.push(`$${idx++}`);
      params.push(v);
    }
    const sql = `INSERT INTO ${table} (${cols}) VALUES (${vals.join(", ")}) RETURNING *`;
    const rows = await pgQuery(sql, params);
    return rows[0];
  }

  if (method === "update") {
    const where = args?.where || {};
    const data = args?.data || {};
    const setClauses = [];
    const whereClauses = [];
    const params = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { setClauses.push(`"${key}" = $${idx++}`); params.push(val); }
    }
    for (const [key, val] of Object.entries(where)) {
      whereClauses.push(`"${key}" = $${idx++}`);
      params.push(val);
    }

    const sql = `UPDATE ${table} SET ${setClauses.join(", ")} WHERE ${whereClauses.join(" AND ")} RETURNING *`;
    const rows = await pgQuery(sql, params);
    return rows[0];
  }

  if (method === "delete") {
    const { conditions, params } = buildSelect(table, args?.where);
    const sql = `DELETE FROM ${table} WHERE ${conditions.join(" AND ")} RETURNING *`;
    const rows = await pgQuery(sql, params);
    return rows[0];
  }

  throw new Error(`Unsupported PG fallback: ${model}.${method}`);
}

export default prismaProxy;
