'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentTextIcon, SparklesIcon, BeakerIcon, ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, ArrowRightIcon, CalendarIcon, MapPinIcon, DocumentCheckIcon, VideoCameraIcon, ArchiveBoxIcon, LightBulbIcon, PhotoIcon } from '@heroicons/react/24/solid';
import ArticleViewer from '@/components/ArticleViewer';

// Import data
import articleData from '@/data/article.json';
import vagueClaimsData from '@/data/claims_vague.json';
import enrichedClaimsData from '@/data/claims.json';

const STAGES = ['Source', 'Identify', 'Enrich'];

// Types for enriched claims
interface Role {
  word: string;
  role: string;
  isAction?: boolean;
}

interface Evidence {
  id: string;
  type: string;
  title?: string;
  description?: string;
}

interface EnrichedClaim {
  id: number;
  sentence: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  roles: Role[];
  evidence: Evidence[];
}

// Role color mapping
const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  Agent: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/50' },
  Action: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/50' },
  Patient: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/50' },
  Instrument: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/50' },
  Location: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/50' },
  Time: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/50' },
};

// Evidence type icons
const evidenceIcons: Record<string, typeof VideoCameraIcon> = {
  video: VideoCameraIcon,
  multimedia: PhotoIcon,
  archive: ArchiveBoxIcon,
  reasoning: LightBulbIcon,
  document: DocumentCheckIcon,
};

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format date range
function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return 'Unknown';
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  
  const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  if (!end || start.toDateString() === end.toDateString()) {
    return startFormatted;
  }
  
  const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startFormatted} – ${endFormatted}`;
}

// Get evidence summary
function getEvidenceSummary(evidence: Evidence[]): { type: string; count: number; icon: typeof VideoCameraIcon }[] {
  const counts: Record<string, number> = {};
  evidence.forEach(e => {
    counts[e.type] = (counts[e.type] || 0) + 1;
  });
  
  return Object.entries(counts).map(([type, count]) => ({
    type,
    count,
    icon: evidenceIcons[type] || DocumentCheckIcon
  }));
}

// Claims list component with hover functionality
function ClaimsList({ 
  claims, 
  onHoverClaim, 
  highlightedIndex,
  showNumbers = true,
  compact = false,
  muted = false
}: { 
  claims: string[]; 
  onHoverClaim: (index: number | null) => void;
  highlightedIndex: number | null;
  showNumbers?: boolean;
  compact?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`space-y-3 ${compact ? 'pt-2 pl-2' : 'pt-4 pl-4'}`}>
      {claims.map((claim, index) => (
        <div
          key={index}
          onMouseEnter={() => onHoverClaim(index)}
          onMouseLeave={() => onHoverClaim(null)}
          className={`relative ${compact ? 'p-3' : 'p-4'} rounded-xl border transition-all duration-300 ${
            muted 
              ? 'bg-slate-800/30 border-slate-700/50'
              : highlightedIndex === index
                ? 'bg-indigo-500/20 border-indigo-500/50 scale-[1.02] cursor-pointer'
                : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600 cursor-pointer'
          }`}
        >
          {showNumbers && (
            <div className={`absolute -left-2 -top-2 ${compact ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-sm'} ${muted ? 'bg-slate-600' : 'bg-indigo-600'} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
              {index + 1}
            </div>
          )}
          <p className={`${compact ? 'text-sm' : 'text-sm'} leading-relaxed transition-colors duration-300 ${
            muted ? 'text-slate-400' : highlightedIndex === index ? 'text-white' : 'text-slate-400'
          }`}>
            {claim}
          </p>
        </div>
      ))}
    </div>
  );
}

