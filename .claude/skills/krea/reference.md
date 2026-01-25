# Krea MCP Reference

## Tools

### generate_image
Generate an image from text.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| prompt | string | Yes | - | Image description |
| model | string | No | flux-dev | Model to use |
| width | number | No | 1024 | Width in pixels |
| height | number | No | 1024 | Height in pixels |
| style_id | string | No | - | Style/LoRA to apply |
| negative_prompt | string | No | - | What to avoid |

### generate_video
Generate a video from text or image.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| prompt | string | Yes | - | Video description |
| model | string | No | hailuo | Model to use |
| image_url | string | No | - | First frame image |
| duration | number | No | 5 | Duration in seconds |
| aspect_ratio | string | No | 16:9 | Aspect ratio |

### get_job
Check job status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| job_id | string | Yes | Job ID to check |

### list_jobs
List recent jobs.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | number | No | 10 | Max results |
| status | string | No | - | Filter by status |

### upload_asset
Upload an asset.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | Asset URL |
| name | string | No | Asset name |

### search_styles
Search for styles.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search query |
| limit | number | No | 10 | Max results |

## Job Lifecycle

1. **pending** - Job queued
2. **processing** - Generation in progress
3. **completed** - Done, results available
4. **failed** - Error occurred

## Aspect Ratios

- `1:1` - Square (1024x1024)
- `16:9` - Landscape/widescreen
- `9:16` - Portrait/vertical
- `4:3` - Standard
- `3:4` - Portrait standard
