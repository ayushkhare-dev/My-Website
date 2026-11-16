/**
 * Rule-based NextGenify shopping assistant — no external AI call, no
 * credits spent. Pure functions over the store's `Product[]`; the UI
 * component (`ShopBot`) owns state and rendering.
 */
import type { Product } from "./types";
import { fmtMoney } from "./format";

export interface BotReply {
  text: string;
  products?: Product[];
}

const CATEGORY_SYNONYMS: Record<string, string> = {
  electronics: "Electronics",
  electronic: "Electronics",
  gadget: "Electronics",
  gadgets: "Electronics",
  tech: "Electronics",
  headphone: "Electronics",
  headphones: "Electronics",
  speaker: "Electronics",
  fashion: "Fashion",
  clothes: "Fashion",
  clothing: "Fashion",
  apparel: "Fashion",
  wear: "Fashion",
  beauty: "Beauty",
  makeup: "Beauty",
  skincare: "Beauty",
  cosmetics: "Beauty",
  home: "Home",
  lifestyle: "Home",
  decor: "Home",
  shoes: "Shoes",
  shoe: "Shoes",
  sneaker: "Shoes",
  sneakers: "Shoes",
  footwear: "Shoes",
  sports: "Sports",
  sport: "Sports",
  fitness: "Sports",
  gym: "Sports",
  yoga: "Sports",
  travel: "Travel",
  luggage: "Travel",
  bag: "Travel",
  bags: "Travel",
  backpack: "Travel",
  watch: "Watches",
  watches: "Watches",
};

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "for", "of", "to", "in", "on", "with", "me", "i",
  "want", "need", "looking", "show", "find", "some", "any", "please", "can", "you",
  "recommend", "suggest", "best", "good", "get", "buy", "product", "products", "item", "items",
]);

function tokens(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9₹]+/g) ?? [];
}

function extractBudget(text: string): number | null {
  const m = text.match(/(?:under|below|less than|within|up to|budget of)\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*)/i);
  if (!m) return null;
  return Number(m[1].replace(/,/g, ""));
}

function matchCategory(text: string, categories: string[]): string | null {
  const lower = text.toLowerCase();
  for (const cat of categories) {
    if (lower.includes(cat.toLowerCase())) return cat;
  }
  for (const [syn, cat] of Object.entries(CATEGORY_SYNONYMS)) {
    if (lower.includes(syn) && categories.includes(cat)) return cat;
  }
  return null;
}

function scoreProduct(p: Product, terms: string[]): number {
  let score = 0;
  const name = p.name.toLowerCase();
  const brand = p.brand?.toLowerCase() ?? "";
  const cat = p.category?.toLowerCase() ?? "";
  const desc = p.description?.toLowerCase() ?? "";
  const tags = (p.tags ?? []).join(" ").toLowerCase();
  for (const t of terms) {
    if (!t || STOPWORDS.has(t)) continue;
    if (name.includes(t)) score += 3;
    if (brand.includes(t)) score += 2;
    if (cat.includes(t)) score += 2;
    if (tags.includes(t)) score += 2;
    if (desc.includes(t)) score += 1;
  }
  return score;
}

