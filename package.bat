@echo off
REM Build installable ZIP packages for the I Have 2 Much Tabs extension.
REM
REM Usage:
REM   package.bat                 build chrome, firefox and edge packages
REM   package.bat chrome firefox  build only the listed targets
REM
REM Output ZIPs are written to the repository root:
REM   ihave2muchtabs-<target>-<version>.zip
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0"
set "EXT_DIR=%ROOT_DIR%extension"

where npm >nul 2>nul
if errorlevel 1 (
  echo Error: npm is not installed or not on PATH.
  exit /b 1
)

pushd "%EXT_DIR%" || exit /b 1

if not exist "node_modules" (
  echo [package] Installing dependencies...
  call npm install || (popd & exit /b 1)
)

set "TARGETS=%*"
if "%TARGETS%"=="" set "TARGETS=chrome firefox edge"

for /f "delims=" %%v in ('node -p "require('./package.json').version"') do set "VERSION=%%v"

for %%t in (%TARGETS%) do (
  if /i not "%%t"=="chrome" if /i not "%%t"=="firefox" if /i not "%%t"=="edge" (
    echo Error: invalid target '%%t'. Valid: chrome, firefox, edge.
    popd
    exit /b 1
  )
  echo [package] Building %%t package ^(v!VERSION!^)...
  call node .\scripts\build.mjs --target %%t --package || (popd & exit /b 1)
)

popd

echo.
echo [package] Done. Packages in %ROOT_DIR%
for %%t in (%TARGETS%) do echo   ihave2muchtabs-%%t-!VERSION!.zip

endlocal
