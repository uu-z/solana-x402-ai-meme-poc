import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    console.log('📋 NFT Metadata Request:', { id })

    // This is a mock metadata service for development
    // In production, this would fetch from IPFS, Arweave, or a database

    // Parse the ID to extract meme information if possible
    const timestamp = id.split('-')[0]
    const memeText = decodeURIComponent(id.split('-').slice(1).join('-') || 'AI Meme')

    const metadata = {
      name: `AI Meme #${timestamp}`,
      description: `AI-generated meme created with x402 protocol. Generated on ${new Date(parseInt(timestamp)).toLocaleDateString()}`,
      image: `https://fpoimg.com/1024x1024?text=${encodeURIComponent(memeText.substring(0, 30))}&bg_color=e6e6e6&text_color=8F8F8F&random=${timestamp}`,
      attributes: [
        {
          trait_type: 'Platform',
          value: 'AI Meme Forge'
        },
        {
          trait_type: 'Protocol',
          value: 'x402'
        },
        {
          trait_type: 'Created',
          value: new Date(parseInt(timestamp)).toISOString().split('T')[0]
        },
        {
          trait_type: 'Meme Text',
          value: memeText
        }
      ],
      external_url: 'https://ai-meme-forge.vercel.app',
      properties: {
        category: 'image',
        creators: [
          {
            address: '4YweNXQbjMMDnD2sBG5FSWDP5mnqeu1gmCm48r4WV9q3',
            share: 100
          }
        ],
        files: [
          {
            uri: `https://fpoimg.com/1024x1024?text=${encodeURIComponent(memeText.substring(0, 30))}&bg_color=e6e6e6&text_color=8F8F8F&random=${timestamp}`,
            type: 'image/png'
          }
        ]
      },
      collection: {
        name: 'AI Meme Forge Collection',
        family: 'AI Meme Forge'
      }
    }

    console.log('✅ Metadata served:', {
      id,
      name: metadata.name,
      image: metadata.image
    })

    return NextResponse.json(metadata)

  } catch (error) {
    console.error('❌ Metadata fetch error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch metadata',
        code: 'METADATA_ERROR'
      },
      { status: 500 }
    )
  }
}