import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    provider: { type: String, default: "" },
    description: { type: String, default: "" },
    funding: { type: String, default: "" },
    deadline: { type: Date },
    location: { type: String, default: "" },
    degreeLevel: { type: String, default: "" },
    eligibility: [{ type: String }],
    url: { type: String, default: "" },
    source: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    matchScore: { type: Number, default: 0 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

scholarshipSchema.index({ title: "text", description: "text" });
scholarshipSchema.index({ location: 1 });
scholarshipSchema.index({ deadline: 1 });
scholarshipSchema.index({ degreeLevel: 1 });

const Scholarship =
  mongoose.models.Scholarship ||
  mongoose.model("Scholarship", scholarshipSchema);

export default Scholarship;
