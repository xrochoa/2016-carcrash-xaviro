#!/usr/bin/env node
/*
 * CarCrash - minimal build script (2016 project, refreshed for portfolio).
 *
 * Replaces the original Gulp 3 pipeline with a small, dependency-free Node
 * script that reproduces the two things the game actually needs:
 *   1. Resolve `//=require <path>` include directives (originally handled by
 *      gulp-include) to produce a single bundled main.js.
 *   2. Copy static assets (images, audio, fonts) and index.html into /dist.
 *
 * Intentionally kept simple: no minification, no sourcemaps. The goal is a
 * reproducible build that runs on any modern Node version.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');
const GAME_CODE = 'carcrash';
const GAME_DIR = path.join(DIST, 'games', GAME_CODE);

const INCLUDE_RE = /^[ \t]*\/\/\s*=\s*require\s+['"]?([^'"\s]+)['"]?\s*$/gm;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function rimraf(target) {
  if (!fs.existsSync(target)) return;
  for (const entry of fs.readdirSync(target)) {
    const p = path.join(target, entry);
    if (fs.statSync(p).isDirectory()) rimraf(p);
    else fs.unlinkSync(p);
  }
  fs.rmdirSync(target);
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  mkdirp(to);
  for (const entry of fs.readdirSync(from)) {
    if (entry === '.DS_Store') continue;
    const src = path.join(from, entry);
    const dest = path.join(to, entry);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

/**
 * Recursively inline `//=require <file>` directives.
 * Mirrors the behaviour of gulp-include with a shared "seen" set to avoid
 * double-including the same file.
 */
function bundle(entryFile, seen = new Set()) {
  const absolute = path.resolve(entryFile);
  if (seen.has(absolute)) return '';
  seen.add(absolute);

  const source = fs.readFileSync(absolute, 'utf8');
  const dir = path.dirname(absolute);

  return source.replace(INCLUDE_RE, (_, includePath) => {
    const resolved = path.resolve(dir, includePath);
    return '\n/* === included: ' + path.relative(SRC, resolved) + ' === */\n'
      + bundle(resolved, seen)
      + '\n/* === end: ' + path.relative(SRC, resolved) + ' === */\n';
  });
}

/* -------------------------------------------------------------------------- */
/*  Tasks                                                                     */
/* -------------------------------------------------------------------------- */

function clean() {
  rimraf(DIST);
  mkdirp(DIST);
}

function html() {
  fs.copyFileSync(path.join(SRC, 'index.html'), path.join(DIST, 'index.html'));
}

function assets() {
  copyDir(path.join(SRC, 'assets', 'img'), path.join(GAME_DIR, 'assets', 'img'));
  copyDir(path.join(SRC, 'assets', 'res'), path.join(GAME_DIR, 'assets', 'res'));
}

function js() {
  mkdirp(GAME_DIR);
  const bundled = bundle(path.join(SRC, 'main.js'));
  fs.writeFileSync(path.join(GAME_DIR, 'main.js'), bundled);
}

/* -------------------------------------------------------------------------- */

function main() {
  const start = Date.now();
  console.log('CarCrash build: cleaning dist/...');
  clean();
  console.log('CarCrash build: copying html...');
  html();
  console.log('CarCrash build: copying assets...');
  assets();
  console.log('CarCrash build: bundling js...');
  js();
  console.log('CarCrash build: done in ' + (Date.now() - start) + 'ms');
}

main();
