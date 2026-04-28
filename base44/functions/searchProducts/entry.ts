import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// IDs de afiliado — configure nas variáveis de ambiente do dashboard
const AWIN_PUBLISHER_ID = Deno.env.get("AWIN_PUBLISHER_ID") || "";
const SHOPEE_APP_KEY = Deno.env.get("SHOPEE_APP_KEY") || "";
const AMAZON_TAG = Deno.env.get("AMAZON_TAG") || "pricehunt-20";

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

  const { query, category, min_score } = await req.json();
  const scoreThreshold = min_score || 80;

  // 1. Buscar todos os produtos
  const allProducts = await base44.asServiceRole.entities.Product.list("-reliability_score", 200);

  // 2. Filtrar por score mínimo
  let filtered = allProducts.filter(p => (p.reliability_score || 0) >= scoreThreshold);

  // 3. Filtrar por query (nome, marca, tags, categoria)
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

  // 4. Filtrar por categoria
  if (category && category !== "todos") {
    filtered = filtered.filter(p => p.category === category);
  }

  // 5. Para cada produto, buscar preços e montar oferta
  const productIds = filtered.map(p => p.id);
  const allPrices = productIds.length > 0
    ? await base44.asServiceRole.entities.Price.filter({ is_available: true }, "-price", 500)
    : [];

  // Agrupar preços por produto
  const pricesByProduct = {};
  for (const price of allPrices) {
    if (!pricesByProduct[price.product_id]) pricesByProduct[price.product_id] = [];
    pricesByProduct[price.product_id].push(price);
  }

  // 6. Montar resposta com melhor oferta + link de afiliado
  const results = filtered.slice(0, 10).map(product => {
    const prices = (pricesByProduct[product.id] || []).sort((a, b) => a.price - b.price);
    const bestPrice = prices[0] || null;

    const affiliateLink = bestPrice ? buildAffiliateLink(bestPrice, product.name) : null;

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
      all_offers_count: prices.length
    };
  });

  return Response.json({
    total: results.length,
    score_filter: scoreThreshold,
    query: query || null,
    products: results
  });
});