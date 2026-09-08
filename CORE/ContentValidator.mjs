const text=value=>String(value??'').trim();
const words=value=>text(value).split(/\s+/).filter(Boolean);
const wordCount=value=>words(value).length;
const list=(data,...keys)=>keys.map(key=>data?.[key]).find(Array.isArray)||[];

export class ContentValidator {
  review(schema={}){
    const issues=[],checks=[];
    const issue=(severity,code,path,message,repair)=>issues.push({severity,code,path,message,repair});
    const pass=(code,path,message)=>checks.push({status:'pass',code,path,message});
    if(!text(schema.title))issue('error','EMPTY_PRESENTATION_TITLE','title','Presentation title is empty','Provide a concise presentation title.');else pass('PRESENTATION_TITLE','title','Presentation title is present.');
    (schema.slides||[]).forEach((slide,slideIndex)=>{
      const base=`slides[${slideIndex}]`,components=slide.components||[];let slideWords=0,visualUnits=0;
      if(!components.length)issue('error','EMPTY_SLIDE',base,'Slide has no components','Add one primary component.');
      if(components.length>2)issue('warning','MANY_COMPONENTS',base,'More than two components may overload the slide','Split secondary material into another slide.');
      components.forEach((component,componentIndex)=>{
        const path=`${base}.components[${componentIndex}]`,data=component.data||{},titleWords=wordCount(data.title),subtitleWords=wordCount(data.subtitle),bodyWords=wordCount(data.body);
        slideWords+=titleWords+subtitleWords+bodyWords;
        if(!text(data.title)&&!['ImageStoryCard'].includes(component.type))issue('warning','MISSING_COMPONENT_TITLE',`${path}.data.title`,'Component has no visible title','Add a short title or intentionally mark the block decorative.');
        if(titleWords>16)issue('warning','LONG_TITLE',`${path}.data.title`,'Title is too long for projected reading','Reduce the title to roughly 16 words.');
        if(subtitleWords>42)issue('warning','DENSE_SUBTITLE',`${path}.data.subtitle`,'Subtitle is too dense','Split the thought or move detail into cards.');
        if(bodyWords>70)issue('warning','DENSE_BODY',`${path}.data.body`,'Body text is too dense for one slide','Convert detail into cards or a follow-up slide.');
        if(words(data.title).some(word=>word.length>34))issue('warning','LONG_UNBROKEN_WORD',`${path}.data.title`,'A long unbroken word may overflow','Insert a safe break or shorten the term.');
        if(component.type==='GlassCard'){
          const cards=data.cards||[];visualUnits+=cards.length;if(!cards.length)issue('error','EMPTY_CARD_GRID',`${path}.data.cards`,'Card grid has no cards','Provide two to six focused cards.');if(cards.length>6)issue('warning','TOO_MANY_CARDS',`${path}.data.cards`,'More than six cards may become unreadable','Split the grid across slides.');
          cards.forEach((card,index)=>{const cardPath=`${path}.data.cards[${index}]`;slideWords+=wordCount(card.title)+wordCount(card.text)+wordCount(card.detail);if(wordCount(card.title)>12)issue('warning','LONG_CARD_TITLE',`${cardPath}.title`,'Card title is too long','Use a shorter claim.');if(wordCount(card.text)>42)issue('warning','DENSE_CARD',`${cardPath}.text`,'Card contains too much text','Keep the main card under roughly 42 words.');});
        }
        if(component.type==='ImageStoryCard'){
          const images=data.images||[];visualUnits+=images.length;if(!images.length)issue('error','EMPTY_IMAGE_STORY',`${path}.data.images`,'Image story has no images','Provide at least one image.');
          images.forEach((image,index)=>{const imagePath=`${path}.data.images[${index}]`;if(!text(image.src))issue('error','MISSING_IMAGE_SOURCE',`${imagePath}.src`,'Image source is empty','Provide a local, data, or web image URL.');if(!text(image.alt))issue('error','MISSING_ALT_TEXT',`${imagePath}.alt`,'Image alternative text is missing','Describe the visual meaning.');if(!text(image.source))issue('warning','MISSING_IMAGE_CREDIT',`${imagePath}.source`,'Image has no source or credit','Provide a source when the image is not original.');});
        }
        if(component.type==='HeroScene'&&data.video?.src&&!text(data.video.alt))issue('error','MISSING_VIDEO_LABEL',`${path}.data.video.alt`,'Video needs an accessible label','Describe the video content.');
        if(component.type==='Timeline'){const items=data.items||[];visualUnits+=items.length;slideWords+=items.reduce((sum,item)=>sum+wordCount(item.title)+wordCount(item.text),0);if(items.length<2)issue('warning','THIN_TIMELINE',`${path}.data.items`,'Timeline has fewer than two events','Use a hero/card or add another event.');if(items.length>6)issue('warning','DENSE_TIMELINE',`${path}.data.items`,'Timeline has more than six events','Split chronology across slides.');}
        if(component.type==='ComparisonGrid'){const columns=data.columns||[];visualUnits+=columns.length;slideWords+=columns.reduce((sum,column)=>sum+wordCount(column.title)+wordCount(column.text)+list(column,'items').reduce((n,item)=>n+wordCount(typeof item==='string'?item:item.text),0),0);if(columns.length<2||columns.length>3)issue('warning','COMPARISON_SHAPE',`${path}.data.columns`,'Comparison works best with two or three columns','Restructure the comparison.');}
        if(component.type==='ReferencePanel'){const refs=data.references||[];visualUnits+=refs.length;if(refs.length>8)issue('warning','DENSE_REFERENCES',`${path}.data.references`,'Too many references for one projected slide','Split the references.');refs.forEach((ref,index)=>{if(!/^https?:\/\//i.test(ref.url||''))issue('warning','NON_WEB_REFERENCE',`${path}.data.references[${index}].url`,'Reference is not a complete web URL','Provide a canonical HTTP(S) link.');});}
        if(component.type==='UIRecipe'){
          const items=data.items||[],rows=data.rows||[];visualUnits+=items.length+rows.length;slideWords+=items.reduce((sum,item)=>sum+wordCount(item.title)+wordCount(item.text),0)+rows.flat().reduce((sum,cell)=>sum+wordCount(cell),0);
          if(data.pattern==='data-table'){if(!data.headers?.length)issue('warning','UI_TABLE_HEADERS',`${path}.data.headers`,'Data-table recipe has no column headers','Add concise column headers.');if(!rows.length)issue('error','EMPTY_UI_TABLE',`${path}.data.rows`,'Data-table recipe has no rows','Provide at least one row.');if(data.headers?.length&&rows.some(row=>row.length!==data.headers.length))issue('error','UI_TABLE_SHAPE',`${path}.data.rows`,'A data-table row does not match the header count','Align every row with the headers.');}
          else if(!items.length)issue('error','EMPTY_UI_RECIPE',`${path}.data.items`,'UI recipe has no items','Provide content items for the selected pattern.');
          if(items.length>8)issue('warning','DENSE_UI_RECIPE',`${path}.data.items`,'The UI recipe contains many presentation items','Split the pattern across slides.');
        }
        if(component.type==='Charts')for(const[chartIndex,chart]of(data.charts||[]).entries()){
          const chartPath=`${path}.data.charts[${chartIndex}]`,hasValues=Array.isArray(chart.values)&&chart.values.length,hasSeries=Array.isArray(chart.series)&&chart.series.some(series=>Array.isArray(series.values)&&series.values.length),hasPoints=Array.isArray(chart.points)&&chart.points.length,hasMatrix=Array.isArray(chart.matrix)&&chart.matrix.length;
          visualUnits++;if(!hasValues&&!hasSeries&&!hasPoints&&!hasMatrix)issue('error','EMPTY_CHART',chartPath,'Chart has no numeric data','Provide values, series, points, or a matrix.');if(hasValues&&chart.labels?.length&&chart.labels.length!==chart.values.length)issue('error','CHART_LENGTH_MISMATCH',chartPath,'Chart labels and values differ in length','Align every label with a value.');if(hasSeries&&chart.labels?.length&&chart.series.some(series=>series.values.length!==chart.labels.length))issue('error','SERIES_LENGTH_MISMATCH',`${chartPath}.series`,'A chart series does not match label count','Align every series with the labels.');const points=(chart.values?.length||0)+(chart.points?.length||0)+(chart.matrix?.flat?.().length||0);if(points>40)issue('warning','DENSE_CHART',chartPath,'Chart contains many marks for a presentation slide','Aggregate, filter, or split the chart.');if(!text(chart.ariaLabel)&&!text(chart.title))issue('warning','CHART_ACCESSIBILITY',chartPath,'Chart lacks an accessible title','Add title or ariaLabel.');
        }
      });
      const risk=slideWords+visualUnits*8+components.length*12;if(risk>170)issue('warning','PROJECTOR_OVERFLOW_RISK',base,`Estimated slide load is high (${risk})`,'Split the slide or reduce supporting detail.');else pass('PROJECTOR_LOAD',base,`Estimated slide load ${risk} is within the heuristic budget.`);
    });
    const errors=issues.filter(item=>item.severity==='error').length,warnings=issues.filter(item=>item.severity==='warning').length;
    return{version:'13.5.0',valid:errors===0,score:Math.max(0,100-errors*20-warnings*2),issues,checks,summary:{errors,warnings,passes:checks.length}};
  }

  assert(schema,{allowWarnings=true}={}){const report=this.review(schema);if(!report.valid||(!allowWarnings&&report.summary.warnings))throw new Error(`Content validation failed:\n${report.issues.filter(item=>item.severity==='error'||!allowWarnings).map(item=>`  - ${item.path}: ${item.message}`).join('\n')}`);return report}
}
