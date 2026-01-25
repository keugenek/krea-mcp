#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { execSync } from 'child_process';

const KREA_API_BASE = "https://api.krea.ai";
const API_KEY = process.env.KREA_API_KEY;

if (!API_KEY) {
  console.error("Error: KREA_API_KEY environment variable required");
  process.exit(1);
}

const OUTPUT_BASE = process.argv[2] || "/mnt/y/generations";

// Detect if we're on WSL and target is a Windows path
const isWSL = fs.existsSync('/proc/version') &&
  fs.readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft');
const isWindowsPath = OUTPUT_BASE.startsWith('/mnt/') && OUTPUT_BASE.length > 5;
const useWSLWorkaround = isWSL && isWindowsPath;

// Convert /mnt/y/... to Y:\...
function toWindowsPath(linuxPath) {
  const match = linuxPath.match(/^\/mnt\/([a-z])\/(.*)$/);
  if (match) {
    return `${match[1].toUpperCase()}:\\${match[2].replace(/\//g, '\\')}`;
  }
  return linuxPath;
}

// Model categorization
const IMAGE_MODELS = {
  'flux': ['flux', 'flux-dev', 'flux-pro', 'flux-schnell'],
  'ideogram': ['ideogram', 'ideogram-v2'],
  'imagen': ['imagen', 'imagen-4', 'imagen-3'],
  'krea': ['krea', 'krea-1', 'topaz', 'bloom', 'nano-banana', 'k1'],
};

const VIDEO_MODELS = {
  'hailuo': ['hailuo', 'hailuo-i2v', 'minimax'],
  'kling': ['kling', 'kling-1.6', 'kling-1.5'],
  'runway': ['runway', 'runway-gen4', 'runway-gen3'],
  'pika': ['pika', 'pika-2', 'pika-1.5'],
  'veo': ['veo', 'veo-3', 'veo-2'],
};

const VIDEO_TYPES = ['hailuo', 'kling', 'runway', 'pika', 'veo', 'video', 'minimax', 'wan', 'sora', 'luma', 'ray'];

function categorizeModel(model, type) {
  const modelLower = (model || '').toLowerCase();
  const categories = type === 'image' ? IMAGE_MODELS : VIDEO_MODELS;

  for (const [category, models] of Object.entries(categories)) {
    if (models.some(m => modelLower.includes(m))) {
      return category;
    }
  }
  return 'other';
}

function isVideoType(jobType, model) {
  const typeLower = (jobType || '').toLowerCase();
  const modelLower = (model || '').toLowerCase();
  return VIDEO_TYPES.some(v => typeLower.includes(v) || modelLower.includes(v));
}

async function apiRequest(endpoint) {
  const url = `${KREA_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error: ${response.status} - ${text.slice(0, 200)}`);
  }

  return response.json();
}

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  if (useWSLWorkaround) {
    // Download to temp file first
    const tempFile = `/tmp/krea_download_${Date.now()}_${path.basename(outputPath)}`;
    const fileStream = fs.createWriteStream(tempFile);
    await pipeline(Readable.fromWeb(response.body), fileStream);

    // Copy via PowerShell
    const winPath = toWindowsPath(outputPath);
    const winDir = path.dirname(winPath);
    execSync(`powershell.exe -Command "New-Item -ItemType Directory -Force -Path '${winDir}'" 2>/dev/null`, { stdio: 'ignore' });
    execSync(`powershell.exe -Command "Copy-Item -Path '\\\\\\\\wsl.localhost\\\\Ubuntu${tempFile}' -Destination '${winPath}'"`, { stdio: 'inherit' });

    // Cleanup temp file
    fs.unlinkSync(tempFile);
  } else {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const fileStream = fs.createWriteStream(outputPath);
    await pipeline(Readable.fromWeb(response.body), fileStream);
  }

  return outputPath;
}

function fileExists(outputPath) {
  if (useWSLWorkaround) {
    try {
      const winPath = toWindowsPath(outputPath);
      execSync(`powershell.exe -Command "Test-Path '${winPath}'"`, { stdio: 'pipe' });
      const result = execSync(`powershell.exe -Command "Test-Path '${winPath}'"`, { encoding: 'utf8' }).trim();
      return result === 'True';
    } catch {
      return false;
    }
  }
  return fs.existsSync(outputPath);
}

