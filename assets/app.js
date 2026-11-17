'use strict';
const {works, topics} = window.GRADIVO;
const {people, analysis, editions} = window.BERILO;
const main = document.querySelector('main');
const norm = value => value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const eraList = ['Antika','Srednji vek','Renesansa','Ljudsko slovstvo','Klasicizem in razsvetljenstvo','Romantika','Realizem','Slovenska moderna','Modernizem','Prva polovica 20. stoletja','Književnost po letu 1945'];
const relations = {
  'Iliada':[['Ahil','Patroklos','Patroklova smrt Ahila vrne na bojišče.'],['Ahil','Hektor','Dvoboj spremeni žalovanje v maščevanje.'],['Priam','Ahil','Prošnja za truplo odpre možnost sočutja.']],
  'Kralj Ojdip':[['Ojdip','Laj','Ojdip po smrti Laja išče človeka, ki ga je ubil.'],['Jokasta','Ojdip','Iz žene in zaveznice v preiskavi postane ključ do njegovega porekla.']],
  'Antigona':[['Antigona','Polinejk','Družinska dolžnost: Antigona pokoplje brata.'],['Kreon','Antigona','Spor: kraljeva prepoved trči ob dolžnost pokopa.'],['Hajmon','Kreon','Sin skuša očeta prepričati, naj posluša prebivalce.']],
  'Hamlet':[['Hamlet','Klavdij','Klavdijevo reakcijo na predstavo uporabi kot preizkus krivde.'],['Ofelija','Hamlet','Odnos se zaplete, ko dvor Ofelijo vključi v opazovanje Hamleta.'],['Laert','Hamlet','Laertovo maščevanje pripelje do dvoboja.']],
  'Tartuffe':[['Tartuffe','Orgon','Z videzom pobožnosti si pridobi Orgonovo zaupanje.'],['Elmira','Orgon','S prizorom pod mizo mu omogoči slišati Tartuffa.']],
  'Krst pri Savici':[['Valjhun','Črtomir','Vojaški spopad se konča s porazom Črtomirjeve strani.'],['Bogomila','Črtomir','Srečanje razkrije njeno spreobrnitev in spremeni njuno prihodnost.']],
  'Zločin in kazen':[['Porfirij','Raskolnikov','Preiskovalec preizkuša razlago njegovega ravnanja.'],['Sonja','Raskolnikov','Spodbuja ga, da prizna dejanje in sprejme posledice.']],
  'Gospa Bovary':[['Emma','Charles','Njen pogled na zakon se oddalji od Charlesovega.'],['Lheureux','Emma','Nakupi na kredit povečajo njeno odvisnost in dolgove.']],
  'Visoška kronika':[['Polikarp','Izidor','Sin podeduje imetje in breme očetove preteklosti.'],['Jurij','Agata','Med preizkusom skoči za njo v vodo.']],
  'Preobrazba':[['Gregor','Greta','Sestra najprej skrbi zanj, potem zagovarja njegovo odstranitev.'],['Oče','Gregor','Napad z jabolki spremeni družinsko razmerje v odprto nasilje.']],
  'Hlapci':[['Jerman','Učitelji','Jermanov odpor osvetli njihovo prilagoditev po volitvah.'],['Jerman','Mati','Ob političnem sporu se stopnjuje osebni konflikt.']]
};
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

