export function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':'&quot;'}[ch]));
}
export function escapeAttr(value=''){ return escapeHtml(value).replace(/`/g,'&#96;'); }
export function safeUrl(value=''){
  const url=String(value).trim();
  if(/^(https?:|data:image\/|blob:|#|\/)/i.test(url)) return escapeAttr(url);
  return '#';
}
export function safeMediaUrl(value=''){
  const url=String(value).trim();
  if(/^(https?:|data:(?:image|video|audio)\/|blob:|\/)/i.test(url)) return escapeAttr(url);
  return '#';
}
export function jsonForHtml(value){ return JSON.stringify(value).replace(/</g,'\\u003c').replace(/-->/g,'--\\>'); }
export function classNames(...values){ return values.flatMap(v=>String(v||'').split(/\s+/)).filter(Boolean).map(v=>v.replace(/[^A-Za-z0-9_-]/g,'')).join(' '); }
