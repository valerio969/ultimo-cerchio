import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';

/**
 * L'elenco dei suoni: nome usato nel gioco → nome del file in public/suoni/
 */
export const SUONI = ['sparo', 'esplosione', 'danno', 'ondata', 'gameover'];

/**
 * SCENA DI AVVIO
 *
 * Carica i disegni e i suoni, mostrando una barra di caricamento, e poi passa
 * la palla alla scena di gioco.
 *
 * Fino alla Milestone 3 non c'era niente da caricare: le forme geometriche
 * venivano disegnate al volo. Ora ci sono file veri (circa 340 KB fra navi e
 * suoni), e su una rete lenta il primo caricamento si vede: senza una barra,
 * resteresti davanti a uno schermo nero senza sapere se il gioco è rotto.
 *
 * Dalla seconda volta in poi non si vede più niente, perché il service worker
 * serve tutto dalla memoria del telefono, istantaneamente.
 */
export default class SceneAvvio extends Phaser.Scene {
  constructor() {
    super({ key: 'Avvio' });
  }

  preload() {
    // I file stanno in public/, che online finisce dentro la sottocartella del
    // sito. import.meta.env.BASE_URL è "/" in locale e "/ultimo-cerchio/" online:
    // usandolo, gli stessi percorsi funzionano in entrambi i casi.
    this.load.setBaseURL(import.meta.env.BASE_URL);

    this.creaBarraCaricamento();

    // --- Disegni (Kenney "Simple Space", licenza CC0) ---------------------
    const daCaricare = new Set([
      CONFIG.sprite.giocatore,
      CONFIG.sprite.proiettile,
      CONFIG.sprite.stellaSfondo,
      ...CONFIG.sprite.meteore,
      ...Object.values(CONFIG.tipiNemico).map((t) => t.sprite),
    ]);

    for (const nome of daCaricare) {
      this.load.image(nome, `sprite/${nome}.png`);
    }

    // --- Suoni (Kenney "Sci-Fi Sounds", licenza CC0) ----------------------
    if (CONFIG.audio.attivo) {
      for (const nome of SUONI) {
        this.load.audio(nome, `suoni/${nome}.wav`);
      }
    }
  }

  create() {
    // Le schegge delle esplosioni restano una forma disegnata da noi: un
    // quadratino bianco è più adatto di qualsiasi sprite, e non pesa niente.
    this.creaQuadratino(
      'scheggia',
      Math.ceil(CONFIG.feedback.particelle.dimensione * scalaDi(this) * 2),
      0xffffff
    );

    this.scene.start('Gioco');
  }

  // ==========================================================================
  // BARRA DI CARICAMENTO
  // ==========================================================================

  creaBarraCaricamento() {
    const scala = scalaDi(this);
    const larghezza = this.scale.width;
    const altezza = this.scale.height;

    const larghezzaBarra = Math.min(larghezza * 0.62, 300 * scala);
    const altezzaBarra = 8 * scala;
    const x = (larghezza - larghezzaBarra) / 2;
    const y = altezza / 2;

    const titolo = this.add
      .text(larghezza / 2, y - 44 * scala, 'ULTIMO CERCHIO', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
        fontSize: `${Math.round(24 * scala)}px`,
        color: '#6a6a8a',
      })
      .setOrigin(0.5);

    const contenitore = this.add.graphics();
    contenitore.fillStyle(CONFIG.colori.vitaSfondo, 1);
    contenitore.fillRoundedRect(x, y, larghezzaBarra, altezzaBarra, altezzaBarra / 2);

    const riempimento = this.add.graphics();

    this.load.on('progress', (frazione) => {
      riempimento.clear();
      riempimento.fillStyle(CONFIG.colori.giocatore, 1);
      riempimento.fillRoundedRect(
        x, y,
        Math.max(altezzaBarra, larghezzaBarra * frazione),
        altezzaBarra,
        altezzaBarra / 2
      );
    });

    // A caricamento finito togliamo tutto: da lì in poi comanda la scena di gioco.
    this.load.once('complete', () => {
      titolo.destroy();
      contenitore.destroy();
      riempimento.destroy();
    });
  }

  /** Disegna un quadratino pieno e lo salva come immagine in memoria. */
  creaQuadratino(nome, lato, colore) {
    if (this.textures.exists(nome)) return;

    const disegno = this.make.graphics({ add: false });
    disegno.fillStyle(colore, 1);
    disegno.fillRect(0, 0, lato, lato);
    disegno.generateTexture(nome, lato, lato);
    disegno.destroy();
  }
}
