'use client'

import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

      // Step 1: Create and send payment transaction (x402 protocol)
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
        blockhash: latestBlockhash.blockhash,
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
        publicKey.toBase58(),
        {}
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

  const generateMemeWithoutPayment = async () => {
    if (!publicKey || !memeStore.validateForm()) return

    try {
      memeStore.clearError()
      walletStore.clearWalletError()

      const mockSignature = 'debug_' + Date.now().toString(36)
      setTransactionSignature(mockSignature)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Mode': 'skip-payment' },
        body: JSON.stringify({
          prompt: memeStore.currentPrompt,
          transactionSignature: mockSignature,
          userWallet: publicKey.toBase58(),
          debug: true,
          skipPayment: true
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate meme')
      }

      const data = await response.json()
      const newMeme = {
        id: crypto.randomUUID(),
        imageUrl: data.imageUrl,
        memeText: data.memeText,
        prompt: data.prompt,
        transactionSignature: 'DEBUG_' + mockSignature,
        createdAt: new Date(data.timestamp || data.generatedAt),
        amount: 0,
        model: data.model || memeStore.selectedModel,
        style: data.style || memeStore.selectedStyle,
      }

      memeStore.memes.unshift(newMeme)
      memeStore.currentPrompt = ''
      memeStore.formErrors = {}
      memeStore.isFormValid = false
      memeStore.saveToStorage()

      if (newMeme.imageUrl) {
        onMemeGenerated(newMeme.imageUrl)
      }

    } catch (err: any) {
      console.error('Debug mode error:', err)
      walletStore.setWalletError(err.message || 'Debug mode failed')
    }
  }

  const testPaymentFailure = async () => {
    if (!publicKey || !memeStore.validateForm()) return

    try {
      memeStore.clearError()
      walletStore.clearWalletError()

      const fakeSignature = 'fake_tx_' + Date.now().toString(36)
      setTransactionSignature(fakeSignature)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: memeStore.currentPrompt,
          transactionSignature: fakeSignature,
          userWallet: publicKey.toBase58(),
          testFailure: true
        }),
      })

      const data = await response.json()

      if (response.status === 402 || data.code === 'PAYMENT_VERIFICATION_FAILED') {
        walletStore.setWalletError('✅ Debug test successful: Payment verification working correctly')
      } else {
        walletStore.setWalletError(`Debug test result: ${data.error || 'Unknown'} (${response.status})`)
      }

    } catch (err: any) {
      walletStore.setWalletError(`Debug test error: ${err.message || 'Unknown'}`)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 backdrop-blur-sm shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 pb-4">
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
            Create Your AI Meme
          </span>
        </CardTitle>
        <CardDescription className="text-purple-600 dark:text-purple-400 font-medium">
          🎨 AI-powered • ⚡ Instant • 🪙 0.01 SOL
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Prompt Input */}
        <div className="space-y-3">
          <Label htmlFor="prompt" className="text-purple-700 dark:text-purple-300 font-semibold">
            Meme Prompt
          </Label>
          <Textarea
            id="prompt"
            value={memeStore.currentPrompt}
            onChange={(e) => memeStore.setCurrentPrompt(e.target.value)}
            placeholder="e.g., A cat working from home with coffee, distracted by a laser pointer"
            className="min-h-[100px] border-purple-200 dark:border-purple-700 bg-white/50 dark:bg-purple-950/50 focus:border-purple-400 dark:focus:border-purple-600 focus:ring-purple-400/20 transition-all duration-200"
            disabled={memeStore.isGenerating}
          />
          {memeStore.formErrors.prompt && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-400">
                {memeStore.formErrors.prompt}
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            💡 Be creative! The more specific your prompt, the better the result.
          </p>
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
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {memeStore.isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Creating Your Meme...</span>
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              <span>Generate AI Meme (0.01 SOL)</span>
            </>
          )}
        </Button>

        {!publicKey && (
          <p className="text-center text-sm text-amber-600 dark:text-amber-400 font-medium">
            ⚠️ Connect your wallet to start creating
          </p>
        )}

        {/* Debug Mode - Development Tools */}
        {publicKey && process.env.NODE_ENV === 'development' && (
          <div className="space-y-3">
            <Button
              onClick={generateMemeWithoutPayment}
              disabled={memeStore.isGenerating || !memeStore.isFormValid}
              variant="outline"
              className="w-full h-10 text-sm font-medium border-2 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-all duration-300"
            >
              <span className="mr-2">🐛</span>
              Debug: Skip Payment (Dev Only)
            </Button>

            <Button
              onClick={testPaymentFailure}
              disabled={memeStore.isGenerating || !memeStore.isFormValid}
              variant="outline"
              className="w-full h-10 text-sm font-medium border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300 hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-all duration-300"
            >
              <span className="mr-2">❌</span>
              Debug: Test Payment Failure
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Development tools for testing payment flows
            </p>
          </div>
        )}

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
          <p>⚡ Real-time Solana blockchain verification</p>
          <p>🔒 All transactions are real and on-chain</p>
        </div>
      </CardContent>
    </Card>
  )
})

MemeGenerator.displayName = 'MemeGenerator'

export default MemeGenerator