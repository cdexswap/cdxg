import Image from 'next/image';

const RoadmapWidget = () => {
  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-black/20 backdrop-blur-sm rounded-3xl border border-white/10">
      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">
        TIMELINE OF $CDXG
      </h2>
      
      <div className="relative">
        <Image 
          src="/CDXG.png" 
          alt="CDXG Logo" 
          width={100} 
          height={100}
          className="mx-auto mb-4"
        />
        
        <div className="space-y-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-semibold text-orange-400">JAN</h3>
              <p>Minting 1,000,000,000 $CDXG TOKEN</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-orange-400">JAN-FEB</h3>
              <p>Burning 900,000,000 $CDXG TOKEN</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-semibold text-orange-400">FEB</h3>
              <p>Private Sale 80,000,000 $CDXG</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-orange-400">MAR</h3>
              <p>Public Sale 20,000,000 $CDXG</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-semibold text-orange-400">APR</h3>
              <p>Sold Out 100,000,000 $CDXG</p>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-sm">
            <p>• $CDXG 1 = 1 VOTE (Can vote at each of our policy meetings by majority vote.)</p>
            <p>• $CDXG 1 = 1 $CDX (Holder will get $CDX for free direct to $CDXG wallet on 30 Apr 2025.)</p>
            <p>• $CDXG Holder will receive market shared from CDEXS Platform up to 1% of total free</p>
            <p>• $CDXG 100,000 - 999,999 (Receive VIP Member rights with benefits.)</p>
            <p>• $CDXG 1,000,000 (Receive VVIP Member rights with full benefits and unlimited referral.)</p>
            <p className="font-semibold mt-4">VIP and VVIP Member of $ CDXG Holder can open unlimited Seller Shop Value</p>
            <p className="text-center text-sm text-gray-400">(Include : P2P Decentralized, Marketplace, E-commerce Shop etc.)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapWidget;
