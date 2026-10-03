const { app, core } = require("photoshop");
const $ = id => document.getElementById(id);
const status = message => $("status").textContent = message;
function getLayer(){const doc=app.activeDocument;return doc&&doc.activeLayers&&doc.activeLayers.length?doc.activeLayers[0]:null;}
function refresh(){try{const doc=app.activeDocument;if(!doc){$("docName").textContent="Aucun document";$("docMeta").textContent="Ouvre un document Photoshop.";$("layerName").textContent="Aucun calque";$("layerMeta").textContent="Sélectionne un calque.";return;}$("docName").textContent=doc.name||"Document sans nom";$("docMeta").textContent=doc.width+" × "+doc.height+" px · "+doc.layers.length+" calque(s)";const l=getLayer();if(!l){$("layerName").textContent="Aucun calque";$("layerMeta").textContent="Sélectionne un calque.";return;}$("layerName").textContent=l.name||"Calque sans nom";$("layerMeta").textContent=(l.kind||"Calque")+" · Opacité "+Math.round(l.opacity)+"% · "+(l.visible?"Visible":"Masqué");}catch(e){status("Impossible de lire Photoshop.");console.error(e);}}
async function modal(name,fn){try{status("Traitement…");await core.executeAsModal(fn,{commandName:name});refresh();status("Terminé.");}catch(e){console.error(e);status(e&&e.message?e.message:"Une erreur est survenue.");}}
const actions={
newLayer:()=>modal("Nouveau calque SIDIBE",async()=>{await app.activeDocument.createLayer({name:"SIDIBE — Nouveau calque"});}),
duplicate:()=>modal("Dupliquer le calque",async()=>{const l=getLayer();if(!l)throw new Error("Aucun calque actif.");await l.duplicate();}),
toggle:()=>modal("Afficher ou masquer",async()=>{const l=getLayer();if(!l)throw new Error("Aucun calque actif.");l.visible=!l.visible;}),
rename:async()=>{const l=getLayer();if(!l)return status("Aucun calque actif.");const name=prompt("Nouveau nom du calque",l.name);if(!name||!name.trim())return;await modal("Renommer le calque",async()=>{l.name=name.trim();});},
flipH:()=>modal("Retourner horizontalement",async()=>{const l=getLayer();if(!l)throw new Error("Aucun calque actif.");await l.flip("horizontal");}),
flipV:()=>modal("Retourner verticalement",async()=>{const l=getLayer();if(!l)throw new Error("Aucun calque actif.");await l.flip("vertical");})};
document.querySelectorAll("[data-action]").forEach(btn=>btn.addEventListener("click",()=>actions[btn.dataset.action]()));
const presets={clean:{opacity:100,name:"SIDIBE — Clean"},soft:{opacity:70,name:"SIDIBE — Soft"},overlay:{opacity:85,name:"SIDIBE — Overlay"},fade:{opacity:40,name:"SIDIBE — Fade"}};
document.querySelectorAll("[data-preset]").forEach(btn=>btn.addEventListener("click",()=>{const p=presets[btn.dataset.preset];modal("Preset "+btn.dataset.preset,async()=>{const l=getLayer();if(!l)throw new Error("Aucun calque actif.");l.opacity=p.opacity;l.name=p.name;});}));
refresh();