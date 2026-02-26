import { build, context } from "esbuild";

const watchMode = process.argv.includes("--watch");

const config = {
  entryPoints: [
    "src/background/service-worker.ts",
    "src/popup/index.ts",
    "src/options/index.ts",
    "src/dashboard/index.ts"
  ],
  bundle: true,
  format: "esm",
  target: "es2022",
  sourcemap: true,
  outbase: "src",
  outdir: "dist",
  logLevel: "info"
};

if (watchMode) {
  const ctx = await context(config);
  await ctx.watch();
  console.log("Watching...");
} else {
  await build(config);
}

