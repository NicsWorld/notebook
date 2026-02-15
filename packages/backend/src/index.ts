import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { resolve } from "path";
import { config } from "./config.js";
import { pageRoutes } from "./routes/pages.js";
import { knowledgeUnitRoutes } from "./routes/knowledge-units.js";
import { tagRoutes } from "./routes/tags.js";
import { ensureUploadDir } from "./services/storage.service.js";

// Import worker to start it
import "./jobs/process-page.job.js";

const app = Fastify({
    logger: {
        level: "info",
        transport: {
            target: "pino-pretty",
            options: { colorize: true },
        },
    },
});

async function start() {
    // Plugins
    await app.register(cors, {
        origin: config.FRONTEND_URL,
        credentials: true,
    });

    await app.register(multipart, {
        limits: {
            fileSize: 20 * 1024 * 1024, // 20MB max
        },
    });

    // Serve uploaded images
    await ensureUploadDir();
    await app.register(fastifyStatic, {
        root: resolve(config.UPLOAD_DIR),
        prefix: "/uploads/",
        decorateReply: false,
    });

    // Routes
    await app.register(pageRoutes);
    await app.register(knowledgeUnitRoutes);
    await app.register(tagRoutes);

    // Health check
    app.get("/api/health", async () => ({
        status: "ok",
        timestamp: new Date().toISOString(),
    }));

    // Start server
    await app.listen({ port: config.PORT, host: "0.0.0.0" });
    console.log(`
╔══════════════════════════════════════════╗
║   📓 Notebook Digitizer API             ║
║   Running on http://localhost:${config.PORT}     ║
╚══════════════════════════════════════════╝
  `);
}

start().catch((err) => {
    app.log.error(err);
    process.exit(1);
});
