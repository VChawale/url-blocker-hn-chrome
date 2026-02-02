const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

async function getRandomHNArticle() {
  // Fetch top story IDs (returns array of up to 500 IDs)
  const response = await fetch(`${HN_API_BASE}/topstories.json`);
  const storyIds = await response.json();

  // Take top 30 stories for relevance
  const topStoryIds = storyIds.slice(0, 30);

  // Pick random story
  const randomId = topStoryIds[Math.floor(Math.random() * topStoryIds.length)];

  // Fetch story details
  const storyResponse = await fetch(`${HN_API_BASE}/item/${randomId}.json`);
  const story = await storyResponse.json();

  // Return URL (external link or HN discussion if no URL)
  return story.url || `https://news.ycombinator.com/item?id=${story.id}`;
}

async function init() {
  try {
    // Show what was blocked (optional)
    const params = new URLSearchParams(window.location.search);
    const blocked = params.get('blocked');
    if (blocked) {
      document.querySelector('.blocked-info').textContent =
        `Blocked: ${decodeURIComponent(blocked)}`;
    }

    // Get random article and redirect
    const articleUrl = await getRandomHNArticle();
    window.location.replace(articleUrl);
  } catch (error) {
    // Fallback to HN homepage on error
    console.error('Error fetching HN article:', error);
    window.location.replace('https://news.ycombinator.com/');
  }
}

init();
