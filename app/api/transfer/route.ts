import { NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, Keypair, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import connectDB from '@/app/lib/mongodb';
import User from '@/app/lib/models/User';

const TOTAL_SUPPLY = 20_000_000;
const PHASE_1_END = 10_000_000;
const PHASE_2_END = 15_000_000;

// Helper function to determine price for current phase
const getPriceForPhase = (soldAmount: number) => {
  if (soldAmount <= PHASE_1_END) return 1500;
  if (soldAmount <= PHASE_2_END) return 6000;
  return 12000;
};

// Wrapper to ensure JSON response
const handleError = (error: any) => {
  console.error('Transfer API error:', error);
  let errorMessage = 'Unknown error occurred';
  let errorDetails = '';

  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || '';
  }

  // Log detailed error information
  console.error('Detailed error information:');
  console.error('Message:', errorMessage);
  console.error('Details:', errorDetails);

  return NextResponse.json(
    { 
      error: 'Failed to transfer CDXG tokens',
      details: errorMessage,
      stack: errorDetails
    },
    { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};

export async function POST(req: Request) {
  // Ensure we always return JSON, even for unexpected errors
  try {
    console.log('Starting token transfer process...');
    const { buyerPublicKey, solAmount, solPrice, remainingTokens } = await req.json();
    console.log('Received transfer request for buyer:', buyerPublicKey);

    if (!process.env.PRIVATE_KEY) {
      console.error('PRIVATE_KEY environment variable is missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // RPC endpoints with fallbacks
    const rpcEndpoints = [
      process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
      'https://solana-rpc.publicnode.com',
      'https://solana-mainnet.g.alchemy.com/v2/demo',
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana'
    ];

    // Try to establish connection with fallback
    console.log('Establishing Solana connection...');
    let connection: Connection | null = null;
    let currentEndpoint = '';

    for (const endpoint of rpcEndpoints) {
      try {
        const tempConnection = new Connection(endpoint, 'confirmed');
        // Test the connection
        await tempConnection.getLatestBlockhash();
        connection = tempConnection;
        currentEndpoint = endpoint;
        console.log('Connected to RPC:', endpoint);
        break;
      } catch (error) {
        console.log(`Failed to connect to ${endpoint}, trying next endpoint...`);
        continue;
      }
    }

    if (!connection) {
      throw new Error('Failed to connect to any Solana RPC endpoint');
    }

    // Create sender keypair from private key
    console.log('Creating sender keypair...');
    const privateKeyArray = JSON.parse(process.env.PRIVATE_KEY);
    const senderKeypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));

    // Get token accounts
    const cdxgMint = new PublicKey(process.env.NEXT_PUBLIC_CDXG_TOKEN_ADDRESS!);
    const buyerPubkey = new PublicKey(buyerPublicKey);

    // Calculate CDXG amount
    const solValueInUSD = solAmount * solPrice;
    const soldAmount = TOTAL_SUPPLY - remainingTokens;
    const cdxgPriceInUSDT = getPriceForPhase(soldAmount);
    const cdxgAmount = Math.floor((solValueInUSD / cdxgPriceInUSDT) * 1_000_000 * 1_000_000);
    console.log('Calculated CDXG amount:', cdxgAmount);

    // Get token accounts
    console.log('Getting token accounts...');
    const buyerTokenAccount = await getAssociatedTokenAddress(cdxgMint, buyerPubkey);
    const senderTokenAccount = await getAssociatedTokenAddress(cdxgMint, senderKeypair.publicKey);
    console.log('Buyer token account:', buyerTokenAccount.toString());
    console.log('Sender token account:', senderTokenAccount.toString());

    // Create transaction
    const transaction = new Transaction();

    // Check if buyer's token account exists
    const buyerAccountInfo = await connection.getAccountInfo(buyerTokenAccount);
    if (!buyerAccountInfo) {
      console.log('Creating Associated Token Account for buyer...');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          senderKeypair.publicKey, // payer
          buyerTokenAccount, // ata
          buyerPubkey, // owner
          cdxgMint // mint
        )
      );
    }

    // Add CDXG transfer instruction
    transaction.add(
      createTransferInstruction(
        senderTokenAccount,
        buyerTokenAccount,
        senderKeypair.publicKey,
        BigInt(cdxgAmount)
      )
    );

    // Function to send transaction with compute units configuration and RPC fallback
    const sendTransactionWithRetry = async (baseInstructions: Transaction['instructions'], computeUnits: number, priorityFee: number) => {
      // Create new transaction for each attempt
      const newTransaction = new Transaction();
      
      // Add compute unit configuration first
      newTransaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee })
      );
      
      // Add the base instructions
      baseInstructions.forEach(instruction => newTransaction.add(instruction));
      
      // Get fresh blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      newTransaction.recentBlockhash = blockhash;
      newTransaction.feePayer = senderKeypair.publicKey;
      
      // Sign with fresh blockhash
      newTransaction.sign(senderKeypair);
      
      const rawTransaction = newTransaction.serialize();
      
      // Try each RPC endpoint for sending transaction
      for (const endpoint of rpcEndpoints) {
        if (endpoint !== currentEndpoint) {
          try {
            const fallbackConnection = new Connection(endpoint, 'confirmed');
            console.log('Trying RPC endpoint:', endpoint);
            return await fallbackConnection.sendRawTransaction(rawTransaction, {
              skipPreflight: false,
              preflightCommitment: 'confirmed',
              maxRetries: 5
            });
          } catch (error) {
            console.log(`Failed with RPC ${endpoint}, trying next...`);
            continue;
          }
        }
      }
      
      // If all fallbacks fail, try the current connection one last time
      return await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 5
      });
    };

    // Save base instructions
    const baseInstructions = transaction.instructions;
    
    // Try sending with increasing compute units and priority fees
    console.log('Sending transaction...');
    let signature;
    const retryConfigs = [
      { computeUnits: 500000, priorityFee: 10 },
      { computeUnits: 800000, priorityFee: 25 },
      { computeUnits: 1000000, priorityFee: 50 },
      { computeUnits: 1200000, priorityFee: 100 },
      { computeUnits: 1400000, priorityFee: 200 }
    ];

    for (const config of retryConfigs) {
      try {
        signature = await sendTransactionWithRetry(baseInstructions, config.computeUnits, config.priorityFee);
        console.log(`Transaction sent with signature: ${signature}`);
        console.log(`Used compute units: ${config.computeUnits}, priority fee: ${config.priorityFee}`);
        break;
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown error';
        console.log(`Failed with compute units ${config.computeUnits}. Error: ${errorMessage}`);
        
        if (config === retryConfigs[retryConfigs.length - 1]) {
          throw new Error(`Transaction failed: ${errorMessage}. Please try again in a few minutes.`);
        }
        
        // Add delay before next retry
        console.log('Waiting before next retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    if (!signature) {
      throw new Error('Transaction failed: Unable to send after multiple attempts. Network may be congested.');
    }
    
    // Custom confirmation with extended timeout and retries
    console.log('Waiting for confirmation...');
    let confirmed = false;
    let retryCount = 0;
    const maxRetries = 10; // Allow up to 10 retries
    const confirmationTimeout = 60000; // 60 seconds per attempt
    
    while (!confirmed && retryCount < maxRetries) {
      try {
        const confirmation = await Promise.race([
          connection.confirmTransaction(signature, 'confirmed'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), confirmationTimeout)
          )
        ]) as { value: { err: any } };
        
        if (confirmation.value.err) {
          throw new Error('Transaction failed');
        }
        
        confirmed = true;
        console.log('Transaction confirmed successfully');
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Confirmation attempt ${retryCount} failed, retrying...`);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.log('Max retries reached, checking transaction status...');
          // Final check of transaction status
          const status = await connection.getSignatureStatus(signature);
          if (status.value?.confirmationStatus === 'confirmed' || 
              status.value?.confirmationStatus === 'finalized') {
            confirmed = true;
            console.log('Transaction found to be successful after final check');
          } else {
            throw new Error('Transaction confirmation failed after all retries');
          }
        }
      }
    }

    // After successful transfer, handle referral rewards
    try {
      console.log('Handling referral rewards...');
      await connectDB();
      
      // Find buyer's user record to get referrer
      const buyer = await User.findOne({ walletAddress: buyerPublicKey });
      if (buyer && buyer.referredBy) {
        // Calculate 5% reward based on displayed amount
        const displayedAmount = Number((cdxgAmount / 1_000_000).toLocaleString().replace(/,/g, ''));
        const rewardAmount = Number((displayedAmount * 0.05).toFixed(2));
        
        // Update rewards directly in database
        const updatedUser = await User.findOneAndUpdate(
          { refCode: buyer.referredBy },
          { $inc: { referralRewards: rewardAmount } },
          { new: true }
        );

        if (!updatedUser) {
          console.error('Failed to update referral rewards: Referrer not found');
        } else {
          console.log('Successfully updated referral rewards to:', updatedUser.referralRewards);
        }
      }
    } catch (error) {
      console.error('Error handling referral rewards:', error);
      // Don't throw error here - we want to return success for the main transfer
    }

    return NextResponse.json({ success: true, signature });

  } catch (error) {
    return handleError(error);
  }
}
