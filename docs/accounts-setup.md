# Accounts Setup (Supabase)

Purpose: get the free database and login system running behind the client portal. This is a one-time setup that takes about 15 minutes. No coding required — just clicking and pasting.

## 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (the free plan is all we need).
2. Click **New project**.
3. Name it something like `fonseca-fitness`, pick a strong database password (save it somewhere safe — you rarely need it, but don't lose it), and choose a region close to home (e.g. US East).
4. Wait a minute or two while the project spins up.

## 2. Run the database setup script

1. In the Supabase dashboard, open **SQL Editor** in the left sidebar.
2. Open the file `supabase/schema.sql` from this repo and copy its entire contents.
3. Paste it into the SQL editor and click **Run**.
4. You should see "Success. No rows returned." That's it — all the tables, security rules, and triggers are now in place. The script is safe to run again if you're ever unsure whether it worked.

## 3. Turn on magic-link email login

1. Go to **Authentication → Sign In / Providers**.
2. Make sure **Email** is enabled.
3. Turn **off** "Confirm email" password requirements aren't needed — we want the "magic link" style login, where clients type their email and click a link. (If you see a toggle for magic links specifically, enable it.)
4. Leave **signups enabled**. Clients need to be able to create their own accounts. This is safe: every new signup automatically gets the limited `client` role and can only ever see their own data.

## 4. Copy your project keys into the site

The portal page needs two values to talk to Supabase:

1. In the dashboard, go to **Settings → API** (sometimes labeled "API Keys" / "Data API").
2. Copy the **Project URL** (looks like `https://abcdefgh.supabase.co`).
3. Copy the **anon public** key (a long string starting with `eyJ...`).
4. Open `assets/portal-config.js` in this repo and paste them in. That file looks like:

```js
window.FONSECA_SUPABASE = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "eyJ...your-anon-key..."
};
```

Just replace the two placeholder values, save, and publish the site as usual.

## 5. Make Dad's account the coach

1. Have Dad sign in to the portal once with his email (this creates his account).
2. In Supabase, go to **Authentication → Users** and copy the long ID (UUID) next to his email.
3. In the **SQL Editor**, run this one line, pasting his ID between the quotes:

```sql
update public.profiles set role = 'coach' where id = '<user-uuid>';
```

Now his account can see and manage all clients, packages, sessions, and invoices. Everyone else stays a client.

## Is the anon key safe to publish?

Yes. It's designed to be public — it ends up in the website code that every visitor downloads, and Supabase expects that. What actually protects the data is row-level security, which the setup script turned on: even with the anon key, a logged-in client can only read their own records, and only the coach account can change anything.

Never publish the **service role** key, though. That one bypasses security. You'll never need it for this site — just leave it alone in the dashboard.

## What does this cost?

Nothing, at this scale. The Supabase free tier covers a database far larger than a one-trainer client roster will ever need, plus plenty of logins and traffic. The only quirk: free projects pause after about a week of zero activity. If that ever happens, one click in the dashboard ("Restore project") wakes it back up, with all data intact.
