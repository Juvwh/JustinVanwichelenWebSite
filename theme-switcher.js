document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const body = document.body;

  const THEME_KEY = 'selected_theme';
  const LIGHT_THEME_CLASS = 'light-theme';
  const DARK_THEME_CLASS = 'dark-theme';

  // Function to update button text/icon based on current theme
  function updateButtonAppearance() {
    if (body.classList.contains(LIGHT_THEME_CLASS)) {
      themeToggleBtn.textContent = 'Switch to Dark Mode'; // Or use an icon like '🌙'
    } else {
      themeToggleBtn.textContent = 'Switch to Light Mode'; // Or use an icon like '☀️'
    }
  }

  // Function to apply a specific theme
  function applyTheme(theme) {
    if (theme === 'light') {
      body.classList.add(LIGHT_THEME_CLASS);
      body.classList.remove(DARK_THEME_CLASS);
    } else {
      body.classList.add(DARK_THEME_CLASS);
      body.classList.remove(LIGHT_THEME_CLASS);
    }
    localStorage.setItem(THEME_KEY, theme);
    updateButtonAppearance();
  }

  // Event listener for the toggle button
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      if (body.classList.contains(LIGHT_THEME_CLASS)) {
        applyTheme('dark');
      } else {
        applyTheme('light');
      }
    });
  }

  // Load and apply saved theme preference on script load
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    // If no saved theme, ensure current body class matches button state
    // The body already has 'dark-theme' by default from HTML
    updateButtonAppearance();
  }

  // Signal that the theme has been applied
  document.dispatchEvent(new CustomEvent('themeApplied'));

  console.log("Theme switcher script initialized.");
});
