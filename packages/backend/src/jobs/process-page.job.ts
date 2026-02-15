import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { pages, knowledgeUnits, tags, pageTags } from "../db/schema.js";
import { extractFromImage } from "../services/ai.service.js";
import { getUploadPath } from "../services/storage.service.js";
import { config } from "../config.js";

export interface ProcessPageJobData {
    pageId: string;
    filename: string;
}

export const pageWorker = new Worker<ProcessPageJobData>(
    "page-processing",
    async (job) => {
        const { pageId, filename } = job.data;
        console.log(`[Worker] Processing page ${pageId} (${filename})`);

        // Update status to processing
        await db
            .update(pages)
            .set({ status: "processing", updatedAt: new Date() })
            .where(eq(pages.id, pageId));

        try {
            // Run AI extraction
            const imagePath = getUploadPath(filename);
            const result = await extractFromImage(imagePath);

            // Update page with extracted content
            await db
                .update(pages)
                .set({
                    rawOcrText: result.rawOcrText,
                    cleanText: result.cleanText,
                    status: "completed",
                    updatedAt: new Date(),
                })
                .where(eq(pages.id, pageId));

            // Insert knowledge units
            if (result.knowledgeUnits.length > 0) {
                await db.insert(knowledgeUnits).values(
                    result.knowledgeUnits.map((unit) => ({
                        pageId,
                        type: unit.type,
                        content: unit.content,
                        metadata: unit.metadata || {},
                    }))
                );
            }

            // Insert tags and link to page
            for (const tagName of result.suggestedTags) {
                const normalizedTag = tagName.toLowerCase().trim();

                // Upsert tag
                const [tag] = await db
                    .insert(tags)
                    .values({ name: normalizedTag })
                    .onConflictDoNothing({ target: tags.name })
                    .returning();

                // Get existing tag if upsert was a no-op
                const existingTag = tag || (
                    await db.query.tags.findFirst({
                        where: eq(tags.name, normalizedTag),
                    })
                );

                if (existingTag) {
                    await db
                        .insert(pageTags)
                        .values({ pageId, tagId: existingTag.id })
                        .onConflictDoNothing();
                }
            }

            console.log(
                `[Worker] ✓ Page ${pageId} processed: ${result.knowledgeUnits.length} units, ${result.suggestedTags.length} tags`
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error(`[Worker] ✗ Page ${pageId} failed:`, errorMessage);

            await db
                .update(pages)
                .set({
                    status: "failed",
                    errorMessage,
                    updatedAt: new Date(),
                })
                .where(eq(pages.id, pageId));

            throw error; // BullMQ will retry
        }
    },
    {
        connection: {
            url: config.REDIS_URL,
            maxRetriesPerRequest: null,
        },
        concurrency: 2,
    }
);

pageWorker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
});

pageWorker.on("failed", (job, err) => {
    console.log(`[Worker] Job ${job?.id} failed: ${err.message} (attempt ${job?.attemptsMade}/${job?.opts.attempts})`);
});
