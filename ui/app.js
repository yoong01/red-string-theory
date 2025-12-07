const API_BASE = 'http://localhost:3001/api';
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

let currentPage = 'matches';
let garments = [];
let swapIntents = [];
let swapHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initModal();
  loadData();
  setInterval(loadData, 10000);
});

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      navigateToPage(page);
    });
  });
}

function navigateToPage(page) {
  currentPage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');

  if (page === 'closet') renderCloset();
  if (page === 'matches') renderMatches();
  if (page === 'history') renderHistory();
}

function initModal() {
  const uploadBtn = document.getElementById('upload-btn');
  const modal = document.getElementById('upload-modal');
  const closeBtn = document.getElementById('modal-close');
  const form = document.getElementById('garment-form');

  uploadBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await createGarment();
    modal.classList.remove('active');
    form.reset();
  });
}

async function loadData() {
  await Promise.all([
    loadGarments(),
    loadSwapIntents(),
    loadSwapHistory()
  ]);

  const matchesBadge = document.getElementById('matches-badge');
  const activeMatches = swapIntents.filter(i => i.status === 'PENDING' || i.status === 'ACCEPTED').length;
  matchesBadge.textContent = activeMatches;

  if (currentPage === 'closet') renderCloset();
  if (currentPage === 'matches') renderMatches();
  if (currentPage === 'history') renderHistory();
}

async function loadGarments() {
  try {
    const response = await fetch(`${API_BASE}/garments?ownerId=${DEMO_USER_ID}`);
    garments = await response.json();
  } catch (error) {
    console.error('Error loading garments:', error);
  }
}

async function loadSwapIntents() {
  try {
    const response = await fetch(`${API_BASE}/swap-intents?ownerId=${DEMO_USER_ID}`);
    swapIntents = await response.json();
  } catch (error) {
    console.error('Error loading swap intents:', error);
  }
}

async function loadSwapHistory() {
  try {
    const response = await fetch(`${API_BASE}/swap-history?ownerId=${DEMO_USER_ID}`);
    swapHistory = await response.json();
  } catch (error) {
    console.error('Error loading swap history:', error);
  }
}

