'use client'

import { useWallet } from "@solana/wallet-adapter-react"
import { useState, useEffect } from "react"

export default function ReferralWidget() {
  const { publicKey } = useWallet()
  const address = publicKey?.toBase58()
  const [copyStatus, setCopyStatus] = useState<"code" | "link" | "">("")
  const [activeReferral, setActiveReferral] = useState("")
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  useEffect(() => {
    // Check URL for referral code
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setActiveReferral(ref)
  }, [])

  useEffect(() => {
    const saveUser = async () => {
      if (!address) return
      
      setIsLoading(true)
      setError("")
      
      try {
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            walletAddress: address,
            activeReferral 
          }),
        })
        
        const data = await response.json()
        if (response.ok) {
          setUserData(data)
          setError("")
          setRetryCount(0) // Reset retry count on success
        } else {
          console.error('Failed to save user data:', data.error)
          
          // If it's a database connection error and we haven't exceeded retries
          if (data.error?.includes('Database connection failed') && retryCount < maxRetries) {
            setRetryCount(prev => prev + 1)
            // Retry after a delay
            setTimeout(() => {
              saveUser()
            }, 1000 * (retryCount + 1)) // Exponential backoff
            setError(`Connection attempt ${retryCount + 1}/${maxRetries}...`)
          } else {
            setError(data.error || 'Failed to save user data')
          }
        }
      } catch (error: any) {
        console.error('Error saving user:', error)
        setError('Network error. Please try again.')
      } finally {
        if (!error.includes('Connection attempt')) {
          setIsLoading(false)
        }
      }
    }

    saveUser()
  }, [address, activeReferral])

  const generateReferralLink = (code: string) => {
    return `https://coin.cdexs.com?ref=${code}`
  }

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus(type)
      setTimeout(() => setCopyStatus(""), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const code = isLoading ? "Loading..." : (userData?.refCode || "")
  const referralLink = code ? generateReferralLink(code) : ""

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-blue-900/40 via-black/40 to-blue-900/40 backdrop-blur-md border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] transform hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] animate-float hover:border-blue-400/50 transition-all duration-300 ease-in-out p-4">
      <h3 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent hover:from-blue-300 hover:to-blue-500 transition-colors duration-300 mb-2">Referral Program</h3>
      {error && (
        <div className={`mb-3 p-2 rounded-lg border ${
          error.includes('Connection attempt') 
            ? 'bg-yellow-600/30 border-yellow-500/30' 
            : 'bg-red-600/30 border-red-500/30'
        }`}>
          <p className={`text-sm ${
            error.includes('Connection attempt')
              ? 'text-yellow-300'
              : 'text-red-300'
          }`}>{error}</p>
        </div>
      )}
      <div className="mb-3 p-2 bg-gradient-to-r from-blue-600/30 to-blue-400/30 hover:from-blue-600/40 hover:to-blue-400/40 rounded-lg border border-blue-500/30">
        <p className="text-sm text-blue-300">Invite friends and earn <span className="text-blue-200 font-semibold">5% in CDX tokens</span> when they buy CDXG!</p>
      </div>
      
      {address && (
        <div className="relative">
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400/20 rounded-full animate-ping"></div>
          <p className="text-gray-400 text-xs mb-1">Your Referral Code</p>
          <div className="flex items-center gap-1 mb-3">
            <div className="flex-1 bg-blue-900/30 rounded px-2 py-1 text-blue-300 font-mono text-sm truncate border border-blue-500/20">
              {code}
            </div>
            <button 
              onClick={() => copyToClipboard(code, "code")}
              className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded text-xs hover:bg-blue-500/40 transition-colors whitespace-nowrap border border-blue-500/20"
            >
              {copyStatus === "code" ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-gray-400 text-xs mb-1">Share Link</p>
          <div className="flex items-center gap-1">
            <div className="flex-1 bg-blue-900/30 rounded px-2 py-1 text-blue-300 font-mono text-sm truncate border border-blue-500/20">
              {referralLink}
            </div>
            <button 
              onClick={() => copyToClipboard(referralLink, "link")}
              className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded text-xs hover:bg-blue-500/40 transition-colors whitespace-nowrap border border-blue-500/20"
            >
              {copyStatus === "link" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {activeReferral ? (
        <div className="mt-3 pt-3 border-t border-blue-500/20">
          <p className="text-blue-300 text-xs">Using Referral From:</p>
          <p className="text-blue-200 font-mono text-sm">{activeReferral}</p>
          <p className="text-xs text-blue-300/80 mt-1">Your friend will receive 5% in CDX tokens!</p>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-blue-500/20">
        </div>
      )}
    </div>
  )
}
