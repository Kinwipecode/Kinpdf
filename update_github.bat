@echo off
chcp 65001 >nul
echo ===================================================
echo Sende aktuelle Aenderungen von PDF-Editor an GitHub
echo ===================================================
echo.

echo 1. Fuege alle neuen oder geaenderten Dateien hinzu...
git add .
echo.

echo 2. Erstelle Versionierungs-Sicherung (Commit)...
git commit -m "Automatisches Update über update_github.bat"
echo.

echo 3. Lade Daten auf GitHub hoch (Branch: main)...
git push origin main
echo.

echo 4. Synchronisiere zur Sicherheit auch den alten Master-Zweig...
git push origin main:master --force
echo.

echo ===================================================
echo FERTIG! Alle Dateien wurden erfolgreich an GitHub gesendet.
echo Der automatische Web-Build (GitHub Actions) dauert nun ca. 2 Minuten.
echo ===================================================
pause
