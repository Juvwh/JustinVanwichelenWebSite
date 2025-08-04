document.addEventListener('DOMContentLoaded', () => {
  const supportedLanguages = ['en', 'fr'];
  let currentLanguage = getDefaultLanguage();

  const langEnBtn = document.getElementById('lang-en');
  const langFrBtn = document.getElementById('lang-fr');

  function getDefaultLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && supportedLanguages.includes(savedLang)) {
      return savedLang;
    }
    const browserLang = navigator.language.split('-')[0];
    if (supportedLanguages.includes(browserLang)) {
      return browserLang;
    }
    return 'en';
  }

  function updateMetaTag(selector, attribute, key) {
    const tag = document.querySelector(selector);
    if (tag) {
      const translation = translations[currentLanguage]?.[key];
      if (translation) {
        tag.setAttribute(attribute, translation);
      } else {
        console.warn(`Meta translation not found for key: ${key} in language: ${currentLanguage}`);
      }
    } else {
      console.warn(`Meta tag not found with selector: ${selector}`);
    }
  }

  function setLanguage(lang) {
    if (!supportedLanguages.includes(lang)) {
      console.error(`Language ${lang} is not supported.`);
      return;
    }
    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    document.documentElement.lang = lang;

    // Update document title
    if (translations[currentLanguage]?.docTitle) {
      document.title = translations[currentLanguage].docTitle;
    }

    // Update meta tags
    updateMetaTag('meta[name="description"]', 'content', 'metaDescription');
    updateMetaTag('meta[name="keywords"]', 'content', 'metaKeywords');
    updateMetaTag('meta[property="og:title"]', 'content', 'ogTitle');
    updateMetaTag('meta[property="og:description"]', 'content', 'ogDescription');
    updateMetaTag('meta[name="twitter:title"]', 'content', 'twitterTitle');
    updateMetaTag('meta[name="twitter:description"]', 'content', 'twitterDescription');


    document.querySelectorAll('[data-translate-key]').forEach(element => {
      const key = element.getAttribute('data-translate-key');
      const translation = translations[currentLanguage]?.[key];
      if (translation !== undefined) {
        element.innerHTML = translation;
      } else {
        console.warn(`Translation not found for key: ${key} in language: ${currentLanguage}`);
      }
    });

    document.querySelectorAll('[data-translate-aria-label-key]').forEach(element => {
      const key = element.getAttribute('data-translate-aria-label-key');
      const translation = translations[currentLanguage]?.[key];
      if (translation) {
        element.setAttribute('aria-label', translation);
      } else {
        console.warn(`ARIA label translation not found for key: ${key} in language: ${currentLanguage}`);
      }
    });
    updateLanguageButtonStates();

    if (typeof window.updateThemeButtonAppearance === 'function') {
      window.updateThemeButtonAppearance();
    }
  }

  function updateLanguageButtonStates() {
    if (currentLanguage === 'en') {
      langEnBtn.classList.add('active-lang');
      langFrBtn.classList.remove('active-lang');
    } else if (currentLanguage === 'fr') {
      langFrBtn.classList.add('active-lang');
      langEnBtn.classList.remove('active-lang');
    }
  }

  if (langEnBtn && langFrBtn) {
    langEnBtn.addEventListener('click', () => setLanguage('en'));
    langFrBtn.addEventListener('click', () => setLanguage('fr'));
  } else {
    console.error('Language switcher buttons not found.');
  }

  setLanguage(currentLanguage);

  window.getTranslationForKey = (key, lang = currentLanguage) => {
    return translations[lang]?.[key] || `MissingKey: ${key}`;
  };
});
