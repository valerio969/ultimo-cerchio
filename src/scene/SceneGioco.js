import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';
import { leggiSafeArea } from '../main.js';
import Giocatore from '../gioco/Giocatore.js';
import Nemico from '../gioco/Nemico.js';
import Proiettile from '../gioco/Proiettile.js';
import Controlli from '../gioco/Controlli.js';
import GestoreOndate from '../gioco/GestoreOndate.js';

/** Trasforma un colore da 0xff4d5e a "#ff4d5e", che è il formato che vuole il testo. */
function esadecimale(colore) {
  return '#' + colore.toString(16).padStart(6, '0');
}

/**
 * LA SCENA DI GIOCO — è qui che si gioca
 *
 * Questa scena mette insieme tutti i pezzi: l'arena, il giocatore, i pool di
 * nemici e proiettili, le collisioni, l'interfaccia a schermo.
 */
export default class SceneGioco extends Phaser.Scene {
  constructor() {
    super({ key: 'Gioco' });
  }

  create() {
    this.scala = scalaDi(this);
    this.partitaFinita = false;
    this.punteggio = 0;

    const larghezza = this.scale.width;
    const altezza = this.scale.height;

    // L'arena è grande esattamente come lo schermo: nessuno scorrimento.
    this.physics.world.setBounds(0, 0, larghezza, altezza);

    this.creaGriglia();
    this.creaGiocatore();
    this.creaPool();
    this.creaCollisioni();
    this.creaHud();

    this.controlli = new Controlli(this);
    this.ondate = new GestoreOndate(this);

    this.scale.on('resize', this.alRidimensionamento, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.allaChiusura, this);
  }

  // ==========================================================================
  // COSTRUZIONE
  // ==========================================================================

  /** Griglia di sfondo: serve a percepire il movimento, altrimenti su un fondo
   *  nero uniforme non si capisce se ci si sta muovendo o no. */
  creaGriglia() {
    this.griglia = this.add.graphics().setDepth(0);
    this.disegnaGriglia();
  }

  disegnaGriglia() {
    this.griglia.clear();
    if (!CONFIG.grafica.disegnaGriglia) return;

    const passo = CONFIG.grafica.dimensioneCellaGriglia * this.scala;
    const larghezza = this.scale.width;
    const altezza = this.scale.height;

    this.griglia.lineStyle(Math.max(1, this.scala), CONFIG.colori.griglia, 1);

    for (let x = 0; x <= larghezza; x += passo) {
      this.griglia.lineBetween(x, 0, x, altezza);
    }
    for (let y = 0; y <= altezza; y += passo) {
      this.griglia.lineBetween(0, y, larghezza, y);
    }
  }

  creaGiocatore() {
    this.giocatore = new Giocatore(this, this.scale.width / 2, this.scale.height / 2);
  }

  /**
   * I POOL — tutti gli oggetti del gioco vengono creati adesso, una volta sola.
   * Da qui alla fine della partita non ne verrà creato né distrutto nessuno:
   * si accendono e si spengono. È la regola che tiene il gioco a 60 fps.
   */
  creaPool() {
    this.gruppoProiettili = this.physics.add.group({
      classType: Proiettile,
      maxSize: CONFIG.arma.proiettiliInPool,
      runChildUpdate: false,
    });
    this.gruppoProiettili.createMultiple({
      key: 'proiettile',
      quantity: CONFIG.arma.proiettiliInPool,
      active: false,
      visible: false,
    });

    this.gruppoNemici = this.physics.add.group({
      classType: Nemico,
      maxSize: CONFIG.nemici.nemiciInPool,
      runChildUpdate: false,
    });
    this.gruppoNemici.createMultiple({
      key: 'nemico',
      quantity: CONFIG.nemici.nemiciInPool,
      active: false,
      visible: false,
    });

    // Adesso che i corpi fisici esistono possiamo dimensionarli, e poi spegnere
    // tutto: il pool deve partire vuoto.
    this.gruppoProiettili.getChildren().forEach((p) => {
      p.configuraCorpo();
      p.spegni();
    });
    this.gruppoNemici.getChildren().forEach((n) => {
      n.configuraCorpo();
      n.spegni();
    });
  }

  creaCollisioni() {
    // overlap = "quando questi due si sovrappongono, chiamami" (senza rimbalzi)
    this.physics.add.overlap(
      this.gruppoProiettili, this.gruppoNemici,
      this.proiettileColpisceNemico, null, this
    );

    this.physics.add.overlap(
      this.giocatore, this.gruppoNemici,
      this.nemicoToccaGiocatore, null, this
    );
  }

  // ==========================================================================
  // INTERFACCIA A SCHERMO
  // ==========================================================================

