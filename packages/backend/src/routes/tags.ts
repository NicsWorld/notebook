import { FastifyInstance } from "fastify";
import { desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { tags } from "../db/schema.js";

export async function tagRoutes(app: FastifyInstance) {
    // List all tags
    app.get("/api/tags", async (_request, reply) => {
        const result = await db.query.tags.findMany({
            orderBy: [desc(tags.createdAt)],
        });

        return reply.send({ tags: result });
    });
}
