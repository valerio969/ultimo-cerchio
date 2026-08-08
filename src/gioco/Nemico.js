import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';
import { nomeTextureNemico } from '../scene/SceneAvvio.js';

/**
 * IL NEMICO
 *
 * Entra da un bordo dello schermo e ti insegue, senza furbizie: punta sempre
 * dritto verso di te.
 *
 * ---------------------------------------------------------------------------
 * UN SOLO POOL PER TUTTI I TIPI
 * ---------------------------------------------------------------------------
 * Esistono tre tipi di nemico (normale, veloce, corazzato) ma un solo gruppo di
 * oggetti riutilizzabili. Quando un nemico viene "acceso", cambia immagine,
 * stazza e caratteristiche diventando il tipo richiesto.
 *
 * L'alternativa sarebbe stata un pool separato per ogni tipo, ma vorrebbe dire
 * tenere in memoria tre volte più oggetti di quelli che servono davvero: se in
 * un'ondata ci sono solo nemici normali, i pool degli altri due tipi resterebbero
 * pieni e inutilizzati.
 *
 * ---------------------------------------------------------------------------
 * OBJECT POOLING — perché questo oggetto non viene mai distrutto
 * ---------------------------------------------------------------------------
 * Creare e distruggere oggetti in continuazione è la causa numero uno degli
 * scatti nei giochi sul telefono: ogni tanto il browser deve fermarsi a
 * ripulire la memoria, e in quel momento perdi fotogrammi.
 *
 * Quindi all'avvio ne creiamo un numero fisso (config.nemici.nemiciInPool) e poi
 * li riusiamo: attiva() lo accende, spegni() lo mette da parte.
 */
export default class Nemico extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Nasce col primo tipo disponibile: tanto attiva() gli darà quello giusto.
    const primoTipo = Object.keys(CONFIG.tipiNemico)[0];
    super(scene, x, y, nomeTextureNemico(primoTipo));

    this.scala = scalaDi(scene);

    // Riempiti da attiva()
    this.tipo = null;
    this.vita = 0;
    this.vitaIniziale = 0;
    this.danno = 0;
    this.punti = 0;
    this.colore = 0xffffff;
    this.velocitaInseguimento = 0;

    // Momento in cui il lampo bianco del colpo deve spegnersi. 0 = nessun lampo.
    this.lampoFino = 0;

    this.setDepth(5);
  }

  /**
   * Il corpo fisico non esiste nel costruttore: il gruppo prima costruisce
   * l'oggetto e solo dopo gli attacca il corpo. La scena chiama questo metodo
   * subito dopo aver creato il pool.
   */
  configuraCorpo() {
    this.body.setSize(this.width * 0.8, this.height * 0.8, true);
  }

  /**
   * Accende un nemico preso dal pool, lo trasforma nel tipo richiesto e lo mette
   * in posizione.
   *
   * @param {number} x
   * @param {number} y
   * @param {object} tipo             una voce di CONFIG.tipiNemico
   * @param {number} rinforzoVita     1 = vita normale, 1.5 = una volta e mezza
   * @param {number} rinforzoVelocita 1 = velocità normale
   */
  attiva(x, y, tipo, rinforzoVita = 1, rinforzoVelocita = 1) {
    this.tipo = tipo;
    this.colore = tipo.colore;
    this.danno = tipo.danno;
    this.punti = tipo.punti;

    this.vitaIniziale = Math.round(tipo.vita * rinforzoVita);
    this.vita = this.vitaIniziale;
    this.velocitaInseguimento = tipo.velocita * rinforzoVelocita * this.scala;

    // L'ORDINE DI QUESTE TRE RIGHE CONTA:
    //   1. cambiamo immagine, 2. la portiamo alla dimensione giusta,
    //   3. e solo allora ridimensioniamo il riquadro delle collisioni.
    // Il riquadro viene calcolato sull'immagine attuale e sul ridimensionamento
    // attuale: se lo facessimo prima, resterebbe della stazza del tipo precedente
    // e verresti colpito dal nulla.
    this.setTexture(nomeTextureNemico(tipo.etichetta));
    this.diametro = tipo.dimensione * this.scala;
    this.setDisplaySize(this.diametro, this.diametro);

    this.enableBody(true, x, y, true, true);
    this.configuraCorpo();

    this.lampoFino = 0;
    this.clearTint();
    this.setAlpha(1);
    this.setActive(true);
    this.setVisible(true);
    return this;
  }

  /** Rimette il nemico nel pool, pronto per essere riusato. */
  spegni() {
    this.body.setVelocity(0, 0);
    this.clearTint();
    this.lampoFino = 0;
    this.disableBody(true, true);
  }

  /** Chiamato dalla scena una volta per fotogramma, per ogni nemico attivo. */
  aggiorna(giocatore, tempo) {
    if (!giocatore || !giocatore.active) {
      this.body.setVelocity(0, 0);
    } else {
      const angolo = Phaser.Math.Angle.Between(this.x, this.y, giocatore.x, giocatore.y);
      this.body.setVelocity(
        Math.cos(angolo) * this.velocitaInseguimento,
        Math.sin(angolo) * this.velocitaInseguimento
      );
    }

    // Spegniamo il lampo bianco quando è scaduto.
    if (this.lampoFino !== 0 && tempo >= this.lampoFino) {
      this.lampoFino = 0;
      this.clearTint();
    }
  }

  /**
   * Prende un colpo. Restituisce true se è morto.
   *
   * Il lampo bianco non è un fronzolo: un corazzato regge quattro colpi, e senza
   * una reazione visibile sembrerebbe che i proiettili gli passino attraverso.
   */
  subisciDanno(quantita, tempo) {
    this.vita -= quantita;

    if (CONFIG.feedback.lampoNemico.attivo && this.vita > 0) {
      // setTintFill colora TUTTA la sagoma di bianco, invece di sfumarla:
      // a un ottantesimo di secondo è l'unica versione che si vede davvero.
      this.setTintFill(0xffffff);
      this.lampoFino = tempo + CONFIG.feedback.lampoNemico.durata;
    }

    return this.vita <= 0;
  }
}
