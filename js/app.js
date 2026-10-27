/* =====================================================================
   TRANSITIA · Lógica del prototipo (datos simulados)
   1 Configuración · 2 Datos · 3 Estado · 4 Utilidades · 5 Navegación
   6 Mapa · 7 Semáforos · 8 Decisión IA · 9 Gráficos · 10 Páginas
   11 Acciones · 12 Ciclo principal
   ===================================================================== */

/* 1. CONFIGURACIÓN (valores del informe: MVP) ------------------------- */
const CONFIG = {
  pilotName: 'Av. Central / Calle 4',
  greenMin: 15, greenMax: 45,      // rango permitido de luz verde (s)
  pedMin: 18,                      // cruce peatonal mínimo (s)
  yellow: 4,                       // duración del amarillo (s)
  approvalSeconds: 30,             // cuenta regresiva de pre-aprobación
  autoProposalEvery: 25,           // cada cuántos s la IA propone un cambio
};

/* 2. DATOS SIMULADOS -------------------------------------------------- */
const PAGES = [
  { id:'resumen',   label:'Resumen',               title:'Resumen operativo',     sub:'Estado de la intersección piloto y decisiones de la IA',
    icon:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { id:'mapa',      label:'Mapa en tiempo real',   title:'Mapa en tiempo real',   sub:'Flujo vehicular, semáforos y cámaras',
    icon:'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14' },
  { id:'semaforos', label:'Semáforos inteligentes',title:'Semáforos inteligentes',sub:'Supervisión y control de intersecciones',
    icon:'M8 2h8v20H8zM12 7h.01M12 12h.01M12 17h.01' },
  { id:'analisis',  label:'Análisis de tráfico',   title:'Análisis de tráfico',   sub:'Comparación entre ciclo fijo e IA adaptativa',
    icon:'M4 20V10M10 20V4M16 20v-8M22 20H2' },
  { id:'camaras',   label:'Cámaras y sensores',    title:'Cámaras y sensores',    sub:'Detección de vehículos y peatones por visión artificial',
    icon:'M3 7h12v10H3zM15 11l6-3v8l-6-3' },
  { id:'reportes',  label:'Reportes',              title:'Reportes',              sub:'Información para la toma de decisiones',
    icon:'M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8' },
  { id:'alertas',   label:'Alertas',               title:'Alertas',               sub:'Incidencias detectadas por el sistema',
    icon:'M6 9a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4' },
  { id:'config',    label:'Configuración',         title:'Configuración',         sub:'Parámetros generales de TRANSITIA',
    icon:'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M10 10v4M16 16v4' },
];

// Cuadrícula de calles (coordenadas en el SVG de 800 x 460)
const COLS = [{n:'Av. Norte',x:120},{n:'Calle 4',x:400},{n:'Av. Sur',x:680}];
const ROWS = [{n:'Av. Universitaria',y:110},{n:'Av. Central',y:230},{n:'Calle 12',y:350}];

// Tramos con su nivel de congestión: 0 fluido · 1 moderado · 2 lento · 3 congestionado
const ROADS = [
  {name:'Av. Central (oeste)', a:[0,230],   b:[400,230], level:3},
  {name:'Av. Central (este)',  a:[400,230], b:[800,230], level:1},
  {name:'Av. Universitaria',   a:[0,110],   b:[800,110], level:1},
  {name:'Calle 12',            a:[0,350],   b:[800,350], level:0},
  {name:'Av. Norte',           a:[120,0],   b:[120,460], level:2},
  {name:'Calle 4',             a:[400,0],   b:[400,460], level:0},
  {name:'Av. Sur',             a:[680,0],   b:[680,460], level:2},
];
const LEVELS = [
  {name:'Fluido',        color:'#38d17c', speed:48, cars:5},
  {name:'Moderado',      color:'#f2c744', speed:30, cars:6},
  {name:'Lento',         color:'#ff9a3d', speed:16, cars:8},
  {name:'Congestionado', color:'#ff5a5a', speed:7,  cars:11},
];
const PHASE = {
  green:{label:'Verde',color:'#38d17c',chip:'ok',next:'Amarillo'},
  yellow:{label:'Amarillo',color:'#f2c744',chip:'mod',next:'Rojo'},
  red:{label:'Rojo',color:'#ff5a5a',chip:'bad',next:'Verde'},
};
const MIX = [['Autos',62,'#5aa9ff'],['Motos',18,'#38d17c'],['Buses',12,'#f2c744'],['Camiones',8,'#ff9a3d']];
const SETTINGS = [
  {key:'auto',  title:'Optimización automática de semáforos', desc:'La IA propone y aplica tiempos según el flujo (con pre-aprobación).'},
  {key:'alerts',title:'Alertas de congestión',                desc:'Mostrar avisos y contador cuando se detecte congestión o incidentes.'},
  {key:'sim',   title:'Modo de simulación',                   desc:'Identifica en pantalla que los datos son ficticios para la demostración.'},
];
const RECS = [
  {tone:'var(--bad)',title:'Evitar Av. Central',sub:'Congestionada. Tomar rutas alternas.',msg:'Mostrando rutas alternativas'},
  {tone:'var(--mod)',title:'Tráfico lento en Av. Sur',sub:'Precaución al conducir.',msg:'Alerta de Av. Sur seleccionada'},
  {tone:'var(--ok)', title:'Mejor flujo en Calle 12',sub:'Ruta recomendada.',msg:'Calle 12 marcada como recomendada'},
];
const CAMERAS = [
  {id:'CAM-001', place:'Av. Central / Calle 4 (piloto)', on:true},
  {id:'CAM-002', place:'Av. Norte / Calle 12', on:true},
  {id:'CAM-003', place:'Av. Sur / Av. Universitaria', on:true},
  {id:'CAM-004', place:'Calle 4 / Calle 12', on:false},
];
// Curvas de espera promedio por hora (s). La IA aplica ~35% de mejora.
const HOURS = Array.from({length:24},(_,h)=>h);
const WAIT_FIXED = [8,6,5,5,7,14,32,52,58,44,36,34,38,36,34,38,48,60,55,40,28,20,14,10];
const WAIT_AI = WAIT_FIXED.map((v,h)=>Math.round(v*(0.63+0.04*Math.sin(h))));

/* 3. ESTADO ----------------------------------------------------------- */
const state = {
  mode:'auto', page:'resumen', demand:89, proposal:null, focus:null,
  lastDecision:'Verde extendido por alta demanda. Paso peatonal seguro garantizado.',
  settings:{auto:true, alerts:true, sim:true},
  alerts:[
    {sev:'bad', title:'Congestión alta',  place:'Av. Central, acceso al piloto', min:3},
    {sev:'mod', title:'Flujo moderado',   place:'Av. Universitaria',             min:7},
    {sev:'ok',  title:'Flujo óptimo',     place:'Calle 12',                      min:0},
  ],
};
const INTERSECTIONS = ROWS.flatMap(r => COLS.map(c => {
  const phase = ['green','yellow','red'][Math.floor(Math.random()*3)];
  const i = {name:`${r.n} / ${c.n}`, x:c.x, y:r.y, green:30, red:24, mode:'Ciclo fijo', phase, left:5+Math.floor(Math.random()*20)};
  if (phase==='yellow') i.left = CONFIG.yellow;
  return i;
}));
const pilot = INTERSECTIONS.find(i => i.name===CONFIG.pilotName);
Object.assign(pilot, {mode:'IA adaptativa', phase:'green', left:28, green:30});

/* 4. UTILIDADES ------------------------------------------------------- */
const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const clamp = (v,a,b) => Math.min(b, Math.max(a, v));
const rand  = (a,b) => a + Math.random()*(b-a);
const fmt   = n => n.toLocaleString('en-US');
const vehicles = () => Math.round(state.demand*14);
let toastTimer;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.classList.remove('show'), 2400);
}
function download(name, rows){
  const csv = '\ufeff' + rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
  const a = Object.assign(document.createElement('a'), {href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download:name});
  a.click(); URL.revokeObjectURL(a.href);
}

