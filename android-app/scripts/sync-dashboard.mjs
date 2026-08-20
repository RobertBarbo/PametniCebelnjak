import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(scriptDirectory, '..');
const projectDirectory = resolve(appDirectory, '..');
const sourceDirectory = join(projectDirectory, 'web');
const targetDirectory = join(appDirectory, 'public', 'dashboard');

const files = ['index.html', 'app.js', 'styles.css', 'firebase-config.js'];
const directories = ['assets', 'vendor'];

async function requirePath(path, description) {
  try {
    await stat(path);
  } catch {
    throw new Error(`${description} ne obstaja: ${path}`);
  }
}

await requirePath(
  join(sourceDirectory, 'firebase-config.js'),
  'Firebase konfiguracija za Android dashboard',
);

await rm(targetDirectory, { recursive: true, force: true });
await mkdir(targetDirectory, { recursive: true });

for (const file of files) {
  const source = join(sourceDirectory, file);
  await requirePath(source, `Datoteka ${file}`);
  await cp(source, join(targetDirectory, file));
}

for (const directory of directories) {
  const source = join(sourceDirectory, directory);
  await requirePath(source, `Mapa ${directory}`);
  await cp(source, join(targetDirectory, directory), {
    recursive: true,
    filter: (sourcePath) => !sourcePath.endsWith('.gz'),
  });
}

console.log('Cloud nadzorna plošča je vključena v Android aplikacijo.');
