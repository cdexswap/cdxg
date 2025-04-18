import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import User from '@/app/lib/models/User';

export async function POST(req: Request) {
  try {
    console.log('Received update rewards request');
    const body = await req.json();
    const { refCode, rewardAmount } = body;
    console.log('Request body:', { refCode, rewardAmount });

    if (!refCode || typeof refCode !== 'string') {
      console.error('Invalid refCode:', refCode);
      return NextResponse.json({ error: 'Valid referral code is required' }, { status: 400 });
    }

    if (!rewardAmount || typeof rewardAmount !== 'number' || rewardAmount <= 0) {
      console.error('Invalid rewardAmount:', rewardAmount);
      return NextResponse.json({ error: 'Valid reward amount is required' }, { status: 400 });
    }

    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected to MongoDB');

    // Update the user's rewards using $inc operator
    console.log('Finding user with refCode:', refCode);
    const user = await User.findOneAndUpdate(
      { refCode },
      { $inc: { referralRewards: rewardAmount } }, // Use $inc to atomically increment the rewards
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validations
      }
    );

    if (!user) {
      console.error('Failed to update user rewards');
      return NextResponse.json({ error: 'Failed to update rewards' }, { status: 500 });
    }

    console.log('Successfully updated user rewards to:', user.referralRewards);
    return NextResponse.json({ 
      success: true, 
      rewards: user.referralRewards,
      message: `Successfully added ${rewardAmount} CDX to referral rewards`
    });
  } catch (error: any) {
    console.error('Error updating referral rewards:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error.message
    }, { status: 500 });
  }
}