/* 5. NAVEGACIÓN ------------------------------------------------------- */
function buildNav(){
  $('#nav').innerHTML = PAGES.map(p =>
    `<button data-act="go" data-page="${p.id}" aria-label="${p.label}"><svg viewBox="0 0 24 24"><path d="${p.icon}"/></svg><span>${p.label}</span>${p.id==='alertas'?'<i class="badge" id="badge"></i>':''}</button>`).join('');
}
function showPage(id){
  const p = PAGES.find(x=>x.id===id) || PAGES[0];
  state.page = p.id; history.replaceState(null,'','#p-'+p.id);
  $$('.page').forEach(el => el.classList.toggle('on', el.id===p.id));
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.page===p.id));
  $('#title').textContent = p.title; $('#subtitle').textContent = p.sub;
  renderLive();
}

/* 6. MAPA ------------------------------------------------------------- */
const maps = [];
function seeded(seed){ return () => (seed = (seed*9301+49297) % 233280) / 233280; }

function createMap(host){
  const rnd = seeded(7), xs=[0,120,400,680,800], ys=[0,110,230,350,460];
  let blocks='';
  for (let i=0;i<4;i++) for (let j=0;j<4;j++){
    const x=xs[i]+14, y=ys[j]+14, w=xs[i+1]-xs[i]-28, h=ys[j+1]-ys[j]-28;
    const park = (i===2 && j===0);
    blocks += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${park?'#122a22':'#121d2b'}"/>`;
    if (!park) for (let k=0;k<3;k++)
      blocks += `<rect x="${x+8+rnd()*(w-60)}" y="${y+8+rnd()*(h-40)}" width="${24+rnd()*30}" height="${16+rnd()*18}" rx="3" fill="#18273a"/>`;
  }
  const roads = ROADS.map(r => `<line x1="${r.a[0]}" y1="${r.a[1]}" x2="${r.b[0]}" y2="${r.b[1]}" stroke="#243449" stroke-width="20"/>`).join('');
  const flow  = ROADS.map(r => `<line x1="${r.a[0]}" y1="${r.a[1]}" x2="${r.b[0]}" y2="${r.b[1]}" stroke="${LEVELS[r.level].color}" stroke-width="4" stroke-linecap="round" opacity=".85"/>`).join('');
  const names = COLS.map(c=>`<text class="street" x="${c.x+8}" y="14">${c.n}</text>`).join('') + ROWS.map(r=>`<text class="street" x="8" y="${r.y-14}">${r.n}</text>`).join('');
  const nodes = INTERSECTIONS.map((n,i) =>
    `<g class="node" data-i="${i}"><circle cx="${n.x}" cy="${n.y}" r="${n===pilot?13:10}" fill="#0b1118" stroke="#fff" stroke-width="3"/><circle cx="${n.x}" cy="${n.y}" r="5"/></g>`).join('');
  const cams = [[2,1],[1,2],[0,0],[2,2]].map(([c,r]) => `<rect x="${COLS[c].x+14}" y="${ROWS[r].y-24}" width="10" height="8" rx="2" fill="#5aa9ff"/>`).join('');
  const label = `<text x="${pilot.x+18}" y="${pilot.y+34}" fill="#9cc9ff" font-size="11" font-weight="700" style="paint-order:stroke;stroke:#0d1621;stroke-width:4px">Piloto IA</text>`;

  host.insertAdjacentHTML('afterbegin',
    `<svg viewBox="0 0 800 460" role="img" aria-label="Mapa de la red vial"><rect width="800" height="460" fill="#0d1621"/>${blocks}${roads}<g class="flow">${flow}<g class="veh"></g></g>${names}<g class="cams">${cams}</g><g class="nodes">${nodes}${label}</g></svg>`);

  const svg = $('svg', host), veh = $('.veh', svg), cars = [];
  ROADS.forEach(r => {
    const n = LEVELS[r.level].cars;
    for (let i=0;i<n;i++){
      const el = document.createElementNS('http://www.w3.org/2000/svg','rect');
      el.setAttribute('width', i%7===0 ? 14 : 9); el.setAttribute('height', 5); el.setAttribute('rx', 1.5);
      el.setAttribute('fill', i%7===0 ? '#5aa9ff' : '#dbe5f1'); veh.appendChild(el);
      cars.push({road:r, el, t:(i+rand(0,.6))/n, dir:i%2?1:-1});
    }
  });

  const legend = document.createElement('div'); legend.className = 'map-legend';
  legend.innerHTML = host.dataset.map==='layers'
    ? `<b>Capas</b>${[['flow','Flujo vehicular'],['signals','Semáforos'],['cams','Cámaras']].map(([k,t])=>`<label><input type="checkbox" data-layer="${k}" checked> ${t}</label>`).join('')}`
    : `<b>Flujo de tráfico</b>${LEVELS.map(l=>`<div><i class="lg" style="background:${l.color}"></i> ${l.name}</div>`).join('')}`;
  host.appendChild(legend);
  maps.push({host, svg, cars});
}

