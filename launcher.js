const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PID_FILE = path.join(__dirname, 'start_sgs_pid.txt');
const BACKEND_DIR = path.join(__dirname, 'sgs-backend');
const FRONTEND_DIR = path.join(__dirname, 'sgs_frontend');

function killProcess(pid, label) {
  try {
    execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    console.log(`Stopped ${label} (PID: ${pid})`);
  } catch {
    console.log(`${label} (PID: ${pid}) not running`);
  }
}

function stopAll() {
  if (!fs.existsSync(PID_FILE)) {
    console.log('No PID file found. Nothing to stop.');
    return;
  }
  const pids = fs.readFileSync(PID_FILE, 'utf-8').trim().split('\n');
  for (const line of pids) {
    const [pid, label] = line.split(' ');
    if (pid) killProcess(parseInt(pid), label || 'process');
  }
  fs.unlinkSync(PID_FILE);
  console.log('All processes stopped.');
}

function startAll() {
  try {
    const backend = spawn('node', ['index.js'], {
      cwd: BACKEND_DIR,
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    backend.unref();
    const backendPid = backend.pid;

    const frontend = spawn('cmd.exe', ['/c', 'npx', 'vite', '--host', '0.0.0.0', '--port', '5173'], {
      cwd: FRONTEND_DIR,
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    frontend.unref();
    const frontendPid = frontend.pid;

    fs.writeFileSync(PID_FILE, `${backendPid} backend\n${frontendPid} frontend\n`);
    console.log(`Backend started (PID: ${backendPid})`);
    console.log(`Frontend started (PID: ${frontendPid})`);
    console.log('PIDs saved to start_sgs_pid.txt');
  } catch (err) {
    console.error('Failed to start servers:', err.message);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.includes('--stop') || args.includes('-s')) {
  stopAll();
} else {
  startAll();
}
