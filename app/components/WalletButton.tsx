"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export const WalletButton = () => {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = () => {
    setVisible(true);
  };

  if (connected) {
    return null; // Don't render anything when connected
  }

  return (
    <button 
      onClick={handleClick}
      className="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white rounded-lg py-4 font-semibold hover:shadow-premium transform hover:scale-[1.02] transition-all duration-300 animate-gradient-x relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:via-white/10 transition-opacity duration-300"></div>
      <span className="relative z-10 group-hover:text-blue-100 flex items-center justify-center">
        Connect Wallet
        <svg 
          className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 7l5 5m0 0l-5 5m5-5H6" 
          />
        </svg>
      </span>
    </button>
  );
};

// Add a new component to display wallet address
export const WalletDisplay = () => {
  const { publicKey } = useWallet();
  
  if (!publicKey) return null;
  
  return (
    <div className="text-sm text-gray-400 text-right mb-2">
      Wallet: <span className="text-blue-400">{publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}</span>
    </div>
  );
};
