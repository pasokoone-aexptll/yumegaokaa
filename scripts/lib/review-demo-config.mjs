// Configuration validation only. It never creates accounts or connects to a service.
const productionProject = 'kchsbjayfdwjjbevqlop';
export function validateReviewDemoConfig(config, { productionGatewayUrl, approvedProjectRef } = {}) {
  if (!approvedProjectRef || approvedProjectRef === productionProject || !/^[a-z]{20}$/.test(approvedProjectRef))
    throw Error('A separately approved review project is required');
  if (config.projectRef !== approvedProjectRef) throw Error('Unapproved review project');
  const api = new URL(config.supabaseUrl);
  if (api.origin !== `https://${approvedProjectRef}.supabase.co` || api.pathname !== '/' || api.search || api.hash || api.username || api.password)
    throw Error('Invalid review API origin');
  const gateway = new URL(config.gatewayUrl);
  const productionGateway = new URL(productionGatewayUrl);
  if (gateway.protocol !== 'wss:' || gateway.hostname === productionGateway.hostname || gateway.username || gateway.password || gateway.search || gateway.hash || !['/', '/street'].includes(gateway.pathname))
    throw Error('Review gateway must be separate and use WSS');
  if (config.authentication !== 'password' || config.pushEnabled !== false)
    throw Error('Review environment requires password auth and disabled external push');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(config.streetId ?? ''))
    throw Error('Invalid review street ID');
  if (Object.keys(config).some(k=>!['projectRef','supabaseUrl','gatewayUrl','streetId','authentication','pushEnabled'].includes(k)))
    throw Error('Unexpected config field: credentials must not be stored here');
  return Object.freeze({ ...config });
}
