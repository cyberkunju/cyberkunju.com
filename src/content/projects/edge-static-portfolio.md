---
title: Edge-Native Portfolio Platform
summary: A zero-JS-by-default static site engineered for instant global loads and prerendered navigation.
date: 2026-06-01
tags: ['astro', 'performance', 'edge']
role: Design & Engineering
stack: ['Astro', 'Svelte', 'Cloudflare', 'Vite/Rolldown']
featured: true
order: 1
links:
  repo: https://github.com/cyberkunju/portfolio
---

## Overview

A public-facing site built to sit at the physical ceiling of web performance:
static HTML served from the edge, near-zero JavaScript, prerendered next-page
navigation, and a strict performance budget enforced in CI.

## What made it fast

- Static output with critical CSS inlined and everything else cached immutably.
- Native cross-document View Transitions for smoothness with no framework router.
- Speculation Rules plus edge prerendering so navigations feel instant.
- AVIF images, subset fonts, and `content-visibility` to keep first paint tiny.

## Result

Lighthouse 100s across the board, sub-50ms time-to-first-byte globally, and a
total page weight measured in kilobytes rather than megabytes.
