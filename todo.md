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

## Milestone 2 — Il gioco diventa divertente ✅ FATTA

### 2.1 Ondate vere

- [x] Macchina a stati a quattro fasi: **annuncio → ingresso → pulizia → pausa**
- [x] Scritta "ONDATA N" al centro, e "RIPULITA" quando la finisci
- [x] Contatore dell'ondata anche nell'interfaccia, sotto la barra della vita
- [x] Un'ondata finisce solo quando l'ultimo nemico è a terra
- [x] Numero di nemici: 5 la prima, +3 a ogni ondata, fino a 60
- [x] **Verificato**: tempi esatti come da configurazione — annuncio a 0,82s,
      ingresso a 2,32s, ripulita a 7,12s, ondata 2 a 9,12s
- [x] Se il pool è pieno il nemico riprova al giro dopo invece di far restare
      l'ondata bloccata per sempre in attesa di un nemico mai entrato

### 2.2 Tipi di nemico

- [x] **normale** (rosso): 42 di stazza, 1 colpo, 10 punti — dall'ondata 1
- [x] **veloce** (arancione): piccolo e quasi il doppio veloce, 1 colpo, 15 punti
      — dall'ondata 3
- [x] **corazzato** (viola): grosso e lento, **4 colpi**, fa male, 40 punti
      — dall'ondata 5
- [x] Un solo pool per tutti i tipi: il nemico cambia immagine e stazza quando
      viene acceso, invece di tenere tre pool di cui due quasi sempre inutilizzati
