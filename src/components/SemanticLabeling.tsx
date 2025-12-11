'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { CheckCircleIcon, ChevronDownIcon, ChevronRightIcon, ArrowRightCircleIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';
import 'mapbox-gl/dist/mapbox-gl.css';
import wikidataCache from '@/data/wikidata-cache.json';

// Dynamically import Map components to avoid SSR issues with Mapbox GL
const MapboxMap = dynamic(
  () => import('react-map-gl/mapbox').then((mod) => mod.default),
  { ssr: false }
);
const MapboxMarker = dynamic(
  () => import('react-map-gl/mapbox').then((mod) => mod.Marker),
  { ssr: false }
);

// Location map component that handles marker rendering after map loads
function LocationMap({ lat, lng }: { lat: number; lng: number }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  
  return (
    <MapboxMap
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: lng,
        latitude: lat,
        zoom: 6
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      interactive={false}
      attributionControl={false}
      onLoad={() => setMapLoaded(true)}
    >
      {mapLoaded && (
        <MapboxMarker longitude={lng} latitude={lat}>
          <div className="w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow-lg" />
        </MapboxMarker>
      )}
    </MapboxMap>
  );
}

// Wikidata entity type from cache
interface WikidataEntity {
  id: string;
  label: string | null;
  description: string | null;
  image: string | null;
  instanceOf: string[];
  birthDate: string | null;
  deathDate: string | null;
  occupation: string[];
  country: string | null;
}

// Helper to get wikidata entity from cache
function getWikidataEntity(qid: string): WikidataEntity | null {
  return (wikidataCache.entities as Record<string, WikidataEntity>)[qid] || null;
}

// Format Wikidata date (e.g., "+1949-10-21T00:00:00Z" -> "21 October 1949")
function formatWikidataDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  // Parse the date string, removing the leading + if present
  const cleaned = dateStr.replace(/^\+/, '');
  const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  
  const [, year, month, day] = match;
  if (month === '00' || day === '00') {
    // Partial date, just return year
    return year;
  }
  
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Strip leading prepositions from role words for cleaner display
function stripPrepositions(word: string): string {
  const prepositions = [
    'from', 'to', 'over', 'under', 'above', 'below', 'into', 'onto', 
    'through', 'across', 'along', 'around', 'behind', 'beside', 'between',
    'beyond', 'by', 'for', 'in', 'near', 'of', 'off', 'on', 'out', 
    'past', 'since', 'toward', 'towards', 'upon', 'with', 'within', 'without'
  ];
  
  // Match preposition at start followed by space
  const pattern = new RegExp(`^(${prepositions.join('|')})\\s+`, 'i');
  return word.replace(pattern, '');
}

export interface SemanticRole {
  word: string;
  role: string;
  isAction?: boolean; // true for the verb/action word - gets special styling
}

// Tree node structure for recipes
export interface TreeNode {
  id: string;
  text: string;
  children?: TreeNode[];
  verified?: boolean;
}

// Relationship between items in a recipe
export interface RecipeRelationship {
  from: string;  // id of source item
  to: string;    // id of target item
  type: 'causes' | 'before' | 'after';
}

export interface ClaimRecipes {
  mainRecipe: {
    sections: {
      type: 'dated' | 'anyDate';
      items: TreeNode[];
    }[];
    relationships?: RecipeRelationship[];
  };
  roleRecipes?: {
    [roleName: string]: RoleRecipe | RoleRecipe[];
  };
}

export interface RoleRecipe {
  name?: string;
  items?: TreeNode[];
  relationships?: RecipeRelationship[];
  isGroup?: boolean;
  aggregateCount?: number;  // For groups with a specific count (e.g., "Ten civilians" = 10)
  location?: {
    lat: number;
    lng: number;
  };
  wikidata?: string;
}

