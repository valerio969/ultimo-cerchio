import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';

/**
 * GESTORE DELLE ONDATE — versione Milestone 1
 *
 * Per adesso è semplice: fa comparire un nemico ogni tanto, e col passare del
 * tempo accorcia l'attesa, così la partita si fa sempre più difficile e prima o
 * poi finisce.
 *
 * In Milestone 2 questo file diventerà quello vero: ondate distinte con la scritta
 * "ONDATA 3", la pausa di respiro tra una e l'altra, e tipi di nemico diversi.
 * Tutta la logica del ritmo sta qui dentro, quindi cambiarla non toccherà il resto
 * del gioco.
 */
export default class GestoreOndate {
  constructor(scene) {
    this.scene = scene;
    this.scala = scalaDi(scene);

    // Millisecondi che devono passare prima del prossimo nemico
    this.attesa = CONFIG.ondate.ritardoInizio;
    // Intervallo attuale tra due nemici: si accorcia col tempo
    this.intervallo = CONFIG.ondate.intervalloComparsa;
    // Contatore per capire quando è il momento di stringere il ritmo
    this.tempoPerAumentare = CONFIG.ondate.ogniQuantoAumenta;

    // Quanti nemici sono comparsi in tutto: lo mostriamo a fine partita
    this.nemiciComparsi = 0;
  }

  /** Chiamato dalla scena una volta per fotogramma. */
  aggiorna(delta) {
    // --- Il ritmo si fa più cattivo col passare del tempo ------------------
    this.tempoPerAumentare -= delta;
    if (this.tempoPerAumentare <= 0) {
      this.tempoPerAumentare += CONFIG.ondate.ogniQuantoAumenta;
      this.intervallo = Math.max(
        CONFIG.ondate.intervalloMinimo,
        this.intervallo - CONFIG.ondate.quantoAumenta
      );
    }

    // --- È il momento di far comparire un nemico? -------------------------
    this.attesa -= delta;
    if (this.attesa > 0) return;

    this.attesa += this.intervallo;
    this.faiComparireNemico();
  }

  /**
   * Sceglie un bordo a caso e fa entrare un nemico da lì, appena fuori dallo
   * schermo, così lo vedi arrivare invece di trovartelo davanti dal nulla.
   */
  faiComparireNemico() {
    const larghezza = this.scene.scale.width;
    const altezza = this.scene.scale.height;
    const margine = CONFIG.nemici.margineIngresso * this.scala;

    let x;
    let y;

    // 0 = alto, 1 = destra, 2 = basso, 3 = sinistra
    switch (Phaser.Math.Between(0, 3)) {
      case 0:
        x = Phaser.Math.Between(0, larghezza);
        y = -margine;
        break;
      case 1:
        x = larghezza + margine;
        y = Phaser.Math.Between(0, altezza);
        break;
      case 2:
        x = Phaser.Math.Between(0, larghezza);
        y = altezza + margine;
        break;
      default:
        x = -margine;
        y = Phaser.Math.Between(0, altezza);
        break;
    }

    const comparso = this.scene.faiComparireNemico(x, y);
    if (comparso) this.nemiciComparsi += 1;
  }
}
