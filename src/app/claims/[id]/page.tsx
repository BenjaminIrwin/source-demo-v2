'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import SemanticLabeling, { SemanticRole, ClaimRecipes } from '@/components/SemanticLabeling';
import claimsData from '@/data/claims.json';

interface Claim {
  id: number;
  sentence: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  stative?: boolean;
  roles: SemanticRole[];
  recipes?: ClaimRecipes;
}

const claims = claimsData.claims as Claim[];

export default function ClaimDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = Number(params.id);
  
  // Check if we came from the pipeline
  const fromPipeline = searchParams.get('from') === 'pipeline';
  const pipelineStage = searchParams.get('stage');
  
  const handleBack = () => {
    if (fromPipeline && pipelineStage) {
      router.push(`/pipeline?stage=${pipelineStage}`);
    } else {
      router.push('/claims');
    }
  };

  const claim = claims.find((c) => c.id === id);

  if (!claim) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Claim not found</h1>
          <button
            onClick={handleBack}
            className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            ← {fromPipeline ? 'Back to Pipeline' : 'Back to Claims'}
          </button>
        </div>
      </div>
    );
  }

  const currentIndex = claims.findIndex((c) => c.id === id);
  
  // Build query string to preserve pipeline origin
  const queryString = fromPipeline && pipelineStage ? `?from=pipeline&stage=${pipelineStage}` : '';

  const goToPrevious = () => {
    const prevIndex = currentIndex === 0 ? claims.length - 1 : currentIndex - 1;
    router.push(`/claims/${claims[prevIndex].id}${queryString}`);
  };

  const goToNext = () => {
    const nextIndex = currentIndex === claims.length - 1 ? 0 : currentIndex + 1;
    router.push(`/claims/${claims[nextIndex].id}${queryString}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <button
          onClick={handleBack}
          className="text-slate-400 hover:text-white transition-colors flex items-center cursor-pointer"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          {fromPipeline ? 'Back to Pipeline' : 'Back to Claims'}
        </button>

        {/* Claim Navigator */}
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevious}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Previous
          </button>
          <span className="text-slate-400">
            Claim {currentIndex + 1} of {claims.length}
            <span className="text-slate-500 ml-2">({claim.roles.length} roles)</span>
          </span>
          <button
            onClick={goToNext}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="max-w-7xl w-full">
          <SemanticLabeling 
            key={id} 
            sentence={claim.sentence} 
            roles={claim.roles}
            recipes={claim.recipes || { mainRecipe: { sections: [] } }}
            startDate={claim.startDate || ''}
            endDate={claim.endDate || ''}
            location={claim.location || ''}
            stative={claim.stative || false}
          />
        </div>
      </div>
    </div>
  );
}
