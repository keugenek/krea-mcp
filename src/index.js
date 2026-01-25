#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const KREA_API_BASE = "https://api.krea.ai";

// Model mappings: user-friendly name -> API path
const IMAGE_MODELS = {
  "flux": "bfl/flux-1-dev",
  "flux-dev": "bfl/flux-1-dev",
  "flux-pro": "bfl/flux-1-pro",
  "flux-schnell": "bfl/flux-1-schnell",
  "ideogram": "ideogram/v2",
  "ideogram-v2": "ideogram/v2",
  "imagen-4": "google/imagen/v4",
  "imagen": "google/imagen/v4",
  "krea-1": "krea/k1",
  "krea": "krea/k1",
  "chatgpt-image": "openai/gpt-image/v1",
  "gpt-image": "openai/gpt-image/v1",
  "nano-banana": "google/nano-banana-pro",
  "seedream": "bytedance/seedream/v4",
};

const VIDEO_MODELS = {
  "hailuo": "minimax/hailuo",
  "hailuo-i2v": "minimax/hailuo-i2v",
  "kling": "kuaishou/kling/v1.6",
  "kling-1.6": "kuaishou/kling/v1.6",
  "runway": "runway/gen4",
  "runway-gen4": "runway/gen4",
  "pika": "pika/v2",
  "pika-2": "pika/v2",
  "veo-3": "google/veo/v3",
  "veo": "google/veo/v3",
  "wan": "alibaba/wan/v2.5",
  "wan-2.5": "alibaba/wan/v2.5",
  "sora": "openai/sora/v2",
  "sora-2": "openai/sora/v2",
  "luma": "luma/ray/v2",
  "ray-2": "luma/ray/v2",
};

class KreaClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async request(endpoint, options = {}) {
    const url = `${KREA_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Krea API error: ${response.status} - ${error.slice(0, 200)}`);
    }

    return response.json();
  }

  async generateImage(params) {
    const modelPath = IMAGE_MODELS[params.model] || IMAGE_MODELS["flux"];
    const body = {
      prompt: params.prompt,
    };
    if (params.width) body.width = params.width;
    if (params.height) body.height = params.height;
    if (params.steps) body.steps = params.steps;
    if (params.negative_prompt) body.negative_prompt = params.negative_prompt;
    if (params.style_id) body.style_id = params.style_id;
    if (params.image_url) body.image_url = params.image_url;

    return this.request(`/generate/image/${modelPath}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async generateVideo(params) {
    const modelPath = VIDEO_MODELS[params.model] || VIDEO_MODELS["hailuo"];
    const body = {
      prompt: params.prompt,
    };
    if (params.image_url) body.image_url = params.image_url;
    if (params.duration) body.duration = params.duration;
    if (params.aspect_ratio) body.aspect_ratio = params.aspect_ratio;

    return this.request(`/generate/video/${modelPath}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getJob(jobId) {
    return this.request(`/jobs/${jobId}`);
  }

  async listJobs(params = {}) {
    const queryParts = [];
    if (params.limit) queryParts.push(`limit=${params.limit}`);
    if (params.cursor) queryParts.push(`cursor=${encodeURIComponent(params.cursor)}`);
    if (params.status) queryParts.push(`status=${params.status}`);
    if (params.types) queryParts.push(`types=${params.types}`);
    const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return this.request(`/jobs${query}`);
  }

  async uploadAsset(url, name) {
    return this.request("/assets", {
      method: "POST",
      body: JSON.stringify({ url, name }),
    });
  }

  async getAsset(assetId) {
    return this.request(`/assets/${assetId}`);
  }

  async listAssets(params = {}) {
    const queryParts = [];
    if (params.limit) queryParts.push(`limit=${params.limit}`);
    if (params.cursor) queryParts.push(`cursor=${encodeURIComponent(params.cursor)}`);
    const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return this.request(`/assets${query}`);
  }

  async searchStyles(query, params = {}) {
    const queryParts = [`query=${encodeURIComponent(query)}`];
    if (params.limit) queryParts.push(`limit=${params.limit}`);
    return this.request(`/styles/search?${queryParts.join("&")}`);
  }

  async getStyle(styleId) {
    return this.request(`/styles/${styleId}`);
  }
}

const TOOLS = [
  {
    name: "generate_image",
    description: "Generate an image using Krea AI. Returns a job_id - use get_job to check status and get the result URL.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text description of the image to generate",
        },
        model: {
          type: "string",
          description: "Model: flux (default), flux-pro, ideogram, imagen-4, krea-1, chatgpt-image, nano-banana, seedream",
          default: "flux",
        },
        width: {
          type: "number",
          description: "Image width in pixels",
          default: 1024,
        },
        height: {
          type: "number",
          description: "Image height in pixels",
          default: 1024,
        },
        image_url: {
          type: "string",
          description: "Optional source image URL for image-to-image generation",
        },
        style_id: {
          type: "string",
          description: "Optional style ID to apply",
        },
        negative_prompt: {
          type: "string",
          description: "What to avoid in the image",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_video",
    description: "Generate a video using Krea AI. Returns a job_id - use get_job to check status and get the result URL.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text description of the video to generate",
        },
        model: {
          type: "string",
          description: "Model: hailuo (default), kling, runway, pika, veo-3, wan, sora, luma",
          default: "hailuo",
        },
        image_url: {
          type: "string",
          description: "Optional image URL for image-to-video generation",
        },
        duration: {
          type: "number",
          description: "Video duration in seconds",
          default: 5,
        },
        aspect_ratio: {
          type: "string",
          description: "Aspect ratio (16:9, 9:16, 1:1)",
          default: "16:9",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "get_job",
    description: "Get the status and results of a generation job. Returns status (scheduled, processing, completed, failed) and result URLs when completed.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: {
          type: "string",
          description: "The job ID to check",
        },
      },
      required: ["job_id"],
    },
  },
  {
    name: "list_jobs",
    description: "List generation jobs with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Max jobs to return (1-1000)",
          default: 100,
        },
        status: {
          type: "string",
          description: "Filter by status: scheduled, processing, completed, failed",
        },
        types: {
          type: "string",
          description: "Filter by type (comma-separated): flux, hailuo, kling, etc.",
        },
      },
    },
  },
  {
    name: "upload_asset",
    description: "Upload an image/video to Krea for use in generations",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL of the asset to upload",
        },
        name: {
          type: "string",
          description: "Optional name for the asset",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "get_asset",
    description: "Get details of an uploaded asset",
    inputSchema: {
      type: "object",
      properties: {
        asset_id: {
          type: "string",
          description: "The asset ID",
        },
      },
      required: ["asset_id"],
    },
  },
  {
    name: "list_assets",
    description: "List uploaded assets",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Max assets to return (1-1000)",
          default: 100,
        },
      },
    },
  },
  {
    name: "search_styles",
    description: "Search for styles/LoRAs to use in image generation",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
        limit: {
          type: "number",
          description: "Max results",
          default: 10,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_style",
    description: "Get details of a specific style",
    inputSchema: {
      type: "object",
      properties: {
        style_id: {
          type: "string",
          description: "The style ID",
        },
      },
      required: ["style_id"],
    },
  },
];

async function main() {
  const apiKey = process.env.KREA_API_KEY;

  if (!apiKey) {
    console.error("Error: KREA_API_KEY environment variable is required");
    process.exit(1);
  }

  const client = new KreaClient(apiKey);
  const server = new Server(
    {
      name: "krea-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;

      switch (name) {
        case "generate_image":
          result = await client.generateImage({
            prompt: args.prompt,
            model: args.model || "flux",
            width: args.width,
            height: args.height,
            image_url: args.image_url,
            style_id: args.style_id,
            negative_prompt: args.negative_prompt,
          });
          break;

        case "generate_video":
          result = await client.generateVideo({
            prompt: args.prompt,
            model: args.model || "hailuo",
            image_url: args.image_url,
            duration: args.duration,
            aspect_ratio: args.aspect_ratio,
          });
          break;

        case "get_job":
          result = await client.getJob(args.job_id);
          break;

        case "list_jobs":
          result = await client.listJobs({
            limit: args.limit,
            status: args.status,
            types: args.types,
          });
          break;

        case "upload_asset":
          result = await client.uploadAsset(args.url, args.name);
          break;

        case "get_asset":
          result = await client.getAsset(args.asset_id);
          break;

        case "list_assets":
          result = await client.listAssets({ limit: args.limit });
          break;

        case "search_styles":
          result = await client.searchStyles(args.query, { limit: args.limit });
          break;

        case "get_style":
          result = await client.getStyle(args.style_id);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
