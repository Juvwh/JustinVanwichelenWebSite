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
});