function topMatches(products: Product[], terms: string[], limit = 4): Product[] {
  return products
    .map((p) => ({ p, score: scoreProduct(p, terms) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating)
    .slice(0, limit)
    .map((x) => x.p);
}

function productLine(p: Product): string {
  const price = p.dealPrice ?? p.price;
  return `${p.name} — ${fmtMoney(price)}${p.dealPrice ? ` (was ${fmtMoney(p.price)})` : ""}`;
}

function greet(): BotReply {
  return {
    text: "Hey! I'm your NextGenify shopping assistant. Ask me to find something, recommend a product, compare two items, or answer a shopping question — shipping, returns, sizing, deals, you name it.",
  };
}

function help(categories: string[]): BotReply {
  return {
    text: `I can help you:\n• Find products ("show me watches under 5000")\n• Get recommendations ("recommend a gift for a runner")\n• Compare two products ("compare Nova Air Pro and ...")\n• Explain features of an item\n• Answer shipping, returns, and payment questions\n\nCategories in store: ${categories.join(", ")}.`,
  };
}

function faqAnswer(text: string): BotReply | null {
  const t = text.toLowerCase();
  if (/(ship|delivery|deliver)/.test(t)) {
    return { text: "Standard delivery usually takes 3–5 business days, and express options are available at checkout. You can track any order from the Orders page once it's placed." };
  }
  if (/(return|refund|exchange)/.test(t)) {
    return { text: "Most items can be returned within 7 days of delivery for a full refund, as long as they're unused and in original packaging. Head to Orders → select the order → Request return." };
  }
  if (/(payment|pay|cod|cash on delivery|card)/.test(t)) {
    return { text: "We accept major cards and other standard checkout payment methods. Cash on delivery availability depends on your pincode and shows up automatically at checkout if eligible." };
  }
  if (/(size|fit|sizing)/.test(t)) {
    return { text: "Each product page lists available sizes and a fit note where relevant. If you're between sizes, sizing up is usually the safer call for footwear and outerwear." };
  }
  if (/(discount|coupon|promo code|deal|sale|offer)/.test(t)) {
    return { text: "Check the Deals page for live discounts — items with a struck-through price already have a deal applied at checkout, no code needed unless one is shown." };
  }
  if (/(contact|support|human|help desk)/.test(t)) {
    return { text: "For anything I can't resolve here, reach the team from the Account page's support link, and they'll pick it up from there." };
  }
  if (/(track|order status|where is my order)/.test(t)) {
    return { text: "Open Orders from the account menu — every order shows its live status from confirmed through delivered." };
  }
  return null;
}

export function answer(rawText: string, products: Product[]): BotReply {
  const text = rawText.trim();
  if (!text) return { text: "I didn't quite catch that — try asking me to find or recommend a product!" };

  const lower = text.toLowerCase();
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean) as string[];

  if (/^(hi|hey|hello|yo|sup)\b/.test(lower)) return greet();
  if (/thank/.test(lower)) return { text: "You're welcome! Anything else you'd like to explore?" };
  if (/^(help|what can you do|options)\b/.test(lower)) return help(categories);

  // Compare — look for two product name matches.
  if (/\b(compare|vs\.?|versus)\b/.test(lower)) {
    const parts = lower.split(/\bvs\.?\b|\bversus\b|\band\b/);
    if (parts.length >= 2) {
      const a = topMatches(products, tokens(parts[0]), 1)[0];
      const b = topMatches(products, tokens(parts[1]), 1)[0];
      if (a && b && a.id !== b.id) {
        const cheaper = (a.dealPrice ?? a.price) <= (b.dealPrice ?? b.price) ? a : b;
        return {
          text: `Here's the comparison:\n\n**${a.name}** — ${fmtMoney(a.dealPrice ?? a.price)}, rated ${a.rating.toFixed(1)}★\n**${b.name}** — ${fmtMoney(b.dealPrice ?? b.price)}, rated ${b.rating.toFixed(1)}★\n\n${cheaper.name} is the better-value pick right now.`,
          products: [a, b],
        };
      }
    }
    return { text: "Tell me the two product names you'd like compared, e.g. \"compare Nova Air Pro and Chronos X1\"." };
  }

  const budget = extractBudget(lower);
  const category = matchCategory(lower, categories);

  if (/(new arrival|new in|latest|just dropped)/.test(lower)) {
    const items = products.filter((p) => p.isNew && (!budget || (p.dealPrice ?? p.price) <= budget)).slice(0, 4);
    return items.length
      ? { text: `Here's what's new${budget ? ` under ${fmtMoney(budget)}` : ""}:`, products: items }
      : { text: "Nothing brand-new matches that right now — want me to check bestsellers instead?" };
  }

  if (/(best seller|bestseller|popular|trending|most loved)/.test(lower)) {
    const items = products.filter((p) => p.isBestSeller && (!budget || (p.dealPrice ?? p.price) <= budget)).slice(0, 4);
    return items.length
      ? { text: "Our bestsellers:", products: items }
      : { text: "I couldn't find a bestseller in that range — try widening the budget?" };
  }

  if (/(deal|sale|discount|offer|clearance)/.test(lower)) {
    const items = products.filter((p) => p.dealPrice && (!budget || p.dealPrice <= budget)).slice(0, 4);
    return items.length
      ? { text: "Live deals right now:", products: items }
      : { text: "No active deals match that filter at the moment." };
  }

  const faq = faqAnswer(lower);
  if (faq && !category) return faq;

  if (category) {
    let items = products.filter((p) => p.category === category);
    if (budget) items = items.filter((p) => (p.dealPrice ?? p.price) <= budget);
    items = items.sort((a, b) => b.rating - a.rating).slice(0, 4);
    return items.length
      ? { text: `Top picks in ${category}${budget ? ` under ${fmtMoney(budget)}` : ""}:`, products: items }
      : { text: `I couldn't find anything in ${category}${budget ? ` under ${fmtMoney(budget)}` : ""} — want to try a different budget?` };
  }

  if (budget) {
    const items = products.filter((p) => (p.dealPrice ?? p.price) <= budget).sort((a, b) => b.rating - a.rating).slice(0, 4);
    return items.length
      ? { text: `Here's what fits under ${fmtMoney(budget)}:`, products: items }
      : { text: `Nothing fits under ${fmtMoney(budget)} right now — want to raise the budget a bit?` };
  }

  // Direct product / keyword search.
  const matches = topMatches(products, tokens(lower), 4);
  if (matches.length) {
    if (matches.length === 1) {
      const p = matches[0];
      const price = p.dealPrice ?? p.price;
      const highlights = (p.highlights ?? []).slice(0, 3).join(" • ");
      return {
        text: `${p.name} (${p.category}) — ${fmtMoney(price)}${p.dealPrice ? ` (was ${fmtMoney(p.price)})` : ""}, rated ${p.rating.toFixed(1)}★.\n${highlights}`,
        products: [p],
      };
    }
    return { text: "Here's what I found:", products: matches };
  }

  return {
    text: `I couldn't find a close match for that. Try naming a category (${categories.slice(0, 4).join(", ")}…), a budget, or ask "what's new" or "show me deals".`,
  };
}

export { productLine };
