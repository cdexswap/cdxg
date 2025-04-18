import { useState } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface BuyTokenWidgetProps {
  solPrice: number;
  remainingTokens: number;
  onSuccess?: () => void;
}

export default function BuyTokenWidget({ solPrice, remainingTokens, onSuccess }: BuyTokenWidgetProps) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cdxgAmount, setCdxgAmount] = useState('0');
  const [status, setStatus] = useState('');

  // Constants for phases
  const TOTAL_SUPPLY = 20_000_000;
  const PHASE_1_END = 10_000_000;
  const PHASE_2_END = 15_000_000;

  // Calculate CDXG amount when amount changes
  const calculateCdxgAmount = (solAmount: number) => {
    const solValueInUSD = solAmount * solPrice;
    
    // Calculate sold amount and determine current phase price
    const soldAmount = TOTAL_SUPPLY - remainingTokens;
    let cdxgPriceInUSDT;
    
    if (soldAmount <= PHASE_1_END) {
      cdxgPriceInUSDT = 1500; // Phase 1 price
    } else if (soldAmount <= PHASE_2_END) {
      cdxgPriceInUSDT = 6000; // Phase 2 price
    } else {
      cdxgPriceInUSDT = 12000; // Phase 3 price
    }

    const calculatedCdxg = Math.floor((solValueInUSD / cdxgPriceInUSDT) * 1_000_000 * 1_000_000);
    return calculatedCdxg;
  };

  const handleBuyToken = async () => {
    if (!publicKey || !amount) return;
    
    const solAmount = parseFloat(amount);
    const minPurchase = parseFloat(process.env.MIN_PURCHASE_SOL || '0.001');
    const maxPurchase = parseFloat(process.env.MAX_PURCHASE_SOL || '50');
    
    if (solAmount < minPurchase || solAmount > maxPurchase) {
      alert(`Please enter an amount between ${minPurchase} and ${maxPurchase} SOL`);
      return;
    }

    try {
      setIsProcessing(true);
      setStatus('Initializing purchase...');
      console.log('Starting purchase process...');
      const connection = new Connection(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!, 'confirmed');

      // 1. Create SOL transfer transaction
      setStatus('Creating SOL transfer...');
      console.log('Creating SOL transfer transaction...');
      const recipientWallet = new PublicKey(process.env.NEXT_PUBLIC_RECIPIENT_WALLET_ADDRESS!);
      
      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientWallet,
          lamports: solAmount * LAMPORTS_PER_SOL
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // 2. Send SOL transfer
      setStatus('Sending SOL transfer...');
      console.log('Sending SOL transfer...');
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: true,
        preflightCommitment: 'confirmed',
        maxRetries: 5
      });
      console.log('SOL transfer sent:', signature);

      // 3. Wait for confirmation with retries
      setStatus('Confirming SOL transfer...');
      console.log('Confirming SOL transfer...');
      let solConfirmed = false;
      let solRetryCount = 0;
      const solMaxRetries = 10;
      
      while (!solConfirmed && solRetryCount < solMaxRetries) {
        try {
          const confirmation = await Promise.race([
            connection.confirmTransaction(signature, 'confirmed'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 60000)
            )
          ]) as { value: { err: any } };

          if (confirmation.value.err) {
            throw new Error('SOL transfer failed');
          }
          
          solConfirmed = true;
          console.log('SOL transfer confirmed');
        } catch (error) {
          solRetryCount++;
          if (solRetryCount < solMaxRetries) {
            setStatus(`SOL transfer confirmation attempt ${solRetryCount} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            const status = await connection.getSignatureStatus(signature);
            if (status.value?.confirmationStatus === 'confirmed' || 
                status.value?.confirmationStatus === 'finalized') {
              solConfirmed = true;
              console.log('SOL transfer found to be successful after final check');
            } else {
              throw new Error('SOL transfer confirmation failed after all retries');
            }
          }
        }
      }

      // 4. Call API to send CDXG tokens with retries
      setStatus('Initiating CDXG token transfer...');
      console.log('Requesting CDXG transfer...');
      
      let cdxgResponse = null;
      let cdxgRetryCount = 0;
      const cdxgMaxRetries = 3;
      const cdxgRetryDelay = 10000; // 10 seconds between retries
      
      while (cdxgRetryCount < cdxgMaxRetries) {
        try {
          const response = await fetch('/api/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              buyerPublicKey: publicKey.toString(),
              solAmount,
              solPrice,
              remainingTokens
            })
          });
          
          if (response.ok) {
            cdxgResponse = response;
            break;
          }
          
          cdxgRetryCount++;
          if (cdxgRetryCount < cdxgMaxRetries) {
            setStatus(`CDXG transfer attempt ${cdxgRetryCount} failed, retrying in 10 seconds...`);
            await new Promise(resolve => setTimeout(resolve, cdxgRetryDelay));
            setStatus('Retrying CDXG transfer...');
          }
        } catch (error) {
          console.error('CDXG transfer error:', error);
          cdxgRetryCount++;
          if (cdxgRetryCount < cdxgMaxRetries) {
            setStatus(`CDXG transfer attempt ${cdxgRetryCount} failed, retrying in 10 seconds...`);
            await new Promise(resolve => setTimeout(resolve, cdxgRetryDelay));
            setStatus('Retrying CDXG transfer...');
          }
        }
      }

      if (!cdxgResponse) {
        throw new Error('CDXG transfer failed after multiple attempts. Please wait a few minutes and try again.');
      }

      let responseData;
      try {
        const responseText = await cdxgResponse.text();
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Invalid JSON response:', responseText);
          throw new Error('Server returned an invalid response. Please try again in a few minutes.');
        }
      } catch (error) {
        throw new Error('Failed to process server response. Please try again in a few minutes.');
      }

      const { signature: cdxgSignature } = responseData;
      console.log('CDXG transfer completed:', cdxgSignature);

      setIsProcessing(false);
      setStatus('');
      alert('Purchase successful! If tokens are not visible in your wallet, please add the token address manually.');
      setAmount('');
      onSuccess?.();

    } catch (error) {
      setIsProcessing(false);
      setStatus('');
      console.error('Purchase error:', error);
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('invalid response') || errorMessage.includes('invalid json') || errorMessage.includes('unexpected token')) {
          alert('Server is temporarily unavailable. Please wait a few minutes and try again.');
        } else if (errorMessage.includes('timeout')) {
          alert('Transaction is taking longer than expected. Please check your wallet or Solana Explorer for confirmation. If tokens do not appear within 30 minutes, contact support.');
        } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
          alert('Insufficient funds. Please ensure you have enough SOL to cover the purchase and fees.');
        } else if (errorMessage.includes('blockhash')) {
          alert('Network congestion detected. Please try again in a few moments.');
        } else if (errorMessage.includes('failed to transfer cdxg tokens')) {
          alert('CDXG token transfer failed. The system will automatically retry with higher priority. Please try again in a few minutes if tokens do not appear in your wallet.');
        } else {
          alert('Transaction status uncertain. Please try again in a few minutes. If the issue persists, contact support.');
        }
      } else {
        alert('Transaction status uncertain. Please wait up to 30 minutes and check your wallet. If you don\'t receive the tokens, contact support.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-400 text-sm mb-2">Amount (SOL)</label>
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              const solAmount = parseFloat(e.target.value) || 0;
              const calculatedCdxg = calculateCdxgAmount(solAmount);
              setCdxgAmount(calculatedCdxg.toLocaleString('en-US', { maximumFractionDigits: 0 }));
            }}
            className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-gray-800 transition-all duration-300 hover:border-gray-600"
            placeholder="0.0"
            disabled={isProcessing}
          />
          <button 
            className="absolute right-2 top-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            MAX
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400 mt-2 px-1">
            <span>You will receive:</span>
            <span className="text-blue-400">{(Number(cdxgAmount.replace(/,/g, '')) / 1_000_000).toLocaleString()} CDXG</span>
          </div>
          {amount && solPrice > 0 && (
            <div className="flex justify-between text-sm text-gray-400 px-1">
              <span>Value in USDT:</span>
              <span className="text-green-400">
                ${(parseFloat(amount || '0') * solPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {status && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="animate-spin h-5 w-5">
                    <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-400 animate-pulse">
                    {status}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Please keep this window open
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={handleBuyToken}
        disabled={!connected || !amount || isNaN(parseFloat(amount)) || isProcessing}
        className={`mt-4 w-full bg-gradient-to-r from-green-500 via-green-400 to-green-600 text-white rounded-lg py-4 font-semibold hover:shadow-premium transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed ${isProcessing ? 'animate-pulse' : 'animate-gradient-x'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:via-white/10 transition-opacity duration-300"></div>
        <span className="relative z-10 group-hover:text-green-100 flex items-center justify-center">
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </div>
          ) : (
            <>
              Buy CDXG
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
            </>
          )}
        </span>
      </button>
    </div>
  );
}
