'use client'

import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, Sparkles, AlertCircle } from 'lucide-react'
import { memeStore, walletStore } from '@/stores'

interface MemeGeneratorProps {
  onMemeGenerated: (imageUrl: string) => void
}

const MemeGenerator = observer(({ onMemeGenerated }: MemeGeneratorProps) => {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null)

  const generateMeme = async () => {
    if (!publicKey) {
      walletStore.setWalletError('Please connect your wallet first')
      return
    }

    if (!memeStore.validateForm()) {
      return
    }

    try {
      // Clear any previous errors
      memeStore.clearError()
      walletStore.clearWalletError()

      // Step 1: Create and send payment transaction (x402 simulation)
      const paymentAmount = 0.01 // 0.01 SOL
      const recipientAddress = new PublicKey(process.env.NEXT_PUBLIC_RECIPIENT_WALLET || '4YweNXQbjMMDnD2sBG5FSWDP5mnqeu1gmCm48r4WV9q3')

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientAddress,
          lamports: paymentAmount * LAMPORTS_PER_SOL,
        })
      )

      const signature = await sendTransaction(transaction, connection)

      if (!signature) {
        throw new Error('Transaction signature is undefined')
      }

      setTransactionSignature(signature)

      // Wait for transaction confirmation
      const latestBlockhash = await connection.getLatestBlockhash()
      const confirmation = await connection.confirmTransaction({
        signature,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        abortSignal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (confirmation.value.err) {
        throw new Error('Transaction failed')
      }

      // Record transaction in wallet store
      walletStore.recordTransaction(signature, paymentAmount, Date.now(), true)

      // Step 2: Generate meme using the store method
      await memeStore.generateMeme(
        memeStore.currentPrompt,
        signature,
        publicKey.toBase58()
      )

      // Get the latest generated meme and notify parent
      const latestMeme = memeStore.getLatestMeme()
      if (latestMeme) {
        onMemeGenerated(latestMeme.imageUrl)
      }

    } catch (err: any) {
      console.error('Error generating meme:', err)

      // Handle specific wallet errors
      if (err.name === 'WalletSendTransactionError') {
        walletStore.setWalletError('Transaction failed. Please check your SOL balance and try again.')
      } else {
        memeStore.clearError() // Clear any previous meme store errors
        walletStore.setWalletError(err.message || 'Failed to generate meme. Please try again.')
      }
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Create Your AI Meme
        </CardTitle>
        <CardDescription>
          Enter a creative prompt and pay 0.01 SOL to generate a unique AI-powered meme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Meme Prompt</Label>
          <Textarea
            id="prompt"
            value={memeStore.currentPrompt}
            onChange={(e) => memeStore.setCurrentPrompt(e.target.value)}
            placeholder="e.g., A cat working from home with coffee, distracted by a laser pointer"
            className="min-h-[80px]"
            disabled={memeStore.isGenerating}
          />
          {memeStore.formErrors.prompt && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {memeStore.formErrors.prompt}
            </p>
          )}
        </div>

        {/* Wallet Error */}
        {walletStore.walletError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{walletStore.walletError}</AlertDescription>
          </Alert>
        )}

        {/* Meme Generation Error */}
        {memeStore.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{memeStore.error.message}</AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        <Button
          onClick={generateMeme}
          disabled={memeStore.isGenerating || !memeStore.isFormValid || !publicKey}
          className="w-full"
        >
          {memeStore.isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Meme...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Meme (0.01 SOL)
            </>
          )}
        </Button>

        {/* Transaction Confirmation */}
        {transactionSignature && (
          <Alert>
            <AlertDescription className="space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <span className="font-semibold">✅ Payment Confirmed!</span>
              </div>
              <div className="text-xs space-y-1">
                <p>
                  Transaction:{' '}
                  <span className="font-mono break-all">
                    {transactionSignature.slice(0, 20)}...
                    {transactionSignature.slice(-20)}
                  </span>
                </p>
                <a
                  href={`https://solscan.io/tx/${transactionSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on Solscan
                </a>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Info */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>💰 Payment: 0.01 SOL (Devnet)</p>
          <p>🤖 AI Generation via x402 Protocol</p>
          <p>⚡ Instant verification on Solana blockchain</p>
        </div>
      </CardContent>
    </Card>
  )
})

MemeGenerator.displayName = 'MemeGenerator'

export default MemeGenerator