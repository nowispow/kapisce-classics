<script>
  import { onMount } from 'svelte';

  export let text = '';

  let words = [];
  $: words = text.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean);

  let currentIndex = 0;
  let isPlaying = false;
  let wpm = 300;
  let interval;

  const wpmOptions = [150, 300, 600, 900];

  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      startTimer();
    } else {
      clearInterval(interval);
    }
  }

  function startTimer() {
    clearInterval(interval);
    const msPerWord = 60000 / wpm;
    interval = setInterval(() => {
      if (currentIndex < words.length - 1) {
        currentIndex++;
      } else {
        isPlaying = false;
        clearInterval(interval);
      }
    }, msPerWord);
  }

  function reset() {
    currentIndex = 0;
    isPlaying = false;
    clearInterval(interval);
  }

  $: if (isPlaying) {
    startTimer();
  }

  onMount(() => {
    return () => clearInterval(interval);
  });
</script>

<div class="speed-reader my-8 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
  <div class="text-center mb-6 h-16 flex items-center justify-center">
    <span class="text-4xl font-bold tracking-tight">
      {words[currentIndex] || 'Ready?'}
    </span>
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
