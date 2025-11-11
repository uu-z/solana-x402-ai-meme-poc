import { makeAutoObservable, runInAction } from 'mobx'

export interface MemeResult {
  id: string
  imageUrl: string
  memeText: string
  prompt: string
  transactionSignature: string
  createdAt: Date
  amount: number
  nftMintAddress?: string
  nftMetadataUri?: string
  nftSignature?: string
  model?: string
  style?: string
}

export interface GenerationError {
  message: string
  code?: string
  details?: any
}

export interface GenerationOptions {
  model?: 'sdxl' | 'openjourney' | 'kandinsky'
  style?: 'photorealistic' | 'artistic' | 'cartoon' | 'meme'
  width?: number
  height?: number
}

class MemeStore {
  // State
  memes: MemeResult[] = []
  isGenerating = false
  error: GenerationError | null = null
  currentPrompt = ''
  selectedModel: GenerationOptions['model'] = 'sdxl'
  selectedStyle: GenerationOptions['style'] = 'meme'

  // Form state
  formErrors: Record<string, string> = {}
  isFormValid = false

  // NFT state
  isMinting = false
  mintingError: GenerationError | null = null

  // LocalStorage keys
  private readonly STORAGE_KEY = 'ai-meme-forge-memes'
  private readonly MAX_STORED_MEMES = 50

  constructor() {
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  // Load memes from localStorage
  loadFromStorage(): void {
    try {
      if (typeof window === 'undefined') {
        return // Skip localStorage access during server-side rendering
      }
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const memes = JSON.parse(stored)
        runInAction(() => {
          this.memes = memes.map((meme: any) => ({
            ...meme,
            createdAt: new Date(meme.createdAt),
          }))
        })
      }
    } catch (error) {
      console.error('Failed to load memes from storage:', error)
    }
  }

