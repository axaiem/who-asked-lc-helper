// --- Step 1: Extract problem slug ---
const pathParts = window.location.pathname.split('/').filter(Boolean);
let slug = null;
const problemsIndex = pathParts.indexOf('problems');
if (problemsIndex !== -1 && pathParts.length > problemsIndex + 1) {
  slug = pathParts[problemsIndex + 1];
}
if (!slug) {
  console.warn('Could not extract problem slug from URL');
} else {
  // all your main logic goes here
}


// --- Step 2: Load problems.json ---
fetch(chrome.runtime.getURL('data/problems.json'))
    .then(res => res.json())
    .then(data => {
      const problemData = Object.values(data).find(
          p => p.overall.link && p.overall.link.includes(slug));
      if (problemData)
        waitForTitle(titleEl => displayProblemInfo(problemData, titleEl));
    })
    .catch(err => console.error('Error loading problems.json:', err));

// --- Wait for title element ---
function waitForTitle(callback) {
  const selector = 'div[data-cy="question-title"], div.text-title-large';
  const titleEl = document.querySelector(selector);
  if (titleEl) return callback(titleEl);

  const observer = new MutationObserver(() => {
    const el = document.querySelector(selector);
    if (el) {
      observer.disconnect();
      callback(el);
    }
  });
  observer.observe(document.body, {childList: true, subtree: true});
}

// --- Step 3: Display problem info ---
// --- Step 3: Display problem info ---
// --- Step 3: Display problem info ---
function displayProblemInfo(problemData) {
  const lastAskedColors = {
    'This Month': '#58e34b',
    '< 3 Months': '#58e34b',
    '< 6 Months': '#ffd700',
    '> 6 Months': '#ff8c00',
    'All Time': '#808080'
  };

  const recencyOrder = {
    'This Month': 1,
    '< 3 Months': 2,
    '< 6 Months': 3,
    '> 6 Months': 4,
    'All Time': 5
  };

  const sortedCompanies = Object.entries(problemData.companies).sort((a, b) => {
    const aOrder = recencyOrder[a[1].last_asked] ?? 6;
    const bOrder = recencyOrder[b[1].last_asked] ?? 6;
    return aOrder - bOrder;
  });

  // Container
  const container = document.createElement('div');
  container.className = 'lc-helper-floating';

  // Header with toggle button
  const header = document.createElement('div');
  header.className = 'lc-helper-header';
  header.innerHTML =
      `<span>Asked By Companies</span> <button class="lc-helper-toggle">−</button>`;

  // Content area
  const content = document.createElement('div');
  content.className = 'lc-helper-content';

  const ul = document.createElement('ul');
  ul.className = 'lc-helper-companies';

  sortedCompanies.forEach(([company, info]) => {
    const li = document.createElement('li');
    li.className = 'lc-helper-company';
    const color = lastAskedColors[info.last_asked] ?? '#808080';

    li.innerHTML = `<span class="lc-helper-dot" style="background:${
        color}"></span>${company}`;
    li.title = `Last Asked: ${info.last_asked ?? 'N/A'}\nRelative Frequency: ${
        info.relative_frequency ?? 'N/A'}`;

    ul.appendChild(li);
  });

  content.appendChild(ul);
  container.appendChild(header);
  container.appendChild(content);
  document.body.appendChild(container);

  // Toggle button logic
  const toggleBtn = header.querySelector('.lc-helper-toggle');
  toggleBtn.addEventListener('click', () => {
    const isCollapsed = container.classList.toggle('collapsed');
    toggleBtn.textContent = isCollapsed ? '+' : '−';
  });
}
