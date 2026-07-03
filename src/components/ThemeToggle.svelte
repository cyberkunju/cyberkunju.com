<script lang="ts">
  type Theme = 'light' | 'dark';

  function current(): Theme {
    const el = document.documentElement;
    if (el.classList.contains('dark')) return 'dark';
    if (el.classList.contains('light')) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  let theme = $state<Theme>('light');

  // Initialize from the already-applied DOM state (set by the no-flash script).
  $effect(() => {
    theme = current();
  });

  function toggle() {
    theme = theme === 'dark' ? 'light' : 'dark';
    const el = document.documentElement;
    el.classList.remove('light', 'dark');
    el.classList.add(theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // storage unavailable (private mode); preference simply won't persist.
    }
  }
</script>

<button
  type="button"
  class="theme-toggle"
  onclick={toggle}
  aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
  title="Toggle theme"
>
  {#if theme === 'dark'}
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  {:else}
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  {/if}
</button>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: var(--radius-md);
    border: var(--border-width) solid var(--border);
    color: var(--text);
    background: var(--surface);
    transition:
      color var(--dur-fast) var(--ease),
      border-color var(--dur-fast) var(--ease);
  }
  .theme-toggle:hover {
    color: var(--accent);
    border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
  }
</style>
