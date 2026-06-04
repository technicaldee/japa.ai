import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, default: "" },
    fullName: { type: String, default: "" },
    nationality: { type: String, default: "" },
    ageRange: { type: String, default: "" },
    highestDegree: { type: String, default: "" },
    fieldOfStudy: { type: String, default: "" },
    gpa: { type: String, default: "" },
    yearsOfExperience: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    targetCountries: [{ type: String }],
    budget: { type: String, default: "" },
    timeline: { type: String, default: "" },
    languageProficiency: { type: String, default: "" },
    preferredDeadlines: { type: String, default: "" },
    interests: [{ type: String }],
    matchedScholarships: [
      {
        scholarshipId: { type: mongoose.Schema.Types.ObjectId, ref: "Scholarship" },
        score: Number,
        matchedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const UserProfile =
  mongoose.models.UserProfile ||
  mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
