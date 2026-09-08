import {escapeHtml as h,escapeAttr as a} from '../BUILDER/lib/html.mjs';
import {compositionPatterns,assertComposition} from './registry.mjs';
export function renderComposition(data){
 const spec=compositionPatterns.get(data.pattern);if(!spec)return null;
 const items=data.items||[];assertComposition(data.pattern,items);
 const copy=item=>`<div class="v135-item-copy">${item.eyebrow?`<small>${h(item.eyebrow)}</small>`:''}<h3>${h(item.title||item.label||'')}</h3>${item.value!==undefined?`<strong>${h(item.value)}</strong>`:''}${item.text?`<p>${h(item.text)}</p>`:''}</div>`;
 const entry=(item,index)=>`<li data-v10-role="uiItem"><span class="v135-index" aria-hidden="true">${spec.primitive==='checklist'?'✓':String(index+1).padStart(2,'0')}</span>${copy(item)}</li>`;
 let body;
 if(spec.primitive==='tree'){
   const branch=parent=>`<ol>${items.filter(item=>(item.parent||null)===parent).map(item=>`<li><article data-v10-role="uiItem">${item.edge?`<small class="v135-edge">${h(item.edge)}</small>`:''}${copy(item)}</article>${items.some(child=>child.parent===item.id)?branch(item.id):''}</li>`).join('')}</ol>`;
   body=branch(null);
 }else if(spec.primitive==='quote')body=items.map(item=>`<figure data-v10-role="uiItem"><blockquote>${h(item.title||'')}</blockquote><figcaption>${h(item.text||'')}</figcaption></figure>`).join('');
 else body=`<ol>${items.map(entry).join('')}</ol>`;
 return `<section class="v10-component v135-composition v135-${a(spec.primitive)}" data-v10-component="UIRecipe" data-composition="${a(data.pattern)}"><header>${data.kicker?`<small class="v10-kicker" data-v10-role="kicker">${h(data.kicker)}</small>`:''}<h1 class="v10-title" data-v10-role="title">${h(data.title)}</h1>${data.subtitle?`<p class="v10-subtitle" data-v10-role="subtitle">${h(data.subtitle)}</p>`:''}</header><div class="v135-content">${body}</div>${data.note?`<p class="v10-note">${h(data.note)}</p>`:''}</section>`;
}
