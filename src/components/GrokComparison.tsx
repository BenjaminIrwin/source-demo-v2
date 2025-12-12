'use client';

import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  PlayCircleIcon,
  LightBulbIcon,
  ScaleIcon,
} from '@heroicons/react/24/solid';

// Import comparison data
import comparisonData from '@/data/grok-comparison.json';

interface EvidenceItem {
  id: string;
  type?: string;
  title?: string;
  source?: string;
  note?: string;
  subclaim?: string;
  reasoning?: string;
}

interface Requirement {
  id: string;
  text: string;
  frame: string;
  verified: boolean | string;
  evidence?: EvidenceItem[];
}

interface TermAnalysis {
  term: string;
  verdict: string;
  verdictColor: string;
  explanation: string;
  recipe: {
    frame: string;
    requirements: Requirement[];
  };
  additionalNote?: string;
}

interface ComparisonData {
  debate: {
    question: string;
    context: string;
    originalTerm: string;
    proposedTerm: string;
    alternatives: string[];
  };
  grokResponse: {
    avatar: string;
    recommendation: string;
    confidence: string;
    reasoning: string;
    sources: string[];
  };
  ourResponse: {
    avatar: string;
    recommendation: string;
    confidence: string;
    summary: string;
    termAnalysis: TermAnalysis[];
    conclusion: string;
  };
  keyDifferences: {
    aspect: string;
    grok: string;
    ours: string;
  }[];
}