function home() {
  const featured = [5,20,30,19].map(id=>works.find(w=>w.id===id));
  const destinations = [
    ['#dela','Književna dela',works.length,'Avtorji, besedila in analiza'],
    ['#teme','Tretje vprašanje',topics.length,'Književnost in jezik'],
    ['#zaznamki','Zaznamki',saved.length,'Shranjena dela']
  ];
  return '<header class="overview glass"><div><p class="eyebrow">Književnost in jezik</p><h1>Slovenščina</h1></div><div class="lens" aria-hidden="true"></div></header>'+
    '<section class="dashboard-grid" aria-label="Gradivo">'+destinations.map(([path,title,count,label])=>
      '<a class="card metric" href="'+path+'"><span class="metric-label">'+title+'</span><strong>'+count+'</strong><span>'+label+'</span><span class="arrow" aria-hidden="true">↗</span></a>').join('')+'</section>'+
    '<div class="article section"><section class="card"><div class="section-head"><h2>Iz zbirke</h2><a class="textlink" href="#dela">Vsa dela</a></div><ul class="list inner-list">'+featured.map(workRow).join('')+'</ul></section>'+
    card('Literarna obdobja','<div class="epohe">'+eraList.map(era=>'<a class="textlink" href="#dela/'+encodeURIComponent(era)+'">'+esc(era)+'</a>').join('')+'</div>')+'</div>';
}
function workList(era) {
  if(eraList.includes(era)) filters.era = era;
  return heading('Književna dela','Dela po označenem izboru za ustni izpit 2027.')+
    '<div class="controls"><label>Iskanje<input type="search" id="work-query" placeholder="Naslov ali avtor" value="'+esc(filters.workQuery)+'"></label><label>Obdobje<select id="era"><option value="">Vsa obdobja in sklopi</option>'+
    eraList.map(e=>'<option'+(filters.era===e?' selected':'')+'>'+esc(e)+'</option>').join('')+'</select></label></div><p id="count" class="result-count" role="status"></p><ul id="results" class="list"></ul>';
}
function refreshWorks() {
  const q = norm(filters.workQuery.trim());
  const items = works.filter(w=>(!filters.era || w.era===filters.era) && norm(w.title+' '+w.author+' '+w.genre+' '+w.era).includes(q));
  document.querySelector('#results').innerHTML = items.map(workRow).join('');
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
const bullets = items => '<ul class="study-points">'+items.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul>';
const paragraphCard = (label,items) => items?.length ? card(label,bullets(items)) : '';
function sourcePanel(entries) {
  const clean = [...new Map(entries.filter(Boolean).map(e=>[e[0]||e[1],e])).values()];
  if (!clean.length) return '';
  return '<details class="card source-panel"><summary>Viri <span>'+clean.length+'</span></summary><ul class="rules sources">'+
    clean.map(([url,label])=>'<li>'+(url?ext(url,label):esc(label))+'</li>').join('')+'</ul></details>';
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
  const needles=[...new Set(devices.filter(x=>x[0]===current).flatMap(x=>x[1]))].sort((a,b)=>b.length-a.length);
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
  if(stanzas?.length || info.edition) {
    const linkLabel=info.incomplete||info.fragments?'Celotno besedilo':w.id===14?'Angleški izvirnik':'Odpri izdajo';
    const external=info.edition ? '<a class="textlink" href="'+esc(info.edition[0])+'" target="_blank" rel="noopener noreferrer">'+linkLabel+' ↗</a>' : '';
    const lead=info.credit?'<p class="muted reader-credit">'+esc(info.credit)+'</p>':'';
    const header='<div class="reader-head"><h2>Besedilo</h2>'+external+'</div>';
    const body=stanzas?.length
      ? '<div class="reader-scroll" tabindex="0" aria-label="Besedilo pesmi"><div id="poem-lines">'+poemLines(stanzas,info)+'</div></div>'
      : '<div class="reader-scroll" tabindex="0" aria-label="Opombe k besedilu"><div class="stanza-index">'+(info.notes||[]).map((notes,i)=>
          '<div class="stanza" data-stanza="'+i+'"><span class="verse-cue">'+esc(info.cues?.[i]||((i+1)+'. kitica'))+'</span>'+
          '<button type="button" class="note-trigger chip" data-note="'+i+'" aria-expanded="false" aria-controls="stanza-popup">Razlaga</button></div>').join('')+'</div></div>';
    return '<section class="card reader reader--verse">'+header+lead+body+'</section>';
  }
  return '<section class="card reader"><h2>Vsebina</h2><div class="reader-scroll" tabindex="0" aria-label="Vsebina dela">'+
    (info.plot?flow(info.plot):bullets([w.intro])+flow(w.steps))+'</div></section>';
}
function devicesPanel(info) {
  if(!info.devices?.length) return '';
  const types=[...new Set(info.devices.map(x=>x[0]))];
  return card('Pesniška sredstva','<div class="epohe device-controls">'+types.map(type=>
    '<button type="button" class="chip" data-device="'+esc(type)+'" aria-pressed="false">'+esc(type)+'</button>').join('')+
    '</div><p id="device-status" class="muted" role="status"></p><ul class="study-points devices">'+info.devices.map(([type,phrases,explanation])=>
      '<li data-example="'+esc(type)+'"><strong>'+esc(type)+'</strong> '+esc(explanation)+'</li>').join('')+'</ul>');
}
function trianglePanel(points) {
  if(!points) return '';
  const labels=['Zasnova','Zaplet','Vrh','Razplet','Razsnova'];
  const shape='<div class="triangle"><div class="triangle-line" aria-hidden="true"></div>'+labels.map((label,i)=>
    '<button type="button" class="triangle-stop" style="--i:'+i+'" data-stage="'+i+'" aria-controls="stage-'+i+'" aria-pressed="'+(i===0)+'">'+esc(label)+'</button>').join('')+'</div>';
  return card('Dramski trikotnik',shape+'<ol class="stage-list">'+points.map((point,i)=>
    '<li id="stage-'+i+'"'+(i===0?' class="selected-stage"':'')+'><strong>'+labels[i]+'</strong> '+esc(point)+'</li>').join('')+'</ol>');
}
function relationPanel(w) {
  const points=relations[w.title];
  if(!points) return '';
  return paragraphCard('Odnosi med osebami',points.map(([a,b,detail])=>a+' / '+b+' · '+detail));
}
function work(w) {
  const info={...analysis[w.id],...editions[w.id]};
  const person=people[w.author];
  const related=topics.filter(t=>t.related.includes(w.n));
  const marked=saved.includes(w.id);
  const contacts=[info.edition,w.primary&&[w.primary,'Besedilo ali analiza'],w.detail?.url&&[w.detail.url,'Dodatna razlaga'],...(info.sources||[]),
    person?.bio&&[person.bio,'Življenjepis'],person?.extra&&[person.extra,'Dodatni življenjepis'],person?.credit&&[person.credit,'Vir portreta']].filter(Boolean);
  return '<div class="work-head">'+back('dela','Dela')+heading(w.title,'',w.era+' · '+w.genre)+
    '<button type="button" class="chip" id="save" aria-pressed="'+marked+'">'+(marked?'Odstrani zaznamek':'Dodaj zaznamek')+'</button><span id="save-status" role="status"></span></div>'+
    '<div class="work-layout">'+authorPanel(w,person)+reader(w,info)+
    '<div class="stack analysis-column"><section class="analysis-heading"><h2>Analiza</h2></section>'+
    paragraphCard('Snov',info.material)+paragraphCard('Osebe',info.characters)+
    trianglePanel(info.triangle)+paragraphCard('Zvrst in zgradba',info.genre||[w.form])+devicesPanel(info)+
    paragraphCard('Motivi',info.motifs)+paragraphCard('Tema in ideja',info.meaning||[w.theme])+
    paragraphCard('Razlaga',info.readings||w.detail?.paragraphs)+
    (info.characters?'':relationPanel(w))+
    links('Povezane teme',related.map(t=>link('tema',t)))+sourcePanel(contacts)+'</div></div>';
}
function topic(t) {
  const related=works.filter(w=>t.related.includes(w.n));
  return back('teme','Tretje vprašanje')+heading(t.title,'',t.kind+' · '+number(t.n))+
    '<div class="article"><div class="stack">'+paragraphCard('Pregled',[t.intro])+paragraphCard(t.detail?.heading||'Razlaga',t.detail?.paragraphs)+paragraphCard('Primeri',[t.example])+
    card('Ustni odgovor',bullets([t.question]))+
    '</div><aside class="stack">'+links('Povezana dela',related.map(w=>link('delo',w)))+
    sourcePanel([t.detail?.url&&[t.detail.url,'Dodatna razlaga']])+'</aside></div>';
}
function wireReader(w) {
  const info={...analysis[w.id],...editions[w.id]};
  const panel=document.querySelector('.reader');
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
    document.querySelectorAll('.stage-list li').forEach(el=>el.classList.toggle('selected-stage',el.id==='stage-'+button.dataset.stage));
  });
}
function bookmarks() {
  const items=works.filter(w=>saved.includes(w.id));
  return heading('Zaznamki','Zaznamki se hranijo v tem brskalniku.')+
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
  const w=route==='delo'?works.find(x=>x.id===Number(param)):null;
  const t=route==='tema'?topics.find(x=>x.id===Number(param)):null;
  const active=route==='delo'?'dela':route==='tema'?'teme':route;
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
