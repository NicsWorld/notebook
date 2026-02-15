import { FastifyInstance } from "fastify";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { knowledgeUnits, pages } from "../db/schema.js";
import { knowledgeUnitQuerySchema } from "../lib/zod-schemas.js";

export async function knowledgeUnitRoutes(app: FastifyInstance) {
    // List all knowledge units with optional type filter
    app.get("/api/knowledge-units", async (request, reply) => {
        const query = knowledgeUnitQuerySchema.parse(request.query);

        const result = await db.query.knowledgeUnits.findMany({
            where: query.type ? eq(knowledgeUnits.type, query.type) : undefined,
            orderBy: [desc(knowledgeUnits.createdAt)],
            limit: query.limit,
            offset: query.offset,
            with: {
                page: {
                    columns: {
                        id: true,
                        imageUrl: true,
                        createdAt: true,
                    },
                },
            },
        });

        const countCondition = query.type
            ? eq(knowledgeUnits.type, query.type)
            : undefined;

        const total = await db
            .select({ count: sql<number>`count(*)` })
            .from(knowledgeUnits)
            .where(countCondition);

        return reply.send({
            knowledgeUnits: result,
            total: Number(total[0].count),
            limit: query.limit,
            offset: query.offset,
        });
    });
}
