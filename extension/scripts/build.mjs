import { build, context } from "esbuild";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from "fs";
import { createGzip } from "zlib";
import { basename, dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const repoRoot = resolve(rootDir, "..");

const watchMode = process.argv.includes("--watch");
const packageMode = process.argv.includes("--package");
const targetArg = process.argv.find((a) => a.startsWith("--target="))?.split("=")[1]
  ?? (process.argv.includes("--target") ? process.argv[process.argv.indexOf("--target") + 1] : null)
  ?? "chrome";

const validTargets = ["chrome", "firefox", "edge"];
if (!validTargets.includes(targetArg)) {
  console.error(`Invalid target "${targetArg}". Valid targets: ${validTargets.join(", ")}`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(resolve(rootDir, "package.json"), "utf8"));
const version = pkg.version;
const packagingRoot = resolve(rootDir, ".build", targetArg);

function generateManifest(target) {
  const base = {
    manifest_version: 3,
    name: "I Have 2 Much Tabs",
    version,
    description: "Archive open tab knowledge with AI summaries and semantic search.",
    permissions: ["tabs", "storage", "downloads"],
    host_permissions: ["http://*/*", "https://*/*"],
    action: {
      default_title: "I Have 2 Much Tabs",
      default_popup: "popup.html"
    },
    options_page: "options.html"
  };

  if (target === "firefox") {
    base.background = {
      scripts: ["dist/background/service-worker.js"]
    };
    base.browser_specific_settings = {
      gecko: {
        id: "ihave2muchtabs@example.com",
        strict_min_version: "109.0"
      }
    };
  } else {
    base.background = {
      service_worker: "dist/background/service-worker.js",
      type: "module"
    };
  }

  return base;
}

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

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function collectFiles(dir, root = dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, root));
      continue;
    }

    files.push({
      fullPath,
      archivePath: relative(root, fullPath).replace(/\\/g, "/")
    });
  }

  return files;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = ((date.getHours() & 0x1f) << 11)
    | ((date.getMinutes() & 0x3f) << 5)
    | (Math.floor(date.getSeconds() / 2) & 0x1f);
  const dosDate = (((year - 1980) & 0x7f) << 9)
    | (((date.getMonth() + 1) & 0x0f) << 5)
    | (date.getDate() & 0x1f);
  return { dosDate, dosTime };
}

async function gzipRawBuffer(buffer) {
  const gzip = createGzip({ level: 9 });
  const chunks = [];

  return await new Promise((resolvePromise, rejectPromise) => {
    gzip.on("data", (chunk) => chunks.push(chunk));
    gzip.on("end", () => {
      const gzipBuffer = Buffer.concat(chunks);
      resolvePromise(gzipBuffer.subarray(10, gzipBuffer.length - 8));
    });
    gzip.on("error", rejectPromise);
    gzip.end(buffer);
  });
}

async function writeZip(zipPath, sourceDir) {
  const files = collectFiles(sourceDir);
  const localEntries = [];
  const centralEntries = [];
  let offset = 0;

  for (const file of files) {
    const source = readFileSync(file.fullPath);
    const compressed = await gzipRawBuffer(source);
    const fileNameBuffer = Buffer.from(file.archivePath, "utf8");
    const { dosDate, dosTime } = dosDateTime(statSync(file.fullPath).mtime);
    const checksum = crc32(source);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(source.length, 22);
    localHeader.writeUInt16LE(fileNameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localEntries.push(localHeader, fileNameBuffer, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(source.length, 24);
    centralHeader.writeUInt16LE(fileNameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralEntries.push(centralHeader, fileNameBuffer);

    offset += localHeader.length + fileNameBuffer.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralEntries);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(files.length, 8);
  endRecord.writeUInt16LE(files.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  await new Promise((resolvePromise, rejectPromise) => {
    const output = createWriteStream(zipPath);
    output.on("error", rejectPromise);
    output.on("finish", resolvePromise);
    output.end(Buffer.concat([...localEntries, centralDirectory, endRecord]));
  });
}

function renderHtml(fileName) {
  return readFileSync(resolve(rootDir, fileName), "utf8").replace(/__EXTENSION_VERSION__/g, version);
}

function writeManifest(target) {
  const manifest = generateManifest(target);
  const manifestPath = resolve(rootDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`[build] manifest.json written for target: ${target} (v${version})`);
}

function preparePackageRoot(target) {
  rmSync(packagingRoot, { recursive: true, force: true });
  ensureDir(packagingRoot);
  writeFileSync(resolve(packagingRoot, "manifest.json"), JSON.stringify(generateManifest(target), null, 2) + "\n");
  writeFileSync(resolve(packagingRoot, "popup.html"), renderHtml("popup.html"));
  writeFileSync(resolve(packagingRoot, "options.html"), renderHtml("options.html"));
  writeFileSync(resolve(packagingRoot, "dashboard.html"), renderHtml("dashboard.html"));

  const iconPath = resolve(repoRoot, "icon128.png");
  if (existsSync(iconPath)) {
    writeFileSync(resolve(packagingRoot, basename(iconPath)), readFileSync(iconPath));
  }

  for (const file of collectFiles(resolve(rootDir, "dist"))) {
    const outputPath = resolve(packagingRoot, "dist", file.archivePath);
    ensureDir(dirname(outputPath));
    writeFileSync(outputPath, readFileSync(file.fullPath));
  }
}

if (watchMode) {
  writeManifest(targetArg);
  const ctx = await context(config);
  await ctx.watch();
  console.log(`Watching... (target: ${targetArg})`);
} else {
  writeManifest("chrome");
  await build(config);

  if (packageMode) {
    preparePackageRoot(targetArg);
    const zipPath = resolve(repoRoot, `ihave2muchtabs-${targetArg}-${version}.zip`);
    await writeZip(zipPath, packagingRoot);
    console.log(`[build] package written: ${zipPath}`);
  }
}
