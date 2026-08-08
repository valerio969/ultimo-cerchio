import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * NOME DELLA CARTELLA SU GITHUB
 *
 * Quando il gioco è pubblicato su GitHub Pages, non sta alla radice del sito ma
 * dentro una sottocartella col nome del progetto:
 *     https://valerio969.github.io/ultimo-cerchio/
 *
 * Se non lo dicessimo a Vite, il gioco cercherebbe i suoi file alla radice del
 * sito e troverebbe una schermata bianca. Se cambi il nome del progetto su
 * GitHub, cambia anche questa riga.
 */
const CARTELLA_SU_GITHUB = '/ultimo-cerchio/';

export default defineConfig(({ command }) => ({
  // In locale il gioco sta alla radice, online sta nella sottocartella.
  base: command === 'build' ? CARTELLA_SU_GITHUB : '/',

  server: {
    // host: true fa in modo che il server di sviluppo risponda su TUTTA la rete
    // wifi e non solo sul Mac. È quello che permette di aprire il gioco dal
    // telefono quando siete sulla stessa rete.
    host: true,
    port: 5173,
  },

  build: {
    outDir: 'dist',
    // Phaser è grosso (circa 1 MB). Alziamo la soglia dell'avviso per non
    // vedere un allarme inutile a ogni compilazione.
    chunkSizeWarningLimit: 1500,
  },

  plugins: [
    VitePWA({
      // 'autoUpdate' = quando pubblico una versione nuova, il telefono la prende
      // da solo alla prossima apertura, senza chiederti niente.
      registerType: 'autoUpdate',

      // Il plugin aggiunge da solo in index.html il codice che accende il
      // service worker: non devo scrivere niente a mano.
      injectRegister: 'auto',

      // File che stanno in public/ e che vanno messi in cache anche se il gioco
      // non li "importa" mai direttamente nel codice.
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png', 'icona.svg'],

      // ======================================================================
      // IL MANIFEST — la carta d'identità dell'app
      // È quello che dice al telefono come si chiama il gioco, che icona usare,
      // e che deve aprirsi a schermo intero invece che dentro il browser.
      // ======================================================================
      manifest: {
        name: 'Ultimo Cerchio',
        // Quello che appare SOTTO l'icona nella schermata Home. Corto per forza:
        // i nomi lunghi vengono troncati con i puntini.
        short_name: 'Cerchio',
        description: 'Sparatutto dall\'alto. Un dito, mira automatica.',
        lang: 'it',

        // standalone = si apre come un'app vera, senza la barra degli indirizzi
        // di Safari. È la differenza fra "un sito salvato" e "un gioco".
        display: 'standalone',
        orientation: 'portrait',

        // Il colore che il telefono mostra nell'istante fra il tocco sull'icona e
        // il primo fotogramma del gioco. Uguale allo sfondo, così non si vede
        // nessun lampo bianco.
        background_color: '#0a0a12',
        theme_color: '#0a0a12',

        icons: [
          { src: 'icona-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icona-512.png', sizes: '512x512', type: 'image/png' },
          {
            // "maskable" serve ad Android, che su alcuni telefoni ritaglia
            // l'icona a cerchio o a goccia. Il nostro disegno sta tutto nella
            // zona centrale sicura, quindi non viene tagliato niente.
            src: 'icona-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      // ======================================================================
      // IL SERVICE WORKER — la copia del gioco dentro il telefono
      // ======================================================================
      workbox: {
        // Al primo caricamento mette in cache TUTTI questi file. Da quel momento
        // il gioco parte dalla memoria del telefono, e funziona in aereo.
        //
        // ATTENZIONE ALL'ELENCO DEI TIPI DI FILE: se aggiungi al gioco un file
        // con un'estensione che non è scritta qui, quel file NON viene salvato, e
        // in modalità aereo mancherà. Non compare nessun errore: il gioco parte e
        // semplicemente quella cosa non c'è. È già successo con i suoni: erano
        // .wav, "wav" non era nell'elenco, e il gioco offline restava muto.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2,webp,mp3,ogg,wav,m4a}'],

        // Le versioni vecchie della cache vengono buttate via, così il telefono
        // non accumula copie del gioco a ogni aggiornamento.
        cleanupOutdatedCaches: true,

        // Phaser da solo supera il limite di default di 2 MB per singolo file.
        // Lo alziamo a 4 MB, altrimenti il pezzo più importante del gioco
        // resterebbe fuori dalla cache e in aereo non partirebbe niente.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },

      // In sviluppo il service worker resta spento: mentre lavoriamo vogliamo
      // vedere subito le modifiche, non una versione salvata in cache.
      devOptions: { enabled: false },
    }),
  ],
}));
