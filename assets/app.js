'use strict';
const {works, topics} = window.GRADIVO;
const hasTopics = topics.length > 0;
document.querySelector('nav a[href="#teme"]').hidden = !hasTopics;
const {people, analysis, editions} = window.BERILO;
const study = window.STUDY;
const main = document.querySelector('main');
const norm = value => value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const eraList = Object.keys(study.periodIds);
const badge = s => '<span class="tag">'+esc(s)+'</span>';
const number = n => String(n).padStart(2,'0');
const href = (kind,id) => '#' + kind + '/' + id;
const heading = (title, desc='', label='') => '<header class="heading">'+(label?'<p class="eyebrow">'+esc(label)+'</p>':'')+'<h1>'+esc(title)+'</h1>'+(desc?'<p>'+esc(desc)+'</p>':'')+'</header>';
const card = (title,body) => '<section class="card"><h2>'+esc(title)+'</h2>'+body+'</section>';
const text = p => '<p>'+esc(p)+'</p>';
const ext = (url,label) => '<a href="'+esc(url)+'">'+esc(label)+'</a>';
const link = (kind,item) => '<a class="textlink" href="'+href(kind,item.id)+'">'+esc(item.title)+'</a>';
const back = (path,label) => '<a class="back" href="#'+path+'"><span aria-hidden="true">‹</span>'+label+'</a>';
const flow = steps => '<ol class="flow">'+steps.map(s=>'<li><span>'+esc(s)+'</span></li>').join('')+'</ol>';
const workRow = w => '<li><a class="row" href="'+href('delo',w.id)+'"><span class="index">'+number(w.n)+'</span><span><strong>'+esc(w.title)+'</strong><small>'+esc(w.author)+' · '+esc(w.era)+'</small></span>'+badge(w.genre)+'<span aria-hidden="true">›</span></a></li>';
const topicRow = t => '<li><a class="row" href="'+href('tema',t.id)+'"><span class="index">'+number(t.n)+'</span><span><strong>'+esc(t.title)+'</strong><small>'+esc(t.kind)+'</small></span>'+badge(t.kind)+'<span aria-hidden="true">›</span></a></li>';
const links = (label,items) => items.length ? card(label,'<div class="epohe">'+items.join('')+'</div>') : '';
const storageKey = 'berilo-zaznamki-v1';
let saved = [];
let storageError = false;
try { const data = JSON.parse(localStorage.getItem(storageKey) || '[]'); if(Array.isArray(data)) saved = data.filter(id=>works.some(w=>w.id===id)); }
catch { storageError = true; }
function storeSaved(next) {
  try { localStorage.setItem(storageKey,JSON.stringify(next)); saved = next; return true; }
  catch { return false; }
}
const filters = {workQuery:'',era:'',topicQuery:'',kind:''};
const expandedEras = new Set();
let workView = 'obdobja';
let lastWork = null;
try {
  if (localStorage.getItem('berilo-work-view') === 'seznam') workView = 'seznam';
  lastWork = works.find(w => w.id === Number(localStorage.getItem('berilo-last-work')));
} catch { /* The current tab still works without storage. */ }
const eraPaths = ['M2 8l10-5 10 5zM4 20h16M6 10v8m6-8v8m6-8v8','M3 21V7h5v5h3V3h3v9h3V7h4v14zM10 21v-4h4v4','M3 20V4h18v16zM6 17l4-7 3 4 2-3 3 6','M4 20l13-13m-6 3c-5 0-7 3-7 6 4 0 6-2 7-6zm3-3c0-4 2-5 5-5 0 4-2 5-5 5','M8 16c0-3-3-3-3-7a7 7 0 0 1 14 0c0 4-3 4-3 7zm0 4h8m-6 2h4','M2 19l8-11 4 5 3-3 5 9zM16 5h5','M3 20V9h5v11m0 0V5h8v15m0 0V11h5v9zM11 8h2m-2 4h2m-2 4h2','M12 21V11m0 1C5 13 4 8 5 4c3 0 6 1 7 5 1-4 4-5 7-5 1 4 0 9-7 8z','M3 4h8v7H3zm10 9h8v7h-8zM5 20l14-15','M2 17h7l2-11 4 12 2-7h5','M3 19V5c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2zm9-12v14'];
function eraIcon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+eraPaths[eraList.indexOf(name)]+'"/></svg>';
}
const eraButton = name => '<button class="era-button" type="button" data-era-info="'+esc(name)+'">'+eraIcon(name)+'<span>'+esc(name)+'</span><span aria-hidden="true">↗</span></button>';
const eraDialog = '<dialog class="era-dialog era-dialog--period" aria-labelledby="era-title"><div class="dialog-body"></div></dialog>';

