import prisma from "../src/utils/prisma.js";

const scholarships = [
  {
    title: "Chevening Scholarship",
    provider: "UK Government",
    description:
      "Fully-funded master's degree program for individuals with leadership potential from around the world.",
    funding: "Fully Funded + Stipend",
    deadline: new Date("2024-11-07"),
    location: "United Kingdom",
    degreeLevel: "Master's Degree",
    matchScore: 98,
    eligibility: JSON.stringify([
      "Undergraduate degree (2:1 equivalent)",
      "2+ years work experience",
      "English language requirement met",
    ]),
  },
  {
    title: "Commonwealth Scholarship",
    provider: "Commonwealth Scholarship Commission",
    description: "Master's / PhD funding for students from Commonwealth countries.",
    funding: "Fully Funded",
    deadline: new Date("2024-12-15"),
    location: "United Kingdom",
    degreeLevel: "Master's / PhD",
    matchScore: 85,
    eligibility: JSON.stringify([
      "Commonwealth citizen",
      "Undergraduate degree",
    ]),
  },
  {
    title: "DAAD EPOS Scholarship",
    provider: "DAAD",
    description: "Development-related postgraduate courses for professionals from developing countries.",
    funding: "Fully Funded",
    deadline: new Date("2025-03-31"),
    location: "Germany",
    degreeLevel: "Master's / PhD",
    matchScore: 72,
    eligibility: JSON.stringify([
      "Bachelor's degree",
      "2 years professional experience",
    ]),
  },
];

async function seed() {
  const count = await prisma.scholarship.count();
  if (count > 0) {
    console.log("Scholarships already seeded, skipping");
    await prisma.$disconnect();
    return;
  }
  for (const s of scholarships) {
    await prisma.scholarship.create({ data: s });
  }
  console.log("Seeded scholarships");
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
