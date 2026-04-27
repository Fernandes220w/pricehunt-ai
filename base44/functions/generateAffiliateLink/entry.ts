import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { store_url, affiliate_network, affiliate_id, product_name, reliability_score } = await req.json();

  if (!store_url) {
    return Response.json({ error: 'store_url is required' }, { status: 400 });
  }

  // Tracking exclusivo do bot com subid para diferenciar do site
  const subid = `bot_consultor_${Date.now()}`;
  const trackingParams = `utm_source=pricehunt_bot&utm_medium=chat&utm_campaign=ai_recommendation&utm_content=${encodeURIComponent(product_name || 'product')}&subid=${subid}`;

  let affiliateLink = '';

  switch (affiliate_network) {
    case 'awin':
      affiliateLink = `https://www.awin1.com/cread.php?awinmid=${affiliate_id || 'default'}&awinaffid=YOUR_AWIN_ID&clickref=${subid}&ued=${encodeURIComponent(store_url + (store_url.includes('?') ? '&' : '?') + trackingParams)}`;
      break;
    case 'shopee':
      affiliateLink = `https://shope.ee/redirect?url=${encodeURIComponent(store_url)}&af_id=pricehunt&sub_id=${subid}&${trackingParams}`;
      break;
    case 'amazon':
      const separator = store_url.includes('?') ? '&' : '?';
      affiliateLink = `${store_url}${separator}tag=pricehunt-20&${trackingParams}`;
      break;
    default:
      const sep = store_url.includes('?') ? '&' : '?';
      affiliateLink = `${store_url}${sep}${trackingParams}`;
      break;
  }

  // Log para rastreio interno
  await base44.asServiceRole.entities.BotInteraction.create({
    conversation_id: subid,
    user_message: `Affiliate link gerado pelo bot para: ${product_name} (Score: ${reliability_score || 'N/A'})`,
    bot_response: affiliateLink,
    affiliate_links_generated: 1,
    language: 'pt'
  });

  return Response.json({
    affiliate_link: affiliateLink,
    tracking_id: subid,
    product_name,
    reliability_score: reliability_score || null,
    message: `Link de afiliado gerado com sucesso para ${product_name}. Use exatamente este link na resposta: ${affiliateLink}`
  });
});