#!/usr/bin/env node

const { spawn } = require('node:child_process');
const net = require('node:net');

const host = 'localhost';
const port = 8002;
const env = {
  ...process.env,
  DID_YOU_KNOW: 'none',
  UMI_ENV: 'dev',
  HOST: host,
  PORT: String(port),
};

let child;

const startDevServer = () => {
  child = spawn('max', ['dev'], {
    env,
    stdio: 'pipe',
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (!line.includes('Network:') && line.trim()) {
        process.stdout.write(`${line}\n`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  child.on('close', (code) => {
    process.exit(code ?? 1);
  });

  process.on('SIGINT', () => {
    child.kill();
    process.exit(0);
  });
};

const probe = net.createServer();
probe.once('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `error - El puerto ${port} ya está ocupado. Cierra el servidor anterior antes de ejecutar npm start otra vez.`,
    );
  } else {
    console.error(`error - No se pudo comprobar el puerto ${port}: ${error.message}`);
  }
  process.exit(1);
});
probe.once('listening', () => {
  probe.close(startDevServer);
});
probe.listen(port);