  creaHud() {
    const stile = (dimensione, colore) => ({
      fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
      fontSize: `${Math.round(dimensione * this.scala)}px`,
      color: esadecimale(colore),
    });

    this.graficaVita = this.add.graphics().setDepth(1000);

    this.testoPunteggio = this.add
      .text(0, 0, '0', stile(CONFIG.hud.dimensioneTestoPunteggio, CONFIG.colori.testo))
      .setOrigin(1, 0)
      .setDepth(1000);

    this.testoFps = this.add
      .text(0, 0, '', stile(CONFIG.hud.dimensioneTestoPiccolo, CONFIG.colori.testoSpento))
      .setOrigin(0, 1)
      .setDepth(1000)
      .setVisible(CONFIG.debug.mostraFps);

    // Suggerimento iniziale, sparisce da solo dopo qualche secondo
    this.testoAiuto = this.add
      .text(
        this.scale.width / 2, this.scale.height * 0.72,
        'trascina un dito per muoverti\nspari da solo',
        {
          ...stile(CONFIG.hud.dimensioneTestoPiccolo, CONFIG.colori.testoSpento),
          align: 'center',
        }
      )
      .setOrigin(0.5)
      .setDepth(1000);

    this.tweens.add({
      targets: this.testoAiuto,
      alpha: 0,
      delay: 3200,
      duration: 900,
      onComplete: () => this.testoAiuto.destroy(),
    });

    this.prossimoAggiornamentoFps = 0;
    this.posizionaHud();
    this.disegnaBarraVita();
  }

  /** Posiziona l'interfaccia rispettando notch e barra inferiore dell'iPhone. */
  posizionaHud() {
    const safe = leggiSafeArea();
    const margine = CONFIG.hud.margine * this.scala;

    this.hudSinistra = safe.sinistra + margine;
    this.hudDestra = this.scale.width - safe.destra - margine;
    this.hudAlto = safe.alto + margine;
    this.hudBasso = this.scale.height - safe.basso - margine;

    this.larghezzaVita = Math.min(
      CONFIG.hud.larghezzaBarraVita * this.scala,
      (this.hudDestra - this.hudSinistra) * 0.55
    );
    this.altezzaVita = CONFIG.hud.altezzaBarraVita * this.scala;

    this.testoPunteggio.setPosition(this.hudDestra, this.hudAlto - this.altezzaVita * 0.4);
    this.testoFps.setPosition(this.hudSinistra, this.hudBasso);
  }

  disegnaBarraVita() {
    const g = this.graficaVita;
    const x = this.hudSinistra;
    const y = this.hudAlto;
    const l = this.larghezzaVita;
    const h = this.altezzaVita;
    const raggio = h / 2;

    g.clear();

    // Il contenitore vuoto
    g.fillStyle(CONFIG.colori.vitaSfondo, 1);
    g.fillRoundedRect(x, y, l, h, raggio);

    // La parte piena
    const frazione = this.giocatore.vita / this.giocatore.vitaMassima;
    if (frazione > 0) {
      const colore = frazione <= 0.3 ? CONFIG.colori.vitaBassa : CONFIG.colori.vita;
      g.fillStyle(colore, 1);
      // Larghezza minima pari all'altezza: sotto quella misura gli angoli
      // arrotondati non hanno più spazio e la barra si disegnerebbe male.
      g.fillRoundedRect(x, y, Math.max(h, l * frazione), h, raggio);
    }
  }

  aggiornaFps(tempo) {
    if (!CONFIG.debug.mostraFps) return;
    if (tempo < this.prossimoAggiornamentoFps) return;

    // Aggiorniamo quattro volte al secondo: leggibile, e non spreca lavoro.
    this.prossimoAggiornamentoFps = tempo + 250;
    this.testoFps.setText(`${Math.round(this.game.loop.actualFps)} fps`);
  }

  // ==========================================================================
  // IL CICLO DI GIOCO — questa funzione gira sessanta volte al secondo
  // ==========================================================================

  update(tempo, delta) {
    if (this.partitaFinita) return;

    this.giocatore.aggiorna(tempo, delta, this.controlli);

    // Ogni nemico attivo punta verso il giocatore.
    const nemici = this.gruppoNemici.getChildren();
    for (let i = 0; i < nemici.length; i += 1) {
      if (nemici[i].active) nemici[i].aggiorna(this.giocatore);
    }

    // I proiettili usciti dall'arena tornano nel pool.
    const larghezza = this.scale.width;
    const altezza = this.scale.height;
    const proiettili = this.gruppoProiettili.getChildren();
    for (let i = 0; i < proiettili.length; i += 1) {
      const p = proiettili[i];
      if (p.active && p.eFuoriDallArena(larghezza, altezza)) p.spegni();
    }

    this.ondate.aggiorna(delta);
    this.aggiornaFps(tempo);
  }

  // ==========================================================================
  // AZIONI CHE GLI OGGETTI CHIEDONO ALLA SCENA
  // ==========================================================================

