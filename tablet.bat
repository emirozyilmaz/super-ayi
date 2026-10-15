@echo off
cd /d "%~dp0"
set PORT=8765

rem Ayni Wi-Fi'deki tablet ya da telefon icin. Asagida yazan adresi tabletin tarayicisinda acin.
rem Windows guvenlik duvari izin sorarsa "Ozel aglar" icin izin verin.
set PYCMD=
py -3 -c "import sys" >nul 2>nul && set PYCMD=py -3
if not defined PYCMD (
  python -c "import sys" >nul 2>nul && set PYCMD=python
)
if not defined PYCMD (
  echo.
  echo HATA: Python bulunamadi. https://www.python.org/downloads/ adresinden kurun.
  echo.
  pause
  exit /b 1
)

echo Super Ayi tablet modu. Kapatmak icin bu pencerede Ctrl+C.
%PYCMD% tools\serve.py %PORT% --lan
if errorlevel 1 (
  echo.
  echo Sunucu baslamadi. Port %PORT% baska bir pencerede acik olabilir; o pencereyi kapatip tekrar deneyin.
  pause
)
