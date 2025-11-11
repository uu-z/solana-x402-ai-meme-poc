/**
 * x402 Protocol Client Utility
 * Handles the x402 payment flow for API access
 */

export interface X402PaymentRequest {
  amount: number // in SOL
  recipient: string // Solana public key
  reference?: string // Optional reference for the payment
}

export interface X402PaymentResponse {
  signature: string
  confirmed: boolean
  timestamp: number
}

export interface X402APICallOptions {
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: any
}

export class X402Client {
  private baseURL: string

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
  }

  /**
   * Make an API call with x402 payment verification
   * @param endpoint API endpoint to call
   * @param payment x402 payment details
   * @param options API call options
   */
  async makeAuthenticatedCall(
    endpoint: string,
    payment: X402PaymentRequest,
    options: X402APICallOptions = {}
  ): Promise<Response> {
    const { method = 'POST', headers = {}, body } = options

    // Add x402 payment headers
    const x402Headers = {
      ...headers,
      'x402-amount': payment.amount.toString(),
      'x402-currency': 'SOL',
      'x402-recipient': payment.recipient,
      ...(payment.reference && { 'x402-reference': payment.reference }),
    }

    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...x402Headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    return response
  }

  /**
   * Handle x402 payment challenge from API
   * @param challengeResponse 402 Payment Required response
   */
  async handlePaymentChallenge(challengeResponse: Response): Promise<{
    paymentRequired: boolean
    amount?: number
    recipient?: string
    reference?: string
    message?: string
  }> {
    if (challengeResponse.status !== 402) {
      return { paymentRequired: false }
    }

    try {
      const challengeData = await challengeResponse.json()

      return {
        paymentRequired: true,
        amount: parseFloat(challengeData.headers?.['x402-amount'] || '0.01'),
        recipient: challengeData.headers?.['x402-recipient'],
        reference: challengeData.headers?.['x402-reference'],
        message: challengeData.message || 'Payment required to access this resource',
      }
    } catch (error) {
      // Fallback to headers if JSON parsing fails
      return {
        paymentRequired: true,
        amount: parseFloat(challengeResponse.headers.get('x402-amount') || '0.01'),
        recipient: challengeResponse.headers.get('x402-recipient') || undefined,
        reference: challengeResponse.headers.get('x402-reference') || undefined,
      }
    }
  }

  /**
   * Verify payment transaction with x402 check endpoint
   * @param signature Transaction signature to verify
   * @param userWallet User's wallet address
   */
  async verifyPayment(
    signature: string,
    userWallet: string
  ): Promise<{ verified: boolean; amount?: number; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/x402/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionSignature: signature,
          userWallet,
        }),
      })

      const data = await response.json()

      if (response.ok && data.verified) {
        return {
          verified: true,
          amount: data.amount,
        }
      } else {
        return {
          verified: false,
          error: data.error || 'Payment verification failed',
        }
      }
    } catch (error) {
      return {
        verified: false,
        error: 'Network error during verification',
      }
    }
  }

  /**
   * Format SOL amount for display
   * @param lamports Amount in lamports
   */
  formatSOL(lamports: number): string {
    return (lamports / 1e9).toFixed(9).replace(/\.?0+$/, '') + ' SOL'
  }

  /**
   * Convert SOL to lamports
   * @param sol Amount in SOL
   */
  solToLamports(sol: number): number {
    return Math.floor(sol * 1e9)
  }

  /**
   * Create payment URL for transaction details
   * @param signature Transaction signature
   * @param cluster Solana cluster (mainnet, devnet, testnet)
   */
  createTransactionUrl(signature: string, cluster: string = 'devnet'): string {
    const baseUrl = cluster === 'mainnet' ? 'https://solscan.io/tx' : 'https://solscan.io/tx'
    return `${baseUrl}/${signature}${cluster !== 'mainnet' ? `?cluster=${cluster}` : ''}`
  }
}

// Export singleton instance
export const x402Client = new X402Client()

// Export types
export type { X402PaymentRequest, X402PaymentResponse, X402APICallOptions }