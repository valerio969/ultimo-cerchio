import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';
import { leggiSafeArea } from '../main.js';
import Giocatore from '../gioco/Giocatore.js';
import Nemico from '../gioco/Nemico.js';
import Proiettile from '../gioco/Proiettile.js';
import Controlli from '../gioco/Controlli.js';
import GestoreOndate from '../gioco/GestoreOndate.js';
import { nomeTextureNemico } from './SceneAvvio.js';

/** Trasforma un colore da 0xff4d5e a "#ff4d5e", che è il formato che vuole il testo. */
function esadecimale(colore) {
  return '#' + colore.toString(16).padStart(6, '0');
}

/**
 * LA SCENA DI GIOCO — è qui che si gioca
 *
 * Mette insieme tutti i pezzi: l'arena, il giocatore, i pool di nemici e
 * proiettili, le collisioni, l'interfaccia, e tutto il "sugo" (particelle,
 * scossa dello schermo, lampi).
 */
export default class SceneGioco extends Phaser.Scene {
  constructor() {
    super({ key: 'Gioco' });
  }

  create() {
    this.scala = scalaDi(this);
    this.partitaFinita = false;
    this.punteggio = 0;

    // Se per qualunque motivo la schermata di fine partita era rimasta aperta,
    // la chiudiamo qui. Nel giro normale non serve — si riparte dal pulsante
    // RICOMINCIA, che la chiude da sé — ma se un domani la partita ripartisse da
    // un'altra strada, senza questa riga si giocherebbe con il velo scuro del
    // game over incollato sopra, e sembrerebbe che il gioco si sia bloccato.
    if (this.scene.isActive('GameOver') || this.scene.isPaused('GameOver')) {
      this.scene.stop('GameOver');
    }

    // L'arena è grande esattamente come lo schermo: nessuno scorrimento.
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    this.creaGriglia();
    this.creaGiocatore();
    this.creaPool();
    this.creaParticelle();
    this.creaNumeriDanno();
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
    for (let x = 0; x <= larghezza; x += passo) this.griglia.lineBetween(x, 0, x, altezza);
    for (let y = 0; y <= altezza; y += passo) this.griglia.lineBetween(0, y, larghezza, y);
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
    // ATTENZIONE: la "key" qui è obbligatoria. Senza, createMultiple non crea
    // proprio niente e il pool resta vuoto — il gioco parte ma non arriva mai
    // nessun nemico, senza nessun messaggio d'errore.
    // Quale immagine mettiamo è indifferente: attiva() la sostituisce con quella
    // del tipo giusto. Usiamo il primo tipo definito in config.
    this.gruppoNemici.createMultiple({
      key: nomeTextureNemico(Object.keys(CONFIG.tipiNemico)[0]),
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

  /**
   * LE PARTICELLE DELLE ESPLOSIONI
   *
   * Un emettitore per ogni tipo di nemico, già colorato del colore giusto e
   * creato adesso una volta sola. Gli emettitori di Phaser hanno il loro pool
   * interno di particelle, quindi durante la partita non si crea niente: si
   * chiede solo "sputa nove schegge in questo punto".
   *
   * Perché uno per tipo invece di uno solo: cambiare il colore di un emettitore
   * a ogni esplosione tingerebbe anche le schegge già in volo delle esplosioni
   * precedenti, con l'effetto che i colori si "contagiano" a vicenda.
   */
  creaParticelle() {
    this.emettitori = {};
    if (!CONFIG.feedback.particelle.attive) return;

    const p = CONFIG.feedback.particelle;

    for (const [nome, tipo] of Object.entries(CONFIG.tipiNemico)) {
      this.emettitori[nome] = this.add
        .particles(0, 0, 'scheggia', {
          speed: { min: p.velocitaMinima * this.scala, max: p.velocitaMassima * this.scala },
          lifespan: p.durata,
          // La texture è disegnata al doppio del necessario, quindi partiamo da
          // metà e rimpiccioliamo fino a zero mentre la scheggia svanisce.
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0.2 },
          tint: tipo.colore,
          // emitting: false = sta zitto finché non gli diciamo noi di sparare
          emitting: false,
        })
        .setDepth(6);
    }
  }

  /**
   * I NUMERI DI DANNO
   *
   * Un gruppetto di scritte già create, che vengono riusate. Le muoviamo e le
   * facciamo svanire noi a mano dentro il ciclo di gioco, invece di usare le
   * animazioni automatiche di Phaser: quelle creerebbero un oggetto nuovo a ogni
   * colpo, ed è esattamente quello che vogliamo evitare.
   */
  creaNumeriDanno() {
    this.numeriDanno = [];
    if (!CONFIG.feedback.numeriDanno.attivi) return;

    const n = CONFIG.feedback.numeriDanno;
    for (let i = 0; i < n.quantiInPool; i += 1) {
      const testo = this.add
        .text(0, 0, '', this.stileTesto(n.dimensione, CONFIG.colori.testo))
        .setOrigin(0.5)
        .setDepth(900)
        .setActive(false)
        .setVisible(false);
      testo.scadenza = 0;
      testo.yPartenza = 0;
      this.numeriDanno.push(testo);
    }
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

  stileTesto(dimensione, colore) {
    return {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
      fontSize: `${Math.round(dimensione * this.scala)}px`,
      color: esadecimale(colore),
    };
  }

  creaHud() {
    this.graficaVita = this.add.graphics().setDepth(1000);

    this.testoPunteggio = this.add
      .text(0, 0, '0', this.stileTesto(CONFIG.hud.dimensioneTestoPunteggio, CONFIG.colori.testo))
      .setOrigin(1, 0)
      .setDepth(1000);

    this.testoOndata = this.add
      .text(0, 0, '', this.stileTesto(CONFIG.hud.dimensioneContatoreOndata, CONFIG.colori.testoSpento))
      .setOrigin(0, 0)
      .setDepth(1000);

    this.testoFps = this.add
      .text(0, 0, '', this.stileTesto(CONFIG.hud.dimensioneTestoPiccolo, CONFIG.colori.testoSpento))
      .setOrigin(0, 1)
      .setDepth(1000)
      .setVisible(CONFIG.debug.mostraFps);

    // L'annuncio grande in mezzo allo schermo: "ONDATA 3", e poi "RIPULITA".
    this.testoAnnuncio = this.add
      .text(0, 0, '', {
        ...this.stileTesto(CONFIG.hud.dimensioneAnnuncioOndata, CONFIG.colori.annuncioOndata),
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1100)
      .setAlpha(0);

    // Suggerimento iniziale, sparisce da solo dopo qualche secondo
    this.testoAiuto = this.add
      .text(
        this.scale.width / 2, this.scale.height * 0.74,
        'trascina un dito per muoverti\nspari da solo',
        { ...this.stileTesto(CONFIG.hud.dimensioneTestoPiccolo, CONFIG.colori.testoSpento), align: 'center' }
      )
      .setOrigin(0.5)
      .setDepth(1000);

    this.tweens.add({
      targets: this.testoAiuto,
      alpha: 0,
      delay: 3400,
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
    this.testoOndata.setPosition(this.hudSinistra, this.hudAlto + this.altezzaVita * 1.6);
    this.testoFps.setPosition(this.hudSinistra, this.hudBasso);
    this.testoAnnuncio.setPosition(this.scale.width / 2, this.scale.height * 0.38);
  }

  disegnaBarraVita() {
    const g = this.graficaVita;
    const x = this.hudSinistra;
    const y = this.hudAlto;
    const l = this.larghezzaVita;
    const h = this.altezzaVita;
    const raggio = h / 2;

    g.clear();

    g.fillStyle(CONFIG.colori.vitaSfondo, 1);
    g.fillRoundedRect(x, y, l, h, raggio);

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
  // ANNUNCI DELLE ONDATE — chiamati dal GestoreOndate
  // ==========================================================================

  alInizioOndata(numero) {
    this.testoOndata.setText(`ONDATA ${numero}`);
    this.mostraAnnuncio(`ONDATA ${numero}`, CONFIG.colori.annuncioOndata);
  }

  alFineOndata() {
    this.mostraAnnuncio('RIPULITA', CONFIG.colori.vita);
  }

  /**
   * La scritta grande al centro: entra ingrandendosi, resta un attimo, svanisce.
   * Riusa sempre lo stesso oggetto testo.
   */
  mostraAnnuncio(testo, colore) {
    this.testoAnnuncio
      .setText(testo)
      .setColor(esadecimale(colore))
      .setAlpha(0)
      .setScale(0.75);

    // Fermiamo l'animazione precedente, altrimenti due annunci ravvicinati si
    // sovrappongono e la scritta resta a mezz'aria con l'opacità sbagliata.
    this.tweens.killTweensOf(this.testoAnnuncio);

    this.tweens.add({
      targets: this.testoAnnuncio,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.75, to: 1 },
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.testoAnnuncio,
          alpha: 0,
          delay: 620,
          duration: 380,
        });
      },
    });
  }

  // ==========================================================================
  // IL CICLO DI GIOCO — questa funzione gira sessanta volte al secondo
  // ==========================================================================

  update(tempo, delta) {
    if (this.partitaFinita) return;

    this.giocatore.aggiorna(tempo, delta, this.controlli);

    // Ogni nemico attivo punta verso il giocatore e gestisce il suo lampo.
    const nemici = this.gruppoNemici.getChildren();
    for (let i = 0; i < nemici.length; i += 1) {
      if (nemici[i].active) nemici[i].aggiorna(this.giocatore, tempo);
    }

    // I proiettili usciti dall'arena tornano nel pool.
    const larghezza = this.scale.width;
    const altezza = this.scale.height;
    const proiettili = this.gruppoProiettili.getChildren();
    for (let i = 0; i < proiettili.length; i += 1) {
      const p = proiettili[i];
      if (p.active && p.eFuoriDallArena(larghezza, altezza)) p.spegni();
    }

    this.aggiornaNumeriDanno(tempo);
    this.ondate.aggiorna(delta);
    this.aggiornaFps(tempo);
  }

  /** Fa salire e svanire i numeri di danno. */
  aggiornaNumeriDanno(tempo) {
    if (this.numeriDanno.length === 0) return;

    const n = CONFIG.feedback.numeriDanno;
    const salita = n.salita * this.scala;

    for (let i = 0; i < this.numeriDanno.length; i += 1) {
      const testo = this.numeriDanno[i];
      if (!testo.active) continue;

      // Da 1 (appena comparso) a 0 (scaduto)
      const rimasto = (testo.scadenza - tempo) / n.durata;

      if (rimasto <= 0) {
        testo.setActive(false).setVisible(false);
        continue;
      }

      testo.y = testo.yPartenza - salita * (1 - rimasto);
      testo.setAlpha(rimasto);
    }
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
  faiComparireNemico(x, y, tipo, rinforzoVita, rinforzoVelocita) {
    const nemico = this.gruppoNemici.get();
    if (!nemico) return null;

    return nemico.attiva(x, y, tipo, rinforzoVita, rinforzoVelocita);
  }

  /** Accende un numero di danno sopra un punto. */
  mostraNumeroDanno(x, y, quantita, tempo) {
    if (this.numeriDanno.length === 0) return;

    // Cerchiamo uno spento da riusare. Se sono tutti in uso salta: meglio un
    // numero in meno che un oggetto creato in mezzo alla partita.
    let libero = null;
    for (let i = 0; i < this.numeriDanno.length; i += 1) {
      if (!this.numeriDanno[i].active) {
        libero = this.numeriDanno[i];
        break;
      }
    }
    if (!libero) return;

    libero.setText(String(quantita));
    libero.setPosition(x, y);
    libero.yPartenza = y;
    libero.scadenza = tempo + CONFIG.feedback.numeriDanno.durata;
    libero.setAlpha(1).setActive(true).setVisible(true);
  }

  /** Sputa le schegge dell'esplosione, del colore del nemico che è morto. */
  esplodi(nemico) {
    if (!CONFIG.feedback.particelle.attive) return;

    const emettitore = this.emettitori[nemico.tipo.etichetta];
    if (!emettitore) return;

    emettitore.emitParticleAt(nemico.x, nemico.y, CONFIG.feedback.particelle.quantita);
  }

  /** Fa tremare lo schermo, se non l'hai spento da config. */
  scuotiSchermo(durata, intensita) {
    if (!CONFIG.feedback.screenShake.attivo) return;
    this.cameras.main.shake(durata, intensita);
  }

  // ==========================================================================
  // COLLISIONI
  // ==========================================================================

  proiettileColpisceNemico(proiettile, nemico) {
    // I corpi spenti a volte producono ancora una chiamata nello stesso
    // fotogramma: questo controllo evita di contare due volte lo stesso colpo.
    if (!proiettile.active || !nemico.active) return;

    const tempo = this.time.now;
    proiettile.spegni();

    const morto = nemico.subisciDanno(proiettile.danno, tempo);

    if (morto) {
      this.esplodi(nemico);
      this.punteggio += nemico.punti;
      this.testoPunteggio.setText(String(this.punteggio));
      nemico.spegni();
      this.scuotiSchermo(
        CONFIG.feedback.screenShake.uccisioneDurata,
        CONFIG.feedback.screenShake.uccisioneIntensita
      );
    } else {
      // Il numero compare solo sui nemici che SOPRAVVIVONO al colpo. Su quelli
      // che muoiono con un colpo sarebbe rumore: vedi già che spariscono.
      // Sui corazzati invece serve, perché ti dice che stai facendo progressi.
      this.mostraNumeroDanno(nemico.x, nemico.y - nemico.displayHeight * 0.6,
        proiettile.danno, tempo);
    }
  }

  nemicoToccaGiocatore(giocatore, nemico) {
    if (this.partitaFinita || !nemico.active) return;

    const tempo = this.time.now;
    if (giocatore.eInvulnerabile(tempo)) return;

    const morto = giocatore.subisciDanno(nemico.danno, tempo);
    this.disegnaBarraVita();

    // Lampo rosso su tutto lo schermo. Usiamo il flash della telecamera di
    // Phaser invece di un rettangolo nostro: non crea nessun oggetto.
    const f = CONFIG.feedback.flashDanno;
    if (f.attivo) {
      this.cameras.main.flash(f.durata, f.colore.r, f.colore.g, f.colore.b, false);
    }

    this.scuotiSchermo(
      CONFIG.feedback.screenShake.dannoDurata,
      CONFIG.feedback.screenShake.dannoIntensita
    );

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
      ondata: this.ondate.numeroOndata,
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

    for (const emettitore of Object.values(this.emettitori ?? {})) {
      emettitore.destroy();
    }
  }
}
