// content.js

// --- Step 1: Extract the problem slug robustly ---
const pathParts = window.location.pathname.split('/').filter(Boolean);
let slug = null;
const problemsIndex = pathParts.indexOf('problems');
if (problemsIndex !== -1 && pathParts.length > problemsIndex + 1) {
  slug = pathParts[problemsIndex + 1];
}

function waitForTitle(callback) {
  const selector = 'div[data-cy="question-title"], div.text-title-large';
  const titleElement = document.querySelector(selector);

  if (titleElement) {
    callback(titleElement);
    return;
  }

  const observer = new MutationObserver(() => {
    const el = document.querySelector(selector);
    if (el) {
      observer.disconnect();
      callback(el);
    }
  });

  observer.observe(document.body, {childList: true, subtree: true});
}


if (!slug) {
  console.warn('Could not extract problem slug from URL');
} else {
  // --- Step 2: Load the problems.json from the extension ---
  fetch(chrome.runtime.getURL('data/problems.json'))
      .then(res => res.json())
      .then(data => {
        // Find the problem in JSON whose link includes the slug
        const problemData = Object.values(data).find(
            p => p.overall.link && p.overall.link.includes(slug));

        if (problemData) {
          waitForTitle(
              (titleElement) => displayProblemInfo(problemData, titleElement));
        }
      })
      .catch(err => console.error('Error loading problems.json:', err));
}

// --- Helper: Wait for the title element to exist ---
function displayProblemInfo(problemData, titleElement) {
  const container = document.createElement('div');
  container.style = `
        border: 1px solid #ccc;
        padding: 12px;
        margin: 10px 0;
        background-color: #f9f9f9;
        border-radius: 6px;
        font-size: 14px;
    `;

  // Sort companies by relative_frequency descending
  const sortedCompanies = Object.entries(problemData.companies).sort((a, b) => {
    const freqA = a[1].relative_frequency ?? 0;
    const freqB = b[1].relative_frequency ?? 0;
    return freqB - freqA;
  });

  const companiesStr = sortedCompanies
                           .map(([company, info]) => {
                             const lastAsked = info.last_asked ?? 'N/A';
                             const relFreq = info.relative_frequency ?? 'N/A';
                             return `${company} (${lastAsked}, ${relFreq})`;
                           })
                           .join('<br>');

  container.innerHTML = `<strong>Companies:</strong><br>${companiesStr}`;

  titleElement.insertAdjacentElement('afterend', container);
}
