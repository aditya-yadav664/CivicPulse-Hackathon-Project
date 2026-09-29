/**
 * Automated AI-powered spam & nonsensical text filtration service
 */

export interface SpamFilterResult {
  isSpam: boolean;
  reason: string;
  confidence: number;
}

/**
 * Rapid client-side heuristic analyzer for instant classification or offline resilience.
 * Flags incoherent keyboard mashing, repeated characters, and nonsensical text.
 */
export function clientHeuristicSpamCheck(title: string, description: string = ''): SpamFilterResult {
  const combined = `${title} ${description}`.trim();
  const lower = combined.toLowerCase();

  // 1. Extreme character repetition (e.g. "aaaaa", "zzzzzz", "111111", "......")
  if (/([a-zA-Z0-9])\1{4,}/.test(combined)) {
    return {
      isSpam: true,
      reason: 'AI Shield: Incoherent repetitive character sequences detected (text does not make sense)',
      confidence: 0.96,
    };
  }

  // 2. Clear keyboard mash patterns (e.g. asdfghjkl, qwertyuiop, zxcvbnm)
  const mashSignatures = ['asdfgh', 'qwertyui', 'zxcvbn', '1234567'];
  let isBlatantMash = false;
  for (const sig of mashSignatures) {
    if (lower.includes(sig)) {
      isBlatantMash = true;
      break;
    }
  }

  if (isBlatantMash) {
    return {
      isSpam: true,
      reason: 'AI Shield: Blatant keyboard mash sequence detected',
      confidence: 0.95,
    };
  }

  // 3. Vowel-to-consonant ratio check for extreme gibberish (only for longer words >= 7 chars)
  const lettersOnly = combined.replace(/[^a-zA-Z\s]/g, '');
  const words = lettersOnly.split(/\s+/).filter((w) => w.length >= 7);
  if (words.length >= 3) {
    let unreadableWords = 0;
    for (const word of words) {
      const vowels = (word.match(/[aeiouyAEIOUY]/g) || []).length;
      const ratio = vowels / word.length;
      if (ratio === 0 || ratio > 0.85) {
        unreadableWords++;
      }
    }
    if (unreadableWords === words.length) {
      return {
        isSpam: true,
        reason: 'AI Shield: Unreadable gibberish vocabulary detected',
        confidence: 0.92,
      };
    }
  }

  // 4. Commercial promo spam keywords
  const spamKeywords = [
    'buy cheap', 'casino', 'viagra', 'crypto', 'bitcoin', 'telegram @', 'whatsapp +', 'free bonus', 'porn', 'seo rank'
  ];
  for (const kw of spamKeywords) {
    if (lower.includes(kw)) {
      return {
        isSpam: true,
        reason: `AI Shield: Unsolicited promotional spam detected ("${kw}")`,
        confidence: 0.99,
      };
    }
  }

  return {
    isSpam: false,
    reason: 'Coherent civic infrastructure report',
    confidence: 0.9,
  };
}

/**
 * Automated AI evaluation using the Gemini-powered server endpoint.
 * Fallbacks cleanly to local heuristic classifier if the network is delayed.
 */
export async function evaluateReportSpam(data: {
  title: string;
  description?: string;
  category?: string;
  address?: string;
}): Promise<SpamFilterResult> {
  // First run instant fast heuristic for obvious keyboard mashing
  const instantCheck = clientHeuristicSpamCheck(data.title, data.description);
  if (instantCheck.isSpam && instantCheck.confidence >= 0.95) {
    return instantCheck;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const res = await fetch('/api/filter-spam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      return {
        isSpam: Boolean(json.isSpam),
        reason: json.reason || (json.isSpam ? 'Flagged by AI automated spam filter' : 'Coherent civic report'),
        confidence: Number(json.confidence) || 0.9,
      };
    }
  } catch (err) {
    console.warn('AI filter server request timed out or unavailable, using client fallback:', err);
  }

  // Clean fallback
  return clientHeuristicSpamCheck(data.title, data.description);
}

/**
 * Batch filter multiple existing reports
 */
export async function batchEvaluateSpam(
  issues: Array<{ id: string; title: string; description?: string; category?: string; address?: string }>
): Promise<Array<{ id: string; isSpam: boolean; reason: string; confidence: number }>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch('/api/batch-filter-spam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issues }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results)) {
        return data.results;
      }
    }
  } catch (err) {
    console.warn('Batch AI filter request error, evaluating with client heuristic:', err);
  }

  // Fallback to local heuristic for each issue
  return issues.map((iss) => {
    const evalRes = clientHeuristicSpamCheck(iss.title, iss.description);
    return {
      id: iss.id,
      ...evalRes,
    };
  });
}
