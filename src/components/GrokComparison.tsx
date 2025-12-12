'use client';

import { useState, useEffect, Fragment } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';

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

// Requirement row
function RequirementRow({ requirement }: { requirement: Requirement }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isVerified = requirement.verified === true;
  const isPartial = requirement.verified === 'partial';
  const hasEvidence = requirement.evidence && requirement.evidence.length > 0;

  return (
    <div className="border-b border-slate-700/30 last:border-b-0">
      <button
        onClick={() => hasEvidence && setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-3 py-2 text-left ${hasEvidence ? 'cursor-pointer hover:bg-slate-800/20' : 'cursor-default'}`}
      >
        <div className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${
          isVerified 
            ? 'bg-emerald-500/20' 
            : isPartial
              ? 'bg-amber-500/20'
              : 'bg-slate-600/20'
        }`}>
          {isVerified ? (
            <CheckCircleIcon className="w-3 h-3 text-emerald-400" />
          ) : isPartial ? (
            <ExclamationTriangleIcon className="w-3 h-3 text-amber-400" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          )}
        </div>
        <span className="flex-1 text-sm text-slate-300">{requirement.text}</span>
        {hasEvidence && (
          isExpanded 
            ? <ChevronDownIcon className="w-4 h-4 text-slate-500 shrink-0" />
            : <ChevronRightIcon className="w-4 h-4 text-slate-500 shrink-0" />
        )}
      </button>

      {isExpanded && requirement.evidence && (
        <div className="pl-7 pb-2 space-y-1.5">
          {requirement.evidence.map((ev) => (
            <div key={ev.id} className="text-xs text-slate-400 bg-slate-800/30 rounded px-2 py-1.5">
              {ev.title && <p className="text-slate-300">{ev.title}</p>}
              {ev.subclaim && <p className="italic mt-1">&ldquo;{ev.subclaim}&rdquo;</p>}
              {ev.reasoning && <p className="text-indigo-300 mt-1">→ {ev.reasoning}</p>}
              {ev.note && <p className="text-slate-500">{ev.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Term analysis card
function TermAnalysisCard({ analysis }: { analysis: TermAnalysis }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const verdictStyles: Record<string, string> = {
    green: 'text-emerald-400',
    yellow: 'text-amber-400',
    red: 'text-red-400',
  };

  return (
    <div className="border-b border-slate-700/50 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 py-3 hover:bg-slate-800/20 transition-colors text-left cursor-pointer"
      >
        <span className="text-white font-medium">&ldquo;{analysis.term}&rdquo;</span>
        <span className={`text-xs ${verdictStyles[analysis.verdictColor] || verdictStyles.yellow}`}>
          {analysis.verdict}
        </span>
        <span className="flex-1" />
        {isExpanded 
          ? <ChevronDownIcon className="w-4 h-4 text-slate-500" />
          : <ChevronRightIcon className="w-4 h-4 text-slate-500" />
        }
      </button>

      {isExpanded && (
        <div className="pb-3">
          <p className="text-slate-400 text-sm mb-3">{analysis.explanation}</p>
          
          <div className="bg-slate-800/30 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
              {analysis.recipe.frame}
            </p>
            {analysis.recipe.requirements.map((req) => (
              <RequirementRow key={req.id} requirement={req} />
            ))}
          </div>

          {analysis.additionalNote && (
            <p className="mt-2 text-slate-500 text-xs italic">
              {analysis.additionalNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function GrokComparison() {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data/grok-comparison');
        const comparisonData = await res.json();
        setData(comparisonData);
      } catch (error) {
        console.error('Error fetching comparison data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center py-12">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-lg font-medium text-white mb-2">{data.debate.question}</h2>
        <p className="text-slate-500 text-sm mb-4">{data.debate.context}</p>
        <div className="flex items-center justify-center gap-3 text-sm">
          <code className="px-2 py-1 bg-slate-800 rounded text-slate-300">{data.debate.originalTerm}</code>
          <span className="text-slate-600">→</span>
          <code className="px-2 py-1 bg-slate-800 rounded text-slate-300">{data.debate.proposedTerm}</code>
        </div>
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Grok Response */}
        <div className="bg-slate-900/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">G</span>
            <span className="text-white font-medium">Grok</span>
            <span className="text-slate-600 text-xs">Traditional AI</span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Recommends</p>
              <p className="text-white">&ldquo;{data.grokResponse.recommendation}&rdquo;</p>
            </div>

            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Reasoning</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                {data.grokResponse.reasoning}
              </p>
            </div>

            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Sources</p>
              <ul className="text-slate-400 text-sm space-y-0.5">
                {data.grokResponse.sources.map((source, idx) => (
                  <li key={idx}>• {source}</li>
                ))}
              </ul>
            </div>

            <p className="text-amber-400/70 text-xs pt-2 border-t border-slate-700/50">
              Note: Appeals to authority and consensus without verifiable evidence chains
            </p>
          </div>
        </div>

        {/* Our Response */}
        <div className="bg-slate-900/50 rounded-xl p-5 ring-1 ring-indigo-500/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">S</span>
            <span className="text-white font-medium">Our Method</span>
            <span className="text-indigo-400/60 text-xs">Semantic Analysis</span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Recommends</p>
              <p className="text-indigo-300">{data.ourResponse.recommendation}</p>
            </div>

            {data.ourResponse.summary && (
              <p className="text-slate-300 text-sm">{data.ourResponse.summary}</p>
            )}

            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Term Analysis</p>
              {data.ourResponse.termAnalysis.map((analysis) => (
                <TermAnalysisCard key={analysis.term} analysis={analysis} />
              ))}
            </div>

            <div className="pt-2 border-t border-slate-700/50">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Conclusion</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                {data.ourResponse.conclusion}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Differences */}
      <div className="flex justify-center">
        <div>
          <h3 className="text-slate-400 text-xs uppercase tracking-wider text-center mb-4">Key Differences</h3>
          <div className="grid grid-cols-[auto_auto_auto] gap-x-4 gap-y-2 text-sm">
            <div className="text-slate-500 font-medium">Aspect</div>
            <div className="text-slate-500 font-medium">Grok</div>
            <div className="text-indigo-400/80 font-medium">Our Method</div>
            {data.keyDifferences.map((diff, idx) => (
              <Fragment key={idx}>
                <div className="text-slate-300">{diff.aspect}</div>
                <div className="text-slate-500">{diff.grok}</div>
                <div className="text-indigo-300/80">{diff.ours}</div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
