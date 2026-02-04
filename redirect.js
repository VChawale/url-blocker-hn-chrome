const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

async function getUsedArticleIds() {
  const result = await chrome.storage.local.get('usedArticleIds');
  return result.usedArticleIds || [];
}

async function markArticleAsUsed(articleId) {
  const usedIds = await getUsedArticleIds();
  usedIds.push(articleId);
  await chrome.storage.local.set({ usedArticleIds: usedIds });
}

async function clearUsedArticles() {
  await chrome.storage.local.set({ usedArticleIds: [] });
}

async function getRandomHNArticle() {
  // Fetch top story IDs (returns array of up to 500 IDs)
  const response = await fetch(`${HN_API_BASE}/topstories.json`);
  const storyIds = await response.json();

  // Take top 30 stories for relevance
  const topStoryIds = storyIds.slice(0, 30);

  // Get already used article IDs
  const usedIds = await getUsedArticleIds();

  // Filter out already used articles
  const availableStoryIds = topStoryIds.filter(id => !usedIds.includes(id));

  // If all articles have been used, clear the history and start fresh
  if (availableStoryIds.length === 0) {
    await clearUsedArticles();
    return getRandomHNArticle(); // Recursive call with fresh list
  }

  // Pick random story from available ones
  const randomId = availableStoryIds[Math.floor(Math.random() * availableStoryIds.length)];

  // Fetch story details
  const storyResponse = await fetch(`${HN_API_BASE}/item/${randomId}.json`);
  const story = await storyResponse.json();

  // Mark this article as used
  await markArticleAsUsed(story.id);

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
