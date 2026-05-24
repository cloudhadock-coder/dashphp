@echo off
echo ===================================================
echo Iniciando o Dashboard de Chamados...
echo ===================================================

echo [1/3] Atualizando dependencias do Node (npm install)...
call npm install

echo [2/3] Iniciando o servidor PHP (Backend) na porta 8000...
start cmd /k "title Backend PHP && php -S localhost:8000"

echo [3/3] Iniciando o servidor React (Vite) na porta 5173...
start cmd /k "title Frontend React && npm run dev"

echo ===================================================
echo Tudo certo! Os servidores estao rodando em janelas separadas.
echo Acesse no seu navegador: http://localhost:5173
echo ===================================================
pause
