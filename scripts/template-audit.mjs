import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const placeholderChecks = [
  {
    file: 'src/config/appConfig.ts',
    placeholders: [
      'Template App',
      'template-app',
      'com.example.templateapp',
      'support@example.com',
      'https://example.com/terms',
      'https://example.com/privacy',
      'your-sentry-org',
      'your-sentry-project',
    ],
  },
  {
    file: 'app.config.ts',
    placeholders: [
      'com.example.templateapp',
      'template-app',
    ],
  },
  {
    file: '.maestro/config.yaml',
    placeholders: [
      'com.example.templateapp',
    ],
  },
  {
    file: 'package.json',
    placeholders: ['"name": "expo-app-template"'],
  },
  {
    file: 'package-lock.json',
    placeholders: ['"name": "expo-app-template"'],
  },
];

const legacyTokens = [
  'GlassCount',
  'drink-tracking',
  'com.drinktracking.app',
  'DrinkTracking.storekit',
];

const legacyScanTargets = [
  'app',
  'src',
  'app.config.ts',
  'package.json',
  'package-lock.json',
  'eas.json',
  '.maestro/config.yaml',
];

const forbiddenPaths = [
  'DrinkTracking.storekit',
  'google-service-account.json',
  'REVENUECAT_SUMMARY.md',
  'NOTE.md',
  'test-output.txt',
];

const textExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.yaml',
  '.yml',
  '.md',
]);

const failures = [];

for (const check of placeholderChecks) {
  const absolutePath = path.join(repoRoot, check.file);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required file: ${check.file}`);
    continue;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const token of check.placeholders) {
    if (content.includes(token)) {
      failures.push(`Replace placeholder "${token}" in ${check.file}`);
    }
  }
}

for (const forbiddenPath of forbiddenPaths) {
  if (fs.existsSync(path.join(repoRoot, forbiddenPath))) {
    failures.push(`Remove template artifact: ${forbiddenPath}`);
  }
}

const scanFileForLegacyTokens = (relativePath) => {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return;
  }

  const extension = path.extname(relativePath);
  if (extension && !textExtensions.has(extension)) {
    return;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const token of legacyTokens) {
    if (content.includes(token)) {
      failures.push(`Legacy token "${token}" found in ${relativePath}`);
    }
  }
};

const walkTarget = (relativePath) => {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return;
  }

  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    scanFileForLegacyTokens(relativePath);
    return;
  }

  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
  for (const entry of entries) {
    const childRelativePath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      walkTarget(childRelativePath);
      continue;
    }

    scanFileForLegacyTokens(childRelativePath);
  }
};

for (const target of legacyScanTargets) {
  walkTarget(target);
}

if (failures.length > 0) {
  console.error('Template audit failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Template audit passed.');
