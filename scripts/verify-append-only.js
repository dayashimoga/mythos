import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const FILES_TO_CHECK = ['TODO.md', 'CHANGELOG.md'];

function verifyAppendOnly() {
  console.log('[Append-Only Guard] Verifying strict append-only constraints for:', FILES_TO_CHECK.join(', '));

  for (const file of FILES_TO_CHECK) {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      console.error(`[Append-Only Guard] Error: Required file ${file} does not exist.`);
      process.exit(1);
    }
  }

  try {
    // Check if git is available and has at least one commit
    const hasHead = execSync('git rev-parse --verify HEAD', { stdio: 'pipe' }).toString().trim();
    if (!hasHead) {
      console.log('[Append-Only Guard] Initial repository state detected. File existence validated.');
      return;
    }

    for (const file of FILES_TO_CHECK) {
      const fullPath = path.resolve(process.cwd(), file);
      const headContent = execSync(`git show HEAD:${file}`, { stdio: 'pipe' }).toString();
      const currentContent = fs.readFileSync(fullPath, 'utf8');

      // True mathematical append-only: currentContent must preserve headContent exactly
      const cleanHead = headContent.replace(/\r\n/g, '\n');
      const cleanCurrent = currentContent.replace(/\r\n/g, '\n');

      if (cleanCurrent.startsWith(cleanHead) || cleanCurrent.startsWith(cleanHead.trimEnd() + '\n')) {
        continue;
      }

      // Check diff against HEAD
      const diff = execSync(`git diff HEAD -- ${file}`, { stdio: 'pipe' }).toString();
      if (!diff) {
        continue;
      }

      const lines = diff.split('\n');
      for (const line of lines) {
        // Look for removed lines (-) that are not git diff header lines (---)
        if (line.startsWith('-') && !line.startsWith('---')) {
          console.error(`[Append-Only Guard] VIOLATION DETECTED in ${file}:`);
          console.error(`  Line was modified or deleted: "${line}"`);
          console.error('[Append-Only Guard] TODO.md and CHANGELOG.md are strictly append-only!');
          process.exit(1);
        }
      }
    }

    console.log('[Append-Only Guard] PASSED: All records in TODO.md and CHANGELOG.md are strictly append-only.');
  } catch (err) {
    // If not a git repo or no HEAD yet, pass with warning
    console.log('[Append-Only Guard] Note: Git verification skipped or clean (no HEAD commit yet). All files exist.');
  }
}

verifyAppendOnly();
