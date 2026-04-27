import { spawn, ChildProcess } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const N8N_PORT = process.env.N8N_PORT || 5678;
const N8N_HOST = process.env.N8N_HOST || 'localhost';
const N8N_DATA_DIR = join(process.cwd(), '.n8n-data');

let n8nProcess: ChildProcess | null = null;

export async function startN8n() {
  if (n8nProcess) {
    console.log('n8n already running');
    return;
  }

  try {
    // Ensure data directory exists
    if (!existsSync(N8N_DATA_DIR)) {
      mkdirSync(N8N_DATA_DIR, { recursive: true });
    }

    console.log(`Starting n8n on ${N8N_HOST}:${N8N_PORT}...`);

    n8nProcess = spawn('n8n', ['start', '--listen', '0.0.0.0'], {
      env: {
        ...process.env,
        N8N_PORT: String(N8N_PORT),
        N8N_HOST: '0.0.0.0',
        N8N_ENCRYPTION_KEY: process.env.N8N_ENCRYPTION_KEY || 'default-key-change-in-production',
        N8N_DB_TYPE: process.env.N8N_DB_TYPE || 'sqlite',
        N8N_DB_SQLITE_FILE: join(N8N_DATA_DIR, 'database.sqlite'),
        N8N_USER_FOLDER: N8N_DATA_DIR,
        N8N_SECURE_COOKIE: process.env.NODE_ENV === 'production' ? 'true' : 'false',
      },
      stdio: 'inherit',
    });

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(); // Assume started after timeout
      }, 10000);

      n8nProcess!.on('error', (err) => {
        clearTimeout(timeout);
        console.error('Failed to start n8n:', err);
        n8nProcess = null;
        reject(err);
      });

      n8nProcess!.on('exit', (code) => {
        clearTimeout(timeout);
        console.log(`n8n process exited with code ${code}`);
        n8nProcess = null;
      });
    });
  } catch (error) {
    console.error('Error starting n8n:', error);
    throw error;
  }
}

export function stopN8n() {
  if (n8nProcess) {
    console.log('Stopping n8n...');
    n8nProcess.kill('SIGTERM');
    n8nProcess = null;
  }
}

export function getN8nUrl() {
  return `http://${N8N_HOST}:${N8N_PORT}`;
}

export function isN8nRunning() {
  return n8nProcess !== null;
}
