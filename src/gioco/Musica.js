import { CONFIG } from '../config.js';

/**
 * LA MUSICA DI SOTTOFONDO
 *
 * Non c'è nessun file musicale in questo gioco: la musica viene costruita dal
 * codice, nota per nota, mentre giochi.
 *
 * ---------------------------------------------------------------------------
 * PERCHÉ GENERARLA INVECE DI SCARICARE UN BRANO
 * ---------------------------------------------------------------------------
 * - pesa ZERO byte, mentre un brano di due minuti sarebbe uno o due megabyte
 * - nessun problema di licenza: non è di nessuno, la scrive il gioco
 * - gira per sempre senza il "buchino" che si sente quando un file audio
 *   ricomincia da capo (i file compressi hanno un pizzico di silenzio ai bordi)
 * - non serve convertirla in formati diversi per iPhone
 * - si può regolare da config.js: velocità, tonalità, volume
 * - e soprattutto può REAGIRE al gioco: più navi arrivano, più si fa insistente
 *
 * ---------------------------------------------------------------------------
 * COM'È FATTA
 * ---------------------------------------------------------------------------
 * Tre strati, come in un brano vero:
 *
 * 1. IL TAPPETO — tre note gravi tenute per sempre, passate attraverso un filtro
 *    che si apre e si chiude lentamente. È quello che dà il senso di spazio
 *    vuoto. Non si ferma mai e non cambia mai.
 *
 * 2. IL BATTITO — una nota grave e corta su ogni tempo, come un cuore.
 *    Si sente poco quando sei tranquillo, forte quando sei circondato.
 *
 * 3. LE NOTE — di tanto in tanto una nota acuta, pescata da una scala
 *    pentatonica minore (quella che in qualsiasi ordine suona bene: è la scala
 *    del blues, e non stona mai). Più navi, più spesso.
 *
 * ---------------------------------------------------------------------------
 * UNA NOTA SULL'IMPEGNO DI MEMORIA
 * ---------------------------------------------------------------------------
 * In tutto il resto del gioco non creiamo mai oggetti durante la partita.
 * Qui è inevitabile: nel motore audio dei browser un generatore di suono è
 * usa-e-getta, si fa suonare una volta e poi va buttato — non si può riusare.
 * Ma parliamo di un paio di note al secondo, e soprattutto succede FUORI dal
 * lavoro di disegno dello schermo: non ha effetto sui fotogrammi.
 * Ogni nota finita viene comunque scollegata a mano, altrimenti resterebbero
 * attaccati al motore audio migliaia di pezzi morti.
 */

/**
 * La scala pentatonica minore, in semitoni a partire dalla nota base.
 * Cinque note che suonano bene in qualunque ordine, quindi possiamo pescarle
 * a caso senza il rischio di stonare.
 */
const SCALA = [0, 3, 5, 7, 10];

/** Da semitoni a moltiplicatore di frequenza. */
function frequenza(notaBase, semitoni) {
  return notaBase * Math.pow(2, semitoni / 12);
}

export default class Musica {
  constructor(scene) {
    this.scene = scene;
    this.attiva = CONFIG.musica.attiva && CONFIG.audio.attivo;
    this.avviata = false;
    this.nodi = [];          // il tappeto, da scollegare alla fine

    // Riusiamo il motore audio di Phaser invece di aprirne un altro: così il
    // volume generale e lo sblocco su iPhone valgono anche per la musica.
    this.ctx = scene.sound.context ?? null;
    if (!this.ctx) this.attiva = false;

    // Dove mandiamo il suono: se possibile al volume generale di Phaser, così
    // se un giorno aggiungiamo un comando "muto" spegne anche la musica.
    this.uscita = scene.sound.masterVolumeNode ?? this.ctx?.destination ?? null;
    if (!this.uscita) this.attiva = false;
  }

