#!/bin/bash
# Eski tek dosya oyunu legacy/ altinda kalir. Yeni oyun: oyna.bat
cd "$(dirname "$0")/legacy" || exit 1
bash ./build.sh
