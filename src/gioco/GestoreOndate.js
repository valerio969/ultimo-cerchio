import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';

/**
 * GESTORE DELLE ONDATE
 *
 * Il ritmo della partita. Il ciclo di un'ondata è sempre questo:
 *
 *   ANNUNCIO  →  compare "ONDATA 3", non arriva ancora nessuno
 *   INGRESSO  →  i nemici entrano uno per volta dai bordi
 *   PULIZIA   →  sono entrati tutti, si aspetta che tu li elimini
 *   PAUSA     →  respiri un attimo, e si ricomincia più difficile
 *
 * Tutti i tempi e i numeri stanno in config.ondate: questo file li applica,
 * non li decide.
 */

// I quattro momenti di un'ondata. Sono stringhe e non numeri di proposito: se
// qualcosa va storto, in fase di controllo si legge "pulizia" invece di "2".
const FASE = {
  ANNUNCIO: 'annuncio',
  INGRESSO: 'ingresso',
  PULIZIA: 'pulizia',
  PAUSA: 'pausa',
};

export default class GestoreOndate {
  constructor(scene) {
    this.scene = scene;
    this.scala = scalaDi(scene);

    this.numeroOndata = 0;
    this.nemiciComparsi = 0;      // in tutta la partita, per la schermata finale

    // Quanti nemici di questa ondata devono ancora entrare in scena
    this.daFarEntrare = 0;
    // Cronometro alla rovescia, in millisecondi
    this.attesa = CONFIG.ondate.ritardoPrimaOndata;

    this.fase = FASE.PAUSA;

    // I tipi disponibili nell'ondata corrente, già pesati (vedi scegliTipo)
    this.tipiDisponibili = [];
  }

  /** Chiamato dalla scena una volta per fotogramma. */
  aggiorna(delta) {
    this.attesa -= delta;

    switch (this.fase) {
      case FASE.PAUSA:
        if (this.attesa <= 0) this.iniziaOndata();
        break;

      case FASE.ANNUNCIO:
        if (this.attesa <= 0) {
          this.fase = FASE.INGRESSO;
          this.attesa = 0;
        }
        break;

      case FASE.INGRESSO:
        if (this.attesa <= 0) this.faiEntrareUnNemico();
        if (this.daFarEntrare <= 0) this.fase = FASE.PULIZIA;
        break;

      case FASE.PULIZIA:
        // L'ondata è finita solo quando l'ultimo nemico è a terra.
        if (this.scene.gruppoNemici.countActive(true) === 0) {
          this.fase = FASE.PAUSA;
          this.attesa = CONFIG.ondate.pausaTraOndate;
          this.scene.alFineOndata(this.numeroOndata);
        }
        break;
    }
  }

  // ==========================================================================
  // INIZIO DI UN'ONDATA
  // ==========================================================================

  iniziaOndata() {
    this.numeroOndata += 1;
    this.fase = FASE.ANNUNCIO;
    this.attesa = CONFIG.ondate.durataAnnuncio;

    this.daFarEntrare = this.quantiNemici(this.numeroOndata);
    this.tipiDisponibili = this.tipiPerOndata(this.numeroOndata);

    this.scene.alInizioOndata(this.numeroOndata);
  }

  /** Quanti nemici ha l'ondata numero N. */
  quantiNemici(ondata) {
    const quanti =
      CONFIG.ondate.nemiciPrimaOndata +
      (ondata - 1) * CONFIG.ondate.nemiciInPiuPerOndata;

    return Math.min(quanti, CONFIG.ondate.nemiciMassimiPerOndata);
  }

  /**
   * Quali tipi di nemico possono comparire in questa ondata.
   *
   * Costruiamo un elenco in cui ogni tipo appare tante volte quanto è il suo
   * "peso": con normale a peso 10 e veloce a peso 7, l'elenco ha 10 voci
   * "normale" e 7 "veloce". Poi peschiamo a caso da questo elenco.
   * È il modo più semplice di ottenere "più normali che veloci" senza far conti.
   */
  tipiPerOndata(ondata) {
    const elenco = [];

    for (const voce of CONFIG.ondate.composizione) {
      if (ondata < voce.daOndata) continue;

      const tipo = CONFIG.tipiNemico[voce.tipo];
      if (!tipo) {
        // Nome sbagliato in config: meglio dirlo che far comparire nemici invisibili
        console.warn(`config.ondate.composizione cita un tipo che non esiste: "${voce.tipo}"`);
        continue;
      }

      for (let i = 0; i < voce.peso; i += 1) elenco.push(tipo);
    }

    // Rete di sicurezza: se la configurazione è tutta sbagliata, almeno il gioco
    // continua a funzionare col primo tipo definito.
    if (elenco.length === 0) elenco.push(Object.values(CONFIG.tipiNemico)[0]);

    return elenco;
  }

  // ==========================================================================
  // RINFORZI — quanto sono più cattivi i nemici in questa ondata
  // ==========================================================================

  /** Moltiplicatore della vita per l'ondata corrente. */
  rinforzoVita() {
    const daOndata = CONFIG.ondate.vitaCresceDaOndata;
    if (this.numeroOndata < daOndata) return 1;

    const passi = this.numeroOndata - daOndata + 1;
    return Math.min(
      1 + passi * CONFIG.ondate.vitaInPiuPerOndata,
      CONFIG.ondate.rinforzoMassimo
    );
  }

  /** Moltiplicatore della velocità per l'ondata corrente. */
  rinforzoVelocita() {
    return Math.min(
      1 + (this.numeroOndata - 1) * CONFIG.ondate.velocitaInPiuPerOndata,
      CONFIG.ondate.rinforzoMassimo
    );
  }

  // ==========================================================================
  // INGRESSO DEI NEMICI
  // ==========================================================================

  /**
   * Sceglie un bordo a caso e fa entrare un nemico da lì, appena fuori dallo
   * schermo, così lo vedi arrivare invece di trovartelo davanti dal nulla.
   */
  faiEntrareUnNemico() {
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

    const tipo = Phaser.Utils.Array.GetRandom(this.tipiDisponibili);
    const comparso = this.scene.faiComparireNemico(
      x, y, tipo, this.rinforzoVita(), this.rinforzoVelocita()
    );

    // Se il pool è pieno il nemico non entra: NON scaliamo il contatore, così
    // riproveremo al prossimo giro. Senza questa attenzione l'ondata resterebbe
    // bloccata per sempre in attesa di un nemico che non è mai entrato.
    if (!comparso) {
      this.attesa = CONFIG.ondate.intervalloTraNemici;
      return;
    }

    this.daFarEntrare -= 1;
    this.nemiciComparsi += 1;
    this.attesa = CONFIG.ondate.intervalloTraNemici;
  }
}
