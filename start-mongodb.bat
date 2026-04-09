@echo off
docker ps -a --filter "name=my-mongodb" --format "{{.Names}}" | findstr /r "my-mongodb" >nul
if %errorlevel% equ 0 (
    docker start my-mongodb
) else (
    docker run -d --name my-mongodb -p 27017:27017 mongo
)