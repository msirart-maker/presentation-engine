import {normalizeColor} from './color.mjs';
import {renderComposition} from '../../COMPOSITIONS/render.mjs';
import {escapeHtml as h, escapeAttr as a, safeUrl, safeMediaUrl, jsonForHtml, classNames} from './html.mjs';

const icon = name => `<span class="v10-icon" aria-hidden="true">${({up:'↗',down:'↘',check:'✓',spark:'✦',arrow:'→'}[name]||'•')}</span>`;
const textBlock = d => `${d.kicker?`<div class="v10-kicker" data-v10-role="kicker">${h(d.kicker)}</div>`:''}${d.title?`<h1 class="v10-title" data-v10-role="title">${h(d.title)}</h1>`:''}${d.subtitle?`<p class="v10-subtitle" data-v10-role="subtitle">${h(d.subtitle)}</p>`:''}`;

function decorativeVisual(kind='none',label=''){
 if(kind==='orb')return `<canvas class="v10-particle-canvas" data-v10-particles="calm"></canvas><div class="v10-orb"><i></i><i></i><i></i><b>${h(label)}</b></div>`;
 if(kind==='geometry')return `<div class="v135-geometry" aria-hidden="true"><i></i><i></i><i></i></div>`;
 if(kind==='lines')return `<div class="v135-lines" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`;
 return '';
}
function renderHero(d){
  const stats=(d.stats||[]).map((s,i)=>`<div class="v10-hero-stat" data-v10-role="stat"><strong ${s.count!==undefined?`data-v10-count="${a(s.count)}"`:''}>${h(s.value??s.count??'')}</strong><span>${h(s.label||'')}</span></div>`).join('');
  const media=d.video?.src?`<figure class="v10-hero-media is-video"><video data-v10-video src="${safeMediaUrl(d.video.src)}"${d.video.poster?` poster="${safeUrl(d.video.poster)}"`:''} ${d.video.autoplay===false?'':'autoplay'} ${d.video.loop===false?'':'loop'} ${d.video.muted===false?'':'muted'} playsinline ${d.video.controls?'controls':''} aria-label="${a(d.video.alt||d.video.title||'Presentation video')}"></video><figcaption><small>${h(d.video.label||'Motion story')}</small><h3>${h(d.video.title||d.visualLabel||'')}</h3>${d.video.caption?`<p>${h(d.video.caption)}</p>`:''}</figcaption></figure>`:d.image?.src?`<figure class="v10-hero-media" tabindex="0" role="button" aria-label="Open ${a(d.image.alt||d.image.title||'hero image')}" data-v10-lightbox data-v10-source="${safeUrl(d.image.source||'')}" data-v10-caption="${a(d.image.caption||d.image.title||'')}"><img src="${safeUrl(d.image.src)}" alt="${a(d.image.alt||d.image.title||'Hero image')}" loading="eager" decoding="async"><figcaption><small>${h(d.image.label||'Visual story')}</small><h3>${h(d.image.title||d.visualLabel||'')}</h3>${d.image.caption?`<p>${h(d.image.caption)}</p>`:''}</figcaption></figure>`:decorativeVisual(d.visual||'none',d.visualLabel);
  return `<section class="v10-component v10-hero ${classNames(d.layout||'split')} v135-opening-${a(d.variant||'title')} ${!d.image?.src&&!d.video?.src&&(!d.visual||d.visual==='none')?'v135-type-only':''}" data-v10-component="HeroScene">`+
    `<div class="v10-hero-copy">${textBlock(d)}${d.body?`<p class="v10-body">${h(d.body)}</p>`:''}${d.cta?`<button class="v10-cta" data-v10-action="${a(d.cta.action||'next')}">${h(d.cta.label||'Continue')} ${icon('arrow')}</button>`:''}${stats?`<div class="v10-hero-stats">${stats}</div>`:''}</div>`+
    `<div class="v10-hero-visual ${d.image?.src||d.video?.src?'has-media':''}" data-v10-role="heroVisual"${d.image?.src||d.video?.src?'':' aria-hidden="true"'}>${media}</div></section>`;
}

