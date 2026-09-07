/* ===================================================================
   main.js — landingspagina
=================================================================== */

const grid = document.getElementById('sites-grid');
const modal = document.getElementById('template-modal');
const templateGrid = document.getElementById('template-grid');

document.getElementById('new-site-btn').addEventListener('click', openTemplateModal);
document.getElementById('new-site-btn-2').addEventListener('click', openTemplateModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeTemplateModal(); });

function openTemplateModal() {
  templateGrid.innerHTML = TEMPLATES.map(t => `
    <button class="template-card" data-id="${t.id}">
      <div class="swatch" style="background:${t.color}"></div>
      <strong>${t.name}</strong>
      <span>${t.description}</span>
    </button>
  `).join('');
  templateGrid.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => startNewSite(card.dataset.id));
  });
  modal.hidden = false;
}

function closeTemplateModal() { modal.hidden = true; }

function startNewSite(templateId) {
  const template = getTemplate(templateId);
  const name = template.id === 'blank' ? 'Naamloze website' : template.name;
  createSite(name, template).then(siteId => {
    window.location.href = `editor.html?id=${siteId}`;
  });
}

function renderSites() {
  const ids = getLocalSiteIds();
  if (!ids.length) {
    grid.innerHTML = `<div class="empty-state">Je hebt nog geen website gemaakt. Klik op "Nieuwe website" om te beginnen.</div>`;
    return;
  }
  Promise.all(ids.map(id => loadSite(id).then(data => ({ id, data })))).then(sites => {
    grid.innerHTML = sites
      .filter(s => s.data)
      .map(s => `
        <a class="site-card" href="editor.html?id=${s.id}">
          <div class="thumb" style="background:${s.data.style?.accent ? s.data.style.accent + '22' : '#F1F0FF'}"></div>
          <h3>${s.data.name}</h3>
          <p>${new Date(s.data.createdAt).toLocaleDateString('nl-NL')}</p>
        </a>
      `).join('');
  });
}

renderSites();
