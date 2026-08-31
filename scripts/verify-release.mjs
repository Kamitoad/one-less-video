import { spawnSync } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputRoot = path.join(root, '.output');
const extensionRoot = path.join(outputRoot, 'chrome-mv3');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolutePath)));
    } else {
      files.push(absolutePath);
    }
  }

  return files;
}

function normalizeArchiveEntry(entry) {
  return entry.replaceAll('\\', '/').replace(/^\.\//, '');
}

const packageJson = await readJson(path.join(root, 'package.json'));
const manifest = await readJson(path.join(extensionRoot, 'manifest.json'));

assert(
  packageJson.private === true,
  'package.json must remain private to prevent accidental npm publication.',
);
assert(
  packageJson.license === 'MIT',
  'package.json and LICENSE must identify the MIT license.',
);
assert(manifest.manifest_version === 3, 'The release must use Manifest V3.');
assert(
  manifest.default_locale === 'en',
  'English must remain the default locale.',
);
assert(
  manifest.name === '__MSG_extensionName__',
  'Unexpected localized extension name.',
);
assert(
  manifest.description === '__MSG_extensionDescription__',
  'Unexpected localized extension description.',
);
assert(
  manifest.version === packageJson.version,
  'package.json and manifest versions differ.',
);
assert(
  JSON.stringify(manifest.permissions) === JSON.stringify(['storage']),
  'The release must request only the storage API permission.',
);
assert(
  manifest.host_permissions === undefined,
  'Unexpected host_permissions entry.',
);
assert(
  manifest.background === undefined,
  'Unexpected background service worker.',
);
assert(
  manifest.externally_connectable === undefined,
  'Unexpected externally_connectable entry.',
);
assert(
  manifest.update_url === undefined,
  'A source-built release must not define a custom update URL.',
);
assert(
  manifest.homepage_url === 'https://github.com/Kamitoad/one-less-video',
  'Unexpected homepage URL.',
);

assert(
  Array.isArray(manifest.content_scripts),
  'Expected a content script declaration.',
);
assert(
  manifest.content_scripts.length === 1,
  'Expected exactly one content script declaration.',
);
const [contentScript] = manifest.content_scripts;
assert(
  JSON.stringify(contentScript.matches) ===
    JSON.stringify(['https://www.youtube.com/*']),
  'Content-script access must stay limited to www.youtube.com.',
);
assert(
  contentScript.run_at === 'document_start',
  'The player lock must start at document_start.',
);

const referencedFiles = new Set(
  [
    ...Object.values(manifest.icons ?? {}),
    ...Object.values(manifest.action?.default_icon ?? {}),
    manifest.action?.default_popup,
    manifest.options_ui?.page,
    ...(contentScript.js ?? []),
  ].filter(Boolean),
);

referencedFiles.add('THIRD_PARTY_NOTICES.txt');
referencedFiles.add('BRAND_NOTICE.txt');
referencedFiles.add('_locales/en/messages.json');
referencedFiles.add('_locales/de/messages.json');

for (const relativePath of referencedFiles) {
  const file = path.join(extensionRoot, relativePath);
  assert(
    (await stat(file)).isFile(),
    `Manifest references a missing file: ${relativePath}`,
  );
}

const releaseFiles = await walk(extensionRoot);
const forbiddenFile = releaseFiles.find((file) =>
  /(^|[\\/])(\.env|\.git|node_modules)([\\/]|$)|\.(?:map|pem|key|p12|log)$/i.test(
    file,
  ),
);
assert(
  forbiddenFile === undefined,
  `Forbidden release file found: ${forbiddenFile}`,
);

for (const scriptFile of releaseFiles.filter((file) => file.endsWith('.js'))) {
  const source = await readFile(scriptFile, 'utf8');
  assert(
    !/\beval\s*\(/u.test(source),
    `eval() found in ${path.relative(root, scriptFile)}.`,
  );
  assert(
    !/\bnew\s+Function\s*\(/u.test(source),
    `new Function() found in ${path.relative(root, scriptFile)}.`,
  );
}

const outputEntries = await readdir(outputRoot);
const archiveNames = outputEntries.filter(
  (entry) => entry.endsWith('-chrome.zip') && !entry.includes('-sources'),
);
assert(
  archiveNames.length === 1,
  `Expected exactly one Chrome release ZIP, found ${archiveNames.length}.`,
);

const archivePath = path.join(outputRoot, archiveNames[0]);
const archiveListing = spawnSync('tar', ['-tf', archivePath], {
  encoding: 'utf8',
  shell: false,
});
assert(
  archiveListing.status === 0,
  `Could not inspect release ZIP: ${archiveListing.stderr}`,
);

const archiveEntries = archiveListing.stdout
  .split(/\r?\n/u)
  .map(normalizeArchiveEntry)
  .filter(Boolean);
assert(
  archiveEntries.includes('manifest.json'),
  'The ZIP must contain manifest.json at its root.',
);
assert(
  archiveEntries.every(
    (entry) =>
      !entry.startsWith('/') &&
      !/^[A-Za-z]:\//u.test(entry) &&
      !entry.split('/').includes('..'),
  ),
  'The ZIP contains an unsafe absolute or parent-relative path.',
);
assert(
  archiveEntries.every(
    (entry) =>
      !/(^|\/)(\.env|\.git|node_modules)(\/|$)|\.(?:map|pem|key|p12|log)$/iu.test(
        entry,
      ),
  ),
  'The ZIP contains a forbidden file.',
);

const releaseTag = process.env.RELEASE_TAG;
if (releaseTag !== undefined && releaseTag !== '') {
  assert(
    releaseTag === `v${packageJson.version}`,
    `Tag ${releaseTag} does not match v${packageJson.version}.`,
  );
  const changelog = await readFile(path.join(root, 'CHANGELOG.md'), 'utf8');
  assert(
    changelog.includes(`## [${packageJson.version}]`),
    `CHANGELOG.md has no section for release ${packageJson.version}.`,
  );
}

console.log(
  `Verified ${archiveNames[0]} (${archiveEntries.length} entries, version ${manifest.version}).`,
);
