import { makeAutoObservable, runInAction } from 'mobx'

export interface MemeResult {
  id: string
  imageUrl: string
  memeText: string
  prompt: string
  transactionSignature: string
  createdAt: Date
  amount: number
}

export interface GenerationError {
  message: string
  code?: string
  details?: any
}

class MemeStore {
  // State
  memes: MemeResult[] = []
  isGenerating = false
  error: GenerationError | null = null
  currentPrompt = ''

  // Form state
  formErrors: Record<string, string> = {}
  isFormValid = false

  constructor() {
    makeAutoObservable(this)
  }

  // Actions
  setCurrentPrompt(prompt: string) {
    this.currentPrompt = prompt
    this.validateForm()
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
    userWallet: string
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
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate meme')
      }

      const data = await response.json()

      const newMeme: MemeResult = {
        id: crypto.randomUUID(),
        imageUrl: data.imageUrl,
        memeText: data.memeText,
        prompt: data.prompt,
        transactionSignature: data.paymentVerified.signature,
        createdAt: new Date(data.timestamp),
        amount: data.paymentVerified.amount,
      }

      runInAction(() => {
        this.memes.unshift(newMeme)
        this.currentPrompt = ''
        this.formErrors = {}
        this.isFormValid = false
      })

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
  }
}

export const memeStore = new MemeStore()