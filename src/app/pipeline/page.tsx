'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DocumentTextIcon, SparklesIcon, BeakerIcon, ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, ArrowRightIcon, CalendarIcon, MapPinIcon, DocumentCheckIcon, VideoCameraIcon, ArchiveBoxIcon, LightBulbIcon, PhotoIcon, TagIcon, NewspaperIcon, ScaleIcon } from '@heroicons/react/24/solid';
import ArticleViewer from '@/components/ArticleViewer';
import ExplainableNews from '@/components/ExplainableNews';
import GrokComparison from '@/components/GrokComparison';

// Import data
import articleData from '@/data/article.json';
import vagueClaimsData from '@/data/claims_vague.json';
import enrichedClaimsData from '@/data/claims.json';

const STAGES = ['Source', 'Identify', 'Enrich', 'Explain', 'Compare'];

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
  stative?: boolean;
  frame?: string;
  roles: Role[];
  evidence: Evidence[];
}

// Role color mapping
const roleColors: Record<string, { bg: string; text: string; border: string; tooltipBg: string }> = {
  Agent: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/50', tooltipBg: 'bg-blue-900' },
  Action: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/50', tooltipBg: 'bg-amber-900' },
  Patient: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/50', tooltipBg: 'bg-emerald-900' },
  Instrument: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/50', tooltipBg: 'bg-purple-900' },
  Location: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/50', tooltipBg: 'bg-rose-900' },
  Time: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/50', tooltipBg: 'bg-cyan-900' },
  Content: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/50', tooltipBg: 'bg-slate-800' },
  Theme: { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/50', tooltipBg: 'bg-violet-900' },
  Init_location: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/50', tooltipBg: 'bg-rose-900' },
  Path: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/50', tooltipBg: 'bg-orange-900' },
  Final_location: { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/50', tooltipBg: 'bg-pink-900' },
  Scope: { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/50', tooltipBg: 'bg-teal-900' },
  Co_agent: { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/50', tooltipBg: 'bg-indigo-900' },
  Beneficiary: { bg: 'bg-lime-500/20', text: 'text-lime-300', border: 'border-lime-500/50', tooltipBg: 'bg-lime-900' },
};

// Evidence type icons
const evidenceIcons: Record<string, typeof VideoCameraIcon> = {
  video: VideoCameraIcon,
  multimedia: PhotoIcon,
  archive: ArchiveBoxIcon,
  reasoning: LightBulbIcon,
  document: DocumentCheckIcon,
};

// Check if time is meaningful (not midnight or end of day)
function hasSignificantTime(date: Date): boolean {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  // Consider 00:00 and 23:59 as "no specific time"
  if (hours === 0 && minutes === 0) return false;
  if (hours === 23 && minutes === 59) return false;
  return true;
}

// Format time as HH:MM
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Format date range with smart granularity
function formatDateRange(startDate?: string, endDate?: string, stative: boolean = false): string {
  const dateFormat: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  
  // If only endDate exists, show "before {endDate}"
  if (!startDate && endDate) {
    const end = new Date(endDate);
    const endHasTime = hasSignificantTime(end);
    const endDateStr = end.toLocaleDateString('en-US', dateFormat);
    return endHasTime ? `before ${endDateStr} ${formatTime(end)}` : `before ${endDateStr}`;
  }
  
  if (!startDate) return 'Unknown';
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  
  const sameDay = end && start.toDateString() === end.toDateString();
  const startHasTime = hasSignificantTime(start);
  const endHasTime = end && hasSignificantTime(end);
  
  const startDateStr = start.toLocaleDateString('en-US', dateFormat);
  const prefix = stative ? 'At the time of ' : '';
  
  // Same day with time interval
  if (sameDay && startHasTime && endHasTime) {
    return `${prefix}${startDateStr}, ${formatTime(start)} – ${formatTime(end)}`;
  }
  
  // Same day with only start time
  if (sameDay && startHasTime) {
    return `${prefix}${startDateStr} at ${formatTime(start)}`;
  }
  
  // Same day, no specific times OR startDate equals endDate - only show startDate
  if (sameDay || !end || startDate === endDate) {
    return `${prefix}${startDateStr}`;
  }
  
  // Different days
  const endDateStr = end.toLocaleDateString('en-US', dateFormat);
  
  // Different days with times
  if (startHasTime && endHasTime) {
    if (stative) {
      return `At the time of ${startDateStr} ${formatTime(start)} to ${endDateStr} ${formatTime(end)}`;
    }
    return `${startDateStr} ${formatTime(start)} – ${endDateStr} ${formatTime(end)}`;
  }
  
  if (stative) {
    return `At the time of ${startDateStr} to ${endDateStr}`;
  }
  return `${startDateStr} – ${endDateStr}`;
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
  muted = false,
  targetHeights = []
}: { 
  claims: string[]; 
  onHoverClaim: (index: number | null) => void;
  highlightedIndex: number | null;
  showNumbers?: boolean;
  compact?: boolean;
  muted?: boolean;
  targetHeights?: number[];
}) {
  return (
    <div className={`flex flex-col ${compact ? 'pt-6 pl-2 gap-2' : 'pt-4 pl-4 gap-3'}`}>
      {claims.map((claim, index) => (
        <div
          key={index}
          onMouseEnter={() => onHoverClaim(index)}
          onMouseLeave={() => onHoverClaim(null)}
          className={`relative ${compact ? 'p-2.5 overflow-hidden' : 'p-4'} rounded-lg border transition-all duration-500 ${
            muted 
              ? 'bg-slate-800/30 border-slate-700/50'
              : highlightedIndex === index
                ? 'bg-indigo-500/20 border-indigo-500/50 scale-[1.02] cursor-pointer'
                : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600 cursor-pointer'
          } ${!compact ? 'flex items-center' : ''}`}
          style={targetHeights[index] && targetHeights[index] > 0 ? { height: `${targetHeights[index]}px` } : undefined}
        >
          {showNumbers && (
            <div className={`absolute -left-2 -top-2 w-5 h-5 text-[10px] ${muted ? 'bg-slate-600' : 'bg-indigo-600'} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
              {index + 1}
            </div>
          )}
          <p className={`${compact ? 'text-sm mb-2 pl-2 pt-1' : 'text-sm'} leading-relaxed transition-colors duration-300 ${
            muted ? 'text-slate-400' : highlightedIndex === index ? 'text-white' : 'text-slate-400'
          }`}>
            {claim}
          </p>
          {/* Metadata row - only show when compact/muted */}
          {compact && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] border-t border-slate-700/50 pt-2 mt-1">
              <div className="flex items-center gap-1 text-slate-500">
                <CalendarIcon className="w-3 h-3" />
                <span className="font-medium">???</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <MapPinIcon className="w-3 h-3" />
                <span className="font-medium">???</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Interactive word with role tooltip
function RoleWord({ word, role, isAction }: { word: string; role: string; isAction?: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = roleColors[role] || { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/50', tooltipBg: 'bg-slate-800' };
  
  // Extract base role name (e.g., "Content.quote" -> "Content")
  const baseRole = role.split('.')[0];
  const displayColors = roleColors[baseRole] || colors;
  
  return (
    <span 
      className="relative inline"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span 
        className={`px-1 py-0.5 rounded ${displayColors.bg} ${displayColors.text} cursor-help transition-all duration-200 ${
          showTooltip ? 'ring-1 ring-white/30' : ''
        } ${isAction ? 'font-semibold' : ''} box-decoration-clone`}
      >
        {word}
      </span>
      {showTooltip && (
        <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${displayColors.tooltipBg} ${displayColors.text} border ${displayColors.border} whitespace-nowrap z-50 shadow-lg`}>
          {role}
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
  let result: (string | React.ReactNode)[] = [sentence];
  
  sortedRoles.forEach((role, roleIndex) => {
    const newResult: (string | React.ReactNode)[] = [];
    
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

// Aligned grid for stage 2 - uses CSS Grid to automatically align rows
function AlignedClaimsGrid({ 
  vagueClaims,
  enrichedClaims, 
  isVisible,
  currentStage,
  transitionPhase = 0
}: { 
  vagueClaims: string[];
  enrichedClaims: EnrichedClaim[];
  isVisible: boolean;
  currentStage: number;
  transitionPhase?: number;
}) {
  const router = useRouter();
  
  // During phase 2, extracted claims fade in immediately, arrows and enriched fade in with delay
  const showExtracted = transitionPhase === 2 || isVisible;
  const showArrowsAndEnriched = isVisible;
  
  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-2 pt-6 transition-opacity duration-100 ${showExtracted ? 'opacity-100' : 'opacity-0'}`}>
      {vagueClaims.map((vagueClaim, index) => {
        const enrichedClaim = enrichedClaims[index];
        const evidenceSummary = enrichedClaim ? getEvidenceSummary(enrichedClaim.evidence) : [];
        
        return (
          <div key={index} className="contents">
            {/* Extracted claim - appears first during crossfade */}
            <div className={`relative p-2.5 rounded-lg border bg-slate-800/30 border-slate-700/50 pl-4 transition-opacity duration-100 ${
              showExtracted ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="absolute -left-2 -top-2 w-5 h-5 text-[10px] bg-slate-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {index + 1}
              </div>
              <p className="text-sm mb-2 pl-2 pt-1 leading-relaxed text-slate-400">
                {vagueClaim}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] border-t border-slate-700/50 pt-2 mt-1">
                <div className="flex items-center gap-1 text-slate-500">
                  <CalendarIcon className="w-3 h-3" />
                  <span className="font-medium">???</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPinIcon className="w-3 h-3" />
                  <span className="font-medium">???</span>
                </div>
              </div>
            </div>
            
            {/* Arrow - fades in after extracted */}
            <div className={`flex items-center justify-center w-8 transition-opacity duration-100 ${
              showArrowsAndEnriched ? 'opacity-100' : 'opacity-0'
            }`}>
              <ArrowRightIcon className="w-5 h-5 text-indigo-500" />
            </div>
            
            {/* Enriched claim - fades in last */}
            {enrichedClaim && (
              <div
                onClick={() => router.push(`/claims/${enrichedClaim.id}?from=pipeline&stage=${currentStage}`)}
                className={`group relative p-2.5 rounded-lg border bg-slate-800/60 border-indigo-500/30 cursor-pointer hover:border-indigo-400 hover:bg-slate-800/80 transition-all duration-100 overflow-visible ${
                  showArrowsAndEnriched ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="absolute -left-2 -top-2 w-5 h-5 text-[10px] bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {index + 1}
                </div>
                
                <div className="text-sm leading-relaxed text-white mb-2 pl-2 pt-1 overflow-visible">
                  <AnnotatedSentence sentence={enrichedClaim.sentence} roles={enrichedClaim.roles} />
                </div>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] border-t border-slate-700/50 pt-2 mt-1">
                  <div className={`flex items-center gap-1 ${(enrichedClaim.startDate || enrichedClaim.endDate) ? 'text-cyan-400' : 'text-slate-500'}`}>
                    <CalendarIcon className="w-3 h-3" />
                    <span className="font-medium">{(enrichedClaim.startDate || enrichedClaim.endDate) ? formatDateRange(enrichedClaim.startDate, enrichedClaim.endDate, enrichedClaim.stative) : '???'}</span>
                  </div>
                  
                  <div className={`flex items-center gap-1 ${enrichedClaim.location ? 'text-rose-400' : 'text-slate-500'}`}>
                    <MapPinIcon className="w-3 h-3" />
                    <span className="font-medium">{enrichedClaim.location || '???'}</span>
                  </div>

                  {enrichedClaim.frame && (
                    <div className="flex items-center gap-1 text-amber-400">
                      <TagIcon className="w-3 h-3" />
                      <span className="font-medium uppercase">{enrichedClaim.frame}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5 ml-auto">
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
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStage, setCurrentStage] = useState(0);
  const [highlightedClaimIndex, setHighlightedClaimIndex] = useState<number | null>(null);
  // Transition phases: 0=none, 1=article fading/claims sliding left, 2=crossfade to enriched
  const [transitionPhase, setTransitionPhase] = useState(0);

  const vagueClaims = vagueClaimsData.claims;
  const enrichedClaims = enrichedClaimsData.claims as EnrichedClaim[];
  
  // Derived state for backwards compatibility
  const isTransitioning = transitionPhase > 0;
  const showEnrichedColumn = transitionPhase === 2 || (currentStage === 2 && transitionPhase === 0);
  
  // Restore stage from URL params on mount
  useEffect(() => {
    const stageParam = searchParams.get('stage');
    if (stageParam) {
      const stage = parseInt(stageParam, 10);
      if (stage >= 0 && stage < STAGES.length) {
        setCurrentStage(stage);
        // Stage 2 doesn't need special handling now - showEnrichedColumn is derived
      }
    }
  }, [searchParams]);

  const goToPrev = () => {
    if (currentStage > 0 && !isTransitioning) {
      if (currentStage === 2) {
        // Going from Enrich back to Identify - fast reverse transition
        setTransitionPhase(2);
        setTransitionPhase(1);
        setCurrentStage(1);
        setTimeout(() => {
          setTransitionPhase(0);
        }, 150);
      } else if (currentStage === 3) {
        // Going from Explain back to Enrich
        setCurrentStage(2);
      } else {
        setCurrentStage(currentStage - 1);
      }
    }
  };

  const goToNext = () => {
    if (currentStage < STAGES.length - 1 && !isTransitioning) {
      if (currentStage === 1) {
        // Going from Identify to Enrich - fast simultaneous move + crossfade
        setTransitionPhase(1);
        setCurrentStage(2);
        setTransitionPhase(2);
        setTimeout(() => {
          setTransitionPhase(0);
        }, 150);
      } else {
        setCurrentStage(currentStage + 1);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStage, isTransitioning]);

  const getStageDescription = () => {
    if (isTransitioning && currentStage === 2) {
      return 'Enriching claims with specific details...';
    }
    switch (currentStage) {
      case 0: return 'Start with a source article containing claims to verify';
      case 1: return 'Hover over claims to see them highlighted in the article';
      case 2: return 'Compare extracted claims with their enriched versions';
      case 3: return 'See how claims become explainable news content';
      case 4: return 'Compare recipe-based editing vs traditional AI approaches';
      default: return '';
    }
  };

  // Determine what to show
  const isStage2 = currentStage === 2;
  const showArticle = currentStage <= 1 || (isStage2 && isTransitioning);

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-8 px-6">
      <div className="max-w-7xl mx-auto">
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
        <div className="relative min-h-[500px]">
          <div className={`flex items-start justify-center transition-[gap] duration-700 gap-6 ${currentStage >= 3 ? 'hidden' : ''}`}>
            {/* Article Section - only in stages 0-1, fades out during phase 1 */}
            <div 
              className={`flex flex-col transition-all duration-150 ease-out ${
                isStage2
                  ? 'flex-[0] w-0 h-0 opacity-0 overflow-hidden' 
                  : transitionPhase >= 1
                    ? 'flex-[0] w-0 opacity-0 overflow-hidden'
                    : 'flex-[2] min-w-0 opacity-100'
              }`}
              style={{ transform: 'translateZ(0)' }}
            >
              <div className={`flex items-center gap-2 mb-3 transition-opacity duration-150 ${
                transitionPhase >= 1 || isStage2 ? 'opacity-0' : 'opacity-100'
              }`}>
                <DocumentTextIcon className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Source Article</h2>
              </div>
              <div>
                <ArticleViewer
                  article={articleData.content}
                  claims={currentStage >= 1 ? vagueClaims : []}
                  highlightedClaimIndex={highlightedClaimIndex}
                />
              </div>
            </div>

            {/* Claims Column - stays visible during phase 1 (slides left), fades during phase 2 */}
            <div 
              className={`flex flex-col transition-all ease-out ${
                isStage2 && transitionPhase === 0
                  ? 'flex-[0] w-0 h-0 opacity-0 overflow-hidden duration-100'
                  : transitionPhase === 2
                    ? 'flex-[0] w-0 opacity-0 overflow-hidden duration-100'
                    : transitionPhase === 1
                      ? 'flex-1 min-w-0 opacity-100 duration-150'
                      : currentStage === 0
                        ? 'flex-1 min-w-0 opacity-0 duration-500'
                        : 'flex-1 min-w-0 opacity-100 translate-x-0 duration-500'
              }`}
              style={{ transform: 'translateZ(0)' }}
            >
              <div className="flex items-center gap-2 mb-3 transition-all duration-500">
                <BeakerIcon className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white transition-all duration-300">
                  Identified Claims
                </h2>
              </div>
              <div>
                <ClaimsList
                  claims={vagueClaims}
                  onHoverClaim={setHighlightedClaimIndex}
                  highlightedIndex={highlightedClaimIndex}
                  compact={false}
                  muted={false}
                  targetHeights={[]}
                />
              </div>
            </div>

            {/* Stage 2: Grid with aligned extracted/arrow/enriched claims */}
            <div 
              className={`flex-1 transition-all duration-150 ease-out ${
                transitionPhase === 2 || (isStage2 && transitionPhase === 0)
                  ? 'opacity-100' 
                  : 'flex-[0] w-0 opacity-0 overflow-hidden'
              }`}
            >
              {(isStage2 || transitionPhase === 2) && (
                <>
                  {/* Headers */}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4 mb-3">
                    <div className={`flex items-center gap-2 transition-opacity duration-100 ${
                      transitionPhase === 2 ? 'opacity-100' : showEnrichedColumn ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <BeakerIcon className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-lg font-semibold text-white">Extracted</h2>
                    </div>
                    <div className="w-8" />
                    <div className={`flex items-center gap-2 transition-opacity duration-150 ${
                      showEnrichedColumn ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <SparklesIcon className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-lg font-semibold text-white">Enriched</h2>
                    </div>
                  </div>
                  {/* Grid content */}
                  <AlignedClaimsGrid
                    vagueClaims={vagueClaims}
                    enrichedClaims={enrichedClaims}
                    isVisible={showEnrichedColumn}
                    currentStage={currentStage}
                    transitionPhase={transitionPhase}
                  />
                </>
              )}
            </div>

          </div>

          {/* Stage 3: Explainable News */}
          <div 
            className={`w-full transition-all duration-300 ease-out ${
              currentStage === 3
                ? 'opacity-100' 
                : 'hidden'
            }`}
          >
            {currentStage === 3 && (
              <ExplainableNews />
            )}
          </div>

          {/* Stage 4: Grok Comparison */}
          <div 
            className={`w-full transition-all duration-300 ease-out ${
              currentStage === 4
                ? 'opacity-100' 
                : 'hidden'
            }`}
          >
            {currentStage === 4 && (
              <GrokComparison />
            )}
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
