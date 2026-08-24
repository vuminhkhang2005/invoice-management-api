import path from 'path';
import fs from 'fs';
import net from 'net';
import EmbeddedPostgres from 'embedded-postgres';

const dataDir = path.resolve(process.cwd(), 'prisma/pg_native');

let embeddedInstance: any = null;

export async function ensurePostgresServer(port = 5432): Promise<void> {
  const isPortOpen = await checkPortRunning(port);
  if (isPortOpen) {
    console.log(`📡 Connected to active PostgreSQL server on localhost:${port}`);
    return;
  }

  console.log(`🐘 Starting Native Embedded PostgreSQL on localhost:${port}...`);

  const isInitialized = fs.existsSync(path.join(dataDir, 'PG_VERSION'));

  embeddedInstance = new EmbeddedPostgres({
    port,
    databaseDir: dataDir,
    user: 'postgres',
    password: 'password',
  });

  if (!isInitialized) {
    console.log('📦 Initialising new PostgreSQL data directory...');
    await embeddedInstance.initialise();

    // Set trust authentication in pg_hba.conf for zero-friction local dev
    const hbaPath = path.join(dataDir, 'pg_hba.conf');
    if (fs.existsSync(hbaPath)) {
      let content = fs.readFileSync(hbaPath, 'utf8');
      content = content
        .replace(/password/g, 'trust')
        .replace(/scram-sha-256/g, 'trust')
        .replace(/md5/g, 'trust');
      fs.writeFileSync(hbaPath, content, 'utf8');
    }
  }

  await embeddedInstance.start();

  try {
    await embeddedInstance.createDatabase('invoice_db');
  } catch {
    // Database invoice_db may already exist
  }

  console.log(`✅ Native Embedded PostgreSQL is running on localhost:${port}`);
}

async function checkPortRunning(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(400);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, '127.0.0.1');
  });
}
