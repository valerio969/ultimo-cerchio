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

## Licenza

Codice: MIT.
