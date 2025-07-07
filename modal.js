// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded and parsed. modal.js executing."); // 1. Script start

  // --- MODAL ELEMENTS ---
  const modalTriggerButtons = document.querySelectorAll('.section-projet-en-avant .btn, .project-modal-trigger');
  console.log("Modal Trigger Buttons Found:", modalTriggerButtons); // 2. Log the NodeList

  const modalOverlay = document.getElementById('project-modal');
   const modalCloseBtn = document.getElementById('modal-close-btn');
  
  // Direct references to modal content elements
  const modalTitleElement = modalOverlay ? modalOverlay.querySelector('.modal-title') : null;
  const modalDescriptionElement = modalOverlay ? modalOverlay.querySelector('.modal-description') : null;
  const modalVideoIframe = modalOverlay ? modalOverlay.querySelector('.modal-video-container iframe') : null;
  const modalGalleryElement = modalOverlay ? modalOverlay.querySelector('.modal-gallery') : null;
  const modalBadgesContainer = modalOverlay ? modalOverlay.querySelector('.modal-badges') : null;
  const modalPlayButton = modalOverlay ? modalOverlay.querySelector('.modal-play-btn') : null;

  // --- LIGHTBOX ELEMENTS ---
  // Note: galleryImages will be populated dynamically when modal opens
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');

  // --- MODAL FUNCTIONALITY ---

  function populateModal(data) {
    if (!modalOverlay) return;

    if (modalTitleElement) modalTitleElement.textContent = data.title || "Project Title";
    if (modalDescriptionElement) {
        // Basic sanitization or use a more robust method if HTML content is allowed
        modalDescriptionElement.innerHTML = data.description ? data.description.replace(/\n/g, '<br>') : "Description not available.";
    }
    if (modalVideoIframe) modalVideoIframe.src = data.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ";
    
    if (modalBadgesContainer) {
        modalBadgesContainer.innerHTML = ''; // Clear existing badges
        if (data.badges && Array.isArray(data.badges)) {
            data.badges.forEach(badgeData => {
                const badgeEl = document.createElement('span');
                badgeEl.className = 'badge';
                let iconHTML = '';
                if (badgeData.icon) {
                    iconHTML = `<i class="${badgeData.icon}"></i> `;
                }
                badgeEl.innerHTML = `${iconHTML}${badgeData.text || ''}`;
                modalBadgesContainer.appendChild(badgeEl);
            });
        }
    }

    if (modalGalleryElement) {
        modalGalleryElement.innerHTML = ''; // Clear existing gallery images
        if (data.gallery && Array.isArray(data.gallery)) {
            data.gallery.forEach((imgSrc, index) => {
                const imgEl = document.createElement('img');
                imgEl.src = imgSrc;
                // For lightbox: use current src as hires, or implement data-lightbox-src on trigger button's gallery items
                imgEl.dataset.lightboxSrc = imgSrc; // Or a different URL if provided
                imgEl.alt = `Gallery image ${index + 1}`;
                imgEl.className = 'modal-gallery-img';
                imgEl.addEventListener('click', () => {
                    // Use data-lightbox-src if available, otherwise fallback to src
                    const hiresSrc = imgEl.dataset.lightboxSrc || imgEl.src;
                    openLightbox(hiresSrc);
                });
                modalGalleryElement.appendChild(imgEl);
            });
        }
    }
    
    if (modalPlayButton) {
        if (data.playUrl) {
            modalPlayButton.style.display = '';
            modalPlayButton.onclick = () => {
                // Could be window.open(data.playUrl, '_blank') or other actions
                console.log("Play button clicked for:", data.playUrl);
                // For now, let's make it navigate:
                if (data.playUrl.startsWith('#')) {
                    window.location.hash = data.playUrl;
                } else {
                    window.open(data.playUrl, '_blank');
                }
            };
        } else {
            modalPlayButton.style.display = 'none';
        }
    }
  }

  function openModal(triggerButton) {
    if (!modalOverlay) return;

    const modalData = {
        title: triggerButton.dataset.modalTitle,
        description: triggerButton.dataset.modalDescription,
        videoUrl: triggerButton.dataset.modalVideoUrl,
        badges: JSON.parse(triggerButton.dataset.modalBadges || '[]'),
        gallery: JSON.parse(triggerButton.dataset.modalGallery || '[]'),
        playUrl: triggerButton.dataset.modalPlayUrl
    };
    
    populateModal(modalData);

    modalOverlay.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.classList.remove('modal-open');
    // Stop video when modal closes
    if (modalVideoIframe) {
      const currentVideoSrc = modalVideoIframe.src;
      modalVideoIframe.src = currentVideoSrc; // This reloads the iframe, stopping playback
    }
  }


  modalTriggerButtons.forEach((button, index) => {
    console.log(`Attaching listener to button ${index}:`, button); // 3. Log each button listener attachment
    button.addEventListener('click', (event) => {
      console.log("Modal trigger button clicked:", button); // 4. Log when a button is clicked
      event.preventDefault(); 
      openModal(button);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (event) => {
      if (event.target === modalOverlay) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });

  // --- LIGHTBOX FUNCTIONALITY ---

  function openLightbox(imageSrc) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = imageSrc; 
    lightbox.classList.add('active');
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    lightboxImg.src = ""; 
  }

  // Gallery image event listeners are now added dynamically when modal is populated.

  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closeLightbox);
  }

  // Event listener to close lightbox when clicking on the overlay (outside the image)
  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // Event listener for 'Escape' key to close lightbox
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  // --- End of DOMContentLoaded ---
});
