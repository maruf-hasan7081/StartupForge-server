import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { getAuth } from "./auth.js";

async function seed() {
  await connectDb();
  const auth = getAuth();
  const db = (await import("./config/db.js")).getDb();

  const admin = await db.collection("user").findOne({ email: env.adminEmail });
  if (!admin) {
    await auth.api.signUpEmail({
      body: {
        name: "Platform Admin",
        email: env.adminEmail,
        password: env.adminPassword,
        role: "admin",
      },
    });
    await db.collection("user").updateOne(
      { email: env.adminEmail },
      { $set: { role: "admin", hasSelectedRole: true } },
    );
    console.log("Admin user created");
  } else {
    await db.collection("user").updateOne(
      { email: env.adminEmail },
      { $set: { hasSelectedRole: true, role: "admin" } },
    );
  }

  const startupCount = await db.collection("startups").countDocuments();
  if (startupCount === 0) {
    const startups = [
      {
        startup_name: "NovaPay",
        logo: "https://i.ibb.co/4pX0Z8k/startup.png",
        industry: "Fintech",
        description: "Building borderless payments for emerging markets.",
        funding_stage: "Seed",
        founder_email: "founder@demo.com",
        founder_name: "Aisha Khan",
        team_size_needed: 4,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        startup_name: "GreenRoute",
        logo: "https://i.ibb.co/4pX0Z8k/startup.png",
        industry: "Climate",
        description: "Logistics optimization to reduce carbon footprint.",
        funding_stage: "Pre-seed",
        founder_email: "green@demo.com",
        founder_name: "Leo Martin",
        team_size_needed: 3,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const inserted = await db.collection("startups").insertMany(startups);
    const ids = Object.values(inserted.insertedIds).map((id) => id.toString());

    await db.collection("opportunities").insertMany([
      {
        startup_id: ids[0],
        startup_name: "NovaPay",
        industry: "Fintech",
        role_title: "Full Stack Developer",
        required_skills: "React, Node.js, MongoDB",
        work_type: "Remote",
        commitment_level: "Full-time",
        deadline: new Date(Date.now() + 14 * 86400000),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        startup_id: ids[1],
        startup_name: "GreenRoute",
        industry: "Climate",
        role_title: "Product Designer",
        required_skills: "Figma, UX Research",
        work_type: "Hybrid",
        commitment_level: "Part-time",
        deadline: new Date(Date.now() + 21 * 86400000),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log("Seed data inserted");
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
