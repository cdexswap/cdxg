import React from 'react';

interface PhaseWidgetProps {
  remainingTokens: number;
}

export const PhaseWidget = ({ remainingTokens }: PhaseWidgetProps) => {
  const TOTAL_SUPPLY = 20_000_000;
  const PHASE_1_END = 10_000_000;
  const PHASE_2_END = 15_000_000;

  // Calculate current phase based on remaining tokens
  const soldAmount = TOTAL_SUPPLY - remainingTokens;
  let currentPhase;
  
  if (soldAmount <= PHASE_1_END) {
    currentPhase = 1;
  } else if (soldAmount <= PHASE_2_END) {
    currentPhase = 2;
  } else {
    currentPhase = 3;
  }

  const phases = [
    {
      number: 1,
      allocation: "10%",
      price: "1,500 USDT per 1M CDXG",
      status: currentPhase === 1 ? "current" : "completed"
    },
    {
      number: 2,
      allocation: "5%",
      price: "6,000 USDT per 1M CDXG",
      status: currentPhase === 2 ? "current" : currentPhase > 2 ? "completed" : "upcoming"
    },
    {
      number: 3,
      allocation: "5%",
      price: "12,000 USDT per 1M CDXG",
      status: currentPhase === 3 ? "current" : "upcoming"
    }
  ];

  return (
    <div className="w-full xl:w-80 xl:fixed xl:left-5 xl:top-32 rounded-2xl bg-gradient-to-br from-blue-900/40 via-black/40 to-blue-900/40 backdrop-blur-md border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] transform hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] animate-float hover:border-blue-400/50 transition-all duration-300 ease-in-out">
      <div className="relative p-4 rounded-2xl h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent hover:from-blue-300 hover:to-blue-500 transition-colors duration-300">
              CDXG Token Sale Phases
            </h2>
          </div>

          {/* Phases */}
          <div className="space-y-2 mb-6">
            {phases.map((phase) => (
              <div 
                key={phase.number}
                className={`p-2.5 rounded-xl relative overflow-hidden transition-colors duration-300 ${
                  phase.status === 'current'
                    ? 'bg-gradient-to-r from-blue-600/30 to-blue-400/30 hover:from-blue-600/40 hover:to-blue-400/40 animate-shimmer-current'
                    : 'bg-gradient-to-r from-blue-800/30 to-blue-600/30 hover:from-blue-800/40 hover:to-blue-600/40'
                }`}
              >
                <div className={`font-bold flex items-center justify-between ${
                  phase.status === 'current' ? 'text-blue-300' : 'text-blue-400'
                }`}>
                  <span>Phase {phase.number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    phase.status === 'current'
                      ? 'bg-blue-400/20 text-blue-300'
                      : phase.status === 'completed'
                      ? 'bg-green-400/20 text-green-300'
                      : 'bg-blue-400/20 text-blue-400'
                  }`}>
                    {phase.status === 'current' ? 'CURRENT' : phase.status === 'completed' ? 'SOLDOUT' : 'UPCOMING'}
                  </span>
                </div>
                <div className="text-sm text-blue-200 mt-1">
                  <div>Allocation: {phase.allocation}</div>
                  <div>Price: {phase.price}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Info Text */}
          <div className="mt-auto">
            <div className="text-sm text-center font-medium bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Join the CDXG token sale now
            </div>
            <div className="text-xs text-center text-blue-300/80 mt-1">
              Early supporters get the best prices
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

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-shimmer-current {
          animation: shimmer-current 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
