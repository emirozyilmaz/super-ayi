#!/bin/bash
# Süper Ayı 3D — tek dosya derleme (three.js + oyun kodu -> index.html)
cd "$(dirname "$0")" || exit 1
{
  cat src/head.html
  cat src/three.min.js
  printf '\n</script>\n<script>\n'
  cat src/game.js
  printf '\n</script>\n</body>\n</html>\n'
} > index.html
echo "OK: index.html oluşturuldu ($(wc -c < index.html) bayt)"
