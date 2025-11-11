'use client'

import { observer } from 'mobx-react-lite'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, Gift, AlertCircle, Crown } from 'lucide-react'
import { memeStore } from '@/stores'
import { nftService } from '@/lib/nft'

interface NFTMinterProps {
  memeId: string
  imageUrl: string
  prompt: string
  onMinted?: (mintAddress: string) => void
}

const NFTMinter = observer(({ memeId, imageUrl, prompt, onMinted }: NFTMinterProps) => {
  const wallet = useWallet()
  const { publicKey } = wallet
  const [mintResult, setMintResult] = useState<{
    mintAddress: string
    metadataUri: string
    signature?: string
  } | null>(null)

  const meme = memeStore.memes.find(m => m.id === memeId)
  const isAlreadyMinted = !!meme?.nftMintAddress

  const handleMintNFT = async () => {
    if (!publicKey || !wallet) {
      alert('Please connect your wallet first')
      return
    }

    try {
      const result = await memeStore.mintNFT(memeId, wallet)
      setMintResult(result)
      onMinted?.(result.mintAddress)
    } catch (error) {
      console.error('Failed to mint NFT:', error)
    }
  }

  if (isAlreadyMinted || mintResult) {
    const mintAddress = meme?.nftMintAddress || mintResult?.mintAddress
    const solscanUrl = mintAddress ? `https://solscan.io/account/${mintAddress}?cluster=devnet` : ''

    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Crown className="h-5 w-5" />
            NFT Minted Successfully! 🎉
          </CardTitle>
          <CardDescription>
            Your AI-generated meme is now a unique NFT on Solana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Mint Address:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {mintAddress?.slice(0, 8)}...{mintAddress?.slice(-8)}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Network:</span>
                <span className="text-sm">Devnet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Creator:</span>
                <span className="text-sm">You</span>
              </div>
              {(meme?.nftSignature || mintResult?.signature) && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Transaction:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {(meme?.nftSignature || mintResult?.signature)?.slice(0, 8)}...
                    {(meme?.nftSignature || mintResult?.signature)?.slice(-8)}
                  </code>
                </div>
              )}
            </div>
          </div>

          <a
            href={solscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            View on Solscan
          </a>

          {meme?.nftMetadataUri && (
            <a
              href={meme.nftMetadataUri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View Metadata
            </a>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Mint as NFT
        </CardTitle>
        <CardDescription>
          Turn your AI-generated meme into a unique collectible NFT on Solana
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost Information */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Minting Information</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Estimated cost: ~0.005 SOL for rent + fees</p>
            <p>• 5% creator royalty on secondary sales</p>
            <p>• Permanent on-chain metadata</p>
            <p>• Verifiable authenticity</p>
          </div>
        </div>

        {/* Error Display */}
        {memeStore.mintingError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{memeStore.mintingError.message}</AlertDescription>
          </Alert>
        )}

        {/* Mint Button */}
        <Button
          onClick={handleMintNFT}
          disabled={memeStore.isMinting || !publicKey}
          className="w-full"
          variant="outline"
        >
          {memeStore.isMinting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Minting NFT...
            </>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              Mint as NFT
            </>
          )}
        </Button>

        {!publicKey && (
          <p className="text-xs text-muted-foreground text-center">
            Connect your wallet to mint NFTs
          </p>
        )}
      </CardContent>
    </Card>
  )
})

NFTMinter.displayName = 'NFTMinter'

export default NFTMinter