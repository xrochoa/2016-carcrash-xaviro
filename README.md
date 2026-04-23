# CarCrash

> A retro 8-bit browser game built with [Phaser 2](https://phaser.io/). Originally shipped in **2016** as part of the **FridgeBinge** mini-game platform, refreshed and repackaged here as a standalone portfolio artifact.

![Year](https://img.shields.io/badge/year-2016-323333) ![Engine](https://img.shields.io/badge/engine-Phaser%202.6.2-4cfbce) ![License](https://img.shields.io/badge/license-ISC-lightgrey)

---

## About

Dodge trucks, chain red-car knockouts, climb through four neon levels, and try to hit 1,000 points. The game was built during my early web-developer days and deployed on FridgeBinge, a small platform I built where logged-in users could track scores across several browser mini-games.

This repository is the original source, cleaned up and repackaged so it runs on any modern Node version and deploys to Netlify as a static site — while keeping the original architecture, gameplay, and pixel-art untouched.

## Features

- **Four levels** with progressive difficulty and animated environments.
- **Two input modes**: keyboard (arrow keys + Enter) and pointer / touch.
- **Arcade physics** using Phaser's built-in engine (collisions, tween-based animation, sprite sheets).
- **State machine**: `Boot → Preloader → Menu → Game → Win`.
- **Asset pipeline** for sprite sheets, bitmap fonts, and audio (theme song + explosion SFX).
- **Responsive scaling** — different scale modes for desktop and mobile via `Phaser.ScaleManager`.

## Tech Stack

| Layer | Tool |
|------|------|
| Game engine | Phaser 2.6.2 (Canvas renderer) |
| Module loader | SystemJS 0.19 (loaded via CDN, original 2016 choice) |
| Build | Minimal Node script (`build.js`) — reproduces the original `gulp-include` concat pipeline with zero dependencies |
| Local dev server | `serve` (via `npx`) |
| Hosting | Netlify (static) |

> The original project used a Gulp 3 pipeline (`gulp-include`, `gulp-uglify`, `gulp-imagemin`, `browser-sync`). That `gulpfile.js` is preserved in the repo for historical reference but is no longer used — Gulp 3 is incompatible with current Node versions, so the pipeline was replaced with a small, dependency-free `build.js` that performs the same two jobs (bundle + copy assets).

## What this project demonstrates (2016 stage of my career)

At this point I was transitioning from WordPress and jQuery work into full web application development:

- **Structuring a non-trivial JavaScript codebase** before ES modules were ubiquitous — using SystemJS for module loading and `gulp-include` directives for bundling.
- **Game programming fundamentals**: state machines, entity classes with prototypal inheritance, tween-based animation, sprite sheet management, arcade-style physics.
- **Build tooling**: asset optimization, sourcemaps, live-reload dev loop.
- **Integrating a frontend with a backend platform** (the FridgeBinge server exposed `/api/user` and `/api/highscores` endpoints the game called via `XMLHttpRequest`).
- **UX and polish**: preloader progress bar, volume toggle, level-up/highscore animations, retry flow.

Honest look at the limitations (kept as-is to preserve authenticity): the game uses a lot of module-level `var` state, the state files share globals by convention, and "ajax" is used as a multi-purpose flag. This is how I wrote code in 2016, and it reflects where I was on the path from scripting toward architecture.

## Project structure

```
CarCrash/
├── src/
│   ├── index.html               # shell page, loads Phaser + SystemJS
│   ├── main.js                  # game entry, includes all modules
│   ├── main/
│   │   ├── init.js              # global game config (sizes, speeds, score thresholds)
│   │   ├── utils.js             # tween helpers + XHR wrappers
│   │   ├── entities/            # Player / Enemy sprite classes
│   │   └── states/              # Boot / Preloader / Menu / Game / Win
│   └── assets/
│       ├── img/                 # sprite sheets, backgrounds, UI
│       └── res/                 # audio + bitmap-font XML
├── build.js                     # modern replacement for the original gulp pipeline
├── netlify.toml                 # Netlify build config
├── gulpfile.js                  # legacy 2016 pipeline (kept for historical reference)
└── server.js                    # legacy 2016 dev server (kept for historical reference)
```

## Run locally

Requirements: **Node.js 14+** (no other global tooling required).

```bash
# 1. clone
git clone https://github.com/xrochoa/CarCrash.git
cd CarCrash

# 2. build the dist/ bundle
node build.js
#   or: npm run build

# 3. serve it
npx --yes serve -l 5000 dist
#   or: npm start
```

Then open <http://localhost:5000>.

**Controls**: `Enter` or click to start. `↑ / ↓ / →` or pointer/touch to move.

## Deploy to Netlify

This repo is preconfigured for Netlify. There are two equivalent ways:

### Option A — Git-based (recommended)

1. Push this repository to GitHub / GitLab / Bitbucket.
2. In Netlify: **Add new site → Import an existing project** and pick the repo.
3. Netlify reads `netlify.toml` and uses:
   - **Build command**: `node build.js`
   - **Publish directory**: `dist`
4. Click **Deploy**.

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
node build.js
netlify deploy --dir=dist --prod
```

No environment variables, no backend, no build plugins required.

## License

ISC © Xavier Reyes Ochoa
