import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';

/**
 * IL GIOCATORE — il quadrato blu
 *
 * Si occupa di tre cose:
 *   1. muoversi (seguendo il dito o la tastiera)
 *   2. sparare da solo al nemico più vicino
 *   3. tenere il conto della vita e dell'invulnerabilità dopo un colpo
 */
export default class Giocatore extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'giocatore');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const scala = scalaDi(scene);

    // La texture è disegnata al doppio della dimensione utile, quindi qui la
    // riportiamo alla dimensione vera.
    this.lato = CONFIG.giocatore.dimensione * scala;
    this.setDisplaySize(this.lato, this.lato);
    this.setDepth(10);

    // Il riquadro delle collisioni è un po' più piccolo del quadrato disegnato:
    // i colpi di striscio non contano. Un gioco che perdona di un pelo è un gioco
    // che sembra giusto.
    // Nota: le misure vanno date sulla texture originale, Phaser applica lo
    // ridimensionamento da solo.
    this.body.setSize(this.width * 0.82, this.height * 0.82, true);
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
  }

  /** Chiamato dalla scena una volta per fotogramma. */
  aggiorna(tempo, delta, controlli) {
    this.aggiornaMovimento(delta, controlli);
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
   * MIRA AUTOMATICA
   * A intervalli regolari cerchiamo il nemico più vicino e gli sparamo.
   * Nessun pulsante di fuoco: è una scelta di progetto, non una mancanza.
   */
  aggiornaSparo(tempo) {
    if (tempo < this.prossimoSparo) return;

    const bersaglio = this.scene.nemicoPiuVicino(this.x, this.y, this.raggioTiro);
    if (!bersaglio) return;   // nessuno in raggio: si risparmiano i colpi

    this.prossimoSparo = tempo + CONFIG.arma.intervalloSparo;

    const angolo = Phaser.Math.Angle.Between(this.x, this.y, bersaglio.x, bersaglio.y);
    this.scene.sparaProiettile(this.x, this.y, angolo);

    // Il quadrato si gira verso dove sta sparando: così capisci a colpo d'occhio
    // chi stai bersagliando. Si può spegnere da config.
    if (CONFIG.giocatore.ruotaVersoIlBersaglio) this.setRotation(angolo);
  }

  /** Mentre è invulnerabile, il quadrato lampeggia. */
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
   * Subisce un colpo. Restituisce true se questo colpo lo ha ucciso.
   */
  subisciDanno(quantita, tempo) {
    this.vita = Math.max(0, this.vita - quantita);
    this.invulnerabileFino = tempo + CONFIG.giocatore.invulnerabilitaDopoDanno;
    return this.vita <= 0;
  }
}
