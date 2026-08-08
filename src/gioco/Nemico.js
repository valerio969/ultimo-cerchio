import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { scalaDi } from '../scala.js';

/**
 * Gli sprite di Kenney sono disegnati con la punta verso l'ALTO.
 * Phaser invece, quando dici "rotazione 0", intende punta verso DESTRA.
 * Quindi ogni volta che orientiamo una nave verso qualcosa dobbiamo aggiungere
 * un quarto di giro, altrimenti tutte le navi volano di fianco.
 */
export const CORREZIONE_SPRITE = Math.PI / 2;

/**
 * IL NEMICO
 *
 * Entra da un bordo dello schermo e ti insegue, senza furbizie: punta sempre
 * dritto verso di te, e si gira per guardarti.
 *
 * ---------------------------------------------------------------------------
 * UN SOLO POOL PER TUTTI I TIPI
 * ---------------------------------------------------------------------------
 * Esistono tre tipi di nemico (normale, veloce, corazzato) ma un solo gruppo di
 * oggetti riutilizzabili. Quando un nemico viene "acceso", cambia disegno,
 * stazza, colore e caratteristiche diventando il tipo richiesto.
 *
 * L'alternativa sarebbe un pool separato per tipo, ma vorrebbe dire tenere in
 * memoria tre volte più oggetti di quelli che servono: se in un'ondata ci sono
 * solo nemici normali, i pool degli altri due resterebbero pieni e inutilizzati.
 *
 * ---------------------------------------------------------------------------
 * OBJECT POOLING — perché questo oggetto non viene mai distrutto
 * ---------------------------------------------------------------------------
 * Creare e distruggere oggetti in continuazione è la causa numero uno degli
 * scatti nei giochi sul telefono: ogni tanto il browser deve fermarsi a
 * ripulire la memoria, e in quel momento perdi fotogrammi.
 */
export default class Nemico extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Nasce col disegno del primo tipo disponibile: tanto attiva() gli darà
    // quello giusto.
    const primoTipo = Object.values(CONFIG.tipiNemico)[0];
    super(scene, x, y, primoTipo.sprite);

    this.scala = scalaDi(scene);

    // Riempiti da attiva()
    this.tipo = null;
    this.vita = 0;
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
   * subito dopo aver creato il pool, e attiva() lo richiama a ogni cambio di tipo.
   */
  configuraCorpo() {
    const frazione = CONFIG.nemici.riquadroCollisione;
    this.body.setSize(this.width * frazione, this.height * frazione, true);
  }

  /**
   * Accende un nemico preso dal pool, lo trasforma nel tipo richiesto e lo mette
   * in posizione.
   *
   * @param {object} tipo             una voce di CONFIG.tipiNemico
   * @param {number} rinforzoVita     1 = vita normale, 1.5 = una volta e mezza
   * @param {number} rinforzoVelocita 1 = velocità normale
   */
  attiva(x, y, tipo, rinforzoVita = 1, rinforzoVelocita = 1) {
    this.tipo = tipo;
    this.colore = tipo.colore;
    this.danno = tipo.danno;
    this.punti = tipo.punti;

    this.vita = Math.round(tipo.vita * rinforzoVita);
    this.velocitaInseguimento = tipo.velocita * rinforzoVelocita * this.scala;

    // L'ORDINE DI QUESTE RIGHE CONTA:
    //   1. cambiamo disegno, 2. lo portiamo alla dimensione giusta,
    //   3. e solo allora ridimensioniamo il riquadro delle collisioni.
    // Il riquadro si calcola sul disegno attuale: se lo facessimo prima,
    // resterebbe della stazza del tipo precedente e verresti colpito dal nulla.
    this.setTexture(tipo.sprite);
    this.diametro = tipo.dimensione * this.scala;
    this.setDisplaySize(this.diametro, this.diametro);

    this.enableBody(true, x, y, true, true);
    this.configuraCorpo();

    this.lampoFino = 0;
    // Gli sprite sono bianchi: il colore glielo diamo noi qui.
    this.setTint(this.colore);
    this.setAlpha(1);
    this.setActive(true);
    this.setVisible(true);
    return this;
  }

  /** Rimette il nemico nel pool, pronto per essere riusato. */
  spegni() {
    this.body.setVelocity(0, 0);
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
      // Si gira verso di te. Nessuna morbidezza: un nemico che ti punta dritto
      // deve sembrare deciso.
      this.setRotation(angolo + CORREZIONE_SPRITE);
    }

    // Spegniamo il lampo bianco quando è scaduto, tornando al colore del tipo.
    if (this.lampoFino !== 0 && tempo >= this.lampoFino) {
      this.lampoFino = 0;
      this.setTint(this.colore);
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
      // setTintFill riempie TUTTA la sagoma di bianco pieno, invece di
      // moltiplicare il colore: a un ottantesimo di secondo è l'unica versione
      // che si vede davvero. Poi setTint rimette il colore normale.
      this.setTintFill(0xffffff);
      this.lampoFino = tempo + CONFIG.feedback.lampoNemico.durata;
    }

    return this.vita <= 0;
  }
}