async function createGarment() {
  const styleTags = document.getElementById('garment-style-tags').value
    .split(',')
    .map(t => t.trim())
    .filter(t => t);

  const personality = document.getElementById('garment-personality').value
    .split(',')
    .map(t => t.trim())
    .filter(t => t);

  const garmentData = {
    owner_id: DEMO_USER_ID,
    name: document.getElementById('garment-name').value,
    category: document.getElementById('garment-category').value,
    size: document.getElementById('garment-size').value,
    condition: parseFloat(document.getElementById('garment-condition').value) / 10,
    rarity: 0.5,
    style_tags: styleTags,
    personality: personality,
    vibe: document.getElementById('garment-vibe').value,
    image_url: document.getElementById('garment-image').value || null,
    patience: parseFloat(document.getElementById('garment-patience').value) / 100,
    min_acceptable_score: parseFloat(document.getElementById('garment-standards').value) / 100,
    active: true
  };

  try {
    const response = await fetch(`${API_BASE}/garments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(garmentData)
    });

    if (response.ok) {
      await loadData();
    }
  } catch (error) {
    console.error('Error creating garment:', error);
  }
}

function renderCloset() {
  const container = document.getElementById('garment-grid');

  if (garments.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <p>No garments yet. Upload your first item to get started.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = garments.map(g => `
    <div class="garment-card">
      ${g.image_url ? `<img src="${g.image_url}" alt="${g.name}" class="garment-image">` : `
        <div class="garment-image"></div>
      `}
      <div class="garment-info">
        <div class="garment-header">
          <div>
            <div class="garment-name">${g.name}</div>
            <div class="garment-meta">${g.category} " Size ${g.size}</div>
          </div>
          <div class="condition-badge">Condition: ${Math.round(g.condition * 10)}/10</div>
        </div>

        <div class="style-tags">
          ${g.style_tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>

        <div class="personality-tags">
          ${g.personality.map(p => `<span class="personality-tag">${p}</span>`).join('')}
        </div>

        <div class="match-standards">
          <span class="standards-label">Match Standards</span>
          <span class="standards-value">${Math.round(g.min_acceptable_score * 100)}%</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderMatches() {
  const container = document.getElementById('matches-container');

  const activeIntents = swapIntents.filter(i =>
    i.status === 'PENDING' || i.status === 'ACCEPTED'
  );

  if (activeIntents.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
        <p class="empty-title">No Active Negotiations</p>
        <p class="empty-subtitle">Your garment agents are searching for compatible matches. Check back soon!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = activeIntents.map(intent => renderMatchCard(intent)).join('');
}

function renderMatchCard(intent) {
  const garmentA = intent.garment_a;
  const garmentB = intent.garment_b;
  const compatibility = Math.round(intent.compatibility_score * 100);
  const fairness = Math.round(intent.fairness_score * 100);
  const isMyItemA = garmentA.owner_id === DEMO_USER_ID;
  const myItem = isMyItemA ? garmentA : garmentB;
  const theirItem = isMyItemA ? garmentB : garmentA;

  const dialogue = intent.dialogue_text;

  return `
    <div class="match-card">
      <div class="match-header">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div class="match-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
          </div>
          <div class="match-info">
            <h3>Match Found</h3>
            <div class="match-date">${new Date(intent.proposed_at).toLocaleDateString()}</div>
          </div>
        </div>
        <span class="status-badge">${intent.status === 'PENDING' ? 'Negotiating' : 'Accepted'}</span>
      </div>

      <div class="scores-row">
        <div class="score-box">
          <div class="score-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Compatibility
          </div>
          <div class="score-value">${compatibility} <span style="font-size: 16px;">/100</span></div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${compatibility}%"></div>
          </div>
        </div>

        <div class="score-box">
          <div class="score-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Fairness Score
          </div>
          <div class="score-value">${fairness} <span style="font-size: 16px;">/100</span></div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${fairness}%"></div>
          </div>
        </div>
      </div>

      <div class="items-comparison">
        <div class="item-column">
          <div class="item-label">YOUR ITEM</div>
          ${myItem.image_url ? `<img src="${myItem.image_url}" alt="${myItem.name}" class="item-image">` : `
            <div class="item-image"></div>
          `}
          <div class="item-details">
            <div class="item-name">${myItem.name}</div>
            <div class="item-meta">${myItem.category} " Size ${myItem.size}</div>
            <div class="style-tags">
              ${myItem.style_tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="swap-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
          </svg>
        </div>

        <div class="item-column">
          <div class="item-label">POTENTIAL MATCH</div>
          ${theirItem.image_url ? `<img src="${theirItem.image_url}" alt="${theirItem.name}" class="item-image">` : `
            <div class="item-image"></div>
          `}
          <div class="item-details">
            <div class="item-name">${theirItem.name}</div>
            <div class="item-meta">${theirItem.category} " Size ${theirItem.size}</div>
            <div class="style-tags">
              ${theirItem.style_tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>

      ${dialogue ? `
        <div class="dialogue-section">
          <div class="dialogue-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            Agent Conversation
          </div>

          <div class="dialogue-message">
            <div class="message-sender">
              <div class="sender-avatar">A</div>
              <div class="sender-name">${garmentA.name}</div>
            </div>
            <div class="message-text">${dialogue.garmentA.text}</div>
          </div>

          <div class="dialogue-message">
            <div class="message-sender">
              <div class="sender-avatar">B</div>
              <div class="sender-name">${garmentB.name}</div>
            </div>
            <div class="message-text">${dialogue.garmentB.text}</div>
          </div>

          <div class="voice-synthesis">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            Voice Synthesis " ElevenLabs
          </div>
        </div>
      ` : ''}

      ${intent.status === 'ACCEPTED' ? `
        <div class="action-buttons">
          <button class="btn btn-success btn-large" onclick="confirmSwap('${intent.id}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Accept & Execute Swap
          </button>
          <button class="btn btn-secondary btn-large" onclick="declineSwap('${intent.id}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Decline
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function renderHistory() {
  const container = document.getElementById('history-container');

  if (swapHistory.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <p>No swap history yet</p>
      </div>
    `;
    return;
  }

  container.innerHTML = swapHistory.map(swap => {
    const compatibility = Math.round(swap.compatibility_score * 100);
    const fairness = Math.round(swap.fairness_score * 100);
    const isMyItemA = swap.owner_a_id === DEMO_USER_ID;
    const myItem = isMyItemA ? swap.garment_a_data : swap.garment_b_data;
    const theirItem = isMyItemA ? swap.garment_b_data : swap.garment_a_data;

    return `
      <div class="history-card">
        <div class="history-header">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="history-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="match-info">
              <h3>Swap Completed</h3>
              <div class="history-date">${new Date(swap.completed_at).toLocaleString()}</div>
            </div>
          </div>
          ${swap.blockchain_tx_id ? `
            <a href="#" class="blockchain-link">View on-chain �</a>
          ` : ''}
        </div>

        <div class="history-items">
          <div>
            <div class="history-column-label">YOU TRADED</div>
            <div class="history-item">
              ${myItem.image_url ? `<img src="${myItem.image_url}" alt="${myItem.name}" class="history-item-image">` : `
                <div class="history-item-image"></div>
              `}
              <div class="history-item-info">
                <h4>${myItem.name}</h4>
                <p>${myItem.category}</p>
              </div>
            </div>
          </div>

          <div>
            <div class="history-column-label">YOU RECEIVED</div>
            <div class="history-item">
              ${theirItem.image_url ? `<img src="${theirItem.image_url}" alt="${theirItem.name}" class="history-item-image">` : `
                <div class="history-item-image"></div>
              `}
              <div class="history-item-info">
                <h4>${theirItem.name}</h4>
                <p>${theirItem.category}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="history-scores">
          <div class="history-score">
            <span class="history-score-label">Compatibility: </span>
            <span class="history-score-value">${compatibility}%</span>
          </div>
          <div class="history-score">
            <span class="history-score-label">Fairness: </span>
            <span class="history-score-value">${fairness}%</span>
          </div>
          ${swap.blockchain_tx_id ? `
            <div style="margin-left: auto;">
              <div class="tx-label">TX:</div>
              <div class="tx-id">${swap.blockchain_tx_id.substring(0, 12)}...</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function confirmSwap(intentId) {
  if (!confirm('Confirm this swap? Ownership will be transferred.')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/swap-intents/${intentId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockchainTxId: null })
    });

    if (response.ok) {
      await loadData();
      navigateToPage('history');
    }
  } catch (error) {
    console.error('Error confirming swap:', error);
    alert('Failed to confirm swap');
  }
}

async function declineSwap(intentId) {
  if (!confirm('Decline this swap?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/swap-intents/${intentId}/decline`, {
      method: 'POST'
    });

    if (response.ok) {
      await loadData();
    }
  } catch (error) {
    console.error('Error declining swap:', error);
  }
}