  /**
   * Fa partire la musica. Va chiamata DOPO il primo tocco dell'utente: prima,
   * su iPhone, il motore audio è sospeso e non uscirebbe niente.
   */
  avvia() {
    if (!this.attiva || this.avviata) return;
    this.avviata = true;

    const ctx = this.ctx;

    // Il volume complessivo della musica: tutto le passa attraverso, così
    // spegnerla in dissolvenza è una riga sola.
    this.volumeMusica = ctx.createGain();
    this.volumeMusica.gain.value = 0;
    this.volumeMusica.connect(this.uscita);
    this.nodi.push(this.volumeMusica);

    // Entra in modo graduale: partire di colpo si sentirebbe come uno schiaffo.
    this.volumeMusica.gain.linearRampToValueAtTime(
      CONFIG.musica.volume, ctx.currentTime + 2.5
    );

    this.creaTappeto();

    // Il battito: teniamo il conto in tempo del motore audio, non in
    // millisecondi del gioco, perché il motore audio ha un orologio molto più
    // preciso. Con l'orologio del gioco la musica andrebbe a scatti.
    this.durataBattito = 60 / CONFIG.musica.battitiAlMinuto;
    this.prossimoBattito = ctx.currentTime + 0.4;
    this.numeroBattito = 0;
  }

  /**
   * STRATO 1 — il tappeto sonoro.
   * Tre note gravi tenute per sempre, dentro un filtro che si apre e chiude
   * molto lentamente. Creato una volta e mai più toccato.
   */
  creaTappeto() {
    const ctx = this.ctx;
    const base = CONFIG.musica.notaBase;

    // Il filtro: taglia gli acuti, lasciando passare solo il fondo cupo.
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 380;
    filtro.Q.value = 4;

    const volumeTappeto = ctx.createGain();
    volumeTappeto.gain.value = 0.5;

    filtro.connect(volumeTappeto);
    volumeTappeto.connect(this.volumeMusica);
    this.nodi.push(filtro, volumeTappeto);

    // Le tre note: l'ottava sotto, la nota base, e la quinta.
    // Sono leggermente stonate l'una rispetto all'altra, di proposito: due note
    // identiche suonano piatte, due note quasi identiche "respirano".
    const voci = [
      { frequenza: base / 2, tipo: 'sine', stonatura: 0 },
      { frequenza: base, tipo: 'sawtooth', stonatura: -7 },
      { frequenza: frequenza(base, 7), tipo: 'sawtooth', stonatura: 6 },
    ];

    for (const voce of voci) {
      const osc = ctx.createOscillator();
      osc.type = voce.tipo;
      osc.frequency.value = voce.frequenza;
      osc.detune.value = voce.stonatura;

      const g = ctx.createGain();
      g.gain.value = voce.tipo === 'sine' ? 0.30 : 0.11;

      osc.connect(g);
      g.connect(filtro);
      osc.start();

      this.nodi.push(osc, g);
    }

    // Il movimento: un oscillatore lentissimo che apre e chiude il filtro.
    // È l'unica cosa che rende il tappeto vivo invece che un ronzio fermo.
    const lento = ctx.createOscillator();
    lento.type = 'sine';
    lento.frequency.value = 0.045;      // un giro completo ogni 22 secondi circa

    const profondita = ctx.createGain();
    profondita.gain.value = 210;

    lento.connect(profondita);
    profondita.connect(filtro.frequency);
    lento.start();

    this.nodi.push(lento, profondita);
  }

  /**
   * Chiamata dalla scena una volta per fotogramma.
   *
   * @param {number} naviAschermo quante navi nemiche ci sono adesso
   */
  aggiorna(naviAschermo) {
    if (!this.attiva || !this.avviata) return;

    const ctx = this.ctx;

    // Da 0 (calma) a 1 (circondato)
    const intensita = Math.min(1, naviAschermo / CONFIG.musica.naviPerMassimaIntensita);

    // Guardiamo un pelo avanti nel tempo e prepariamo le note che devono
    // suonare a breve. È il modo corretto di fare musica nel browser: se
    // provassimo a farle partire nell'istante esatto, ogni fotogramma perso
    // diventerebbe una nota in ritardo.
    while (this.prossimoBattito < ctx.currentTime + 0.2) {
      this.suonaBattito(this.prossimoBattito, this.numeroBattito, intensita);
      this.prossimoBattito += this.durataBattito;
      this.numeroBattito += 1;
    }
  }

