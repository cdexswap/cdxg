"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { WalletButton, WalletDisplay } from './components/WalletButton';
import { useWallet } from "@solana/wallet-adapter-react";
import { PhaseWidget } from './components/PhaseWidget';
import TokenInfoWidget from './components/TokenInfoWidget';
import ReferralRewardsWidget from './components/ReferralRewardsWidget';
import ReferralWidget from './components/ReferralWidget';
import RoadmapWidget from './components/RoadmapWidget';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import BuyTokenWidget from './components/BuyTokenWidget';

const calculateTimeLeft = () => {
  const endDate = new Date('2025-03-15T23:59:59+07:00');
  const now = new Date();
  const difference = endDate.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isUrgent: false };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    isUrgent: days <= 5
  };
};

export default function Home() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const [amount, setAmount] = useState('');
  const [solPrice, setSolPrice] = useState(95); // Default fallback price
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [cdxgAmount, setCdxgAmount] = useState('0');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isUrgent: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastValues, setLastValues] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isUrgent: false });

  // Initialize time on client side only
  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    setLastValues(calculateTimeLeft());
  }, []);
  const [remainingTokens, setRemainingTokens] = useState(0);
  const [progress, setProgress] = useState(0);
  const TOTAL_SUPPLY = 20_000_000;
  const PHASE_1_END = 10_000_000;
  const PHASE_2_END = 15_000_000;

  // Helper function to determine current phase
  const getCurrentPhase = (soldAmount: number) => {
    if (soldAmount <= PHASE_1_END) return 1;
    if (soldAmount <= PHASE_2_END) return 2;
    return 3;
  };

  // Helper function to get price for current phase
  const getPriceForPhase = (soldAmount: number) => {
    if (soldAmount <= PHASE_1_END) return 1500;
    if (soldAmount <= PHASE_2_END) return 6000;
    return 12000;
  };

  const fetchTokenBalance = useCallback(async () => {
    if (typeof window === 'undefined') return; // Skip on server-side
    try {
      if (!process.env.NEXT_PUBLIC_CDXG_WALLET || !process.env.NEXT_PUBLIC_CDXG_TOKEN_ADDRESS) {
        console.error('Environment variables not properly configured');
        return;
      }

      const connection = new Connection(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'https://api.mainnet-beta.solana.com');
      const walletAddress = new PublicKey(process.env.NEXT_PUBLIC_CDXG_WALLET);
      const tokenMint = new PublicKey(process.env.NEXT_PUBLIC_CDXG_TOKEN_ADDRESS);

      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletAddress, {
          programId: TOKEN_PROGRAM_ID,
        });

        const tokenAccount = tokenAccounts.value.find(
          (account) => account.account.data.parsed.info.mint === tokenMint.toString()
        );

        if (tokenAccount) {
          const balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount || 0;
          const soldAmount = TOTAL_SUPPLY - balance;
          setRemainingTokens(balance);
          const calculatedProgress = (soldAmount / TOTAL_SUPPLY) * 100;
          setProgress(Math.max(0, Math.min(100, calculatedProgress))); // Ensure progress is between 0-100
        } else {
          console.error('Token account not found');
          setRemainingTokens(0);
          setProgress(0);
        }
      } catch (error) {
        console.error('Error in token account lookup:', error);
        setRemainingTokens(0);
        setProgress(0);
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    fetchTokenBalance();
    const interval = setInterval(fetchTokenBalance, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchTokenBalance]);

  // Helper function for delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Cache for last successful price
  const lastSuccessfulPrice = useRef(95);

  // Fetch SOL price with simplified error handling
  const fetchSolPrice = useCallback(async () => {
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT', {
        method: 'GET',
        cache: 'no-store',
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const price = parseFloat(data.price);

      if (!isNaN(price) && price > 0) {
        lastSuccessfulPrice.current = price;
        setSolPrice(price);
      } else {
        console.warn('Invalid price received, using fallback');
        setSolPrice(lastSuccessfulPrice.current);
      }
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      setSolPrice(lastSuccessfulPrice.current);
    }
  }, []);

  // Calculate values when amount or SOL price changes
  useEffect(() => {
    const solAmount = parseFloat(amount) || 0;
    const solValueInUSD = solAmount * solPrice;
    const soldAmount = TOTAL_SUPPLY - remainingTokens;
    const cdxgPriceInUSDT = getPriceForPhase(soldAmount);

    // Calculate CDXG amount:
    // 1. solValueInUSD / cdxgPriceInUSDT = proportion of 1M CDXG
    // 2. * 1_000_000 = actual CDXG amount
    // 3. * 1_000_000 = add decimals for token transfer
    const calculatedCdxg = Math.floor((solValueInUSD / cdxgPriceInUSDT) * 1_000_000 * 1_000_000);
    setCdxgAmount(calculatedCdxg.toLocaleString('en-US', { maximumFractionDigits: 0 }));
  }, [amount, solPrice, remainingTokens]);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    // Fetch initial SOL price
    fetchSolPrice();
    // Set up interval to fetch price every minute
    const priceInterval = setInterval(fetchSolPrice, 60000);
    
    return () => clearInterval(priceInterval);
  }, [fetchSolPrice]);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      setLastValues(timeLeft); // Store previous values to detect changes
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]); // Update when timeLeft changes

  // Function to check if a value has just changed
  const hasChanged = (type: 'days' | 'hours' | 'minutes' | 'seconds') => {
    return lastValues[type] !== timeLeft[type];
  };

  const soldAmount = TOTAL_SUPPLY - remainingTokens;
  const currentPhase = getCurrentPhase(soldAmount);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f1318] to-[#0a0a0a] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -right-40 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] animate-float opacity-70 mix-blend-screen"></div>
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-blue-800/30 rounded-full blur-[100px] animate-float-delayed opacity-70 mix-blend-screen"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/20 to-transparent rounded-full blur-[80px] animate-pulse-slow"></div>
        <div className="absolute inset-0 noise-texture opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      </div>

      {/* Fixed widgets for large screens */}
      <div className="hidden xl:block">
        <div className="fixed right-8 top-32 w-72 space-y-4 z-20">
          <TokenInfoWidget />
          <ReferralRewardsWidget />
        </div>
        <div className="fixed left-8 top-32 w-64 z-20">
          <PhaseWidget remainingTokens={remainingTokens} />
        </div>
        <div className="fixed left-8 top-[570px] w-64 z-20">
          <ReferralWidget />
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8 xl:px-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-blue-500 to-blue-600 animate-gradient-x glow-text-premium relative">
              <span className="absolute inset-0 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-blue-500 to-blue-600 animate-gradient-x blur-sm opacity-50"></span>
              CDXG  Private sale
            </h1>
            <button
              onClick={() => setShowRoadmap(!showRoadmap)}
              className="px-6 py-2 mb-6 rounded-full bg-gradient-to-r from-orange-500 to-orange-300 text-white font-semibold hover:from-orange-400 hover:to-orange-200 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
            >
              {showRoadmap ? 'Hide Roadmap' : 'View Roadmap'}
            </button>
          </div>
          {showRoadmap && (
            <div className="mb-8 animate-fade-in">
              <RoadmapWidget />
            </div>
          )}
          
          <div className="space-y-6 animate-fade-in">
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Be part of the next generation decentralized exchange. Secure your CDXG tokens at the best private sale price.
            </p>
            
            {/* Countdown Timer */}
            <div className={`max-w-3xl mx-auto rounded-2xl p-6 backdrop-blur-xl card-shimmer transition-all duration-300
              ${timeLeft.isUrgent 
                ? 'bg-gradient-to-r from-red-500/20 via-red-400/20 to-red-600/20 border-red-500/30 animate-pulse-border' 
                : 'bg-gradient-to-r from-blue-500/10 via-blue-400/10 to-blue-600/10 border-blue-500/20'}`}>
              <h2 className={`text-center mb-4 transition-all duration-300
                ${timeLeft.isUrgent 
                  ? 'text-red-300 text-2xl font-bold animate-bounce' 
                  : 'text-blue-300 text-lg'}`}>
                {timeLeft.isUrgent ? 'Hurry Buy Now! Limited Time Left' : 'Private sale Ends In'}
              </h2>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Days", value: timeLeft.days, type: 'days' as const },
                  { label: "Hours", value: timeLeft.hours, type: 'hours' as const },
                  { label: "Minutes", value: timeLeft.minutes, type: 'minutes' as const },
                  { label: "Seconds", value: timeLeft.seconds, type: 'seconds' as const },
                ].map((item) => (
                  <div key={item.type} className="text-center">
                    <div className={`backdrop-blur-xl rounded-xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg card-shimmer
                      ${timeLeft.isUrgent 
                        ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-400/30' 
                        : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-400/30'}`}>
                      <p className={`text-3xl font-bold mb-1 transition-all duration-300
                        ${timeLeft.isUrgent ? 'text-red-300' : 'text-white'}
                        ${hasChanged(item.type) ? 'scale-110' : ''}`}>
                        {String(item.value).padStart(2, '0')}
                      </p>
                      <p className={`text-sm transition-colors duration-300
                        ${timeLeft.isUrgent ? 'text-red-300' : 'text-blue-300'}`}>
                        {item.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {timeLeft.isUrgent && (
                <div className="mt-4 space-y-2">
                  <p className="text-red-400 text-center font-semibold text-lg animate-pulse">
                    Don't Miss The Last Opportunity!
                  </p>
                  <p className="text-red-300 text-center text-sm">
                    Price will increase after this. Buy now to get the best price.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Presale Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-gradient-to-b from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-800/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-premium hover:-translate-y-1 card-shimmer order-2 lg:order-1">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Token Sales Progress</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Phase {currentPhase}
                  </span>
                </div>
                <span className="text-blue-400 text-sm">{progress.toFixed(2)}%</span>
              </div>
              <div className="h-3 bg-gray-800/50 rounded-full overflow-hidden shadow-inner backdrop-blur-sm relative">
                {/* Phase markers */}
                <div className="absolute h-full w-px bg-gray-600 left-1/2 z-10"></div>
                <div className="absolute h-full w-px bg-gray-600 left-3/4 z-10"></div>
                
                {/* Progress bar */}
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 animate-gradient-x transition-all duration-500 shadow-lg relative group hover:shadow-blue-500/50"
                  style={{ width: `${progress}%` }}>
                </div>
                
                {/* Phase labels */}
                <div className="absolute -bottom-6 left-0 text-xs text-gray-500">Phase 1</div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">Phase 2</div>
                <div className="absolute -bottom-6 left-3/4 transform -translate-x-1/2 text-xs text-gray-500">Phase 3</div>
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-gray-400 text-xs">{(remainingTokens).toLocaleString()} CDXG Available</span>
                <span className="text-gray-400 text-xs">{TOTAL_SUPPLY.toLocaleString()} CDXG total</span>
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">1 SOL = ${solPrice.toFixed(2)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl hover:from-green-500/20 hover:to-blue-500/20 border border-green-500/20 hover:border-blue-500/20 transition-all duration-300 transform hover:scale-105 hover:shadow-lg card-shimmer group">
                <p className="text-green-400/90 text-base mb-1 font-medium group-hover:text-blue-300/90">Current Rise</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-green-400/90 to-blue-400/90 bg-clip-text text-transparent group-hover:from-green-300 group-hover:to-blue-300">
                  ${(() => {
                    if (progress < 50) {
                      return ((progress / 50) * 15000).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                    } else if (progress < 75) {
                      return (15000 + ((progress - 50) / 25) * 15000).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                    } else {
                      return (15000+30000 + ((progress - 75) / 25) * 30000).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                    }
                  })()}
                </p>
                <p className="text-green-400/70 text-xs mt-1">{progress.toFixed(2)}% Complete</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-blue-600/10 to-purple-500/10 rounded-xl hover:from-blue-600/20 hover:to-purple-500/20 border border-blue-500/20 hover:border-purple-500/20 transition-all duration-300 transform hover:scale-105 hover:shadow-lg card-shimmer group">
                <p className="text-blue-400/90 text-base mb-1 font-medium group-hover:text-purple-300/90">Next Phase Price</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-400/90 to-purple-400/90 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300">
                  ${(() => {
                    if (progress < 50) return '15,000.00';
                    if (progress < 75) return '30,000.00';
                    return '60,000.00';
                  })()}
                </p>
                <p className="text-blue-400/70 text-xs mt-1">Next Phase Target</p>
              </div>
            </div>
          </div>

          {/* Purchase Form */}
          <div className="bg-gradient-to-b from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-800/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-premium hover:-translate-y-1 card-shimmer order-1 lg:order-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Buy Tokens</h2>
              <WalletDisplay />
            </div>
            {!connected ? (
              <WalletButton />
            ) : (
              <BuyTokenWidget 
                solPrice={solPrice}
                remainingTokens={remainingTokens}
                onSuccess={fetchTokenBalance}
              />
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {[
            { 
              label: "Current Phase", 
              value: `Phase ${currentPhase} (${progress < 50 ? '0-15K' : progress < 75 ? '15K-30K' : '30K-60K'} USDT)` 
            },
            { label: "Min Purchase", value: `${process.env.MIN_PURCHASE_SOL || '0.001'} SOL` },
            { label: "Max Purchase", value: `${process.env.MAX_PURCHASE_SOL || '50'} SOL` },
            { label: "Token Burned", value: "90% (0.9B CDXG)" },
          ].map((item, index) => (
            <div key={index} className="bg-gradient-to-b from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-xl p-6 border border-gray-800/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-premium hover:-translate-y-1 card-shimmer">
              <p className="text-gray-400 text-sm mb-1">{item.label}</p>
              <p className="text-lg font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive widgets for smaller screens */}
      <div className="xl:hidden mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <PhaseWidget remainingTokens={remainingTokens} />
        </div>
        <div className="md:col-span-1">
          <TokenInfoWidget />
        </div>
        <div className="md:col-span-1">
          <ReferralRewardsWidget />
        </div>
        <div className="md:col-span-1">
          <ReferralWidget />
        </div>
      </div>
    </main>
  );
}
