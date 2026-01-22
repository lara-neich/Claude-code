import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

const anthropic = new Anthropic()

interface PromptSection {
  label: string
  content: string
}

interface PromptResult {
  overview: string
  sections: PromptSection[]
  fullPrompt: string
  tags: string[]
}

function getMediaType(filePath: string): 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' {
  const ext = path.extname(filePath).toLowerCase()
  const mediaTypes: Record<string, 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  }
  return mediaTypes[ext] || 'image/png'
}

function isVideoFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase()
  return ['.mp4', '.webm', '.mov'].includes(ext)
}

const ANALYSIS_PROMPT = `You are an expert design analyst and prompt engineer. Analyze this design (image, GIF, or video frame) and create a detailed prompt that could be used to recreate a similar design using AI image generation tools like Midjourney, DALL-E, or Stable Diffusion.

Provide your analysis in the following JSON format:
{
  "overview": "A brief 1-2 sentence description of what this design is",
  "sections": [
    {
      "label": "Visual Style",
      "content": "Describe the overall visual style (e.g., minimalist, maximalist, vintage, modern, brutalist, etc.)"
    },
    {
      "label": "Color Palette",
      "content": "Describe the colors used, their relationships, and the overall mood they create"
    },
    {
      "label": "Typography",
      "content": "If text is present, describe the fonts, sizes, weights, and typographic hierarchy"
    },
    {
      "label": "Layout & Composition",
      "content": "Describe how elements are arranged, spacing, alignment, and visual hierarchy"
    },
    {
      "label": "Imagery & Graphics",
      "content": "Describe any images, illustrations, icons, or graphic elements"
    },
    {
      "label": "Texture & Effects",
      "content": "Describe any textures, gradients, shadows, or special effects"
    },
    {
      "label": "Mood & Tone",
      "content": "Describe the emotional feel and intended audience"
    }
  ],
  "fullPrompt": "A complete, ready-to-use prompt combining all elements that could recreate this design style. Format it as a proper AI image generation prompt with style keywords and technical parameters.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

The tags should be single words or short phrases that categorize the design style (e.g., "minimalist", "dark mode", "tech", "corporate", "playful").

Respond ONLY with valid JSON, no additional text.`

export async function analyzeDesign(
  filePath: string,
  _fileName: string,
  fileType: string
): Promise<PromptResult> {
  // Check if API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    // Return mock data for demo purposes
    return getMockResult(fileType)
  }

  // Handle video files - extract first frame concept (simplified)
  if (isVideoFile(filePath)) {
    // For videos, we'll describe what we'd analyze
    return getMockResult('video')
  }

  // Read the image file
  const imageData = fs.readFileSync(filePath)
  const base64Image = imageData.toString('base64')
  const mediaType = getMediaType(filePath)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    })

    // Extract the text response
    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from API')
    }

    // Parse the JSON response
    const result = JSON.parse(textContent.text) as PromptResult
    return result
  } catch (error) {
    console.error('API Error:', error)

    // If parsing fails or API errors, return mock data
    if (error instanceof SyntaxError) {
      return getMockResult(fileType)
    }

    throw error
  }
}

function getMockResult(fileType: string): PromptResult {
  const isVideo = fileType === 'video'

  return {
    overview: isVideo
      ? 'A dynamic motion design showcasing fluid transitions and engaging visual effects.'
      : 'A modern, professional design with clean aesthetics and thoughtful composition.',
    sections: [
      {
        label: 'Visual Style',
        content:
          'Contemporary and polished design language with a focus on clarity and visual impact. The style balances professionalism with creative flair, using modern design principles.',
      },
      {
        label: 'Color Palette',
        content:
          'A sophisticated color scheme featuring primary brand colors complemented by neutral tones. The palette creates visual hierarchy and guides the viewer\'s attention effectively.',
      },
      {
        label: 'Typography',
        content:
          'Clean, modern sans-serif typography with clear hierarchy. Headlines are bold and impactful, while body text maintains excellent readability.',
      },
      {
        label: 'Layout & Composition',
        content:
          'Well-balanced composition with strategic use of white space. Elements are aligned to an invisible grid, creating a sense of order and professionalism.',
      },
      {
        label: 'Imagery & Graphics',
        content:
          'High-quality visuals that support the overall message. Graphics are purposeful and enhance rather than distract from the core content.',
      },
      {
        label: 'Texture & Effects',
        content:
          'Subtle shadows and depth effects create dimensionality. The design uses modern techniques like soft gradients and gentle blur effects where appropriate.',
      },
      {
        label: 'Mood & Tone',
        content:
          'Professional yet approachable, conveying trust and competence. The overall tone appeals to a discerning audience seeking quality and reliability.',
      },
    ],
    fullPrompt: `Create a ${isVideo ? 'motion design frame' : 'digital design'} with a modern, professional aesthetic. Use a sophisticated color palette with bold primary colors and neutral accents. Feature clean sans-serif typography with clear visual hierarchy. Apply a balanced grid-based layout with generous white space. Include subtle shadows and depth effects for dimensionality. The overall mood should be professional yet approachable, suitable for a contemporary brand. Style: minimalist, corporate, modern UI/UX. Technical: high resolution, sharp details, professional lighting.`,
    tags: ['modern', 'professional', 'minimalist', 'corporate', isVideo ? 'motion' : 'static'],
  }
}