function moveCars(dt){
  maps.forEach(m => {
    if (!m.host.offsetParent) return;                    // mapa oculto: no animar
    m.cars.forEach(c => {
      const r = c.road, len = Math.hypot(r.b[0]-r.a[0], r.b[1]-r.a[1]);
      c.t = (c.t + LEVELS[r.level].speed*dt/len) % 1;
      const t = c.dir>0 ? c.t : 1-c.t, ux = (r.b[0]-r.a[0])/len, uy = (r.b[1]-r.a[1])/len;
      const off = c.dir>0 ? -5 : 5;                      // un carril por sentido
      const x = r.a[0] + (r.b[0]-r.a[0])*t - uy*off, y = r.a[1] + (r.b[1]-r.a[1])*t + ux*off;
      const ang = Math.atan2(uy,ux)*180/Math.PI + (c.dir>0?0:180);
      c.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(0)}) translate(-5 -2.5)`);
    });
  });
}
function paintNodes(){
  maps.forEach(m => $$('.node', m.svg).forEach(g => {
    const i = INTERSECTIONS[g.dataset.i], col = PHASE[i.phase].color;
    $$('circle', g)[0].setAttribute('stroke', col);
    $$('circle', g)[1].setAttribute('fill', col);
    g.classList.toggle('focus', state.focus===i.name);
  }));
}

/* 7. SEMÁFOROS -------------------------------------------------------- */
function advance(i){
  if (i.phase==='green'){ i.phase='yellow'; i.left=CONFIG.yellow; }
  else if (i.phase==='yellow'){ i.phase='red'; i.left=Math.max(i.red, CONFIG.pedMin); }
  else { i.phase='green'; i.left=i.green; }
}
function nextPhase(){
  // Salvaguarda peatonal: no se corta el rojo antes de completar el tiempo mínimo de cruce
  const elapsed = Math.max(pilot.red, CONFIG.pedMin) - pilot.left;
  if (pilot.phase==='red' && elapsed < CONFIG.pedMin){
    return toast(`Cruce peatonal en curso: faltan ${CONFIG.pedMin-elapsed} s para liberar el rojo`);
  }
  advance(pilot); renderLive(); toast('Fase actualizada: ' + PHASE[pilot.phase].label);
}
function renderSignal(){
  const p = pilot, ph = PHASE[p.phase];
  $('#lampR').classList.toggle('on', p.phase==='red');
  $('#lampY').classList.toggle('on', p.phase==='yellow');
  $('#lampG').classList.toggle('on', p.phase==='green');
  $('#sigName').textContent = p.mode;
  $('#sigPhase').textContent = ph.label; $('#sigPhase').style.color = ph.color;
  $('#sigCount').textContent = p.left + ' s';
  $('#sigNext').textContent = 'Próximo cambio: ' + ph.next;
}

/* 8. DECISIÓN DE LA IA ------------------------------------------------ */
function makeProposal(){
  state.demand = Math.round(rand(70,96));
  const green = clamp(Math.round(CONFIG.greenMin + state.demand/100*30), CONFIG.greenMin, CONFIG.greenMax);
  const queue = Math.round(state.demand*0.45), side = Math.round(rand(8,22));
  state.proposal = {
    green, left:CONFIG.approvalSeconds, editing:false,
    reason:`Congestión del ${state.demand}% en Av. Central (cola estimada de ${queue} vehículos) y solo ${side}% en Calle 4. Se propone un verde de ${green} s. El cruce peatonal de ${CONFIG.pedMin} s se mantiene.`,
  };
  renderAI(); renderKpis();
}
function applyProposal(auto){
  const p = state.proposal; if (!p) return;
  const g = clamp(p.green, CONFIG.greenMin, CONFIG.greenMax);
  pilot.green = g;
  if (pilot.phase==='green') pilot.left = g;
  state.lastDecision = `Verde ajustado a ${g} s por alta demanda. Paso peatonal seguro garantizado.`;
  state.proposal = null; renderAI(); renderLive();
  toast(auto ? `La IA aplicó verde de ${g} s` : `Verde de ${g} s aplicado por el operador`);
}
function rejectProposal(){
  state.proposal = null; state.lastDecision = 'El operador rechazó la propuesta. Se mantiene el tiempo actual.';
  renderAI(); toast('Propuesta rechazada');
}
function renderAI(){
  const p = state.proposal, auto = state.mode==='auto';
  let block = '';
  if (p){
    const counting = auto && !p.editing;
    block = `<div class="proposal">
      <div class="prop-top"><b>Verde propuesto: <span id="propGreen">${p.green}</span> s</b>
        <small id="propCd">${p.editing ? 'Cuenta pausada' : auto ? `Se aplica en ${p.left} s` : 'Requiere confirmación'}</small></div>
      ${counting ? `<div class="bar"><i id="propBar" style="width:${p.left/CONFIG.approvalSeconds*100}%"></i></div>` : ''}
      ${p.editing ? `<input type="range" min="${CONFIG.greenMin}" max="${CONFIG.greenMax}" value="${p.green}" id="propRange" aria-label="Duración del verde">` : ''}
      <div class="btns">
        <button class="btn danger sm" data-act="reject">${auto?'Rechazar':'Descartar'}</button>
        ${p.editing ? '' : '<button class="btn sm" data-act="modify">Modificar</button>'}
        <button class="btn primary sm" data-act="approve">${p.editing?'Aplicar':auto?'Aprobar ahora':'Aplicar'}</button>
      </div></div>`;
  }
  $('#aiCard').innerHTML = `<header class="card-h"><h2>Decisión de la IA</h2><span class="chip ${auto?'ok':'mod'}">${auto?'Automático':'Manual'}</span></header>
    <p class="reason">${p ? p.reason : state.lastDecision}</p>${block}
    <div class="btns"><button class="btn" data-act="simulate">Simular decisión de IA</button></div>`;
}
function setMode(m){
  state.mode = m; state.settings.auto = (m==='auto');
  pilot.mode = m==='auto' ? 'IA adaptativa' : 'Control manual';
  $$('.seg button').forEach(b => b.classList.toggle('on', b.dataset.mode===m));
  renderAI(); renderSignal(); renderSettings();
  toast(m==='auto' ? 'Modo automático: la IA aplica tras la cuenta regresiva' : 'Modo manual: la IA solo sugiere');
}

/* 9. GRÁFICOS --------------------------------------------------------- */
function lineChart(el, labels, series, w=620, h=250){
  const pad = {l:34, r:12, t:12, b:26}, max = Math.ceil(Math.max(...series.flatMap(s=>s.data))/10)*10;
  const X = i => pad.l + i*(w-pad.l-pad.r)/(labels.length-1), Y = v => pad.t + (1-v/max)*(h-pad.t-pad.b);
  const grid = [0,.25,.5,.75,1].map(f => `<line class="grid" x1="${pad.l}" x2="${w-pad.r}" y1="${Y(max*f)}" y2="${Y(max*f)}"/><text class="axis" x="${pad.l-6}" y="${Y(max*f)+4}" text-anchor="end">${Math.round(max*f)}</text>`).join('');
  const xl = labels.map((t,i) => i%3===0 || labels.length<13 ? `<text class="axis" x="${X(i)}" y="${h-8}" text-anchor="middle">${t}</text>` : '').join('');
  const lines = series.map(s => {
    const d = s.data.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
    return `<path d="${d} L${X(s.data.length-1)} ${Y(0)} L${X(0)} ${Y(0)}Z" fill="${s.color}" opacity=".08"/><path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }).join('');
  const legend = series.map((s,i)=>`<g transform="translate(${pad.l+10+i*130} ${pad.t+8})"><rect width="12" height="4" y="-2" rx="2" fill="${s.color}"/><text class="axis" x="18" y="3" style="fill:#c3d0de">${s.name}</text></g>`).join('');
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img">${grid}${xl}${lines}${legend}</svg>`;
}
function renderCharts(){
  lineChart($('#bigChart'), HOURS.map(h=>String(h).padStart(2,'0')+'h'),
    [{name:'Ciclo fijo',color:'#ff9a3d',data:WAIT_FIXED},{name:'IA adaptativa',color:'#5aa9ff',data:WAIT_AI}], 620, 330);
  const fixed = Array.from({length:12},(_,k)=>Math.round(WAIT_FIXED[8]*(0.85+0.15*Math.sin(k*1.3))));
  const ai = fixed.map((v,k)=>Math.round(v*(0.64+0.03*Math.cos(k))));
  lineChart($('#miniChart'), fixed.map((_,k)=>`-${(11-k)*5}m`), [{name:'Ciclo fijo',color:'#ff9a3d',data:fixed},{name:'IA',color:'#5aa9ff',data:ai}], 520, 200);
  const red = Math.round((1 - WAIT_AI.reduce((a,b)=>a+b)/WAIT_FIXED.reduce((a,b)=>a+b))*100);
  $('#goalRed').textContent = red + '%';
}

