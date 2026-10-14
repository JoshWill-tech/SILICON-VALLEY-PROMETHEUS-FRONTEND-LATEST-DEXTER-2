export function mcpProtectedResourceMetadataUrl(requestUrl: string) {
  const resource = new URL('/api/mcp', requestUrl)
  return new URL('/.well-known/oauth-protected-resource/api/mcp', resource.origin).toString()
}

export function buildMcpOAuthChallenge(requestUrl: string) {
  return `Bearer resource_metadata="${mcpProtectedResourceMetadataUrl(requestUrl)}"`
}

export function buildMcpOAuthResourceMetadata({requestUrl, supabaseUrl}: {requestUrl: string; supabaseUrl: string}) {
  const resource = new URL('/api/mcp', requestUrl)
  const authServer = `${supabaseUrl.replace(/\/+$/, '')}/auth/v1`

  return {
    resource: resource.toString(),
    authorization_servers: [authServer],
    bearer_methods_supported: ['header'],
    resource_name: 'Prometheus Mini-Run',
  }
}