  /**
   * Trova il nemico attivo più vicino a un punto, entro una certa distanza.
   *
   * Nota di prestazioni: confrontiamo le distanze AL QUADRATO invece delle
   * distanze vere. Il risultato del confronto è identico, ma si evita una radice
   * quadrata per ogni nemico, sessanta volte al secondo.
   */
  nemicoPiuVicino(x, y, distanzaMassima) {
    let migliore = null;
    let miglioreDistanza = distanzaMassima * distanzaMassima;

    const nemici = this.gruppoNemici.getChildren();
    for (let i = 0; i < nemici.length; i += 1) {
      const nemico = nemici[i];
      if (!nemico.active) continue;

      const dx = nemico.x - x;
      const dy = nemico.y - y;
      const distanza = dx * dx + dy * dy;

      if (distanza < miglioreDistanza) {
        miglioreDistanza = distanza;
        migliore = nemico;
      }
    }

    return migliore;
  }

  /** Prende un proiettile dal pool e lo lancia. */
  sparaProiettile(x, y, angolo) {
    const proiettile = this.gruppoProiettili.get();
    // Se il pool è esaurito, get() restituisce niente: salta il colpo invece di
    // creare un oggetto nuovo. Vedi config.arma.proiettiliInPool.
    if (!proiettile) return null;

    return proiettile.attiva(x, y, angolo);
  }

  /** Prende un nemico dal pool e lo mette in scena. Chiamato da GestoreOndate. */
  faiComparireNemico(x, y) {
    const nemico = this.gruppoNemici.get();
    if (!nemico) return null;

    return nemico.attiva(x, y);
  }

  // ==========================================================================
  // COLLISIONI
  // ==========================================================================

  proiettileColpisceNemico(proiettile, nemico) {
    // I corpi spenti a volte producono ancora una chiamata nello stesso
    // fotogramma: questo controllo evita di contare due volte lo stesso colpo.
    if (!proiettile.active || !nemico.active) return;

    proiettile.spegni();

    if (nemico.subisciDanno(proiettile.danno)) {
      nemico.spegni();
      this.punteggio += CONFIG.nemici.punti;
      this.testoPunteggio.setText(String(this.punteggio));
    }
  }

  nemicoToccaGiocatore(giocatore, nemico) {
    if (this.partitaFinita || !nemico.active) return;
    if (giocatore.eInvulnerabile(this.time.now)) return;

    const morto = giocatore.subisciDanno(CONFIG.nemici.danno, this.time.now);
    this.disegnaBarraVita();

    if (morto) this.finePartita();
  }

  // ==========================================================================
  // FINE PARTITA
  // ==========================================================================

  finePartita() {
    this.partitaFinita = true;

    this.giocatore.body.setVelocity(0, 0);
    this.giocatore.setAlpha(0.35);

    // Fermiamo i nemici, così l'arena resta congelata dietro la schermata di
    // game over invece di continuare a muoversi.
    const nemici = this.gruppoNemici.getChildren();
    for (let i = 0; i < nemici.length; i += 1) {
      if (nemici[i].active) nemici[i].body.setVelocity(0, 0);
    }

    this.scene.launch('GameOver', {
      punteggio: this.punteggio,
      nemiciComparsi: this.ondate.nemiciComparsi,
    });
    this.scene.pause();
  }

  // ==========================================================================
  // RIDIMENSIONAMENTO E PULIZIA
  // ==========================================================================

  /**
   * Succede quando la barra di Safari appare o scompare, o quando ridimensioni la
   * finestra sul Mac. Le velocità restano quelle calcolate all'inizio: cambia
   * l'altezza disponibile, non la larghezza, e la scala dipende dalla larghezza.
   */
  alRidimensionamento() {
    const larghezza = this.scale.width;
    const altezza = this.scale.height;

    this.physics.world.setBounds(0, 0, larghezza, altezza);
    this.disegnaGriglia();
    this.posizionaHud();
    this.disegnaBarraVita();

    // Se lo schermo si è rimpicciolito, il giocatore potrebbe essere rimasto fuori.
    const meta = this.giocatore.displayWidth / 2;
    this.giocatore.setPosition(
      Phaser.Math.Clamp(this.giocatore.x, meta, larghezza - meta),
      Phaser.Math.Clamp(this.giocatore.y, meta, altezza - meta)
    );
  }

  /** Pulizia quando la partita ricomincia: evita di accumulare oggetti a ogni
   *  restart, che dopo qualche partita rallenterebbe il gioco. */
  allaChiusura() {
    this.scale.off('resize', this.alRidimensionamento, this);
    if (this.controlli) this.controlli.distruggi();
    if (this.gruppoProiettili) this.gruppoProiettili.destroy(true);
    if (this.gruppoNemici) this.gruppoNemici.destroy(true);
  }
}
