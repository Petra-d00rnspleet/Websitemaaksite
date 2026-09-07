/* ===================================================================
   blocks.js
   Definieert alle blok-types die een gebruiker kan toevoegen, en de
   sjablonen (voorgevulde combinaties van blokken) waaruit gekozen kan
   worden bij het maken van een nieuwe website.

   Elk blok heeft:
     type      - unieke sleutel
     label     - naam in de bloklade
     emoji     - klein icoon
     defaults  - standaard inhoud (content) bij toevoegen
     render(content) -> HTML-string voor in de canvas
     editableFields - lijst van CSS-selectors binnen het blok die
                       contenteditable moeten worden
=================================================================== */

const BLOCK_LIBRARY = [
  {
    type: 'header',
    label: 'Titelblok',
    emoji: '🧱',
    defaults: { title: 'Welkom op mijn website', subtitle: 'Een korte introductie die precies vertelt waar dit over gaat.' },
    render: (c) => `
      <div class="b-header">
        <h1 data-field="title">${c.title}</h1>
        <p data-field="subtitle">${c.subtitle}</p>
      </div>`,
  },
  {
    type: 'text',
    label: 'Tekstblok',
    emoji: '📝',
    defaults: { heading: 'Over dit onderdeel', body: 'Schrijf hier de tekst voor deze sectie. Klik erop om het direct te bewerken.' },
    render: (c) => `
      <div class="b-text">
        <h2 data-field="heading">${c.heading}</h2>
        <p data-field="body">${c.body}</p>
      </div>`,
  },
  {
    type: 'image',
    label: 'Afbeelding',
    emoji: '🖼️',
    defaults: { src: 'https://placehold.co/800x400/EEF1F6/565C6B?text=Sleep+je+eigen+afbeelding+hierheen', alt: 'Afbeelding' },
    render: (c) => `
      <div class="b-image">
        <img src="${c.src}" alt="${c.alt}">
      </div>`,
  },
  {
    type: 'button',
    label: 'Knop',
    emoji: '🔘',
    defaults: { text: 'Neem contact op', href: '#' },
    render: (c) => `
      <div class="b-button">
        <a href="${c.href}" data-field="text">${c.text}</a>
      </div>`,
  },
  {
    type: 'gallery',
    label: 'Galerij',
    emoji: '🗂️',
    defaults: {
      images: [
        'https://placehold.co/300x300/F1F0FF/4B5FFF?text=1',
        'https://placehold.co/300x300/FFF1EB/FF7A50?text=2',
        'https://placehold.co/300x300/EEF1F6/14171F?text=3',
      ],
    },
    render: (c) => `
      <div class="b-gallery">
        ${c.images.map(src => `<img src="${src}" alt="">`).join('')}
      </div>`,
  },
  {
    type: 'footer',
    label: 'Voettekst',
    emoji: '📎',
    defaults: { text: '© ' + new Date().getFullYear() + ' — Gemaakt met Bouwsteen' },
    render: (c) => `
      <div class="b-footer" data-field="text">${c.text}</div>`,
  },
];

function getBlockDef(type) {
  return BLOCK_LIBRARY.find(b => b.type === type);
}

/* ---------------- Sjablonen ---------------- */
/* Elk sjabloon is een lijst blokken (type + content) die als startpunt
   in de canvas worden gezet. De gebruiker kan daarna vrij blokken
   toevoegen, verwijderen, herschikken en de stijl volledig aanpassen. */

const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blanco',
    description: 'Begin met een leeg canvas en bouw het helemaal zelf op.',
    color: '#EEF1F6',
    blocks: [],
    style: { accent: '#4B5FFF', font: "'Inter', sans-serif", radius: 14 },
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Laat je werk zien met een titel, over-tekst en galerij.',
    color: '#F1F0FF',
    style: { accent: '#4B5FFF', font: "'Space Grotesk', sans-serif", radius: 18 },
    blocks: [
      { type: 'header', content: { title: 'Hoi, ik ben [naam]', subtitle: 'Ik maak [wat je maakt] — bekijk hieronder een selectie van mijn werk.' } },
      { type: 'gallery', content: null },
      { type: 'text', content: { heading: 'Over mij', body: 'Vertel hier kort wie je bent en wat je drijft.' } },
      { type: 'button', content: { text: 'Stuur me een bericht', href: '#' } },
      { type: 'footer', content: null },
    ],
  },
  {
    id: 'business',
    name: 'Bedrijf',
    description: 'Een zakelijke pagina met diensten en een duidelijke oproep tot actie.',
    color: '#FFF1EB',
    style: { accent: '#FF7A50', font: "'Inter', sans-serif", radius: 8 },
    blocks: [
      { type: 'header', content: { title: '[Bedrijfsnaam]', subtitle: 'We helpen [doelgroep] met [wat jullie doen].' } },
      { type: 'text', content: { heading: 'Wat we doen', body: 'Beschrijf hier jullie diensten of producten.' } },
      { type: 'image', content: null },
      { type: 'button', content: { text: 'Vraag een offerte aan', href: '#' } },
      { type: 'footer', content: null },
    ],
  },
];

function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
}
