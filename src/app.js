import express from "express";
import { LighthouseService } from "./services/LighthouseService.js";
import { LighthouseController } from "./api/controllers/LighthouseController.js";
import { LighthouseRepository } from "./database/repository/LighthouseRepository.js";
import { lighthouseRoutes } from "./api/routes/lighthouse.js";
import Redis from "ioredis";
import Bull from "bull";

export default async (app) => {
  app.use(express.json());

  // Initialize Redis connection
  const redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  });

  // Initialize Bull queue with a unique name
  const queue = new Bull("lighthouse-analysis", {
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  });

  // Initialize repository, services, and controllers
  const lighthouseRepository = new LighthouseRepository();
  const lighthouseService = new LighthouseService(lighthouseRepository, queue, redis);
  const lighthouseController = new LighthouseController(lighthouseService);

  // Set up routes
  lighthouseRoutes(app, lighthouseController);

  // Optionally, handle application shutdown to close Redis and queue connections gracefully
  process.on("SIGINT", async () => {
    console.log("Shutting down gracefully...");
    await redis.quit();
    await queue.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("Shutting down gracefully...");
    await redis.quit();
    await queue.close();
    process.exit(0);
  });
};
