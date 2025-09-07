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

  const legend = `
    <div style="margin-bottom: 8px;">
      <strong>Last Asked:</strong>
      <span style="color:#58e34b;">● &lt; 3 Months</span>
      <span style="color:#ffd700;">● &lt; 1 year</span>
      <span style="color:#808080;">● All Time</span>
    </div>
  `;
  // Map last asked categories to colors
  const lastAskedColors = {
    'This Month': '#58e34b',  // dark green
    '< 3 Months': '#58e34b',  // yellow (merged with < 6 Months)
    '< 6 Months': '#ffd700',  // yellow
    '> 6 Months': '#ff8c00',  // orange
    'All Time': '#808080'     // grey
  };

  // Sort companies by relative frequency descending
  const sortedCompanies = Object.entries(problemData.companies)
                              .sort(
                                  (a, b) => (b[1].relative_frequency ?? 0) -
                                      (a[1].relative_frequency ?? 0));

  // Build company info HTML
  const companies =
      Object.entries(problemData.companies)
          .sort(
              (a, b) => (b[1].relative_frequency || 0) -
                  (a[1].relative_frequency || 0))
          .map(([company, info]) => {
            const color = lastAskedColors[info.last_asked] || '#000';
            return `<span><span style="color:${color};">●</span> ${company} (${
                info.relative_frequency})</span>`;
          })
          .join('<br>');

  container.innerHTML = legend + companies;

  // Insert after title
  titleElement.insertAdjacentElement('afterend', container);
}
