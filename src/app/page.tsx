'use client'

import { observer } from 'mobx-react-lite'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import MemeGenerator from '@/components/MemeGenerator'
import NFTMinter from '@/components/NFTMinter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, Sparkles, Zap, Shield, ArrowRight, TrendingUp, Users, Globe } from 'lucide-react'
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
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950/20 dark:via-background dark:to-blue-950/20 relative">
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          {/* Top Badge */}
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-purple-200 dark:border-purple-700">
              <Zap className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
              Powered by x402 Protocol
            </Badge>
          </div>

          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              AI Meme Forge
            </h1>
            <div className="flex justify-center items-center gap-2 text-4xl md:text-6xl">
              <span className="animate-bounce">🔥</span>
              <span className="animate-pulse">⚡</span>
              <span className="animate-bounce delay-100">🎨</span>
            </div>
          </div>

          {/* Description */}
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Create unique AI-powered memes with instant Solana payments
            </p>
            <p className="text-lg text-muted-foreground/80">
              Connect your wallet, pay with SOL, and unleash your creativity!
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-12">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-2xl font-bold text-purple-600">10K+</span>
              </div>
              <p className="text-sm text-muted-foreground">Creators</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-2xl font-bold text-blue-600">50K+</span>
              </div>
              <p className="text-sm text-muted-foreground">Memes Created</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Globe className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-green-600">100%</span>
              </div>
              <p className="text-sm text-muted-foreground">On-Chain</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Left Column - Generator */}
          <div className="space-y-6">
            {!connected ? (
              <Card className="border-2 border-dashed border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 backdrop-blur-sm">
                <CardHeader className="text-center pb-8">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                    <Wallet className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Connect Your Wallet
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    Connect your Phantom or other Solana wallet to start creating memes
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <WalletMultiButton className="mx-auto" />
                  <p className="text-sm text-muted-foreground mt-4">
                    🔒 Secure connection • No data stored
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Connected Wallet Card */}
                <Card className="border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-green-700 dark:text-green-400">
                            Wallet Connected
                          </CardTitle>
                          <CardDescription className="font-mono text-sm">
                            {publicKey?.toBase58()?.slice(0, 8)}...
                            {publicKey?.toBase58()?.slice(-8)}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700">
                        <Shield className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Meme Generator */}
                <MemeGenerator onMemeGenerated={handleMemeGenerated} />
              </div>
            )}
          </div>

          {/* Right Column - Preview/Results */}
          <div className="space-y-6">
            {generatedMeme && memeStore.getLatestMeme() ? (
              <>
                {/* Generated Meme Card */}
                <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 pb-4">
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <Sparkles className="w-5 h-5" />
                      Your AI-Generated Meme! 🎨
                    </CardTitle>
                    <CardDescription className="text-purple-600 dark:text-purple-400">
                      Created with {memeStore.getLatestMeme()!.model} • {memeStore.getLatestMeme()!.style} style
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Meme Image */}
                      <div className="relative group">
                        <img
                          src={generatedMeme}
                          alt="AI Generated Meme"
                          className="w-full rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                      </div>

                      {/* Meme Details */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span>AI-Powered Creation</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              {memeStore.getLatestMeme()!.model}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400">
                              {memeStore.getLatestMeme()!.style}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(memeStore.getLatestMeme()!.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* NFT Minting Component */}
                <NFTMinter
                  memeId={memeStore.getLatestMeme()!.id}
                  imageUrl={generatedMeme}
                  prompt={memeStore.getLatestMeme()!.prompt}
                  onMinted={(mintAddress) => {
                    console.log('NFT minted:', mintAddress)
                  }}
                />
              </>
            ) : (
              <Card className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/30 to-blue-50/30 dark:from-purple-950/10 dark:to-blue-950/10">
                <CardContent className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    No Meme Yet
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Generate your first AI-powered meme to see it here!
                  </CardDescription>
                  <div className="mt-6 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      🎨 AI-powered generation
                    </p>
                    <p className="text-sm text-muted-foreground">
                      🔗 Blockchain verification
                    </p>
                    <p className="text-sm text-muted-foreground">
                      🪙 NFT minting available
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            </div>
        </div>

        {/* How It Works */}
        <Card className="border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/30 via-white to-blue-50/30 dark:from-purple-950/10 dark:via-background dark:to-blue-950/10 overflow-hidden">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              How It Works
            </CardTitle>
            <CardDescription className="text-lg text-purple-600 dark:text-purple-400">
              Create amazing AI memes in three simple steps
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4 group">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-purple-700 dark:text-purple-300">1. Connect Wallet</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Connect your Phantom or other Solana wallet securely with one click
                  </p>
                </div>
              </div>
              <div className="text-center space-y-4 group">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300">2. Pay with x402</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Make a micro-payment using the innovative x402 protocol
                  </p>
                </div>
              </div>
              <div className="text-center space-y-4 group">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-green-700 dark:text-green-300">3. Get AI Meme</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Receive your unique AI-generated meme instantly, ready to share or mint as NFT
                  </p>
                </div>
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