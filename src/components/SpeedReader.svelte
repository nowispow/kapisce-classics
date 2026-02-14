<script>
  import { onDestroy } from 'svelte';

  export let text = '';

  let words = [];
  $: words = text.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean);

  let currentIndex = 0;
  let isPlaying = false;
  let wpm = 300;
  let timerId;

  const wpmOptions = [150, 300, 600, 900];
  const punctuationPauseMultipliers = {
    ',': 1.3,
    ';': 1.6,
    ':': 1.6,
    '—': 1.8,
    '.': 2
  };
  const trailingClosers = new Set(['"', "'", '”', '’', ')', ']', '}']);

  function togglePlay() {
    if (isPlaying) {
      isPlaying = false;
      clearTimeout(timerId);
      return;
    }

    if (words.length === 0) return;
    isPlaying = true;
    scheduleNextWord();
  }

  function getWordDelay(word) {
    const msPerWord = 60000 / wpm;
    let pauseMultiplier = 1;

    if (word.includes('—')) {
      pauseMultiplier = Math.max(pauseMultiplier, punctuationPauseMultipliers['—']);
    }

    for (let i = word.length - 1; i >= 0; i--) {
      const char = word[i];
      if (trailingClosers.has(char)) continue;
      pauseMultiplier = Math.max(pauseMultiplier, punctuationPauseMultipliers[char] ?? 1);
      break;
    }

    return msPerWord * pauseMultiplier;
  }

  function scheduleNextWord() {
    clearTimeout(timerId);
    if (!isPlaying) return;
    if (currentIndex >= words.length - 1) {
      isPlaying = false;
      return;
    }

    const currentWord = words[currentIndex] || '';
    timerId = setTimeout(() => {
      currentIndex++;
      scheduleNextWord();
    }, getWordDelay(currentWord));
  }

  function reset() {
    currentIndex = 0;
    isPlaying = false;
    clearTimeout(timerId);
  }

  function getWordParts(word) {
    if (!word) return { left: '', pivot: '', right: '' };
    const letterOnly = word.replace(/[^A-Za-z]/g, '');
    if (!letterOnly) return { left: '', pivot: word, right: '' };

    const pivotLetterIndex = Math.floor((letterOnly.length - 1) / 2);
    let letterCursor = 0;
    let pivotIndexInWord = 0;
    for (let i = 0; i < word.length; i++) {
      if (/[A-Za-z]/.test(word[i])) {
        if (letterCursor === pivotLetterIndex) {
          pivotIndexInWord = i;
          break;
        }
        letterCursor++;
      }
    }

    return {
      left: word.slice(0, pivotIndexInWord),
      pivot: word[pivotIndexInWord],
      right: word.slice(pivotIndexInWord + 1)
    };
  }

  $: currentWord = words[currentIndex] || '';
  $: currentWordParts = getWordParts(currentWord);

  // Apply a new cadence immediately if WPM changes while playing.
  $: if (isPlaying) {
    wpm;
    scheduleNextWord();
  }

  onDestroy(() => {
    clearTimeout(timerId);
  });
</script>

<div class="speed-reader my-8 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
  <div class="text-center mb-6 h-16 flex items-center justify-center">
    {#if currentWord}
      <div class="rsvp-word text-4xl font-bold tracking-tight" aria-label={currentWord}>
        <span class="rsvp-left">{currentWordParts.left}</span>
        <span class="rsvp-pivot">{currentWordParts.pivot}</span>
        <span class="rsvp-right">{currentWordParts.right}</span>
      </div>
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
    position: relative;
    width: 100%;
    height: 1.2em;
    font-variant-ligatures: none;
    font-feature-settings: "liga" 0;
  }

  .rsvp-left,
  .rsvp-right,
  .rsvp-pivot {
    position: absolute;
    top: 50%;
    line-height: 1;
  }

  .rsvp-left {
    right: 50%;
    transform: translateY(-50%);
    text-align: right;
  }

  .rsvp-pivot {
    left: 50%;
    transform: translate(-50%, -50%);
    color: hsl(var(--primary));
  }

  .rsvp-right {
    left: 50%;
    transform: translateY(-50%);
  }
</style>
