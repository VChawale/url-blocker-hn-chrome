// Register event listeners at top level (required for MV3)
chrome.runtime.onInstalled.addListener(handleInstalled);
chrome.storage.onChanged.addListener(handleStorageChange);

// Also update rules on startup in case service worker was inactive
chrome.runtime.onStartup.addListener(updateRedirectRules);

// Open options page when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

async function handleInstalled() {
  // Initialize default blocklist if none exists
  const { blocklist } = await chrome.storage.sync.get('blocklist');
  if (!blocklist) {
    await chrome.storage.sync.set({ blocklist: [] });
  }
  await updateRedirectRules();
}

async function handleStorageChange(changes, namespace) {
  if (namespace === 'sync' && changes.blocklist) {
    await updateRedirectRules();
  }
}

async function updateRedirectRules() {
  const { blocklist = [] } = await chrome.storage.sync.get('blocklist');

  // Get existing rule IDs to remove them
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map(rule => rule.id);

  // Create new rules from blocklist
  const newRules = blocklist.map((pattern, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        extensionPath: '/redirect.html?blocked=' + encodeURIComponent(pattern)
      }
    },
    condition: {
      urlFilter: pattern,
      resourceTypes: ['main_frame']
    }
  }));

  // Atomically update rules
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: newRules
  });

  console.log(`URL Blocker: Updated ${newRules.length} redirect rules`);
}
