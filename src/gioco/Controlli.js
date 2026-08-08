import Phaser from 'phaser';
import { CONFIG } from '../config.js';

/**
 * CONTROLLI
 *
 * Due modi di muoversi, che convivono:
 *   - il DITO (sul telefono): trascinamento relativo
 *   - la TASTIERA (sul Mac): WASD oppure le frecce
 *
 * ---------------------------------------------------------------------------
 * COME FUNZIONA IL TRASCINAMENTO RELATIVO
 * ---------------------------------------------------------------------------
 * Quando appoggi il dito, ci ricordiamo due cose: dove hai appoggiato il dito, e
 * dove era il personaggio in quel momento. Poi, mentre muovi:
 *
 *     posizione bersaglio = posizione iniziale del personaggio
 *                         + (di quanto si è spostato il dito) × sensibilità
 *
 * Il personaggio non salta sul bersaglio: ci si muove verso, alla sua velocità
 * massima. Quindi resta un personaggio con una velocità, non un cursore.
 *
 * Il vantaggio di questo sistema è che puoi tenere il dito in un angolo tranquillo
 * dello schermo, invece di coprire il personaggio col pollice proprio mentre devi
 * vedere cosa ti sta arrivando addosso.
 */
export default class Controlli {
  constructor(scene) {
    this.scene = scene;

    // true quando il dito è appoggiato sullo schermo
    this.ditoGiu = false;

    // dove il dito ha toccato per la prima volta
    this.ditoIniziale = { x: 0, y: 0 };
    // dov'era il personaggio quando il dito ha toccato
    this.posizioneIniziale = { x: 0, y: 0 };
    // dove il personaggio sta cercando di arrivare adesso
    this.bersaglio = { x: 0, y: 0 };

    // --- Dito / mouse ------------------------------------------------------
    scene.input.on('pointerdown', this.alTocco, this);
    scene.input.on('pointermove', this.alMovimento, this);
    scene.input.on('pointerup', this.alRilascio, this);
    scene.input.on('pointerupoutside', this.alRilascio, this);

    // --- Tastiera ---------------------------------------------------------
    this.tasti = scene.input.keyboard.addKeys({
      su: Phaser.Input.Keyboard.KeyCodes.W,
      giu: Phaser.Input.Keyboard.KeyCodes.S,
      sinistra: Phaser.Input.Keyboard.KeyCodes.A,
      destra: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.frecce = scene.input.keyboard.createCursorKeys();
  }

  /** Il dito si appoggia: memorizziamo il punto di partenza. */
  alTocco(pointer) {
    const giocatore = this.scene.giocatore;
    if (!giocatore || !giocatore.active) return;

    this.ditoGiu = true;
    this.ditoIniziale.x = pointer.x;
    this.ditoIniziale.y = pointer.y;
    this.posizioneIniziale.x = giocatore.x;
    this.posizioneIniziale.y = giocatore.y;
    this.bersaglio.x = giocatore.x;
    this.bersaglio.y = giocatore.y;
  }

  /** Il dito si muove: ricalcoliamo dove deve andare il personaggio. */
  alMovimento(pointer) {
    if (!this.ditoGiu) return;

    const sensibilita = CONFIG.controlli.sensibilitaDito;
    const margine = this.scene.giocatore ? this.scene.giocatore.displayWidth / 2 : 0;
    const larghezza = this.scene.scale.width;
    const altezza = this.scene.scale.height;

    this.bersaglio.x = this.calcolaAsse(
      pointer.x, this.ditoIniziale, 'x', this.posizioneIniziale.x,
      sensibilita, margine, larghezza - margine
    );
    this.bersaglio.y = this.calcolaAsse(
      pointer.y, this.ditoIniziale, 'y', this.posizioneIniziale.y,
      sensibilita, margine, altezza - margine
    );
  }

  /**
   * Calcola la posizione bersaglio su un asse (orizzontale o verticale),
   * tenendola dentro l'arena.
   *
   * LA PARTE FURBA: quando il bersaglio finirebbe fuori dall'arena, non lo
   * schiacciamo e basta — spostiamo anche il punto di partenza del dito.
   * Senza questo accorgimento, se trascini il dito ben oltre il bordo destro e poi
   * torni indietro, il personaggio resta immobile per un po' prima di reagire,
   * perché deve "smaltire" tutto il movimento in eccesso. Con l'accorgimento,
   * appena torni indietro il personaggio parte subito. È la differenza tra
   * controlli che sembrano rotti e controlli che sembrano giusti.
   */
  calcolaAsse(posizioneDito, ditoIniziale, asse, partenza, sensibilita, minimo, massimo) {
    const grezzo = partenza + (posizioneDito - ditoIniziale[asse]) * sensibilita;
    const limitato = Phaser.Math.Clamp(grezzo, minimo, massimo);

    if (limitato !== grezzo) {
      ditoIniziale[asse] = posizioneDito - (limitato - partenza) / sensibilita;
    }

    return limitato;
  }

  /** Il dito si alza: il personaggio si ferma. */
  alRilascio() {
    this.ditoGiu = false;
  }

  /**
   * Direzione richiesta dalla tastiera, come coppia di valori tra -1 e 1.
   * Restituisce null se non stai premendo niente.
   */
  direzioneTastiera() {
    let x = 0;
    let y = 0;

    if (this.tasti.sinistra.isDown || this.frecce.left.isDown) x -= 1;
    if (this.tasti.destra.isDown || this.frecce.right.isDown) x += 1;
    if (this.tasti.su.isDown || this.frecce.up.isDown) y -= 1;
    if (this.tasti.giu.isDown || this.frecce.down.isDown) y += 1;

    if (x === 0 && y === 0) return null;

    // In diagonale, muovendosi su due assi insieme, si andrebbe più veloce che in
    // linea retta (è la geometria: la diagonale è più lunga del lato). Dividendo
    // per la lunghezza si ottiene la stessa velocità in tutte le direzioni.
    const lunghezza = Math.sqrt(x * x + y * y);
    return { x: x / lunghezza, y: y / lunghezza };
  }

  /** Chiude l'ascolto degli eventi quando la scena si spegne. */
  distruggi() {
    this.scene.input.off('pointerdown', this.alTocco, this);
    this.scene.input.off('pointermove', this.alMovimento, this);
    this.scene.input.off('pointerup', this.alRilascio, this);
    this.scene.input.off('pointerupoutside', this.alRilascio, this);
  }
}
