const { app, core, constants } = require("photoshop");
const { storage } = require("uxp");
const secureStorage = storage.secureStorage;
const HISTORY_KEY = "sidibe-history-v5";
const CUSTOM_PRESETS_KEY = "sidibe-custom-presets-v5";
const $ = id => document.getElementById(id);
const status = message => $("status").textContent = message;
function getHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]")}catch(e){return []}}
function addHistory(label){const h=getHistory();h.unshift({label:label,time:new Date().toLocaleTimeString()});localStorage.setItem(HISTORY_KEY,JSON.stringify(h.slice(0,20)));renderHistory();}
function renderHistory(){const el=$("historyList");if(!el)return;const h=getHistory();el.innerHTML=h.length?h.map(function(x){return "<div class=\"history-item\"><span>"+x.label+"</span><small>"+x.time+"</small></div>"}).join(""):"<div class=\"muted\">Aucune opération récente.</div>";}
function getLayer(){const doc=app.activeDocument;return doc&&doc.activeLayers&&doc.activeLayers.length?doc.activeLayers[0]:null;}
function refresh(){try{const doc=app.activeDocument;if(!doc){$("docName").textContent="Aucun document";$("docMeta").textContent="Ouvre un document Photoshop.";$("layerName").textContent="Aucun calque";$("layerMeta").textContent="Sélectionne un calque.";return;}$("docName").textContent=doc.name||"Document sans nom";$("docMeta").textContent=doc.width+" × "+doc.height+" px · "+doc.layers.length+" calque(s)";const l=getLayer();if(!l){$("layerName").textContent="Aucun calque";$("layerMeta").textContent="Sélectionne un calque.";return;}$("layerName").textContent=l.name||"Calque sans nom";$("layerMeta").textContent=(l.kind||"Calque")+" · Opacité "+Math.round(l.opacity)+"% · "+(l.visible?"Visible":"Masqué");}catch(e){status("Impossible de lire Photoshop.");}}
async function modal(name,fn){try{status("Traitement…");await core.executeAsModal(fn,{commandName:name});refresh();addHistory(name);status("Terminé.");}catch(e){console.error(e);status(e&&e.message?e.message:"Une erreur est survenue.");}}
const actions={
newLayer:()=>modal("Nouveau calque SIDIBE",async()=>{await app.activeDocument.createLayer({name:"SIDIBE — Nouveau calque"});}),
duplicate:()=>modal("Dupliquer le calque",async()=>{const l=getLayer();if(!l)throw new Error("Aucun calque actif.");await l.duplicate();}),
toggle:()=>modal("Afficher ou masquer",async()=>{const l=getLayer();if(!l)throw new Error("Aucun calque actif.");l.visible=!l.visible;}),
rename:async()=>{const l=getLayer();if(!l)return status("Aucun calque actif.");const name=prompt("Nouveau nom du calque",l.name);if(!name||!name.trim())return;await modal("Renommer le calque",async()=>{l.name=name.trim();});},
flipH:()=>modal("Retourner horizontalement",async()=>{const l=getLayer();if(!l)throw new Error("Aucun calque actif.");await l.flip("horizontal");}),
flipV:()=>modal("Retourner verticalement",async()=>{const l=getLayer();if(!l)throw new Error("Aucun calque actif.");await l.flip("vertical");})
};
document.querySelectorAll("[data-action]").forEach(btn=>btn.addEventListener("click",()=>actions[btn.dataset.action]()));
const presets={clean:{opacity:100,name:"SIDIBE — Clean"},soft:{opacity:70,name:"SIDIBE — Soft"},overlay:{opacity:85,name:"SIDIBE — Overlay"},fade:{opacity:40,name:"SIDIBE — Fade"}};
async function applyPreset(p){const l=getLayer();if(!l)throw new Error("Aucun calque actif.");l.opacity=p.opacity;l.name=p.name;}
document.querySelectorAll("[data-preset]").forEach(btn=>btn.addEventListener("click",()=>{const p=presets[btn.dataset.preset];modal("Preset "+btn.dataset.preset,()=>applyPreset(p));}));
async function exportDoc(type){try{const doc=app.activeDocument;if(!doc)throw new Error("Aucun document ouvert.");const file=await storage.localFileSystem.getFileForSaving((doc.name||"SIDIBE-export").replace(/\.[^.]+$/,"")+(type==="png"?".png":".jpg"));if(!file)return;status("Export…");if(type==="png")await doc.saveAs.png(file,{compression:6},true);else await doc.saveAs.jpg(file,{quality:10},true);status("Export "+type.toUpperCase()+" terminé.");}catch(e){console.error(e);status(e.message||"Échec de l'export.");}}
document.querySelectorAll("[data-export]").forEach(btn=>btn.addEventListener("click",()=>exportDoc(btn.dataset.export)));

