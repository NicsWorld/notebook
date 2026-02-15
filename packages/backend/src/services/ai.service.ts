import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { readFile } from "fs/promises";
import { config } from "../config.js";
import type { AIExtractionResult } from "../lib/zod-schemas.js";
import { aiExtractionResultSchema } from "../lib/zod-schemas.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

const EXTRACTION_PROMPT = `You are an expert at reading handwritten notebook pages and extracting structured information.

Analyze the provided image of a handwritten notebook page and return structured data.

Instructions:
1. **rawOcrText**: Transcribe ALL visible handwritten text exactly as written, preserving line breaks. Include crossed-out text in [brackets]. Include any doodles or diagrams as [diagram: brief description].
2. **cleanText**: Clean up the raw text — fix obvious spelling errors, normalize formatting, remove artifacts. Keep the meaning intact.
3. **knowledgeUnits**: Extract discrete units of knowledge. Each should be ONE of:
   - "task": An actionable to-do item (e.g., "Buy groceries", "Email John about project")
   - "idea": A creative thought, concept, or brainstorm (e.g., "App for tracking habits")
   - "note": Factual information, observation, or reference (e.g., "Meeting at 3pm", "API key: xyz")
   - "question": Something the writer wants to answer or research (e.g., "How does pgvector work?")
   - "action_item": A specific next step or follow-up (e.g., "Follow up with client by Friday")
4. **suggestedTags**: Suggest 2-6 relevant tags for the overall page content (e.g., "work", "project-alpha", "meeting-notes", "personal").

Be thorough — extract every meaningful piece of content. If the image is unclear or empty, return empty arrays and a note in cleanText.`;

const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        rawOcrText: { type: SchemaType.STRING, description: "Raw transcription of all handwritten text" },
        cleanText: { type: SchemaType.STRING, description: "Cleaned and normalized text" },
        knowledgeUnits: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    type: {
                        type: SchemaType.STRING,
                        enum: ["task", "idea", "note", "question", "action_item"],
                    },
                    content: { type: SchemaType.STRING, description: "The extracted content" },
                },
                required: ["type", "content"],
            },
        },
        suggestedTags: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
        },
    },
    required: ["rawOcrText", "cleanText", "knowledgeUnits", "suggestedTags"],
};

export async function extractFromImage(imagePath: string): Promise<AIExtractionResult> {
    if (!config.GEMINI_API_KEY) {
        throw new Error(
            "GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com and add it to your .env file."
        );
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
        },
    });

    const imageData = await readFile(imagePath);
    const base64Image = imageData.toString("base64");
    const mimeType = getMimeType(imagePath);

    const result = await model.generateContent([
        EXTRACTION_PROMPT,
        {
            inlineData: {
                mimeType,
                data: base64Image,
            },
        },
    ]);

    const response = result.response;
    const text = response.text();
    const parsed = JSON.parse(text);

    return aiExtractionResultSchema.parse(parsed);
}

function getMimeType(filePath: string): string {
    const ext = filePath.toLowerCase().split(".").pop();
    const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        heic: "image/heic",
        heif: "image/heif",
    };
    return mimeTypes[ext || ""] || "image/jpeg";
}
