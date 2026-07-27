# Database

## Setup

Run [`000_init.sql`](000_init.sql) once in the Supabase SQL Editor. That's the whole install — tables, functions, triggers, RLS policies, and the storage bucket.

Then grant yourself admin (last section of the file, commented out) or `/admin` will bounce you to `/dashboard`:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'you@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = now();
```

The bucket it creates is `northbridge-storage`, which must match `NEXT_PUBLIC_STORAGE_BUCKET` in `.env.local`.

Re-running the script is safe. It never drops or truncates data.

## `_archive/`

The 36 SQL files this replaced — the original schemas plus ~25 one-off `fix_*` / `migrate_*` patches. Kept for reference only; do not run them. Several are actively harmful now (blanket "any authenticated user" RLS policies, a hardcoded admin UUID, balance triggers that double-count). Section 14 of `000_init.sql` documents every conflict and how it was resolved.

## Known issue

`src/app/admin/page.tsx:150` selects a `type` column from `transactions` that no longer exists — the admin dashboard's "recent activity" list will be empty until that's changed to `transaction_type`. Schema change won't fix it; it needs a code edit.

## Storage is public

The bucket is public because `src/app/kyc/page.tsx` renders documents via `getPublicUrl()`. That means ID scans, selfies, and proof-of-address files are readable by anyone holding the URL. To harden: set `public = false` in section 12, drop the `storage_public_read` policy, and switch `uploadFile()` to `createSignedUrl()`.
