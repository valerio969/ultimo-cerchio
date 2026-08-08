# Ultimo Cerchio

Sparatutto 2D dall'alto, giocabile dal telefono e **completamente offline**.
Un dito, mira automatica. Niente joystick virtuali, niente pulsante di fuoco.

**Gioca qui:** https://valerio969.github.io/ultimo-cerchio/

Su iPhone, apri il link in Safari e tocca Condividi → *Aggiungi alla schermata
Home*: da quel momento è un'app che funziona anche in modalità aereo.

## Com'è fatto

- [Phaser 3](https://phaser.io) con Arcade Physics
- [Vite](https://vite.dev) come build tool
- `vite-plugin-pwa` per manifest e service worker
- JavaScript semplice, nessun framework
- Nessun backend, nessun account, nessuna chiamata di rete durante il gioco

Object pooling per proiettili e nemici: nessun oggetto viene creato o distrutto
durante la partita, per non perdere fotogrammi sui telefoni di fascia media.

## Per lavorarci

```bash
npm install       # scarica le librerie
npm run dev       # avvia il gioco in locale, raggiungibile anche dal telefono
npm run build     # compila la versione da pubblicare
npm run pubblica  # compila e manda online
npm run icone     # rigenera le icone PNG da public/icona.svg
```

Con `npm run dev` il server risponde anche sulla rete wifi locale, così si può
provare il gioco col dito da un telefono collegato alla stessa rete.

## Dove sono i numeri del gioco

Tutto il bilanciamento sta in un unico file commentato: **[`src/config.js`](src/config.js)**.
Velocità, danni, vita, frequenza di fuoco, ritmo delle ondate, colori, dimensioni.
Si può cambiare come si sente il gioco senza toccare una riga di logica.

## Documenti

- [`spec.md`](spec.md) — i requisiti
- [`todo.md`](todo.md) — le milestone divise in task, con lo stato di avanzamento

## Asset

Grafica e suoni sono di **[Kenney](https://kenney.nl)**, licenza
[CC0](https://creativecommons.org/publicdomain/zero/1.0/) — uso libero, anche
commerciale, senza obbligo di attribuzione. Lo citiamo comunque, perché è giusto.

- [Simple Space](https://kenney.nl/assets/simple-space) — le navi, le stelle, i sassi
- [Sci-Fi Sounds](https://kenney.nl/assets/sci-fi-sounds) — gli effetti sonori

I disegni sono bianchi di proposito: il gioco li colora al volo, così lo stesso
file fa da nemico rosso, arancione o viola. I colori stanno in `src/config.js`.

I suoni originali sono in formato OGG, che iPhone non sa leggere: sono stati
convertiti in WAV.

**La musica di sottofondo non è un file:** è generata dal codice nota per nota
(`src/gioco/Musica.js`), con la Web Audio API. Pesa zero byte, gira in loop per
sempre senza stacchi, e si intensifica man mano che l'arena si affolla.

L'icona (`public/icona.svg`) è disegnata a mano; le PNG si rigenerano con
`npm run icone`.

## Licenza

Codice: MIT. Asset: CC0 (vedi sopra).
