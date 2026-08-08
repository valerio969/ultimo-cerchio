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
 *   giocatore.velocita          → quanto sei agile
 *   arma.intervalloSparo        → più BASSO = spari più veloce
 *   nemici.velocita             → quanto ti stanno addosso
 *   ondate.intervalloComparsa   → più BASSO = arrivano più spesso
 *   ondate.quantoAumenta        → più ALTO = la partita si fa dura più in fretta
 *
 * I numeri qui sotto sono un punto di partenza, non un vangelo. Una partita
 * dovrebbe durare intorno al minuto: se muori troppo presto alza
 * ondate.intervalloComparsa, se non muori mai abbassalo.
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
    nemico: 0xff4d5e,          // i cerchi rossi
    proiettile: 0xffffff,      // i puntini bianchi
    vita: 0x4dffa0,            // barra della vita piena
    vitaBassa: 0xff4d5e,       // barra della vita quasi vuota
    vitaSfondo: 0x24243a,      // la parte vuota della barra della vita
    testo: 0xe8e8f0,           // il colore del punteggio e delle scritte
    testoSpento: 0x6a6a8a,     // scritte secondarie
  },

  // ==========================================================================
  // GIOCATORE — il quadrato blu
  // ==========================================================================
  giocatore: {
    dimensione: 46,            // quanto è grande il lato del quadrato
    velocita: 430,             // velocità MASSIMA di movimento
    vitaMassima: 100,          // la barra della vita parte da qui

    // Dopo aver preso un colpo sei invulnerabile per questo tempo e lampeggi.
    // Serve a non morire in un istante quando sei circondato.
    // Se lo metti a 0, i nemici ti prosciugano la vita in una frazione di secondo.
    invulnerabilitaDopoDanno: 600,
    lampeggioIntervallo: 70,   // ogni quanto lampeggia mentre è invulnerabile

    // Se il personaggio si gira verso il nemico che sta bersagliando.
    // Lo lascio SPENTO, e ti spiego perché: un quadrato è simmetrico, quindi
    // girandolo non capisci dove sta puntando — diventa solo un rombo, senza
    // aggiungere informazione. La direzione la leggi già dai proiettili che partono.
    // In Milestone 4, quando ci sarà uno sprite vero con un davanti e un dietro,
    // questa riga diventerà utile: metti true e il personaggio guarderà il nemico.
    ruotaVersoIlBersaglio: false,
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
    danno: 100,                // con nemici.vita a 100, un colpo uccide
    raggioTiro: 470,           // oltre questa distanza il nemico non viene bersagliato
    velocitaProiettile: 950,   // quanto vola veloce il puntino bianco
    dimensioneProiettile: 12,

    // Quanti proiettili vengono preparati in anticipo all'avvio (object pooling).
    // Non vengono mai creati o distrutti durante la partita: si riusano.
    // Se lo alzi troppo consumi memoria per niente; se è troppo basso, con tanti
    // nemici a schermo qualche colpo non parte.
    proiettiliInPool: 200,
  },

  // ==========================================================================
  // NEMICI — i cerchi rossi
  // ==========================================================================
  nemici: {
    dimensione: 42,
    velocita: 150,             // quanto ti inseguono veloci
    vita: 100,                 // con arma.danno a 100, muoiono con un colpo
    danno: 14,                 // quanta vita ti togliono quando ti toccano
    punti: 10,                 // punteggio per ogni nemico eliminato

    nemiciInPool: 120,         // quanti nemici vengono preparati in anticipo
    margineIngresso: 40,       // quanto fuori dal bordo appaiono, per entrare in scena
  },

  // ==========================================================================
  // ONDATE — il ritmo con cui arrivano i nemici
  //
  // NOTA: in Milestone 1 questa è la versione semplice, un nemico ogni tanto,
  // con la frequenza che sale piano piano. Le ondate vere con la scritta
  // "ONDATA 3" e la pausa di respiro arrivano in Milestone 2.
  //
  // IMPORTANTE PER IL BILANCIAMENTO: spari circa 4 volte al secondo e ogni colpo
  // uccide. Quindi finché i nemici arrivano meno di 4 volte al secondo, li tieni
  // a bada senza fatica. Il gioco diventa pericoloso quando l'intervallo scende
  // sotto i 250 millisecondi, e ci arriva in poco più di mezzo minuto.
  // ==========================================================================
  ondate: {
    ritardoInizio: 900,        // quanto respiri prima che arrivi il primo nemico
    intervalloComparsa: 620,   // ogni quanto appare un nemico. PIÙ BASSO = più duro

    // Ogni tot tempo la frequenza aumenta, così la partita si fa sempre più dura
    // e prima o poi finisce, invece di andare avanti all'infinito.
    ogniQuantoAumenta: 3500,   // ogni 3,5 secondi il gioco si fa più cattivo
    quantoAumenta: 55,         // di quanti millisecondi si accorcia l'attesa
    intervalloMinimo: 150,     // il ritmo non scende sotto questo, o è impossibile
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

    disegnaGriglia: true,      // la griglia di sfondo, aiuta a percepire il movimento
    dimensioneCellaGriglia: 72,
  },

  // ==========================================================================
  // STRUMENTI DI SVILUPPO — da spegnere quando il gioco è finito
  // ==========================================================================
  debug: {
    mostraFps: true,           // il contatore in basso: deve stare intorno a 60
    mostraCorpiFisici: false,  // disegna i riquadri delle collisioni
  },
};