interface SemanticLabelingProps {
  sentence: string;
  roles: SemanticRole[];
  recipes: ClaimRecipes;
  startDate: string;
  endDate: string;
  location: string;
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

// Helper function to check if a date string is valid
function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Helper function to check if a date has time granularity (not midnight)
function hasTimeGranularity(dateString: string): boolean {
  if (!isValidDate(dateString)) return false;
  const date = new Date(dateString);
  return date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
}

// Helper function to format date string nicely
function formatDate(dateString: string, includeTime: boolean = false): string {
  if (!isValidDate(dateString)) return 'Unknown date';
  const date = new Date(dateString);
  if (includeTime) {
    return date.toLocaleString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

// Helper function to format date range with appropriate prefix
function formatDateRangeWithPrefix(startDate: string, endDate: string): string {
  const startValid = isValidDate(startDate);
  const endValid = isValidDate(endDate);
  
  // If both dates are invalid, return unknown
  if (!startValid && !endValid) {
    return 'On an unknown date';
  }
  
  // Check if either date has time granularity (minute or second precision)
  const showTime = hasTimeGranularity(startDate) || hasTimeGranularity(endDate);
  
  if (startDate === endDate) {
    return `On ${formatDate(startDate, showTime)}`;
  }
  return `Between ${formatDate(startDate, showTime)} and ${formatDate(endDate, showTime)}`;
}

// Role recipe data return type
interface RoleRecipeResult {
  sections: RecipeSection[];
  location?: { lat: number; lng: number };
  wikidataEntries: { wikidata: string; name?: string }[];
}

// Generate section for a single role recipe
function getSectionForRoleRecipe(roleWord: string, recipe: RoleRecipe): RecipeSection | null {
  // Skip if no items (location/wikidata types don't have sections)
  if (!recipe.items) return null;
  
  // Handle group vs other items
  let title: string;
  const displayName = recipe.name || roleWord;
  
  if (recipe.isGroup) {
    if (recipe.aggregateCount !== undefined) {
      // Use the specific count for aggregated groups
      title = `'${displayName}' is ${recipe.aggregateCount} entities where each entity:`;
    } else {
      // Generic group without specific count
      title = `'${displayName}' is a group of entities where each entity:`;
    }
  } else {
    title = `'${displayName}':`;
  }
  
  return {
    title,
    items: recipe.items as TreeNode[]
  };
}

// Generate role recipe data with dynamic role word
function getRoleRecipeData(roleWord: string, roleName: string, recipes: ClaimRecipes): RoleRecipeResult {
  const roleRecipeData = recipes.roleRecipes?.[roleName];
  if (!roleRecipeData) return { sections: [], wikidataEntries: [] };
  
  // Normalize to array
  const roleRecipes = Array.isArray(roleRecipeData) ? roleRecipeData : [roleRecipeData];
  
  // Check if any recipe has location (return first one found)
  const locationRecipe = roleRecipes.find(r => r.location);
  if (locationRecipe?.location) {
    return {
      sections: [],
      location: locationRecipe.location,
      wikidataEntries: []
    };
  }
  
  // Collect all wikidata entries
  const wikidataEntries = roleRecipes
    .filter(r => r.wikidata)
    .map(r => ({ wikidata: r.wikidata!, name: r.name }));
  
  // Generate sections for all recipes that have items
  const sections: RecipeSection[] = roleRecipes
    .map(recipe => getSectionForRoleRecipe(roleWord, recipe))
    .filter((section): section is RecipeSection => section !== null);
  
  return {
    sections,
    wikidataEntries
  };
}

// Generate main recipe data with dynamic agent word
function getMainRecipeData(
  agentWord: string, 
  recipes: ClaimRecipes,
  startDate: string,
  endDate: string,
  location: string
): RecipeSection[] {
  const { mainRecipe } = recipes;
  if (!mainRecipe) return [];
  const displayLocation = location?.trim() || 'an unknown location';
  return mainRecipe.sections.map(section => {
    let title: string;
    if (section.type === 'dated') {
      const dateStr = formatDateRangeWithPrefix(startDate, endDate);
      title = `${dateStr} in ${displayLocation}, '${agentWord}':`;
    } else {
      title = `On any date, '${agentWord}':`;
    }
    return {
      title,
      items: section.items as TreeNode[]
    };
  });
}

// Tree node component with expand/collapse
function TreeNodeItem({ 
  node, 
  depth = 0, 
  roleWords = [], 
  showCheckboxes = true,
  relationshipMap = new Map(),
  isInCausedSubtree = false
}: { 
  node: TreeNode; 
  depth?: number; 
  roleWords?: string[]; 
  showCheckboxes?: boolean;
  relationshipMap?: Map<string, RecipeRelationship['type']>;
  isInCausedSubtree?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  
  // Check if this node is a consequence (target of a 'causes' relationship)
  const isCaused = relationshipMap.get(node.id) === 'causes';
  
  // Use verified field to determine icon color (defaults to false/grey if not specified)
  const isVerified = node.verified === true;
  const iconColor = isVerified ? 'text-emerald-500' : 'text-slate-500';
  
  // Hide ellipsis for caused items and their children
  const hideEllipsis = isCaused || isInCausedSubtree;
  
  // Add extra indent for consequences (caused items and their children)
  const consequenceIndent = (isCaused || isInCausedSubtree) ? 24 : 0;
  
  return (
    <li className="list-none">
      <div 
        className={`relative flex items-start gap-1.5 py-1.5 ${hasChildren ? 'cursor-pointer hover:bg-slate-700/30 rounded' : ''}`}
        onClick={hasChildren ? () => setIsExpanded(!isExpanded) : undefined}
        style={{ paddingLeft: `${depth * 20 + consequenceIndent}px` }}
      >
        {/* Chevron for expandable items - positioned in margin */}
        {hasChildren && (
          <button
            className="absolute -left-5 shrink-0 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-300 mt-0.5 cursor-pointer"
            style={{ left: `${depth * 20 + consequenceIndent - 20}px` }}
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
        
        {/* Icon - ArrowRightCircle for caused items, CheckCircle for regular items */}
        {showCheckboxes && (
          isCaused ? (
            <ArrowRightCircleIcon className={`shrink-0 w-7 h-7 mt-0.5 ${iconColor}`} />
          ) : (
            <CheckCircleIcon className={`shrink-0 w-7 h-7 mt-0.5 ${iconColor}`} />
          )
        )}
        
        <span className="text-white text-xl font-medium">
          {!hideEllipsis && <span className="text-slate-400">...</span>}
          {highlightRoles(hideEllipsis ? node.text : node.text.charAt(0).toLowerCase() + node.text.slice(1), roleWords)}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <ul className="mt-0">
          {node.children!.map((child, index) => (
            <TreeNodeItem 
              key={index} 
              node={child} 
              depth={depth + 1} 
              roleWords={roleWords} 
              showCheckboxes={showCheckboxes}
              relationshipMap={relationshipMap}
              isInCausedSubtree={isCaused || isInCausedSubtree}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// Recipe section component
function RecipeTree({ 
  sections, 
  roleWords = [], 
  showCheckboxes = true,
  relationships = []
}: { 
  sections: RecipeSection[]; 
  roleWords?: string[]; 
  showCheckboxes?: boolean;
  relationships?: RecipeRelationship[];
}) {
  // Build a map of node ID -> incoming relationship type
  const relationshipMap = useMemo(() => {
    const map = new Map<string, RecipeRelationship['type']>();
    relationships.forEach(rel => {
      // The 'to' node is the target - store the relationship type
      map.set(rel.to, rel.type);
    });
    return map;
  }, [relationships]);

  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          <div className="text-white font-semibold text-xl mb-3">{highlightRoles(section.title, roleWords)}</div>
          <ul className="space-y-0">
            {section.items.map((item, itemIndex) => (
              <TreeNodeItem 
                key={itemIndex} 
                node={item} 
                roleWords={roleWords} 
                showCheckboxes={showCheckboxes}
                relationshipMap={relationshipMap}
              />
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

export default function SemanticLabeling({ sentence, roles, recipes, startDate, endDate, location }: SemanticLabelingProps) {
  const fontSize = getFontSize(roles);
  
  // Refs for measuring positions
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const roleRecipeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mainRecipeRef = useRef<HTMLDivElement>(null);
  
  // State for line positions
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; roleIndex: number }[]>([]);
  
  // Find agent index (for main recipe title)
  const agentIndex = useMemo(() => roles.findIndex(r => r.role.toLowerCase() === 'agent'), [roles]);
  
  // Get all roles that have recipes (excluding actions which don't have role recipes)
  const rolesWithRecipes = useMemo(() => {
    return roles
      .map((role, index) => ({ role, index }))
      .filter(({ role }) => {
        // Actions don't have role recipes
        if (role.isAction) return false;
        // Check if there's a recipe for this role
        const roleName = role.role.charAt(0).toUpperCase() + role.role.slice(1).toLowerCase();
        return Boolean(recipes.roleRecipes?.[roleName]);
      });
  }, [roles, recipes]);
  
  // Calculate line positions after render
  useEffect(() => {
    const calculateLines = () => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLines: { x1: number; y1: number; x2: number; y2: number; roleIndex: number }[] = [];
      
      // Draw lines from each role label to its corresponding recipe box
      rolesWithRecipes.forEach(({ index }, recipeBoxIndex) => {
        const labelEl = labelRefs.current[index];
        const recipeEl = roleRecipeRefs.current[recipeBoxIndex];
        
        if (labelEl && recipeEl) {
          const labelRect = labelEl.getBoundingClientRect();
          const recipeRect = recipeEl.getBoundingClientRect();
          
          newLines.push({
            x1: labelRect.left + labelRect.width / 2 - containerRect.left,
            y1: labelRect.bottom - containerRect.top,
            x2: recipeRect.left + recipeRect.width / 2 - containerRect.left,
            y2: recipeRect.top - containerRect.top,
            roleIndex: index,
          });
        }
      });
      
      setLines(newLines);
    };
    
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(calculateLines);
    window.addEventListener('resize', calculateLines);
    return () => window.removeEventListener('resize', calculateLines);
  }, [rolesWithRecipes]);
  
  return (
    <div ref={containerRef} className="relative">

      {/* Location and time indicators */}
      {(location || startDate) && (
        <div className="flex items-center justify-center gap-2 mb-3">
          {location && (
            <span className="inline-flex items-center gap-1 text-slate-400 text-sm">
              <MapPinIcon className="w-3.5 h-3.5" />
              {location}
            </span>
          )}
          {location && startDate && (
            <span className="text-slate-600">|</span>
          )}
          {startDate && (
            <span className="inline-flex items-center gap-1 text-slate-400 text-sm">
              <ClockIcon className="w-3.5 h-3.5" />
              {(() => {
                const showTime = hasTimeGranularity(startDate) || hasTimeGranularity(endDate);
                if (startDate === endDate || !endDate) {
                  return formatDate(startDate, showTime);
                }
                return `${formatDate(startDate, showTime)} – ${formatDate(endDate, showTime)}`;
              })()}
            </span>
          )}
        </div>
      )}

      {/* Semantic Labeling UI */}
      <div className="flex items-stretch justify-center max-w-full overflow-x-auto">
        {roles.map((item, index) => (
          <div key={index} className="flex flex-col-reverse items-center px-[15px]">
            {/* Connector block - first in DOM, renders at bottom due to flex-col-reverse */}
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

            {/* Word container - second in DOM, renders at top due to flex-col-reverse, grows upward */}
            <div className="flex-1 flex items-end justify-center">
              {item.isAction ? (
                <div className={`bg-indigo-500 text-white px-4 md:px-8 py-2 md:py-3 rounded-lg ${fontSize} font-bold whitespace-nowrap`}>
                  {item.word}
                </div>
              ) : (
                <div 
                  className={`${fontSize} font-semibold text-white py-2 md:py-3 max-w-[900px] text-center line-clamp-3`}
                  title={item.word}
                >
                  {item.word}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* SVG for connecting lines */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {lines.map((line, i) => (
          <path
            key={i}
            d={`M ${line.x1} ${line.y1} C ${line.x1} ${line.y1 + 40}, ${line.x2} ${line.y2 - 40}, ${line.x2} ${line.y2}`}
            stroke="#6366f1"
            strokeWidth="2"
            fill="none"
            strokeDasharray="6 4"
            opacity="0.6"
          />
        ))}
      </svg>

      {/* Recipe Section */}
      <div className="mt-20 relative -mx-32" style={{ zIndex: 2 }}>
        {/* Role Recipes Row - each role gets its own box */}
        {rolesWithRecipes.length > 0 && (
          <div className="relative flex gap-4 mb-6">
            {/* Left margin label - positioned in actual margin */}
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2">
              <span className="text-slate-400 text-sm font-medium uppercase tracking-wider whitespace-nowrap">Definitions:</span>
            </div>
            {rolesWithRecipes.map(({ role, index }, boxIndex) => {
              const roleName = role.role.charAt(0).toUpperCase() + role.role.slice(1).toLowerCase();
              const strippedWord = stripPrepositions(role.word);
              const roleData = getRoleRecipeData(strippedWord, roleName, recipes);
              
              return (
                <div
                  key={index}
                  ref={el => { roleRecipeRefs.current[boxIndex] = el; }}
                  className="flex-1 min-w-0 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
                >
                  {roleData.location ? (
                    <div className="flex flex-col h-full">
                      <div className="text-white font-semibold text-xl mb-3">
                        <span className="underline decoration-indigo-500 decoration-2 underline-offset-2">
                          {strippedWord}
                        </span>
                        {' '}is a place:
                      </div>
                      <div className="w-full min-h-32 flex-1 rounded-lg overflow-hidden mt-2 [&_.mapboxgl-ctrl-logo]:hidden [&_.mapboxgl-ctrl-attrib]:hidden">
                        <LocationMap lat={roleData.location.lat} lng={roleData.location.lng} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Render wikidata entries */}
                      {roleData.wikidataEntries.map((entry, idx) => {
                        const entity = getWikidataEntity(entry.wikidata);
                        const displayName = entry.name || strippedWord;
                        return (
                          <div key={`wikidata-${idx}`}>
                            <div className="text-white font-semibold text-xl mb-3">
                              <span className="underline decoration-indigo-500 decoration-2 underline-offset-2">
                                {displayName}
                              </span>
                              {' '}is:
                            </div>
                            {entity ? (
                              <div className="flex gap-4">
                                {entity.image && (
                                  <div className="shrink-0">
                                    <img 
                                      src={entity.image} 
                                      alt={entity.label || displayName}
                                      className="w-24 h-24 object-cover rounded-lg"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-white font-medium text-base">{entity.label}</div>
                                  {entity.description && (
                                    <div className="text-slate-400 text-sm mt-0.5">{entity.description}</div>
                                  )}
                                  <div className="mt-2 space-y-1 text-sm text-slate-300">
                                    {entity.birthDate && (
                                      <div>Born: {formatWikidataDate(entity.birthDate)}</div>
                                    )}
                                    {entity.country && (
                                      <div>Country: {entity.country}</div>
                                    )}
                                    {entity.occupation.length > 0 && (
                                      <div className="capitalize">{entity.occupation.join(', ')}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-400 text-sm">
                                Wikidata: {entry.wikidata}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Render sections */}
                      {roleData.sections.length > 0 && (
                        <div className={roleData.wikidataEntries.length > 0 ? "pt-6 mt-6 border-t border-slate-700/50" : ""}>
                          <RecipeTree 
                            sections={roleData.sections} 
                            roleWords={roles.map(r => r.word)} 
                            showCheckboxes={false}
                            relationships={(() => {
                              const roleRecipeData = recipes.roleRecipes?.[roleName];
                              if (!roleRecipeData) return [];
                              if (Array.isArray(roleRecipeData)) {
                                // Combine relationships from all recipes in the array
                                return roleRecipeData.flatMap(r => r.relationships || []);
                              }
                              return roleRecipeData.relationships || [];
                            })()}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Main Recipe - full width below role recipes */}
        <div className="relative">
          {/* Left margin label - positioned in actual margin */}
          <div className="absolute right-full mr-4 top-8">
            <span className="text-slate-400 text-sm font-medium uppercase tracking-wider whitespace-nowrap">Recipe:</span>
          </div>
          <div 
            ref={mainRecipeRef}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8"
          >
            <RecipeTree 
              sections={getMainRecipeData(roles[agentIndex]?.word || 'Agent', recipes, startDate, endDate, location)} 
              roleWords={roles.map(r => r.word)}
              relationships={recipes.mainRecipe?.relationships || []}
            />
          </div>
        </div>

        {/* Evidence Section */}
        <div className="relative mt-6">
          {/* Left margin label - positioned in actual margin */}
          <div className="absolute right-full mr-4 top-8">
            <span className="text-slate-400 text-sm font-medium uppercase tracking-wider whitespace-nowrap">Evidence:</span>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
            {/* Evidence content will go here */}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-8 text-sm text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircleIcon className="w-5 h-5 text-slate-500" />
              <span>Unverified</span>
            </div>
          </div>
          <div className="w-px h-4 bg-slate-600" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <ArrowRightCircleIcon className="w-5 h-5 text-emerald-500" />
              <span>Verified consequence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowRightCircleIcon className="w-5 h-5 text-slate-500" />
              <span>Unverified consequence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

