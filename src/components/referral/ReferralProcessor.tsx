'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ReferralProcessor() {
  const { data: session, status } = useSession();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    const processStoredReferral = async () => {
      // Only process if user is authenticated and we haven't processed yet
      if (status !== 'authenticated' || !session?.user?.id || processing || result) {
        return;
      }

      const storedReferralCode = localStorage.getItem('referralCode');
      if (!storedReferralCode) {
        return;
      }

      setProcessing(true);
      
      try {
        const response = await fetch('/api/referrals/process-after-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ referralCode: storedReferralCode }),
        });

        const data = await response.json();
        
        if (response.ok) {
          setResult({ success: true, message: data.message });
          // Clear the referral code from storage after successful processing
          localStorage.removeItem('referralCode');
        } else {
          setResult({ success: false, message: data.error });
        }
      } catch (error) {
        console.error('Failed to process referral:', error);
        setResult({ success: false, message: 'Failed to process referral' });
      } finally {
        setProcessing(false);
      }
    };

    processStoredReferral();
  }, [session, status, processing, result]);

  if (!result) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
      result.success ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'
    }`}>
      <div className="flex items-center space-x-2">
        {result.success ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
        <span className={result.success ? 'text-green-800' : 'text-red-800'}>
          {result.message}
        </span>
      </div>
    </div>
  );
}