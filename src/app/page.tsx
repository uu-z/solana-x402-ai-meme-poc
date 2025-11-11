'use client'

import { observer } from 'mobx-react-lite'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import MemeGenerator from '@/components/MemeGenerator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react'
import { memeStore } from '@/stores'
import { useState, useEffect } from 'react'

const Home = observer(() => {
  const { publicKey, connected } = useWallet()
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null)

  // Update wallet store when connection state changes
  useEffect(() => {
    if (connected && publicKey) {
      memeStore.clearError()
    }
  }, [connected, publicKey])

  const handleMemeGenerated = (imageUrl: string) => {
    setGeneratedMeme(imageUrl)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Zap className="w-3 h-3 mr-1" />
            Powered by x402 Protocol
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            AI Meme Forge
            <span className="ml-2">🔥</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-2 max-w-2xl mx-auto">
            Create unique AI-powered memes with instant Solana payments
          </p>
          <p className="text-lg text-muted-foreground/80">
            Connect your wallet, pay with SOL, and unleash your creativity!
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Generator */}
          <div className="space-y-6">
            {!connected ? (
              <Card className="border-2 border-dashed">
                <CardHeader className="text-center">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle>Connect Your Wallet</CardTitle>
                  <CardDescription>
                    Connect your Phantom or other Solana wallet to start creating memes
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <WalletMultiButton className="mx-auto" />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Wallet Connected
                        </CardTitle>
                        <CardDescription>
                          {publicKey?.toBase58()?.slice(0, 8)}...
                          {publicKey?.toBase58()?.slice(-8)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                <MemeGenerator onMemeGenerated={handleMemeGenerated} />
              </div>
            )}
          </div>

          {/* Right Column - Preview/Results */}
          <div className="space-y-6">
            {generatedMeme ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Your AI-Generated Meme! 🎨
                  </CardTitle>
                  <CardDescription>
                    Created with x402 protocol verification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <img
                      src={generatedMeme}
                      alt="AI Generated Meme"
                      className="w-full rounded-lg shadow-md"
                    />
                    {memeStore.getLatestMeme() && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Shield className="w-4 h-4" />
                          <span>Verified on Solana</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(memeStore.getLatestMeme()!.createdAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <CardTitle className="text-muted-foreground mb-2">
                    No Meme Yet
                  </CardTitle>
                  <CardDescription>
                    Generate your first AI-powered meme to see it here!
                  </CardDescription>
                </CardContent>
              </Card>
            )}

            {/* Recent Memes */}
            {memeStore.hasMemes() && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Creations</CardTitle>
                  <CardDescription>
                    Your latest AI-generated memes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {memeStore.getGeneratedMemes().slice(0, 6).map((meme) => (
                      <div
                        key={meme.id}
                        className="aspect-square relative group cursor-pointer"
                        onClick={() => setGeneratedMeme(meme.imageUrl)}
                      >
                        <img
                          src={meme.imageUrl}
                          alt={meme.prompt}
                          className="w-full h-full object-cover rounded-md"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* How It Works */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">How It Works</CardTitle>
            <CardDescription>
              Create amazing AI memes in three simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">1. Connect Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Phantom or other Solana wallet securely
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">2. Pay with x402</h3>
                <p className="text-sm text-muted-foreground">
                  Make a micro-payment using the innovative x402 protocol
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">3. Get AI Meme</h3>
                <p className="text-sm text-muted-foreground">
                  Receive your unique AI-generated meme instantly
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
})

Home.displayName = 'Home'

export default Home