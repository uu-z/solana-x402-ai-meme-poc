/**
 * x402 Protocol Client
 *
 * A standardized client for interacting with the x402 payment protocol
 * This provides a clean interface for verifying payments and handling x402-specific responses
 */

export interface X402PaymentRequest {
  transactionSignature: string
  userWallet: string
  amount?: number
}

export interface X402PaymentResponse {
  verified: boolean
  amount?: number
  signature?: string
  timestamp?: number
  sender?: string
  recipient?: string
  protocol?: string
  network?: string
  error?: string
  code?: string
  details?: any
  httpStatus?: number
}

export interface X402Config {
  baseUrl: string
  defaultAmount: number
  recipientWallet: string
  network: string
}

class X402Client {
  private config: X402Config

  constructor(config: Partial<X402Config> = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000',
      defaultAmount: config.defaultAmount || parseFloat(process.env.X402_PAYMENT_AMOUNT || '0.01'),
      recipientWallet: config.recipientWallet || process.env.NEXT_PUBLIC_RECIPIENT_WALLET || '',
      network: config.network || process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
      ...config
    }
  }

  /**
   * Verify a payment using the x402 protocol
   */
  async verifyPayment(request: X402PaymentRequest): Promise<X402PaymentResponse> {
    try {
      console.log('🔍 x402 Client: Verifying payment...', {
        signature: request.transactionSignature.slice(0, 10) + '...',
        wallet: request.userWallet.slice(0, 10) + '...',
        amount: request.amount || this.config.defaultAmount
      })

      const response = await fetch(`${this.config.baseUrl}/api/x402/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'x402-client/1.0.0'
        },
        body: JSON.stringify({
          transactionSignature: request.transactionSignature,
          userWallet: request.userWallet,
          amount: request.amount || this.config.defaultAmount
        })
      })

      const data = await response.json()

      console.log('📋 x402 Client: Verification response:', {
        status: response.status,
        verified: data.verified,
        code: data.code
      })

      if (!response.ok) {
        return {
          verified: false,
          error: data.error || 'Payment verification failed',
          code: data.code || 'VERIFICATION_FAILED',
          httpStatus: response.status,
          details: data
        }
      }

      if (!data.verified) {
        return {
          verified: false,
          error: data.error || 'Payment not verified',
          code: data.code || 'NOT_VERIFIED',
          details: data
        }
      }

      console.log('✅ x402 Client: Payment verified successfully!')

      return {
        verified: true,
        amount: data.amount,
        signature: data.signature,
        timestamp: data.timestamp,
        sender: data.sender,
        recipient: data.recipient,
        protocol: data.protocol,
        network: data.network,
        details: data
      }

    } catch (error) {
      console.error('❌ x402 Client: Verification error:', error)

      return {
        verified: false,
        error: 'x402 verification service unavailable',
        code: 'SERVICE_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get x402 protocol configuration
   */
  getConfig(): X402Config {
    return { ...this.config }
  }

  /**
   * Check if the x402 service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/x402/check`, {
        method: 'GET',
        headers: {
          'User-Agent': 'x402-client/1.0.0'
        }
      })

      return response.ok
    } catch (error) {
      console.error('x402 Client: Health check failed:', error)
      return false
    }
  }

  /**
   * Create a standardized payment request object
   */
  createPaymentRequest(
    transactionSignature: string,
    userWallet: string,
    amount?: number
  ): X402PaymentRequest {
    return {
      transactionSignature,
      userWallet,
      amount: amount || this.config.defaultAmount
    }
  }

  /**
   * Handle x402 payment verification errors
   */
  handlePaymentError(response: X402PaymentResponse): {
    shouldRetry: boolean
    userMessage: string
    technicalDetails: string
  } {
    const { code, error, details } = response

    switch (code) {
      case 'PAYMENT_REQUIRED':
      case 'INSUFFICIENT_AMOUNT':
        return {
          shouldRetry: false,
          userMessage: 'Payment required. Please ensure you have sufficient SOL balance.',
          technicalDetails: error || 'Insufficient payment amount'
        }

      case 'TRANSACTION_NOT_FOUND':
      case 'TRANSACTION_FAILED':
        return {
          shouldRetry: true,
          userMessage: 'Transaction issue detected. Please try again.',
          technicalDetails: error || 'Transaction not found or failed'
        }

      case 'SENDER_MISMATCH':
      case 'RECIPIENT_MISMATCH':
        return {
          shouldRetry: false,
          userMessage: 'Transaction validation failed. Please contact support.',
          technicalDetails: error || 'Address mismatch'
        }

      case 'SERVICE_ERROR':
      case 'VERIFICATION_ERROR':
        return {
          shouldRetry: true,
          userMessage: 'Payment verification service temporarily unavailable. Please try again.',
          technicalDetails: error || 'Service error'
        }

      default:
        return {
          shouldRetry: true,
          userMessage: 'Payment verification failed. Please try again.',
          technicalDetails: error || 'Unknown error'
        }
    }
  }
}

// Create singleton instance
export const x402Client = new X402Client()

// Export the class for custom instances
export { X402Client }

// Export types
export type { X402PaymentRequest, X402PaymentResponse, X402Config }