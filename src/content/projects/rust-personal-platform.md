---
title: Rust Personal Platform
summary: A memory-safe backend and tooling workspace powering personal systems behind authentication.
date: 2026-05-10
tags: ['rust', 'backend', 'systems']
role: Architecture & Engineering
stack: ['Rust', 'Axum', 'PostgreSQL', 'SQLx']
featured: true
order: 2
---

## Overview

The private half of the platform: a Rust service that runs personal tools and
data behind proper authentication, with an emphasis on correctness, observability,
and safe trust boundaries.

## Design notes

- Compile-checked SQL via SQLx against a real PostgreSQL schema with constraints.
- Structured logging and metrics so production behavior is debuggable.
- Shared Rust types across the API surface to eliminate client/server drift.

## Status

Actively evolving as new tools graduate from experiment to daily use.
