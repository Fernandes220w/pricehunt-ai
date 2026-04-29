import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const AWIN_PUBLISHER_ID = Deno.env.get("AWIN_PUBLISHER_ID") || "";
const SHOPEE_APP_KEY = Deno.env.get("SHOPEE_APP_KEY") || "";
const AMAZON_TAG = Deno.env.get("AMAZON_TAG") || "pricehunt004-20";

function buildAffiliateLink(price, productName) {
  const subid = `bot_${Date.now()}`;
  const utmParams = `utm_source=pricehunt_bot&utm_medium=chat&utm_campaign=ai_recommendation&utm_content=${encodeURIComponent(productName)}&subid=${subid}`;
  const baseUrl = price.store_url || "";
  if (!baseUrl) return null;
  const sep = baseUrl.includes("?") ? "&" : "?";

  switch (price.affiliate_network) {
    case "awin":
      if (!AWIN_PUBLISHER_ID) return `${baseUrl}${sep}${utmParams}`;
      return `https://www.awin1.com/cread.php?awinmid=${price.affiliate_id || ""}&awinaffid=${AWIN_PUBLISHER_ID}&clickref=${subid}&ued=${encodeURIComponent(baseUrl + sep + utmParams)}`;
    case "shopee":
      if (!SHOPEE_APP_KEY) return `${baseUrl}${sep}${utmParams}`;
      return `https://shope.ee/redirect?url=${encodeURIComponent(baseUrl)}&appkey=${SHOPEE_APP_KEY}&sub_id=${subid}&${utmParams}`;
    case "amazon":
      return `${baseUrl}${sep}tag=${AMAZON_TAG}&${utmParams}`;
    default:
      return `${baseUrl}${sep}${utmParams}`;
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { query, category, min_score, user_id, channel } = await req.json();
  const scoreThreshold = min_score || 80;

  // 1. Carregar perfil do usuário (memória persistente)
  let userProfile = null;
  if (user_id) {
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id });
    userProfile = profiles[0] || null;

    // Atualizar histórico de buscas
    if (query) {
      const searchHistory = userProfile?.search_history || [];
      if (!searchHistory.includes(query)) searchHistory.unshift(query);
      const updatedHistory = searchHistory.slice(0, 20); // máximo 20 buscas

      if (userProfile) {
        await base44.asServiceRole.entities.UserProfile.update(userProfile.id, {
          search_history: updatedHistory,
          last_seen: new Date().toISOString()
        });
      } else {
        userProfile = await base44.asServiceRole.entities.UserProfile.create({
          user_id,
          search_history: updatedHistory,
          last_seen: new Date().toISOString(),
          channel: channel || "app"
        });
      }
    }
  }

  // 2. Buscar produtos
  const allProducts = await base44.asServiceRole.entities.Product.list("-reliability_score", 200);
  let filtered = allProducts.filter(p => (p.reliability_score || 0) >= scoreThreshold);

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
      p.description?.toLowerCase().includes(q)
    );
  }

  if (category && category !== "todos") {
    filtered = filtered.filter(p => p.category === category);
  }

  // 3. Buscar preços
  const productIds = filtered.map(p => p.id);
  const allPrices = productIds.length > 0
    ? await base44.asServiceRole.entities.Price.filter({ is_available: true }, "-price", 500)
    : [];

  const pricesByProduct = {};
  for (const price of allPrices) {
    if (!pricesByProduct[price.product_id]) pricesByProduct[price.product_id] = [];
    pricesByProduct[price.product_id].push(price);
  }

  // 4. Buscar histórico de preços dos últimos 30 dias
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let priceHistoryAll = [];
  try {
    priceHistoryAll = await base44.asServiceRole.entities.PriceHistory.list("-recorded_at", 2000);
  } catch (e) {
    priceHistoryAll = [];
  }

  // Agrupar histórico por produto
  const historyByProduct = {};
  for (const h of priceHistoryAll) {
    if (h.recorded_at && h.recorded_at >= thirtyDaysAgo) {
      if (!historyByProduct[h.product_id]) historyByProduct[h.product_id] = [];
      historyByProduct[h.product_id].push(h.price);
    }
  }

  // 5. Montar resposta
  const results = filtered.slice(0, 10).map(product => {
    const prices = (pricesByProduct[product.id] || []).sort((a, b) => a.price - b.price);
    const bestPrice = prices[0] || null;
    const affiliateLink = bestPrice ? buildAffiliateLink(bestPrice, product.name) : null;

    // Análise de histórico de preço
    let priceAnalysis = null;
    const history = historyByProduct[product.id];
    if (history && history.length > 0 && bestPrice) {
      const avg30d = history.reduce((a, b) => a + b, 0) / history.length;
      const minPrice = Math.min(...history);
      const currentPrice = bestPrice.price;
      const diffFromAvg = currentPrice - avg30d;
      const diffPct = Math.round((diffFromAvg / avg30d) * 100);
      const isHistoricalMin = currentPrice <= minPrice;

      priceAnalysis = {
        avg_30d: Math.round(avg30d * 100) / 100,
        min_30d: minPrice,
        diff_from_avg: Math.round(diffFromAvg * 100) / 100,
        diff_pct: diffPct,
        is_historical_min: isHistoricalMin,
        trend: diffPct < -5 ? "abaixo_da_media" : diffPct > 5 ? "acima_da_media" : "na_media"
      };
    }

    return {
      id: product.id,
      name: product.name,
      brand: product.brand || null,
      category: product.category,
      description: product.description || null,
      reliability_score: product.reliability_score,
      image_url: product.image_url || null,
      best_offer: bestPrice ? {
        price: bestPrice.price,
        original_price: bestPrice.original_price || null,
        discount_pct: bestPrice.original_price
          ? Math.round((1 - bestPrice.price / bestPrice.original_price) * 100)
          : null,
        store_name: bestPrice.store_name,
        affiliate_network: bestPrice.affiliate_network || "manual",
        affiliate_link: affiliateLink,
        tracking_subid: `bot_${product.id}`
      } : null,
      price_analysis: priceAnalysis,
      all_offers_count: prices.length
    };
  });

  // 6. Dados do perfil para personalização
  const profileSummary = userProfile ? {
    name: userProfile.name || null,
    search_history: (userProfile.search_history || []).slice(0, 5),
    preferred_categories: userProfile.preferred_categories || [],
    preferred_stores: userProfile.preferred_stores || [],
    max_budget: userProfile.max_budget || null
  } : null;

  return Response.json({
    total: results.length,
    score_filter: scoreThreshold,
    query: query || null,
    products: results,
    user_profile: profileSummary,
    channel: channel || "app"
  });
});