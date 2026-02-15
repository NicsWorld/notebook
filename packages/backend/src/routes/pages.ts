import { FastifyInstance } from "fastify";
import { eq, desc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { pages, knowledgeUnits, pageTags, tags } from "../db/schema.js";
import { saveUploadedFile, getImageUrl } from "../services/storage.service.js";
import { pageProcessingQueue } from "../jobs/queue.js";
import { pageListQuerySchema, pageIdParamSchema } from "../lib/zod-schemas.js";

export async function pageRoutes(app: FastifyInstance) {
    // Upload a new page image
    app.post("/api/pages/upload", async (request, reply) => {
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({ error: "No file uploaded" });
        }

        const buffer = await data.toBuffer();
        const ext = data.filename.split(".").pop() || "jpg";
        const filename = `${uuidv4()}.${ext}`;

        // Save file to disk
        const { url } = await saveUploadedFile(buffer, filename);

        // Create page record
        const [page] = await db
            .insert(pages)
            .values({
                imageUrl: url,
                status: "uploading",
            })
            .returning();

        // Update to processing and queue job
        await db
            .update(pages)
            .set({ status: "processing" })
            .where(eq(pages.id, page.id));

        await pageProcessingQueue.add("process-page", {
            pageId: page.id,
            filename,
        });

        return reply.status(201).send({
            id: page.id,
            status: "processing",
            imageUrl: url,
            message: "Page uploaded and queued for processing",
        });
    });

    // List all pages
    app.get("/api/pages", async (request, reply) => {
        const query = pageListQuerySchema.parse(request.query);

        const conditions = [];
        if (query.status) {
            conditions.push(eq(pages.status, query.status));
        }

        const result = await db.query.pages.findMany({
            where: query.status ? eq(pages.status, query.status) : undefined,
            orderBy: [desc(pages.createdAt)],
            limit: query.limit,
            offset: query.offset,
            with: {
                pageTags: {
                    with: {
                        tag: true,
                    },
                },
            },
        });

        const total = await db
            .select({ count: sql<number>`count(*)` })
            .from(pages);

        return reply.send({
            pages: result.map((p) => ({
                ...p,
                tags: p.pageTags.map((pt) => pt.tag),
                pageTags: undefined,
            })),
            total: Number(total[0].count),
            limit: query.limit,
            offset: query.offset,
        });
    });

    // Get page by ID with full details
    app.get("/api/pages/:id", async (request, reply) => {
        const { id } = pageIdParamSchema.parse(request.params);

        const page = await db.query.pages.findFirst({
            where: eq(pages.id, id),
            with: {
                knowledgeUnits: {
                    orderBy: [desc(knowledgeUnits.createdAt)],
                },
                pageTags: {
                    with: {
                        tag: true,
                    },
                },
            },
        });

        if (!page) {
            return reply.status(404).send({ error: "Page not found" });
        }

        return reply.send({
            ...page,
            tags: page.pageTags.map((pt) => pt.tag),
            pageTags: undefined,
        });
    });

    // Get page processing status (for polling)
    app.get("/api/pages/:id/status", async (request, reply) => {
        const { id } = pageIdParamSchema.parse(request.params);

        const page = await db.query.pages.findFirst({
            where: eq(pages.id, id),
            columns: {
                id: true,
                status: true,
                errorMessage: true,
                updatedAt: true,
            },
        });

        if (!page) {
            return reply.status(404).send({ error: "Page not found" });
        }

        return reply.send(page);
    });

    // Delete a page
    app.delete("/api/pages/:id", async (request, reply) => {
        const { id } = pageIdParamSchema.parse(request.params);

        const [deleted] = await db
            .delete(pages)
            .where(eq(pages.id, id))
            .returning({ id: pages.id });

        if (!deleted) {
            return reply.status(404).send({ error: "Page not found" });
        }

        return reply.send({ message: "Page deleted", id: deleted.id });
    });
}
