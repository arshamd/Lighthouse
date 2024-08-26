import mongoose from "mongoose";

const { Schema } = mongoose;

const LighthouseResultSchema = new Schema(
  {
    jobId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    lcp: { type: String, required: false, default: null }, // Largest Contentful Paint
    fid: { type: String, required: false, default: null }, // First Input Delay
    cls: { type: String, required: false, default: null }, // Cumulative Layout Shift
  },
  {
    timestamps: true,
  }
);

export const LighthouseResult = mongoose.model("LighthouseResult", LighthouseResultSchema);
