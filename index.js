// index.js — CLEAN: All whale buys EXCEPT Crypto & Sports — NO TAG LINE
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fetch from 'node-fetch';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const CHAT = process.env.TELEGRAM_CHAT_ID?.trim();

const WALLETS = process.env.WATCH_WALLETS
  ? process.env.WATCH_WALLETS.split(',').map(w => w.trim().toLowerCase()).filter(Boolean)
  : [];

const MIN = Number(process.env.MIN_SIZE) || 10000;
const HOURS = Number(process.env.INTERVAL_HOURS) || 24;
const INTERVAL_MS = HOURS * 60 * 60 * 1000;

const URL_CACHE = new Map();

/* Block Crypto & Sports — return true if market should be SKIPPED */
function isCryptoOrSports(title) {
  const lower = title.toLowerCase();

  if (lower.includes('bitcoin') || lower.includes('eth') || lower.includes('monad') ||
      lower.includes('solana') || lower.includes('crypto') || lower.includes('airdrop') ||
      lower.includes('fdv') || lower.includes('market cap') || lower.includes('token') ||
      lower.includes('nba') || lower.includes('nfl') || lower.includes('mlb') ||
      lower.includes('lakers') || lower.includes('chiefs') || lower.includes('uruguay') ||
      lower.includes('soccer') || lower.includes('football') || lower.includes('win on 20') ||
      lower.includes('ufc') || lower.includes('tennis')) {
    return true;
  }
  return false;
}

/* Helpers */
function formatUSD(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
function esc(text) { return String(text || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

async function getUrl(cid) {
  if (URL_CACHE.has(cid)) return URL_CACHE.get(cid);
  let url = `https://polymarket.com/market/${cid}`;
  try {
    const res = await fetch(`https://gamma-api.polymarket.com/markets?condition_ids=${cid}&limit=1`);
    if (res.ok) {
      const [m] = await res.json();
      if (m?.slug) {
        url = m.event_slug && m.event_slug !== m.slug
          ? `https://polymarket.com/market/${encodeURIComponent(m.event_slug)}/${encodeURIComponent(m.slug)}`
          : `https://polymarket.com/market/${encodeURIComponent(m.slug)}`;
      }
    }
  } catch {}
  URL_CACHE.set(cid, url);
  return url;
}

async function send(text) {
  if (!TOKEN || !CHAT) return;
  const body = { chat_id: CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true };
  try {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (!r.ok && (await r.text()).includes('parse entities')) {
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, parse_mode: undefined, text: text.replace(/<\/?[^>]+>/g, '') })
      });
    }
  } catch (e) { console.error('Send failed:', e.message); }
}

async function sendChunks(entries) {
  let chunk = '';
  for (const e of entries) {
    if ((chunk + e).length > 4000) { await send(chunk); chunk = e + '\n\n'; }
    else chunk += e + '\n\n';
  }
  if (chunk) await send(chunk);
}

/* Main */
(async () => {
  console.log(`\nPolymarket Whale Buys — Crypto & Sports EXCLUDED — ${WALLETS.length} wallets\n`);
  if (WALLETS.length === 0) return console.warn('No wallets');

  const allTrades = [];
  for (const w of WALLETS) {
    try {
      const res = await fetch(`https://data-api.polymarket.com/activity?user=${w}&type=TRADE&limit=200&sortBy=TIMESTAMP`);
      if (res.ok) allTrades.push(...(await res.json()).map(t => ({ ...t, wallet: w })));
    } catch {}
  }

  const cutoff = Date.now() - INTERVAL_MS;
  const buys = allTrades.filter(t => t.side === 'BUY' && t.timestamp * 1000 >= cutoff);
  if (buys.length === 0) return send('<b>No buys found</b>');

  const pos = {};
  for (const t of buys) {
    const k = `${t.conditionId}_${t.outcome}`;
    if (!pos[k]) pos[k] = { title: t.title || 'Unknown', cid: t.conditionId, outcome: t.outcome, usd: 0, shares: 0, buyers: {} };
    const p = pos[k];
    const usd = Number(t.usdcSize || 0);
    p.usd += usd;
    p.shares += Number(t.size || 0);
    p.buyers[t.wallet] = (p.buyers[t.wallet] || 0) + usd;
  }

  const filtered = Object.values(pos)
    .filter(p => p.usd >= MIN && !isCryptoOrSports(p.title))
    .sort((a, b) => b.usd - a.usd);

  if (filtered.length === 0) {
    await send(`<b>No clean buys ≥ ${formatUSD(MIN)} (Crypto/Sports excluded)</b>`);
    return;
  }

  const header = `<b>Polymarket Whale Buys — Crypto & Sports Excluded</b>\nLast ${HOURS}h • ${filtered.length} outcome${filtered.length > 1 ? 's' : ''} ≥ ${formatUSD(MIN)}\n\n`;

  const entries = [];
  for (const [i, p] of filtered.entries()) {
    const url = await getUrl(p.cid);
    const avg = p.shares > 0 ? (p.usd / p.shares).toFixed(3) : '?';

    const whales = Object.entries(p.buyers)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 5)
      .map(([a,u]) => `<a href="https://polymarket.com/profile/${a}">${a.slice(0,6)}…</a> ${Math.round(u/p.usd*100)}%`)
      .join('  |  ');

    const block = [
      `<b><a href="${url}">${esc(p.title)}</a></b> — ${esc(p.outcome)}`,
      `Buy Volume: ${formatUSD(p.usd)} @ $${avg}`,
      `Whales: ${whales || '—'}`,
      ''
    ].join('\n');

    entries.push(i === 0 ? header + block : block);
  }

  await sendChunks(entries);
  console.log(`Sent ${filtered.length} clean alerts\n`);
})();