function getExtension(url, isVideo) {
  try {
    const urlPath = new URL(url).pathname;
    const ext = path.extname(urlPath);
    if (ext && ext.length <= 5) return ext;
  } catch {}
  return isVideo ? '.mp4' : '.png';
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

async function main() {
  console.log("=".repeat(50));
  console.log("Krea Asset Downloader");
  console.log("=".repeat(50));
  console.log(`Output: ${OUTPUT_BASE}`);
  if (useWSLWorkaround) {
    console.log(`Mode: WSL -> Windows (${toWindowsPath(OUTPUT_BASE)})`);
  }
  console.log();

  // Fetch all jobs with pagination
  console.log("Fetching jobs...\n");
  let allJobs = [];
  let cursor = null;

  while (true) {
    try {
      const endpoint = `/jobs?limit=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const response = await apiRequest(endpoint);

      const jobs = response.items || [];
      if (jobs.length === 0) break;

      allJobs = allJobs.concat(jobs);
      console.log(`  Fetched ${allJobs.length} jobs so far...`);

      cursor = response.nextCursor;
      if (!cursor) break;
    } catch (err) {
      console.error("Error fetching jobs:", err.message);
      break;
    }
  }

  console.log(`\nTotal jobs: ${allJobs.length}\n`);

  // Fetch all assets with pagination
  console.log("Fetching assets...\n");
  let allAssets = [];
  cursor = null;

  while (true) {
    try {
      const endpoint = `/assets?limit=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const response = await apiRequest(endpoint);

      const assets = response.items || [];
      if (assets.length === 0) break;

      allAssets = allAssets.concat(assets);
      console.log(`  Fetched ${allAssets.length} assets so far...`);

      cursor = response.nextCursor;
      if (!cursor) break;
    } catch (err) {
      console.error("Error fetching assets:", err.message);
      break;
    }
  }

  console.log(`\nTotal assets: ${allAssets.length}\n`);

  // Process jobs
  console.log("=".repeat(50));
  console.log("Downloading job outputs...");
  console.log("=".repeat(50) + "\n");

  const completedJobs = allJobs.filter(j => j.status === 'completed' && j.result?.urls?.length > 0);
  console.log(`Completed jobs with outputs: ${completedJobs.length}\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const job of completedJobs) {
    try {
      const isVideo = isVideoType(job.type || job.job_type, job.model);
      const type = isVideo ? 'videos' : 'images';
      const category = categorizeModel(job.type || job.model, isVideo ? 'video' : 'image');

      const urls = job.result?.urls || [];

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        if (!url || typeof url !== 'string') continue;

        const ext = getExtension(url, isVideo);
        const timestamp = job.created_at ? new Date(job.created_at).toISOString().slice(0, 10) : 'unknown';
        const jobId = job.job_id || job.id || 'unknown';
        const filename = sanitizeFilename(`${timestamp}_${jobId}${urls.length > 1 ? `_${i}` : ''}${ext}`);
        const outputPath = path.join(OUTPUT_BASE, type, category, filename);

        if (fileExists(outputPath)) {
          skipped++;
          continue;
        }

        console.log(`[DOWN] ${type}/${category}/${filename}`);
        await downloadFile(url, outputPath);
        downloaded++;
      }
    } catch (err) {
      console.error(`[FAIL] Job ${job.job_id || job.id}: ${err.message}`);
      failed++;
    }
  }

  // Process assets
  console.log("\n" + "=".repeat(50));
  console.log("Downloading uploaded assets...");
  console.log("=".repeat(50) + "\n");

  for (const asset of allAssets) {
    try {
      const url = asset.image_url || asset.url;
      if (!url) continue;

      const isVideo = asset.mime_type?.includes('video') || url.match(/\.(mp4|mov|webm|avi)$/i);
      const type = isVideo ? 'videos' : 'images';

      const ext = getExtension(url, isVideo);
      const timestamp = asset.uploaded_at ? new Date(asset.uploaded_at).toISOString().slice(0, 10) : 'unknown';
      const assetId = asset.id || 'unknown';
      const desc = asset.description ? `_${sanitizeFilename(asset.description).slice(0, 30)}` : '';
      const filename = sanitizeFilename(`${timestamp}_asset_${assetId}${desc}${ext}`);
      const outputPath = path.join(OUTPUT_BASE, type, 'other', filename);

      if (fileExists(outputPath)) {
        skipped++;
        continue;
      }

      console.log(`[DOWN] ${type}/other/${filename}`);
      await downloadFile(url, outputPath);
      downloaded++;
    } catch (err) {
      console.error(`[FAIL] Asset ${asset.id}: ${err.message}`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("Summary");
  console.log("=".repeat(50));
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Skipped (exists): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Output: ${useWSLWorkaround ? toWindowsPath(OUTPUT_BASE) : OUTPUT_BASE}`);
}

main().catch(console.error);
