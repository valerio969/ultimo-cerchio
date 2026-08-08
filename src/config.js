/**
 * ============================================================================
 * ULTIMO CERCHIO — CONFIGURAZIONE
 * ============================================================================
 *
 * Questo è il file dei numeri. Tutto quello che governa come si sente il gioco
 * sta qui dentro. Puoi cambiare qualsiasi valore, salvare, e vedere l'effetto
 * subito nel browser senza ricaricare la pagina.
 *
 * NON serve capire il resto del codice per modificare questo file.
 *
 * ----------------------------------------------------------------------------
 * COME LEGGERE LE UNITÀ DI MISURA
 * ----------------------------------------------------------------------------
 * Le dimensioni e le velocità NON sono in pixel, sono in "unità di gioco".
 * Il gioco è disegnato su uno schermo immaginario larghezza 720 unità, e poi si
 * adatta da solo a qualsiasi telefono. Vantaggio: se raddoppi un numero, quella
 * cosa raddoppia su TUTTI i telefoni, dal più piccolo al più grande.
 *
 * Per farti un'idea concreta:
 *   - 720 unità   = tutta la larghezza dello schermo
 *   - 36 unità    = un ventesimo della larghezza, un quadratino
 *   - 360 unità   = mezzo schermo
 *   - velocità 720 = attraversa lo schermo in orizzontale in un secondo
 *   - i TEMPI sono in millisecondi (1000 = un secondo)
 *   - i COLORI si scrivono 0x seguito da sei cifre, come nel web:
 *     #4488ff diventa 0x4488ff
 *
 * ----------------------------------------------------------------------------
 * SE VUOI SMANETTARE, PARTI DA QUI
 * ----------------------------------------------------------------------------
 *   giocatore.velocita               → quanto sei agile
 *   arma.intervalloSparo             → più BASSO = spari più veloce
 *   ondate.nemiciPrimaOndata         → quanto è dura la partenza
 *   ondate.nemiciInPiuPerOndata      → quanto rapidamente si fa dura
 *   tipiNemico.<tipo>.velocita       → quanto ti stanno addosso
 *   feedback.screenShake.attivo      → se lo schermo trema quando colpisci
 */

