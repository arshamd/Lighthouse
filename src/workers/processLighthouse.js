import { parentPort, workerData } from "worker_threads";
import * as chromeLauncher from "chrome-launcher"; // Removed unnecessary wildcard import
import lighthouse from "lighthouse";

async function run() {
  const { url, jobId } = workerData;

  try {
    console.log(`[Worker] Started for jobId: ${jobId} with URL: ${url}`);
    const coreWebVitals = await processLighthouse(url, jobId);
    console.log(`[Worker] Completed job ${jobId} successfully.`);
    parentPort?.postMessage(coreWebVitals); // Send results back to the main thread
  } catch (error) {
    console.error(`[Worker] Error in job ${jobId}: ${error.message}`);
    parentPort?.postMessage({ error: error.message }); // Send error back to the main thread
  }
}

async function processLighthouse(url, jobId) {
  let chrome;

  try {
    // Launch Chrome using chrome-launcher
    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless"],
      chromePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    });

    console.log(`[Worker] Chrome launched for job ${jobId} on port ${chrome.port}`);

    const options = {
      logLevel: "info",
      output: "json",
      onlyAudits: [
        "largest-contentful-paint", // LCP
        "first-input-delay", // FID
        "cumulative-layout-shift", // CLS
      ],
      port: chrome.port,
      throttlingMethod: "simulate",
      throttling: {
        rttMs: 40,
        throughputKbps: 10 * 1024,
        cpuSlowdownMultiplier: 2,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    };

    const runnerResult = await lighthouse(url, options);

    if (!runnerResult) {
      throw new Error(`[Worker] Lighthouse failed to generate a report for jobId: ${jobId}`);
    }

    const { lhr } = runnerResult;

    // Extract Core Web Vitals information from Lighthouse results
    const coreWebVitals = {
      lcp: lhr.audits["largest-contentful-paint"]?.displayValue ?? null,
      fid: lhr.audits["first-input-delay"]?.displayValue ?? null,
      cls: lhr.audits["cumulative-layout-shift"]?.displayValue ?? null,
      jobId,
      url,
    };

    return coreWebVitals;
  } catch (error) {
    console.error(`[Worker] Error processing Lighthouse for jobId: ${jobId}`, error);
    throw error;
  } finally {
    if (chrome) {
      console.log(`[Worker] Killing Chrome instance for jobId: ${jobId}`);
      await chrome.kill(); // Ensure Chrome instance is properly closed
    }
  }
}

run();
