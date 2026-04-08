// ============================================================
//  PODCIRCUIT — DATABASE CONFIG
//  Fill in your two values from Supabase, then save this file.
//  You only need to edit this one file — everything else works.
// ============================================================

// STEP 1: Go to supabase.com → your project → Settings → API
// Paste your "Project URL" below (looks like https://xxxx.supabase.co)
const SUPABASE_URL = 'https://bluimgtbmbhjcnuzacfk.supabase.co';

// STEP 2: Paste your "anon public" key below (long string of letters/numbers)
const SUPABASE_ANON_KEY = 'sb_publishable_tp_thhU8RMpEE6c3lC3flA__WV35HX2';
// STEP 3: Go to formspree.io → your form → copy the ID from the URL
// (looks like: formspree.io/f/abcd1234 — just paste the "abcd1234" part)
const FORMSPREE_ID = 'YOUR_FORMSPREE_ID';

// STEP 4: Change this to your own email — you'll get notified of new submissions
const ADMIN_EMAIL = 'your@email.com';

// STEP 5: Change the admin dashboard password
// (also change it inside podcircuit-admin.html — search for "podcircuit2026")
const ADMIN_PASSWORD = 'podcircuit2026';

// ============================================================
//  DO NOT EDIT BELOW THIS LINE
// ============================================================

// Load Supabase client library
const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

// Initialize Supabase
let _supabase = null;

async function getSupabase() {
  if (_supabase) return _supabase;
  if (!window.supabase) {
    await loadScript(SUPABASE_CDN);
  }
  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _supabase;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── PROFILE FUNCTIONS ──────────────────────────────────────

// Save or update a guest profile
async function dbSaveProfile(profileData) {
  const db = await getSupabase();
  const { data, error } = await db
    .from('guest_profiles')
    .upsert({
      user_id: profileData.userId,
      email: profileData.email,
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      title: profileData.title,
      city: profileData.city,
      website: profileData.website,
      story: profileData.story,
      turning_pt: profileData.turningPt,
      achieve: profileData.achieve,
      ig_handle: profileData.igH, ig_followers: profileData.igF,
      tt_handle: profileData.ttH, tt_followers: profileData.ttF,
      yt_url: profileData.ytU,    yt_subs: profileData.ytS,
      tw_handle: profileData.twH, tw_followers: profileData.twF,
      li_url: profileData.liU,    li_followers: profileData.liF,
      categories: profileData.categories,
      points: profileData.points,
      availability: profileData.availability,
      format: profileData.format,
      pod_exp: profileData.podExp,
      clip: profileData.clip,
      photo_url: profileData.photo,
      status: profileData.status,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  return { data, error };
}

// Load a guest profile by userId
async function dbLoadProfile(userId) {
  const db = await getSupabase();
  const { data, error } = await db
    .from('guest_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
}

// Get all approved profiles (for browse page)
async function dbGetApprovedProfiles() {
  const db = await getSupabase();
  const { data, error } = await db
    .from('guest_profiles')
    .select('*')
    .eq('status', 'approved')
    .order('updated_at', { ascending: false });
  return { data: data || [], error };
}

// Get all pending profiles (for admin)
async function dbGetPendingProfiles() {
  const db = await getSupabase();
  const { data, error } = await db
    .from('guest_profiles')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false });
  return { data: data || [], error };
}

// Get all profiles by status (for admin)
async function dbGetProfilesByStatus(status) {
  const db = await getSupabase();
  const { data, error } = await db
    .from('guest_profiles')
    .select('*')
    .eq('status', status)
    .order('updated_at', { ascending: false });
  return { data: data || [], error };
}

// Delete a profile permanently
async function dbDeleteProfile(userId) {
  const db = await getSupabase();
  const { data, error } = await db
    .from('guest_profiles')
    .delete()
    .eq('user_id', userId);
  return { data, error };
}

// Update a profile status (approve / reject)
async function dbUpdateStatus(userId, status) {
  const db = await getSupabase();
  const { data, error } = await db
    .from('guest_profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  return { data, error };
}

// Submit for review
async function dbSubmitForReview(userId) {
  const db = await getSupabase();
  const { data, error } = await db
    .from('guest_profiles')
    .update({
      status: 'pending',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
  return { data, error };
}

// Send email notification via Formspree
async function sendEmailNotification(profileData) {
  if (!FORMSPREE_ID || FORMSPREE_ID === 'YOUR_FORMSPREE_ID') return;
  try {
    await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: (profileData.firstName || '') + ' ' + (profileData.lastName || ''),
        email: profileData.email,
        title: profileData.title,
        city: profileData.city,
        categories: (profileData.categories || []).join(', '),
        instagram_followers: profileData.igF,
        tiktok_followers: profileData.ttF,
        youtube_subscribers: profileData.ytS,
        story_preview: (profileData.story || '').slice(0, 200),
        submitted_at: new Date().toLocaleString()
      })
    });
  } catch(e) {
    console.log('Email notification failed silently:', e);
  }
}

// ── SIMPLE AUTH (localStorage-based, works without a backend) ──
// NOTE: For production, swap this with Supabase Auth
// by calling: db.auth.signUp / db.auth.signInWithPassword

function authGetUsers() {
  try { return JSON.parse(localStorage.getItem('pc_db') || '{}'); } catch(e) { return {}; }
}
function authSaveUsers(u) { localStorage.setItem('pc_db', JSON.stringify(u)); }

function authRegister(name, email, pw) {
  const users = authGetUsers();
  if (users[email]) return { error: 'An account with that email already exists.' };
  if (pw.length < 6) return { error: 'Password must be at least 6 characters.' };
  const parts = name.split(' ');
  const userId = 'u_' + email.replace(/[^a-z0-9]/gi, '_') + '_' + Date.now();
  users[email] = {
    name, email, pw, userId,
    profile: { firstName: parts[0]||'', lastName: parts.slice(1).join(' ')||'', email, userId, status: 'draft' }
  };
  authSaveUsers(users);
  return { user: users[email] };
}

function authLogin(email, pw) {
  const users = authGetUsers();
  if (!users[email] || users[email].pw !== pw) return { error: 'Wrong email or password.' };
  return { user: users[email] };
}

function authSaveProfile(email, profile) {
  const users = authGetUsers();
  if (!users[email]) return;
  users[email].profile = profile;
  authSaveUsers(users);
}

function authGetLastUser() {
  const last = localStorage.getItem('pc_last');
  if (!last) return null;
  const users = authGetUsers();
  return users[last] || null;
}

function authSetLastUser(email) { localStorage.setItem('pc_last', email); }
function authClearLastUser() { localStorage.removeItem('pc_last'); }

console.log('%c🎙 PodCircuit loaded. Supabase: ' + (SUPABASE_URL !== 'https://bluimgtbmbhjcnuzacfk.supabase.co' ? '✅ Connected' : '⚠️ Not configured — using local storage'), 'color: #c9a84c; font-weight: bold;');
