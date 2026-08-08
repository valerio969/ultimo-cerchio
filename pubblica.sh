#!/bin/bash
# ============================================================================
# PUBBLICA IL GIOCO SU INTERNET
# ============================================================================
# Si lancia con:      npm run pubblica
#
# Cosa fa, in ordine:
#   1. compila il gioco nella cartella dist/
#   2. spedisce SOLO quella cartella su GitHub, nel ramo "gh-pages"
#   3. GitHub la mette online entro un minuto o due
#
# Il gioco finisce qui:
#     https://valerio969.github.io/ultimo-cerchio/
#
# Rilancialo ogni volta che vuoi mandare sul telefono una versione nuova.
# I telefoni che hanno già il gioco installato si aggiorneranno da soli alla
# prossima apertura, senza che tu debba reinstallare niente.
# ============================================================================

set -e
cd "$(dirname "$0")"

REPOSITORY="https://github.com/valerio969/ultimo-cerchio.git"

echo "1/3  Compilo il gioco..."
npm run build

echo "2/3  Preparo i file da spedire..."
cd dist

# Dice a GitHub di non provare a "interpretare" i file come se fossero un blog,
# e di pubblicarli così come sono.
touch .nojekyll

# Trattiamo dist/ come un piccolo archivio a sé, che viene rifatto ogni volta.
# Non teniamo la storia delle versioni del gioco compilato: quella che conta è
# la storia del codice, nel ramo principale.
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Pubblicazione del gioco"

echo "3/3  Spedisco su GitHub..."
git push -q -f "$REPOSITORY" gh-pages:gh-pages
rm -rf .git

echo
echo "Fatto. Fra un minuto o due il gioco e' aggiornato qui:"
echo "    https://valerio969.github.io/ultimo-cerchio/"
