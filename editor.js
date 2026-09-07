/* ===================================================================
   editor.js
   Regelt: het slepen van blokken uit de bloklade naar het canvas,
   het herschikken van blokken, inline bewerken van tekst, het
   stijlpaneel (site-breed + per blok) en het opslaan naar Firebase.
=================================================================== */

const params = new URLSearchParams(window.location.search);
const siteId = params.get('id');
if (!siteId) window.location.href = 'index.html';

let site = null;          // huidige site-data
let selectedBlockId = null;
let saveTimer = null;

const canvas = document.getElementById('canvas');
const libraryEl = document.getElementById('block-library');
const stylePanel = document.getElementById('style-panel');
const nameInput = document.getElementById('site-name');
const saveStatus = document.getElementById('save-status');

/* ---------------- Laden ---------------- */

loadSite(siteId).then(data => {
  if (!data) { window.location.href = 'index.html'; return; }
  site = data;
  site.blocks = site.blocks || [];
  nameInput.value = site.name;
  renderLibrary();
  renderCanvas();
  applySiteStyle();
  renderStylePanel();
});

nameInput.addEventListener('input', () => {
  site.name = nameInput.value;
  queueSave();
});

/* ---------------- Bloklade (links) ---------------- */

function renderLibrary() {
  libraryEl.innerHTML = BLOCK_LIBRARY.map(b => `
    <div class="block-lib-item" draggable="true" data-type="${b.type}">
      <span class="emoji">${b.emoji}</span> ${b.label}
    </div>
  `).join('');

  libraryEl.querySelectorAll('.block-lib-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/new-block', item.dataset.type);
    });
  });
}

/* ---------------- Canvas: renderen ---------------- */

function renderCanvas() {
  if (!site.blocks.length) {
    canvas.innerHTML = `<div class="canvas-empty">Sleep hier een blok naartoe vanuit de lijst links om te beginnen.</div>`;
  } else {
    canvas.innerHTML = site.blocks.map(b => blockWrapperHTML(b)).join('');
  }
  attachCanvasEvents();
}

function blockWrapperHTML(block) {
  const def = getBlockDef(block.type);
  const bgStyle = block.style?.bg ? `style="background:${block.style.bg}"` : '';
  return `
    <div class="block ${'b-' + block.type}-wrap" data-id="${block.id}" draggable="true" ${bgStyle}>
      <div class="block-toolbar">
        <button data-action="up" title="Omhoog">↑</button>
        <button data-action="down" title="Omlaag">↓</button>
        <button data-action="delete" title="Verwijderen">✕</button>
      </div>
      ${def.render(block.content)}
    </div>`;
}

function attachCanvasEvents() {
  // Klikken = selecteren
  canvas.querySelectorAll('.block').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.block-toolbar')) return;
      selectBlock(el.dataset.id);
    });

    // Herschikken via drag
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/reorder-id', el.dataset.id);
    });

    // Toolbar-acties
    el.querySelectorAll('.block-toolbar button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleToolbarAction(el.dataset.id, btn.dataset.action);
      });
    });

    // Inline bewerken
    el.querySelectorAll('[data-field]').forEach(fieldEl => {
      fieldEl.setAttribute('contenteditable', 'true');
      fieldEl.addEventListener('blur', () => {
        const block = site.blocks.find(b => b.id === el.dataset.id);
        if (block) {
          block.content[fieldEl.dataset.field] = fieldEl.innerText;
          queueSave();
        }
      });
    });
  });

  markSelected();
}

/* ---------------- Canvas: drop-doel ---------------- */

canvas.addEventListener('dragover', (e) => { e.preventDefault(); canvas.classList.add('drag-over'); });
canvas.addEventListener('dragleave', () => canvas.classList.remove('drag-over'));

canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  canvas.classList.remove('drag-over');

  const newType = e.dataTransfer.getData('text/new-block');
  const reorderId = e.dataTransfer.getData('text/reorder-id');
  const dropIndex = getDropIndex(e.clientY);

  if (newType) {
    const def = getBlockDef(newType);
    const block = { id: crypto.randomUUID(), type: newType, content: structuredClone(def.defaults) };
    site.blocks.splice(dropIndex, 0, block);
    selectedBlockId = block.id;
  } else if (reorderId) {
    const fromIndex = site.blocks.findIndex(b => b.id === reorderId);
    const [moved] = site.blocks.splice(fromIndex, 1);
    const adjustedIndex = fromIndex < dropIndex ? dropIndex - 1 : dropIndex;
    site.blocks.splice(adjustedIndex, 0, moved);
  }

  renderCanvas();
  renderStylePanel();
  queueSave();
});

function getDropIndex(y) {
  const blocks = [...canvas.querySelectorAll('.block')];
  for (let i = 0; i < blocks.length; i++) {
    const rect = blocks[i].getBoundingClientRect();
    if (y < rect.top + rect.height / 2) return i;
  }
  return blocks.length;
}

/* ---------------- Blok-acties ---------------- */

