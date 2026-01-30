@echo off
echo ========================================================
echo               PUSHING CODE TO GITHUB
echo ========================================================
echo.
echo This script will send your code to:
echo https://github.com/spservicesgroupinc-blip/rfefoamapp.git
echo.
echo If a window pops up asking you to sign in, please do so.
echo.
echo Running: git push -u origin main
echo.
git push -u origin main
echo.
echo ========================================================
echo               DONE
echo ========================================================
pause