function showEra(name, trigger) {
  const dialog = main.querySelector('.era-dialog--period');
  const period = study.periods[name];
  if (!period || !dialog) return;
  const labels = ['Zgodovinsko ozadje','Lirika','Pripovedništvo','Dramatika','Teme in ideje','Predstavniki'];
  const guide = study.periodGuides[name];
  const sections = guide ? Object.entries(guide) : labels.map((label,i)=>[label,period[i+1]]);
  const sources = study.periodSources[name] || [['https://ojs-gr.zrc-sazu.si/primerjalna_knjizevnost/article/view/3114','Literarne smeri in obdobja · ZRC SAZU']];
  dialog.querySelector('.dialog-body').innerHTML = '<header class="dialog-header"><div class="era-heading">'+eraIcon(name)+'<div><p class="eyebrow">'+esc(period[0])+'</p><h2 id="era-title">'+esc(name)+'</h2></div></div><button class="chip" type="button" data-dialog-close autofocus aria-label="Zapri pregled obdobja">Zapri</button></header>'+
    (guide?'<div class="epohe era-jump" aria-label="Poglavja">'+sections.map(([label],index)=>'<button class="chip" type="button" data-era-jump="'+index+'">'+esc(label)+'</button>').join('')+'</div>':'')+
    '<div class="era-facts">'+sections.map(([label,items])=>paragraphCard(label,items)).join('')+'</div>'+
    '<footer class="toolbar"><a class="textlink" href="#dela/'+encodeURIComponent(name)+'" data-era-route>Dela iz tega obdobja</a>'+sourcePanel(sources)+'<button class="chip" type="button" data-feedback-era="'+esc(name)+'">Sporoči napako</button></footer>';
  dialog.scrollTop=0;
  dialog.querySelector('[data-dialog-close]').onclick=()=>dialog.close();
  const cards=[...dialog.querySelectorAll('.era-facts>.card')];
  const focusSection=(index,trait)=>{
    const target=cards[index];
    target.querySelector('.era-point-current')?.classList.remove('era-point-current');
    const point=trait && [...target.querySelectorAll('li')].reverse().find(item=>item.textContent.toLowerCase().includes(trait.toLowerCase()));
    point?.classList.add('era-point-current');
    const focusTarget=point || target.querySelector('h2');
    focusTarget.tabIndex=-1;
    focusTarget.focus({preventScroll:true});
    focusTarget.scrollIntoView({block:'start'});
  };
  dialog.querySelectorAll('[data-era-jump]').forEach(button=>{
    button.onclick=()=>focusSection(Number(button.dataset.eraJump));
  });
  dialog.querySelector('[data-era-route]').onclick=()=>{
    dialog.close();
    filters.workQuery='';
    filters.era=name;
    if (location.hash==='#dela/'+encodeURIComponent(name)) render();
  };
  dialog.addEventListener('close',()=>{if(trigger.isConnected)trigger.focus();},{once:true});
  dialog.showModal();
  const initialSection=sections.findIndex(([label])=>label===trigger.dataset.eraSection);
  if(initialSection>=0) focusSection(initialSection,trigger.textContent.trim());
}

