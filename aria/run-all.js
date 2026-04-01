const { spawn } = require('child_process');
const fs = require('fs');

const logStream = fs.createWriteStream('run-all.log', { flags: 'a' });

function runProcess(name, cmd, args, cwd) {
    console.log(`Starting ${name}...`);
    logStream.write(`Starting ${name}...\n`);
    
    // On Windows, use shell: true to resolve npm/npx
    const proc = spawn(cmd, args, { cwd, shell: true });

    proc.stdout.on('data', (data) => {
        logStream.write(`[${name}] ${data.toString()}`);
    });

    proc.stderr.on('data', (data) => {
        logStream.write(`[${name} ERROR] ${data.toString()}`);
    });

    proc.on('close', (code) => {
        logStream.write(`[${name}] exited with code ${code}\n`);
    });
}

runProcess('Gateway', 'npm', ['run', 'start:gateway'], __dirname);
runProcess('Dashboard', 'npm', ['run', 'dev:dashboard'], __dirname);

console.log('Processes started, tailing output to run-all.log');
