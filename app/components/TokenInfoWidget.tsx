import React from 'react';

const TokenInfoWidget = () => {
  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-blue-900/40 via-black/40 to-blue-900/40 backdrop-blur-md border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] transform hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] animate-float hover:border-blue-400/50 transition-all duration-300 ease-in-out">
      <div className="relative p-4 rounded-2xl h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent hover:from-blue-300 hover:to-blue-500 transition-colors duration-300">
              CDXG Token Info
            </h2>
          </div>

          {/* Token Stats */}
          <div className="space-y-2 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-blue-400/30 hover:from-blue-600/40 hover:to-blue-400/40 animate-shimmer-current group">
              <div className="font-bold flex items-center justify-between text-blue-300">
                <span className="flex items-center gap-2">
                  Total Supply
                  <svg className="w-4 h-4 text-blue-400 opacity-75 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/20">100,000,000</span>
              </div>
              <div className="text-sm text-blue-200/90 mt-1 flex items-center justify-end">
                <a 
                  href="https://solscan.io/token/8gTpdfq4csSNRiRKFD2cSzP8ema1D8w8QcefCkYiZZRF"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 text-blue-300 hover:text-blue-200 transition-colors"
                >
                  View Token Info
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-gradient-to-r from-orange-600/30 to-red-400/30 hover:from-orange-600/40 hover:to-red-400/40 relative group">
              <div className="font-bold flex items-center justify-between text-orange-300">
                <span className="flex items-center gap-2">
                  Burned Amount
                  <span className="flex space-x-0.5">
                    <svg className="w-4 h-4 text-orange-500 animate-flicker" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C10.9 2 9.8 2.2 8.8 2.6C10.5 4.1 11.5 6.5 11.5 9C11.5 12.9 8.9 16 5.5 16C4.9 16 4.3 15.9 3.8 15.8C5.2 19.4 8.3 22 12 22C16.4 22 20 18.4 20 14C20 8.5 16.4 3.9 12 2Z"/>
                    </svg>
                    <svg className="w-4 h-4 text-orange-400 animate-flicker-delay" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C10.9 2 9.8 2.2 8.8 2.6C10.5 4.1 11.5 6.5 11.5 9C11.5 12.9 8.9 16 5.5 16C4.9 16 4.3 15.9 3.8 15.8C5.2 19.4 8.3 22 12 22C16.4 22 20 18.4 20 14C20 8.5 16.4 3.9 12 2Z"/>
                    </svg>
                  </span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-400/20">900,000,000</span>
              </div>
              <div className="text-sm text-orange-200/90 mt-1 flex items-center justify-between">
                <span>90% of Total Supply</span>
                <a 
                  href="https://solscan.io/tx/47wKRD2UxkCcPx3rRsRoChiV35wm7r4oGebnzv1TjrCF9dWsoDX1xpoxcBJy6cYZCTLNCbbcvCNqr4CNjYKibQzA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 text-orange-300 hover:text-orange-200 transition-colors"
                >
                  View Proof
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-gradient-to-r from-green-600/30 to-green-400/30 hover:from-green-600/40 hover:to-green-400/40">
              <div className="font-bold flex items-center justify-between text-green-300">
                <span className="flex items-center gap-2">
                  Profit Share
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/20">1%</span>
              </div>
              <div className="text-sm text-green-200/90 mt-1">
                1% of total fees on platform
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-purple-400/30 hover:from-purple-600/40 hover:to-purple-400/40">
              <div className="font-bold flex items-center justify-between text-purple-300">
                <span className="flex items-center gap-2">
                  CDX Exchange
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-400/20">1:1</span>
              </div>
              <div className="text-sm text-purple-200/90 mt-1">
                Get CDX for free, CDXG 1:1 CDX
              </div>
            </div>
          </div>

          {/* Governance Section */}
          <div className="mt-auto">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-800/30 to-blue-600/30 hover:from-blue-800/40 hover:to-blue-600/40">
              <div className="font-bold text-blue-300 mb-2">Governance</div>
              <div className="text-sm text-blue-200">
                <div className="flex justify-between items-center mb-1">
                  <span>Token</span>
                  <span>CDXG</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Voting Power</span>
                  <span>1 CDXG = 1 Vote</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes shimmer-current {
          0%, 100% {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 25px rgba(59, 130, 246, 0.5);
          }
        }

        @keyframes flicker {
          0%, 100% {
            opacity: 1;
            transform: scale(1) rotate(-2deg);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.95) rotate(2deg);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-shimmer-current {
          animation: shimmer-current 2s ease-in-out infinite;
        }

        .animate-flicker {
          animation: flicker 2s ease-in-out infinite;
        }

        .animate-flicker-delay {
          animation: flicker 2s ease-in-out infinite;
          animation-delay: 0.75s;
        }
      `}</style>
    </div>
  );
};

export default TokenInfoWidget;