// Interactive word with role tooltip
function RoleWord({ word, role, isAction }: { word: string; role: string; isAction?: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = roleColors[role] || { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/50' };
  
  return (
    <span 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span 
        className={`px-1 py-0.5 rounded ${colors.bg} ${colors.text} cursor-help transition-all duration-200 ${
          showTooltip ? 'ring-1 ring-white/30' : ''
        } ${isAction ? 'font-semibold' : ''}`}
      >
        {word}
      </span>
      {showTooltip && (
        <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${colors.bg} ${colors.text} border ${colors.border} whitespace-nowrap z-50 shadow-lg`}>
          {role}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></span>
        </span>
      )}
    </span>
  );
}

// Render sentence with role-annotated words
function AnnotatedSentence({ sentence, roles }: { sentence: string; roles: Role[] }) {
  // Sort roles by word length (longest first) to handle overlapping matches
  const sortedRoles = [...roles].sort((a, b) => b.word.length - a.word.length);
  
  // Create a map of positions to roles
  let result: (string | JSX.Element)[] = [sentence];
  
  sortedRoles.forEach((role, roleIndex) => {
    const newResult: (string | JSX.Element)[] = [];
    
    result.forEach((part, partIndex) => {
      if (typeof part !== 'string') {
        newResult.push(part);
        return;
      }
      
      const regex = new RegExp(`(${role.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const splits = part.split(regex);
      
      splits.forEach((split, splitIndex) => {
        if (split.toLowerCase() === role.word.toLowerCase()) {
          newResult.push(
            <RoleWord 
              key={`${roleIndex}-${partIndex}-${splitIndex}`} 
              word={split} 
              role={role.role} 
              isAction={role.isAction} 
            />
          );
        } else if (split) {
          newResult.push(split);
        }
      });
    });
    
    result = newResult;
  });
  
  return <>{result}</>;
}

// Enriched claims column for stage 2
function EnrichedClaimsList({ 
  claims, 
  isVisible 
}: { 
  claims: EnrichedClaim[];
  isVisible: boolean;
}) {
  const router = useRouter();
  
  return (
    <div className={`space-y-2 pt-2 pl-2 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
      {claims.map((claim, index) => {
        const evidenceSummary = getEvidenceSummary(claim.evidence);
        const totalEvidence = claim.evidence.length;
        
        return (
          <div
            key={index}
            onClick={() => router.push(`/claims/${claim.id}`)}
            className="group relative p-2.5 rounded-lg border bg-slate-800/60 border-indigo-500/30 cursor-pointer hover:border-indigo-400 hover:bg-slate-800/80 transition-all duration-300"
            style={{ transitionDelay: isVisible ? `${index * 50}ms` : '0ms' }}
          >
            {/* Claim number badge */}
            <div className="absolute -left-2 -top-2 w-5 h-5 text-[10px] bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              {index + 1}
            </div>
            
            {/* Annotated sentence */}
            <div className="text-sm leading-relaxed text-white mb-2 pl-2">
              <AnnotatedSentence sentence={claim.sentence} roles={claim.roles} />
            </div>
            
            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] border-t border-slate-700/50 pt-2 mt-1">
              {/* Time info */}
              {claim.startDate && (
                <div className="flex items-center gap-1 text-cyan-400">
                  <CalendarIcon className="w-3 h-3" />
                  <span className="font-medium">{formatDateRange(claim.startDate, claim.endDate)}</span>
                </div>
              )}
              
              {/* Location info */}
              {claim.location && (
                <div className="flex items-center gap-1 text-rose-400">
                  <MapPinIcon className="w-3 h-3" />
                  <span className="font-medium">{claim.location}</span>
                </div>
              )}
              
              {/* Evidence summary */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-slate-500 font-medium">{totalEvidence} evidence</span>
                <div className="flex items-center gap-1">
                  {evidenceSummary.map(({ type, count, icon: Icon }) => (
                    <div 
                      key={type} 
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300"
                      title={`${count} ${type}`}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Explore prompt */}
            <div className="flex items-center gap-1 mt-1.5 text-indigo-400 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Click to explore full analysis</span>
              <ArrowRightIcon className="w-2.5 h-2.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState(0);
  const [highlightedClaimIndex, setHighlightedClaimIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showEnrichedColumn, setShowEnrichedColumn] = useState(false);

  const vagueClaims = vagueClaimsData.claims;
  const enrichedClaims = enrichedClaimsData.claims as EnrichedClaim[];

  const goToPrev = () => {
    if (currentStage > 0 && !isTransitioning) {
      if (currentStage === 2) {
        // Going from Enrich back to Identify
        setShowEnrichedColumn(false);
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentStage(1);
          setIsTransitioning(false);
        }, 600);
      } else {
        setCurrentStage(currentStage - 1);
      }
    }
  };

  const goToNext = () => {
    if (currentStage < STAGES.length - 1 && !isTransitioning) {
      if (currentStage === 1) {
        // Going from Identify to Enrich
        setIsTransitioning(true);
        setCurrentStage(2);
        // Stagger: first fade article, then show enriched column
        setTimeout(() => {
          setShowEnrichedColumn(true);
          setTimeout(() => {
            setIsTransitioning(false);
          }, 400);
        }, 400);
      } else {
        setCurrentStage(currentStage + 1);
      }
    }
  };

  const getStageDescription = () => {
    if (isTransitioning && currentStage === 2) {
      return 'Enriching claims with specific details...';
    }
    switch (currentStage) {
      case 0: return 'Start with a source article containing claims to verify';
      case 1: return 'Hover over claims to see them highlighted in the article';
      case 2: return 'Compare extracted claims with their enriched versions';
      default: return '';
    }
  };

  // Determine what to show
  const isStage2 = currentStage === 2;
  const showArticle = currentStage <= 1 || (isStage2 && isTransitioning);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-8 px-6">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Claim Extraction Pipeline
          </h1>
          <p className="text-slate-400 text-base transition-all duration-300">
            {getStageDescription()}
          </p>
        </div>

        {/* Stage Content */}
        <div className="flex-1 relative overflow-hidden" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          <div className={`flex h-full justify-center transition-[gap] duration-700 ${currentStage === 0 ? 'gap-0' : 'gap-6'}`}>
            {/* Spacer for centering in stage 0 */}
            <div 
              className={`transition-[flex] duration-700 ease-out ${
                currentStage === 0 ? 'flex-1' : 'flex-[0]'
              }`}
            />
            
            {/* Article Section - only in stages 0-1, fades out for stage 2 */}
            <div 
              className={`flex flex-col transition-all duration-600 ease-out ${
                isStage2
                  ? 'flex-[0] w-0 opacity-0 overflow-hidden' 
                  : currentStage === 0 
                    ? 'flex-[2] max-w-4xl opacity-100' 
                    : 'flex-[2] min-w-0 opacity-100'
              }`}
              style={{ transform: 'translateZ(0)' }}
            >
              <div className={`flex items-center gap-2 mb-3 transition-opacity duration-400 ${
                isStage2 ? 'opacity-0' : 'opacity-100'
              }`}>
                <DocumentTextIcon className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Source Article</h2>
              </div>
              <div className="flex-1 min-h-0">
                <ArticleViewer
                  article={articleData.content}
                  claims={currentStage >= 1 ? vagueClaims : []}
                  highlightedClaimIndex={highlightedClaimIndex}
                />
              </div>
            </div>

            {/* Claims Column - transforms from sidebar to left column */}
            <div 
              className={`flex flex-col transition-all duration-700 ease-out ${
                isStage2
                  ? 'flex-1 min-w-0'
                  : currentStage === 0
                    ? 'flex-[0] w-0 opacity-0 overflow-hidden'
                    : 'flex-1 min-w-0 opacity-100 translate-x-0'
              }`}
              style={{ transform: 'translateZ(0)' }}
            >
              <div className={`flex items-center gap-2 mb-3 transition-all duration-500`}>
                <BeakerIcon className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white transition-all duration-300">
                  {isStage2 ? 'Extracted' : 'Identified Claims'}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                <ClaimsList
                  claims={vagueClaims}
                  onHoverClaim={isStage2 ? () => {} : setHighlightedClaimIndex}
                  highlightedIndex={isStage2 ? null : highlightedClaimIndex}
                  compact={isStage2}
                  muted={isStage2}
                />
              </div>
            </div>

            {/* Arrow column - only in stage 2 */}
            <div 
              className={`flex flex-col justify-center items-center transition-all duration-500 ${
                isStage2 && showEnrichedColumn ? 'w-12 opacity-100' : 'w-0 opacity-0 overflow-hidden'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                {vagueClaims.map((_, i) => (
                  <ArrowRightIcon 
                    key={i} 
                    className="w-5 h-5 text-indigo-500"
                    style={{ 
                      marginTop: i === 0 ? '2.5rem' : '2.75rem',
                      opacity: showEnrichedColumn ? 1 : 0,
                      transition: 'opacity 300ms',
                      transitionDelay: `${i * 50 + 200}ms`
                    }} 
                  />
                ))}
              </div>
            </div>

            {/* Enriched Claims Column - slides in from right for stage 2 */}
            <div 
              className={`flex flex-col transition-all duration-700 ease-out ${
                isStage2 ? 'flex-1 min-w-0' : 'flex-[0] w-0 opacity-0 overflow-hidden'
              }`}
              style={{ transform: 'translateZ(0)' }}
            >
              <div className={`flex items-center gap-2 mb-3 transition-opacity duration-500 ${
                showEnrichedColumn ? 'opacity-100' : 'opacity-0'
              }`}>
                <SparklesIcon className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Enriched</h2>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                <EnrichedClaimsList
                  claims={enrichedClaims}
                  isVisible={showEnrichedColumn}
                />
              </div>
            </div>

            {/* Right spacer for stage 0 centering */}
            <div 
              className={`transition-[flex] duration-700 ease-out ${
                currentStage === 0 ? 'flex-1' : 'flex-[0]'
              }`}
            />
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </button>

          {/* Stage navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={goToPrev}
              disabled={currentStage === 0 || isTransitioning}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 cursor-pointer ${
                currentStage === 0 || isTransitioning
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ChevronLeftIcon className="w-5 h-5" />
              {currentStage > 0 ? STAGES[currentStage - 1] : 'Previous'}
            </button>

            <span className="text-slate-500 text-sm">
              {currentStage + 1} / {STAGES.length}
            </span>

            <button
              onClick={goToNext}
              disabled={currentStage === STAGES.length - 1 || isTransitioning}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 cursor-pointer ${
                currentStage === STAGES.length - 1 || isTransitioning
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {currentStage < STAGES.length - 1 ? STAGES[currentStage + 1] : 'Next'}
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
