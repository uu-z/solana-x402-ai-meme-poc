import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

export async function POST(request: NextRequest) {
  try {
    const { transactionSignature, userWallet } = await request.json()

    if (!transactionSignature || !userWallet) {
      return NextResponse.json(
        { error: 'Missing transaction signature or user wallet' },
        { status: 400 }
      )
    }

    // Get transaction details
    const transaction = await connection.getTransaction(transactionSignature, {
      maxSupportedTransactionVersion: 0,
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Verify the transaction is confirmed
    if (!transaction.meta?.err) {
      // Extract transaction details for x402 protocol verification
      const message = transaction.transaction?.message
      const accountKeys = message?.accountKeys ?? []

      // Verify the user was the sender
      const senderAddress = accountKeys[0]?.toBase58()
      if (senderAddress !== userWallet) {
        return NextResponse.json(
          { error: 'Transaction sender does not match user wallet' },
          { status: 400 }
        )
      }

      // Check payment amount (should be >= 0.01 SOL)
      const preBalances = transaction.meta?.preBalances || []
      const postBalances = transaction.meta?.postBalances || []

      if (preBalances.length > 0 && postBalances.length > 0) {
        const balanceChange = (preBalances[0] - postBalances[0]) / 1e9 // Convert lamports to SOL

        if (balanceChange >= 0.01) {
          return NextResponse.json({
            verified: true,
            amount: balanceChange,
            signature: transactionSignature,
            timestamp: transaction.blockTime,
          })
        }
      }
    }

    return NextResponse.json(
      { verified: false, error: 'Invalid transaction or insufficient payment' },
      { status: 400 }
    )

  } catch (error) {
    console.error('x402 check error:', error)
    return NextResponse.json(
      { error: 'Failed to verify transaction' },
      { status: 500 }
    )
  }
}