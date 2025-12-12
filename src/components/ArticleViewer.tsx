'use client';

import { useMemo } from 'react';

interface ArticleViewerProps {
  article: string;
  claims: string[];
  highlightedClaimIndex: number | null;
}

export default function ArticleViewer({ 
  article, 
  claims, 
  highlightedClaimIndex
}: ArticleViewerProps) {
  // Parse the article and find claim locations
  const parsedArticle = useMemo(() => {
    // Split article into paragraphs
    const paragraphs = article.split('\n\n').filter(p => p.trim());
    
    // For each paragraph, check if any claims match (using fuzzy substring matching)
    return paragraphs.map(paragraph => {
      const segments: { text: string; claimIndex: number | null }[] = [];
      
      // Find all claims that appear in this paragraph
      const claimMatches: { start: number; end: number; claimIndex: number }[] = [];
      
      claims.forEach((claim, claimIndex) => {
        // Try to find the claim in the paragraph (case-insensitive)
        const lowerParagraph = paragraph.toLowerCase();
        const lowerClaim = claim.toLowerCase();
        
        // For exact matches
        let searchIndex = 0;
        while (searchIndex < lowerParagraph.length) {
          const foundIndex = lowerParagraph.indexOf(lowerClaim, searchIndex);
          if (foundIndex !== -1) {
            claimMatches.push({
              start: foundIndex,
              end: foundIndex + claim.length,
              claimIndex
            });
            searchIndex = foundIndex + claim.length;
          } else {
            break;
          }
        }
      });
      
      // Sort matches by start position
      claimMatches.sort((a, b) => a.start - b.start);
      
      // Remove overlapping matches (keep longer ones)
      const filteredMatches: typeof claimMatches = [];
      for (const match of claimMatches) {
        const overlaps = filteredMatches.some(
          existing => 
            (match.start >= existing.start && match.start < existing.end) ||
            (match.end > existing.start && match.end <= existing.end)
        );
        if (!overlaps) {
          filteredMatches.push(match);
        }
      }
      
      // Build segments
      let currentPos = 0;
      for (const match of filteredMatches) {
        if (match.start > currentPos) {
          segments.push({
            text: paragraph.slice(currentPos, match.start),
            claimIndex: null
          });
        }
        segments.push({
          text: paragraph.slice(match.start, match.end),
          claimIndex: match.claimIndex
        });
        currentPos = match.end;
      }
      
      if (currentPos < paragraph.length) {
        segments.push({
          text: paragraph.slice(currentPos),
          claimIndex: null
        });
      }
      
      // If no matches found, return the whole paragraph as one segment
      if (segments.length === 0) {
        segments.push({ text: paragraph, claimIndex: null });
      }
      
      return segments;
    });
  }, [article, claims]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6" style={{ backfaceVisibility: 'hidden' }}>
      <div className="prose prose-invert max-w-none">
        {parsedArticle.map((paragraphSegments, pIndex) => (
          <p key={pIndex} className="text-slate-300 leading-relaxed mb-4 last:mb-0">
            {paragraphSegments.map((segment, sIndex) => {
              const isClaim = segment.claimIndex !== null;
              const isHighlighted = isClaim && segment.claimIndex === highlightedClaimIndex;
              
              // Three states: not a claim, claim (subtle), claim highlighted (pronounced)
              let className = 'transition-all duration-300 ';
              if (isHighlighted) {
                // Pronounced highlight for hovered claim
                className += 'bg-indigo-500/50 text-white underline decoration-indigo-300 decoration-2 underline-offset-2 px-1 -mx-1 rounded font-medium';
              } else if (isClaim) {
                // Subtle highlight for all claims
                className += 'bg-indigo-500/15 text-slate-200 underline decoration-indigo-500/40 decoration-1 underline-offset-2 px-0.5 -mx-0.5 rounded';
              }
              
              return (
                <span key={sIndex} className={className}>
                  {segment.text}
                </span>
              );
            })}
          </p>
        ))}
      </div>
    </div>
  );
}
