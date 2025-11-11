import Replicate from 'replicate'

// Initialize Replicate with API token
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN,
})

// Default AI model configuration (using Stable Diffusion - reliable and cheap)
const DEFAULT_MODEL = {
  model: 'stability-ai/stable-diffusion',
  version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
}

export interface GenerationOptions {
  prompt: string
}

export class ReplicateService {
  /**
   * Generate a mock image (simulating AI generation)
   */
  async generateImage(options: GenerationOptions): Promise<string> {
    const { prompt } = options

    console.log('Generating mock image for prompt:', prompt)

    // Simulate API delay to mimic real AI generation
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Generate mock image based on prompt content
    const mockImageUrl = this.generateMockImageUrl(prompt)

    console.log('Mock image generation successful:', mockImageUrl)
    return mockImageUrl
  }

  /**
   * Enhance prompt based on desired style
   */
  private enhancePrompt(prompt: string, style: string): string {
    const stylePrefixes = {
      photorealistic: 'photorealistic, highly detailed, professional photography',
      artistic: 'digital art, artistic, creative, expressive',
      cartoon: 'cartoon style, colorful, fun, animated',
      meme: 'meme style, funny, viral, shareable, internet culture',
    }

    const prefix = stylePrefixes[style as keyof typeof stylePrefixes] || stylePrefixes.meme

    // Create meme-focused prompt
    return `${prefix}, ${prompt}, high quality, vibrant colors, trending style`
  }

  /**
   * Generate mock image URL using FPOImg service
   */
  private generateMockImageUrl(prompt: string): string {
    // Use a consistent seed based on prompt for reproducible images
    const seed = this.hashCode(prompt)

    // Create a short text from the prompt (max 30 characters for URL)
    const text = prompt.substring(0, 30).replace(/\s+/g, '+')

    // Use the FPOImg service as requested with custom styling
    return `https://fpoimg.com/400x350?text=${text}&bg_color=e6e6e6&text_color=8F8F8F&random=${seed}`
  }

  /**
   * Simple hash function for generating consistent seeds
   */
  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Generate mock image as fallback (legacy method)
   */
  private generateMockImage(prompt: string): string {
    return this.generateMockImageUrl(prompt)
  }

  /**
   * Check if Replicate API is configured
   */
  isConfigured(): boolean {
    return !!(process.env.REPLICATE_API_TOKEN)
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return ['stability-ai/stable-diffusion', 'openjourney', 'kandinsky']
  }
}

// Export singleton instance
export const replicateService = new ReplicateService()