/* 10. RENDER DE PÁGINAS Y WIDGETS ------------------------------------- */
function renderKpis(){
  const wait = Math.round(WAIT_AI[10]*0.8);
  const k = [
    {l:'Vehículos detectados', v:fmt(vehicles()), n:'En el acceso piloto', c:'var(--accent)'},
    {l:'Espera promedio',      v:wait+' s',       n:'−35% frente a ciclo fijo', c:'var(--ok)'},
    {l:'Verde actual',         v:pilot.green+' s',n:'Rango permitido 15–45 s', c:'var(--mod)'},
    {l:'Cruce peatonal',       v:'100%',          n:'Mínimo 18 s garantizado', c:'var(--ok)'},
  ];
  $('#kpis').innerHTML = k.map(x=>`<div class="kpi"><small>${x.l}</small><strong class="num">${x.v}</strong><span style="color:${x.c}">${x.n}</span></div>`).join('');
  $('#sideVeh').textContent = fmt(vehicles());
  const flow = clamp(100 - Math.round((state.demand-30)*0.2), 50, 99);
  $('#ring').style.setProperty('--p', flow); $('#ring').textContent = flow + '%';
  $('#donutTxt').innerHTML = `<span class="num">${fmt(vehicles())}<br><small>vehículos</small></span>`;
}
function renderMix(){
  let acc = 0;
  $('#donut').style.background = 'conic-gradient(' + MIX.map(([,v,c]) => { const s=`${c} ${acc}% ${acc+v}%`; acc+=v; return s; }).join(',') + ')';
  $('#mix').innerHTML = MIX.map(([n,v,c])=>`<div><i class="tone" style="background:${c}"></i>${n}<b class="num">${v}%</b></div>`).join('');
}
function renderRecs(){
  $('#recs').innerHTML = RECS.map(r=>`<div class="rec"><i class="tone" style="background:${r.tone}"></i><div><b>${r.title}</b><small>${r.sub}</small></div><button class="btn sm" data-act="toast" data-msg="${r.msg}" aria-label="Abrir">Ver</button></div>`).join('');
}
function renderTable(){
  $('#signalTable').innerHTML = INTERSECTIONS.map((i,k)=>`<tr class="${i===pilot?'me':''}"><td>${i.name}${i===pilot?' <span class="chip">Piloto</span>':''}</td>
    <td><span class="chip ${PHASE[i.phase].chip}">${PHASE[i.phase].label}</span></td><td class="num">${i.left} s</td><td>${i.mode}</td><td class="num">${i.green}/${i.red} s</td>
    <td><button class="btn sm" data-act="focus" data-i="${k}">Ver en mapa</button></td></tr>`).join('');
}
function renderAlerts(){
  const t = {bad:'ACTIVA',mod:'VIGILAR',ok:'NORMAL',new:'NUEVA'};
  $('#alertList').innerHTML = state.alerts.map(a=>`<div class="row"><span style="display:flex;gap:12px;align-items:center"><i class="tone" style="background:var(--${a.sev==='new'?'accent':a.sev})"></i><span><b>${a.title}</b><small>${a.place} · ${a.min?`hace ${a.min} min`:'ahora'}</small></span></span><span class="chip ${a.sev==='new'?'':a.sev}">${t[a.sev]}</span></div>`).join('');
  const n = state.alerts.filter(a=>a.sev!=='ok').length, b = $('#badge');
  b.textContent = n; b.hidden = !n || !state.settings.alerts;
}
function renderSettings(){
  $('#settings').innerHTML = SETTINGS.map(s=>`<div class="row"><span><b>${s.title}</b><small>${s.desc}</small></span><button class="switch" role="switch" aria-checked="${state.settings[s.key]}" aria-label="${s.title}" data-act="setting" data-key="${s.key}"></button></div>`).join('');
  $('#statusTxt').textContent = state.settings.sim ? 'En vivo · simulado' : 'En vivo';
}
function renderReports(){
  $('#reportList').innerHTML = REPORTS.map((r,i)=>`<div class="row"><span><b>${r.title}</b><small>${r.meta}</small></span><button class="btn sm" data-act="report" data-i="${i}">Descargar CSV</button></div>`).join('');
}
const REPORTS = [
  {title:'Reporte diario de tráfico', meta:'Estado de las 9 intersecciones', file:'trafico_diario.csv',
   rows:()=>[['Intersección','Fase','Segundos restantes','Modo'],...INTERSECTIONS.map(i=>[i.name,PHASE[i.phase].label,i.left,i.mode])]},
  {title:'Reporte de incidentes', meta:'Últimas 24 horas', file:'incidentes.csv',
   rows:()=>[['Alerta','Lugar','Hace (min)'],...state.alerts.map(a=>[a.title,a.place,a.min])]},
  {title:'Rendimiento de la IA', meta:'Espera promedio por hora: ciclo fijo vs IA', file:'rendimiento_ia.csv',
   rows:()=>[['Hora','Ciclo fijo (s)','IA (s)'],...HOURS.map(h=>[h+':00',WAIT_FIXED[h],WAIT_AI[h]])]},
];
function renderCameras(){
  $('#camGrid').innerHTML = CAMERAS.map((c,i)=>`<article class="card"><header class="card-h"><h2>${c.id}</h2><span class="chip ${c.on?'ok':'bad'}">${c.on?'Activa':'Sin señal'}</span></header>
    <div class="cam-view" data-cam="${i}">${c.on?'<span class="rec-tag">● REC</span>':'<p class="muted" style="padding:80px 0;text-align:center">Sin señal</p>'}</div><p style="margin-top:10px">${c.place}</p></article>`).join('');
  $$('.cam-view').forEach(v => {
    if (!CAMERAS[v.dataset.cam].on) return;
    for (let k=0;k<6;k++){
      const person = k===5, b = document.createElement('div');
      b.className = 'box' + (person?' p':''); b.innerHTML = `<span>${person?'peatón':'auto'} ${Math.round(rand(88,99))}%</span>`;
      b.style.cssText = person ? 'width:16px;height:34px' : 'width:44px;height:26px'; v.appendChild(b);
    }
  });
  moveBoxes();
}
function moveBoxes(){
  $$('.cam-view .box').forEach(b => { b.style.left = rand(8,85)+'%'; b.style.top = rand(48,78)+'%'; });
}
function renderLive(){
  renderSignal(); paintNodes(); renderKpis();
  if (state.page==='semaforos') renderTable();
  const p = state.proposal;
  if (p && state.mode==='auto' && !p.editing && $('#propCd')){
    $('#propCd').textContent = `Se aplica en ${p.left} s`;
    const bar = $('#propBar'); if (bar) bar.style.width = (p.left/CONFIG.approvalSeconds*100) + '%';
  }
}
function updateClock(){
  const d = new Date();
  $('#clock').textContent = d.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
  $('#date').textContent  = d.toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'});
}