export const CONFIG = {

  // ==========================================================================
  // MONDO — le fondamenta, meglio non toccare
  // ==========================================================================
  mondo: {
    // Lo schermo immaginario su cui è disegnato il gioco (vedi spiegazione sopra).
    // Se lo abbassi, tutto diventa più grande; se lo alzi, tutto diventa più piccolo.
    larghezzaRiferimento: 720,
  },

  // ==========================================================================
  // COLORI
  // ==========================================================================
  colori: {
    sfondo: 0x0a0a12,          // nero-blu molto scuro
    griglia: 0x1b1b33,         // le linee della griglia dell'arena
    giocatore: 0x4d9fff,       // il quadrato blu
    proiettile: 0xffffff,      // i puntini bianchi
    vita: 0x4dffa0,            // barra della vita piena
    vitaBassa: 0xff4d5e,       // barra della vita quasi vuota
    vitaSfondo: 0x24243a,      // la parte vuota della barra della vita
    testo: 0xe8e8f0,           // il colore del punteggio e delle scritte
    testoSpento: 0x6a6a8a,     // scritte secondarie
    annuncioOndata: 0xffd54d,  // la scritta "ONDATA 3"
    pericolo: 0xff4d5e,        // la scritta "ELIMINATO" del game over
    stella: 0x8f8fc4,          // le stelline dello sfondo
    meteora: 0x24243d,         // i sassi scuri dello sfondo
  },

  // ==========================================================================
  // SPRITE — quali disegni usa il gioco
  //
  // Sono asset di Kenney (kenney.nl), licenza CC0: si possono usare liberamente,
  // anche commercialmente, senza obbligo di citare nessuno.
  //
  // Sono tutti BIANCHI di proposito: il gioco li colora al volo con i colori qui
  // sopra. Così lo stesso disegno può fare da nemico rosso, arancione o viola, e
  // se cambi un colore cambia tutto senza rifare nessun file.
  //
  // I file stanno in public/sprite/. Per cambiare una nave basta scrivere qui il
  // nome di un altro file, senza il ".png".
  // ==========================================================================
  sprite: {
    giocatore: 'ship_G',
    proiettile: 'star_small',
    stellaSfondo: 'star_tiny',
    meteore: ['meteor_large', 'meteor_small', 'meteor_detailedSmall'],
  },

  // ==========================================================================
  // AUDIO
  //
  // Suoni di Kenney (kenney.nl), licenza CC0. Convertiti in WAV perché iPhone
  // non legge gli OGG originali.
  //
  // "variazioneTono" è la cosa che fa la differenza fra un gioco e un trapano:
  // ogni colpo viene suonato con l'intonazione spostata a caso di un pizzico, così
  // quattro spari al secondo non suonano tutti identici. È misurata in centesimi
  // di semitono: 200 vale un tono intero in su o in giù.
  // ==========================================================================
  audio: {
    attivo: true,
    volumeGenerale: 0.8,       // da 0 (muto) a 1

    // Lo sparo è quello che senti più spesso: tenuto basso di proposito.
    // Se lo alzi troppo dopo trenta secondi vuoi spegnere il telefono.
    sparo: { volume: 0.14, variazioneTono: 240, quantiInsieme: 4 },
    esplosione: { volume: 0.32, variazioneTono: 200, quantiInsieme: 5 },
    danno: { volume: 0.55, variazioneTono: 120, quantiInsieme: 2 },
    ondata: { volume: 0.3, variazioneTono: 0, quantiInsieme: 1 },
    gameover: { volume: 0.6, variazioneTono: 0, quantiInsieme: 1 },
  },

  // ==========================================================================
  // GIOCATORE — la tua navicella
  // ==========================================================================
  giocatore: {
    dimensione: 52,            // quanto è grande la navicella
    velocita: 430,             // velocità MASSIMA di movimento
    vitaMassima: 100,          // la barra della vita parte da qui

    // Il riquadro delle collisioni, come frazione del disegno.
    // Una navicella è un triangolo: se il riquadro fosse pieno, gli angoli vuoti
    // in alto conterebbero come parte della nave e ti sembrerebbe di essere
    // colpito dal nulla. 0.55 tiene solo il corpo centrale.
    riquadroCollisione: 0.55,

    // Quanto velocemente la nave si gira verso il bersaglio (radianti per
    // fotogramma). Più basso = gira più morbida e pigra, più alto = scatta.
    velocitaRotazione: 0.32,

    // Dopo aver preso un colpo sei invulnerabile per questo tempo e lampeggi.
    // Serve a non morire in un istante quando sei circondato.
    // Se lo metti a 0, i nemici ti prosciugano la vita in una frazione di secondo.
    invulnerabilitaDopoDanno: 600,
    lampeggioIntervallo: 70,   // ogni quanto lampeggia mentre è invulnerabile

    // La nave si gira verso il nemico che sta bersagliando.
    // Ora è ACCESO. Ai tempi delle forme geometriche era spento, perché un
    // quadrato è simmetrico e girandolo non si capiva dove puntasse: diventava
    // solo un rombo. Una navicella invece ha una punta, quindi girarla dice
    // esattamente chi stai bersagliando.
    ruotaVersoIlBersaglio: true,
  },

  // ==========================================================================
  // CONTROLLI
  // ==========================================================================
  controlli: {
    // Quanto si muove il personaggio rispetto a quanto muovi il dito.
    //   1.0 = il personaggio si muove esattamente come il dito
    //   1.5 = si muove una volta e mezza (arrivi negli angoli con meno fatica)
    //   0.7 = si muove meno del dito (più preciso, più lento)
    sensibilitaDito: 1.4,

    // Quanto vicino al bersaglio deve essere il personaggio per considerarsi
    // "arrivato" e fermarsi. Serve a non tremolare fermo sul posto.
    zonaMorta: 3,

    velocitaTastiera: 430,     // velocità con WASD e frecce (per provare sul Mac)
  },

  // ==========================================================================
  // ARMA — sparo automatico
  // ==========================================================================
  arma: {
    intervalloSparo: 260,      // ogni quanto parte un colpo. PIÙ BASSO = più veloce
    danno: 100,                // quanta vita toglie un colpo
    raggioTiro: 470,           // oltre questa distanza il nemico non viene bersagliato
    velocitaProiettile: 950,   // quanto vola veloce il colpo
    dimensioneProiettile: 27,  // il colpo è una stellina: sotto i 24 non si legge

    // Quanti proiettili vengono preparati in anticipo all'avvio (object pooling).
    // Non vengono mai creati o distrutti durante la partita: si riusano.
    proiettiliInPool: 200,
  },

  // ==========================================================================
  // TIPI DI NEMICO
  //
  // Ogni tipo ha il suo colore, la sua stazza e il suo carattere. Puoi
  // aggiungerne di nuovi: basta aggiungere una voce qui e citarla in
  // composizioneOndate più sotto. Il resto del codice si adatta da solo.
  //
  // REGOLA D'ORO PER LA VITA: l'arma fa 100 di danno per colpo (arma.danno).
  // Quindi vita 100 = muore con un colpo, vita 300 = ne serve tre.
  // Tieni i numeri multipli di 100 e saprai sempre quanti colpi servono.
  // ==========================================================================
  tipiNemico: {
    normale: {
      etichetta: 'normale',
      sprite: 'enemy_A',       // il tridente con due sfere ai piedi
      colore: 0xff4d5e,        // rosso
      dimensione: 48,
      velocita: 150,
      vita: 100,               // un colpo
      danno: 14,               // quanta vita ti toglie al contatto
      punti: 10,
    },

    veloce: {
      etichetta: 'veloce',
      sprite: 'enemy_B',       // affilato e appuntito: si vede che corre
      colore: 0xffa64d,        // arancione: si distingue a colpo d'occhio dal rosso
      dimensione: 38,          // più piccolo, quindi più difficile da colpire
      velocita: 275,           // quasi il doppio del normale: ti raggiunge
      vita: 100,               // un colpo: fragile, ma va preso
      danno: 10,
      punti: 15,
    },

    corazzato: {
      etichetta: 'corazzato',
      sprite: 'enemy_E',       // massiccio, quattro sfere: si vede che è duro
      colore: 0xb44dff,        // viola
      dimensione: 72,          // grosso e ben visibile
      velocita: 92,            // lento: hai il tempo di scappare, non di ignorarlo
      vita: 400,               // QUATTRO colpi
      danno: 24,               // se ti prende, fa male
      punti: 40,
    },
  },

  // ==========================================================================
  // NEMICI — impostazioni comuni a tutti i tipi
  // ==========================================================================
  nemici: {
    nemiciInPool: 140,         // quanti nemici vengono preparati in anticipo
    margineIngresso: 40,       // quanto fuori dal bordo appaiono, per entrare in scena

    // Il riquadro delle collisioni, come frazione del disegno. Le navi nemiche
    // hanno bracci e punte che lasciano molto vuoto negli angoli dell'immagine:
    // 0.62 tiene il corpo e ignora il vuoto, così non vieni colpito dall'aria.
    riquadroCollisione: 0.62,
  },

  // ==========================================================================
  // ONDATE
  //
  // Il ritmo della partita: compare la scritta "ONDATA N", arrivano i nemici,
  // li elimini tutti, respiri un attimo, e si ricomincia più difficile.
  // ==========================================================================
  ondate: {
    ritardoPrimaOndata: 900,   // quanto respiri prima che cominci tutto
    durataAnnuncio: 1500,      // quanto resta a schermo la scritta "ONDATA N"
    pausaTraOndate: 2000,      // il respiro dopo aver ripulito un'ondata
    intervalloTraNemici: 430,  // ogni quanto entra un nemico DENTRO un'ondata

    // --- Quanti nemici per ondata ---
    nemiciPrimaOndata: 5,
    nemiciInPiuPerOndata: 3,   // ondata 1 = 5, ondata 2 = 8, ondata 3 = 11...
    nemiciMassimiPerOndata: 60,

    // --- Quanto si rinforzano i nemici ondata dopo ondata ---
    // Velocità: cresce da subito, poco per volta. Non cambia quanti colpi
    // servono per uccidere, quindi si può alzare senza confondere.
    velocitaInPiuPerOndata: 0.035,   // +3,5% a ondata

    // Vita: cresce SOLO dall'ondata indicata in poi, e questo è voluto.
    // Se la vita crescesse dall'ondata 2, un nemico normale passerebbe da
    // "muore con un colpo" a "ne servono due" senza preavviso, e il gioco
    // sembrerebbe rotto. Meglio un salto di difficoltà dichiarato, più tardi.
    vitaCresceDaOndata: 6,
    vitaInPiuPerOndata: 0.12,        // +12% a ondata, a partire da quella sopra

    // Nessun rinforzo va oltre questo: serve a non arrivare a nemici
    // matematicamente inuccidibili.
    rinforzoMassimo: 3.0,

    // --- Quali tipi compaiono, e quando ---
    // "daOndata" = la prima ondata in cui quel tipo può comparire.
    // "peso" = quanto è probabile rispetto agli altri disponibili. Con normale
    // a 10 e veloce a 6, su 16 nemici circa 10 sono normali e 6 veloci.
    composizione: [
      { tipo: 'normale', daOndata: 1, peso: 10 },
      { tipo: 'veloce', daOndata: 3, peso: 7 },
      { tipo: 'corazzato', daOndata: 5, peso: 3 },
    ],
  },

  // ==========================================================================
  // FEEDBACK — quello che rende il gioco "succoso"
  //
  // Niente di qui dentro cambia le regole: cambia solo quanto senti i colpi.
  // Se qualcosa ti dà fastidio o ti fa girare la testa, puoi spegnerlo
  // singolarmente senza toccare nient'altro.
  // ==========================================================================
  feedback: {
    // --- Il nemico lampeggia di bianco quando lo colpisci ---
    // Questo NON è un fronzolo: senza, un nemico che richiede quattro colpi
    // sembra semplicemente non reagire, e pensi che l'arma sia rotta.
    lampoNemico: {
      attivo: true,
      durata: 80,
    },

    // --- Lo schermo lampeggia di rosso quando prendi danno ---
    flashDanno: {
      attivo: true,
      durata: 220,
      colore: { r: 255, g: 60, b: 80 },
    },

    // --- Lo schermo trema ---
    // SPENTO su tua richiesta: il sobbalzo dello schermo dava fastidio.
    // Il danno subito resta comunque leggibilissimo, perché lo schermo lampeggia
    // di rosso e il personaggio si mette a lampeggiare.
    // Se un giorno vuoi riprovarlo, rimetti true qui sotto. I due valori di
    // intensità sono già tarati: 0.0022 sulle uccisioni è quasi impercettibile,
    // 0.012 sul danno è un sobbalzo netto. Puoi anche riaccenderlo e abbassare
    // solo dannoIntensita, per esempio a 0.005, per averne un accenno.
    screenShake: {
      attivo: false,
      // Quando uccidi un nemico: una scossa minima, quasi subliminale.
      // Se la alzi troppo, con dieci nemici che muoiono insieme lo schermo
      // diventa illeggibile.
      uccisioneDurata: 60,
      uccisioneIntensita: 0.0022,
      // Quando prendi danno: più forte, deve farti sobbalzare.
      dannoDurata: 190,
      dannoIntensita: 0.012,
    },

    // --- Particelle quando un nemico esplode ---
    particelle: {
      attive: true,
      quantita: 9,             // quante schegge per nemico
      velocitaMinima: 90,
      velocitaMassima: 340,
      durata: 460,
      dimensione: 8,
    },

    // --- I numeri di danno che salgono ---
    // Compaiono SOLO sui nemici che sopravvivono al colpo. Sui nemici che
    // muoiono con un colpo solo sarebbero rumore inutile: vedi già che spariscono.
    // Sui corazzati invece servono, perché ti dicono che stai facendo progressi.
    numeriDanno: {
      attivi: true,
      dimensione: 26,
      salita: 90,              // di quanto sale il numero mentre svanisce
      durata: 620,
      quantiInPool: 24,
    },
  },

  // ==========================================================================
  // INTERFACCIA A SCHERMO
  // ==========================================================================
  hud: {
    margine: 34,               // distanza dai bordi (in più rispetto al notch)
    altezzaBarraVita: 18,
    larghezzaBarraVita: 260,   // larghezza della barra della vita
    dimensioneTestoPunteggio: 42,
    dimensioneTestoPiccolo: 20,
    dimensioneAnnuncioOndata: 54,
    dimensioneContatoreOndata: 20,
  },

  // ==========================================================================
  // SCHERMATA DI GAME OVER
  // ==========================================================================
  gameOver: {
    dimensioneTitolo: 56,
    dimensionePunteggio: 88,
    dimensioneTestoPulsante: 28,
    larghezzaPulsante: 310,
    altezzaPulsante: 96,       // alto e comodo: si tocca col pollice senza mirare
  },

  // ==========================================================================
  // GRAFICA E PRESTAZIONI
  // ==========================================================================
  grafica: {
    // Gli schermi dei telefoni hanno più pixel veri di quelli che dichiarano.
    // Seguire quel numero alla lettera rende il gioco nitido ma pesante: su un
    // iPhone a 3x significa disegnare 9 volte più pixel. Con 2 il gioco è nitido
    // e resta a 60 fps. Se il tuo telefono fa fatica, prova a metterlo a 1.5 o 1.
    densitaPixelMassima: 2,

    // --- Lo sfondo ---
    // Adesso che siamo nello spazio, la griglia è sostituita da un campo di
    // stelle. Serve alla stessa cosa: su un nero uniforme non capiresti se ti
    // stai muovendo. Se preferisci la griglia, rimetti true qui sotto.
    disegnaGriglia: false,
    dimensioneCellaGriglia: 72,

    stelleSfondo: 130,         // quante stelline. Sono immobili: non costano nulla
    stellaMinima: 4,           // la stella più piccola
    stellaMassima: 13,         // la più grande
    meteoreSfondo: 6,          // qualche sasso scuro, per dare profondità
    // Quanto si vedono le stelle. 0 = sfondo nero vuoto.
    // Attenzione ad abbassarlo troppo: se le stelle non si vedono, mentre ti
    // muovi non hai nessun riferimento e sembra di stare fermo.
    luminositaSfondo: 0.9,
  },

  // ==========================================================================
  // STRUMENTI DI SVILUPPO — da spegnere quando il gioco è finito
  // ==========================================================================
  debug: {
    mostraFps: true,           // il contatore in basso: deve stare intorno a 60
    mostraCorpiFisici: false,  // disegna i riquadri delle collisioni
  },
};
