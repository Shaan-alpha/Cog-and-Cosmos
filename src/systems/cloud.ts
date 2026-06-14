// Framework-agnostic Supabase wrapper for Cloud Sync.
// NO Svelte, NO game logic — it only moves the opaque save blob + its metadata.
// @supabase/supabase-js is dynamically imported inside getClient() so it stays out
// of the main bundle until cloud is actually configured/used.
import type { SupabaseClient, Session } from '@supabase/supabase-js'

export interface CloudSave { blob: string; saveVersion: number; saveTimestamp: number }
export interface CloudMeta { saveVersion: number; saveTimestamp: number }
export interface CloudUser { email: string }

const TABLE = 'saves'

function env() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

export function isCloudConfigured(): boolean {
  const { url, key } = env()
  return !!url && !!key
}

let _client: SupabaseClient | null = null
let _initTried = false

export async function getClient(): Promise<SupabaseClient | null> {
  if (!isCloudConfigured()) return null
  if (_client || _initTried) return _client
  _initTried = true
  const { url, key } = env()
  const { createClient } = await import('@supabase/supabase-js')
  _client = createClient(url!, key!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  return _client
}

async function uid(client: SupabaseClient): Promise<string | null> {
  const { data } = await client.auth.getUser()
  return data.user?.id ?? null
}

export async function currentUser(): Promise<CloudUser | null> {
  const client = await getClient()
  if (!client) return null
  const { data } = await client.auth.getSession()
  const email = data.session?.user?.email
  return email ? { email } : null
}

export function onAuthChange(cb: (user: CloudUser | null) => void): () => void {
  let unsub = () => {}
  getClient().then(client => {
    if (!client) return
    const { data } = client.auth.onAuthStateChange((_event, session: Session | null) => {
      const email = session?.user?.email
      cb(email ? { email } : null)
    })
    unsub = () => data.subscription.unsubscribe()
  })
  return () => unsub()
}

export async function signIn(email: string): Promise<{ ok: boolean; error?: string }> {
  const client = await getClient()
  if (!client) return { ok: false, error: 'Cloud sync is not configured.' }
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function signOut(): Promise<void> {
  const client = await getClient()
  if (!client) return
  await client.auth.signOut()
}

export async function pushSave(s: CloudSave): Promise<{ ok: boolean; error?: string }> {
  const client = await getClient()
  if (!client) return { ok: false, error: 'Cloud sync is not configured.' }
  const userId = await uid(client)
  if (!userId) return { ok: false, error: 'Not signed in.' }
  const { error } = await client.from(TABLE).upsert({
    user_id: userId,
    blob: s.blob,
    save_version: s.saveVersion,
    save_timestamp: s.saveTimestamp,
    updated_at: new Date().toISOString(),
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function fetchCloudMeta(): Promise<CloudMeta | null> {
  const client = await getClient()
  if (!client) return null
  const userId = await uid(client)
  if (!userId) return null
  const { data, error } = await client
    .from(TABLE)
    .select('save_version, save_timestamp')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return { saveVersion: data.save_version, saveTimestamp: data.save_timestamp }
}

export async function pullSave(): Promise<CloudSave | null> {
  const client = await getClient()
  if (!client) return null
  const userId = await uid(client)
  if (!userId) return null
  const { data, error } = await client
    .from(TABLE)
    .select('blob, save_version, save_timestamp')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return { blob: data.blob, saveVersion: data.save_version, saveTimestamp: data.save_timestamp }
}
