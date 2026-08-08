import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';

/**
 * IL NEMICO — il cerchio rosso
 *
 * Entra da un bordo dello schermo e ti insegue, senza furbizie: punta sempre
 * dritto verso di te.
 *
 * ---------------------------------------------------------------------------
 * OBJECT POOLING — perché questo oggetto non viene mai distrutto
 * ---------------------------------------------------------------------------
 * Creare e distruggere oggetti in continuazione è la causa numero uno degli
 * scatti nei giochi sul telefono: ogni tanto il browser deve fermarsi a
 * ripulire la memoria, e in quel momento perdi fotogrammi.
 *
 * Quindi all'avvio ne creiamo un numero fisso (config.nemici.nemiciInPool) e poi
 * li riusiamo: attiva() lo accende, spegni() lo mette da parte. Non viene mai
 * creato né distrutto durante la partita.
 */
export default class Nemico extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // La texture è sempre 'nemico': non la riceviamo da fuori, così il pool può
    // creare questi oggetti senza dover sapere che aspetto hanno.
    super(scene, x, y, 'nemico');

    const scala = scalaDi(scene);
    this.diametro = CONFIG.nemici.dimensione * scala;
    this.velocitaInseguimento = CONFIG.nemici.velocita * scala;

    this.setDisplaySize(this.diametro, this.diametro);
    this.setDepth(5);

    this.vita = CONFIG.nemici.vita;
  }

  /**
   * Imposta il riquadro delle collisioni, un po' più piccolo del cerchio
   * disegnato: siccome il riquadro è quadrato, senza questa riduzione gli angoli
   * "sporgerebbero" fuori dal cerchio e verresti colpito da qualcosa che sembra
   * non toccarti.
   *
   * ATTENZIONE: questo NON si può fare nel costruttore. Il gruppo prima
   * costruisce l'oggetto e solo dopo gli attacca il corpo fisico, quindi dentro
   * il costruttore this.body è ancora vuoto. La scena chiama questo metodo subito
   * dopo aver creato il pool.
   */
  configuraCorpo() {
    this.body.setSize(this.width * 0.8, this.height * 0.8, true);
  }

  /** Accende un nemico preso dal pool e lo mette in posizione. */
  attiva(x, y) {
    // enableBody rimette in funzione il corpo fisico, riposiziona l'oggetto e lo
    // rende di nuovo attivo e visibile, tutto in una volta.
    this.enableBody(true, x, y, true, true);
    this.vita = CONFIG.nemici.vita;
    this.setAlpha(1);
    this.setActive(true);
    this.setVisible(true);
    return this;
  }

  /** Rimette il nemico nel pool, pronto per essere riusato. */
  spegni() {
    this.body.setVelocity(0, 0);
    this.disableBody(true, true);
  }

  /** Chiamato dalla scena una volta per fotogramma, per ogni nemico attivo. */
  aggiorna(giocatore) {
    if (!giocatore || !giocatore.active) {
      this.body.setVelocity(0, 0);
      return;
    }

    const angolo = Phaser.Math.Angle.Between(this.x, this.y, giocatore.x, giocatore.y);
    this.body.setVelocity(
      Math.cos(angolo) * this.velocitaInseguimento,
      Math.sin(angolo) * this.velocitaInseguimento
    );
  }

  /**
   * Prende un colpo. Restituisce true se è morto.
   */
  subisciDanno(quantita) {
    this.vita -= quantita;
    return this.vita <= 0;
  }
}
