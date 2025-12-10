'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { CheckCircleIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export interface SemanticRole {
  word: string;
  role: string;
  isAction?: boolean; // true for the verb/action word - gets special styling
}

interface SemanticLabelingProps {
  sentence: string;
  roles: SemanticRole[];
}

// Tree node structure for recipes
interface TreeNode {
  text: string;
  children?: TreeNode[];
}

interface RecipeSection {
  title: string;
  items: TreeNode[];
}

// Helper function to get word stem (basic stemming for singular/plural matching)
function getStem(word: string): string {
  const lower = word.toLowerCase();
  // Remove common suffixes to get base form
  if (lower.endsWith('ies')) return lower.slice(0, -3) + 'y';
  if (lower.endsWith('es')) return lower.slice(0, -2);
  if (lower.endsWith('s') && lower.length > 3) return lower.slice(0, -1);
  return lower;
}

// Helper function to highlight role mentions in text with indigo underline
function highlightRoles(text: string, roleWords: string[]): React.ReactNode {
  if (roleWords.length === 0) return text;
  
  // Build a set of words to highlight:
  // 1. Full role phrases (e.g., "Hamas fighters")
  // 2. Individual words from each role phrase (e.g., "Hamas", "fighters")
  // 3. Word stems for singular/plural matching (e.g., "militant" from "militants")
  const wordsToHighlight = new Set<string>();
  const stemsToHighlight = new Set<string>();
  
  roleWords.forEach(phrase => {
    // Add the full phrase
    wordsToHighlight.add(phrase.toLowerCase());
    // Add individual words (filter out small common words)
    phrase.split(/\s+/).forEach(word => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (cleanWord.length > 2) { // Skip very short words like "a", "of", etc.
        wordsToHighlight.add(cleanWord.toLowerCase());
        stemsToHighlight.add(getStem(cleanWord));
      }
    });
  });
  
  // Create a regex pattern that matches any of the words or their stems (case-insensitive)
  // Sort by length descending to match longer phrases first
  const allPatternWords = new Set([...wordsToHighlight, ...stemsToHighlight]);
  const sortedWords = Array.from(allPatternWords).sort((a, b) => b.length - a.length);
  const patterns = sortedWords.map(word => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match word with optional surrounding quotes, as a whole word
    return `'${escaped}'|\\b${escaped}\\b`;
  });
  const regex = new RegExp(`(${patterns.join('|')})`, 'gi');
  
  const parts = text.split(regex);
  
  // Check if a word should be highlighted (exact match or stem match)
  const shouldHighlight = (word: string): boolean => {
    const lower = word.toLowerCase();
    const clean = lower.replace(/^'|'$/g, '');
    if (wordsToHighlight.has(lower) || wordsToHighlight.has(clean)) return true;
    // Check stem matching for singular/plural forms
    if (stemsToHighlight.has(getStem(clean))) return true;
    return false;
  };
  
  return parts.map((part, index) => {
    if (shouldHighlight(part)) {
      return (
        <span 
          key={index} 
          className="underline decoration-indigo-500 decoration-2 underline-offset-2"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

// Generate agent recipe data with dynamic agent word
function getAgentRecipeData(agentWord: string): RecipeSection[] {
  return [
    {
      title: `'${agentWord}' is a non-empty group of entities where each entity:`,
      items: [
        { text: "Is an animate being" },
        { 
          text: "Is a militant",
          children: [
            { 
              text: "Supports a political cause",
              children: [
                { text: "Communicates that they supported a political cause" }
              ]
            },
            { text: "Uses violence" }
          ]
        },
        { 
          text: "Is a member of Hamas",
          children: [
            { text: "inherited \"Hamas\" membership" },
            { text: "wore \"Hamas\" clothing or attire" },
            { text: "had official membership of \"Hamas\"" },
            { text: "communicated that they were members of \"Hamas\"" }
          ]
        }
      ]
    }
  ];
}

// Generate action + roles recipe data with dynamic agent word
function getActionRecipeData(agentWord: string): RecipeSection[] {
  return [
    {
      title: `On 7th October 2023 in Israel, '${agentWord}':`,
      items: [
        { 
          text: "performed some violent action(s) against Israel",
          children: [
            { text: "bombed Israel" },
            { text: "killed Israeli people" },
            { text: "killed workers in Israel" },
            { text: "caused harm to people" },
            { text: "destroyed buildings" },
            { text: "kidnapped Israelis" },
            { text: "breached Gaza-Israeli border" }
          ]
        }
      ]
    },
    {
      title: `On any date, '${agentWord}':`,
      items: [
        { 
          text: "communicated intent to cause harm to Israel on October 7th 2023",
          children: [
            { text: "said that they were going to harm Israel on October 7th 2023" },
            { text: "signalled that they were going to harm Israel on October 7th 2023" },
            { text: "messaged that they were going to harm Israel on October 7th 2023" },
            { text: "signed that they were going to harm Israel on October 7th 2023" }
          ]
        }
      ]
    }
  ];
}

// Tree node component with expand/collapse
function TreeNodeItem({ node, depth = 0, roleWords = [], showCheckboxes = true }: { node: TreeNode; depth?: number; roleWords?: string[]; showCheckboxes?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  
  // Generate a consistent random color based on the node text
  const isGreen = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < node.text.length; i++) {
      hash = ((hash << 5) - hash) + node.text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 2 === 0;
  }, [node.text]);
  
  return (
    <li className="list-none">
      <div 
        className={`relative flex items-start gap-1.5 py-1.5 ${hasChildren ? 'cursor-pointer hover:bg-slate-700/30 rounded' : ''}`}
        onClick={hasChildren ? () => setIsExpanded(!isExpanded) : undefined}
        style={{ paddingLeft: `${depth * 20}px` }}
      >
        {/* Chevron for expandable items - positioned in margin */}
        {hasChildren && (
          <button 
            className="absolute -left-5 shrink-0 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-300 mt-0.5 cursor-pointer"
            style={{ left: `${depth * 20 - 20}px` }}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        )}
        
        {/* Check circle icon - only shown when showCheckboxes is true */}
        {showCheckboxes && (
          <CheckCircleIcon className={`shrink-0 w-7 h-7 mt-0.5 ${isGreen ? 'text-emerald-500' : 'text-slate-500'}`} />
        )}
        
        <span className="text-white text-xl font-medium">
          <span className="text-slate-400">...</span>
          {highlightRoles(node.text.charAt(0).toLowerCase() + node.text.slice(1), roleWords)}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <ul className="mt-0">
          {node.children!.map((child, index) => (
            <TreeNodeItem key={index} node={child} depth={depth + 1} roleWords={roleWords} showCheckboxes={showCheckboxes} />
          ))}
        </ul>
      )}
    </li>
  );
}

// Recipe section component
function RecipeTree({ sections, roleWords = [], showCheckboxes = true }: { sections: RecipeSection[]; roleWords?: string[]; showCheckboxes?: boolean }) {
  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          <div className="text-white font-semibold text-xl mb-3">{highlightRoles(section.title, roleWords)}</div>
          <ul className="space-y-0">
            {section.items.map((item, itemIndex) => (
              <TreeNodeItem key={itemIndex} node={item} roleWords={roleWords} showCheckboxes={showCheckboxes} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// Calculate appropriate font size based on number of roles and total text length
function getFontSize(roles: SemanticRole[]): string {
  const totalChars = roles.reduce((sum, r) => sum + r.word.length, 0);
  const numRoles = roles.length;
  
  // More roles or longer text = smaller font
  if (numRoles >= 5 || totalChars > 60) {
    return 'text-lg md:text-2xl';
  } else if (numRoles >= 4 || totalChars > 45) {
    return 'text-xl md:text-3xl';
  } else {
    return 'text-2xl md:text-4xl';
  }
}

export default function SemanticLabeling({ sentence, roles }: SemanticLabelingProps) {
  const fontSize = getFontSize(roles);
  
  // Refs for measuring positions
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const agentRecipeRef = useRef<HTMLDivElement>(null);
  const restRecipeRef = useRef<HTMLDivElement>(null);
  
  // State for line positions
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; isAgent: boolean }[]>([]);
  
  // Find agent index and rest indices
  const agentIndex = roles.findIndex(r => r.role.toLowerCase() === 'agent');
  const restIndices = roles.map((_, i) => i).filter(i => i !== agentIndex);
  
  // Calculate line positions after render
  useEffect(() => {
    const calculateLines = () => {
      if (!containerRef.current || !agentRecipeRef.current || !restRecipeRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLines: { x1: number; y1: number; x2: number; y2: number; isAgent: boolean }[] = [];
      
      // Agent line
      if (agentIndex >= 0 && labelRefs.current[agentIndex]) {
        const labelRect = labelRefs.current[agentIndex]!.getBoundingClientRect();
        const recipeRect = agentRecipeRef.current.getBoundingClientRect();
        
        newLines.push({
          x1: labelRect.left + labelRect.width / 2 - containerRect.left,
          y1: labelRect.bottom - containerRect.top,
          x2: recipeRect.left + recipeRect.width / 2 - containerRect.left,
          y2: recipeRect.top - containerRect.top,
          isAgent: true,
        });
      }
      
      // Rest lines (action + other roles)
      restIndices.forEach(i => {
        if (labelRefs.current[i]) {
          const labelRect = labelRefs.current[i]!.getBoundingClientRect();
          const recipeRect = restRecipeRef.current!.getBoundingClientRect();
          
          newLines.push({
            x1: labelRect.left + labelRect.width / 2 - containerRect.left,
            y1: labelRect.bottom - containerRect.top,
            x2: recipeRect.left + recipeRect.width / 2 - containerRect.left,
            y2: recipeRect.top - containerRect.top,
            isAgent: false,
          });
        }
      });
      
      setLines(newLines);
    };
    
    calculateLines();
    window.addEventListener('resize', calculateLines);
    return () => window.removeEventListener('resize', calculateLines);
  }, [agentIndex, restIndices]);
  
  return (
    <div ref={containerRef} className="relative">
      {/* Claim Header */}
      <div className="text-center mb-16">
        <span className="text-indigo-400 text-sm font-medium tracking-wider uppercase mb-4 block">
          Recipe
        </span>
      </div>

      {/* Semantic Labeling UI */}
      <div className="flex items-stretch justify-center">
        {roles.map((item, index) => (
          <div key={index} className="flex flex-col items-center px-[15px]">
            {/* Word */}
            {item.isAction ? (
              <div className={`bg-indigo-500 text-white px-4 md:px-8 py-2 md:py-3 rounded-lg ${fontSize} font-bold whitespace-nowrap`}>
                {item.word}
              </div>
            ) : (
              <div className={`${fontSize} font-semibold text-white py-2 md:py-3 whitespace-nowrap`}>
                {item.word}
              </div>
            )}

            {/* Connector block */}
            {item.isAction ? (
              // Action column - vertical line + horizontal line + label
              <div className="relative flex flex-col items-center w-full">
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-0.5 h-[22px] bg-indigo-500"></div>
                <div className="w-full h-0.5 bg-indigo-500 mt-[22px]"></div>
                <div 
                  ref={el => { labelRefs.current[index] = el; }}
                  className="mt-[14px]"
                >
                  <span className="text-indigo-400 text-sm md:text-base font-medium tracking-wide uppercase">
                    {item.role}
                  </span>
                </div>
              </div>
            ) : (
              // Non-action column - thick oval line + label
              <div className="flex flex-col items-center w-full mt-5">
                <div className="w-full h-1.5 bg-indigo-500 rounded-full"></div>
                <div 
                  ref={el => { labelRefs.current[index] = el; }}
                  className="mt-3"
                >
                  <span className="text-indigo-400 text-sm md:text-base font-medium tracking-wide uppercase">
                    {item.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SVG for connecting lines */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {lines.map((line, i) => (
          <path
            key={i}
            d={`M ${line.x1} ${line.y1} C ${line.x1} ${line.y1 + 40}, ${line.x2} ${line.y2 - 40}, ${line.x2} ${line.y2}`}
            stroke={line.isAgent ? '#818cf8' : '#6366f1'}
            strokeWidth="2"
            fill="none"
            strokeDasharray="6 4"
            opacity="0.6"
          />
        ))}
      </svg>

      {/* Recipe Section */}
      <div className="mt-20 relative -mx-32" style={{ zIndex: 2 }}>
        <div className="grid grid-cols-3 gap-8">
          {/* Agent Recipe (Left - 1/3 width) */}
          <div 
            ref={agentRecipeRef}
            className="col-span-1 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8"
          >
            <RecipeTree sections={getAgentRecipeData(roles[agentIndex]?.word || 'Agent')} roleWords={roles.map(r => r.word)} showCheckboxes={false} />
          </div>

          {/* Rest Recipe (Right - 2/3 width) */}
          <div 
            ref={restRecipeRef}
            className="col-span-2 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8"
          >
            <RecipeTree sections={getActionRecipeData(roles[agentIndex]?.word || 'Agent')} roleWords={roles.map(r => r.word)} />
          </div>
        </div>
      </div>
    </div>
  );
}

