const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Configuration
const CWD_BACKEND = path.join(__dirname, 'SimulStreamingProjeti-main');
// Path to the Python executable inside the virtual environment
const VENV_PYTHON = path.join(CWD_BACKEND, 'venv', 'Scripts', 'python.exe');
const SCRIPT_NAME = 'simulstreaming_whisper_server.py';

const FRONTEND_CMD = 'npm.cmd'; // npm.cmd for Windows
const FRONTEND_ARGS = ['run', 'tauri', 'dev'];

let backendProcess = null;
let frontendProcess = null;
let isShuttingDown = false;
let selectedModelOption = null;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getModelArgs(option) {
    // Arguments derived from launcher.bat
    const commonArgs = ['simulstreaming_whisper_server.py']; // Script name is first arg for python executable

    switch (option) {
        case '1': // Large v3 Turbo
            return [
                ...commonArgs,
                '--language', 'pt',
                '--task', 'transcribe',
                '--host', '0.0.0.0',
                '--model_path', './models/large-v3-turbo.pt',
                '--warmup-file', 'warmup.mp3'
            ];
        case '2': // Medium
            return [
                ...commonArgs,
                '--language', 'pt',
                '--task', 'transcribe',
                '--host', '0.0.0.0',
                '--model_path', './models/medium.pt',
                '--warmup-file', 'warmup.mp3'
            ];
        case '3': // Speed Turbo Navegante
            return [
                ...commonArgs,
                '--language', 'pt',
                '--task', 'transcribe',
                '--vac',
                '--min-chunk-size', '0.8',
                '--host', '0.0.0.0',
                '--model_path', 'small.pt'
            ];
        default:
            console.log('Invalid option selected. Defaulting to Speed (3).');
            return [
                ...commonArgs,
                '--language', 'pt',
                '--task', 'transcribe',
                '--vac',
                '--min-chunk-size', '0.8',
                '--host', '0.0.0.0',
                '--model_path', 'small.pt'
            ];
    }
}

function startBackend() {
    if (isShuttingDown) return;

    if (!fs.existsSync(VENV_PYTHON)) {
        console.error(`[Runner] Error: Virtual environment python not found at ${VENV_PYTHON}`);
        console.error(`[Runner] Please run launcher.bat first to set up the environment.`);
        process.exit(1);
    }

    console.log('[Runner] Starting backend...');
    const args = getModelArgs(selectedModelOption);
    console.log(`[Runner] Executing: ${VENV_PYTHON} ${args.join(' ')}`);

    // Spawn python directly from venv
    backendProcess = spawn(VENV_PYTHON, args, { // Pass full args including script name
        cwd: CWD_BACKEND,
        stdio: 'inherit',
        shell: false // Direct execution needed for creating subprocess 
    });

    backendProcess.on('exit', (code) => {
        if (isShuttingDown) return;

        console.log(`[Runner] Backend exited with code ${code}`);

        if (code === 42) {
            console.log('[Runner] Restart signal detected (Hallucination/Disconnect). Restarting backend in 1s...');
            setTimeout(startBackend, 1000);
        } else {
            console.log('[Runner] Backend exited unexpectedly. Restarting in 3s...');
            setTimeout(startBackend, 3000);
        }
    });

    backendProcess.on('error', (err) => {
        console.error('[Runner] Backend error:', err);
    });
}

function startFrontend() {
    console.log('[Runner] Starting frontend...');
    frontendProcess = spawn(FRONTEND_CMD, FRONTEND_ARGS, {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });

    frontendProcess.on('exit', (code) => {
        if (isShuttingDown) return;
        console.log(`[Runner] Frontend exited with code ${code}. Shutting down...`);
        cleanup();
    });
}

function cleanup() {
    isShuttingDown = true;
    console.log('[Runner] Shutting down...');

    if (backendProcess) {
        backendProcess.removeAllListeners('exit');
        backendProcess.kill();
    }
    if (frontendProcess) {
        frontendProcess.kill(); // On Windows this might not kill the tree, but basic attempt
    }
    rl.close();
    process.exit(0);
}

// Menu
console.log('========================================================');
console.log('  SIMULSTREAM RUNNER');
console.log('========================================================');
console.log('  1. Run Large v3 Turbo (Best Quality/Warmup)');
console.log('  2. Run Medium (Standard)');
console.log('  3. Run Speed Turbo Navegante (Low Latency/VAC)');
console.log('');

rl.question('Select an option [1-3]: ', (answer) => {
    selectedModelOption = answer.trim();

    console.log('--- Starting Services ---');
    startBackend();
    startFrontend();
});

// Handle termination signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
