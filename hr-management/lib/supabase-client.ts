import { createClient } from "@supabase/supabase-js"

// Client-side Supabase instance — used ONLY for Realtime subscriptions.
// All data operations go through FastAPI.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
