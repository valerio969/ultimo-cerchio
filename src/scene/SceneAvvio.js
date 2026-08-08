import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';

/**
 * Il nome con cui è salvata l'immagine di un tipo di nemico.
 * Sta qui perché lo usano sia questa scena (che le crea) sia i nemici
 * (che le usano): se il nome lo decidesse ognuno per conto suo, prima o poi
 * si scriverebbero in modo diverso e il gioco mostrerebbe un riquadro vuoto.
 */
export function nomeTextureNemico(nomeTipo) {
  return `nemico-${nomeTipo}`;
}

/**
 * SCENA DI AVVIO
 *
 * In Milestone 1 non abbiamo nessun file grafico: il giocatore è un quadrato blu,
 * i nemici cerchi rossi, i proiettili puntini bianchi.
 *
 * PERCHÉ NON USIAMO GLI OGGETTI "FORMA" DI PHASER
 * Phaser sa disegnare direttamente rettangoli e cerchi, ma ognuno di quelli è un
 * disegno a sé che la scheda grafica deve elaborare separatamente: con duecento
 * proiettili a schermo il telefono inizia a scattare.
 * Invece qui disegniamo le forme UNA VOLTA SOLA e le trasformiamo in piccole
 * immagini in memoria ("texture"). Da quel momento il gioco usa immagini, che la
 * scheda grafica sa disegnare a migliaia tutte insieme.
 *
 * Bonus: in Milestone 4, quando arriveranno gli sprite veri, basterà caricare i
 * file al posto di queste tre righe. Tutto il resto del codice non cambia.
 */
export default class SceneAvvio extends Phaser.Scene {
  constructor() {
    super({ key: 'Avvio' });
  }

  create() {
    const scala = scalaDi(this);

    // Disegniamo le texture al doppio della dimensione che serve e poi le
    // rimpiccioliamo. Rimpicciolire un'immagine viene bene, ingrandirla no:
    // così le forme restano con i bordi puliti anche se lo schermo cambia.
    const FATTORE = 2;

    this.creaQuadrato(
      'giocatore',
      Math.ceil(CONFIG.giocatore.dimensione * scala * FATTORE),
      CONFIG.colori.giocatore
    );

    // Un cerchio per ogni tipo di nemico, con il suo colore e la sua stazza.
    // Il ciclo legge i tipi da config.js: se ne aggiungi uno lì, la sua texture
    // viene creata da sola, senza toccare questo file.
    for (const [nome, tipo] of Object.entries(CONFIG.tipiNemico)) {
      this.creaCerchio(
        nomeTextureNemico(nome),
        Math.ceil(tipo.dimensione * scala * FATTORE),
        tipo.colore
      );
    }

    this.creaCerchio(
      'proiettile',
      Math.ceil(CONFIG.arma.dimensioneProiettile * scala * FATTORE),
      CONFIG.colori.proiettile
    );

    // Un quadratino bianco per le particelle delle esplosioni. Lo coloriamo poi
    // di volta in volta col colore del nemico che è esploso.
    this.creaQuadrato(
      'scheggia',
      Math.ceil(CONFIG.feedback.particelle.dimensione * scala * FATTORE),
      0xffffff
    );

    // Tutto pronto: si comincia a giocare.
    this.scene.start('Gioco');
  }

  /** Disegna un quadrato con gli angoli arrotondati e lo salva come immagine. */
  creaQuadrato(nome, lato, colore) {
    if (this.textures.exists(nome)) return;

    const disegno = this.make.graphics({ add: false });
    disegno.fillStyle(colore, 1);
    disegno.fillRoundedRect(0, 0, lato, lato, Math.max(2, lato * 0.18));
    disegno.generateTexture(nome, lato, lato);
    disegno.destroy();
  }

  /** Disegna un cerchio pieno e lo salva come immagine. */
  creaCerchio(nome, diametro, colore) {
    if (this.textures.exists(nome)) return;

    const raggio = diametro / 2;
    const disegno = this.make.graphics({ add: false });
    disegno.fillStyle(colore, 1);
    disegno.fillCircle(raggio, raggio, raggio);
    disegno.generateTexture(nome, diametro, diametro);
    disegno.destroy();
  }
}
