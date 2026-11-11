@echo off
chcp 65001 >nul
title EasyFood - servidor
cd /d "%~dp0"
echo Encerrando o servidor antigo na porta 3000 (se houver)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING') do taskkill /PID %%p /F >nul 2>&1
timeout /t 1 >nul
echo Iniciando o EasyFood em http://localhost:3000
echo Deixe esta janela aberta. Para parar: Ctrl + C
echo.
call npm start > "%~dp0servidor.log" 2>&1
