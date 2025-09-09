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

  // Floating container
  const container = document.createElement('div');
  container.className = 'lc-helper-floating collapsed';

  // Button
  const toggleBtn = document.createElement('div');
  toggleBtn.className = 'lc-helper-button';
  toggleBtn.textContent = '🏢';
  container.appendChild(toggleBtn);

  // Expandable panel
  const content = document.createElement('div');
  content.className = 'lc-helper-content';

  const header = document.createElement('div');
  header.className = 'lc-helper-header';
  header.textContent = 'Asked By Companies';

  const ul = document.createElement('ul');
  ul.className = 'lc-helper-companies';

  sortedCompanies.forEach(([company, info]) => {
    const li = document.createElement('li');
    li.className = 'lc-helper-company';

    // Pick border style
    const borderClass = {
      'This Month': 'lc-border-month',
      '< 3 Months': 'lc-border-3months',
      '< 6 Months': 'lc-border-6months',
      '> 6 Months': 'lc-border-gt6',
      'All Time': 'lc-border-alltime'
    }[info.last_asked] ||
        'lc-border-alltime';

    li.classList.add(borderClass);

    // Try to use company icon
    const img = document.createElement('img');
    const fileName = company.toLowerCase().replace(/\s+/g, '') + '.png';
    img.src = chrome.runtime.getURL('icons/' + fileName);
    img.alt = company;
    img.style.width = '20px';
    img.style.height = '20px';
    img.style.objectFit = 'contain';

    // If icon fails to load → show text fallback
    img.onerror = () => {
      li.textContent = company;
    };

    li.appendChild(img);

    // Tooltip
    li.title = `Last Asked: ${info.last_asked ?? 'N/A'}\nRelative Frequency: ${
        info.relative_frequency ?? 'N/A'}`;

    ul.appendChild(li);
  });


  content.appendChild(header);
  content.appendChild(ul);
  container.appendChild(content);
  document.body.appendChild(container);

  // Toggle expand/collapse
  toggleBtn.addEventListener('click', () => {
    container.classList.toggle('collapsed');
  });

  // Make button draggable
  let isDragging = false, offsetX = 0, offsetY = 0;

  toggleBtn.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - container.getBoundingClientRect().left;
    offsetY = e.clientY - container.getBoundingClientRect().top;
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    container.style.left = `${e.clientX - offsetX}px`;
    container.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = '';
  });
}