function home() {
  const destinations = [
    ['#dela','Književna dela',works.length,'Avtorji, besedila in analiza']
  ];
  if(hasTopics) destinations.push(['#teme','Tretje vprašanje',topics.length,'Književnost in jezik']);
  const resume = lastWork ? '<a class="button" href="'+href('delo',lastWork.id)+'">'+esc(lastWork.title)+' <span aria-hidden="true">↗</span></a><p class="muted">'+esc(lastWork.author+' · '+lastWork.era)+'</p>' : '<a class="button" href="#dela">Izberi delo <span aria-hidden="true">↗</span></a>';
  return '<header class="overview glass"><div><p class="eyebrow">'+(hasTopics?'Književnost in jezik':'Književnost')+'</p><h1>Slovenščina</h1></div><div class="lens" aria-hidden="true"></div></header>'+
    '<section class="dashboard-grid home-grid" aria-label="Gradivo">'+destinations.map(([path,title,count,label])=>
      '<a class="card metric" href="'+path+'"><span class="metric-label">'+title+'</span><strong>'+count+'</strong><span>'+label+'</span><span class="arrow" aria-hidden="true">↗</span></a>').join('')+'</section>'+
    '<section class="card study-home"><div class="resume"><h2>Nadaljuj učenje</h2>'+resume+'</div><div><h2>Literarna obdobja</h2><div class="era-timeline">'+eraList.map(eraButton).join('')+'</div></div></section>'+eraDialog;
}
function workList(era) {
  if(eraList.includes(era)) filters.era = era;
  return heading('Književna dela','Dela po označenem izboru za ustni izpit 2027.')+
    '<div class="controls"><label>Iskanje<input type="search" id="work-query" placeholder="Naslov ali avtor" value="'+esc(filters.workQuery)+'"></label><label>Obdobje<select id="era"><option value="">Vsa obdobja in sklopi</option>'+
    eraList.map(e=>'<option'+(filters.era===e?' selected':'')+'>'+esc(e)+'</option>').join('')+'</select></label></div>'+
    '<div class="work-options"><div class="epohe" role="group" aria-label="Prikaz del">'+[['obdobja','Po obdobjih'],['seznam','Seznam']].map(([mode,label])=>'<button class="chip" type="button" data-work-view="'+mode+'" aria-pressed="'+(workView===mode)+'">'+label+'</button>').join('')+'</div><a class="textlink" href="#zaznamki">Zaznamki'+(saved.length?' ('+saved.length+')':'')+'</a></div><p id="count" class="result-count" role="status"></p><div id="results"></div>'+eraDialog;
}
function refreshWorks() {
  const q = norm(filters.workQuery.trim());
  const items = works.filter(w=>(!filters.era || w.era===filters.era) && norm(w.title+' '+w.author+' '+w.genre+' '+w.era).includes(q));
  const results = document.querySelector('#results');
  if(workView==='seznam') {
    results.className='works-list-layout';
    results.innerHTML='<ul class="list">'+items.map(workRow).join('')+'</ul>'+card('Obdobja','<div class="era-sidebar">'+eraList.map(eraButton).join('')+'</div>');
  } else {
    results.className='era-grid';
    results.innerHTML=eraList.map(era=>{
      const group=items.filter(w=>w.era===era);
      if(!group.length) return '';
      const open=expandedEras.has(era), id='era-works-'+eraList.indexOf(era);
      return '<section class="card era-card">'+eraButton(era)+'<ul id="'+id+'" class="list inner-list">'+group.slice(0,3).map(workRow).join('')+group.slice(3).map(w=>open?workRow(w):workRow(w).replace('<li>','<li hidden>')).join('')+'</ul>'+
        (group.length>3?'<button type="button" class="chip" data-expand-era="'+esc(era)+'" aria-expanded="'+open+'" aria-controls="'+id+'">'+(open?'Prikaži manj':'Vsa dela ('+group.length+')')+'</button>':'')+'</section>';
    }).join('');
  }
  document.querySelector('#count').textContent = items.length ? 'Število zadetkov: '+items.length : 'Ni zadetkov. Spremeni iskalni izraz ali obdobje.';
}
function topicList() {
  return heading('Tretje vprašanje','Teme za ustni izpit po izboru šolskega strokovnega aktiva.')+
    '<div class="epohe" aria-label="Področje">'+[['','Vse teme'],['Književnost','Književnost'],['Jezik','Jezik']].map(([key,label])=>'<button type="button" class="chip" data-kind="'+esc(key)+'" aria-pressed="'+(filters.kind===key)+'">'+label+'</button>').join('')+
    '</div><div class="controls" style="margin-top:16px"><label>Iskanje po temah<input type="search" id="topic-query" placeholder="Na primer: sonet ali reformacija" value="'+esc(filters.topicQuery)+'"></label></div><p id="count" class="result-count" role="status"></p><ul id="results" class="list"></ul>';
}
function refreshTopics() {
  const q=norm(filters.topicQuery.trim());
  const items=topics.filter(t=>(!filters.kind || t.kind===filters.kind) && norm(t.title+' '+t.intro+' '+t.example).includes(q));
  document.querySelector('#results').innerHTML=items.map(topicRow).join('');
  document.querySelector('#count').textContent=items.length?'Število zadetkov: '+items.length:'Ni zadetkov. Spremeni iskalni izraz ali področje.';
}
function bullets(items) {
  return '<ul class="study-points">'+items.map(item=>{
    if(!Array.isArray(item)) return '<li>'+esc(item)+'</li>';
    const [label,...details]=item;
    return '<li class="labeled-point"><strong>'+esc(label)+'</strong>'+
      (details.length===1 ? '<span>'+esc(details[0])+'</span>' : bullets(details))+'</li>';
  }).join('')+'</ul>';
}
const paragraphCard = (label,items) => items?.length ? card(label,bullets(items)) : '';
function sourcePanel(entries) {
  const clean = [...new Map(entries.filter(Boolean).map(e=>[e[0]||e[1],e])).values()];
  if (!clean.length) return '';
  return '<details class="card source-panel"><summary>Viri <span>'+clean.length+'</span></summary><ul class="rules sources">'+
    clean.map(([url,label])=>'<li>'+(url?ext(url,label):esc(label))+'</li>').join('')+'</ul></details>';
}
function noteSource(photos) {
  if (!photos) return null;
  const archive = '';
  return [location.protocol==='file:'?archive:'','Osebni učni zapiski · fotografije '+photos];
}
function authorPanel(w,person) {
  const portrait=person?.image
    ? '<img class="portrait" src="'+esc(person.image)+'" alt="'+esc((person.art?'Upodobitev: ':'Portret: ')+w.author)+'" width="116" height="116">'
    : '';
  const labels={'Sveto pismo':'Vir pripovedi','Ljudsko pesništvo':'Izročilo','Sapfo':'Avtorica','Sylvia Plath':'Avtorica','Wisława Szymborska':'Avtorica'};
  const label=labels[w.author]||'Avtor';
  const photoLink=!person?.image&&person?.credit
    ? '<a class="textlink" href="'+esc(person.credit)+'" target="_blank" rel="noopener noreferrer">Portret v zbirki NUK ↗</a>'
    : '';
  return '<section class="card author-panel">'+portrait+'<div><p class="eyebrow">'+label+'</p><h2>'+esc(w.author)+'</h2>'+
    bullets(person?.facts||[])+photoLink+'</div></section>';
}
function exactMatches(verse, devices, current) {
  if (!current) return esc(verse);
  const needles=[...new Set(devices.filter(x=>x[0]===current).flatMap(x=>x[1]).filter(Boolean))].sort((a,b)=>b.length-a.length);
  const lower=verse.toLowerCase();
  let cursor=0, result='';
  while (cursor<verse.length) {
    const hits=needles.map(n=>[lower.indexOf(n.toLowerCase(),cursor),n]).filter(x=>x[0]>=0).sort((a,b)=>a[0]-b[0]);
    if(!hits.length) return result+esc(verse.slice(cursor));
    const [pos,match]=hits[0];
    result+=esc(verse.slice(cursor,pos))+'<mark>'+esc(verse.slice(pos,pos+match.length))+'</mark>';
    cursor=pos+match.length;
  }
  return result;
}
function notesFor(info,i) {
  return info.notes?.[i] || [];
}
function poemLines(stanzas,info,current) {
  return stanzas.map((verse,i)=>{
    const notes=notesFor(info,i);
    const cue=info.cues?.[i] || (i+1)+'. kitica';
    return '<div class="stanza" data-stanza="'+i+'"><span class="verse-cue">'+esc(cue)+'</span>'+
      '<div class="verse">'+exactMatches(verse,info.devices||[],current)+'</div>'+
      (notes.length?'<button type="button" class="note-trigger chip" data-note="'+i+'" aria-expanded="false" aria-controls="stanza-popup" aria-label="'+esc('Razlaga: '+cue)+'">Razlaga</button>':'')+'</div>';
  }).join('');
}
function reader(w,info) {
  const stanzas=info.stanzas || w.text || info.fragments;
  const linkLabel=info.linkLabel||(info.incomplete||info.fragments?'Celotno besedilo':'Odpri izdajo');
  const external=info.edition ? '<a class="textlink" href="'+esc(info.edition[0])+'" target="_blank" rel="noopener noreferrer">'+esc(linkLabel)+' ↗</a>' : '';
  const preview=info.inlineEdition&&info.edition?'<button class="chip" type="button" id="preview-edition" aria-haspopup="dialog">Prikaži celotno besedilo</button>':'';
  if(!info.keepPlot && (stanzas?.length || info.edition)) {
    const lead=info.credit?'<p class="muted reader-credit">'+esc(info.credit)+'</p>':'';
    const header='<div class="reader-head"><h2>Besedilo</h2><div class="epohe">'+preview+external+'</div></div>';
    const body=stanzas?.length
      ? '<div class="reader-scroll" tabindex="0" aria-label="Besedilo pesmi"><div id="poem-lines">'+poemLines(stanzas,info)+'</div></div>'
      : '<div class="reader-scroll" tabindex="0" aria-label="Opombe k besedilu"><div class="stanza-index">'+(info.notes||[]).map((notes,i)=>
          '<div class="stanza" data-stanza="'+i+'"><span class="verse-cue">'+esc(info.cues?.[i]||((i+1)+'. kitica'))+'</span>'+
          '<button type="button" class="note-trigger chip" data-note="'+i+'" aria-expanded="false" aria-controls="stanza-popup">Razlaga</button></div>').join('')+'</div></div>';
    return '<section class="card reader reader--verse">'+header+lead+body+'</section>';
  }
  return '<section class="card reader"><div class="reader-head"><h2>Vsebina</h2><div class="epohe">'+preview+external+'</div></div><div class="reader-scroll" tabindex="0" aria-label="Vsebina dela">'+
    (info.plot?flow(info.plot):bullets([w.intro])+flow(w.steps))+'</div></section>';
}
function devicesPanel(info) {
  if(!info.devices?.length) return '';
  const types=[...new Set(info.devices.map(x=>x[0]))];
  return card('Pesniška sredstva','<div class="epohe device-controls">'+types.map(type=>
    '<button type="button" class="chip" data-device="'+esc(type)+'" aria-pressed="false">'+esc(type)+'</button>').join('')+
    '</div><p id="device-status" class="muted" role="status"></p><ul class="study-points devices">'+info.devices.map(([type,phrases,explanation])=>
      '<li data-example="'+esc(type)+'"><strong>'+esc(type)+'</strong> '+(phrases.length?'<span class="device-quote">'+phrases.map(p=>'»'+esc(p)+'«').join(' · ')+'</span> ':'')+esc(explanation)+'</li>').join('')+'</ul>');
}
function trianglePanel(points) {
  if(!points) return '';
  const labels=['Zasnova','Zaplet','Vrh','Razplet','Razsnova'];
  const shape='<div class="triangle"><div class="triangle-line" aria-hidden="true"></div>'+labels.map((label,i)=>
    '<button type="button" class="triangle-stop" style="--i:'+i+'" data-stage="'+i+'" aria-controls="stage-'+i+'" aria-pressed="'+(i===0)+'">'+esc(label)+'</button>').join('')+'</div>';
  return '<section class="card reader drama-reader"><h2>Dramski trikotnik</h2>'+shape+'<div class="reader-scroll" tabindex="0" aria-label="Potek drame">'+points.map((point,i)=>
    '<section class="stage-panel" id="stage-'+i+'"'+(i?' hidden':'')+'><h3>'+labels[i]+'</h3>'+flow(Array.isArray(point)?point:[point])+'</section>').join('')+'</div></section>';
}
function castPanel(cast) {
  if(!cast?.length) return '';
  const groups=[['P','Protagonisti'],['A','Antagonisti in nasprotne sile'],['S','Druge osebe']];
  return card('Osebe',groups.map(([role,label])=>{
    const members=cast.filter(([key])=>key[0]===role);
    if(!members.length) return '';
    return '<section class="cast-group"><h3>'+label+'</h3><div class="cast-grid">'+members.map(([key,name,traits,roleInStory,appearance,identity])=>
      '<article class="cast-card'+(key.includes('*')?' cast-card--main':'')+'"><div><h4>'+esc(name)+'</h4><small>'+(key.includes('!')?'Nasprotna sila':key.includes('*')?'Glavna oseba':'Stranska oseba')+'</small></div><p class="cast-identity">'+esc(identity)+'</p><p><strong>Značaj</strong> '+esc(traits)+'</p>'+(appearance?'<p class="muted">'+esc(appearance)+'</p>':'')+'<p><strong>Vloga v delu</strong> '+esc(roleInStory)+'</p></article>').join('')+'</div></section>';
  }).join(''));
}
function periodTraitsPanel(era,traits) {
  return card('Značilnosti literarnega obdobja','<ul class="study-points period-traits">'+traits.map(([label,example,section])=>
    '<li><button type="button" class="period-trait-link" data-era-info="'+esc(era)+'" data-era-section="'+esc(section)+'" aria-haspopup="dialog">'+esc(label)+'</button><p>'+esc(example)+'</p></li>').join('')+'</ul>');
}
function work(w) {
  const info={...analysis[w.id],...editions[w.id],...study.works[w.id]};
  const person={...people[w.author],...study.authorBriefs[w.author]};
  const related=topics.filter(t=>t.related.includes(w.n));
  const marked=saved.includes(w.id);
  const contacts=[info.edition,w.primary&&[w.primary,'Besedilo ali analiza'],w.detail?.url&&[w.detail.url,'Dodatna razlaga'],...(info.sources||[]),...(info.periodSources||[]),
    person?.bio&&[person.bio,'Življenjepis'],person?.extra&&[person.extra,'Dodatni življenjepis'],person?.credit&&[person.credit,'Vir portreta'],noteSource(w.detail?.photos)].filter(Boolean);
  return '<div class="work-head">'+back('dela','Dela')+heading(w.title,'',w.era+' · '+w.genre)+
    '<button type="button" class="chip" id="save" aria-pressed="'+marked+'">'+(marked?'Odstrani zaznamek':'Dodaj zaznamek')+'</button><span id="save-status" role="status"></span></div>'+
    '<div class="work-layout">'+authorPanel(w,person)+(info.triangle?trianglePanel(info.stages||info.triangle):reader(w,info))+
    '<div class="stack analysis-column"><section class="analysis-heading"><h2>Analiza</h2></section>'+
    paragraphCard('Razlaga',info.crit||info.readings||w.detail?.paragraphs)+periodTraitsPanel(w.era,info.periodTraits)+castPanel(info.cast)+paragraphCard('Snov',info.material)+
    paragraphCard('Zvrst in zgradba',info.genre||[w.form])+devicesPanel(info)+
    paragraphCard('Motivi',info.motifs)+paragraphCard('Tema in ideja',info.meaning||[w.theme])+
    links('Povezane teme',related.map(t=>link('tema',t)))+sourcePanel(contacts)+'</div></div>'+eraDialog;
}
function topic(t) {
  const related=works.filter(w=>t.related.includes(w.n));
  const expanded=study.topics[t.id];
  return back('teme','Tretje vprašanje')+heading(t.title,'',t.kind+' · '+number(t.n))+
    '<div class="article"><div class="stack">'+paragraphCard('Razlaga',expanded?.facts||[t.intro,...(t.detail?.paragraphs||[])])+paragraphCard('Primeri',expanded?.examples||[t.example])+
    card('Ustni odgovor',bullets([t.question]))+
    '</div><aside class="stack">'+links('Povezana dela',related.map(w=>link('delo',w)))+
    sourcePanel([noteSource(t.detail?.photos),t.detail?.url&&[t.detail.url,'Dodatna razlaga']])+'</aside></div>';
}
function wireReader(w) {
  const info={...analysis[w.id],...editions[w.id],...study.works[w.id]};
  const panel=document.querySelector('.reader');
  const preview=panel?.querySelector('#preview-edition');
  if(preview) preview.onclick=()=>{
    const dialog=document.createElement('dialog');
    dialog.className='era-dialog edition-dialog';
    dialog.setAttribute('aria-labelledby','edition-title');
    dialog.innerHTML='<div class="dialog-body"><header class="dialog-header"><h2 id="edition-title">'+esc(w.title)+'</h2><button class="chip" type="button" autofocus>Zapri</button></header><iframe src="'+esc(info.edition[0])+'" title="'+esc(info.edition[1])+'" referrerpolicy="no-referrer"></iframe><a class="textlink" href="'+esc(info.edition[0])+'" target="_blank" rel="noopener noreferrer">Odpri izdajo v novem zavihku ↗</a></div>';
    main.append(dialog);
    dialog.querySelector('button').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>{dialog.remove();preview.focus();},{once:true});
    dialog.showModal();
  };
  const popup=document.createElement('div');
  popup.id='stanza-popup';
  popup.className='stanza-popup';
  popup.setAttribute('role','region');
  popup.setAttribute('aria-label','Razlaga kitice');
  popup.hidden=true;
  if(info.notes?.length) main.append(popup);
  const verseView=document.querySelector('#poem-lines');
  let active=null, pinned=false, current='';
  const close=()=>{
    popup.hidden=true;
    popup.classList.remove('pinned');
    if(active) active.querySelector('.note-trigger')?.setAttribute('aria-expanded','false');
    active=null;
    pinned=false;
  };
  const show=row=>{
    const i=Number(row.dataset.stanza), notes=notesFor(info,i);
    if(!notes.length) return;
    active?.querySelector('.note-trigger')?.setAttribute('aria-expanded','false');
    active=row;
    row.querySelector('.note-trigger')?.setAttribute('aria-expanded','true');
    popup.innerHTML='<header><strong>'+esc(info.cues?.[i]||((i+1)+'. kitica'))+'</strong><button class="popup-close" type="button" aria-label="Zapri razlago">×</button></header>'+bullets(notes);
    popup.hidden=false;
    const rect=row.getBoundingClientRect();
    const width=popup.offsetWidth, height=popup.offsetHeight;
    const right=panel.getBoundingClientRect().right+12;
    const x=right+width<innerWidth-10?right:Math.max(8,Math.min(rect.left,innerWidth-width-8));
    const top=innerWidth<590?rect.bottom+5:rect.top;
    const y=Math.max(8,Math.min(top,innerHeight-height-8));
    popup.style.left=x+'px';
    popup.style.top=y+'px';
  };
  panel?.addEventListener('pointerover',event=>{
    const row=event.target.closest('[data-stanza]');
    if(row && event.pointerType==='mouse' && !pinned && row!==active) show(row);
  });
  panel?.addEventListener('pointerout',event=>{
    if(pinned || !active) return;
    if(!active.contains(event.relatedTarget) && !popup?.contains(event.relatedTarget)) close();
  });
  panel?.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-note]');
    if(!trigger) return;
    const row=trigger.closest('[data-stanza]');
    if(active===row && pinned) close();
    else {pinned=true;popup.classList.add('pinned');show(row);}
  });
  popup.addEventListener('click',event=>{
    if(!event.target.closest('.popup-close')) return;
    const trigger=active?.querySelector('.note-trigger');
    close();
    trigger?.focus({preventScroll:true});
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close();},{signal:pageEvents.signal});
  const readerScroll=panel?.querySelector('.reader-scroll');
  const dismissHover=()=>{if(!pinned) close();};
  readerScroll?.addEventListener('scroll',dismissHover,{passive:true});
  window.addEventListener('resize',close,{signal:pageEvents.signal});
  window.addEventListener('scroll',dismissHover,{signal:pageEvents.signal,passive:true});
  document.querySelectorAll('[data-device]').forEach(button=>button.onclick=()=>{
    close();
    current=current===button.dataset.device?'':button.dataset.device;
    document.querySelectorAll('[data-device]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.device===current)));
    document.querySelectorAll('[data-example]').forEach(el=>el.hidden=Boolean(current&&el.dataset.example!==current));
    const status=document.querySelector('#device-status');
    if(!verseView){status.textContent=current?'Primer je opisan spodaj. Besedilo je pri viru.':'';return;}
    verseView.innerHTML=poemLines(info.stanzas||w.text||info.fragments,info,current);
    const mark=verseView.querySelector('mark');
    status.textContent=current?(mark?(info.fragments?'Označeno v izbranih verzih.':'Označeno v besedilu.'):'Primer je v razlagi spodaj.'):'';
    if(mark && readerScroll) {
      const distance=mark.getBoundingClientRect().top-readerScroll.getBoundingClientRect().top;
      readerScroll.scrollTo({top:readerScroll.scrollTop+distance-22,behavior:'smooth'});
    }
  });
  document.querySelectorAll('[data-stage]').forEach(button=>button.onclick=()=>{
    document.querySelectorAll('[data-stage]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
    document.querySelectorAll('.stage-panel').forEach(el=>el.hidden=el.id!=='stage-'+button.dataset.stage);
    if(readerScroll) readerScroll.scrollTop=0;
  });
}
function bookmarks() {
  const items=works.filter(w=>saved.includes(w.id));
  return back('dela','Dela')+heading('Zaznamki','Shranjena dela za ponavljanje. Zaznamki se hranijo v tem brskalniku.')+
    (storageError?'<p>Brskalnik ni omogočil dostopa do shrambe.</p>':'')+
    (items.length?'<ul class="list">'+items.map(workRow).join('')+'</ul>':'<div class="card"><p>Ni zaznamkov.</p><a class="textlink" href="#dela">Odpri zbirko del</a></div>')+
    '<div class="toolbar"><button class="chip" type="button" id="export">Izvozi zaznamke</button><button class="chip" type="button" id="import">Uvozi zaznamke</button><input type="file" id="import-file" accept=".json,application/json" aria-label="Datoteka z zaznamki" hidden><span role="status" id="save-status"></span></div>';
}
function wireBookmarks() {
  document.querySelector('#export').onclick=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,saved})],{type:'application/json'}));
    const a=document.createElement('a'); a.href=url; a.download='berilo-zaznamki.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const input=document.querySelector('#import-file');
  document.querySelector('#import').onclick=()=>input.click();
  input.onchange=async()=>{
    try {
      const file=input.files[0];
      if(!file) return;
      if(file.size>50000) throw Error();
      const parsed=JSON.parse(await file.text());
      if(parsed?.version!==1 || !Array.isArray(parsed.saved) || !parsed.saved.every(id=>works.some(w=>w.id===id))) throw Error();
      if(!storeSaved([...new Set([...saved,...parsed.saved])])) {
        document.querySelector('#save-status').textContent='Brskalnik ni mogel shraniti zaznamkov.'; return;
      }
      render(false);
      document.querySelector('#import').focus();
      document.querySelector('#save-status').textContent='Zaznamki so uvoženi.';
    } catch { document.querySelector('#save-status').textContent='Datoteka ni veljaven izvoz zaznamkov.'; }
    finally { input.value=''; }
  };
}
let pageEvents = new AbortController();
function render(focus=true) {
  pageEvents.abort(); pageEvents=new AbortController();
  if(location.hash==='#vsebina'){main.focus();return;}
  let route, param;
  try { [route,param]=location.hash.slice(1).split('/').map(decodeURIComponent); }
  catch { route='neznano'; }
  if(!hasTopics && (route==='teme' || route==='tema')){
    history.replaceState(null,'','#dela');
    route='dela';
    param=undefined;
    filters.workQuery='';
    filters.era='';
  }
  const w=route==='delo'?works.find(x=>x.id===Number(param)):null;
  const t=route==='tema'?topics.find(x=>x.id===Number(param)):null;
  const active=route==='delo'||route==='zaznamki'?'dela':route==='tema'?'teme':route;
  document.querySelectorAll('nav a').forEach(a=>{
    if(a.getAttribute('href')==='#'+(active||'domov')) a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
  if(!route || route==='domov') { filters.workQuery=''; filters.era=''; main.innerHTML=home(); }
  else if(route==='dela') {
    main.innerHTML=workList(param); refreshWorks();
    document.querySelector('#work-query').oninput=e=>{filters.workQuery=e.target.value;refreshWorks();};
    document.querySelector('#era').onchange=e=>{
      filters.era=e.target.value;
      if(param) history.replaceState(null,'',filters.era?'#dela/'+encodeURIComponent(filters.era):'#dela');
      refreshWorks();
    };
  } else if(route==='teme') {
    main.innerHTML=topicList(); refreshTopics();
    document.querySelector('#topic-query').oninput=e=>{filters.topicQuery=e.target.value;refreshTopics();};
    document.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{
      filters.kind=b.dataset.kind;
      document.querySelectorAll('[data-kind]').forEach(k=>k.setAttribute('aria-pressed',String(k===b)));
      refreshTopics();
    });
  } else if(w) {
    lastWork=w;
    try { localStorage.setItem('berilo-last-work',String(w.id)); } catch { /* Readable within this tab. */ }
    main.innerHTML=work(w);
    const save=document.querySelector('#save');
    save.onclick=()=>{
      const marked=saved.includes(w.id);
      const ok=storeSaved(marked?saved.filter(id=>id!==w.id):[...saved,w.id]);
      document.querySelector('#save-status').textContent=ok?'':'Brskalnik ni mogel shraniti zaznamka.';
      if(ok){save.textContent=marked?'Dodaj zaznamek':'Odstrani zaznamek'; save.setAttribute('aria-pressed',String(!marked));}
    };
    wireReader(w);
  } else if(t) main.innerHTML=topic(t);
  else if(route==='zaznamki') {main.innerHTML=bookmarks(); wireBookmarks();}
  else main.innerHTML=heading('Stran ni najdena')+'<a class="button" href="#dela">Književna dela</a>';
  document.title=main.querySelector('h1').textContent+' · Berilo';
  if(focus){window.scrollTo(0,0);main.focus({preventScroll:true});}
}
main.addEventListener('click',event=>{
  const era=event.target.closest('[data-era-info]');
  if(era) showEra(era.dataset.eraInfo,era);
  const view=event.target.closest('[data-work-view]');
  if(view) {
    workView=view.dataset.workView;
    try { localStorage.setItem('berilo-work-view',workView); } catch { /* Retain the current view in memory. */ }
    main.querySelectorAll('[data-work-view]').forEach(button=>button.setAttribute('aria-pressed',String(button===view)));
    refreshWorks();
  }
  const toggle=event.target.closest('[data-expand-era]');
  if(toggle) {
    const name=toggle.dataset.expandEra;
    const open=toggle.getAttribute('aria-expanded')==='true';
    if(open) expandedEras.delete(name); else expandedEras.add(name);
    const remainder=[...document.getElementById(toggle.getAttribute('aria-controls')).children].slice(3);
    remainder.forEach(item=>item.hidden=open);
    toggle.setAttribute('aria-expanded',String(!open));
    toggle.textContent=open?'Vsa dela ('+(remainder.length+3)+')':'Prikaži manj';
  }
  if(event.target.matches('.era-dialog')) event.target.close();
});
document.querySelector('.skip').addEventListener('click',event=>{
  event.preventDefault();
  main.focus();
  main.scrollIntoView({block:'start'});
});
main.addEventListener('pointermove',event=>{
  const target=event.target.closest('.row, .chip, .stanza')||event.target.closest('.card');
  if(!target || event.pointerType!=='mouse') return;
  const rect=target.getBoundingClientRect();
  target.style.setProperty('--mx',(event.clientX-rect.left)+'px');
  target.style.setProperty('--my',(event.clientY-rect.top)+'px');
});
window.addEventListener('hashchange',()=>render());
const siteHeader=document.querySelector('.site-header');
new ResizeObserver(()=>{
  const mobileTop=siteHeader.getBoundingClientRect().height+7;
  document.documentElement.style.setProperty('--mobile-nav',mobileTop+'px');
}).observe(siteHeader);
render(false);
