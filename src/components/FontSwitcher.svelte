<script lang="ts">
  import { type FontOption, fonts, DEFAULT_FONT_ID } from '../config/fonts';

  const startIndex = () => {
    let id = DEFAULT_FONT_ID;
    try {
      id = localStorage.getItem('font.id') ?? DEFAULT_FONT_ID;
    } catch {
      /* storage unavailable */
    }
    const i = fonts.findIndex((f) => f.id === id);
    return i >= 0 ? i : 0;
  };

  let index = $state(0);

  // Sync to whatever the no-flash loader already applied.
  $effect(() => {
    index = startIndex();
  });

  function ensureLink(f: FontOption) {
    if (!f.href) return;
    const id = `fontlink-${f.id}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = f.href;
    document.head.appendChild(link);
  }

  function apply(f: FontOption) {
    ensureLink(f);
    document.documentElement.style.setProperty('--font-sans', f.family);
    try {
      localStorage.setItem('font.id', f.id);
      localStorage.setItem('font.family', f.family);
      localStorage.setItem('font.href', f.href);
    } catch {
      /* preference simply won't persist */
    }
  }

  function step(dir: 1 | -1) {
    index = (index + dir + fonts.length) % fonts.length;
    apply(fonts[index]);
  }

  const current = $derived(fonts[index]);
</script>

<div class="fontswitch" role="group" aria-label="Preview font">
  <span class="fontswitch__label">Font</span>
  <button
    type="button"
    class="fontswitch__prev"
    onclick={() => step(-1)}
    aria-label="Previous font"
    title="Previous font"
  >
    ‹
  </button>
  <button
    type="button"
    class="fontswitch__name"
    onclick={() => step(1)}
    aria-label={`Font: ${current.name}. Click for next font.`}
    title="Next font"
  >
    <span class="fontswitch__title">{current.name}</span>
    <span class="fontswitch__cat">{current.cat}</span>
    <span class="fontswitch__next" aria-hidden="true">›</span>
  </button>
</div>

<style>
  .fontswitch {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    padding: 0.3rem 0.4rem;
    border: var(--border-width) solid var(--border);
    border-radius: 999px;
    background: var(--surface);
    font-size: var(--step--1);
  }
  .fontswitch__label {
    padding-inline: 0.5rem 0.25rem;
    color: var(--text-muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 0.72em;
  }
  .fontswitch__prev,
  .fontswitch__name {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text);
    border-radius: 999px;
    transition: color var(--dur-fast) var(--ease);
  }
  .fontswitch__prev {
    width: 1.6rem;
    height: 1.6rem;
    justify-content: center;
    color: var(--text-muted);
    font-size: 1.1rem;
    line-height: 1;
  }
  .fontswitch__name {
    padding: 0.35rem 0.75rem;
    background: var(--bg);
    border: var(--border-width) solid var(--border);
  }
  .fontswitch__title {
    font-weight: var(--weight-medium);
  }
  .fontswitch__cat {
    color: var(--text-muted);
    font-size: 0.78em;
  }
  .fontswitch__next {
    color: var(--accent);
    font-size: 1.05rem;
    line-height: 1;
  }
  .fontswitch__prev:hover,
  .fontswitch__name:hover {
    color: var(--accent);
    border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  }
</style>
