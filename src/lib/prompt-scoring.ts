// ============================================
// NeuralMint — Client-Side Prompt Scoring
// ============================================

import type { PromptScoreBreakdown } from "./types";
import { getPromptTier } from "./prompt-utils";

// ── Keyword Dictionaries ──

const LIGHTING_KEYWORDS = [
  "volumetric", "rim light", "god rays", "ambient", "backlit", "neon glow",
  "dramatic lighting", "cinematic lighting", "golden hour", "bioluminescent",
  "chiaroscuro", "subsurface scattering", "caustics", "light rays", "sunbeams",
  "atmospheric", "haze", "fog", "mist", "spotlight", "studio lighting",
  "global illumination", "radiosity", "hdri",
];

const COMPOSITION_KEYWORDS = [
  "rule of thirds", "centered composition", "wide angle", "close-up", "macro",
  "bird's eye", "worm's eye", "dutch angle", "panoramic", "symmetrical",
  "asymmetric", "diagonal", "leading lines", "depth of field", "bokeh",
  "tilt-shift", "fisheye", "aerial view", "isometric", "portrait shot",
  "full body", "medium shot",
];

const QUALITY_KEYWORDS = [
  "8k", "4k", "ultra-detailed", "masterpiece", "best quality", "high resolution",
  "highly detailed", "intricate details", "sharp focus", "professional",
  "photorealistic", "hyperrealistic", "ultra realistic", "hyper detailed",
  "extremely detailed", "fine details", "crisp",
];

const RENDER_KEYWORDS = [
  "octane render", "unreal engine", "ray tracing", "v-ray", "corona render",
  "blender", "cinema 4d", "3d render", "cgi", "digital painting",
  "oil painting", "watercolor", "acrylic", "pencil drawing", "charcoal",
  "ink wash", "pastel", "mixed media", "collage",
];

const STYLE_MOVEMENTS = [
  "cyberpunk", "steampunk", "art nouveau", "art deco", "impressionist",
  "surrealist", "baroque", "renaissance", "minimalist", "maximalist",
  "vaporwave", "synthwave", "gothic", "noir", "pop art", "abstract expressionism",
  "futurism", "brutalism", "retro", "vintage", "ukiyo-e", "psychedelic",
  "solarpunk", "dieselpunk", "afrofuturism",
];

const ATMOSPHERE_KEYWORDS = [
  "ethereal", "moody", "dramatic", "serene", "dystopian", "utopian",
  "melancholic", "whimsical", "eerie", "mystical", "cosmic", "dreamy",
  "haunting", "vibrant", "somber", "majestic", "otherworldly", "apocalyptic",
  "peaceful", "chaotic", "enigmatic",
];

const CLICHE_PHRASES = [
  "beautiful landscape", "pretty girl", "cute cat", "nice sunset",
  "beautiful woman", "handsome man", "lovely flowers", "amazing view",
  "wonderful scene", "great picture",
];

// ── Scoring Functions ──

function countKeywordMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
}

function scoreSpecificity(prompt: string): number {
  const words = prompt.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  let score = 0;

  // Word count scoring (sweet spot: 30-80 words)
  if (wordCount >= 15) score += 3;
  if (wordCount >= 30) score += 4;
  if (wordCount >= 50) score += 3;
  if (wordCount >= 80) score += 2;
  // Penalty for too short or too long
  if (wordCount < 8) score = Math.max(0, score - 3);
  if (wordCount > 150) score = Math.max(0, score - 2);

  // Comma-separated details (structured prompt)
  const commaCount = (prompt.match(/,/g) || []).length;
  score += Math.min(commaCount, 5);

  // Numerical details (dimensions, counts, percentages)
  const numMatches = (prompt.match(/\d+/g) || []).length;
  score += Math.min(numMatches * 2, 4);

  // Adjective density check (color words, descriptive modifiers)
  const colorWords = ["red", "blue", "green", "gold", "silver", "cyan", "purple", "neon", "crimson", "emerald", "azure", "obsidian", "iridescent"];
  score += Math.min(countKeywordMatches(prompt, colorWords) * 2, 4);

  return Math.min(25, Math.max(0, score));
}

