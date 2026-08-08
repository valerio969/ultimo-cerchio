import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';
import { leggiSafeArea } from '../main.js';

/** Chiave con cui il record viene salvato nella memoria del telefono. */
const CHIAVE_RECORD = 'ultimoCerchio.record';

/**
 * SCHERMATA DI FINE PARTITA
 *
 * Viene aperta SOPRA la scena di gioco, che resta congelata dietro. Mostra il
 * punteggio, il record, e un pulsante per ricominciare.
 *
 * Il record viene salvato in localStorage, che è la memoria del browser sul tuo
 * telefono. Non è un database e non esce dal dispositivo: nessuna rete, nessun
 * server, nessun account.
 */
export default class SceneGameOver extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create(dati) {
    this.scala = scalaDi(this);

    const punteggio = dati?.punteggio ?? 0;
    const record = this.aggiornaRecord(punteggio);
    const nuovoRecord = punteggio > 0 && punteggio >= record;

    const larghezza = this.scale.width;
    const altezza = this.scale.height;
    const centroX = larghezza / 2;
    const safe = leggiSafeArea();

    // Velo scuro sopra l'arena congelata: si intravede ancora il campo di
    // battaglia, ma l'attenzione va sul punteggio.
    this.add
      .rectangle(0, 0, larghezza, altezza, CONFIG.colori.sfondo, 0.82)
      .setOrigin(0)
      .setDepth(2000);

    // --- Testi -------------------------------------------------------------
    const centroY = altezza * 0.42;

    this.testo(centroX, centroY - CONFIG.gameOver.dimensioneTitolo * this.scala * 1.9,
      'ELIMINATO', CONFIG.gameOver.dimensioneTitolo, CONFIG.colori.pericolo);

    this.testo(centroX, centroY,
      String(punteggio), CONFIG.gameOver.dimensionePunteggio, CONFIG.colori.testo);

    this.testo(centroX, centroY + CONFIG.gameOver.dimensionePunteggio * this.scala * 0.85,
      'PUNTI', CONFIG.hud.dimensioneTestoPiccolo, CONFIG.colori.testoSpento);

    // Fin dove sei arrivato. È l'informazione che ti dice se stai migliorando:
    // il punteggio dipende anche da che tipi di nemico ti sono capitati,
    // l'ondata no.
    const ondata = dati?.ondata ?? 0;
    this.testo(
      centroX,
      centroY + CONFIG.gameOver.dimensionePunteggio * this.scala * 1.45,
      `caduto nell'ondata ${ondata}`,
      CONFIG.hud.dimensioneTestoPiccolo,
      CONFIG.colori.annuncioOndata
    );

    this.testo(
      centroX,
      centroY + CONFIG.gameOver.dimensionePunteggio * this.scala * 2.0,
      nuovoRecord ? 'NUOVO RECORD!' : `record  ${record}`,
      CONFIG.hud.dimensioneTestoPiccolo,
      nuovoRecord ? CONFIG.colori.vita : CONFIG.colori.testoSpento
    );

    // --- Pulsante RICOMINCIA ----------------------------------------------
    // Sta in basso, dove arriva il pollice, ma sopra la barra inferiore
    // dell'iPhone così non ci si scontra con la gesture di chiusura app.
    const altezzaPulsante = CONFIG.gameOver.altezzaPulsante * this.scala;
    const yPulsante =
      altezza - safe.basso - CONFIG.hud.margine * this.scala * 2.5 - altezzaPulsante / 2;

    this.creaPulsante(centroX, yPulsante, altezzaPulsante);
  }

  /** Scorciatoia per aggiungere un testo centrato. */
  testo(x, y, contenuto, dimensione, colore) {
    return this.add
      .text(x, y, contenuto, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
        fontSize: `${Math.round(dimensione * this.scala)}px`,
        color: '#' + colore.toString(16).padStart(6, '0'),
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(2001);
  }

  creaPulsante(x, y, altezzaPulsante) {
    const larghezzaPulsante = Math.min(
      CONFIG.gameOver.larghezzaPulsante * this.scala,
      this.scale.width * 0.72
    );

    const sfondo = this.add
      .rectangle(x, y, larghezzaPulsante, altezzaPulsante, CONFIG.colori.giocatore, 1)
      .setDepth(2001)
      .setInteractive({ useHandCursor: true });

    const etichetta = this.testo(
      x, y, 'RICOMINCIA', CONFIG.gameOver.dimensioneTestoPulsante, 0x081426
    ).setDepth(2002);

    // Piccolo feedback al tocco: il pulsante si rimpicciolisce appena.
    sfondo.on('pointerdown', () => {
      sfondo.setScale(0.96);
      etichetta.setScale(0.96);
    });

    // pointerup si attiva sia col dito che col mouse.
    sfondo.on('pointerup', () => this.ricomincia());

    // Se il dito esce dal pulsante senza rilasciare, torna come prima e non parte.
    sfondo.on('pointerout', () => {
      sfondo.setScale(1);
      etichetta.setScale(1);
    });

    // Sul Mac si può ricominciare anche con la barra spaziatrice o Invio.
    this.input.keyboard.once('keydown-SPACE', () => this.ricomincia());
    this.input.keyboard.once('keydown-ENTER', () => this.ricomincia());
  }

  ricomincia() {
    if (this.staRicominciando) return;   // evita il doppio tocco accidentale
    this.staRicominciando = true;

    // Prima chiudiamo questa schermata, poi facciamo ripartire la partita da zero.
    // restart() spegne e riaccende la scena di gioco, quindi vita, punteggio,
    // nemici e proiettili tornano tutti allo stato iniziale.
    this.scene.stop();
    this.scene.get('Gioco').scene.restart();
  }

  /**
   * Legge il record salvato, lo confronta con il punteggio appena fatto, e se
   * serve salva quello nuovo. Restituisce il record aggiornato.
   *
   * Il try/catch c'è perché in navigazione privata su iPhone la memoria del
   * browser può essere bloccata: in quel caso il gioco funziona comunque, solo
   * senza ricordare il record.
   */
  aggiornaRecord(punteggio) {
    try {
      const salvato = parseInt(window.localStorage.getItem(CHIAVE_RECORD) ?? '0', 10);
      const record = Number.isFinite(salvato) ? salvato : 0;

      if (punteggio > record) {
        window.localStorage.setItem(CHIAVE_RECORD, String(punteggio));
        return punteggio;
      }
      return record;
    } catch {
      return punteggio;
    }
  }
}
