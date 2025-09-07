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
function displayProblemInfo(problemData, titleElement) {
  const lastAskedColors = {
    'This Month': '#58e34b',  // dark green
    '< 3 Months': '#58e34b',  // dark green (merged)
    '< 6 Months': '#ffd700',  // yellow
    '> 6 Months': '#ff8c00',  // orange
    'All Time': '#808080'     // grey
  };

  // Create container
  const container = document.createElement('div');
  container.className = 'lc-helper-container';

  // Legend
  container.innerHTML = `
    <div class="lc-helper-legend">
      <span><span class="lc-helper-dot" style="background:#58e34b"></span> < 3 Month</span>
      <span><span class="lc-helper-dot" style="background:#ffd700"></span> < 1 Year</span>
      <span><span class="lc-helper-dot" style="background:#ff8c00"></span> > 1 Year</span>
      <span><span class="lc-helper-dot" style="background:#808080"></span> All Time</span>
    </div>
  `;

  // Companies sorted by relative frequency descending
  const sortedCompanies = Object.entries(problemData.companies)
                              .sort(
                                  (a, b) => (b[1].relative_frequency ?? 0) -
                                      (a[1].relative_frequency ?? 0));

  const ul = document.createElement('ul');
  ul.className = 'lc-helper-companies';

  sortedCompanies.forEach(([company, info]) => {
    const li = document.createElement('li');
    li.className = 'lc-helper-company';
    const color = lastAskedColors[info.last_asked] ?? '#808080';
    li.innerHTML = `
      <span class="lc-helper-dot" style="background:${color}"></span>
      ${company} (${info.relative_frequency ?? 'N/A'})
    `;
    ul.appendChild(li);
  });

  container.appendChild(ul);

  // Insert below the title in the same main content area
  const mainContainer =
      titleElement.closest(
          'div.question-content, div.question-content__JH8Y') ||
      titleElement.parentElement;
  mainContainer.insertAdjacentElement('afterend', container);
}
