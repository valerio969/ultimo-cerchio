import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';

/**
 * IL PROIETTILE — il puntino bianco
 *
 * Parte dal giocatore in una direzione e va sempre dritto a velocità costante.
 * Non insegue il nemico: se il nemico si sposta, il colpo lo manca. È voluto —
 * un colpo che insegue non si può mai schivare e toglie ogni abilità dal gioco.
 *
 * Come i nemici, viene riusato dal pool e mai distrutto (vedi Nemico.js per la
 * spiegazione del perché).
 */
export default class Proiettile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'proiettile');

    const scala = scalaDi(scene);
    this.diametro = CONFIG.arma.dimensioneProiettile * scala;
    this.velocita = CONFIG.arma.velocitaProiettile * scala;
    this.danno = CONFIG.arma.danno;

    this.setDisplaySize(this.diametro, this.diametro);
    this.setDepth(8);
  }

  /**
   * Imposta il riquadro delle collisioni.
   *
   * ATTENZIONE, dettaglio che costa un'ora se non lo si sa: questo NON si può
   * fare nel costruttore. Il gruppo prima costruisce l'oggetto e solo dopo gli
   * attacca il corpo fisico, quindi dentro il costruttore this.body è ancora
   * vuoto. La scena chiama questo metodo subito dopo aver creato il pool.
   */
  configuraCorpo() {
    this.body.setSize(this.width, this.height, true);
  }

  /** Accende un proiettile preso dal pool e lo lancia nella direzione data. */
  attiva(x, y, angolo) {
    this.enableBody(true, x, y, true, true);
    this.setActive(true);
    this.setVisible(true);
    this.body.setVelocity(
      Math.cos(angolo) * this.velocita,
      Math.sin(angolo) * this.velocita
    );
    return this;
  }

  /** Rimette il proiettile nel pool. */
  spegni() {
    this.body.setVelocity(0, 0);
    this.disableBody(true, true);
  }

  /**
   * Vero se il proiettile è uscito dall'arena e va spento.
   * Diamo un piccolo margine, così non sparisce mentre è ancora mezzo visibile.
   */
  eFuoriDallArena(larghezza, altezza) {
    const margine = this.diametro * 2;
    return (
      this.x < -margine ||
      this.x > larghezza + margine ||
      this.y < -margine ||
      this.y > altezza + margine
    );
  }
}
