'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

export default function ReferralRewardsWidget() {
  const { connected, publicKey } = useWallet()
  const [rewards, setRewards] = useState<number>(0)

  useEffect(() => {
    const fetchRewards = async () => {
      if (!connected || !publicKey) {
        setRewards(0);
        return;
      }

      try {
        // Get referral code from URL if exists
        const params = new URLSearchParams(window.location.search);
        const activeReferral = params.get('ref');

        const response = await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: publicKey.toString(),
            activeReferral: activeReferral || undefined,
          }),
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('Fetched user data:', userData);
          setRewards(userData.referralRewards || 0);
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch user data:', errorData);
        }
      } catch (error) {
        console.error('Error fetching referral rewards:', error);
      }
    };

    fetchRewards();
    
    // Set up interval to refresh rewards more frequently (every 3 seconds)
    const interval = setInterval(fetchRewards, 3000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [connected, publicKey]);

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-blue-900/40 via-black/40 to-blue-900/40 backdrop-blur-md border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] transform hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] animate-float hover:border-blue-400/50 transition-all duration-300 ease-in-out">
      <div className="relative p-3 rounded-2xl h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent hover:from-blue-300 hover:to-blue-500 transition-colors duration-300">
              Your Referral Rewards
            </h2>
          </div>

          {/* Stats */}
          <div className="p-4">
            <div className="flex flex-col items-center">
              <span className="text-blue-300 text-sm mb-2">Total CDX Earned</span>
              <span className="text-blue-200 font-bold text-3xl">{rewards.toLocaleString()} CDX</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
