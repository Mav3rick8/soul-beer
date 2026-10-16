@echo off
rem Prisma Studio из проекта (локальная Prisma 5, без скачивания чужих версий через npx).
chcp 65001 >nul
cd /d "%~dp0"
docker info >nul 2>nul || (
  echo Docker не запущен. Сначала запустите start.cmd.
  pause
  exit /b 1
)
echo Prisma Studio: http://localhost:5555   Остановить: Ctrl+C
call node_modules\.bin\prisma.cmd studio
