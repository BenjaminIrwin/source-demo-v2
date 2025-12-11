'use client';

import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@heroicons/react/24/solid';

interface ClaimMorpherProps {
  vagueClaims: string[];
  enrichedClaims: { id: number; sentence: string }[];
  isActive: boolean;
}

interface ClaimComparisonProps {
  vague: string;
  enriched: string;
  claimId: number;
  index: number;
  isActive: boolean;
}

function ClaimComparison({ vague, enriched, claimId, index, isActive }: ClaimComparisonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/claims/${claimId}`);
  };

  return (
    <div 
      className={`group flex items-stretch gap-4 transition-all duration-500 ${
        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Vague claim (before) */}
      <div className="flex-1 relative bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
        <div className="absolute -left-2 -top-2 w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {index + 1}
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          {vague}
        </p>
      </div>

      {/* Arrow */}
      <div className="flex items-center px-1 shrink-0">
        <ArrowRightIcon className="w-5 h-5 text-indigo-500" />
      </div>

      {/* Enriched claim (after) */}
      <div 
        onClick={handleClick}
        className="flex-1 relative bg-slate-800/50 border border-indigo-500/30 rounded-xl p-4 cursor-pointer hover:border-indigo-400 hover:bg-slate-800/70 transition-all duration-300"
      >
        <div className="absolute -left-2 -top-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {index + 1}
        </div>
        <p className="text-white text-sm leading-relaxed">
          {enriched}
        </p>
        <div className="flex items-center gap-1 mt-2 text-indigo-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Explore</span>
          <ArrowRightIcon className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

export default function ClaimMorpher({ vagueClaims, enrichedClaims, isActive }: ClaimMorpherProps) {
  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-4 mb-2 px-2">
        <div className="flex-1 text-center">
          <span className="text-slate-500 text-sm font-medium">Extracted</span>
        </div>
        <div className="w-5 shrink-0" />
        <div className="flex-1 text-center">
          <span className="text-indigo-400 text-sm font-medium">Enriched</span>
        </div>
      </div>
      
      {/* Claims comparison list */}
      <div className="space-y-3 pt-2 pl-2">
        {vagueClaims.map((vagueClaim, index) => {
          const enrichedClaim = enrichedClaims[index];
          if (!enrichedClaim) return null;
          
          return (
            <ClaimComparison
              key={index}
              vague={vagueClaim}
              enriched={enrichedClaim.sentence}
              claimId={enrichedClaim.id}
              index={index}
              isActive={isActive}
            />
          );
        })}
      </div>
    </div>
  );
}
