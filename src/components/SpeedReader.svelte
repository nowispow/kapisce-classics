<script>

  let { text = '' } = $props();

  let sourceText = $derived(typeof text === 'string' ? text : String(text ?? ''));
  let words = $derived(tokenizeReadableText(sourceText));

  let currentIndex = $state(0);
  let isPlaying = $state(false);
  let wpm = $state(300);
  let rafId;
  let lastFrameTs = 0;
  let elapsedMs = 0;
  let currentDelayMs = 0;

  const wpmOptions = [150, 300, 600, 900];
  const punctuationPauseChars = new Set([',', ';', ':', '.', '!', '?']);
  const trailingClosers = new Set(['"', "'", '”', '’', ')', ']', '}']);
  const EXTRA_WORD_PAUSE_EQUIVALENT = 1;

  function tokenizeReadableText(value) {
    return normalizeReadableText(stripScriptLikeLines(value)).split(/\s+/).filter(Boolean);
  }

  function stripScriptLikeLines(value) {
    let isSkippingDeclaration = false;

    return value
      .replace(/^\s*---\s*[\s\S]*?\n---\s*/, ' ')
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();

        if (isSkippingDeclaration) {
          if (endsDeclaration(trimmed)) {
            isSkippingDeclaration = false;
          }
          return '';
        }

        if (!startsScriptLikeDeclaration(trimmed)) {
          return line;
        }

        isSkippingDeclaration = !endsDeclaration(trimmed);
        return '';
      })
      .join('\n');
  }

  function startsScriptLikeDeclaration(line) {
    return (
      /^(import|export)\b/.test(line) ||
      /^type\s+\w+\s*=/.test(line) ||
      /^interface\s+\w+\b/.test(line) ||
      /^(const|let|var)\s+[\w$]+\s*=/.test(line) ||
      /^(function|class)\s+[\w$]+\b/.test(line)
    );
  }

  function endsDeclaration(line) {
    return line === '' || line.endsWith(';') || /\bfrom\s+['"][^'"]+['"];?$/.test(line);
  }

  function normalizeReadableText(value) {
    return value
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/~~~[\s\S]*?~~~/g, ' ')
      .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
      .replace(/<\/?[A-Za-z][\w.:-]*(?:\s+[^<>]*)?\/?>/g, ' ')
      .replace(/\{[^{}\n]*\}/g, ' ')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/^[\t ]*[-*+]\s+/gm, '')
      .replace(/^[\t ]*\d+[.)]\s+/gm, '')
      .replace(/([*_~]{1,3})(\S(?:.*?\S)?)\1/g, '$2')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  function togglePlay() {
    if (isPlaying) {
      isPlaying = false;
      stopRafLoop();
      return;
    }

    if (words.length === 0) return;
    isPlaying = true;
    currentDelayMs = getWordDelay(words[currentIndex] || '');
    startRafLoop();
  }

  function getWordDelay(word) {
    const msPerWord = 60000 / wpm;
    const hasPauseMark = hasPausePunctuation(word);
    const extraWords = hasPauseMark ? EXTRA_WORD_PAUSE_EQUIVALENT : 0;
    return msPerWord * (1 + extraWords);
  }

  function hasPausePunctuation(word) {
    if (!word) return false;

    // Treat em dash as a pause trigger even when not trailing.
    if (word.includes('—')) return true;

    for (let i = word.length - 1; i >= 0; i--) {
      const char = word[i];
      if (trailingClosers.has(char)) continue;
      return punctuationPauseChars.has(char);
    }

    return false;
  }

  function getPivotIndex(word) {
    if (!word) return 0;
    return Math.floor((word.length - 1) / 2);
  }

  function frame(ts) {
    if (!isPlaying) return;

    if (lastFrameTs === 0) {
      lastFrameTs = ts;
      rafId = requestAnimationFrame(frame);
      return;
    }

    elapsedMs += ts - lastFrameTs;
    lastFrameTs = ts;

    while (isPlaying && elapsedMs >= currentDelayMs) {
      elapsedMs -= currentDelayMs;

      if (currentIndex >= words.length - 1) {
        isPlaying = false;
        stopRafLoop();
        return;
      }

      currentIndex++;
      currentDelayMs = getWordDelay(words[currentIndex] || '');
    }

    rafId = requestAnimationFrame(frame);
  }

  function startRafLoop() {
    stopRafLoop();
    lastFrameTs = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stopRafLoop() {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
    }
  }

  function reset() {
    currentIndex = 0;
    isPlaying = false;
    elapsedMs = 0;
    lastFrameTs = 0;
    stopRafLoop();
  }

  function updateWpm(event) {
    wpm = Number(event.currentTarget.value);
  }

  let currentWord = $derived(words[currentIndex] || '');

  // Apply new cadence immediately if WPM changes while playing.
  $effect(() => {
    if (isPlaying) {
      wpm;
      currentDelayMs = getWordDelay(currentWord);
    }
  });

  // Keep index stable if text changes and now has fewer words.
  $effect(() => {
    if (currentIndex > words.length - 1) {
      currentIndex = Math.max(words.length - 1, 0);
    }
  });

  $effect(() => {
    return () => {
      stopRafLoop();
    };
  });
</script>

<div class="speed-reader my-8 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
  <div class="text-center mb-6 h-16 flex items-center justify-center">
    {#if currentWord}
      <div class="rsvp-word text-4xl font-bold tracking-tight" aria-label={currentWord}
        ><span class="rsvp-before">{currentWord.slice(0, getPivotIndex(currentWord))}</span><span class="rsvp-pivot"
          >{currentWord.charAt(getPivotIndex(currentWord))}</span
        ><span class="rsvp-after">{currentWord.slice(getPivotIndex(currentWord) + 1)}</span></div
      >
    {:else}
      <span class="text-4xl font-bold tracking-tight">Ready?</span>
    {/if}
  </div>

  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <button
          on:click={togglePlay}
          class="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          on:click={reset}
          class="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Reset
        </button>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">WPM:</span>
        <select
          bind:value={wpm}
          on:change={updateWpm}
          class="bg-background border border-input rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-primary"
        >
          {#each wpmOptions as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="w-full bg-secondary h-2 rounded-full overflow-hidden">
      <div
        class="bg-primary h-full transition-all duration-200"
        style="width: {(currentIndex / (words.length - 1 || 1)) * 100}%"
      ></div>
    </div>

    <div class="flex justify-between text-xs text-muted-foreground">
      <span>Word {currentIndex + 1} of {words.length}</span>
      <span>{Math.round((currentIndex / (words.length - 1 || 1)) * 100)}%</span>
    </div>
  </div>
</div>

<style>
  .rsvp-word {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: baseline;
    width: 100%;
    font-variant-ligatures: none;
    font-feature-settings: "liga" 0;
    white-space: nowrap;
  }

  .rsvp-before {
    justify-self: end;
  }

  .rsvp-pivot {
    color: #dc2626;
    justify-self: center;
  }

  .rsvp-after {
    justify-self: start;
  }
</style>
