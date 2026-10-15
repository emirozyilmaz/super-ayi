@echo off
cd /d "%~dp0"
set PORT=8765

rem Python'u bul: once "py" (resmi baslatici), sonra "python".
rem Not: Windows'ta "python" bazen Microsoft Store kisayoludur ve sessizce calismaz.
set PYCMD=
py -3 -c "import sys" >nul 2>nul && set PYCMD=py -3
if not defined PYCMD (
  python -c "import sys" >nul 2>nul && set PYCMD=python
)
if not defined PYCMD (
  echo.
  echo HATA: Python bulunamadi. https://www.python.org/downloads/ adresinden kurun.
  echo Kurulumda "Add python.exe to PATH" kutusunu isaretleyin.
  echo.
  pause
  exit /b 1
)

echo Super Ayi aciliyor ^(%PYCMD%^). Kapatmak icin bu pencerede Ctrl+C.
start "" cmd /c "timeout /t 2 >nul & start http://127.0.0.1:%PORT%/"
%PYCMD% tools\serve.py %PORT%
if errorlevel 1 (
  echo.
  echo Sunucu baslamadi. Port %PORT% baska bir pencerede acik olabilir; o pencereyi kapatip tekrar deneyin.
  pause
)
