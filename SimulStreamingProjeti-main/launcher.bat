@echo off
setlocal
cd /d "%~dp0"

:: 1. CHECK FOR VIRTUAL ENVIRONMENT
IF NOT EXIST "venv" (
    echo [INFO] Virtual environment not found. Creating 'venv'...
    python -m venv venv
    echo [INFO] 'venv' created successfully.
    echo.
    echo [INFO] Installing requirements...
    call venv\Scripts\activate
    pip install -r requirements.txt
    echo [INFO] Installation complete.
    pause
) ELSE (
    :: Activate existing venv
    call venv\Scripts\activate
)

:MENU
cls
echo ========================================================
echo   SIMULSTREAMING LAUNCHER (VENV ACTIVE)
echo ========================================================
echo.
echo   1. Run Large v3 Turbo (Best Quality/Warmup)
echo   2. Run Medium (Standard)
echo   3. Run Speed Turbo Navegante (Low Latency/VAC)
echo.
echo   4. Install/Update Dependencies (requirements.txt)
echo   5. Exit
echo.
echo ========================================================
set /p option="Select an option [1-5]: "

IF "%option%"=="1" GOTO LARGE
IF "%option%"=="2" GOTO MEDIUM
IF "%option%"=="3" GOTO SPEED
IF "%option%"=="4" GOTO INSTALL
IF "%option%"=="5" GOTO EOF

:LARGE
echo.
echo Starting Large v3 Turbo...
:: Command from your run-large_v3_turbo.bat
python simulstreaming_whisper_server.py --language pt --task transcribe --host 0.0.0.0 --model_path ./models/large-v3-turbo.pt --warmup-file warmup.mp3
pause
GOTO MENU

:MEDIUM
echo.
echo Starting Medium Model...
:: Command from your run-medium.bat
python simulstreaming_whisper_server.py --language pt --task transcribe --host 0.0.0.0 --model_path ./models/medium.pt
pause
GOTO MENU

:SPEED
echo.
echo Starting Speed/Navegante Model...
:: Command from your run-speed-turbo-Navegante.bat
python simulstreaming_whisper_server.py --language pt --task transcribe --vac --min-chunk-size 0.8 --host 0.0.0.0 --model_path small.pt
pause
GOTO MENU

:INSTALL
echo.
echo Installing/Updating requirements...
pip install -r requirements.txt
echo Done.
pause
GOTO MENU

:EOF
exit