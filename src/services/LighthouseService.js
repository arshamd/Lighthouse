import { v4 as uuidv4 } from "uuid";
import { Worker } from "worker_threads";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LighthouseService {
  constructor(lighthouseRepository, queue, redis) {
    this.lighthouseRepository = lighthouseRepository;
    this.queue = queue; // Renamed for clarity
    this.redis = redis;
    this.setupQueue();
  }

  setupQueue() {
    this.queue.process(10, async (job) => {
      const { url, jobId } = job.data;
      try {
        console.log(`[LighthouseService] Processing job ${jobId} for URL: ${url}`);
        const seoDetails = await this.runWorker(url, jobId);
        const savedResult = await this.lighthouseRepository.saveAnalysis(seoDetails);
        console.log(`[LighthouseService] Job ${jobId} completed successfully.`);
        return { jobId, savedResult };
      } catch (error) {
        console.error(`[LighthouseService] Error processing job ${jobId}:`, error);
        throw error;
      }
    });

    this.queue.on("active", async (job) => {
      console.log(`[LighthouseService] Job ${job.data.jobId} is now active; it is being processed`);
      this.redis.publish("lighthouseStatus", JSON.stringify({ jobId: job.data.jobId, status: "in-progress" }));
    });

    this.queue.on("completed", (job, result) => {
      console.log(`[LighthouseService] Job ${job.id} completed successfully.`);
    });

    this.queue.on("failed", (job, err) => {
      console.log(`[LighthouseService] Job ${job.id} failed. Error: ${err.message}`);
    });

    this.queue.on("stalled", (job) => {
      console.warn(`[LighthouseService] Job ${job.id} stalled and is being reprocessed.`);
    });
  }

  async initiateAnalysis(url) {
    const jobId = uuidv4();
    console.log(`[LighthouseService] Initiating analysis for URL: ${url} with jobId: ${jobId}`);
    await this.queueAnalysis(url, jobId);
    return { jobId };
  }

  async queueAnalysis(url, jobId) {
    console.log(`[LighthouseService] Queuing job ${jobId} for URL: ${url}`);
    await this.queue.add({ url, jobId }, { removeOnComplete: true, removeOnFail: true });
  }

  async runWorker(url, jobId) {
    const workerPath = path.resolve(__dirname, "../workers/processLighthouse.js");
    const worker = new Worker(workerPath, {
      workerData: { url, jobId, env: process.env },
    });

    return new Promise((resolve, reject) => {
      worker.on("message", async (result) => {
        try {
          if (result.error) {
            console.error(`[LighthouseService] Worker error for job ${jobId}: ${result.error}`);
            await this.redis.publish("lighthouseStatus", JSON.stringify({ jobId, status: "failed", error: result.error }));
            reject(new Error(result.error));
          } else {
            console.log(`[LighthouseService] Worker completed job ${jobId}`);
            await this.redis.publish("lighthouseStatus", JSON.stringify({ jobId, status: "completed", result }));
            resolve(result);
          }
        } catch (err) {
          console.error(`[LighthouseService] Error handling worker message for job ${jobId}:`, err);
          reject(err);
        } finally {
          worker.terminate();
        }
      });

      worker.on("error", (error) => {
        console.error(`[LighthouseService] Worker error for job ${jobId}:`, error);
        reject(error);
      });

      worker.on("exit", (code) => {
        if (code !== 0) {
          console.error(`[LighthouseService] Worker stopped with exit code ${code} for job ${jobId}`);
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }
}
