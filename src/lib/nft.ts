import {
  createUmi,
  generateSigner,
  publicKey,
} from '@metaplex-foundation/umi'
import { createUmi as createDefaultUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  createNft,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'

// Real NFT implementation using Metaplex

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string
  }>
  external_url?: string
  properties?: {
    category: string
    creators?: Array<{
      address: string
      share: number
    }>
    files?: Array<{
      uri: string
      type: string
    }>
  }
}

export interface MintNFTOptions {
  name: string
  description: string
  image: string
  creatorPublicKey: string
  prompt?: string
  memeText?: string
  useOriginalImage?: boolean // Flag to use original image if it's already FPOImg
  attributes?: Array<{
    trait_type: string
    value: string
  }>
}

export class NFTService {
  private rpcUrl: string
  private umi: any

  constructor(rpcUrl: string = 'https://api.devnet.solana.com') {
    this.rpcUrl = rpcUrl
    this.umi = null // Will be initialized when wallet is provided
  }

  /**
   * Initialize NFT service with wallet adapter
   */
  async initialize(wallet: any): Promise<void> {
    try {
      this.umi = createDefaultUmi(this.rpcUrl)
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet))
      console.log('NFT Service initialized with wallet:', wallet.publicKey?.toBase58())
    } catch (error) {
      console.error('Failed to initialize NFT service:', error)
      throw new Error('Failed to initialize NFT service')
    }
  }

  /**
   * Create NFT metadata JSON
   */
  createMetadata(options: MintNFTOptions): NFTMetadata {
    const imageUrl = (options.useOriginalImage && options.image?.includes('fpoimg.com'))
      ? options.image
      : options.image

    return {
      name: options.name,
      description: options.description,
      image: imageUrl,
      attributes: [
        {
          trait_type: 'Platform',
          value: 'AI Meme Forge',
        },
        {
          trait_type: 'Protocol',
          value: 'x402',
        },
        {
          trait_type: 'Created',
          value: new Date().toISOString().split('T')[0],
        },
        ...(options.attributes || []),
      ],
      external_url: 'https://ai-meme-forge.vercel.app',
      properties: {
        category: 'image',
        creators: [
          {
            address: options.creatorPublicKey,
            share: 100,
          },
        ],
        files: [
          {
            uri: imageUrl,
            type: 'image/png',
          },
        ],
      },
    }
  }

  
  /**
   * Get image URL for NFT metadata
   * Using FPOImg service with custom text and seed
   */
  async getImageUrl(prompt: string, memeText?: string): Promise<string> {
    const text = memeText || prompt.slice(0, 50)
    const seed = Date.now().toString().slice(-6)
    return `https://fpoimg.com/1024x1024?text=${encodeURIComponent(text)}&bg_color=e6e6e6&text_color=8F8F8F&random=${seed}`
  }

  
  /**
   * Simple hash function for content
   */
  private simpleHash(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Mint NFT using Metaplex
   */
  async mintNFT(options: MintNFTOptions): Promise<{
    mintAddress: string
    metadataUri: string
    signature?: string
  }> {
    if (!this.umi) {
      throw new Error('NFT service not initialized')
    }

    const hasEnoughSOL = await this.checkBalance(0.01)
    if (!hasEnoughSOL) {
      throw new Error('Insufficient SOL balance for minting')
    }

    try {
      const metadata = this.createMetadata(options)

      let imageUri: string
      if (options.useOriginalImage && options.image?.includes('fpoimg.com')) {
        imageUri = options.image
      } else {
        imageUri = await this.getImageUrl(options.prompt || options.name, options.memeText)
      }

      metadata.image = imageUri

      const metadataId = `${Date.now()}-${encodeURIComponent(options.memeText || options.name || 'AI Meme').substring(0, 20).replace(/\s+/g, '_')}`
      const metadataUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/metadata/${metadataId}`

      const mint = generateSigner(this.umi)
      const transaction = await createNft(this.umi, {
        mint,
        name: metadata.name,
        symbol: 'AMF',
        uri: metadataUri,
        sellerFeeBasisPoints: 500 as any,
        creators: [
          {
            address: publicKey(options.creatorPublicKey),
            verified: true,
            share: 100,
          },
        ],
      })

      const signature = await transaction.sendAndConfirm(this.umi)
      const mintAddress = mint.publicKey.toString()
      const signatureString = (signature as any).signature || signature

      return {
        mintAddress,
        metadataUri,
        signature: signatureString,
      }
    } catch (error) {
      throw new Error(`Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get NFT explorer URL
   */
  getExplorerUrl(mintAddress: string, cluster: string = 'devnet'): string {
    const baseUrl = 'https://explorer.solana.com'
    return `${baseUrl}/address/${mintAddress}?cluster=${cluster}`
  }

  /**
   * Generate random NFT name (max 32 characters for Metaplex)
   */
  generateNFTName(prompt: string): string {
    const prefixes = ['AI', 'Art', 'Meme', 'Crypto', 'NFT']
    const suffixes = ['Token', 'NFT', 'Art']

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]

    // Take first 15 characters of prompt and truncate
    const promptPart = prompt.slice(0, 15).replace(/\s+/g, '')
    const timestamp = Date.now().toString().slice(-3)

    const name = `${prefix}${promptPart}${suffix}#${timestamp}`

    // Ensure it doesn't exceed 32 characters
    return name.length > 32 ? name.slice(0, 32) : name
  }

  /**
   * Check if wallet has sufficient SOL for minting
   */
  async checkBalance(requiredSol: number = 0.01): Promise<boolean> {
    try {
      // On devnet, skip balance check entirely for testing
      if (process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet') {
        console.log('Devnet: Skipping balance check for testing')
        return true
      }

      if (!this.umi) {
        console.warn('NFT service not initialized, returning true for demo')
        return true
      }
      const balance = await this.umi.rpc.getBalance(this.umi.identity.publicKey)
      const balanceInSol = Number(balance) / 1e9 // Convert lamports to SOL

      return balanceInSol >= requiredSol
    } catch (error) {
      console.error('Failed to check balance:', error)
      return true // Return true for demo purposes
    }
  }

  /**
   * Estimate minting cost
   */
  estimateMintingCost(): {
    rentExemption: number
    transactionFee: number
    metadataFee: number
    total: number
  } {
    const rentExemption = 0.002 // SOL
    const transactionFee = 0.000005 // SOL
    const metadataFee = 0.001 // SOL (approximate for Irys upload)

    return {
      rentExemption,
      transactionFee,
      metadataFee,
      total: rentExemption + transactionFee + metadataFee,
    }
  }
}

// Export singleton instance
export const nftService = new NFTService()