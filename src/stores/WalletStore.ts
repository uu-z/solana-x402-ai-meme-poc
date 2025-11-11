import { makeAutoObservable, runInAction } from 'mobx'
import { PublicKey } from '@solana/web3.js'

export interface TransactionInfo {
  signature: string
  amount: number
  timestamp: number
  confirmed: boolean
}

class WalletStore {
  // State
  isConnected = false
  publicKey: PublicKey | null = null
  balance = 0
  isConnecting = false
  walletError: string | null = null
  lastTransaction: TransactionInfo | null = null

  constructor() {
    makeAutoObservable(this)
  }

  // Actions
  setConnected(connected: boolean) {
    this.isConnected = connected
    if (!connected) {
      this.publicKey = null
      this.balance = 0
      this.walletError = null
    }
  }

  setPublicKey(publicKey: PublicKey | null) {
    this.publicKey = publicKey
  }

  setBalance(balance: number) {
    this.balance = balance
  }

  setConnecting(connecting: boolean) {
    this.isConnecting = connecting
  }

  setWalletError(error: string | null) {
    this.walletError = error
  }

  setLastTransaction(transaction: TransactionInfo | null) {
    this.lastTransaction = transaction
  }

  // Computed
  get walletAddress(): string | null {
    return this.publicKey?.toBase58() || null
  }

  get displayAddress(): string | null {
    if (!this.walletAddress) return null
    return `${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}`
  }

  get formattedBalance(): string {
    return `${this.balance.toFixed(4)} SOL`
  }

  // Actions
  async updateBalance() {
    if (!this.publicKey) return

    try {
      // This would be implemented with actual Solana RPC call
      // For now, we'll simulate balance updates
      runInAction(() => {
        this.balance = Math.random() * 10 // Simulated balance
      })
    } catch (error) {
      console.error('Failed to update balance:', error)
    }
  }

  recordTransaction(signature: string, amount: number, timestamp: number, confirmed: boolean = true) {
    runInAction(() => {
      this.lastTransaction = {
        signature,
        amount,
        timestamp,
        confirmed,
      }
    })
  }

  clearWalletError() {
    this.walletError = null
  }

  reset() {
    this.isConnected = false
    this.publicKey = null
    this.balance = 0
    this.isConnecting = false
    this.walletError = null
    this.lastTransaction = null
  }
}

export const walletStore = new WalletStore()