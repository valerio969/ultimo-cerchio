# Ultimo Cerchio — Requisiti

Documento di riferimento del progetto. Se una decisione non è scritta qui, non è
stata presa. Scritto in italiano, in modo leggibile anche da chi non programma.

---

## 1. Che gioco è

Uno sparatutto 2D con vista dall'alto, che gira nel browser e si installa
sull'iPhone come app dalla schermata Home. Funziona completamente offline dopo
il primo caricamento. Nessun account, nessun punteggio online, nessuna pubblicità.

- **Nome completo:** Ultimo Cerchio
- **Nome corto** (quello che appare sotto l'icona sull'iPhone): Cerchio
- **Orientamento:** verticale (portrait)

## 2. Come si gioca

Il giocatore controlla un personaggio in un'arena vista dall'alto. L'arena è grande
esattamente come lo schermo: niente scorrimento, niente telecamera che segue, si vede
sempre tutto.

I nemici entrano da un bordo casuale dello schermo e inseguono il giocatore. Il
giocatore spara da solo, in automatico, al nemico più vicino. Le ondate diventano
sempre più difficili. Quando la barra della vita si svuota, la partita finisce.

## 3. Controlli — questa è una scelta deliberata

**Un dito solo, mira automatica. Niente joystick virtuali, niente pulsante di fuoco.**
Non si valutano alternative a due pollici.

### Sul telefono: trascinamento relativo

1. Appoggi il dito **dove vuoi** sullo schermo, anche lontano dal personaggio.
2. Il gioco memorizza dove hai appoggiato il dito e dove era il personaggio.
3. Mentre muovi il dito, il personaggio si muove **dello stesso spostamento**
   (moltiplicato per una sensibilità regolabile).
4. Quando alzi il dito, il personaggio si ferma.

Il motivo della scelta: con il trascinamento assoluto (il personaggio sotto il dito)
il pollice copre fisicamente il personaggio e non vedi cosa ti sta colpendo. Con il
relativo puoi tenere il dito in un angolo tranquillo dello schermo.

Il personaggio **non si teletrasporta mai**: si muove verso la posizione bersaglio a
una velocità massima definita nella configurazione. Questo serve al bilanciamento — la
velocità del giocatore resta un numero vero che governa la difficoltà.

Il personaggio non può uscire dai bordi dell'arena.

### Sul computer: tastiera

WASD oppure le frecce, come alternativa per provare senza telefono. Non è un
requisito del gioco finito, è uno strumento di sviluppo.

### Mira automatica

A intervalli regolari il giocatore cerca il nemico attivo più vicino. Se è dentro il
raggio di tiro, gli spara. Se non ci sono nemici in raggio, non spara.

## 4. Regole di gioco

- Il giocatore ha **una vita sola**, niente vite extra
- La vita **non si rigenera**
- I nemici fanno danno **al contatto**
- Dopo aver preso danno il giocatore è **invulnerabile per mezzo secondo** e
  lampeggia. Serve a non morire istantaneamente quando sei circondato
- Il punteggio sale **uccidendo nemici**
- Il **record migliore** viene salvato nella memoria del telefono (non su un server)
- La partita finisce quando la vita arriva a zero: schermata di game over con
  punteggio, record e un pulsante grande RICOMINCIA

## 5. Ondate

Ondate **distinte, con pausa**:

1. Compare la scritta "ONDATA N"
2. Arrivano i nemici di quell'ondata
3. Li elimini tutti
4. Un paio di secondi di respiro
5. Ondata successiva, più difficile

Cosa aumenta ondata dopo ondata (numeri nella configurazione): quanti nemici,
quanto sono veloci, quanta vita hanno, quali tipi appaiono.

## 6. Stack tecnico

Da non cambiare senza avvisare e spiegare perché.

| Cosa | Scelta | Perché |
|---|---|---|
| Motore di gioco | **Phaser 3** (non Phaser 4) | Più maturo, più documentazione, meglio conosciuto |
| Fisica | **Arcade Physics** di Phaser | La più leggera, sufficiente per collisioni 2D semplici |
| Build tool | **Vite** | Veloce, leggero, avvio istantaneo |
| Linguaggio | **JavaScript semplice** | Non TypeScript, non React |
| PWA | **vite-plugin-pwa** | Genera manifest e service worker |
| Backend | **nessuno** | Nessun database, nessun login, nessuna chiamata di rete a runtime |

