# Ultimo Cerchio — Lista dei task

Le milestone divise in task piccoli. Spunta man mano.
I requisiti stanno in [spec.md](spec.md).

Legenda: `[ ]` da fare · `[x]` fatto · **(TU)** = tocca a te, non a Claude

---

## Milestone 0 — Preparazione della macchina

- [x] Installare Node.js — `brew install node` (fatto da Claude, non è servito a te)
- [x] Verificare che `node --version` risponda → `v26.7.0`, npm `11.19.0`
- [x] Scrivere `spec.md`
- [x] Scrivere `todo.md`

---

## Milestone 1 — Il nucleo giocabile

**Obiettivo:** un gioco brutto ma completo e giocabile. Solo forme geometriche.

### 1.1 Impalcatura del progetto

- [x] Creare `package.json` e installare Vite 8 + Phaser 3.90 (17 pacchetti in tutto)
- [x] `vite.config.js` con `server: { host: true }` per l'accesso dalla rete wifi
- [x] Verificare che il server di sviluppo parta e risponda sul Mac

### 1.2 La pagina e lo schermo

- [x] `index.html`: meta viewport con `viewport-fit=cover`, div contenitore del gioco
- [x] CSS: schermo intero, fondo nero, niente margini
- [x] Bloccare lo scroll della pagina (`position: fixed` + `overflow: hidden`)
- [x] Bloccare lo zoom col pinch (eventi `gesturestart/change/end` di Safari)
- [x] Bloccare il pull-to-refresh (`overscroll-behavior: none` + `touchmove`)
- [x] Bloccare il menu contestuale al tocco prolungato (`-webkit-touch-callout`)
- [x] Bloccare la selezione del testo e lo zoom col doppio tocco
- [x] Leggere le safe area dell'iPhone dal CSS e passarle al gioco
- [x] **Verificato**: simulando un notch da 47/34 px la barra della vita si sposta
      esattamente di 94 px di gioco. La gestione del notch funziona

### 1.3 Avvio di Phaser

- [x] `main.js`: configurazione Phaser, Arcade Physics, dimensioni = schermo
- [x] Gestione della densità di pixel, limitata a 2 → schermo 375 css, disegno su
      750 pixel veri. **Verificato nitido**, nessun filtro "pixel art"
- [x] Gestione del ridimensionamento (rotazione, barra di Safari, finestra sul Mac)
- [x] `SceneAvvio.js`: le tre forme geometriche diventano immagini in memoria

### 1.4 Il file di configurazione

- [x] `config.js` con tutti i numeri, ognuno commentato: cosa fa e in che unità è

### 1.5 Il giocatore

- [x] `Giocatore.js`: quadrato blu al centro dell'arena
- [x] `Controlli.js`: trascinamento relativo con un dito
- [x] **Verificato**: appoggiando il dito lontano il personaggio NON si teletrasporta
- [x] **Verificato**: 60 px di dito → 168 px di gioco (60 × 2 densità × 1,4 sensibilità)
- [x] **Verificato**: al muro il ri-ancoraggio funziona — tornando indietro di 40 px
      il personaggio riparte subito, senza zona morta
- [x] Il giocatore si ferma quando alzi il dito (velocità 0)
- [x] Il giocatore non esce dai bordi dell'arena
- [x] Controlli da tastiera (WASD + frecce) — **verificati** entrambi
- [x] Forzata l'attivazione del tocco in Phaser (`input.touch: true`): la
      rilevazione automatica era spenta e il gioco non avrebbe risposto al dito

### 1.6 I nemici

- [x] `Nemico.js`: cerchio rosso
- [x] Pool di 120 nemici pre-creato, niente creazione durante la partita
- [x] I nemici entrano da un bordo casuale, appena fuori dallo schermo
- [x] I nemici inseguono il giocatore
- [x] `GestoreOndate.js`: un nemico ogni 620 ms, ritmo che si stringe col tempo

### 1.7 I proiettili e la mira automatica

- [x] `Proiettile.js`: puntino bianco
- [x] Pool di 200 proiettili pre-creato
- [x] Trovare il nemico più vicino (distanze al quadrato, nessuna radice quadrata)
- [x] Sparo automatico ogni 260 ms, solo se il nemico è entro il raggio di tiro
- [x] I proiettili si spengono quando escono dall'arena

### 1.8 Collisioni

