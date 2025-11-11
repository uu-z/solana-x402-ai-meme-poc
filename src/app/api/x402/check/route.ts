import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'

// x402 Protocol Configuration
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const X402_PAYMENT_AMOUNT = parseFloat(process.env.X402_PAYMENT_AMOUNT || '0.01')
const X402_RECIPIENT_WALLET = process.env.NEXT_PUBLIC_RECIPIENT_WALLET || '4YweNXQbjMMDnD2sBG5FSWDP5mnqeu1gmCm48r4WV9q3'

const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 x402 Protocol: Payment verification initiated')

    const { transactionSignature, userWallet, amount = X402_PAYMENT_AMOUNT } = await request.json()

    // Validate required parameters
    if (!transactionSignature || !userWallet) {
      console.error('❌ x402: Missing required parameters')
      return NextResponse.json(
        {
          verified: false,
          error: 'Missing transaction signature or user wallet',
          code: 'MISSING_PARAMS'
        },
        { status: 400 }
      )
    }

    // Validate transaction signature format
    if (!transactionSignature || typeof transactionSignature !== 'string' || transactionSignature.length < 64) {
      console.error('❌ x402: Invalid transaction signature format')
      return NextResponse.json(
        {
          verified: false,
          error: 'Invalid transaction signature format',
          code: 'INVALID_SIGNATURE',
          protocol: 'x402',
          payment_required: '0.01 SOL'
        },
        {
          status: 402,
          headers: {
            'Payment-Required': 'true',
            'X-Protocol': 'x402',
            'X-Payment-Amount': X402_PAYMENT_AMOUNT.toString(),
            'X-Payment-Currency': 'SOL'
          }
        }
      )
    }

    console.log('📡 x402: Fetching transaction from blockchain...', {
      signature: transactionSignature.slice(0, 10) + '...',
      userWallet: userWallet.slice(0, 10) + '...'
    })

    // Get transaction details with proper commitment
    const transaction = await connection.getTransaction(transactionSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    })

    if (!transaction) {
      console.error('❌ x402: Transaction not found on blockchain')
      return NextResponse.json(
        {
          verified: false,
          error: 'Transaction not found or not confirmed',
          code: 'TRANSACTION_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    console.log('✅ x402: Transaction found:', {
      slot: transaction.slot,
      blockTime: transaction.blockTime,
      err: transaction.meta?.err,
      status: transaction.meta?.err ? 'FAILED' : 'SUCCESS'
    })

    // Verify the transaction is confirmed and successful
    if (transaction.meta?.err) {
      console.error('❌ x402: Transaction failed:', transaction.meta.err)
      return NextResponse.json(
        {
          verified: false,
          error: 'Transaction execution failed',
          code: 'TRANSACTION_FAILED',
          details: transaction.meta.err,
          protocol: 'x402',
          payment_required: `${X402_PAYMENT_AMOUNT} SOL`
        },
        {
          status: 402,
          headers: {
            'Payment-Required': 'true',
            'X-Protocol': 'x402',
            'X-Payment-Amount': X402_PAYMENT_AMOUNT.toString(),
            'X-Payment-Currency': 'SOL'
          }
        }
      )
    }

    console.log('✅ x402: Transaction confirmed, extracting payment details...')

    // Extract transaction details for x402 protocol verification
    const message = transaction.transaction?.message
    let senderAddress: string | undefined
    let recipientAddress: string | undefined

    if (message?.getAccountKeys) {
      const accountKeys = message.getAccountKeys()
      // Handle both array and MessageAccountKeys types
      if (Array.isArray(accountKeys)) {
        senderAddress = accountKeys[0]?.toBase58()
        recipientAddress = accountKeys[1]?.toBase58()
      } else {
        // MessageAccountKeys case - get the first two accounts
        const keys = accountKeys.staticAccountKeys || []
        senderAddress = keys[0]?.toBase58()
        recipientAddress = keys[1]?.toBase58()
      }
    }

    console.log('👤 x402: Extracted addresses:', {
      sender: senderAddress?.slice(0, 10) + '...',
      recipient: recipientAddress?.slice(0, 10) + '...',
      expectedRecipient: X402_RECIPIENT_WALLET.slice(0, 10) + '...'
    })

    // Verify sender matches user wallet
    if (senderAddress !== userWallet) {
      console.error('❌ x402: Sender address mismatch')
      return NextResponse.json(
        {
          verified: false,
          error: 'Transaction sender does not match user wallet',
          code: 'SENDER_MISMATCH',
          expected: userWallet,
          actual: senderAddress
        },
        { status: 400 }
      )
    }

    // Verify recipient matches expected x402 recipient
    if (recipientAddress !== X402_RECIPIENT_WALLET) {
      console.error('❌ x402: Recipient address mismatch')
      return NextResponse.json(
        {
          verified: false,
          error: 'Transaction recipient does not match expected x402 recipient',
          code: 'RECIPIENT_MISMATCH',
          expected: X402_RECIPIENT_WALLET,
          actual: recipientAddress
        },
        { status: 400 }
      )
    }

    // Calculate and verify payment amount
    const preBalances = transaction.meta?.preBalances || []
    const postBalances = transaction.meta?.postBalances || []

    if (preBalances.length > 0 && postBalances.length > 0) {
      const balanceChange = (preBalances[0] - postBalances[0]) / 1e9 // Convert lamports to SOL
      const requiredAmount = amount

      console.log('💰 x402: Payment analysis:', {
        balanceChange,
        requiredAmount,
        sufficient: balanceChange >= requiredAmount
      })

      if (balanceChange >= requiredAmount) {
        console.log('✅ x402: Payment verified successfully!')

        return NextResponse.json({
          verified: true,
          amount: balanceChange,
          requiredAmount,
          signature: transactionSignature,
          timestamp: transaction.blockTime,
          sender: senderAddress,
          recipient: recipientAddress,
          protocol: 'x402',
          network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
        }, {
          headers: {
            'X-Protocol': 'x402',
            'X-Payment-Verified': 'true',
            'X-Payment-Amount': balanceChange.toString(),
            'X-Payment-Currency': 'SOL',
            'X-Payment-Signature': transactionSignature
          }
        })
      } else {
        console.error('❌ x402: Insufficient payment amount')
        return NextResponse.json(
          {
            verified: false,
            error: 'Insufficient payment amount',
            code: 'INSUFFICIENT_AMOUNT',
            paid: balanceChange,
            required: requiredAmount,
            protocol: 'x402',
            payment_required: `${requiredAmount} SOL`
          },
          {
            status: 402, // HTTP 402 Payment Required
            headers: {
              'Payment-Required': 'true',
              'X-Protocol': 'x402',
              'X-Payment-Amount': requiredAmount.toString(),
              'X-Payment-Currency': 'SOL',
              'X-Payment-Paid': balanceChange.toString()
            }
          }
        )
      }
    } else {
      console.error('❌ x402: No balance data found in transaction')
      return NextResponse.json(
        {
          verified: false,
          error: 'Unable to verify payment amount - no balance data',
          code: 'NO_BALANCE_DATA',
          protocol: 'x402',
          payment_required: `${X402_PAYMENT_AMOUNT} SOL`
        },
        {
          status: 402,
          headers: {
            'Payment-Required': 'true',
            'X-Protocol': 'x402',
            'X-Payment-Amount': X402_PAYMENT_AMOUNT.toString(),
            'X-Payment-Currency': 'SOL'
          }
        }
      )
    }

  } catch (error) {
    console.error('❌ x402: Verification error:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message
      })
    }

    return NextResponse.json(
      {
        verified: false,
        error: 'x402 payment verification failed',
        code: 'VERIFICATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    protocol: 'x402',
    version: '1.0.0',
    description: 'x402 Payment Verification Protocol',
    endpoints: {
      'POST /api/x402/check': 'Verify x402 payment transaction',
    },
    configuration: {
      paymentAmount: X402_PAYMENT_AMOUNT,
      recipientWallet: X402_RECIPIENT_WALLET,
      network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
    }
  })
}