function renderCards(d){
  const cards=(d.cards||[]).map((card,i)=>{const reveal=card.detail?` data-v10-reveal tabindex="0" role="button" aria-expanded="false" aria-label="Reveal details for ${a(card.title||'card')}"`:'';return `<article class="v10-glass-card tone-${a(card.tone||['ember','teal','gold','blue'][i%4])}" data-v10-role="card"${reveal}>${card.eyebrow?`<small>${h(card.eyebrow)}</small>`:''}<h3>${h(card.title||'')}</h3>${card.value!==undefined?`<strong class="v10-card-value" ${card.count!==false?`data-v10-count="${a(card.value)}"`:''}>${h(card.value)}</strong>`:''}${card.text?`<p>${h(card.text)}</p>`:''}${card.tags?`<div class="v10-tags">${card.tags.map(t=>`<span>${h(t)}</span>`).join('')}</div>`:''}${card.detail?`<div class="v10-reveal-detail"><span>${h(card.detail)}</span><em>Tap to close</em></div>`:''}</article>`}).join('');
  return `<section class="v10-component v10-card-section" data-v10-component="GlassCard">${textBlock(d)}<div class="v10-glass-grid cols-${a(d.columns||3)}" data-v10-role="cardGrid">${cards}</div>${d.note?`<p class="v10-note">${h(d.note)}</p>`:''}</section>`;
}

function renderImages(d){
  const images=(d.images||[]).map((item,i)=>`<figure class="v10-image-card ${i===0&&d.featured?'featured':''}" data-v10-role="imageCard" tabindex="0" role="button" data-v10-lightbox data-v10-source="${safeUrl(item.source||'')}" data-v10-caption="${a(item.caption||item.title||'')}"><div class="v10-image-frame"><img src="${safeUrl(item.src||'')}" alt="${a(item.alt||item.title||'Story image')}" loading="${i?'lazy':'eager'}" decoding="async"></div><figcaption>${item.label?`<small>${h(item.label)}</small>`:''}<h3>${h(item.title||'')}</h3>${item.caption?`<p>${h(item.caption)}</p>`:''}</figcaption></figure>`).join('');
  return `<section class="v10-component v10-image-story" data-v10-component="ImageStoryCard">${textBlock(d)}<div class="v10-image-grid count-${Math.min(4,(d.images||[]).length)}">${images}</div></section>`;
}

function renderTimeline(d){
  const items=(d.items||[]).map((item,i)=>`<article class="v10-timeline-item tone-${a(item.tone||'ember')}" data-v10-role="timelineItem"><div class="v10-time-marker"><span>${String(i+1).padStart(2,'0')}</span></div><div><small>${h(item.date||'')}</small><h3>${h(item.title||'')}</h3><p>${h(item.text||'')}</p>${item.metric?`<strong>${h(item.metric)}</strong>`:''}</div></article>`).join('');
  return `<section class="v10-component v10-timeline-section" data-v10-component="Timeline">${textBlock(d)}<div class="v10-timeline">${items}</div></section>`;
}

