import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import "dotenv/config";

async function runMigrations() {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL || "postgresql://notebook:notebook@localhost:5432/notebook",
    });

    const client = await pool.connect();

    // Enable pgvector extension
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    console.log("✓ pgvector extension enabled");
    client.release();

    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("✓ Migrations complete");

    await pool.end();
    process.exit(0);
}

runMigrations().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
