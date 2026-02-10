/**
 * Deterministic biasing helper for angle/template selection
 * Uses aggregate anonymized category stats to adjust selection priorities
 * No raw text storage or processing
 */

export interface BiasSignal {
  angleKey: string;
  biasWeight: number; // Higher = more likely to be selected
}

/**
 * Calculate bias weights for angle selection based on aggregate stats
 * Favors underrepresented angles/categories to increase variety
 */
export function calculateAngleBias(
  aggregateStats: Array<[string, number, bigint]>,
  aggregateSeed?: number
): BiasSignal[] {
  const biasSignals: BiasSignal[] = [];
  
  if (aggregateStats.length === 0) {
    // No stats available, return neutral bias
    return [];
  }
  
  // Calculate total count across all categories
  const totalCount = aggregateStats.reduce((sum, [_, __, count]) => sum + Number(count), 0);
  
  if (totalCount === 0) {
    return [];
  }
  
  // Map categories to angle keys (heuristic mapping)
  const categoryToAngle: Record<string, string> = {
    'سوال': 'angle-clarification',
    'کمک': 'angle-steps',
    'احساسی': 'angle-empathetic',
    'مدنی': 'civic',
    'اجتماعی': 'angle-reframe',
  };
  
  // Calculate bias for each category
  for (const [category, avgScore, count] of aggregateStats) {
    const angleKey = categoryToAngle[category];
    if (!angleKey) continue;
    
    const proportion = Number(count) / totalCount;
    
    // Inverse bias: underrepresented categories get higher weight
    // Scale: 0.1 (overrepresented) to 2.0 (underrepresented)
    const biasWeight = proportion < 0.1 ? 2.0 : 
                       proportion < 0.2 ? 1.5 :
                       proportion < 0.3 ? 1.0 : 0.5;
    
    biasSignals.push({
      angleKey,
      biasWeight,
    });
  }
  
  // Mix in aggregate seed for deterministic variety
  if (aggregateSeed !== undefined && biasSignals.length > 0) {
    const seedIndex = aggregateSeed % biasSignals.length;
    biasSignals[seedIndex].biasWeight *= 1.3;
  }
  
  return biasSignals;
}

/**
 * Apply bias to angle candidates
 * Adjusts priority scores based on bias signals
 */
export function applyBiasToAngles<T extends { key: string; priority: number }>(
  candidates: T[],
  biasSignals: BiasSignal[]
): T[] {
  if (biasSignals.length === 0) {
    return candidates;
  }
  
  return candidates.map(candidate => {
    const bias = biasSignals.find(b => b.angleKey === candidate.key);
    if (bias) {
      return {
        ...candidate,
        priority: candidate.priority * bias.biasWeight,
      };
    }
    return candidate;
  });
}
