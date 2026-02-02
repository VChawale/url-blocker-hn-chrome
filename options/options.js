// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load and display blocklist
async function loadBlocklist() {
  const { blocklist = [] } = await chrome.storage.sync.get('blocklist');
  renderBlocklist(blocklist);
}

function renderBlocklist(blocklist) {
  const list = document.getElementById('blocklist');
  const emptyMsg = document.getElementById('empty-message');
  const count = document.getElementById('count');

  list.innerHTML = '';
  count.textContent = `(${blocklist.length})`;

  if (blocklist.length === 0) {
    emptyMsg.classList.remove('hidden');
  } else {
    emptyMsg.classList.add('hidden');
  }

  blocklist.forEach((pattern, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="pattern">${escapeHtml(pattern)}</span>
      <button class="remove-btn" data-index="${index}">Remove</button>
    `;
    list.appendChild(li);
  });
}

// Add new pattern
async function addPattern(pattern) {
  pattern = pattern.trim();
  if (!pattern) return;

  const { blocklist = [] } = await chrome.storage.sync.get('blocklist');

  // Prevent duplicates
  if (blocklist.includes(pattern)) {
    alert('This pattern already exists in your blocklist.');
    return;
  }

  blocklist.push(pattern);
  await chrome.storage.sync.set({ blocklist });
  loadBlocklist();
}

// Remove pattern
async function removePattern(index) {
  const { blocklist = [] } = await chrome.storage.sync.get('blocklist');
  blocklist.splice(index, 1);
  await chrome.storage.sync.set({ blocklist });
  loadBlocklist();
}

// Event listeners
document.getElementById('add-btn').addEventListener('click', () => {
  const input = document.getElementById('url-input');
  addPattern(input.value);
  input.value = '';
  input.focus();
});

document.getElementById('url-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const input = document.getElementById('url-input');
    addPattern(input.value);
    input.value = '';
  }
});

document.getElementById('blocklist').addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-btn')) {
    const index = parseInt(e.target.dataset.index);
    removePattern(index);
  }
});

// Initialize
loadBlocklist();
