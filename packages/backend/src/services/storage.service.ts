import { mkdir } from "fs/promises";
import { join, resolve } from "path";
import { config } from "../config.js";

const uploadsDir = resolve(config.UPLOAD_DIR);

export async function ensureUploadDir(): Promise<void> {
    await mkdir(uploadsDir, { recursive: true });
}

export function getUploadPath(filename: string): string {
    return join(uploadsDir, filename);
}

export function getImageUrl(filename: string): string {
    if (config.STORAGE_MODE === "s3") {
        // Future: return S3/R2 URL
        return `https://your-bucket.r2.cloudflarestorage.com/${filename}`;
    }
    return `/uploads/${filename}`;
}

export async function saveUploadedFile(
    buffer: Buffer,
    filename: string
): Promise<{ path: string; url: string }> {
    await ensureUploadDir();
    const filePath = getUploadPath(filename);
    const { writeFile } = await import("fs/promises");
    await writeFile(filePath, buffer);
    return {
        path: filePath,
        url: getImageUrl(filename),
    };
}
