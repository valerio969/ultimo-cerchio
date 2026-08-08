import { CONFIG } from './config.js';

/**
 * IL FATTORE DI SCALA
 *
 * In config.js le dimensioni e le velocità sono scritte per uno schermo immaginario
 * larghezza 720 unità. Questa funzione calcola quanto va moltiplicato ogni numero
 * per adattarlo allo schermo vero che abbiamo davanti.
 *
 * Esempio: su un telefono che disegna su 786 pixel veri, la scala è 786/720 = 1,09.
 * Un giocatore da 34 unità diventa 37 pixel. Sullo schermo di un iPad diventerebbe
 * più grande, mantenendo le stesse proporzioni.
 *
 * È il motivo per cui il gioco si sente identico su telefoni diversi.
 */
export function scalaDi(scene) {
  return scene.scale.width / CONFIG.mondo.larghezzaRiferimento;
}
