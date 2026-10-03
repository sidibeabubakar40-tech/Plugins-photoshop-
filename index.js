const { app, core } = require("photoshop");
const { storage } = require("uxp");
const $ = id => document.getElementById(id);
const status = message => $("status").textContent = message;
function getLayer(){const doc=app.activeDocument;return doc&&doc.activeLayers&&doc.activeLayers.length?doc.activeLayers[0]:null;}
function refresh(){try{const doc=app.activeDocument;if(!doc){$("docName").textContent="Aucun document";$("docMeta").textContent="Ouvre un document Photoshop.";$("layerName").textContent="Aucun calque";$("layerMeta").textContent="Sélectionne un calque.";return;}$("docName").textContent=doc.name||"Document sans nom";$("docMeta").textContent=doc.width+" × "+doc.height+" px · "+doc.layers.length+" calque(s)";const l=getLayer();if(!l){$("layerName").textContent="Aucun calque";$("layerMeta").textContent="Sélectionne un calque.";return;}$("layerName").textContent=l.name||"Calque sans nom";$("layerMeta").textContent=(l.kind||"Calque")+" · Opacité "+Math.round(l.opacity)+"% · "+(l.visible?"Visible":"Masqué");}catch(e){status("Impossible de lire Photoshop.");}}
async function modal(name,fn){try{status("Traitement…");await core.executeAsModal(fn,{commandName:name});refresh();status("Terminé.");}catch(e){console.error(e);status(e&&e.message?e.message:"Une erreur est survenue.");}}
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
document.querySelectorAll("[data-preset]").forEach(btn=>btn.addEventListener("click",()=>{const p=presets[btn.dataset.preset];modal("Preset "+btn.dataset.preset,async()=>{const l=getLayer();if(!l)throw new Error("Aucun calque actif.");l.opacity=p.opacity;l.name=p.name;});}));
async function exportDoc(type){try{const doc=app.activeDocument;if(!doc)throw new Error("Aucun document ouvert.");const fs=storage.localFileSystem;const ext=type==="png"?".png":".jpg";const file=await fs.getFileForSaving((doc.name||"SIDIBE-export").replace(/\.[^.]+$/,"")+ext);if(!file)return;status("Export…");if(type==="png")await doc.saveAs.png(file,{compression:6});else await doc.saveAs.jpg(file,{quality:10});status("Export "+type.toUpperCase()+" terminé.");}catch(e){console.error(e);status(e.message||"Échec de l'export.");}}
document.querySelectorAll("[data-export]").forEach(btn=>btn.addEventListener("click",()=>exportDoc(btn.dataset.export)));
const workflows={
clean:[["new",null],["preset","clean"]],
social:[["new",null],["preset","soft"]],
presentation:[["new",null],["preset","overlay"]]
};
async function runWorkflow(id){const steps=workflows[id];if(!steps)return;await modal("Workflow "+id,async()=>{for(const [type,arg] of steps){if(type==="new")await app.activeDocument.createLayer({name:"SIDIBE — Workflow"});if(type==="preset"){const l=getLayer();if(!l)throw new Error("Aucun calque actif.");l.opacity=presets[arg].opacity;l.name=presets[arg].name;}}});}
document.querySelectorAll("[data-workflow]").forEach(btn=>btn.addEventListener("click",()=>runWorkflow(btn.dataset.workflow)));
function loadSettings(){try{const s=JSON.parse(localStorage.getItem("sidibe-ai-settings")||"{}");$("aiProvider").value=s.provider||"none";$("aiEndpoint").value=s.endpoint||"";}catch(e){}}
$("saveSettings").addEventListener("click",()=>{localStorage.setItem("sidibe-ai-settings",JSON.stringify({provider:$("aiProvider").value,endpoint:$("aiEndpoint").value.trim()}));$("aiStatus").textContent="Réglages enregistrés localement.";});
$("aiRun").addEventListener("click",()=>{const p=$("aiPrompt").value.trim();if(!p)return $("aiStatus").textContent="Décris l’action à réaliser.";const provider=$("aiProvider").value;if(provider==="none")return $("aiStatus").textContent="Choisis un fournisseur IA dans les réglages avant de connecter l’IA.";$("aiStatus").textContent="Commande enregistrée : "+p+" — connexion sécurisée du fournisseur à finaliser.";});
loadSettings();refresh();