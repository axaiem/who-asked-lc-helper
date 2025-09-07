// Content script for LeetCode helper extension
console.log('Who Asked LC Helper loaded!');

// Load problems data
let problemsData = null;

// Fetch problems data
async function loadProblemsData() {
  try {
    const response = await fetch(chrome.runtime.getURL('data/problems.json'));
    problemsData = await response.json();
    console.log('Problems data loaded:', problemsData);
  } catch (error) {
    console.error('Error loading problems data:', error);
  }
}

// Initialize the extension
async function init() {
  await loadProblemsData();

  // Add company tags and additional info to problem pages
  if (window.location.pathname.includes('/problems/')) {
    addCompanyTags();
  }
}

// Add company tags to problem page
function addCompanyTags() {
  // Wait for the page to load
  setTimeout(() => {
    const problemTitle = document.querySelector('[data-cy="question-title"]');
    if (problemTitle && problemsData) {
      const problemName = problemTitle.textContent.trim();
      const problem = problemsData.find(p => p.title === problemName);

      if (problem) {
        addCompanyInfo(problem);
      }
    }
  }, 2000);
}

// Add company information to the page
function addCompanyInfo(problem) {
  const container = document.querySelector('.question-content__JfgR');
  if (container && problem.companies) {
    const companyDiv = document.createElement('div');
    companyDiv.style.cssText = `
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #007bff;
    `;

    companyDiv.innerHTML = `
      <h4 style="margin: 0 0 10px 0; color: #007bff;">Company Tags</h4>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${
        problem.companies
            .map(company => `<span style="
            background: #007bff; 
            color: white; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px;
          ">${company}</span>`)
            .join('')}
      </div>
    `;

    container.appendChild(companyDiv);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
