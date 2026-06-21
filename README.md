# Editkaro.in — Agency Portfolio Website

A premium, fully client-side portfolio website for **Editkaro.in**, a video editing and social media marketing agency. Built with plain HTML5, CSS3, and vanilla JavaScript — no frameworks, no build step, no backend.

## Project Overview

The site is a single-page agency portfolio covering brand story, services, a flagship case study, an 18-project filterable/searchable portfolio grid with video modals, a before/after comparison slider, a testimonial carousel, tooling, a "why us" section, and a validated contact form. The signature visual motif is an editor's **timeline scrubber and running timecode** (top progress bar, navbar readout, hero readout, and a timecode stamp on every portfolio card) — a nod to the agency's actual craft.

## Features

- Animated preloader with a real render-style percentage counter
- Sticky glassmorphism navbar with scroll-aware active-link highlighting and a mobile hamburger menu
- Cinematic full-screen hero with animated gradients, a scrolling format marquee, and a live timecode readout
- Scroll-triggered animated counters (videos edited, clients served, views generated, projects completed)
- Nine service cards with hover interactions
- Featured case-study section with result metrics
- Portfolio grid with 18 projects across all nine required categories, category filtering, live search, and lazy-loaded thumbnails
- Accessible video modal (focus trap on open, `Escape` to close, backdrop click to close)
- Draggable / keyboard-operable before-after comparison slider
- Auto-advancing testimonial carousel with six reviews, arrows, and dot navigation
- Tools & software strip (Premiere Pro, After Effects, DaVinci Resolve, Photoshop, Blender)
- "Why choose us" feature grid
- Client-side validated contact form (name, email, phone, service, message) with inline errors and a success state
- Footer with social links, quick links, and auto-updating copyright year
- Light/dark theme switcher with `localStorage` persistence and OS-preference detection
- Custom animated cursor (disabled automatically on touch devices)
- Scroll progress "timeline" bar with a moving playhead
- Back-to-top button and a floating action button with quick contact shortcuts
- Scroll-reveal animations throughout, with `prefers-reduced-motion` respected everywhere
- Fully responsive across mobile, tablet, and desktop breakpoints
- Accessibility: skip-to-content link, visible focus states, ARIA roles/labels on interactive widgets, semantic landmarks
- SEO meta tags, Open Graph + Twitter Card tags, inline SVG favicon

## Technologies Used

- HTML5 (semantic markup, inline SVG icon sprite)
- CSS3 (custom properties / design tokens, Grid, Flexbox, `backdrop-filter`, keyframe animation, `prefers-reduced-motion`)
- Vanilla JavaScript (ES6+, `IntersectionObserver`, Pointer Events, no dependencies)
- Google Fonts: Archivo Black, Space Grotesk, Inter, JetBrains Mono

## Folder Structure

```
Editkaro-Portfolio/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   ├── images/        ← add OG image, any photography here
│   ├── videos/         ← add real project video files here (see naming below)
│   └── icons/          ← reserved for any future brand/social icon files
├── README.md
└── netlify.toml
```

### Connecting real media

This is a code deliverable — it ships without binary video/photo assets. Two things to drop in before launch:

1. **`assets/images/og-image.jpg`** — a 1200×630 social-share image referenced in the `<head>` meta tags.
2. **`assets/videos/*.mp4`** — each portfolio item in `js/script.js` (`PORTFOLIO_DATA`) already references a filename (e.g. `short-form-midnight-drop.mp4`). Add a real video at that path and the modal will play it automatically. Until a file exists, the modal gracefully shows a styled fallback with the expected path.

## Setup Instructions

No build tools or package installs are required.

1. Download/clone the project folder.
2. Open `index.html` directly in a browser, **or** serve it locally for the most accurate experience (relative video paths and `fetch`-like behaviour benefit from an actual server):

   ```bash
   # Python
   python3 -m http.server 8080

   # Node (if you have it)
   npx serve .
   ```
3. Visit `http://localhost:8080`.

## Deployment Instructions (Netlify)

1. Push this folder to a Git repository (GitHub/GitLab/Bitbucket), or drag-and-drop the folder directly onto [Netlify Drop](https://app.netlify.com/drop).
2. If deploying via Git: in Netlify, **Add new site → Import an existing project**, select the repo, leave the build command blank, and set the publish directory to the project root (`.`).
3. The included `netlify.toml` already configures the publish directory, security headers, and cache rules — no extra setup needed.
4. Deploy. Netlify will serve `index.html` as the site root.

## Future Improvements

- Wire the contact form to a real endpoint (Netlify Forms, a serverless function, or a third-party form API) — it currently validates and simulates submission client-side only, by design, since this is a no-backend project.
- Add real portfolio video files and an OG share image (see "Connecting real media" above).
- Add a CMS-driven JSON feed for `PORTFOLIO_DATA` and testimonials if the catalogue is expected to grow past a manually maintained array.
- Add `srcset`/responsive image variants once real photography is in place.
- Consider a `sitemap.xml` and `robots.txt` for full SEO completeness once the production domain is final.

---

© 2026 Editkaro.in. All rights reserved.
