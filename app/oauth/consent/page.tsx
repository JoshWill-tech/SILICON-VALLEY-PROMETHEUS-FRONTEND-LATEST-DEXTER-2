import {redirect} from 'next/navigation'

import {createClient} from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type ConsentPageProps = {
  searchParams: Promise<{authorization_id?: string | string[]}>
}

export default async function OAuthConsentPage({searchParams}: ConsentPageProps) {
  const query = await searchParams
  const authorizationId = Array.isArray(query.authorization_id) ? query.authorization_id[0] : query.authorization_id
  if (!authorizationId || authorizationId.length > 256) {
    return <OAuthConsentError message="This authorization request is missing or invalid. Return to ChatGPT and reconnect Prometheus." />
  }

  const supabase = await createClient()
  const {data: {session}} = await supabase.auth.getSession()
  if (!session?.access_token) {
    const returnPath = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`
    redirect(`/login?next=${encodeURIComponent(returnPath)}`)
  }
  const {data: {user}, error: userError} = await supabase.auth.getUser(session.access_token)
  if (userError || !user) {
    const returnPath = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`
    redirect(`/login?next=${encodeURIComponent(returnPath)}`)
  }

  const {data, error} = await supabase.auth.oauth.getAuthorizationDetails(authorizationId)
  if (error || !data) {
    return <OAuthConsentError message="Prometheus could not validate this authorization request. Return to ChatGPT and try connecting again." />
  }
  if (!('authorization_id' in data)) redirect(data.redirect_url)

  const scopes = data.scope.split(/\s+/).filter(Boolean)
  return (
    <main className="mx-auto flex min-h-[100svh] max-w-2xl items-center justify-center px-5 py-12">
      <section className="w-full rounded-3xl border border-white/10 bg-black/35 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Prometheus account access</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Connect {data.client.name}</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">
          This app wants to use your Prometheus account to find source videos and create or check Mini-Run edits.
        </p>

        <div className="mt-7 space-y-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/45">Prometheus account</p>
            <p className="mt-1 text-white">{user.email || 'Signed-in account'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/45">Requesting app</p>
            <p className="mt-1 text-white">{data.client.name}</p>
            <p className="mt-1 break-all text-xs text-white/45">{data.client.uri}</p>
          </div>
          {scopes.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-white/45">Requested identity details</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {scopes.map((scope) => <li className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/75" key={scope}>{scope}</li>)}
              </ul>
            </div>
          ) : null}
          <p className="break-all border-t border-white/10 pt-4 text-xs text-white/45">
            Redirect destination: {data.redirect_uri}
          </p>
        </div>

        <p className="mt-5 text-xs leading-5 text-white/50">
          Prometheus checks that each video and render job belongs to your signed-in account. You can deny access and return to ChatGPT without connecting.
        </p>
        <form action="/api/oauth/decision" method="POST" className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <input type="hidden" name="authorization_id" value={authorizationId} />
          <button name="decision" value="deny" className="h-11 rounded-xl border border-white/15 px-5 text-sm font-medium text-white/75 transition hover:bg-white/5">
            Deny
          </button>
          <button name="decision" value="approve" className="h-11 rounded-xl bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
            Approve and connect
          </button>
        </form>
      </section>
    </main>
  )
}

function OAuthConsentError({message}: {message: string}) {
  return (
    <main className="mx-auto flex min-h-[100svh] max-w-xl items-center justify-center px-5 py-12">
      <section className="w-full rounded-3xl border border-white/10 bg-black/35 p-7 shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">Connection needs attention</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Could not connect this app</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">{message}</p>
      </section>
    </main>
  )
}