function handleToolbarAction(id, action) {
  const index = site.blocks.findIndex(b => b.id === id);
  if (index === -1) return;

  if (action === 'delete') {
    site.blocks.splice(index, 1);
    if (selectedBlockId === id) selectedBlockId = null;
  } else if (action === 'up' && index > 0) {
    [site.blocks[index - 1], site.blocks[index]] = [site.blocks[index], site.blocks[index - 1]];
  } else if (action === 'down' && index < site.blocks.length - 1) {
    [site.blocks[index + 1], site.blocks[index]] = [site.blocks[index], site.blocks[index + 1]];
  }

  renderCanvas();
  renderStylePanel();
  queueSave();
}

function selectBlock(id) {
  selectedBlockId = id;
  markSelected();
  renderStylePanel();
}

function markSelected() {
  canvas.querySelectorAll('.block').forEach(el => {
    el.classList.toggle('selected', el.dataset.id === selectedBlockId);
  });
}

/* ---------------- Rechterpaneel: stijl ---------------- */

function renderStylePanel() {
  const block = site.blocks.find(b => b.id === selectedBlockId);

  stylePanel.innerHTML = `
    <h3>Website-stijl</h3>
    <div class="field">
      <label>Accentkleur</label>
      <input type="color" id="site-accent" value="${site.style.accent}">
    </div>
    <div class="field">
      <label>Lettertype</label>
      <select id="site-font">
        <option value="'Inter', sans-serif">Modern (Inter)</option>
        <option value="'Space Grotesk', sans-serif">Speels (Space Grotesk)</option>
        <option value="Georgia, serif">Klassiek (Georgia)</option>
        <option value="'Courier New', monospace">Technisch (Courier)</option>
      </select>
    </div>
    <div class="field">
      <label>Ronde hoeken</label>
      <input type="range" id="site-radius" min="0" max="32" value="${site.style.radius}">
    </div>

    <div class="divider"></div>
    <h3>Geselecteerd blok</h3>
    ${block ? blockStyleFields(block) : '<div class="no-selection">Klik op een blok in het canvas om het te bewerken of van kleur te voorzien.</div>'}
  `;

  document.getElementById('site-accent').addEventListener('input', (e) => {
    site.style.accent = e.target.value; applySiteStyle(); queueSave();
  });
  document.getElementById('site-font').value = site.style.font;
  document.getElementById('site-font').addEventListener('change', (e) => {
    site.style.font = e.target.value; applySiteStyle(); queueSave();
  });
  document.getElementById('site-radius').addEventListener('input', (e) => {
    site.style.radius = Number(e.target.value); applySiteStyle(); queueSave();
  });

  if (block) {
    const bgInput = document.getElementById('block-bg');
    bgInput.addEventListener('input', (e) => {
      block.style = block.style || {};
      block.style.bg = e.target.value;
      renderCanvas();
      queueSave();
    });
    document.getElementById('block-bg-reset').addEventListener('click', () => {
      if (block.style) delete block.style.bg;
      renderCanvas();
      queueSave();
    });
  }
}

function blockStyleFields(block) {
  return `
    <div class="field">
      <label>Achtergrondkleur van dit blok</label>
      <input type="color" id="block-bg" value="${block.style?.bg || '#ffffff'}">
    </div>
    <button class="btn btn-ghost" id="block-bg-reset" style="width:100%; justify-content:center;">Standaardkleur herstellen</button>
  `;
}

function applySiteStyle() {
  canvas.style.setProperty('--site-accent', site.style.accent);
  canvas.style.setProperty('--site-font', site.style.font);
  canvas.style.setProperty('--site-radius', site.style.radius + 'px');
}

/* ---------------- Opslaan ---------------- */

function queueSave() {
  saveStatus.textContent = 'Bezig met opslaan…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveSite(siteId, {
      name: site.name,
      style: site.style,
      blocks: site.blocks,
    }).then(() => { saveStatus.textContent = 'Alles opgeslagen'; });
  }, 500);
}

/* ---------------- Voorbeeld bekijken ---------------- */

document.getElementById('preview-btn').addEventListener('click', () => {
  const html = buildStaticHTML(site);
  const blob = new Blob([html], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank');
});

function buildStaticHTML(site) {
  const blocksHTML = site.blocks.map(b => {
    const def = getBlockDef(b.type);
    const bg = b.style?.bg ? ` style="background:${b.style.bg}"` : '';
    return `<div class="block b-${b.type}"${bg}>${def.render(b.content)}</div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8">
<title>${site.name}</title>
<style>
  body { margin:0; font-family:${site.style.font}; }
  .block { padding:40px 48px; }
  .b-header { text-align:center; padding:64px 24px; }
  .b-text h2 { margin-bottom:10px; }
  .b-image img { width:100%; border-radius:${site.style.radius}px; display:block; }
  .b-button { text-align:center; }
  .b-button a { display:inline-block; padding:12px 26px; border-radius:${site.style.radius}px; background:${site.style.accent}; color:#fff; font-weight:600; text-decoration:none; }
  .b-gallery { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .b-gallery img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:${site.style.radius}px; }
  .b-footer { text-align:center; color:#565C6B; font-size:13.5px; padding:28px 48px; }
</style></head>
<body>${blocksHTML}</body></html>`;
}
