'use client';

import React, { useEffect, useRef } from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  MapPinIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  NewspaperIcon,
  ArchiveBoxIcon,
  LightBulbIcon,
  PhotoIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightCircleIcon,
  CheckCircleIcon,
  TagIcon,
} from '@heroicons/react/24/solid';

// Types matching the claim structure
interface SemanticRole {
  word: string;
  role: string;
  isAction?: boolean;
}

interface EvidenceSubclaim {
  id: string;
  text: string;
  frame?: string;
}

interface EvidenceReasoning {
  recipeItemId: string;
  recipeText: string;
  points: string[];
}

interface Evidence {
  id: string;
  type: string;
  title?: string;
  description?: string;
  url?: string;
  source?: string;
  supports: string[];
  sourceType?: 'primary' | 'secondary';
  evidenceCategory?: 'direct' | 'circumstantial';
  subclaims?: EvidenceSubclaim[];
  reasoning?: EvidenceReasoning[];
}

interface Claim {
  id: number;
  sentence: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  stative?: boolean;
  frame?: string;
  roles: SemanticRole[];
  evidence?: Evidence[];
}

// Role color mapping
const roleColors: Record<string, { bg: string; text: string }> = {
  Agent: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  Action: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  Patient: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  Instrument: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  Location: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  Time: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  Content: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  Theme: { bg: 'bg-violet-500/20', text: 'text-violet-400' },
  Init_location: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  Path: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  Final_location: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  Scope: { bg: 'bg-teal-500/20', text: 'text-teal-400' },
  Co_agent: { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  Beneficiary: { bg: 'bg-lime-500/20', text: 'text-lime-400' },
};

// Evidence type icons
const evidenceIcons: Record<string, typeof PlayCircleIcon> = {
  video: PlayCircleIcon,
  article: NewspaperIcon,
  document: DocumentTextIcon,
  multimedia: PhotoIcon,
  archive: ArchiveBoxIcon,
  reasoning: LightBulbIcon,
};

// Format date for display
function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// Format time if meaningful
function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  // Skip midnight or end of day
  if ((hours === 0 && minutes === 0) || (hours === 23 && minutes === 59)) return '';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Get role colors with fallback
function getRoleColors(role: string): { bg: string; text: string } {
  const baseRole = role.split('.')[0];
  const normalizedRole = baseRole.charAt(0).toUpperCase() + baseRole.slice(1).toLowerCase();
  return roleColors[normalizedRole] || { bg: 'bg-slate-500/20', text: 'text-slate-400' };
}

// Render sentence with role highlighting
function HighlightedSentence({ sentence, roles }: { sentence: string; roles: SemanticRole[] }) {
  const sortedRoles = [...roles].sort((a, b) => b.word.length - a.word.length);
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
          const colors = getRoleColors(role.role);
          newResult.push(
            <span
              key={`${roleIndex}-${partIndex}-${splitIndex}`}
              className={`px-1 py-0.5 rounded ${colors.bg} ${colors.text} ${role.isAction ? 'font-semibold' : ''}`}
            >
              {split}
            </span>
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

// Single evidence card (condensed version)
function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const Icon = evidenceIcons[evidence.type] || DocumentTextIcon;

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white text-sm font-medium leading-tight line-clamp-2">
              {evidence.title || evidence.description || 'Evidence'}
            </h4>
            {evidence.source && (
              <p className="text-slate-500 text-xs mt-0.5">{evidence.source}</p>
            )}
          </div>
          {/* Badges */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {evidence.sourceType && (
              <span className={`
                px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide
                ${evidence.sourceType === 'primary' 
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                  : 'bg-slate-600/30 text-slate-400 border border-slate-500/30'
                }
              `}>
                {evidence.sourceType}
              </span>
            )}
            {evidence.evidenceCategory && (
              <span className={`
                px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide
                ${evidence.evidenceCategory === 'direct' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }
              `}>
                {evidence.evidenceCategory}
              </span>
            )}
          </div>
        </div>

        {/* External link */}
        {evidence.url && (
          <a
            href={evidence.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs mt-2 transition-colors"
          >
            <span className="truncate max-w-[180px]">{new URL(evidence.url).hostname}</span>
            <ArrowTopRightOnSquareIcon className="w-3 h-3 shrink-0" />
          </a>
        )}
      </div>

      {/* Subclaims (condensed) */}
      {evidence.subclaims && evidence.subclaims.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-700/30 bg-slate-900/30">
          <h5 className="text-slate-500 text-[9px] font-semibold uppercase tracking-wider mb-1.5">
            Subclaims
          </h5>
          <ul className="space-y-1">
            {evidence.subclaims.slice(0, 3).map((subclaim) => (
              <li key={subclaim.id} className="flex items-start gap-1.5 text-xs">
                <span className="text-slate-600 mt-0.5">•</span>
                <span className="text-slate-400 line-clamp-2">{subclaim.text}</span>
              </li>
            ))}
            {evidence.subclaims.length > 3 && (
              <li className="text-slate-500 text-xs pl-3">
                +{evidence.subclaims.length - 3} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Reasoning (condensed - show first reasoning only) */}
      {evidence.reasoning && evidence.reasoning.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-700/30 bg-slate-900/50">
          <h5 className="text-slate-500 text-[9px] font-semibold uppercase tracking-wider mb-1.5">
            Reasoning
          </h5>
          <div className="flex items-start gap-1.5">
            <ArrowRightCircleIcon className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
            <span className="text-indigo-300 text-xs italic line-clamp-2">
              &ldquo;{evidence.reasoning[0].recipeText}&rdquo;
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface ClaimSidebarProps {
  claims: Claim[];
  isOpen: boolean;
  onClose: () => void;
  sentenceText?: string;
}

export default function ClaimSidebar({ claims, isOpen, onClose, sentenceText }: ClaimSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node) && isOpen) {
        onClose();
      }
    };
    // Add slight delay to prevent immediate close on the same click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed right-0 top-0 h-full w-[420px] max-w-[90vw] bg-slate-900/95 border-l border-slate-700/50 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-indigo-400" />
            Claim Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-56px)] p-4 space-y-4">
          {/* Source sentence context */}
          {sentenceText && (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                From the article
              </p>
              <p className="text-slate-300 text-sm italic leading-relaxed">
                &ldquo;{sentenceText}&rdquo;
              </p>
            </div>
          )}

          {/* Claims */}
          {claims.map((claim, index) => (
            <div key={claim.id} className="space-y-3">
              {claims.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Claim {index + 1} of {claims.length}
                  </span>
                  <div className="flex-1 h-px bg-slate-700/50" />
                </div>
              )}

              {/* Claim sentence with role highlighting */}
              <div className="bg-slate-800/60 border border-indigo-500/30 rounded-lg p-3">
                <p className="text-white text-sm leading-relaxed">
                  <HighlightedSentence sentence={claim.sentence} roles={claim.roles} />
                </p>
              </div>

              {/* Metadata badges */}
              <div className="flex flex-wrap items-center gap-2">
                {(claim.startDate || claim.endDate) && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {formatDate(claim.startDate || claim.endDate)}
                    {formatTime(claim.startDate) && ` at ${formatTime(claim.startDate)}`}
                  </span>
                )}
                {claim.location && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    <MapPinIcon className="w-3.5 h-3.5" />
                    {claim.location}
                  </span>
                )}
                {claim.frame && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                    <TagIcon className="w-3.5 h-3.5" />
                    {claim.frame}
                  </span>
                )}
              </div>

              {/* Role legend */}
              <div className="flex flex-wrap gap-1.5">
                {claim.roles.map((role, roleIndex) => {
                  const colors = getRoleColors(role.role);
                  return (
                    <span
                      key={roleIndex}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} uppercase tracking-wider font-medium`}
                    >
                      {role.role.split('.')[0]}
                    </span>
                  );
                })}
              </div>

              {/* Evidence section */}
              {claim.evidence && claim.evidence.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                    <span>Evidence</span>
                    <span className="text-slate-600">({claim.evidence.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {claim.evidence.slice(0, 3).map((evidence) => (
                      <EvidenceCard key={evidence.id} evidence={evidence} />
                    ))}
                    {claim.evidence.length > 3 && (
                      <p className="text-slate-500 text-xs text-center py-2">
                        +{claim.evidence.length - 3} more evidence items
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Divider between claims */}
              {index < claims.length - 1 && (
                <div className="pt-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

