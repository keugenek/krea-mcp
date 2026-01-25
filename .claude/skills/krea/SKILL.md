---
name: krea
description: Generate images and videos using Krea AI. Use when user asks to create, generate, or make images, pictures, videos, or visual content with AI.
user-invocable: true
argument-hint: [prompt or command]
---

# Krea AI Generation

Generate images and videos using the Krea MCP server.

## Usage

`/krea [prompt]` - Generate an image with the given prompt
`/krea video [prompt]` - Generate a video with the given prompt
`/krea status [job_id]` - Check generation status
`/krea styles [query]` - Search for styles

## Commands

Based on `$ARGUMENTS`, perform the appropriate action:

### Image Generation (default)
If no specific command prefix, generate an image:
```
Use the generate_image tool with:
- prompt: the user's description
- model: "flux-dev" (or user-specified)
- width/height: 1024x1024 (or user-specified)
```

### Video Generation
If arguments start with "video":
```
Use the generate_video tool with:
- prompt: the description after "video"
- model: "hailuo" (or user-specified)
- duration: 5 seconds (or user-specified)
```

### Job Status
If arguments start with "status":
```
Use the get_job tool with the job_id
```

### Style Search
If arguments start with "styles" or "style":
```
Use the search_styles tool with the query
```

## Response Format

After calling the Krea tool:

1. **For generations**: Report the job ID and explain that generations are async. Offer to check status.
2. **For job status**: Show the status and include result URLs if completed.
3. **For style search**: List available styles with their IDs.

## Available Models

### Image Models
- `flux-dev` (default) - High quality, balanced
- `flux-pro` - Highest quality
- `flux-schnell` - Fast generation
- `ideogram-v2` - Great for text in images
- `imagen-4` - Google's latest
- `krea-1` - Krea's custom model

### Video Models
- `hailuo` (default) - High quality video
- `kling-1.6` - Detailed motion
- `runway-gen4` - Cinematic quality
- `pika-2` - Creative styles
- `veo-3` - Google's video model

## Examples

- `/krea a cyberpunk cityscape at night with neon lights`
- `/krea video a cat playing with yarn in slow motion`
- `/krea status job_abc123`
- `/krea styles anime`