// Expandable requirement card
function RequirementCard({ requirement }: { requirement: Requirement }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isVerified = requirement.verified === true;
  const isPartial = requirement.verified === 'partial';

  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-3 p-3 hover:bg-slate-800/30 transition-colors text-left"
      >
        <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
          isVerified 
            ? 'bg-emerald-500/20 border border-emerald-500/50' 
            : isPartial
              ? 'bg-amber-500/20 border border-amber-500/50'
              : 'bg-slate-600/20 border border-slate-600/50'
        }`}>
          {isVerified ? (
            <CheckCircleIcon className="w-3 h-3 text-emerald-400" />
          ) : isPartial ? (
            <ExclamationTriangleIcon className="w-3 h-3 text-amber-400" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200">{requirement.text}</p>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            {requirement.frame}
          </span>
        </div>
        {requirement.evidence && requirement.evidence.length > 0 && (
          isExpanded 
            ? <ChevronDownIcon className="w-4 h-4 text-slate-500 shrink-0" />
            : <ChevronRightIcon className="w-4 h-4 text-slate-500 shrink-0" />
        )}
      </button>

      {/* Evidence (expandable) */}
      {isExpanded && requirement.evidence && requirement.evidence.length > 0 && (
        <div className="px-3 pb-3 pt-0 ml-8">
          <div className="space-y-2">
            {requirement.evidence.map((ev) => (
              <div key={ev.id} className="bg-slate-800/50 rounded-lg p-2.5 text-xs">
                {ev.title && (
                  <div className="flex items-start gap-2 mb-1">
                    <PlayCircleIcon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 font-medium">{ev.title}</span>
                  </div>
                )}
                {ev.source && (
                  <p className="text-slate-500 text-[10px] ml-5">{ev.source}</p>
                )}
                {ev.subclaim && (
                  <p className="text-slate-400 mt-1.5 italic">&ldquo;{ev.subclaim}&rdquo;</p>
                )}
                {ev.reasoning && (
                  <p className="text-indigo-300 mt-1.5 flex items-start gap-1.5">
                    <span className="text-indigo-400">→</span>
                    {ev.reasoning}
                  </p>
                )}
                {ev.note && (
                  <p className="text-slate-500 mt-1">{ev.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Term analysis card with expandable recipe
function TermAnalysisCard({ analysis }: { analysis: TermAnalysis }) {
  const [isExpanded, setIsExpanded] = useState(analysis.verdict === 'Supported');

  const verdictColors: Record<string, string> = {
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/60 transition-colors text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-semibold">&ldquo;{analysis.term}&rdquo;</h4>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${verdictColors[analysis.verdictColor] || verdictColors.yellow}`}>
              {analysis.verdict}
            </span>
          </div>
          <p className="text-slate-400 text-sm">{analysis.explanation}</p>
        </div>
        {isExpanded 
          ? <ChevronDownIcon className="w-5 h-5 text-slate-500 shrink-0" />
          : <ChevronRightIcon className="w-5 h-5 text-slate-500 shrink-0" />
        }
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-700/30">
          <div className="pt-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Semantic Recipe
              </span>
              <span className="text-[10px] bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-400">
                {analysis.recipe.frame}
              </span>
            </div>

            <div className="space-y-2">
              {analysis.recipe.requirements.map((req) => (
                <RequirementCard key={req.id} requirement={req} />
              ))}
            </div>

            {analysis.additionalNote && (
              <p className="mt-3 text-slate-500 text-xs italic bg-slate-800/30 px-3 py-2 rounded-lg">
                {analysis.additionalNote}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrokComparison() {
  const data = comparisonData as ComparisonData;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Debate Question Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-full mb-4">
          <ScaleIcon className="w-4 h-4 text-indigo-400" />
          <span className="text-slate-400 text-sm">Term Debate</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{data.debate.question}</h2>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">{data.debate.context}</p>
        
        {/* Terms being compared */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <span className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white font-medium">
            {data.debate.originalTerm}
          </span>
          <span className="text-slate-500">vs</span>
          <span className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white font-medium">
            {data.debate.proposedTerm}
          </span>
        </div>
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grok Response */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-800/60 px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Grok</h3>
              <p className="text-slate-500 text-xs">Traditional AI Response</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Recommendation */}
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm">Recommends:</span>
              <span className="px-3 py-1 bg-slate-700/60 border border-slate-600/50 rounded-lg text-white font-semibold">
                &ldquo;{data.grokResponse.recommendation}&rdquo;
              </span>
              <span className="text-xs bg-slate-600/40 px-2 py-0.5 rounded text-slate-400">
                {data.grokResponse.confidence}
              </span>
            </div>

            {/* Reasoning */}
            <div className="bg-slate-800/40 rounded-lg p-4">
              <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Reasoning
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {data.grokResponse.reasoning}
              </p>
            </div>

            {/* Sources */}
            <div>
              <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Sources
              </h4>
              <ul className="space-y-1">
                {data.grokResponse.sources.map((source, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-500 text-sm">
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    {source}
                  </li>
                ))}
              </ul>
            </div>

            {/* Critique notice */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mt-4">
              <p className="text-amber-400/80 text-xs">
                Note: Appeals to authority and consensus without verifiable evidence chains
              </p>
            </div>
          </div>
        </div>

        {/* Our Response */}
        <div className="bg-slate-900/60 border border-indigo-500/30 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-500/10 px-4 py-3 border-b border-indigo-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <LightBulbIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Our Method</h3>
              <p className="text-indigo-300/60 text-xs">Recipe-Based Semantic Analysis</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Recommendation */}
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm">Recommends:</span>
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 font-semibold">
                {data.ourResponse.recommendation}
              </span>
              <span className="text-xs bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">
                {data.ourResponse.confidence}
              </span>
            </div>

            {/* Summary */}
            <p className="text-slate-300 text-sm">
              {data.ourResponse.summary}
            </p>

            {/* Term Analysis Cards */}
            <div className="space-y-3">
              <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Term Analysis
              </h4>
              {data.ourResponse.termAnalysis.map((analysis) => (
                <TermAnalysisCard key={analysis.term} analysis={analysis} />
              ))}
            </div>

            {/* Conclusion */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3">
              <h4 className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Conclusion
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {data.ourResponse.conclusion}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Differences Table */}
      <div className="mt-8">
        <h3 className="text-white font-semibold mb-4 text-center">Key Differences</h3>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 gap-px bg-slate-700/50">
            <div className="bg-slate-800/80 px-4 py-3">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Aspect</span>
            </div>
            <div className="bg-slate-800/80 px-4 py-3">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Grok</span>
            </div>
            <div className="bg-slate-800/80 px-4 py-3">
              <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wider">Our Method</span>
            </div>
          </div>
          {data.keyDifferences.map((diff, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-px bg-slate-700/30">
              <div className="bg-slate-900/60 px-4 py-3">
                <span className="text-white text-sm font-medium">{diff.aspect}</span>
              </div>
              <div className="bg-slate-900/60 px-4 py-3">
                <span className="text-slate-400 text-sm">{diff.grok}</span>
              </div>
              <div className="bg-slate-900/60 px-4 py-3">
                <span className="text-indigo-300 text-sm">{diff.ours}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