/* 11. ACCIONES (un único manejador de eventos) ------------------------ */
const ACTIONS = {
  go:        el => showPage(el.dataset.page),
  mode:      el => setMode(el.dataset.mode),
  'next-phase': nextPhase,
  simulate:  makeProposal,
  approve:   () => applyProposal(false),
  reject:    rejectProposal,
  modify:    () => { state.proposal.editing = true; renderAI(); },
  toast:     el => toast(el.dataset.msg),
  focus:     el => { state.focus = INTERSECTIONS[el.dataset.i].name; showPage('mapa'); setTimeout(()=>{ state.focus=null; paintNodes(); }, 4000); },
  report:    el => { const r = REPORTS[el.dataset.i]; download(r.file, r.rows()); toast('Reporte descargado: ' + r.file); },
  incident:  () => {
    state.alerts.unshift({sev:'new', title:'Incidente reportado por el operador', place:CONFIG.pilotName, min:0});
    renderAlerts(); if (state.settings.alerts) toast('Incidente registrado y enviado a Alertas');
  },
  setting:   el => {
    const k = el.dataset.key; state.settings[k] = !state.settings[k];
    if (k==='auto') setMode(state.settings.auto ? 'auto' : 'manual'); else { renderSettings(); renderAlerts(); }
  },
};
document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el) ACTIONS[el.dataset.act]?.(el); });
document.addEventListener('input', e => {
  if (e.target.id==='propRange'){ state.proposal.green = +e.target.value; $('#propGreen').textContent = e.target.value; }
});
document.addEventListener('change', e => {
  if (e.target.dataset.layer) $$('.map svg').forEach(s => s.classList.toggle('hide-'+e.target.dataset.layer, !e.target.checked));
});
window.addEventListener('hashchange', () => { const id = location.hash.slice(3); if (id!==state.page) showPage(id); });

/* 12. CICLO PRINCIPAL ------------------------------------------------- */
let seconds = 0;
function tick(){
  seconds++;
  INTERSECTIONS.forEach(i => { if (--i.left <= 0) advance(i); });
  const p = state.proposal;
  if (p && state.mode==='auto' && !p.editing && --p.left <= 0) applyProposal(true);
  if (!state.proposal && seconds % CONFIG.autoProposalEvery === 0) makeProposal();
  if (seconds % 5 === 0) state.demand = clamp(state.demand + Math.round(rand(-3,3)), 55, 97);
  if (seconds % 2 === 0 && state.page==='camaras') moveBoxes();
  updateClock(); renderLive();
}
let last = performance.now();
function frame(now){ moveCars(Math.min((now-last)/1000, .1)); last = now; requestAnimationFrame(frame); }

function init(){
  buildNav(); $$('[data-map]').forEach(createMap);
  renderMix(); renderRecs(); renderCharts(); renderAlerts(); renderSettings(); renderReports(); renderCameras();
  renderAI(); updateClock();
  showPage(location.hash.slice(3) || 'resumen');
  setInterval(tick, 1000);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(frame); else moveCars(0);
}
init();
