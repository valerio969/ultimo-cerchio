import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';
import { CORREZIONE_SPRITE } from './Nemico.js';

/**
 * IL GIOCATORE — la tua navicella
 *
 * Si occupa di tre cose:
 *   1. muoversi (seguendo il dito o la tastiera)
 *   2. sparare da sola al nemico più vicino, e girarsi verso di lui
 *   3. tenere il conto della vita e dell'invulnerabilità dopo un colpo
 */
export default class Giocatore extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, CONFIG.sprite.giocatore);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const scala = scalaDi(scene);

    this.lato = CONFIG.giocatore.dimensione * scala;
    this.setDisplaySize(this.lato, this.lato);
    this.setDepth(10);

    // Lo sprite è bianco: il colore glielo diamo noi.
    this.setTint(CONFIG.colori.giocatore);

    // Il riquadro delle collisioni è più piccolo del disegno. Una navicella è un
    // triangolo dentro un quadrato: gli angoli in alto sono vuoti, e se
    // contassero come parte della nave ti sembrerebbe di essere colpito dall'aria.
    // Un gioco che perdona di un pelo è un gioco che sembra giusto.
    const frazione = CONFIG.giocatore.riquadroCollisione;
    this.body.setSize(this.width * frazione, this.height * frazione, true);
    this.setCollideWorldBounds(true);

    // Valori già convertiti in pixel dello schermo, così non li ricalcoliamo
    // sessanta volte al secondo.
    this.velocitaMax = CONFIG.giocatore.velocita * scala;
    this.velocitaTastiera = CONFIG.controlli.velocitaTastiera * scala;
    this.raggioTiro = CONFIG.arma.raggioTiro * scala;
    this.zonaMorta = CONFIG.controlli.zonaMorta * scala;

    this.vitaMassima = CONFIG.giocatore.vitaMassima;
    this.vita = this.vitaMassima;

    // Momento (in millisecondi dall'avvio) fino a cui è invulnerabile
    this.invulnerabileFino = 0;
    // Momento in cui potrà sparare di nuovo
    this.prossimoSparo = 0;

    // La nave parte guardando in alto.
    this.setRotation(-Math.PI / 2 + CORREZIONE_SPRITE);
  }

  /** Chiamato dalla scena una volta per fotogramma. */
  aggiorna(tempo, delta, controlli) {
    this.aggiornaMovimento(delta, controlli);
    this.aggiornaMira(delta);
    this.aggiornaSparo(tempo);
    this.aggiornaLampeggio(tempo);
  }

  aggiornaMovimento(delta, controlli) {
    // La tastiera ha la precedenza: se stai premendo un tasto, comanda quella.
    const tastiera = controlli.direzioneTastiera();
    if (tastiera) {
      this.body.setVelocity(
        tastiera.x * this.velocitaTastiera,
        tastiera.y * this.velocitaTastiera
      );
      return;
    }

    // Dito alzato: fermo.
    if (!controlli.ditoGiu) {
      this.body.setVelocity(0, 0);
      return;
    }

    // Dito appoggiato: andiamo verso il bersaglio.
    const distanza = Phaser.Math.Distance.Between(
      this.x, this.y, controlli.bersaglio.x, controlli.bersaglio.y
    );

    if (distanza <= this.zonaMorta) {
      this.body.setVelocity(0, 0);
      return;
    }

    // Se il bersaglio è più vicino di quanto percorreremmo in un fotogramma,
    // rallentiamo per fermarci esattamente lì invece di superarlo e tornare
    // indietro, che si vedrebbe come un tremolio.
    const secondi = delta / 1000;
    const velocita = Math.min(this.velocitaMax, distanza / secondi);

    const angolo = Phaser.Math.Angle.Between(
      this.x, this.y, controlli.bersaglio.x, controlli.bersaglio.y
    );
    this.body.setVelocity(Math.cos(angolo) * velocita, Math.sin(angolo) * velocita);
  }

  /**
   * La nave si gira verso il nemico bersagliato, in modo morbido.
   *
   * Il bersaglio lo calcola la scena una volta per fotogramma e lo condivide:
   * cercare il nemico più vicino due volte (una per girarsi, una per sparare)
   * sarebbe lavoro raddoppiato per niente.
   */
  aggiornaMira(delta) {
    if (!CONFIG.giocatore.ruotaVersoIlBersaglio) return;

    const bersaglio = this.scene.bersaglioCorrente;
    if (!bersaglio) return;

    const angolo = Phaser.Math.Angle.Between(this.x, this.y, bersaglio.x, bersaglio.y);

    // Il passo è proporzionato al tempo passato, così la nave gira alla stessa
    // velocità anche se il telefono perde qualche fotogramma.
    const passo = CONFIG.giocatore.velocitaRotazione * (delta / 16.67);

    this.setRotation(
      Phaser.Math.Angle.RotateTo(this.rotation, angolo + CORREZIONE_SPRITE, passo)
    );
  }

  /**
   * MIRA AUTOMATICA
   * A intervalli regolari spara al nemico più vicino.
   * Nessun pulsante di fuoco: è una scelta di progetto, non una mancanza.
   */
  aggiornaSparo(tempo) {
    if (tempo < this.prossimoSparo) return;

    const bersaglio = this.scene.bersaglioCorrente;
    if (!bersaglio) return;   // nessuno in raggio: si risparmiano i colpi

    this.prossimoSparo = tempo + CONFIG.arma.intervalloSparo;

    const angolo = Phaser.Math.Angle.Between(this.x, this.y, bersaglio.x, bersaglio.y);

    // Il colpo parte dalla punta della nave, non dal centro: se partisse dal
    // centro sembrerebbe uscire dalla pancia.
    const sporgenza = this.displayHeight * 0.45;
    this.scene.sparaProiettile(
      this.x + Math.cos(angolo) * sporgenza,
      this.y + Math.sin(angolo) * sporgenza,
      angolo
    );
  }

  /** Mentre è invulnerabile, la nave lampeggia. */
  aggiornaLampeggio(tempo) {
    if (tempo >= this.invulnerabileFino) {
      this.setAlpha(1);
      return;
    }

    const passo = Math.floor(tempo / CONFIG.giocatore.lampeggioIntervallo);
    this.setAlpha(passo % 2 === 0 ? 0.25 : 1);
  }

  /** Vero se in questo momento è immune ai danni. */
  eInvulnerabile(tempo) {
    return tempo < this.invulnerabileFino;
  }

  /**
   * Subisce un colpo. Restituisce true se questo colpo l'ha uccisa.
   */
  subisciDanno(quantita, tempo) {
    this.vita = Math.max(0, this.vita - quantita);
    this.invulnerabileFino = tempo + CONFIG.giocatore.invulnerabilitaDopoDanno;
    return this.vita <= 0;
  }
}