- [x] Proiettile colpisce nemico → muore, +10 punti — **verificato**
- [x] Nemico tocca giocatore → perdi 14 di vita — **verificato**
- [x] 600 ms di invulnerabilità dopo il danno, con lampeggio — **verificato**
      (con 15 di vita si muore in 2 colpi a 600 ms di distanza, esatto)

### 1.9 Interfaccia a schermo

- [x] Barra della vita in alto, dentro la safe area, verde → rossa sotto il 30%
- [x] Punteggio in alto a destra
- [x] Contatore FPS in basso, attivabile da `config.js`

### 1.10 Game over e restart

- [x] `SceneGameOver.js`: velo scuro sull'arena congelata, punteggio, record
- [x] Record salvato nella memoria del telefono — **verificato** (`860` salvato)
- [x] Pulsante RICOMINCIA grande, più barra spaziatrice/Invio sul Mac
- [x] **Verificato**: dopo il restart vita 100, punteggio 0, pool ancora 120/200
      esatti e 326 oggetti in scena — nessuna perdita di memoria fra partite

### 1.11 Bilanciamento e prestazioni

- [x] **Verificato**: stando completamente fermo al centro (il caso peggiore) si
      muore a 39 secondi con 980 punti. Muovendosi si dura molto di più
- [x] La pressione sale: 3 → 4 → 6 → 8 → 11 → 17 → 30 nemici a schermo
- [x] **Stress test**: 120 nemici + 150 proiettili insieme costano 0,53 ms per
      fotogramma sul Mac, contro un limite di 16,67 ms. Margine 31x
- [x] Compilazione per la pubblicazione: 1,2 MB (325 KB compressi), molto sotto i 50 MB
- [x] Il gancio di debug viene rimosso automaticamente dalla versione pubblicata

### 1.12 Decisioni prese durante il lavoro

- [x] Il personaggio NON ruota verso il bersaglio. Un quadrato è simmetrico:
      girandolo non si capisce dove punta, diventa solo un rombo. Si riaccenderà
      in Milestone 4 con uno sprite vero (`config.giocatore.ruotaVersoIlBersaglio`)
- [x] Le forme sono immagini generate all'avvio, non oggetti "forma" di Phaser:
      molto più veloce, e in Milestone 4 lo scambio con gli sprite è una riga

### 1.13 Verifica sul telefono — TOCCA A TE

- [ ] **(TU)** Aprire il gioco dal telefono e provare la checklist qui sotto

**Checklist di verifica sul telefono** — controlla una per una e dimmi cosa non va:

- [ ] Il quadrato segue il dito e non si teletrasporta
- [ ] Il dito non copre il personaggio
- [ ] La pagina non scorre
- [ ] Il pinch non fa zoom
- [ ] Il pull-to-refresh non parte
- [ ] Tenendo premuto non compare il menu "Copia / Cerca"
- [ ] La barra della vita non finisce sotto il notch
- [ ] Il gioco è nitido, non sfocato
- [ ] Gli FPS restano intorno a 60 anche con molti nemici a schermo
- [ ] Il pulsante RICOMINCIA si tocca facilmente col pollice
- [ ] La sensibilità del dito è giusta (né troppo nervosa né troppo lenta)
- [ ] Il gioco è divertente almeno per trenta secondi

---

## Milestone 2 — Il gioco diventa divertente

**Non si inizia finché la Milestone 1 non è verificata sul telefono.**

### 2.1 Ondate vere

- [ ] Ondate distinte con pausa di respiro tra l'una e l'altra
- [ ] Scritta "ONDATA N" all'inizio di ogni ondata
- [ ] Difficoltà progressiva: numero, velocità e vita dei nemici salgono
- [ ] Curva di difficoltà interamente guidata da `config.js`

### 2.2 Tipi di nemico

- [ ] Nemico normale
- [ ] Nemico veloce e fragile
- [ ] Nemico lento e resistente (serve il lampo di colpito, vedi 2.3)
- [ ] Quali tipi appaiono in quale ondata, deciso da `config.js`

### 2.3 Feedback visivo

- [ ] Lampo bianco sul nemico quando lo colpisci — **necessario** prima di mettere
      nemici che richiedono più di un colpo, altrimenti sembra che il colpo non conti
- [ ] Flash rosso dello schermo quando prendi danno
- [ ] Screen shake (regolabile, disattivabile)
- [ ] Particelle quando un nemico esplode
- [ ] Numeri di danno che salgono

