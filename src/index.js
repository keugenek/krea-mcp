#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const KREA_API_BASE = "https://api.krea.ai/v1";

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
      throw new Error(`Krea API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async generateImage(params) {
    return this.request("/images/generations", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async generateVideo(params) {
    return this.request("/videos/generations", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getJob(jobId) {
    return this.request(`/jobs/${jobId}`);
  }

  async listJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/jobs${query ? `?${query}` : ""}`);
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
    const query = new URLSearchParams(params).toString();
    return this.request(`/assets${query ? `?${query}` : ""}`);
  }

  async searchStyles(query, params = {}) {
    const searchParams = new URLSearchParams({ query, ...params }).toString();
    return this.request(`/styles/search?${searchParams}`);
  }

  async getStyle(styleId) {
    return this.request(`/styles/${styleId}`);
  }
}

const TOOLS = [
  {
    name: "generate_image",
    description: "Generate an image using Krea AI. Supports multiple models including Flux, Ideogram, Imagen, and more.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text description of the image to generate",
        },
        model: {
          type: "string",
          description: "Model to use (e.g., 'flux-dev', 'ideogram-v2', 'imagen-4', 'krea-1')",
          default: "flux-dev",
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
        style_id: {
          type: "string",
          description: "Optional style ID to apply to the generation",
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
    description: "Generate a video using Krea AI. Supports models like Hailuo, Kling, Runway, Pika, and more.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text description of the video to generate",
        },
        model: {
          type: "string",
          description: "Model to use (e.g., 'hailuo', 'kling-1.6', 'runway-gen4', 'pika-2')",
          default: "hailuo",
        },
        image_url: {
          type: "string",
          description: "Optional image URL to use as the first frame (for image-to-video)",
        },
        duration: {
          type: "number",
          description: "Video duration in seconds",
          default: 5,
        },
        aspect_ratio: {
          type: "string",
          description: "Aspect ratio (e.g., '16:9', '9:16', '1:1')",
          default: "16:9",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "get_job",
    description: "Get the status and results of a generation job",
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
    description: "List recent generation jobs",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of jobs to return",
          default: 10,
        },
        status: {
          type: "string",
          description: "Filter by status (pending, processing, completed, failed)",
        },
      },
    },
  },
  {
    name: "upload_asset",
    description: "Upload an asset (image/video) to Krea for use in generations",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL of the asset to upload",
        },
        name: {
          type: "string",
          description: "Name for the asset",
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
          description: "Maximum number of assets to return",
          default: 20,
        },
      },
    },
  },
  {
    name: "search_styles",
    description: "Search for available styles/LoRAs to use in image generation",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for styles",
        },
        limit: {
          type: "number",
          description: "Maximum number of results",
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
            model: args.model || "flux-dev",
            width: args.width || 1024,
            height: args.height || 1024,
            style_id: args.style_id,
            negative_prompt: args.negative_prompt,
          });
          break;

        case "generate_video":
          result = await client.generateVideo({
            prompt: args.prompt,
            model: args.model || "hailuo",
            image_url: args.image_url,
            duration: args.duration || 5,
            aspect_ratio: args.aspect_ratio || "16:9",
          });
          break;

        case "get_job":
          result = await client.getJob(args.job_id);
          break;

        case "list_jobs":
          result = await client.listJobs({
            limit: args.limit || 10,
            status: args.status,
          });
          break;

        case "upload_asset":
          result = await client.uploadAsset(args.url, args.name);
          break;

        case "get_asset":
          result = await client.getAsset(args.asset_id);
          break;

        case "list_assets":
          result = await client.listAssets({ limit: args.limit || 20 });
          break;

        case "search_styles":
          result = await client.searchStyles(args.query, { limit: args.limit || 10 });
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
