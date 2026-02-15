import { z } from "zod";

// ── AI extraction response schema ────────────────────────────────────
export const knowledgeUnitSchema = z.object({
    type: z.enum(["task", "idea", "note", "question", "action_item"]),
    content: z.string(),
    metadata: z.record(z.unknown()).optional(),
});

export const aiExtractionResultSchema = z.object({
    rawOcrText: z.string(),
    cleanText: z.string(),
    knowledgeUnits: z.array(knowledgeUnitSchema),
    suggestedTags: z.array(z.string()),
});

export type AIExtractionResult = z.infer<typeof aiExtractionResultSchema>;
export type KnowledgeUnitInput = z.infer<typeof knowledgeUnitSchema>;

// ── API request/response schemas ─────────────────────────────────────
export const pageListQuerySchema = z.object({
    status: z.enum(["uploading", "processing", "completed", "failed"]).optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
});

export const pageIdParamSchema = z.object({
    id: z.string().uuid(),
});

export const knowledgeUnitQuerySchema = z.object({
    type: z.enum(["task", "idea", "note", "question", "action_item"]).optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
});
