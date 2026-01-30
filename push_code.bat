@echo off
echo ========================================================
echo               PUSHING CODE TO GITHUB
echo ========================================================
echo.
echo DESTINATION: https://github.com/spservicesgroupinc-blip/antigravity.git
echo.
echo IMPORTANT:
echo 1. If you have 2-Factor Auth (2FA) on, your PASSWORD will NOT work.
echo 2. You might need a "Personal Access Token" instead of a password.
echo.
echo When the box appears:
echo - USERNAME: Your GitHub username
echo - PASSWORD: Your Password OR Personal Access Token
echo.
echo Running git push...
git push -u origin main
echo.
echo ========================================================
echo IF IT FAILED (403):
echo You might need to generate a specific Token on GitHub.
echo OR try installing "GitHub Desktop" which is much easier.
echo ========================================================
pause
