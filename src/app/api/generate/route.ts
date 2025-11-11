import { NextRequest, NextResponse } from 'next/server'

// Mock AI generation - in production, this would call a real AI service
async function generateAIMemeImage(prompt: string): Promise<string> {
  // For demo purposes, return a placeholder image
  // In production, you'd integrate with:
  // - OpenAI DALL-E API
  // - Stability AI API
  // - Midjourney API
  // - Or your own AI image generation service

  const memes = [
    'https://via.placeholder.com/512x512/FF6B6B/FFFFFF?text=AI+Generated+Meme+1',
    'https://via.placeholder.com/512x512/4ECDC4/FFFFFF?text=AI+Generated+Meme+2',
    'https://via.placeholder.com/512x512/45B7D1/FFFFFF?text=AI+Generated+Meme+3',
    'https://via.placeholder.com/512x512/96CEB4/FFFFFF?text=AI+Generated+Meme+4',
    'https://via.placeholder.com/512x512/FFEAA7/000000?text=AI+Generated+Meme+5',
  ]

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Return a random meme placeholder with prompt
  const randomIndex = Math.floor(Math.random() * memes.length)
  return `${memes[randomIndex]}&prompt=${encodeURIComponent(prompt.substring(0, 30))}`
}

async function generateAIMemeText(prompt: string): Promise<string> {
  // Mock AI text generation
  const templates = [
    `When you ${prompt.toLowerCase()} but the deadline is tomorrow`,
    `${prompt}: Solana Edition`,
    `Me trying to ${prompt.toLowerCase()} while my SOL bags are heavy`,
    `${prompt}? More like SOLana to the moon! 🚀`,
    `That moment when you ${prompt.toLowerCase()} and remember you bought the dip`,
  ]

  return templates[Math.floor(Math.random() * templates.length)]
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, transactionSignature, userWallet } = await request.json()

    if (!prompt || !transactionSignature || !userWallet) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, transactionSignature, userWallet' },
        { status: 400 }
      )
    }

    // Verify the x402 payment first
    const x402CheckResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/x402/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionSignature,
        userWallet,
      }),
    })

    const x402Data = await x402CheckResponse.json()

    if (!x402Data.verified) {
      return NextResponse.json(
        { error: 'Payment verification failed', details: x402Data.error },
        { status: 402 } // HTTP 402 Payment Required
      )
    }

    // Generate the AI content
    const [imageUrl, memeText] = await Promise.all([
      generateAIMemeImage(prompt),
      generateAIMemeText(prompt),
    ])

    return NextResponse.json({
      success: true,
      imageUrl,
      memeText,
      prompt,
      paymentVerified: {
        signature: transactionSignature,
        amount: x402Data.amount,
        timestamp: x402Data.timestamp,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate meme content' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'AI Meme Generator API',
    version: '1.0.0',
    protocol: 'x402',
    endpoints: {
      'POST /api/generate': 'Generate AI meme after payment verification',
      'POST /api/x402/check': 'Verify x402 payment transaction',
    },
  })
}