async function upscale(mode){await modal("Upscale "+mode,async()=>{const doc=app.activeDocument;if(!doc)throw new Error("Aucun document.");if(mode==="firefly"){if(typeof doc.generativeUpscale!=="function")throw new Error("Generative Upscale nécessite une version récente de Photoshop.");await doc.generativeUpscale(constants.GenerativeUpscaleModel.FIREFLY,{scale:2});}else{await doc.resizeImage(doc.width*2,doc.height*2,doc.resolution,constants.ResampleMethod.DEEPUPSCALE);}});}
$("upscale2").addEventListener("click",()=>upscale("deep"));
$("upscaleFirefly").addEventListener("click",()=>upscale("firefly"));
$("trim").addEventListener("click",()=>modal("Rogner transparence",async()=>{await app.activeDocument.trim(constants.TrimType.TRANSPARENT,true,true,true,true);}));
$("rotate90").addEventListener("click",()=>modal("Rotation 90 degrés",async()=>{await app.activeDocument.rotate(90);}));

async function batchPreset(name){await modal("Batch "+name,async()=>{const doc=app.activeDocument;if(!doc)throw new Error("Aucun document.");for(const l of doc.layers){if(name==="clean"){l.opacity=100;}else if(name==="soft"){l.opacity=70;}else if(name==="fade"){l.opacity=40;}}});}
document.querySelectorAll("[data-batch]").forEach(btn=>btn.addEventListener("click",()=>batchPreset(btn.dataset.batch)));

async function runWorkflow(id){const doc=app.activeDocument;if(!doc)return status("Aucun document.");if(id==="clean")await modal("Workflow nettoyage",async()=>{const l=getLayer();if(l)await applyPreset(presets.clean);});if(id==="social")await modal("Workflow réseaux",async()=>{const l=getLayer();if(l)await applyPreset(presets.soft);});if(id==="presentation")await modal("Workflow premium",async()=>{const l=getLayer();if(l)await applyPreset(presets.overlay);});}
document.querySelectorAll("[data-workflow]").forEach(btn=>btn.addEventListener("click",()=>runWorkflow(btn.dataset.workflow)));

