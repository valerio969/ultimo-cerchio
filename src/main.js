/**
 * ULTIMO CERCHIO — Avvio del gioco
 *
 * Questo file fa tre cose:
 *   1. calcola quanto è grande lo schermo e quanti pixel veri ha
 *   2. misura le safe area dell'iPhone (notch in alto, barra in basso)
 *   3. accende Phaser con le scene del gioco
 *
 * Non c'è logica di gioco qui dentro.
 */

import Phaser from 'phaser';
import { CONFIG } from './config.js';
import SceneAvvio from './scene/SceneAvvio.js';
import SceneGioco from './scene/SceneGioco.js';
import SceneGameOver from './scene/SceneGameOver.js';
import { mostraMessaggioInstallazione } from './installazione.js';

const contenitore = document.getElementById('gioco');

/**
 * DENSITÀ DI PIXEL
 *
 * Un iPhone dice al browser di essere larghezza 393, ma ha 1179 pixel veri:
 * ogni pixel "dichiarato" ne vale 3. Se disegniamo su 393 pixel il risultato viene
 * ingrandito dal telefono e appare sfocato. Quindi disegniamo su 393 × densità.
 * La densità la limitiamo (vedi config.grafica.densitaPixelMassima) perché
 * seguirla alla lettera vorrebbe dire disegnare 9 volte più pixel e perdere i 60 fps.
 */
export const DENSITA = Math.min(
  window.devicePixelRatio || 1,
  CONFIG.grafica.densitaPixelMassima
);

/**
 * Misura le safe area dell'iPhone leggendole dall'elemento nascosto in index.html.
 * Restituisce i valori già convertiti in pixel del gioco (cioè moltiplicati per
 * la densità), pronti da usare per posizionare l'interfaccia.
 */
export function leggiSafeArea() {
  const elemento = document.getElementById('misura-safe-area');
  if (!elemento) return { alto: 0, destra: 0, basso: 0, sinistra: 0 };

  const stile = getComputedStyle(elemento);
  const numero = (valore) => (parseFloat(valore) || 0) * DENSITA;

  return {
    alto: numero(stile.paddingTop),
    destra: numero(stile.paddingRight),
    basso: numero(stile.paddingBottom),
    sinistra: numero(stile.paddingLeft),
  };
}

/**
 * Quanto è grande il contenitore del gioco, in pixel veri dello schermo.
 *
 * I ripieghi servono davvero: se la pagina viene aperta in una scheda non ancora
 * disegnata, il contenitore misura zero, e un gioco larghezza zero fa fallire la
 * scheda grafica con un errore incomprensibile. Meglio partire con una misura
 * plausibile e correggerla al primo ridimensionamento.
 */
function dimensioniGioco() {
  const larghezzaCss = contenitore.clientWidth || window.innerWidth || 390;
  const altezzaCss = contenitore.clientHeight || window.innerHeight || 780;

  return {
    larghezza: Math.max(2, Math.round(larghezzaCss * DENSITA)),
    altezza: Math.max(2, Math.round(altezzaCss * DENSITA)),
  };
}

const dimensioni = dimensioniGioco();

const gioco = new Phaser.Game({
  type: Phaser.AUTO,           // usa la scheda grafica (WebGL), oppure Canvas se non c'è
  parent: 'gioco',
  backgroundColor: CONFIG.colori.sfondo,

  scale: {
    // Scale.NONE = gestiamo noi le dimensioni, perché è l'unico modo di avere
    // un'immagine nitida sui telefoni retina.
    // Disegniamo su un'area grande (larghezza × densità) e poi con lo zoom la
    // rimpiccioliamo alla dimensione vera dello schermo: tanti pixel schiacciati
    // in poco spazio, cioè un'immagine nitida.
    mode: Phaser.Scale.NONE,
    width: dimensioni.larghezza,
    height: dimensioni.altezza,
    zoom: 1 / DENSITA,
    autoRound: true,
  },

  input: {
    // Phaser normalmente accende la gestione del tocco solo se "rileva" un
    // dispositivo touch. Quella rilevazione a volte sbaglia, e per un gioco che
    // si comanda col dito significa un gioco che non risponde. Quindi la
    // accendiamo noi, esplicitamente, sempre.
    touch: true,
    mouse: true,
    keyboard: true,

    // Un dito solo comanda il personaggio: è la scelta di progetto del gioco.
    // Con 1 solo puntatore attivo, un eventuale secondo dito viene ignorato da
    // Phaser invece di fare confusione.
    activePointers: 1,

    // 0 = nessun ammorbidimento, il personaggio segue il dito senza ritardo.
    // Se sul telefono il movimento ti sembra nervoso, prova 0.2: diventa più
    // fluido ma un pelo più lento a rispondere.
    smoothFactor: 0,
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },   // vista dall'alto: niente gravità, non si "cade"
      debug: CONFIG.debug.mostraCorpiFisici,
    },
  },

  render: {
    antialias: true,
    powerPreference: 'high-performance',
    // Il gioco riempie tutto lo schermo, quindi il browser non ha bisogno di
    // sapere cosa c'è dietro: risparmiamo lavoro.
    transparent: false,
    // ATTENZIONE, questa riga è importante: quando lo zoom è diverso da 1,
    // Phaser dà per scontato che il gioco sia in stile "pixel art" e disattiva
    // la levigatura, il che qui renderebbe le forme scalettate. Siccome lo zoom
    // lo usiamo per la densità di pixel, dobbiamo dirgli esplicitamente di no.
    pixelArt: false,
    roundPixels: false,
  },

  // Phaser prova a stare a 60 fps. Se il telefono non ce la fa, rallenta invece
  // di accumulare ritardo.
  fps: { target: 60, min: 30 },

  // L'ordine conta: la prima scena dell'elenco è quella che parte.
  scene: [SceneAvvio, SceneGioco, SceneGameOver],
});

