const API = process.env.API_URL || "http://localhost:5000";

async function run() {
  const checks = [];

  const health = await fetch(`${API}/api/health`);
  checks.push(["health", health.ok]);

  const startups = await fetch(`${API}/api/startups`);
  checks.push(["startups list", startups.ok]);

  const opps = await fetch(`${API}/api/opportunities?page=1&limit=5`);
  checks.push(["opportunities paginated", opps.ok]);

  const featured = await fetch(`${API}/api/opportunities/featured`);
  checks.push(["featured opportunities", featured.ok]);

  const config = await fetch(`${API}/api/config/public`);
  checks.push(["public config", config.ok]);
  if (config.ok) {
    const body = await config.json();
    checks.push(["config has googleEnabled flag", typeof body.googleEnabled === "boolean"]);
  }

  const bookmarksProtected = await fetch(`${API}/api/bookmarks/ids`);
  checks.push(["bookmarks requires auth", bookmarksProtected.status === 401]);

  let failed = 0;
  for (const [name, ok] of checks) {
    console.log(ok ? "✓" : "✗", name);
    if (!ok) failed += 1;
  }

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll smoke checks passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
