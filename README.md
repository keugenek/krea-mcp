# Krea MCP Server

An MCP (Model Context Protocol) server for [Krea.ai](https://krea.ai) - Generate stunning images and videos with AI.

## Features

- **Image Generation** - Generate images using Flux, Ideogram, Imagen, Krea-1, and more
- **Video Generation** - Create videos with Hailuo, Kling, Runway, Pika, and other models
- **Asset Management** - Upload and manage images/videos for use in generations
- **Style Search** - Find and apply custom styles (LoRAs) to your generations
- **Job Tracking** - Monitor the status of your generation jobs

## Installation

### Prerequisites

- Node.js 18+
- A Krea API key (get one at [krea.ai](https://krea.ai))

### Install from npm

```bash
npm install -g krea-mcp
```

### Install from source

```bash
git clone https://github.com/bmorphism/krea-mcp.git
cd krea-mcp
npm install
```

## Configuration

### Claude Desktop

Add to your Claude Desktop config (`~/.config/claude/claude_desktop_config.json` on Linux, `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "krea": {
      "command": "npx",
      "args": ["krea-mcp"],
      "env": {
        "KREA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add krea -- npx krea-mcp
```

Then set your API key:
```bash
export KREA_API_KEY="your-api-key-here"
```

## Available Tools

### `generate_image`
Generate an image from a text prompt.

Parameters:
- `prompt` (required): Text description of the image
- `model`: Model to use (default: "flux-dev")
- `width`: Image width in pixels (default: 1024)
- `height`: Image height in pixels (default: 1024)
- `style_id`: Optional style ID to apply
- `negative_prompt`: What to avoid in the image

### `generate_video`
Generate a video from a text prompt or image.

Parameters:
- `prompt` (required): Text description of the video
- `model`: Model to use (default: "hailuo")
- `image_url`: Optional image URL for image-to-video
- `duration`: Video duration in seconds (default: 5)
- `aspect_ratio`: Aspect ratio (default: "16:9")

### `get_job`
Get the status and results of a generation job.

Parameters:
- `job_id` (required): The job ID to check

### `list_jobs`
List recent generation jobs.

Parameters:
- `limit`: Maximum number of jobs (default: 10)
- `status`: Filter by status (pending, processing, completed, failed)

### `upload_asset`
Upload an asset for use in generations.

Parameters:
- `url` (required): URL of the asset to upload
- `name`: Name for the asset

### `get_asset`
Get details of an uploaded asset.

Parameters:
- `asset_id` (required): The asset ID

### `list_assets`
List uploaded assets.

Parameters:
- `limit`: Maximum number of assets (default: 20)

### `search_styles`
Search for available styles/LoRAs.

Parameters:
- `query` (required): Search query
- `limit`: Maximum results (default: 10)

### `get_style`
Get details of a specific style.

Parameters:
- `style_id` (required): The style ID

## Supported Models

### Image Models
- `flux-dev` - FLUX.1 Dev
- `flux-pro` - FLUX.1 Pro
- `flux-schnell` - FLUX.1 Schnell
- `ideogram-v2` - Ideogram V2
- `imagen-4` - Google Imagen 4
- `krea-1` - Krea 1
- And many more...

### Video Models
- `hailuo` - Hailuo AI
- `kling-1.6` - Kling 1.6
- `runway-gen4` - Runway Gen-4
- `pika-2` - Pika 2.0
- `veo-3` - Google Veo 3
- And many more...

## License

MIT
