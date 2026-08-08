#!/bin/bash
# ============================================================================
# GENERA LE ICONE DEL GIOCO
# ============================================================================
# Prende public/icona.svg e ne ricava tutte le PNG che servono al telefono.
#
# Si lancia con:      npm run icone
#
# Usa "sips", che è già dentro macOS: nessun programma da installare.
# Se cambi il disegno in icona.svg, rilancia questo comando e le PNG si
# aggiornano tutte insieme.
# ============================================================================

set -e
cd "$(dirname "$0")"

SORGENTE="public/icona.svg"

if [ ! -f "$SORGENTE" ]; then
  echo "ERRORE: non trovo $SORGENTE"
  exit 1
fi

# Ogni riga è: nomefile dimensione
#   512 e 192  → le misure che chiede il manifest della PWA
#   180        → quella che usa iPhone per la schermata Home
#   32         → la faviconcina nella linguetta del browser
genera() {
  local nome=$1
  local misura=$2
  sips -s format png -z "$misura" "$misura" "$SORGENTE" --out "public/$nome" > /dev/null 2>&1
  echo "  public/$nome  (${misura}x${misura})"
}

echo "Genero le icone da $SORGENTE:"
genera "icona-512.png"        512
genera "icona-192.png"        192
genera "apple-touch-icon.png" 180
genera "favicon-32.png"       32

echo "Fatto."
