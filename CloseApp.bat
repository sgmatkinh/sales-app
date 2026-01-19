@echo off
title Dang Tat He Thong Quan Ly

echo Dang dung cac tien trinh dang chay...

:: Tìm và diệt tận gốc các ông nội đang chạy
taskkill /f /im node.exe /t >nul 2>&1
taskkill /f /im npx.exe /t >nul 2>&1
taskkill /f /im ngrok.exe /t >nul 2>&1
taskkill /f /im cmd.exe /fi "windowtitle eq Backend" /t >nul 2>&1
taskkill /f /im cmd.exe /fi "windowtitle eq Frontend" /t >nul 2>&1

echo --- DA TAT SACH SE ---
echo Moi thu da duoc dong. Laptop cua may gio da nhe ganh!
timeout /t 3
exit