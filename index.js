const { app, core } = require("photoshop");

const $ = (id) => document.getElementById(id);
const status = (message) => { $("status").textContent = message; };

function activeLayer() {
  const doc = app.activeDocument;
  return doc && doc.activeLayers && doc.activeLayers.length ? doc.activeLayers[0] : null;
}

function refresh() {
  try {
    const doc = app.activeDocument;
    if (!doc) {
      $("docName").textContent = "Aucun document";
      $("docMeta").textContent = "Ouvre un document Photoshop.";
      $("layerName").textContent = "Aucun calque";
      $("layerMeta").textContent = "—";
      return;
    }

    $("docName").textContent = doc.name || "Document sans nom";
    $("docMeta").textContent = `${doc.width} × ${doc.height} px · ${doc.layers.length} calque(s)`;

    const layer = activeLayer();
    if (layer) {
      $("layerName").textContent = layer.name || "Calque sans nom";
      $("layerMeta").textContent = `${layer.kind || "Calque"} · Opacité ${Math.round(layer.opacity)}% · ${layer.visible ? "Visible" : "Masqué"}`;
    } else {
      $("layerName").textContent = "Aucun calque";
      $("layerMeta").textContent = "Sélectionne un calque.";
    }
  } catch (error) {
    status("Impossible de lire le document.");
    console.error(error);
  }
}

async function modal(name, fn) {
  try {
    status("Traitement…");
    await core.executeAsModal(fn, { commandName: name });
    refresh();
    status("Terminé.");
  } catch (error) {
    console.error(error);
    status(error && error.message ? error.message : "Une erreur est survenue.");
  }
}

$("refresh").addEventListener("click", refresh);

$("newLayer").addEventListener("click", () => modal("Nouveau calque", async () => {
  const doc = app.activeDocument;
  await doc.createLayer({ name: "SIDIBE — Nouveau calque" });
}));

$("duplicate").addEventListener("click", () => modal("Dupliquer le calque", async () => {
  const layer = activeLayer();
  if (!layer) throw new Error("Aucun calque actif.");
  await layer.duplicate();
}));

$("toggle").addEventListener("click", () => modal("Afficher ou masquer", async () => {
  const layer = activeLayer();
  if (!layer) throw new Error("Aucun calque actif.");
  layer.visible = !layer.visible;
}));

$("rename").addEventListener("click", async () => {
  const layer = activeLayer();
  if (!layer) { status("Aucun calque actif."); return; }
  const name = prompt("Nouveau nom du calque", layer.name);
  if (!name || !name.trim()) return;
  await modal("Renommer le calque", async () => { layer.name = name.trim(); });
});

$("flipH").addEventListener("click", () => modal("Retourner horizontalement", async () => {
  const layer = activeLayer();
  if (!layer) throw new Error("Aucun calque actif.");
  await layer.flip("horizontal");
}));

refresh();