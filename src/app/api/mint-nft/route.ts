import { NextRequest, NextResponse } from 'next/server'
import { nftService } from '@/lib/nft'

export async function POST(request: NextRequest) {
  try {
    const {
      imageUrl,
      prompt,
      memeText,
      userPublicKey,
      model,
      style,
    } = await request.json()

    if (!imageUrl || !prompt || !userPublicKey) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, prompt, userPublicKey' },
        { status: 400 }
      )
    }

    // For API usage, we'll create a mock wallet for initialization
    // In a real app, the wallet would come from the client-side wallet adapter
    const mockWallet = {
      publicKey: { toBase58: () => userPublicKey },
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    }

    // Initialize NFT service with mock wallet
    await nftService.initialize(mockWallet)

    // Generate NFT name
    const nftName = nftService.generateNFTName(prompt)

    // Create NFT metadata
    const options = {
      name: nftName,
      description: `AI-generated meme created with x402 protocol. Original prompt: "${prompt}"`,
      image: imageUrl,
      creatorPublicKey: userPublicKey,
      attributes: [
        {
          trait_type: 'Prompt',
          value: prompt,
        },
        {
          trait_type: 'Meme Text',
          value: memeText,
        },
        {
          trait_type: 'AI Model',
          value: model || 'sdxl',
        },
        {
          trait_type: 'Style',
          value: style || 'meme',
        },
        {
          trait_type: 'Generation Date',
          value: new Date().toISOString(),
        },
      ],
    }

    // Mint NFT
    const result = await nftService.mintNFT(options)

    return NextResponse.json({
      success: true,
      mintAddress: result.mintAddress,
      metadataUri: result.metadataUri,
      explorerUrl: nftService.getExplorerUrl(result.mintAddress, 'devnet'),
      name: nftName,
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('NFT minting error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mint NFT' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'NFT Minting API',
    version: '1.0.0',
    network: 'devnet',
    features: [
      'AI Meme NFT Minting',
      'Metaplex Standard',
      'On-chain Metadata',
      'Creator Royalties',
    ],
    endpoints: {
      'POST /api/mint-nft': 'Mint an AI-generated meme as NFT',
    },
  })
}