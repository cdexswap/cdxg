import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import User from '@/app/lib/models/User';

function generateUniqueId() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST(req: Request) {
  try {
    console.log('API route called');
    
    // Validate request body
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { walletAddress, activeReferral } = body;
    
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({ error: 'Valid wallet address is required' }, { status: 400 });
    }

    if (activeReferral && typeof activeReferral !== 'string') {
      return NextResponse.json({ error: 'Invalid referral code format' }, { status: 400 });
    }

    try {
      console.log('Connecting to MongoDB...');
      await connectDB();
      console.log('Connected to MongoDB');
    } catch (dbError: any) {
      console.error('MongoDB connection error details:', {
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack
      });
      return NextResponse.json({ 
        error: `Database connection failed: ${dbError.message}` 
      }, { status: 500 });
    }

    try {
      // Check if user exists using findOneAndUpdate to handle race conditions
      console.log('Checking for existing user:', walletAddress);
      let user = await User.findOne({ walletAddress });
      
      if (!user) {
        // Validate referral code if provided
        if (activeReferral) {
          console.log('Checking referral code:', activeReferral);
          const referrer = await User.findOne({ refCode: activeReferral });
          if (!referrer) {
            console.log('Invalid referral code');
            return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
          }
          if (referrer.walletAddress === walletAddress) {
            console.log('Cannot use own referral code');
            return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
          }
          console.log('Found referrer:', referrer.walletAddress);
        }

        // Generate unique ref code with retries
        let refCode;
        let retries = 0;
        const maxRetries = 5;
        
        while (retries < maxRetries) {
          refCode = generateUniqueId();
          const existingUser = await User.findOne({ refCode });
          if (!existingUser) {
            break;
          }
          retries++;
          if (retries === maxRetries) {
            return NextResponse.json({ 
              error: 'Failed to generate unique referral code. Please try again.' 
            }, { status: 500 });
          }
        }

        try {
          // Create new user with atomic operation
          console.log('Creating new user with ref code:', refCode);
          user = await User.findOneAndUpdate(
            { walletAddress }, // find criteria
            { // update/insert data
              walletAddress,
              refCode,
              referredBy: activeReferral || null,
            },
            {
              upsert: true, // create if doesn't exist
              new: true, // return updated doc
              runValidators: true // run schema validations
            }
          );
          console.log('Created new user:', user);
        } catch (createError: any) {
          if (createError.code === 11000) { // Duplicate key error
            console.log('Race condition occurred, fetching existing user');
            user = await User.findOne({ walletAddress });
          } else {
            throw createError;
          }
        }
      } else {
        console.log('User already exists:', user);
        
        // Update referredBy if activeReferral is provided and user doesn't have a referrer
        if (activeReferral && !user.referredBy) {
          console.log('Checking referral code for existing user:', activeReferral);
          const referrer = await User.findOne({ refCode: activeReferral });
          
          if (!referrer) {
            console.log('Invalid referral code');
            return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
          }
          
          if (referrer.walletAddress === walletAddress) {
            console.log('Cannot use own referral code');
            return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
          }
          
          console.log('Updating existing user with referral:', activeReferral);
          user = await User.findOneAndUpdate(
            { walletAddress },
            { referredBy: activeReferral },
            { new: true }
          );
          console.log('Updated user with referral:', user);
        }
      }

      return NextResponse.json(user);
    } catch (dbOpError: any) {
      console.error('Database operation error:', {
        message: dbOpError.message,
        code: dbOpError.code,
        stack: dbOpError.stack
      });
      
      // Handle specific database errors
      if (dbOpError.code === 11000) {
        return NextResponse.json({ 
          error: 'This wallet address is already registered' 
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        error: `Database operation failed: ${dbOpError.message}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in user API:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error' 
    }, { status: 500 });
  }
}