## 7. Vincoli

- Si lavora su un **MacBook Air M3 con 8 GB di RAM**: niente Docker, niente stack
  pesanti, dipendenze al minimo indispensabile
- Deve girare a **60 fps su telefoni di fascia media**, non solo sui top di gamma
- **Object pooling obbligatorio** per proiettili e nemici: si creano in anticipo e si
  riusano, invece di creare e distruggere oggetti in continuazione durante la partita
- Peso totale degli asset **sotto i 50 MB** (limite della Cache API su iOS)

## 8. Requisiti mobile e offline

Non sono extra: sono parte del gioco.

- `manifest.json` completo: nome, nome corto, icone 192 e 512 px, `display: standalone`,
  `orientation: portrait`
- **Service worker** che mette in cache tutti gli asset al primo caricamento: dopo la
  prima apertura il gioco deve funzionare in **modalità aereo**
- **Schermo intero**
- **Bloccati:** scroll della pagina, zoom col pinch, pull-to-refresh, menu contestuale
  al tocco prolungato. Durante il gioco il dito deve muovere solo il personaggio
- **Safe area dell'iPhone** gestite: la barra della vita non finisce sotto il notch,
  i pulsanti non finiscono sotto la barra inferiore
- **Densità di pixel** gestita correttamente: il gioco è nitido su schermi retina, ma
  il fattore di densità è limitato a 2 per non perdere i 60 fps
- **Messaggio al primo avvio su iPhone** che spiega come aggiungere il gioco alla
  schermata Home (su iPhone non c'è il banner automatico di installazione). Mostrato
  una volta sola
- Il **server di sviluppo** deve essere raggiungibile dal telefono sulla stessa rete
  wifi, per provare i controlli veri con le dita

### Nota tecnica sul service worker e l'HTTPS

Il service worker, per motivi di sicurezza del browser, funziona solo su HTTPS oppure
su `localhost`. Aprendo il gioco dal telefono via wifi locale (`http://192.168.x.x`)
il service worker **non si registra**. Quindi:

- Milestone 1 e 2 si provano dal telefono via wifi locale in http: va benissimo,
  serve solo a testare i controlli col dito
- Milestone 3 (offline vero) si verifica caricando il gioco compilato una volta su un
  hosting statico gratuito con HTTPS, installandolo sulla Home dal telefono, e poi
  attivando la modalità aereo. Nessun backend: è solo un file statico servito una
  volta. A partita in corso il gioco non fa nessuna chiamata di rete

## 9. Configurazione — un solo file

Tutti i numeri che governano il gioco stanno in `src/config.js`, ognuno con un
commento che spiega cosa fa e in che unità è. Velocità, danni, vita, frequenza di
fuoco, raggio di tiro, ritmo delle ondate, colori, dimensioni.

L'obiettivo è che si possa cambiare il bilanciamento del gioco senza toccare una
riga di logica.

## 10. Milestone

| # | Titolo | Contenuto |
|---|---|---|
| 1 | Il nucleo giocabile | Solo forme geometriche colorate. Movimento col dito, mira automatica, collisioni, barra vita, punteggio, game over, restart |
| 2 | Il gioco diventa divertente | Ondate progressive, tipi di nemico diversi, feedback visivo, screen shake, particelle, tutto il bilanciamento in `config.js` |
| 3 | PWA e offline | Manifest, service worker, icone, installazione sulla Home, verifica in modalità aereo |
| 4 | Grafica e suono | Sprite veri (asset CC0 da kenney.nl) ed effetti sonori. **Solo alla fine** |

Si lavora **una milestone alla volta**. Non si passa alla successiva finché quella
precedente non è verificata sul telefono vero.

## 11. Fuori perimetro

Cose che questo gioco esplicitamente **non** fa:

- Nessun multiplayer, nessuna classifica online
- Nessun acquisto, nessuna pubblicità
- Nessun salvataggio della partita in corso (solo il record)
- Nessun menu di opzioni complesso
- Nessun controllo a due pollici, nessun joystick virtuale, nessun pulsante di fuoco
- Nessuna modalità orizzontale
