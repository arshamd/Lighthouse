import express from "express";
import { PORT } from "./config.js";
import expressApp from "./app.js";
import { errorHandler } from "./errors/handler.js";
import cors from "cors";
import { databaseConnection } from "./database/connection.js";

const startServer = async () => {
  const app = express();

  const corsOptions = {};
  app.use(cors(corsOptions));
  
  await databaseConnection();

  await expressApp(app);

  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log("API Lighthouse service on port: " + PORT);
  });
};
startServer();
