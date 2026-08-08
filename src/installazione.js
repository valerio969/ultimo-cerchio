/**
 * IL MESSAGGIO "AGGIUNGI ALLA SCHERMATA HOME" PER IPHONE
 *
 * Su Android il browser mostra da solo un banner che propone di installare il
 * gioco. Su iPhone quel banner NON esiste: Apple non l'ha mai fatto. L'unico
 * modo di installare una PWA su iPhone è che l'utente lo faccia a mano dal
 * pulsante Condividi, e se nessuno gliel'ha spiegato non lo scoprirà mai.
 *
 * Quindi questo file mostra una spiegazione, una volta sola, solo su iPhone, e
 * solo se il gioco non è già stato installato.
 *
 * È scritto con normali elementi della pagina, non con Phaser: deve poter
 * comparire anche se il gioco non è ancora partito.
 */

const CHIAVE_GIA_VISTO = 'ultimoCerchio.messaggioInstallazioneVisto';

/** Vero se stiamo girando su un iPhone o un iPad. */
function eApple() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return true;

  // Gli iPad recenti mentono e si dichiarano "Macintosh". Li riconosciamo dal
  // fatto che un Mac vero non ha uno schermo che risponde a più dita.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

/** Vero se il gioco è già stato aggiunto alla Home e aperto da lì. */
function eGiaInstallato() {
  // navigator.standalone è la versione di Apple, display-mode è quella standard.
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

function giaVisto() {
  try {
    return window.localStorage.getItem(CHIAVE_GIA_VISTO) === 'si';
  } catch {
    // In navigazione privata la memoria può essere bloccata: pazienza, il
    // messaggio ricomparirà. Meglio questo che un errore.
    return false;
  }
}

function segnaComeVisto() {
  try {
    window.localStorage.setItem(CHIAVE_GIA_VISTO, 'si');
  } catch {
    /* niente da fare, non è un problema */
  }
}

/**
 * Mostra il messaggio, se serve. Se non siamo su iPhone, o il gioco è già
 * installato, o l'hai già chiuso una volta, non fa niente.
 */
export function mostraMessaggioInstallazione() {
  if (!eApple() || eGiaInstallato() || giaVisto()) return;

  const foglio = document.createElement('div');
  foglio.id = 'messaggio-installazione';

  // L'icona Condividi di iOS, ridisegnata: un quadrato con una freccia che esce.
  // La disegniamo invece di scriverla a parole, così la riconosci a occhio nella
  // barra di Safari senza doverla cercare.
  const iconaCondividi = `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
         stroke="#4d9fff" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 15V3"/>
      <path d="M8 7l4-4 4 4"/>
      <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
    </svg>`;

  foglio.innerHTML = `
    <div class="mi-riquadro">
      <p class="mi-titolo">Mettilo nella schermata Home</p>
      <p class="mi-testo">
        Così ci giochi a schermo intero e anche <strong>senza internet</strong>.
      </p>
      <ol class="mi-passi">
        <li><span class="mi-icona">${iconaCondividi}</span> Tocca Condividi, in basso nella barra di Safari</li>
        <li><span class="mi-numero">2</span> Scorri e tocca <strong>Aggiungi alla schermata Home</strong></li>
        <li><span class="mi-numero">3</span> Tocca <strong>Aggiungi</strong> in alto a destra</li>
      </ol>
      <button type="button" class="mi-chiudi">Ho capito</button>
    </div>`;

  const stile = document.createElement('style');
  stile.textContent = `
    #messaggio-installazione {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      background: rgba(6, 6, 12, 0.72);
      -webkit-backdrop-filter: blur(3px);
      backdrop-filter: blur(3px);
      /* Il foglio entra dal basso, dove sta il pollice */
      animation: mi-entra 0.28s ease-out;
    }
    @keyframes mi-entra { from { opacity: 0 } to { opacity: 1 } }

    #messaggio-installazione .mi-riquadro {
      width: 100%;
      max-width: 420px;
      background: #14142a;
      border-top: 1px solid #2a2a4a;
      border-radius: 20px 20px 0 0;
      padding: 26px 24px 22px;
      /* Rispetta la barra inferiore dell'iPhone, altrimenti il pulsante finisce
         sotto la tacca di chiusura app e diventa difficile da toccare. */
      padding-bottom: calc(22px + env(safe-area-inset-bottom, 0px));
      color: #e8e8f0;
    }

    #messaggio-installazione .mi-titolo {
      font-size: 19px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    #messaggio-installazione .mi-testo {
      font-size: 14px;
      line-height: 1.45;
      color: #9a9ab8;
      margin-bottom: 18px;
    }
    #messaggio-installazione .mi-passi {
      list-style: none;
      margin: 0 0 20px;
      padding: 0;
      font-size: 14px;
      line-height: 1.4;
    }
    #messaggio-installazione .mi-passi li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 0;
      border-bottom: 1px solid #21213c;
    }
    #messaggio-installazione .mi-passi li:last-child { border-bottom: none; }

    #messaggio-installazione .mi-icona,
    #messaggio-installazione .mi-numero {
      flex: 0 0 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1e1e3a;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: #4d9fff;
    }

    #messaggio-installazione .mi-chiudi {
      display: block;
      width: 100%;
      /* 52px di altezza: la misura minima perché un pollice lo prenda senza mirare */
      min-height: 52px;
      background: #4d9fff;
      color: #081426;
      border: none;
      border-radius: 13px;
      font-size: 16px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    #messaggio-installazione .mi-chiudi:active { transform: scale(0.985); }
  `;

  const chiudi = () => {
    segnaComeVisto();
    foglio.remove();
    stile.remove();
  };

  document.head.appendChild(stile);
  document.body.appendChild(foglio);
  foglio.querySelector('.mi-chiudi').addEventListener('click', chiudi);
}