- [x] Quali tipi e con che frequenza, deciso da `config.ondate.composizione`
- [x] **Verificato**: il corazzato muore in esattamente 4 colpi, il riquadro di
      collisione si aggiorna col tipo (50 px su un'immagine di 63)

### 2.3 Feedback visivo

- [x] Lampo bianco sul nemico colpito — e **solo se sopravvive**: lampeggiare un
      nemico che sta morendo non comunica niente
- [x] Flash rosso su tutto lo schermo quando prendi danno
- [x] Screen shake: minimo sulle uccisioni, forte quando prendi danno
- [x] Particelle: un emettitore per tipo, già del colore giusto. Uno solo
      "contagerebbe" il colore alle schegge già in volo delle altre esplosioni
- [x] Numeri di danno, che salgono e svaniscono
- [x] **Verificato**: 9 schegge del colore giusto, scossa e flash rosso attivi
- [x] Tutto si può spegnere singolarmente da `config.feedback`

### 2.4 Le scelte prese per non fare rumore inutile

- [x] I numeri di danno compaiono **solo sui nemici che sopravvivono al colpo**.
      Su chi muore con un colpo sarebbero rumore: vedi già che sparisce. Sui
      corazzati invece servono, perché dicono che stai facendo progressi
- [x] La vita dei nemici cresce **solo dall'ondata 6 in poi**. Se crescesse
      dall'ondata 2, un nemico normale passerebbe da "muore con un colpo" a "ne
      servono due" senza preavviso, e il gioco sembrerebbe rotto
- [x] La velocità invece cresce da subito: non cambia quanti colpi servono,
      quindi si può alzare senza confondere

### 2.5 Niente allocazioni durante la partita

- [x] Numeri di danno: 24 scritte pre-create, mosse e sfumate a mano nel ciclo di
      gioco. Le animazioni automatiche di Phaser creerebbero un oggetto per colpo
- [x] Lampo del nemico: gestito con una scadenza numerica, senza timer
- [x] Flash e scossa: effetti della telecamera di Phaser, non creano oggetti
- [x] Particelle: emettitori creati all'avvio, con il loro pool interno

### 2.6 Prestazioni e bilanciamento — misurati

- [x] **60 fps medi su 18 secondi con 140 nemici contemporaneamente a schermo**
      più particelle. Misura reale, non stima
- [x] **Durata di una partita stando completamente fermi: 69 secondi**, ondata 6,
      895 punti (in Milestone 1 erano 39 secondi). Muovendosi si dura di più
- [x] Progressione delle ondate: 1s, 9s, 18s, 28s, 40s, 55s
- [x] Chi ti uccide si legge chiaramente: il corazzato viola, che regge quattro
      colpi e ti arriva addosso

### 2.7 Correzioni fatte durante il lavoro

- [x] `createMultiple` senza il parametro `key` non creava **niente**: il pool dei
      nemici restava vuoto e non arrivava mai nessuno, senza nessun errore
- [x] `create()` ora chiude una eventuale schermata di game over rimasta aperta:
      senza, una partita nuova partirebbe col velo scuro incollato sopra

### 2.8 Verifica sul telefono ✅ FATTA DA TE

- [x] Il gioco funziona e va tutto bene — confermato da te
- [x] **Lo screen shake dava fastidio → SPENTO** (`feedback.screenShake.attivo: false`)
      Il danno resta leggibile: lo schermo lampeggia di rosso e il personaggio
      lampeggia per mezzo secondo. I valori restano tarati in `config.js`, pronti
      se un giorno vorrai riprovarlo
- [ ] **(TU, quando ti va)** Provare a cambiare qualche numero in `config.js`

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

### Verifiche fatte da te ✅ CONFERMATE

- [x] Aperto da Safari e installato sulla schermata Home
- [x] **FUNZIONA IN MODALITÀ AEREO** — confermato da te sul telefono vero
- [x] Icona, nome, schermo intero, notch: tutto a posto

---

## Milestone 4 — Grafica e suono ✅ FATTA

Tema scelto: **astronavi**.

### 4.1 Gli asset

- [x] Scaricati due pacchetti di Kenney, entrambi **licenza CC0** (uso libero,
      anche commerciale, nessun obbligo di citare nessuno):
      **Simple Space** (navi) e **Sci-Fi Sounds** (effetti)
- [x] Tenuti solo i 9 disegni che servono davvero (36 KB in tutto), il resto buttato
- [x] Le navi di Kenney sono **bianche di proposito**: il gioco le colora al volo
      con i colori di `config.colori`. Così lo stesso disegno fa da nemico rosso,
      arancione o viola, e cambiando un colore cambia tutto senza rifare file

### 4.2 La grafica

- [x] Giocatore: `ship_G`, colorato di blu
- [x] Nemico normale: `enemy_A` rosso · veloce: `enemy_B` arancione ·
      corazzato: `enemy_E` viola. Tre sagome ben diverse, riconoscibili a occhio
- [x] Colpo: `star_small` bianco
- [x] Sfondo: **campo di 130 stelle** più 6 sassi scuri, al posto della griglia.
      Sono oggetti immobili creati una volta: nessun aggiornamento, costo quasi zero
- [x] **Riaccesa la rotazione verso il bersaglio**: ora ha senso, perché una nave
      ha una punta (un quadrato no, era solo un rombo). La nave gira in modo
      morbido, i nemici puntano dritto
- [x] Il colpo parte dalla **punta** della nave, non dal centro
- [x] Riquadri di collisione rimpiccioliti (55% per la nave, 62% per i nemici):
      una nave è un triangolo dentro un quadrato, e gli angoli vuoti non devono
      contare come parte della nave

### 4.3 Il suono

- [x] Cinque effetti: sparo, esplosione, danno subito, inizio ondata, game over
- [x] **Convertiti da OGG a WAV**, perché iPhone non legge gli OGG. Fatto con
      ffmpeg, che era già installato sul Mac
- [x] Scelti i file più CORTI a disposizione: lo sparo è 0,24 secondi, perché
      parte quattro volte al secondo
- [x] Volume dello sparo tenuto molto basso (0,14): è quello che senti più spesso
- [x] **Intonazione spostata a caso a ogni colpo**: è quello che evita l'effetto
      trapano quando lo stesso suono si ripete quattro volte al secondo
- [x] **Corsie multiple per effetto** (4 per lo sparo, 5 per le esplosioni): un
      suono nuovo prende la corsia successiva invece di tagliare quello di prima.
      Con dieci nemici che esplodono insieme si sente un boato, non un solo tonfo
- [x] Nessun oggetto creato durante la partita: le corsie sono pre-create
- [x] Gestito lo sblocco audio di iPhone, che non lascia suonare niente prima che
      tu abbia toccato lo schermo

### 4.4 Verifiche fatte da Claude

- [x] Tutti i disegni e i suoni si caricano, con barra di caricamento
- [x] Colori applicati correttamente a ogni tipo di nemico
- [x] Il lampo bianco del colpo torna al colore del tipo, non al bianco
- [x] La nave si gira verso il nemico (verificato: 0 gradi con nemico sopra)
- [x] Corazzato: sempre 4 colpi esatti
- [x] I 5 suoni partono, coi volumi giusti verificati sul guadagno audio vero
- [x] 4 spari di fila = 4 suoni contemporanei, con 4 intonazioni diverse
- [x] **Bilanciamento intatto**: 67 secondi stando fermi, ondata 6 (era 69)
- [x] **0,48 ms per fotogramma con 140 navi a schermo**: 34 volte sotto il limite
- [x] Peso totale: **1,7 MB**, cioè 29 volte sotto il limite iOS di 50 MB

### 4.5 Il bug che avrebbe rotto l'offline

- [x] I suoni `.wav` **non venivano messi in cache**: l'elenco delle estensioni
      da salvare non includeva "wav". Il gioco in modalità aereo sarebbe partito
      **muto**, senza nessun errore a spiegare perché. Corretto, e verificato:
      con il server spento tutti i file arrivano dalla cache e l'audio si
      decodifica davvero

### 4.6 Verifica finale — TOCCA A TE

- [ ] **(TU)** Aprire il gioco e guardare come è venuto
- [ ] **(TU)** Il volume dello sparo è giusto? (`config.audio.sparo.volume`)
- [ ] **(TU)** Il volume generale è giusto? (`config.audio.volumeGenerale`,
      oppure `attivo: false` per spegnere tutto)
- [ ] **(TU)** Le stelle si vedono bene? (`config.grafica.luminositaSfondo`)
- [ ] **(TU)** Modalità aereo: il gioco parte **e si sente**?