  // Save memes to localStorage
  saveToStorage(): void {
    try {
      if (typeof window === 'undefined') {
        return // Skip localStorage access during server-side rendering
      }
      const memesToStore = this.memes.slice(0, this.MAX_STORED_MEMES)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memesToStore))
    } catch (error) {
      console.error('Failed to save memes to storage:', error)
    }
  }

  // Actions
  setCurrentPrompt(prompt: string) {
    this.currentPrompt = prompt
    this.validateForm()
  }

  setSelectedModel(model: GenerationOptions['model']) {
    this.selectedModel = model
  }

  setSelectedStyle(style: GenerationOptions['style']) {
    this.selectedStyle = style
  }

  validateForm() {
    const errors: Record<string, string> = {}

    if (!this.currentPrompt.trim()) {
      errors.prompt = 'Please enter a prompt for the meme'
    } else if (this.currentPrompt.trim().length < 3) {
      errors.prompt = 'Prompt must be at least 3 characters long'
    } else if (this.currentPrompt.trim().length > 500) {
      errors.prompt = 'Prompt must be less than 500 characters'
    }

    runInAction(() => {
      this.formErrors = errors
      this.isFormValid = Object.keys(errors).length === 0
    })

    return this.isFormValid
  }

  async generateMeme(
    prompt: string,
    transactionSignature: string,
    userWallet: string,
    options?: GenerationOptions
  ): Promise<void> {
    if (!this.validateForm()) {
      return
    }

    runInAction(() => {
      this.isGenerating = true
      this.error = null
    })

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          transactionSignature,
          userWallet,
          model: options?.model || this.selectedModel,
          style: options?.style || this.selectedStyle,
          width: options?.width || 1024,
          height: options?.height || 1024,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate meme')
      }

      const data = await response.json()

      // x402 Protocol Standard Response Format
      const newMeme: MemeResult = {
        id: crypto.randomUUID(),
        imageUrl: data.imageUrl,
        memeText: data.memeText,
        prompt: data.prompt,
        transactionSignature: data.paymentVerified.signature,
        createdAt: new Date(data.timestamp || data.generatedAt),
        amount: data.paymentVerified.amount,
        model: data.model || options?.model || this.selectedModel,
        style: data.style || options?.style || this.selectedStyle,
      }

      runInAction(() => {
        this.memes.unshift(newMeme)
        this.currentPrompt = ''
        this.formErrors = {}
        this.isFormValid = false
      })

      // Save to localStorage
      this.saveToStorage()

    } catch (err: any) {
      console.error('Error generating meme:', err)
      runInAction(() => {
        this.error = {
          message: err.message || 'Failed to generate meme. Please try again.',
          details: err,
        }
      })
    } finally {
      runInAction(() => {
        this.isGenerating = false
      })
    }
  }

  clearError() {
    this.error = null
  }

  clearFormErrors() {
    this.formErrors = {}
  }

  getGeneratedMemes(): MemeResult[] {
    return [...this.memes]
  }

  getLatestMeme(): MemeResult | undefined {
    return this.memes[0]
  }

  hasMemes(): boolean {
    return this.memes.length > 0
  }

  reset() {
    this.memes = []
    this.isGenerating = false
    this.error = null
    this.currentPrompt = ''
    this.formErrors = {}
    this.isFormValid = false
    this.selectedModel = 'sdxl'
    this.selectedStyle = 'meme'
    this.isMinting = false
    this.mintingError = null
  }

  // NFT Minting Methods - Real Blockchain Implementation
  async mintNFT(
    memeId: string,
    userWallet: any
  ): Promise<{ mintAddress: string; metadataUri: string; signature: string }> {
    const meme = this.memes.find(m => m.id === memeId)
    if (!meme) {
      throw new Error('Meme not found')
    }

    // Check if already minted
    if (meme.nftMintAddress) {
      console.log('NFT already minted:', meme.nftMintAddress)
      return {
        mintAddress: meme.nftMintAddress,
        metadataUri: meme.nftMetadataUri || '',
        signature: meme.nftSignature || '',
      }
    }

    runInAction(() => {
      this.isMinting = true
      this.mintingError = null
    })

    try {
      console.log('Starting NFT minting process for meme:', memeId)

      // Import nftService dynamically to avoid SSR issues
      const { nftService } = await import('@/lib/nft')

      // Initialize NFT service with user's wallet
      console.log('Initializing NFT service with wallet...')
      await nftService.initialize(userWallet)

      // Skip balance check on devnet for testing
      if (process.env.NEXT_PUBLIC_SOLANA_NETWORK !== 'devnet') {
        const balanceCheck = await nftService.checkBalance(0.01)
        if (!balanceCheck) {
          throw new Error('Insufficient SOL balance for NFT minting. Please ensure you have at least 0.01 SOL.')
        }
      } else {
        console.log('Devnet: Skipping SOL balance check for NFT minting')
      }

      // Generate NFT name
      const nftName = nftService.generateNFTName(meme.prompt)
      console.log('Generated NFT name:', nftName)

      // Mint NFT directly on client side - Real Blockchain Transaction
      console.log('Creating NFT on Solana blockchain...')

      // Check if the meme imageUrl is already a FPOImg.com link
      const isFPOImgLink = meme.imageUrl && meme.imageUrl.includes('fpoimg.com')
      console.log('Meme image URL check:', {
        imageUrl: meme.imageUrl,
        isFPOImgLink
      })

      const result = await nftService.mintNFT({
        name: nftName,
        description: `AI-generated meme created with x402 protocol. Original prompt: "${meme.prompt}"`,
        image: meme.imageUrl, // Use the original URL directly
        prompt: meme.prompt,
        memeText: meme.memeText,
        creatorPublicKey: userWallet.publicKey.toBase58(),
        useOriginalImage: isFPOImgLink, // Flag to use original image if it's FPOImg
        attributes: [
          {
            trait_type: 'Prompt',
            value: meme.prompt,
          },
          {
            trait_type: 'Meme Text',
            value: meme.memeText,
          },
          {
            trait_type: 'AI Model',
            value: meme.model || 'sdxl',
          },
          {
            trait_type: 'Style',
            value: meme.style || 'meme',
          },
          {
            trait_type: 'Generation Date',
            value: meme.createdAt.toISOString(),
          },
          {
            trait_type: 'Platform',
            value: 'AI Meme Forge',
          },
          {
            trait_type: 'Protocol',
            value: 'x402',
          },
        ],
      })

      console.log('NFT minting successful:', result)

      // Update meme with NFT details
      runInAction(() => {
        const memeIndex = this.memes.findIndex(m => m.id === memeId)
        if (memeIndex !== -1) {
          this.memes[memeIndex].nftMintAddress = result.mintAddress
          this.memes[memeIndex].nftMetadataUri = result.metadataUri
          this.memes[memeIndex].nftSignature = result.signature
          console.log('Updated meme with NFT details')
        }
        this.saveToStorage()
      })

      return {
        mintAddress: result.mintAddress,
        metadataUri: result.metadataUri,
        signature: result.signature || '',
      }

    } catch (err: any) {
      console.error('Error minting NFT:', err)
      runInAction(() => {
        this.mintingError = {
          message: err.message || 'Failed to mint NFT. Please ensure you have sufficient SOL balance and try again.',
          details: err,
        }
      })
      throw err
    } finally {
      runInAction(() => {
        this.isMinting = false
      })
    }
  }

  clearMintingError() {
    this.mintingError = null
  }

  // Storage Methods
  clearStorage() {
    localStorage.removeItem(this.STORAGE_KEY)
    runInAction(() => {
      this.memes = []
    })
  }
}

export const memeStore = new MemeStore()