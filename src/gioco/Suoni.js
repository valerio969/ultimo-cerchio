import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { SUONI } from '../scene/SceneAvvio.js';

/**
 * I SUONI
 *
 * Un posto solo da cui far partire tutti gli effetti sonori.
 *
 * ---------------------------------------------------------------------------
 * PERCHÉ NON BASTA scene.sound.play('sparo')
 * ---------------------------------------------------------------------------
 * Due motivi.
 *
 * Primo, l'allocazione: quel comando crea un oggetto suono nuovo ogni volta e lo
 * butta quando ha finito. Quattro spari al secondo per un minuto sono
 * duecentoquaranta oggetti creati e distrutti — esattamente quello che stiamo
 * evitando in tutto il resto del gioco per non perdere fotogrammi.
 *
 * Secondo, la sovrapposizione: riusare sempre lo STESSO oggetto suono
 * taglierebbe il suono precedente a metà. Quando dieci nemici esplodono insieme
 * sentiresti una sola esplosione tronca.
 *
 * Quindi teniamo un gruppetto di oggetti per ogni effetto e li usiamo a turno,
 * come le corsie di un casello: il colpo nuovo prende la corsia successiva
 * invece di interrompere quello di prima.
 */
export default class Suoni {
  constructor(scene) {
    this.scene = scene;
    this.attivo = CONFIG.audio.attivo;
    this.corsie = {};

    if (!this.attivo) return;

    for (const nome of SUONI) {
      const impostazioni = CONFIG.audio[nome];
      if (!impostazioni) continue;

      // Se il file non è stato caricato (per esempio l'audio era spento al
      // caricamento) evitiamo di far esplodere il gioco per un suono.
      if (!scene.cache.audio.exists(nome)) continue;

      // Il volume di ogni effetto è fisso, quindi lo diamo al suono qui, una
      // volta sola, alla creazione. È il posto giusto: non è una cosa che cambia
      // da un colpo all'altro.
      const volume = impostazioni.volume * CONFIG.audio.volumeGenerale;

      const istanze = [];
      for (let i = 0; i < Math.max(1, impostazioni.quantiInsieme); i += 1) {
        istanze.push(scene.sound.add(nome, { volume }));
      }

      this.corsie[nome] = { istanze, prossima: 0, impostazioni, volume };
    }

    this.sbloccaSuIphone();
  }

  /**
   * iPhone non permette a una pagina web di emettere suoni prima che tu abbia
   * toccato lo schermo — è una regola di Safari contro le pagine che partono a
   * urlare da sole. Phaser di solito se ne accorge da sé, ma su alcune versioni
   * di iOS il motore audio resta "sospeso" e il gioco resta muto senza dare
   * nessun errore. Questo lo risveglia al primo tocco, per sicurezza.
   */
  sbloccaSuIphone() {
    this.scene.input.once('pointerdown', () => {
      const contesto = this.scene.sound.context;
      if (contesto && contesto.state === 'suspended') contesto.resume();
    });
  }

  /**
   * Fa partire un effetto.
   * @param {string} nome  uno fra: sparo, esplosione, danno, ondata, gameover
   */
  suona(nome) {
    if (!this.attivo) return;

    const corsia = this.corsie[nome];
    if (!corsia) return;

    const suono = corsia.istanze[corsia.prossima];
    corsia.prossima = (corsia.prossima + 1) % corsia.istanze.length;

    // L'intonazione spostata a caso di un pizzico: è quello che evita l'effetto
    // trapano quando lo stesso suono si ripete quattro volte al secondo.
    const variazione = corsia.impostazioni.variazioneTono;
    const detune = variazione ? Phaser.Math.Between(-variazione, variazione) : 0;

    suono.setDetune(detune);
    suono.play();

    // Il volume lo riaffermiamo anche adesso, dopo play(). Il suono ce l'ha già
    // dalla nascita, quindi normalmente questa riga non cambia niente: è una
    // cintura di sicurezza, perché play() rimescola le impostazioni del suono e
    // non vogliamo dipendere da come lo fa. Costa nulla, e ci garantisce che lo
    // sparo non possa mai suonare a tutto volume quattro volte al secondo.
    suono.setVolume(corsia.volume);
  }

  /** Zittisce tutto (usato quando la partita finisce). */
  fermaTutto() {
    if (!this.attivo) return;
    for (const corsia of Object.values(this.corsie)) {
      for (const suono of corsia.istanze) suono.stop();
    }
  }
}
