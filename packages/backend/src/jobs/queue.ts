import { Queue, Worker } from "bullmq";
import { config } from "../config.js";

export const pageProcessingQueue = new Queue("page-processing", {
    connection: {
        url: config.REDIS_URL,
        maxRetriesPerRequest: null,
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
    },
});

export { Worker };