  /** Decide cosa suona su questo tempo. */
  suonaBattito(quando, numero, intensita) {
    const base = CONFIG.musica.notaBase;

    // --- STRATO 2: il battito, su un tempo su due ---
    if (numero % 2 === 0) {
      this.nota({
        quando,
        frequenza: base / 2,
        tipo: 'sine',
        // Cresce con l'intensità: da appena accennato a ben presente
        volume: 0.18 + 0.42 * intensita,
        durata: 0.34,
        attacco: 0.012,
      });
    }

    // Un colpo più acuto ogni otto tempi: serve a far capire dove sei nella
    // battuta, altrimenti il battito è una pappa indistinta.
    if (numero % 8 === 0) {
      this.nota({
        quando,
        frequenza: frequenza(base, 7),
        tipo: 'triangle',
        volume: 0.12 + 0.2 * intensita,
        durata: 0.5,
        attacco: 0.008,
      });
    }

    // --- STRATO 3: le note acute, sempre più frequenti ---
    // Da una probabilità bassa quando sei tranquillo a quasi certa quando sei
    // circondato. Cadono a metà tempo, così non si accavallano col battito.
    const probabilita = 0.12 + 0.55 * intensita;
    if (Math.random() < probabilita) {
      const semitoni = SCALA[Math.floor(Math.random() * SCALA.length)];
      const ottava = Math.random() < 0.35 ? 4 : 2;

      this.nota({
        quando: quando + this.durataBattito * 0.5,
        frequenza: frequenza(base * ottava, semitoni),
        tipo: 'triangle',
        volume: 0.07 + 0.09 * intensita,
        durata: 0.75,
        attacco: 0.006,
        // Sparse a destra e a sinistra: dà spazio, e due note vicine non si
        // pestano i piedi.
        panoramica: Math.random() * 1.6 - 0.8,
      });
    }
  }

  /**
   * Suona una singola nota in un momento preciso.
   *
   * Ogni nota è un generatore usa-e-getta: si costruisce, suona, e si scollega
   * da sé quando ha finito. È come funziona il motore audio dei browser.
   */
  nota({ quando, frequenza: hz, tipo, volume, durata, attacco, panoramica = 0 }) {
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    osc.type = tipo;
    osc.frequency.value = hz;

    const g = ctx.createGain();
    // La "busta" del suono: sale in fretta e poi svanisce. Senza questa, ogni
    // nota comincerebbe e finirebbe con uno schiocco secco.
    g.gain.setValueAtTime(0, quando);
    g.gain.linearRampToValueAtTime(volume, quando + attacco);
    g.gain.exponentialRampToValueAtTime(0.0005, quando + durata);

    let ultimo = g;
    osc.connect(g);

    if (panoramica !== 0 && ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = panoramica;
      g.connect(pan);
      ultimo = pan;
    }

    ultimo.connect(this.volumeMusica);

    osc.start(quando);
    osc.stop(quando + durata + 0.05);

    // Pulizia: senza questa, ogni nota lascerebbe i suoi pezzi attaccati al
    // motore audio per sempre, e dopo dieci minuti ce ne sarebbero migliaia.
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
      if (ultimo !== g) ultimo.disconnect();
    };
  }

  /** Spegne la musica in dissolvenza (quando muori). */
  dissolvi() {
    if (!this.attiva || !this.avviata) return;

    const secondi = CONFIG.musica.dissolvenzaFinale / 1000;
    const adesso = this.ctx.currentTime;

    this.volumeMusica.gain.cancelScheduledValues(adesso);
    this.volumeMusica.gain.setValueAtTime(this.volumeMusica.gain.value, adesso);
    this.volumeMusica.gain.linearRampToValueAtTime(0, adesso + secondi);
  }

  /** Smonta tutto (quando la scena si chiude, cioè quando si ricomincia). */
  ferma() {
    if (!this.avviata) return;
    this.avviata = false;

    for (const nodo of this.nodi) {
      try {
        if (typeof nodo.stop === 'function') nodo.stop();
        nodo.disconnect();
      } catch {
        // Un nodo già fermo protesta se lo fermi di nuovo: non è un problema.
      }
    }
    this.nodi.length = 0;
  }
}
