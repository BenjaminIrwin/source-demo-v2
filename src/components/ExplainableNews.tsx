'use client';

import { useState, useMemo, useEffect } from 'react';
import { NewspaperIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import ClaimSidebar from './ClaimSidebar';

interface NewsSentence {
  id: string;
  text: string;
  claimIds: number[];
}

interface ExplainableNewsData {
  title: string;
  paragraph: string;
  sentences: NewsSentence[];
}

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

interface RecipeItem {
  id: string;
  text: string;
  frame?: string;
  verified?: boolean;
  children?: RecipeItem[];
}

interface RecipeSection {
  type: 'dated' | 'anyDate';
  items: RecipeItem[];
}

interface MainRecipe {
  sections: RecipeSection[];
}

interface RoleRecipe {
  wikidata?: string;
}

interface Recipes {
  mainRecipe?: MainRecipe;
  roleRecipes?: Record<string, RoleRecipe>;
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
  recipes?: Recipes;
}

// Single clickable sentence component
function ClickableSentence({ 
  sentence, 
  isHovered, 
  isSelected,
  onHover, 
  onClick 
}: { 
  sentence: NewsSentence;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}) {
  return (
    <span
      className={`
        cursor-pointer transition-all duration-200 
        ${isSelected 
          ? 'underline decoration-indigo-400 decoration-2 underline-offset-4 text-white' 
          : isHovered 
            ? 'underline decoration-indigo-400/60 decoration-2 underline-offset-4 text-slate-100' 
            : 'text-slate-300 hover:text-slate-100'
        }
      `}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
    >
      {sentence.text}
    </span>
  );
}

export default function ExplainableNews() {
  const [hoveredSentenceId, setHoveredSentenceId] = useState<string | null>(null);
  const [selectedSentenceId, setSelectedSentenceId] = useState<string | null>(null);
  const [newsData, setNewsData] = useState<ExplainableNewsData | null>(null);
  const [allClaims, setAllClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [newsRes, claimsRes] = await Promise.all([
          fetch('/api/data/explainable-news'),
          fetch('/api/data/claims')
        ]);
        
        const [news, claims] = await Promise.all([
          newsRes.json(),
          claimsRes.json()
        ]);
        
        setNewsData(news);
        setAllClaims(claims.claims || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Get claims for the selected sentence
  const selectedClaims = useMemo(() => {
    if (!selectedSentenceId || !newsData) return [];
    const sentence = newsData.sentences.find(s => s.id === selectedSentenceId);
    if (!sentence) return [];
    return sentence.claimIds
      .map(id => allClaims.find(c => c.id === id))
      .filter((c): c is Claim => c !== undefined);
  }, [selectedSentenceId, newsData, allClaims]);

  // Get the selected sentence text
  const selectedSentenceText = useMemo(() => {
    if (!selectedSentenceId || !newsData) return undefined;
    const sentence = newsData.sentences.find(s => s.id === selectedSentenceId);
    return sentence?.text;
  }, [selectedSentenceId, newsData]);

  const handleSentenceClick = (sentenceId: string) => {
    setSelectedSentenceId(sentenceId);
  };

  const handleCloseSidebar = () => {
    setSelectedSentenceId(null);
  };

  // Count total evidence across all claims
  const totalEvidence = useMemo(() => {
    return allClaims.reduce((acc, claim) => acc + (claim.evidence?.length || 0), 0);
  }, [allClaims]);

  if (isLoading || !newsData) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center py-12">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
          <NewspaperIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{newsData.title}</h2>
          <p className="text-sm text-slate-400">
            {newsData.sentences.length} sentences • {allClaims.length} verified claims • {totalEvidence} evidence sources
          </p>
        </div>
      </div>

      {/* Instruction hint */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-800/40 border border-slate-700/30 rounded-lg">
        <InformationCircleIcon className="w-4 h-4 text-slate-500 shrink-0" />
        <p className="text-slate-400 text-sm">
          Click on any sentence to view its supporting claims and evidence
        </p>
      </div>

      {/* News paragraph */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
        <p className="text-lg leading-relaxed">
          {newsData.sentences.map((sentence, index) => (
            <span key={sentence.id}>
              <ClickableSentence
                sentence={sentence}
                isHovered={hoveredSentenceId === sentence.id}
                isSelected={selectedSentenceId === sentence.id}
                onHover={(hovered) => setHoveredSentenceId(hovered ? sentence.id : null)}
                onClick={() => handleSentenceClick(sentence.id)}
              />
              {index < newsData.sentences.length - 1 && ' '}
            </span>
          ))}
        </p>
      </div>

      {/* Sidebar */}
      <ClaimSidebar
        claims={selectedClaims}
        isOpen={selectedSentenceId !== null}
        onClose={handleCloseSidebar}
        sentenceText={selectedSentenceText}
      />
    </div>
  );
}
