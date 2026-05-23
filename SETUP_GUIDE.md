# StreamVault — Complete Setup & Deployment Guide
## From Zero to Live in Under 1 Hour

---

## WHAT YOU'RE GETTING

```
streamvault/
├── src/                    ← Frontend (user-facing site)
│   ├── components/
│   │   ├── AgeGate.jsx     ← 18+ verification with DOB
│   │   ├── BottomNav.jsx   ← Frosted glass 4-tab nav
│   │   ├── VideoPlayer.jsx ← HLS player + ads + likes + comments
│   │   └── VideoGrid.jsx   ← Grid for history/liked pages
│   ├── pages/
│   │   ├── Feed.jsx        ← Main scroll feed + sort dropdown
│   │   ├── History.jsx     ← Watch history
│   │   ├── Liked.jsx       ← Liked videos
│   │   └── Account.jsx     ← Login / signup / profile
│   ├── hooks/useAuth.js    ← Auth state management
│   ├── lib/supabase.js     ← All database functions
│   └── App.jsx             ← Root with routing + age gate
│
├── admin/                  ← Admin panel (separate app)
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx      ← Admin login
│       │   └── Dashboard.jsx  ← Video upload/manage interface
│       └── lib/supabase.js    ← Admin DB functions
│
├── SUPABASE_SCHEMA.sql     ← Run this in Supabase once
└── .env.template           ← Copy to .env files
```

---

## STEP 1 — Create Your Supabase Project (FREE)

1. Go to **https://supabase.com** → Sign up (free)
2. Click **"New Project"**
3. Choose a name e.g. `streamvault`, pick a region close to India (Singapore)
4. Set a strong database password → click **Create Project**
5. Wait ~2 minutes for it to spin up

**Get your keys:**
- Go to **Settings → API**
- Copy: `Project URL` → this is your `SUPABASE_URL`
- Copy: `anon / public` key → this is your `SUPABASE_ANON_KEY`
- Copy: `service_role` key → this is your `SUPABASE_SERVICE_KEY` (admin only, keep secret)

---

## STEP 2 — Run the Database Schema

1. In Supabase dashboard → click **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `SUPABASE_SCHEMA.sql` from this project
4. Copy the entire contents → paste into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success" — your tables are created

---

## STEP 3 — Install Node.js (if not installed)

Download from **https://nodejs.org** → install the LTS version.

Verify: open terminal and type:
```
node --version
npm --version
```
Both should print version numbers.

---

## STEP 4 — Set Up Frontend

Open a terminal in the `streamvault/` folder:

```bash
# 1. Create your .env file
cp .env.template .env
```

Edit `.env` and fill in your Supabase values:
```
REACT_APP_SUPABASE_URL=https://abcdefgh.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

```bash
# 2. Install dependencies
npm install

# 3. Run locally to test
npm start
```
Opens at **http://localhost:3000** — you should see the age gate.

---

## STEP 5 — Set Up Admin Panel

Open a **second** terminal in `streamvault/admin/`:

```bash
# 1. Create admin .env file
# Create a new file called .env inside the admin/ folder with:
REACT_APP_SUPABASE_URL=https://abcdefgh.supabase.co
REACT_APP_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...your_service_role_key...
REACT_APP_ADMIN_USER=admin
REACT_APP_ADMIN_PASS=YourStrongPassword123!

# 2. Install dependencies
npm install

# 3. Run admin locally
npm start
```
Opens at **http://localhost:3001** — you'll see the admin login.

**Default admin credentials** (change these in .env before deploying!):
- Username: `admin`
- Password: `changeme123`

---

## STEP 6 — Upload Your First Video (Admin Panel)

1. Open **http://localhost:3001**
2. Log in with your admin credentials
3. Fill in the form:
   - **Title**: Name of the video
   - **Stream URL**: Your HLS/CDN URL (e.g. `https://cdn.example.com/video.m3u8` or `https://...mp4`)
   - **Thumbnail**: Upload an image file OR paste a thumbnail image URL
   - **Language**: Select from dropdown
   - **Category**: Select from dropdown
   - **Tags**: comma separated (optional)
   - **Published**: Toggle ON to make visible, leave OFF to save as draft
4. Click **Upload Video**

The video appears in the list below. Toggle **Live/Draft** anytime.

### Where to get stream URLs?
- If you have a CDN (BunnyCDN, Cloudflare Stream, etc.) paste the HLS URL
- For testing: use any public `.m3u8` URL from the web
- Format examples:
  - HLS: `https://your-cdn.b-cdn.net/videos/abc123/playlist.m3u8`
  - MP4: `https://your-cdn.b-cdn.net/videos/abc123.mp4`

