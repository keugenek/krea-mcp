# Krea MCP Server

[![npm version](https://img.shields.io/npm/v/@vmosaic/krea-mcp-server.svg)](https://www.npmjs.com/package/@vmosaic/krea-mcp-server)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io)
[![CI](https://github.com/keugenek/krea-mcp/workflows/CI/badge.svg)](https://github.com/keugenek/krea-mcp/actions)
[![GitHub stars](https://img.shields.io/github/stars/keugenek/krea-mcp.svg)](https://github.com/keugenek/krea-mcp/stargazers)

> **MCP server for [Krea.ai](https://krea.ai)** - Generate stunning AI images and videos using Flux, Hailuo, Runway, Kling, Ideogram, Imagen, and 20+ other state-of-the-art models.

**212+ developers** have cloned this repo within 2 weeks. Works with **Claude Desktop**, **Claude Code**, **Cursor**, and any MCP-compatible client.

Works with **Claude Desktop**, **Claude Code**, **Cursor**, and any MCP-compatible client.

---

## Quick Start (No installation required!)

You can run the MCP server directly via `npx`:

```json
{
  "mcpServers": {
    "krea": {
      "command": "npx",
      "args": [
        "-y",
        "@vmosaic/krea-mcp-server"
      ],
      "env": {
        "KREA_API_KEY": "YOUR_KREA_API_KEY"
      }
    }
  }
}
```

## Why Krea MCP?

- **20+ AI Models** - Access Flux, Ideogram, Imagen 4, Runway Gen-4, Hailuo, Kling, Pika, Veo 3, and more through one unified interface
- **Text-to-Image** - Generate photorealistic images, art, illustrations from text prompts
- **Text-to-Video** - Create AI videos with natural motion and cinematic quality
- **Image-to-Video** - Animate any image with AI-powered motion
- **Custom Styles** - Apply LoRA styles for consistent aesthetics
- **Simple Setup** - One command install, works instantly with Claude

---

## Quick Start

### 1. Install

```bash
npm install -g krea-mcp
```

### 2. Get API Key

Get your API key from [krea.ai](https://krea.ai)

### 3. Configure Claude Desktop

Add to `~/.config/claude/claude_desktop_config.json` (Linux) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

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

### 3b. Or Configure Claude Code

```bash
claude mcp add krea -e KREA_API_KEY=your-api-key -- npx krea-mcp
```

---

## Features

### Image Generation

Generate images with state-of-the-art AI models:

```
"Generate a cyberpunk cityscape at sunset with neon lights reflecting on wet streets"
```

**Supported models:** Flux Dev, Flux Pro, Flux Schnell, Ideogram V2, Imagen 4, Krea 1, ChatGPT Image, Topaz, Bloom, and more.

### Video Generation

Create AI videos from text or images:

```
"Create a video of a golden retriever running through a field of sunflowers"
```

**Supported models:** Hailuo, Kling 1.6, Runway Gen-4, Pika 2, Veo 3, Sora 2, Seedance, Ray 2, and more.

### Style Transfer

Apply custom styles (LoRAs) to your generations:

```
"Generate an image in anime style of a samurai in cherry blossom garden"
```

### Asset Management

Upload and manage your images for image-to-video and other workflows.

---

## Available Tools

| Tool | Description |
|------|-------------|
| `generate_image` | Generate images from text prompts |
| `generate_video` | Generate videos from text or images |
| `get_job` | Check generation job status |
| `list_jobs` | List recent generation jobs |
| `upload_asset` | Upload images/videos for use in generations |
| `get_asset` | Get asset details |
| `list_assets` | List uploaded assets |
| `search_styles` | Search for styles/LoRAs |
| `get_style` | Get style details |

---

## Claude Code Skill

This repo includes a `/krea` slash command for Claude Code.

**Install the skill:**
```bash
cp -r .claude/skills/krea ~/.claude/skills/
```

**Usage:**
```
/krea a photorealistic portrait of a astronaut on mars
/krea video ocean waves crashing on rocks at golden hour
/krea status job_abc123
/krea styles cyberpunk
```

---

## Supported Models

### Image Models

| Model | ID | Best For |
|-------|-----|----------|
| FLUX.1 Dev | `flux-dev` | High quality, balanced |
| FLUX.1 Pro | `flux-pro` | Highest quality |
| FLUX.1 Schnell | `flux-schnell` | Fast generation |
| Ideogram V2 | `ideogram-v2` | Text in images |
| Imagen 4 | `imagen-4` | Photorealism |
| Krea 1 | `krea-1` | Creative styles |
| ChatGPT Image | `chatgpt-image` | General purpose |

### Video Models

| Model | ID | Best For |
|-------|-----|----------|
| Hailuo | `hailuo` | High quality, natural motion |
| Kling 1.6 | `kling-1.6` | Detailed motion |
| Runway Gen-4 | `runway-gen4` | Cinematic quality |
| Pika 2 | `pika-2` | Creative styles |
| Veo 3 | `veo-3` | Google's latest |
| Sora 2 | `sora-2` | OpenAI's model |

---

## API Reference

### generate_image

```typescript
{
  prompt: string,        // Required: Image description
  model?: string,        // Default: "flux-dev"
  width?: number,        // Default: 1024
  height?: number,       // Default: 1024
  style_id?: string,     // Optional: Style/LoRA ID
  negative_prompt?: string
}
```

### generate_video

```typescript
{
  prompt: string,        // Required: Video description
  model?: string,        // Default: "hailuo"
  image_url?: string,    // Optional: First frame for i2v
  duration?: number,     // Default: 5 seconds
  aspect_ratio?: string  // Default: "16:9"
}
```

---

## Examples

### Generate a Product Photo
```
Use Krea to generate a professional product photo of a perfume bottle
on a marble surface with soft studio lighting
```

### Create a Social Media Video
```
Generate a 5-second video of coffee being poured into a cup in slow motion,
cinematic lighting, 9:16 aspect ratio for Instagram Reels
```

### Apply a Custom Style
```
Search for "watercolor" styles and generate an image of a Paris street scene
using that style
```

---

## Links

- [Krea.ai](https://krea.ai) - Official Krea website
- [Krea API Docs](https://docs.krea.ai) - API documentation
- [MCP Specification](https://modelcontextprotocol.io) - Model Context Protocol
- [Claude Desktop](https://claude.ai/download) - Download Claude Desktop

---

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

---

## Keywords

mcp, mcp-server, model-context-protocol, krea, krea-ai, ai, artificial-intelligence, image-generation, video-generation, text-to-image, text-to-video, image-to-video, flux, ideogram, imagen, runway, hailuo, kling, pika, veo, sora, generative-ai, ai-art, ai-video, claude, anthropic, claude-desktop, claude-code, cursor, llm, llm-tools, ai-tools, machine-learning, deep-learning, stable-diffusion, diffusion-models
