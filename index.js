#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CODEOWNERS_FILE = path.join(process.cwd(), '.github/CODEOWNERS'); // Assumes CODEOWNERS is in the current working directory

/**
 * Parses a CODEOWNERS file and returns an array of { path: string, owners: string[] } objects.
 * @param {string} filePath - The path to the CODEOWNERS file.
 * @returns {Array<{ path: string, owners: string[] }>} An array of parsed CODEOWNERS entries.
 */
function parseCodeowners(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: CODEOWNERS file not found at ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const entries = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Ignore comments and empty lines
    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      continue;
    }

    // Split by whitespace. The first part is the path, the rest are owners.
    const parts = trimmedLine.split(/\s+/);
    if (parts.length < 2) {
      continue; // Not a valid CODEOWNERS entry
    }

    const ownerPath = parts[0];
    const owners = parts.filter((team) => team.startsWith('@')); // All subsequent parts are owners

    entries.push({ path: ownerPath, owners: owners });
  }
  console.log(`Parsed ${entries.length} CODEOWNERS entries from ${filePath}`);
  return entries;
}

function parseGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');

  const patterns = new Set();

  const content = fs.readFileSync(gitignorePath, 'utf8');
  content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((pattern) => patterns.add(pattern));

  return patterns;
}

function isIgnored(filePath, patterns) {
  const relativePath = path.relative(process.cwd(), filePath);

  for (const pattern of patterns) {
    // Convert gitignore glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.') // Escape dots
      .replace(/\*/g, '.*') // * becomes .*
      .replace(/\?/g, '.'); // ? becomes .

    const regex = new RegExp(`^${regexPattern}$|${regexPattern}/|/${regexPattern}$`);

    if (regex.test(relativePath)) {
      return true;
    }
  }

  return false;
}

/**
 * Recursively gets all files in a directory
 * @param {string} dirPath - Directory to search
 * @param {string[]} arrayOfFiles - Accumulator for recursive calls
 * @returns {string[]} Array of file paths
 */
function getAllFiles(dirPath, arrayOfFiles = [], ignorePatterns = null) {
  if (!ignorePatterns) {
    ignorePatterns = parseGitignore();
  }

  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);

    if (isIgnored(filePath, ignorePatterns)) {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles, ignorePatterns);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * Searches for files containing the search term under the given path
 * @param {string} basePath - The base path to search in
 * @param {string} searchTerm - The term to search for in files
 * @returns {string[]} Array of files containing the search term
 */
function searchInFiles(basePath, searchTerm) {
  const fullPath = path.join(process.cwd(), basePath.replace(/^\//, ''));
  const matchingFiles = [];

  try {
    if (!fs.existsSync(fullPath)) {
      console.warn(`Path ${fullPath} does not exist`);
      return matchingFiles;
    }

    // Check if the path is a file or directory
    const stats = fs.statSync(fullPath);

    if (stats.isFile()) {
      // If it's a file, just check that single file
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.toLowerCase().includes(searchTerm.toLowerCase())) {
          matchingFiles.push(path.relative(process.cwd(), fullPath));
        }
      } catch (err) {
        console.warn(`Could not read file ${fullPath}: ${err.message}`);
      }
    } else if (stats.isDirectory()) {
      // If it's a directory, search all files recursively
      const files = getAllFiles(fullPath);

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.toLowerCase().includes(searchTerm.toLowerCase())) {
            matchingFiles.push(path.relative(process.cwd(), file));
          }
        } catch (err) {
          console.warn(`Could not read file ${file}: ${err.message}`);
        }
      }
    }
  } catch (err) {
    console.error(`Error searching in path ${basePath}: ${err.message}`);
  }

  return matchingFiles;
}

/**
 * Searches files under CODEOWNERS paths based on team and a search term.
 * @param {string} searchTerm - The string to search for in files.
 * @param {string} team - The team name to filter owners by.
 * @returns {string[]} An array of files matching the criteria.
 */
function findCodeownersPaths(searchTerm, team) {
  const allEntries = parseCodeowners(CODEOWNERS_FILE);
  const matchingFiles = new Set();

  for (const entry of allEntries) {
    const ownersLower = entry.owners.map((owner) => owner.toLowerCase());
    const teamLower = team.toLowerCase();

    if (ownersLower.includes(teamLower)) {
      console.log(`Searching in path: ${entry.path}`);
      const normalizedPath = entry.path.replace(/\*/g, '').replace(/^\//, '');
      const filesWithTerm = searchInFiles(normalizedPath, searchTerm);
      filesWithTerm.forEach((file) => matchingFiles.add(file));
    }
  }

  console.log(
    `Found ${matchingFiles.size} files containing "${searchTerm}" in paths owned by "${team}".`
  );
  return Array.from(matchingFiles);
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node search.js <searchTerm> <team>');
  console.log('Example: node search.js "TODO" "@elastic/kibana-apm"');
  process.exit(1);
}

const searchTerm = args[0];
const team = args[1];

console.log(`Searching for files containing "${searchTerm}" in paths owned by "${team}"...`);

const results = findCodeownersPaths(searchTerm, team);

if (results.length > 0) {
  console.log(`\n${results.length} Files found:`);
  results.forEach((file) => console.log(`- ${file}`));
  console.log(`\nFiles path separated by comma: ${results.join(', ')}`);
} else {
  console.log('\nNo files found matching the criteria.');
}