### 2.4 Pulizia della configurazione

- [ ] Rileggere `config.js` da capo: niente numeri nascosti nel codice
- [ ] **(TU)** Provare a cambiare qualche numero da solo e vedere l'effetto

### 2.5 Verifica

- [ ] **(TU)** Prova sul telefono: il gioco è più divertente di prima?
- [ ] **(TU)** Gli FPS reggono anche con particelle e molti nemici?

---

## Milestone 3 — PWA e offline ✅ FATTA

**Fatta prima della Milestone 2, su tua richiesta.**

**Il gioco è online qui:** https://valerio969.github.io/ultimo-cerchio/

- [x] Installare e configurare `vite-plugin-pwa` 1.3.0
- [x] Manifest: "Ultimo Cerchio" / "Cerchio", `standalone`, `portrait`
- [x] Icone 192, 512, 180 (iPhone) e 32 px, generate da un unico
      [`public/icona.svg`](public/icona.svg) con `npm run icone`. L'icona sta
      dentro la zona sicura, quindi Android non la taglia
- [x] Service worker che mette in cache tutto al primo caricamento (9 file)
- [x] Alzato il limite di cache a 4 MB per singolo file: Phaser da solo supera
      il limite di 2 MB predefinito e sarebbe rimasto fuori dalla cache
- [x] Peso totale: 1,2 MB. Il limite iOS è 50 MB
- [x] Messaggio "Aggiungi alla schermata Home" per iPhone, mostrato una volta sola
- [x] Corretta l'impaginazione di quel messaggio: le frasi si spezzavano a metà
- [x] `npm run pubblica` per mandare online una versione nuova con un comando
- [x] Repository pubblico creato e codice caricato
- [x] GitHub Pages attivo dal ramo `gh-pages`, con HTTPS obbligatorio

### Verifiche fatte da Claude

- [x] **PROVA OFFLINE VERA**: server locale spento e pagina ricaricata → il gioco
      parte comunque. Le richieste rispondono `200 OK` con il server morto,
      quindi arrivano dalla cache del service worker
- [x] Service worker attivo sul sito vero, scope `/ultimo-cerchio/`
- [x] Il pacchetto del gioco (1,2 MB) è dentro la cache: senza quello in aereo
      non partirebbe niente
- [x] Tutti i file serviti con il tipo giusto: `sw.js` come `application/javascript`
      (se fosse `text/html` il service worker verrebbe rifiutato dal browser)
- [x] Manifest leggibile online: nome, nome corto, standalone, portrait
- [x] Il gancio di debug NON è presente nella versione pubblicata
- [x] Percorsi delle icone scritti senza barra iniziale, così funzionano anche
      dentro la sottocartella di GitHub Pages

### Verifiche che tocca a te — TOCCA A TE

- [ ] **(TU)** Aprire https://valerio969.github.io/ultimo-cerchio/ da Safari
- [ ] **(TU)** Installarlo sulla Home seguendo il messaggio che compare
- [ ] **(TU)** Verificare che l'icona sulla Home sia quella giusta e dica "Cerchio"
- [ ] **(TU)** Aprirlo dall'icona: **non deve esserci la barra di Safari**
- [ ] **(TU)** Chiudere il gioco, attivare la **modalità aereo**, riaprirlo:
      deve partire e si deve poter giocare
- [ ] **(TU)** Verificare che notch e barra inferiore non coprano niente

---

## Milestone 4 — Grafica e suono

**Solo alla fine. Non si inizia finché la Milestone 3 non funziona in modalità aereo.**

- [ ] Scegliere e scaricare gli asset CC0 da kenney.nl
- [ ] Sostituire il quadrato blu con lo sprite del giocatore
- [ ] Riaccendere `config.giocatore.ruotaVersoIlBersaglio` (ora ha senso)
- [ ] Sostituire i cerchi rossi con gli sprite dei nemici
- [ ] Sostituire i puntini bianchi con lo sprite del proiettile
- [ ] Sfondo dell'arena
- [ ] Effetti sonori: sparo, nemico colpito, danno subito, game over
- [ ] Verificare che il peso totale sia ancora sotto i 50 MB
- [ ] Aggiornare la cache del service worker con i nuovi asset
- [ ] **(TU)** Verifica finale sul telefono, in modalità aereo