function scoreTechnical(prompt: string): number {
  let score = 0;

  // Lighting terms
  const lightingHits = countKeywordMatches(prompt, LIGHTING_KEYWORDS);
  score += Math.min(lightingHits * 3, 8);

  // Composition terms
  const compositionHits = countKeywordMatches(prompt, COMPOSITION_KEYWORDS);
  score += Math.min(compositionHits * 3, 6);

  // Quality keywords
  const qualityHits = countKeywordMatches(prompt, QUALITY_KEYWORDS);
  score += Math.min(qualityHits * 2, 6);

  // Render/medium terms
  const renderHits = countKeywordMatches(prompt, RENDER_KEYWORDS);
  score += Math.min(renderHits * 3, 5);

  return Math.min(25, Math.max(0, score));
}

function scoreCreativity(prompt: string): number {
  const lower = prompt.toLowerCase();
  let score = 5; // Base score

  // Concept combination: count distinct nouns/subjects
  const conceptWords = lower.split(/[\s,]+/).filter((w) => w.length > 4);
  const uniqueConcepts = new Set(conceptWords);
  if (uniqueConcepts.size >= 8) score += 4;
  if (uniqueConcepts.size >= 15) score += 3;
  if (uniqueConcepts.size >= 22) score += 2;

  // Unusual pairings bonus (metaphorical combinations)
  const metaphorPatterns = [
    /\w+\s+made\s+of\s+\w+/i,
    /\w+\s+morphing\s+into\s+\w+/i,
    /fusion\s+of/i,
    /blend\s+of/i,
    /hybrid/i,
    /surreal/i,
    /dream/i,
    /impossible/i,
    /paradox/i,
  ];
  const metaphorHits = metaphorPatterns.filter((p) => p.test(prompt)).length;
  score += Math.min(metaphorHits * 3, 6);

  // Narrative elements
  if (/story|scene|moment|aftermath|journey|quest|legend/i.test(prompt)) score += 2;

  // Cliche penalty
  const clicheHits = countKeywordMatches(prompt, CLICHE_PHRASES);
  score -= clicheHits * 3;

  // Action/dynamic elements
  if (/flying|running|falling|dancing|fighting|emerging|transforming|dissolving/i.test(prompt)) score += 2;

  return Math.min(25, Math.max(0, score));
}

function scoreArtistic(prompt: string): number {
  let score = 0;

  // Artist references
  if (/art\s*by|style\s*of|inspired\s*by|in\s*the\s*style/i.test(prompt)) score += 5;
  // Specific artist names
  if (/rutkowski|mucha|beksinski|giger|moebius|frazetta|ross|artgerm|greg|wlop|makoto|miyazaki/i.test(prompt)) score += 3;

  // Style movements
  const styleHits = countKeywordMatches(prompt, STYLE_MOVEMENTS);
  score += Math.min(styleHits * 3, 6);

  // Atmosphere/mood
  const atmosphereHits = countKeywordMatches(prompt, ATMOSPHERE_KEYWORDS);
  score += Math.min(atmosphereHits * 2, 5);

  // Color palette mentions
  if (/palette|color\s*scheme|tones|hues|monochrome|warm\s*tones|cool\s*tones/i.test(prompt)) score += 3;

  // Medium specification
  if (/digital\s*painting|oil\s*on\s*canvas|watercolor|concept\s*art|illustration|photograph|3d\s*render/i.test(prompt)) score += 3;

  return Math.min(25, Math.max(0, score));
}

// ── Main Scoring Function ──

export function scorePrompt(prompt: string, _aiModel?: string): PromptScoreBreakdown {
  if (!prompt || prompt.trim().length === 0) {
    return {
      overall: 0,
      specificity: 0,
      technicalQuality: 0,
      creativity: 0,
      artisticDirection: 0,
      tier: "common",
    };
  }

  const specificity = scoreSpecificity(prompt);
  const technicalQuality = scoreTechnical(prompt);
  const creativity = scoreCreativity(prompt);
  const artisticDirection = scoreArtistic(prompt);
  const overall = specificity + technicalQuality + creativity + artisticDirection;

  return {
    overall,
    specificity,
    technicalQuality,
    creativity,
    artisticDirection,
    tier: getPromptTier(overall),
  };
}
