export class LighthouseController {
  constructor(lighthouseService) {
    this.lighthouseService = lighthouseService;
  }

  async analysis(req, res, next) {
    const { url } = req.body;
    try {
      const { jobId } = await this.lighthouseService.initiateAnalysis(url);
      res.status(202).send({ jobId });
    } catch (error) {
      console.error("Error queuing analysis:", error);
      next(error);
    }
  }
}