function settings(){try{return JSON.parse(localStorage.getItem("sidibe-ai-settings")||"{}")}catch(e){return {}}}
function loadSettings(){const s=settings();$("aiProvider").value=s.provider||"none";$("aiEndpoint").value=s.endpoint||"";}
$("saveSettings").addEventListener("click",()=>{localStorage.setItem("sidibe-ai-settings",JSON.stringify({provider:$("aiProvider").value,endpoint:$("aiEndpoint").value.trim()}));$("aiStatus").textContent="Endpoint enregistré localement. La clé reste uniquement en mémoire.";});
async function runAI(){const prompt=$("aiPrompt").value.trim();if(!prompt)return $("aiStatus").textContent="Décris l’action à réaliser.";const s=settings();if(s.provider==="none"||!s.endpoint)return $("aiStatus").textContent="Configure d’abord le fournisseur et l’endpoint.";const key=$("aiKey").value.trim();if(!key)return $("aiStatus").textContent="Entre ta clé API pour cette session.";const doc=app.activeDocument;const payload={plugin:"SIDIBE Photoshop Toolkit",version:"4.0.0",prompt,document:doc?{name:doc.name,width:doc.width,height:doc.height,layers:doc.layers.length}:null};try{$("aiStatus").textContent="Connexion IA…";const response=await fetch(s.endpoint,{method:"POST",headers:{"Content-Type":"application/json","Authorization:"Bearer "+key},body:JSON.stringify(payload)});if(!response.ok)throw new Error("API HTTP "+response.status);const data=await response.json();if(Array.isArray(data.actions)){await modal("Exécution IA",async()=>{for(const a of data.actions){const l=getLayer();if(a.type==="newLayer")await app.activeDocument.createLayer({name:a.name||"SIDIBE — IA"});if(a.type==="rename"&&l)l.name=a.name||l.name;if(a.type==="opacity"&&l)l.opacity=Math.max(0,Math.min(100,Number(a.value)));if(a.type==="visibility"&&l)l.visible=!!a.value;if(a.type==="flipH"&&l)await l.flip("horizontal");if(a.type==="flipV"&&l)await l.flip("vertical");}});}$("aiStatus").textContent="Réponse IA reçue et actions compatibles exécutées.";}catch(e){console.error(e);$("aiStatus").textContent="Erreur IA : "+(e.message||"connexion impossible");}}
$("aiRun").addEventListener("click",runAI);
loadSettings();refresh();
$("selectionExpand")?.addEventListener("click",()=>modal("Étendre la sélection",async()=>{const v=Math.max(1,Math.min(500,Number($("selectionPx").value)||20));if(!app.activeDocument.selection.bounds)throw new Error("Aucune sélection active.");await app.activeDocument.selection.expand(v);}));
$("selectionFeather")?.addEventListener("click",()=>modal("Adoucir la sélection",async()=>{const v=Math.max(.1,Math.min(1000,Number($("selectionPx").value)||10));if(!app.activeDocument.selection.bounds)throw new Error("Aucune sélection active.");await app.activeDocument.selection.feather(v);}));
$("selectionDeselect")?.addEventListener("click",()=>modal("Désélectionner",async()=>{await app.activeDocument.selection.deselect();}));
$("clearHistory")?.addEventListener("click",()=>{localStorage.removeItem(HISTORY_KEY);renderHistory();status("Historique effacé.");});
function renderCustomPresets(){const box=$("customPresetList");if(!box)return;let a=[];try{a=JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY)||"[]")}catch(e){}box.innerHTML=a.length?a.map(function(p){return "<button data-custom=\""+p.id+"\">"+p.name+" · "+p.opacity+"%</button>"}).join(""):"<div class=\"muted\">Aucun preset personnalisé.</div>";box.querySelectorAll("[data-custom]").forEach(function(b){b.addEventListener("click",function(){const p=a.find(function(x){return x.id===b.dataset.custom});if(p)modal("Preset "+p.name,async()=>{const l=getLayer();if(!l)throw new Error("Aucun calque actif.");l.opacity=p.opacity;l.name=p.name;});});});}
$("saveCustomPreset")?.addEventListener("click",()=>{const name=$("customPresetName").value.trim();const opacity=Math.max(0,Math.min(100,Number($("customPresetOpacity").value)||100));if(!name)return status("Donne un nom au preset.");let a=JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY)||"[]");a.push({id:"p"+Date.now(),name:name,opacity:opacity});localStorage.setItem(CUSTOM_PRESETS_KEY,JSON.stringify(a.slice(-20)));$("customPresetName").value="";renderCustomPresets();status("Preset enregistré.");});
renderCustomPresets();renderHistory();