function chartTable(c){
  const caption=`<caption>${h(c.title||'Chart data')}</caption>`;
  if(c.matrix?.length){const heads=(c.xLabels||c.matrix[0].map((_,index)=>index+1)).map(label=>`<th scope="col">${h(label)}</th>`).join('');const rows=c.matrix.map((row,index)=>`<tr><th scope="row">${h(c.yLabels?.[index]||index+1)}</th>${row.map(value=>`<td>${h(value)}</td>`).join('')}</tr>`).join('');return `<table>${caption}<thead><tr><th></th>${heads}</tr></thead><tbody>${rows}</tbody></table>`}
  if(c.points?.length)return `<table>${caption}<thead><tr><th>Label</th><th>X</th><th>Y</th><th>Size</th></tr></thead><tbody>${c.points.map((point,index)=>`<tr><th scope="row">${h(point.label||index+1)}</th><td>${h(point.x)}</td><td>${h(point.y)}</td><td>${h(point.r??point.value??'')}</td></tr>`).join('')}</tbody></table>`;
  if(c.series?.length){const heads=c.series.map(series=>`<th scope="col">${h(series.name||'Series')}</th>`).join(''),labels=c.labels||c.series[0].values?.map((_,index)=>index+1)||[];return `<table>${caption}<thead><tr><th>Category</th>${heads}</tr></thead><tbody>${labels.map((label,index)=>`<tr><th scope="row">${h(label)}</th>${c.series.map(series=>`<td>${h(series.values?.[index]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
  return `<table>${caption}<thead><tr><th>Category</th><th>Value</th></tr></thead><tbody>${(c.values||[]).map((value,index)=>`<tr><th scope="row">${h(c.labels?.[index]??index+1)}</th><td>${h(value)}${h(c.unit||'')}</td></tr>`).join('')}</tbody></table>`;
}

function chartLegend(c){
 const palette=['#e97852','#24a99a','#e3b341','#6d8dd1','#c069ca','#58a86f','#d46a8c','#7d8a96'];
 const entries=c.series?.length>1?c.series.map((x,i)=>({text:x.name||`Series ${i+1}`,color:c.colors?.[i]||x.color||palette[i%palette.length]})):c.chartType==='donut'?(c.values||[]).map((v,i)=>({text:`${c.labels?.[i]??i+1} · ${v}${c.unit||''}`,color:c.colors?.[i]||palette[i%palette.length]})):[];
 return entries.length?`<ul class="v135-chart-legend" aria-label="Chart legend">${entries.map(x=>`<li><i aria-hidden="true" style="background:${normalizeColor(x.color)}"></i><span>${h(x.text)}</span></li>`).join('')}</ul>`:'';
}
function renderCharts(d){
  const charts=(d.charts||[d]).map((c,i)=>`<article class="v10-chart-card"><div class="v10-chart-head"><div><small>${h(c.eyebrow||'Data')}</small><h3>${h(c.title||'Chart')}</h3></div>${c.highlight?`<span>${h(c.highlight)}</span>`:''}</div><div class="v10-chart-wrap"><canvas class="v10-chart" tabindex="0" aria-label="${a(c.ariaLabel||c.title||'Data chart')}" data-v10-chart='${a(jsonForHtml({domLegend:true,type:c.chartType||'line',labels:c.labels||[],values:c.values||[],series:c.series||[],points:c.points||[],matrix:c.matrix||[],xLabels:c.xLabels||[],yLabels:c.yLabels||[],unit:c.unit||'',min:c.min,max:c.max,target:c.target,total:c.total,colors:c.colors||[],criticalIndex:c.criticalIndex,centerLabel:c.centerLabel,reasons:c.reasons||[],referenceLines:c.referenceLines||[],annotations:c.annotations||[]}))}'></canvas></div>${chartLegend(c)}<details class="v13-chart-data"><summary>View accessible data table for ${h(c.title||'chart')}</summary>${chartTable(c)}</details></article>`).join('');
  return `<section class="v10-component v10-charts-section" data-v10-component="Charts">${textBlock(d)}<div class="v10-charts-grid count-${Math.min(2,(d.charts||[d]).length)}">${charts}</div></section>`;
}

function renderComparison(d){
  const columns=(d.columns||[]).map((col,i)=>`<article class="v10-comparison-column tone-${a(col.tone||['ember','teal','blue'][i%3])}" data-v10-role="comparisonColumn"><small>${h(col.eyebrow||'')}</small><h3>${h(col.title||'')}</h3>${col.text?`<p>${h(col.text)}</p>`:''}<ul>${(col.items||[]).map(item=>`<li>${icon(item.state==='positive'?'check':'arrow')}<span>${h(typeof item==='string'?item:item.text)}</span></li>`).join('')}</ul></article>`).join('');
  return `<section class="v10-component v10-comparison" data-v10-component="ComparisonGrid">${textBlock(d)}<div class="v10-comparison-grid count-${Math.min(3,(d.columns||[]).length)}">${columns}</div>${d.conclusion?`<div class="v10-conclusion">${h(d.conclusion)}</div>`:''}</section>`;
}

function renderReferences(d){
  const refs=(d.references||[]).map((ref,i)=>`<a class="v10-reference" href="${safeUrl(ref.url||'#')}" target="_blank" rel="noopener noreferrer" data-v10-role="reference"><span>${h(ref.number||String(i+1).padStart(2,'0'))}</span><div><h3>${h(ref.title||'')}</h3><p>${h(ref.citation||'')}</p></div>${icon('up')}</a>`).join('');
  return `<section class="v10-component v10-references" data-v10-component="ReferencePanel">${textBlock(d)}<div class="v10-reference-grid">${refs}</div>${d.note?`<p class="v10-note">${h(d.note)}</p>`:''}</section>`;
}

function renderUIRecipe(d){
  const composition=renderComposition(d);if(composition)return composition;
  const pattern=d.pattern||'feature-grid',items=d.items||[],columns=Math.max(1,Math.min(4,Number(d.columns)||Math.min(4,Math.max(2,items.length))));
  if(pattern==='data-table'){
    const headers=d.headers||[],rows=d.rows||[];
    return `<section class="v10-component v13-ui-recipe v13-ui-data" data-v10-component="UIRecipe">${textBlock(d)}<div class="v13-ui-table-wrap" data-v10-role="uiItem"><table class="v13-ui-table"><caption>${h(d.caption||d.title||'Data table')}</caption>${headers.length?`<thead><tr>${headers.map(header=>`<th scope="col">${h(header)}</th>`).join('')}</tr></thead>`:''}<tbody>${rows.map(row=>`<tr>${row.map((cell,index)=>index===0?`<th scope="row">${h(cell)}</th>`:`<td>${h(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="v135-table-cards">${rows.map(row=>`<article><h3>${h(row[0]??'')}</h3><dl>${row.slice(1).map((cell,index)=>`<div><dt>${h(headers[index+1]||'Column '+(index+2))}</dt><dd>${h(cell)}</dd></div>`).join('')}</dl></article>`).join('')}</div></div>${d.note?`<p class="v10-note">${h(d.note)}</p>`:''}</section>`;
  }
  if(pattern==='accordion'){
    const details=items.map((item,index)=>`<details data-v10-role="uiItem"${index===0?' open':''}><summary>${h(item.title||item.label||`Item ${index+1}`)}</summary><p>${h(item.text||'')}</p></details>`).join('');
    return `<section class="v10-component v13-ui-recipe" data-v10-component="UIRecipe">${textBlock(d)}<div class="v13-ui-accordion">${details}</div>${d.note?`<p class="v10-note">${h(d.note)}</p>`:''}</section>`;
  }
  if(pattern==='progress-list'){
    const entries=items.map((item,index)=>{const progress=Math.max(0,Math.min(100,Number(item.progress??item.value??0)));return `<article class="v13-ui-item tone-${a(item.tone||['ember','teal','gold','blue'][index%4])}" data-v10-role="uiItem"><div><small>${h(item.eyebrow||item.label||'Progress')}</small><h3>${h(item.title||'')}</h3></div><div class="v13-ui-track" aria-label="${a(item.title||'Progress')}: ${progress}%"><i style="--ui-progress:${progress}%"></i></div><strong>${h(progress)}%</strong></article>`}).join('');
    return `<section class="v10-component v13-ui-recipe" data-v10-component="UIRecipe">${textBlock(d)}<div class="v13-ui-progress">${entries}</div>${d.note?`<p class="v10-note">${h(d.note)}</p>`:''}</section>`;
  }
  const classByPattern={'bento-grid':'v13-ui-grid v13-ui-bento','feature-grid':'v13-ui-grid','metric-strip':'v13-ui-grid v13-ui-metrics','callout-stack':'v13-ui-callouts','stepper':'v13-ui-stepper','status-grid':'v13-ui-grid v13-ui-status'},container=classByPattern[pattern]||'v13-ui-grid';
  const entries=items.map((item,index)=>`<article class="v13-ui-item tone-${a(item.tone||['ember','teal','gold','blue'][index%4])}" data-v10-role="uiItem">${item.eyebrow||item.label?`<small>${h(item.eyebrow||item.label)}</small>`:''}<div><h3>${h(item.title||'')}</h3>${item.value!==undefined?`<strong class="v13-ui-value" data-v10-count="${a(item.value)}"${item.prefix?` data-v10-prefix="${a(item.prefix)}"`:''}${item.suffix?` data-v10-suffix="${a(item.suffix)}"`:''}${Number.isInteger(item.decimals)?` data-v10-decimals="${a(item.decimals)}"`:''}>${h(`${item.prefix||''}${item.value}${item.suffix||''}`)}</strong>`:''}${item.text?`<p>${h(item.text)}</p>`:''}</div></article>`).join('');
  return `<section class="v10-component v13-ui-recipe" data-v10-component="UIRecipe">${textBlock(d)}<div class="${container}" style="--ui-columns:${columns}">${entries}</div>${d.note?`<p class="v10-note">${h(d.note)}</p>`:''}</section>`;
}

function renderClosing(d){
  return `<section class="v10-component v10-closing v135-closing-${a(d.variant||'statement')} ${!d.visual||d.visual==='none'?'v135-type-only':''}" data-v10-component="ClosingScene"><div class="v10-closing-copy">${d.kicker?`<div class="v10-kicker">${h(d.kicker)}</div>`:''}<h1 class="v10-title" data-v10-role="title">${h(d.title||'Thank you')}</h1>${d.quote?`<blockquote data-v10-role="quote">${h(d.quote)}</blockquote>`:''}${d.credit?`<p class="v10-credit">${h(d.credit)}</p>`:''}</div><div class="v10-closing-visual" data-v10-role="heroVisual" aria-hidden="true">${decorativeVisual(d.visual||'none',d.visualLabel)}</div></section>`;
}

const renderers={HeroScene:renderHero,GlassCard:renderCards,ImageStoryCard:renderImages,Timeline:renderTimeline,Charts:renderCharts,ComparisonGrid:renderComparison,ReferencePanel:renderReferences,ClosingScene:renderClosing,UIRecipe:renderUIRecipe};

export function renderComponent(component,index){
  const renderer=renderers[component.type];
  if(!renderer) throw new Error(`No renderer registered for ${component.type}`);
  const id=component.id?` id="${a(component.id)}"`:'';
  const role=component.role?` data-v10-role="${a(component.role)}"`:'';
  return `<div${id}${role} class="v10-component-shell ${classNames(component.className)}" data-v10-component-index="${index}" data-v10-variation="${a(component.variation||'standard')}">${renderer(component.data||{})}</div>`;
}

export function renderSlide(slide,index){
  const components=slide.components.map(renderComponent).join('\n');
  const animations=jsonForHtml(slide.animations||[]);
  const surface=slide.surface||(['storm'].includes(slide.phase)?'deep':slide.phase==='calm'?'calm':'light');
  const design=slide.design||{},styleParts=[];if(design.accent){styleParts.push(`--v10-slide-accent:${a(design.accent)}`,`--v10-slide-accent-soft:${a(design.accentSoft||design.accent)}`)}if(slide.__typography?.scale)styleParts.push(`--v13-slide-type-scale:${a(slide.__typography.scale)}`);const style=styleParts.length?` style="${styleParts.join(';')}"`:'';
  return `<section class="v10-slide surface-${a(surface)} phase-${a(slide.phase||'neutral')} ${classNames(slide.className)}" id="${a(slide.id)}" data-v10-slide-index="${index}" data-v10-density="${a(slide.density||slide.__typography?.density||'balanced')}" data-v10-accent="${a(slide.accent||'ember')}" data-v13-overflow-risk="${a(slide.__responsive?.overflowRisk||slide.__typography?.overflowRisk||'low')}" data-v13-mobile-layout="${a(slide.__responsive?.mobile||'stack')}"${style} aria-label="${a(slide.ariaLabel||`Slide ${index+1}`)}">${components}<script type="application/json" class="v10-animation-plan">${animations}</script></section>`;
}
