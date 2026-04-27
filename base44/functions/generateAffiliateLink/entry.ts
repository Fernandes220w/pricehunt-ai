import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { store_url, affiliate_network, affiliate_id, product_name } = await req.json();

  if (!store_url) {
    return Response.json({ error: 'store_url is required' }, { status: 400 });
  }

  const trackingParams = `utm_source=pricehunt_bot&utm_medium=chat&utm_campaign=ai_recommendation&utm_content=${encodeURIComponent(product_name || 'product')}`;

  let affiliateLink = '';

  switch (affiliate_network) {
    case 'awin':
      affiliateLink = `https://www.awin1.com/cread.php?awinmid=${affiliate_id || 'default'}&awinaffid=YOUR_AWIN_ID&clickref=pricehunt_bot&ued=${encodeURIComponent(store_url + (store_url.includes('?') ? '&' : '?') + trackingParams)}`;
      break;
    case 'shopee':
      affiliateLink = `https://shope.ee/redirect?url=${encodeURIComponent(store_url)}&af_id=pricehunt&${trackingParams}`;
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

  // Log the interaction for tracking
  await base44.asServiceRole.entities.BotInteraction.create({
    conversation_id: 'affiliate_click',
    user_message: `Affiliate link generated for: ${product_name}`,
    bot_response: affiliateLink,
    affiliate_links_generated: 1,
    language: 'pt'
  });

  return Response.json({
    affiliate_link: affiliateLink,
    tracking_id: `pricehunt_bot_${Date.now()}`,
    product_name
  });
});