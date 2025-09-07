@echo off
cd /d %~dp0
echo Iniciando o servidor web na porta 8000...
echo O navegador sera aberto automaticamente...
timeout /t 2 /nobreak >nul
start http://localhost:8000/index.html
python -m http.server 8000