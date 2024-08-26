import { LighthouseResult } from '../models/LighthouseModel.js';

export class LighthouseRepository {
  constructor() {
    this.lighthouseModel = LighthouseResult;
  }

  async saveAnalysis(analysisData) {
    const analysis = new this.lighthouseModel(analysisData);
    await analysis.save();
  }

  // Optionally, add methods to retrieve data based on jobId, URL, etc.
  async findByJobId(jobId) {
    return this.lighthouseModel.findOne({ jobId }).exec();
  }

  async findByUrl(url) {
    return this.lighthouseModel.find({ url }).exec();
  }
}
