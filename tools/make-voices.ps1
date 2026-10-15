# Generates offline EN/TR voice clips via Microsoft Edge neural TTS
# (Aria + Emel). Prefer this over Windows Tolga — Tolga misreads words
# like "kırmızı". Needs internet while generating; the game plays files offline.
#
#   powershell -File tools/make-voices.ps1
#   powershell -File tools/make-voices.ps1 -Force
param([switch]$Force)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$args = @()
if ($Force) { $args += '--force' }
if (Get-Command py -ErrorAction SilentlyContinue) { py -3 (Join-Path $root 'tools\make_voices.py') @args }
else { python (Join-Path $root 'tools\make_voices.py') @args }
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
