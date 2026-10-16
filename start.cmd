@echo off
rem Запуск сайта одним двойным кликом: Docker, база, миграции, сервер разработки.
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul || (
  echo Node.js не найден. Установите Node.js LTS и перезагрузите компьютер.
  goto fail
)

docker info >nul 2>nul && goto docker_ok
echo Запускаю Docker Desktop...
if exist "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe" start "" "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
set /a tries=0
:wait_docker
timeout /t 3 /nobreak >nul
docker info >nul 2>nul && goto docker_ok
set /a tries+=1
if %tries% lss 60 goto wait_docker
echo Docker не запустился за 3 минуты. Откройте Docker Desktop вручную и повторите.
goto fail
:docker_ok

if not exist .env (
  echo Нет файла .env. Скопируйте .env.example в .env и заполните CODE_SECRET и SESSION_SECRET.
  goto fail
)

if not exist node_modules (
  echo Устанавливаю зависимости...
  call npm.cmd install || goto fail
)

echo Запускаю базу...
call npm.cmd run db:up || goto fail
call node_modules\.bin\prisma.cmd migrate deploy || goto fail

netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul && (
  echo Сайт уже запущен в другом окне: http://localhost:3000
  start "" http://localhost:3000
  pause
  exit /b 0
)

echo.
echo Сайт: http://localhost:3000   Админка: http://localhost:3000/admin/login
echo Коды из SMS в режиме заглушки печатаются в этом окне. Остановить: Ctrl+C
echo.
start "" http://localhost:3000
call npm.cmd run dev
exit /b 0

:fail
echo.
echo Запуск прерван, см. сообщение выше.
pause
exit /b 1
