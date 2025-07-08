document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');

  if (!navbar) {
    console.error('Navbar element not found. Check class name.');
    return;
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 0) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  });

  const hamburgerBtn = document.querySelector('.hamburger-menu');
  const navLinksGroup = document.querySelector('.navbar .nav-links-group');

  if (hamburgerBtn && navLinksGroup) {
    hamburgerBtn.addEventListener('click', () => {
      const isMenuOpen = hamburgerBtn.classList.toggle('open');
      navLinksGroup.classList.toggle('mobile-menu-open');
      hamburgerBtn.setAttribute('aria-expanded', isMenuOpen);
    });

    // Close menu when a link is clicked
    const navLinks = navLinksGroup.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navLinksGroup.classList.contains('mobile-menu-open')) {
          hamburgerBtn.classList.remove('open');
          navLinksGroup.classList.remove('mobile-menu-open');
          hamburgerBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  } else {
    console.error('Hamburger button or nav links group not found. Check class names.');
  }
});
