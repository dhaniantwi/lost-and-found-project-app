import { ItemReport, MatchScoreResult } from '../types';

export function calculateMatchScore(lostItem: ItemReport, foundItem: ItemReport): MatchScoreResult | null {
  // Only compare lost with found
  if (lostItem.type !== 'lost' || foundItem.type !== 'found') {
    return null;
  }

  // Only active reports and found items still available for a claim can match.
  if (lostItem.status === 'recovered' || lostItem.status === 'archived') return null;
  if (foundItem.status !== 'open' && foundItem.status !== 'in_review') return null;

  let score = 0;
  const reasons: string[] = [];

  // 1. Category check (Critical baseline: 35 points)
  if (lostItem.category === foundItem.category) {
    score += 35;
    reasons.push(`Matching category: ${lostItem.category}`);
  } else {
    // If categories are completely disparate, maximum score is capped low
    return null;
  }

  // 2. Color check (15 points)
  const lostColor = lostItem.color.trim().toLowerCase();
  const foundColor = foundItem.color.trim().toLowerCase();
  if (lostColor && foundColor) {
    if (lostColor === foundColor || lostColor.includes(foundColor) || foundColor.includes(lostColor)) {
      score += 15;
      reasons.push(`Color match: "${lostItem.color}"`);
    }
  }

  // 3. Location check (20 points)
  const lostLoc = lostItem.campusLocation.toLowerCase();
  const foundLoc = foundItem.campusLocation.toLowerCase();
  if (lostLoc === foundLoc) {
    score += 20;
    reasons.push(`Same campus zone: ${lostItem.campusLocation}`);
  } else if (
    (lostLoc.includes('library') && foundLoc.includes('library')) ||
    (lostLoc.includes('science') && foundLoc.includes('science')) ||
    (lostLoc.includes('casford') && foundLoc.includes('casford')) ||
    (lostLoc.includes('swlt') && foundLoc.includes('swlt'))
  ) {
    score += 15;
    reasons.push(`Close vicinity: ${lostItem.campusLocation} / ${foundItem.campusLocation}`);
  }

  // 4. Token & Keyword overlap in title and description (20 points)
  const stopWords = new Set(['the', 'and', 'with', 'for', 'near', 'left', 'lost', 'found', 'this', 'that', 'after', 'from', 'have', 'been']);
  
  const extractTokens = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
  };

  const lostTokens = new Set([...extractTokens(lostItem.title), ...extractTokens(lostItem.description)]);
  const foundTokens = new Set([...extractTokens(foundItem.title), ...extractTokens(foundItem.description)]);

  let matchedTokensCount = 0;
  const overlappingWords: string[] = [];

  lostTokens.forEach((token) => {
    if (foundTokens.has(token)) {
      matchedTokensCount++;
      if (overlappingWords.length < 3) {
        overlappingWords.push(token);
      }
    }
  });

  if (matchedTokensCount >= 3) {
    score += 20;
    reasons.push(`Strong keyword match (${overlappingWords.join(', ')})`);
  } else if (matchedTokensCount >= 1) {
    score += 10;
    reasons.push(`Keyword match (${overlappingWords.join(', ')})`);
  }

  // 5. Date timeline proximity (10 points)
  // Found date should ideally be on or shortly after lost date
  const lostDate = new Date(lostItem.dateEvent).getTime();
  const foundDate = new Date(foundItem.dateEvent).getTime();
  const dayDifference = (foundDate - lostDate) / (1000 * 60 * 60 * 24);

  if (dayDifference >= 0 && dayDifference <= 3) {
    score += 10;
    reasons.push('Found within 72 hours of loss report');
  } else if (dayDifference >= 0 && dayDifference <= 10) {
    score += 5;
    reasons.push('Dates align within plausible 10-day window');
  } else if (dayDifference >= -1 && dayDifference < 0) {
    // slight discrepancy in recollection
    score += 5;
    reasons.push('Same day/approximate date recorded');
  }

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(0, score));

  // Only consider pairs that score 40% or higher as viable candidate matches
  if (finalScore >= 40) {
    return {
      lostItem,
      foundItem,
      score: finalScore,
      reasons
    };
  }

  return null;
}

export function findAllMatches(items: ItemReport[]): MatchScoreResult[] {
  const lostItems = items.filter((i) => i.type === 'lost' && i.status !== 'recovered' && i.status !== 'archived');
  const foundItems = items.filter((i) => i.type === 'found' && (i.status === 'open' || i.status === 'in_review'));

  const results: MatchScoreResult[] = [];

  for (const lost of lostItems) {
    for (const found of foundItems) {
      const match = calculateMatchScore(lost, found);
      if (match) {
        results.push(match);
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
