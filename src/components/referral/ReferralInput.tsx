'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircle, XCircle, Gift } from 'lucide-react';

export default function ReferralInput() {
  const { data: session } = useSession();
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralCode.trim() || !session?.user?.id) return;

    setLoading(true);
    setResult(null);

    try {
      // First validate the referral code
      const validationResponse = await fetch('/api/referrals/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode: referralCode.trim() }),
      });

      const validationData = await validationResponse.json();

      if (!validationResponse.ok) {
        setResult({ success: false, message: validationData.error });
        return;
      }

      // Process the referral
      const processResponse = await fetch('/api/referrals/process-after-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode: referralCode.trim() }),
      });

      const processData = await processResponse.json();

      if (processResponse.ok) {
        setResult({ success: true, message: processData.message });
        setReferralCode('');
      } else {
        setResult({ success: false, message: processData.error });
      }
    } catch (error) {
      console.error('Failed to process referral:', error);
      setResult({ success: false, message: 'Failed to process referral' });
    } finally {
      setLoading(false);
    }
  };

  // Check if user already has a referral
  if (session?.user?.id) {
    // You might want to check this from your user data or make an API call
    // For now, we'll assume the component is only shown if user doesn't have a referral
  }

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-purple-500/20">
      <div className="flex items-center space-x-3 mb-4">
        <Gift className="w-8 h-8 text-purple-400" />
        <h3 className="text-xl font-bold text-white">Enter Referral Code</h3>
      </div>
      
      <p className="text-gray-400 mb-4">
        Have a referral code? Enter it below to get bonus rewards!
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Enter referral code"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !referralCode.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Apply'}
          </button>
        </div>
      </form>

      {result && (
        <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
          result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {result.success ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}