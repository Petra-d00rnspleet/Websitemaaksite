# Bouwsteen — basis van je website-bouwer

Dit is de basis van je "maak-een-website"-platform: een landingspagina waar
je een sjabloon kiest, en een editor waarin je blokken sleept en de stijl
(kleur, lettertype, ronde hoeken, achtergrond per blok) volledig aanpast.
Alles is puur HTML/CSS/JS, geen framework of build-stap nodig.

## Structuur

```
website-builder/
├── index.html          Landingspagina: overzicht van je sites + sjabloonkeuze
├── editor.html          De bouw-editor
├── css/
│   └── style.css        Alle stijl (design tokens bovenin het bestand)
└── js/
    ├── blocks.js         Definities van alle blok-types + de 3 startsjablonen
    ├── firebase-config.js  Firebase-verbinding + database-functies
    ├── main.js           Logica van de landingspagina
    └── editor.js          Logica van de editor (drag & drop, opslaan, stijl)
```

## 1. Firebase instellen

1. Ga naar de [Firebase Console](https://console.firebase.google.com) en maak een project.
2. Voeg een "Web app" toe (</> icoon) — je krijgt dan een configuratie-object.
3. Kopieer de waarden naar `js/firebase-config.js` (de `firebaseConfig`-variabele).
4. Ga naar **Build → Realtime Database** en maak een database aan.
5. Zet de regels (tab "Regels") tijdens het ontwikkelen bijvoorbeeld op:

   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

   ⚠️ Dit is alleen geschikt om te testen. Voordat je dit écht livezet moet
   je regels strenger maken (zie stap 3 hieronder).

## 2. Op GitHub zetten en hosten

Omdat het pure statische bestanden zijn, kun je dit direct hosten met
**GitHub Pages**:

1. Maak een repository aan en push deze map erin.
2. Ga naar **Settings → Pages** in de repository.
3. Kies bij "Source" de branch `main` en map `/ (root)`.
4. Na een minuut is de site bereikbaar op `https://<gebruikersnaam>.github.io/<repo>/`.

Elke keer dat je nieuwe wijzigingen pusht, wordt de site automatisch
bijgewerkt.

## 3. Wat nu nog ontbreekt (bewuste keuzes voor een simpele basis)

Deze punten zijn met opzet weggelaten om de basis overzichtelijk te
houden — ze zijn de logische vervolgstappen:

- **Inloggen (Firebase Authentication).** Nu wordt "welke sites zijn van
  mij" alleen onthouden in de browser (`localStorage`). Iedereen die de
  site-URL raadt kan 'm nu ook bewerken. Voeg Firebase Auth toe (bv.
  e-mail/wachtwoord of Google-login) en koppel elke site aan een
  `ownerId`, zodat je de databaseregels kunt verscherpen tot
  `".write": "auth.uid === data.child('ownerId').val()"`.
- **Gepubliceerde website per gebruiker.** De "Bekijk website"-knop opent
  nu een tijdelijk voorbeeld. Voor een echte live-URL per gebruiker kun je
  bijvoorbeeld een Cloud Function schrijven die `buildStaticHTML()`
  (staat al in `editor.js`) gebruikt om de pagina te genereren en op te
  slaan, of Firebase Hosting met een subpad per site.
- **Meer bloktypes en media-upload.** Nu wordt voor afbeeldingen een
  URL gebruikt; met Firebase Storage kun je gebruikers eigen bestanden
  laten uploaden.
- **Undo/redo en automatisch conflictbeheer** als iemand met meerdere
  tabbladen tegelijk bewerkt.

## Hoe het werkt (kort)

- Elk **blok** (`js/blocks.js`) heeft een `render()`-functie die de HTML
  teruggeeft. Nieuwe bloktypes toevoegen = een nieuw object aan
  `BLOCK_LIBRARY` toevoegen.
- Elk **sjabloon** is gewoon een startlijstje blokken — pas `TEMPLATES` aan
  om een nieuw startpunt toe te voegen.
- De **stijl** (`site.style`) bevat `accent`, `font` en `radius`, en wordt
  toegepast via CSS-variabelen (`--site-accent`, `--site-font`,
  `--site-radius`) op het canvas-element — dat is het mechanisme waarmee
  elke gebruiker zijn site volledig kan aanpassen zonder dat de CSS zelf
  hoeft te veranderen.
- Alles wordt met een halve seconde vertraging (debounce) automatisch
  opgeslagen naar `sites/{siteId}` in de Realtime Database.