---

## STEP 7 — Deploy Frontend to Vercel (FREE)

1. Create a GitHub account at **https://github.com** if you don't have one
2. Create a new repository called `streamvault`
3. Push your code:
```bash
cd streamvault
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/streamvault.git
git push -u origin main
```

4. Go to **https://vercel.com** → Sign up with GitHub
5. Click **"Add New Project"** → Import your `streamvault` repo
6. **Important — set environment variables in Vercel:**
   - Click **"Environment Variables"** during setup
   - Add: `REACT_APP_SUPABASE_URL` = your URL
   - Add: `REACT_APP_SUPABASE_ANON_KEY` = your anon key
7. Click **Deploy**

Your site is live in ~2 minutes at `https://streamvault.vercel.app` (or similar).

**Custom domain:** In Vercel → Settings → Domains → Add your domain.

---

## STEP 8 — Deploy Admin Panel to Vercel

Same process, but for the `admin/` subfolder:

1. Create a second repo called `streamvault-admin`
2. Push the contents of `streamvault/admin/` to it:
```bash
cd streamvault/admin
git init
git add .
git commit -m "Admin panel"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/streamvault-admin.git
git push -u origin main
```
3. Import into Vercel as a separate project
4. Set environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_SERVICE_KEY`
   - `REACT_APP_ADMIN_USER`
   - `REACT_APP_ADMIN_PASS`
5. Deploy → **bookmark this URL, it's your private admin portal**

⚠️ Never share the admin URL publicly. Only you should know it.

---

## STEP 9 — Add Your Ad Networks

### TrafficJunky / ExoClick / JuicyAds

**Pre-roll ads (before video):**
1. Sign up at ExoClick.com or JuicyAds.com (easier approval than TrafficJunky)
2. Create a new ad zone → select "Video Pre-roll" or "VAST"
3. Get your VAST tag URL (looks like `https://ads.exoclick.com/vast.php?...`)
4. Open `src/components/VideoPlayer.jsx`
5. Find the `adBox` div and replace the placeholder with your VAST tag:

```jsx
// Replace the adBox div contents with your actual ad embed:
<iframe src="YOUR_AD_URL_HERE" width="100%" height="250" frameBorder="0" />
// OR use a script tag your network provides
```

**Banner ads:**
1. In your ad network, create a "Display Banner" zone (320x50 mobile)
2. Get the embed code
3. Open `src/pages/Feed.jsx` → find `bannerAd` div → paste code inside

**Pop-under:**
1. In your network, create a "Popunder" zone
2. Get the script tag
3. Add it to `public/index.html` just before `</body>` — fires on first click automatically

---

## MONTHLY COST SUMMARY

| Service | Cost |
|---|---|
| Supabase (DB + Auth + Storage) | **FREE** |
| Vercel (Frontend hosting) | **FREE** |
| Vercel (Admin hosting) | **FREE** |
| Domain name | ~₹800/year (~₹70/month) |
| **TOTAL** | **~₹70/month** |

Your only real cost is your domain name.

---

## HOW VIDEO SERVING WORKS

You **never host video files** — you only store:
- The stream URL (HLS/MP4 link from wherever the video lives)
- The thumbnail image (stored in Supabase Storage, free up to 1GB)
- Metadata (title, category, etc.)

When a user plays a video, their browser fetches it directly from the external CDN.
Your server/database is never involved in video bandwidth. This keeps costs at zero.

---

## SECURITY NOTES

1. **Never commit .env files to GitHub** — add `.env` to your `.gitignore`
2. Change your admin password before deploying
3. The `service_role` key bypasses all RLS — only use it in the admin panel
4. The frontend uses only the `anon` key, which is safe to expose

---

## TROUBLESHOOTING

**Video not playing?**
- Check the stream URL is a valid HLS (.m3u8) or MP4 link
- Test it directly in VLC or browser first
- Some sources have CORS restrictions — try a different CDN

**Supabase errors?**
- Double-check your `.env` values match exactly what's in Supabase Settings → API
- Make sure you ran the full SQL schema

**Admin can't upload thumbnail?**
- Make sure you ran the storage bucket SQL in SUPABASE_SCHEMA.sql
- Check the `thumbnails` bucket exists in Supabase Storage tab

**Comments/likes not working?**
- User must be logged in — check the Account tab
- Check browser console for specific error messages
