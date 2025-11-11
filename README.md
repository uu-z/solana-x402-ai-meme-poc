# AI Meme Forge - x402 Protocol Demo

A decentralized AI-powered meme generation platform built on Solana using the x402 protocol for pay-per-call API access.

## 🌟 Features

- **🔗 Solana Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- **💰 x402 Protocol**: Pay-per-call API access using HTTP 402 Payment Required
- **🤖 AI Content Generation**: Generate unique memes using AI (mock implementation)
- **⚡ Instant Verification**: Real-time Solana transaction verification
- **🎨 Modern UI**: Beautiful design with shadcn/ui components and Tailwind CSS
- **📱 Mobile Friendly**: Fully responsive design for all devices
- **🔄 State Management**: Efficient state management with MobX
- **✅ Form Validation**: Client-side form validation with error handling
- **🚀 Next.js 15**: Built with the latest Next.js 15 and React 19

## 🏗️ Architecture

```
ai-meme-forge/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/               # API Routes
│   │   │   ├── generate/      # AI generation endpoint
│   │   │   └── x402/          # Payment verification
│   │   ├── layout.tsx         # Root layout with wallet provider
│   │   ├── page.tsx           # Main application page
│   │   └── globals.css        # Global styles with shadcn/ui
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── label.tsx
│   │   │   ├── alert.tsx
│   │   │   └── badge.tsx
│   │   ├── WalletProvider.tsx # Solana wallet context
│   │   └── MemeGenerator.tsx  # Meme generation UI with MobX
│   ├── stores/                # MobX state management
│   │   ├── MemeStore.ts       # Meme generation state
│   │   ├── WalletStore.ts     # Wallet connection state
│   │   └── index.ts           # Store exports
│   ├── lib/                   # Utility libraries
│   │   └── utils.ts           # shadcn/ui utilities
│   └── utils/                 # Utility functions
│       └── x402Client.ts      # x402 protocol client
├── components.json            # shadcn/ui configuration
├── assets/                    # Project assets
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Solana wallet (Phantom, Solflare, etc.) with devnet SOL

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd x402_ai_meme
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Get devnet SOL**
   - Visit [Solana Faucet](https://faucet.solana.com/)
   - Get some devnet SOL for testing

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 💡 How It Works

### 1. Connect Wallet
- Users connect their Solana wallet (Phantom, Solflare, etc.)
- Wallet connection is handled by the Solana Wallet Adapter

### 2. x402 Payment Flow
- User enters a meme prompt and clicks "Generate"
- A Solana transaction is created for 0.01 SOL payment
- User signs and sends the transaction
- Transaction signature is captured for verification

### 3. Payment Verification
- The `/api/x402/check` endpoint verifies the transaction
- Checks transaction confirmation, amount, and sender
- Ensures payment meets minimum requirements

### 4. AI Content Generation
- Upon successful verification, the AI generation API is called
- Mock AI service generates a meme image and text
- Content is returned to the user for download/sharing

## 🔧 Configuration

### Environment Variables

```env
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# x402 Configuration
X402_PAYMENT_AMOUNT=0.01
X402_RECIPIENT_WALLET=11111111111111111111111111111111

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# AI Configuration (Optional)
# OPENAI_API_KEY=your-openai-api-key
# STABILITY_API_KEY=your-stability-ai-api-key
```

## 📚 API Endpoints

### POST `/api/generate`
Generate AI meme after payment verification.

**Request:**
```json
{
  "prompt": "A cat working from home",
  "transactionSignature": "tx_signature_here",
  "userWallet": "wallet_address_here"
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://example.com/meme.png",
  "memeText": "Generated meme caption",
  "paymentVerified": {
    "signature": "tx_signature_here",
    "amount": 0.01,
    "timestamp": 1234567890
  }
}
```

### POST `/api/x402/check`
Verify x402 payment transaction.

**Request:**
```json
{
  "transactionSignature": "tx_signature_here",
  "userWallet": "wallet_address_here"
}
```

**Response:**
```json
{
  "verified": true,
  "amount": 0.01,
  "signature": "tx_signature_here",
  "timestamp": 1234567890
}
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Blockchain**: Solana, @solana/web3.js, @solana/wallet-adapter
- **Backend**: Next.js API Routes
- **Protocol**: x402 (HTTP 402 Payment Required)
- **Styling**: Tailwind CSS with custom components

## 🔐 Security Considerations

- **Transaction Verification**: All payments are verified on-chain before content generation
- **Rate Limiting**: API endpoints include basic rate limiting considerations
- **Input Validation**: User inputs are sanitized and validated
- **Environment Security**: Sensitive keys are stored in environment variables

## 🚀 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard

### Docker

1. **Build image**
   ```bash
   docker build -t ai-meme-forge .
   ```

2. **Run container**
   ```bash
   docker run -p 3000:3000 ai-meme-forge
   ```

## 🧪 Testing

### Development Testing
```bash
npm run dev
```

### Build Testing
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## 📈 Future Enhancements

- [ ] **Real AI Integration**: Connect to OpenAI DALL-E or Stability AI
- [ ] **NFT Minting**: Allow users to mint generated memes as NFTs
- [ ] **Content History**: User dashboard with generation history
- [ ] **Advanced Templates**: Pre-defined meme templates
- [ ] **Multi-chain Support**: Support for other blockchains
- [ ] **Batch Generation**: Generate multiple memes at once
- [ ] **Social Sharing**: Direct sharing to social platforms

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Useful Links

- [x402 Protocol Documentation](https://openx402.ai)
- [x402 Explorer](https://x402scan.com)
- [Solana Documentation](https://docs.solana.com/)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Built with ❤️ using Next.js and Solana**