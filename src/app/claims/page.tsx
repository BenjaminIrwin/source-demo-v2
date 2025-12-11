'use client';

import { useRouter } from 'next/navigation';
import claimsData from '@/data/claims.json';

interface Claim {
  id: number;
  sentence: string;
}

const claims = claimsData.claims as Claim[];

export default function ClaimsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center py-20">
      <div className="max-w-6xl mx-auto text-center px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Claims
          </h1>
          <p className="text-slate-400 text-lg">
            Select a claim to explore its sources and evidence
          </p>
        </div>

        {/* Claims Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {claims.map((claim) => (
            <div
              key={claim.id}
              onClick={() => router.push(`/claims/${claim.id}`)}
              className="backdrop-blur-sm rounded-2xl shadow-lg shadow-black/20 border p-6 flex flex-col justify-between min-h-[200px] bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer group"
            >
              <div className="mb-4">
                <p className="text-left text-base leading-relaxed text-white">
                  {claim.sentence}
                </p>
              </div>
              <div className="flex items-center font-medium text-indigo-400 group-hover:text-indigo-300">
                Explore
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-12">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white transition-colors flex items-center justify-center mx-auto cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