/**
 * RIDIMENSIONAMENTO
 * Succede quando ruoti il telefono, quando la barra di Safari appare o
 * scompare, o quando ridimensioni la finestra sul Mac.
 * Con Scale.NONE dobbiamo dirlo noi a Phaser.
 */
function adattaAlloSchermo() {
  const nuove = dimensioniGioco();
  if (nuove.larghezza < 2 || nuove.altezza < 2) return;
  gioco.scale.resize(nuove.larghezza, nuove.altezza);
}

window.addEventListener('resize', adattaAlloSchermo);
window.addEventListener('orientationchange', () => {
  // Su iPhone dopo la rotazione le dimensioni corrette arrivano con un attimo di
  // ritardo: se misuriamo subito, misuriamo quelle vecchie.
  setTimeout(adattaAlloSchermo, 120);
});

/**
 * SBLOCCO DELL'AUDIO SU IPHONE
 *
 * Safari vieta a una pagina web di emettere suoni prima che l'utente abbia
 * toccato lo schermo: è una difesa contro le pagine che partono a urlare da sole.
 * Finché non tocchi, il motore audio del browser resta "sospeso" e ogni suono
 * cade nel vuoto, senza nessun errore.
 *
 * Phaser di solito se ne occupa da sé, ma qui lo facciamo anche noi, e a livello
 * della pagina invece che del gioco. Il motivo è delicato: Safari accetta il
 * risveglio del motore audio SOLO se avviene dentro la gestione vera dell'evento
 * del browser. Phaser invece mette gli eventi in fila e li elabora al fotogramma
 * dopo — troppo tardi, per Safari.
 */
let audioSbloccato = false;
function sbloccaAudio() {
  if (audioSbloccato) return;

  const gestore = gioco.sound;
  if (!gestore) return;

  if (gestore.context && gestore.context.state === 'suspended') {
    gestore.context.resume();
  }
  if (gestore.locked && typeof gestore.unlock === 'function') {
    gestore.unlock();
  }

  audioSbloccato = true;
  for (const evento of ['pointerdown', 'touchstart', 'keydown']) {
    window.removeEventListener(evento, sbloccaAudio);
  }
}

for (const evento of ['pointerdown', 'touchstart', 'keydown']) {
  window.addEventListener(evento, sbloccaAudio, { passive: true });
}

// Togliamo la scritta di caricamento: da qui in poi comanda Phaser.
gioco.events.once('ready', () => {
  document.getElementById('caricamento')?.remove();

  // Su iPhone, spieghiamo come mettere il gioco nella schermata Home.
  // Aspettiamo che il gioco sia partito, così il messaggio compare sopra
  // l'arena e si capisce di cosa stiamo parlando.
  setTimeout(mostraMessaggioInstallazione, 900);
});

// Durante lo sviluppo rendiamo il gioco raggiungibile dalla console del browser,
// comodo per andare a vedere cosa sta succedendo. Vite cancella questa riga
// quando compila la versione definitiva, quindi nel gioco pubblicato non c'è.
// Nota: NON si può chiamare window.gioco, perché i browser creano già una
// variabile globale con quel nome per il <div id="gioco"> della pagina.
if (import.meta.env.DEV) {
  window.debugGioco = gioco;
  // Per guardare il messaggio "Aggiungi alla schermata Home" da un computer,
  // senza avere un iPhone in mano: scrivi questo nella console del browser.
  window.debugMessaggioInstallazione = () => mostraMessaggioInstallazione(true);
}
