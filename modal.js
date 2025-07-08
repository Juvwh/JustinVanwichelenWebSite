document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded and parsed. modal.js executing.");

  // --- MODAL DATA STORE ---
  let allModalData = {};
  try {
    const modalDataElement = document.getElementById('modalDataStore');
    if (modalDataElement) {
      allModalData = JSON.parse(modalDataElement.textContent);
      console.log("Modal data loaded successfully:", allModalData);
    } else {
      console.warn('Modal data store element #modalDataStore not found. Modals relying on it may not work.');
    }
  } catch (error) {
    console.error('Error parsing modal data from #modalDataStore:', error);
  }

  // --- MODAL ELEMENTS ---
  const modalTriggerButtons = document.querySelectorAll('.section-projet-en-avant .btn, .project-modal-trigger, .game-card'); 
  const modalOverlay = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  
  const modalTitleElement = modalOverlay ? modalOverlay.querySelector('.modal-title') : null;
  const modalDescriptionElement = modalOverlay ? modalOverlay.querySelector('.modal-description') : null;
  const modalVideoIframe = modalOverlay ? modalOverlay.querySelector('.modal-video-container iframe') : null;
  const modalVideoContainer = modalOverlay ? modalOverlay.querySelector('.modal-video-container') : null; 
  const modalHoverImageElement = modalOverlay ? modalOverlay.querySelector('#modal-hover-image') : null; 
  const modalGalleryElement = modalOverlay ? modalOverlay.querySelector('.modal-gallery') : null;
  const modalBadgesContainer = modalOverlay ? modalOverlay.querySelector('.modal-badges') : null;
  const modalPlayButton = modalOverlay ? modalOverlay.querySelector('.modal-play-btn') : null;

  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');
  const lightboxPrevZone = document.getElementById('lightbox-prev-zone');
  const lightboxNextZone = document.getElementById('lightbox-next-zone');

  let currentLightboxImages = [];
  let currentLightboxIndex = 0;

  // --- MODAL FUNCTIONALITY ---

  /**
   * Populates the modal with content.
   * This function takes a data object and updates the modal's title, description,
   * video, badges, gallery, and play button.
   * @param {object} data - The data object for the modal.
   * Expected properties: title, description, videoUrl, badges (array), gallery (array), playUrl.
   */
  function populateModal(data) {
    if (!modalOverlay) {
      console.error("Modal overlay element not found. Cannot populate modal.");
      return;
    }

    if (modalTitleElement && data.titleKey) {
      modalTitleElement.innerHTML = window.getTranslationForKey(data.titleKey) || "Project Title";
    } else if (modalTitleElement) {
      modalTitleElement.textContent = "Project Title";
    }

    if (modalDescriptionElement && data.descriptionKey) {
      const translatedDescription = window.getTranslationForKey(data.descriptionKey) || "Description not available.";
      modalDescriptionElement.innerHTML = translatedDescription.replace(/\n/g, '<br>');
    } else if (modalDescriptionElement) {
      modalDescriptionElement.textContent = "Description not available.";
    }

    if (modalVideoIframe) {
      modalVideoIframe.src = data.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"; 
    }
    
    if (modalBadgesContainer) {
        modalBadgesContainer.innerHTML = '';
        if (data.badges && Array.isArray(data.badges)) {
            data.badges.forEach(badgeData => {
                const badgeEl = document.createElement('span');
                badgeEl.className = 'badge';
                let iconHTML = '';
                if (badgeData.icon) {
                  iconHTML = `<i class="${badgeData.icon}"></i> `;
                }
                const badgeText = badgeData.textKey ? (window.getTranslationForKey(badgeData.textKey) || '') : (badgeData.text || '');
                badgeEl.innerHTML = `${iconHTML}${badgeText}`;
                modalBadgesContainer.appendChild(badgeEl);
            });
        }
    }

    if (modalGalleryElement) {
        modalGalleryElement.innerHTML = ''; 
        currentLightboxImages = [];
        
        if (data.gallery && Array.isArray(data.gallery)) {
            data.gallery.forEach((imgSrc, index) => {
                const imgEl = document.createElement('img');
                imgEl.src = imgSrc;
                let altText = `Gallery image ${index + 1}`;
                if (typeof imgSrc === 'object' && imgSrc.alt) {
                    altText = imgSrc.alt;
                    imgEl.src = imgSrc.src; 
                } else if (data.galleryCaptions && data.galleryCaptions[index]) {
                    altText = data.galleryCaptions[index];
                }
                imgEl.alt = altText; 
                imgEl.className = 'modal-gallery-img';
                
                currentLightboxImages.push({ src: (typeof imgSrc === 'object' ? imgSrc.src : imgSrc), alt: altText });

                imgEl.addEventListener('click', () => {
                    openLightbox(index); 
                });
                if (modalHoverImageElement && modalVideoContainer) {
                  imgEl.addEventListener('mouseover', () => {
                    modalHoverImageElement.src = (typeof imgSrc === 'object' ? imgSrc.src : imgSrc);
                    modalHoverImageElement.style.display = 'block';
                    modalVideoContainer.style.visibility = 'hidden';
                    modalVideoContainer.style.opacity = '0';
                    modalVideoContainer.style.pointerEvents = 'none'; 
                    requestAnimationFrame(() => { 
                        modalHoverImageElement.style.opacity = '1';
                        modalHoverImageElement.style.pointerEvents = 'auto';
                    });
                  });

                  imgEl.addEventListener('mouseout', () => {
                    modalHoverImageElement.style.opacity = '0';
                    modalHoverImageElement.style.pointerEvents = 'none';
                    modalVideoContainer.style.visibility = 'visible';
                    modalVideoContainer.style.opacity = '1';
                    modalVideoContainer.style.pointerEvents = 'auto'; 
                  });
                }
                modalGalleryElement.appendChild(imgEl);
            });
        }
    }
    
    if (modalPlayButton) {
        if (data.playUrl) {
            modalPlayButton.style.display = '';
            modalPlayButton.onclick = () => {
                if (data.playUrl.startsWith('#')) { 
                    window.location.hash = data.playUrl;
                } else { 
                    window.open(data.playUrl, '_blank');
                }
                closeModal(); 
            };
        } else {
            modalPlayButton.style.display = 'none'; 
        }
    }
  }

  /**
   * Opens the modal and populates it with data based on the trigger button.
   * It first tries to get data from the centralized JSON store using `data-modal-id`.
   * If that fails, it falls back to reading individual `data-modal-*` attributes from the button.
   * @param {HTMLElement} triggerButton - The button that triggered the modal.
   */
  function openModal(triggerButton) {
    if (!modalOverlay) {
      console.error("Modal overlay element not found. Cannot open modal.");
      return;
    }

    let modalDataToDisplay = null;
    const modalId = triggerButton.dataset.modalId;

    if (modalId && allModalData[modalId]) {
      console.log(`Fetching data for modalId: ${modalId}`);
      modalDataToDisplay = allModalData[modalId];
    } 
    else {
      console.warn(`Modal ID "${modalId}" not found in data store, or no modalId provided. Falling back to data attributes.`);
      try {
        let galleryItems = [];
        let galleryCaptions = [];
        const rawGalleryDataAttr = triggerButton.dataset.modalGallery;
        if (rawGalleryDataAttr) {
          const parsedGalleryData = JSON.parse(rawGalleryDataAttr);
          if (parsedGalleryData.length > 0 && typeof parsedGalleryData[0] === 'object') {
            galleryItems = parsedGalleryData.map(item => item.src);
            galleryCaptions = parsedGalleryData.map(item => item.alt || item.caption || `Image ${galleryItems.indexOf(item.src) + 1}`);
          } else {
            galleryItems = parsedGalleryData;
            galleryCaptions = galleryItems.map((_, idx) => `Image ${idx + 1}`);
          }
        }
        
        modalDataToDisplay = {
            title: triggerButton.dataset.modalTitle,
            description: triggerButton.dataset.modalDescription,
            videoUrl: triggerButton.dataset.modalVideoUrl,
            badges: JSON.parse(triggerButton.dataset.modalBadges || '[]'),
            gallery: galleryItems,
            galleryCaptions: galleryCaptions,
            playUrl: triggerButton.dataset.modalPlayUrl
        };
      } catch (e) {
        console.error("Error parsing modal data from button attributes:", e);
        modalDataToDisplay = { title: "Error", description: "Could not load modal content." };
      }
    }
    
    if (modalDataToDisplay) {
      populateModal(modalDataToDisplay);
      modalOverlay.classList.add('active'); 
      document.body.classList.add('modal-open'); 
    } else {
      console.error("No data available to populate the modal for button:", triggerButton);
    }
  }

  function closeModal() {
    if (!modalOverlay || !modalOverlay.classList.contains('active')) return; 
    modalOverlay.classList.remove('active');
    document.body.classList.remove('modal-open');
    if (modalVideoIframe) {
      const currentVideoSrc = modalVideoIframe.src;
      modalVideoIframe.src = currentVideoSrc; 
    }
  }

  modalTriggerButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      event.preventDefault(); 
      openModal(button);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) closeModal();
  });


  function showLightboxImage(index) {
    if (!lightbox || !lightboxImg || !lightboxCaption || index < 0 || index >= currentLightboxImages.length) {
        updateLightboxNavControls();
        return;
    }
    currentLightboxIndex = index;
    lightboxImg.style.opacity = 0; 
    lightboxCaption.style.opacity = 0;

    const imageToLoad = new Image();
    imageToLoad.onload = () => {
        lightboxImg.src = currentLightboxImages[currentLightboxIndex].src;
        lightboxCaption.textContent = currentLightboxImages[currentLightboxIndex].alt || ''; 
        lightboxImg.style.opacity = 1;
        lightboxCaption.style.opacity = 1;

        updateLightboxNavControls();
        preloadNeighboringImages();
    };
    imageToLoad.onerror = () => {
        lightboxCaption.textContent = "Error loading image.";
        lightboxImg.src = ""; 
        lightboxImg.style.opacity = 1; 
        lightboxCaption.style.opacity = 1;
        updateLightboxNavControls();
    };
    imageToLoad.src = currentLightboxImages[currentLightboxIndex].src;
  }

  function updateLightboxNavControls() {
    if (!lightboxPrevBtn || !lightboxNextBtn) return;
    if (currentLightboxImages.length <= 1) {
        lightboxPrevBtn.style.display = 'none';
        lightboxNextBtn.style.display = 'none';
        if(lightboxPrevZone) lightboxPrevZone.style.display = 'none';
        if(lightboxNextZone) lightboxNextZone.style.display = 'none';
    } else {
        lightboxPrevBtn.style.display = currentLightboxIndex === 0 ? 'none' : 'block';
        lightboxNextBtn.style.display = currentLightboxIndex === currentLightboxImages.length - 1 ? 'none' : 'block';
        if(lightboxPrevZone) lightboxPrevZone.style.display = currentLightboxIndex === 0 ? 'none' : 'block';
        if(lightboxNextZone) lightboxNextZone.style.display = currentLightboxIndex === currentLightboxImages.length - 1 ? 'none' : 'block';
    }
  }

  function preloadNeighboringImages() {
    if (currentLightboxIndex < currentLightboxImages.length - 1) {
        const nextImg = new Image();
        nextImg.src = currentLightboxImages[currentLightboxIndex + 1].src;
    }

    if (currentLightboxIndex > 0) {
        const prevImg = new Image();
        prevImg.src = currentLightboxImages[currentLightboxIndex - 1].src;
    }
  }

  function openLightbox(startIndex) {
    if (!lightbox || currentLightboxImages.length === 0) return;
    document.body.classList.add('modal-open'); 
    lightbox.classList.add('active');
    showLightboxImage(startIndex);
    document.addEventListener('keydown', handleLightboxKeydown);
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    lightbox.classList.remove('active');
    document.body.classList.remove('modal-open'); 
    lightboxImg.src = ""; 
    lightboxCaption.textContent = "";
    document.removeEventListener('keydown', handleLightboxKeydown);
    

    lightboxJustClosed = true; 
  }
  
  function showNextImage() {
    if (currentLightboxIndex < currentLightboxImages.length - 1) {
      showLightboxImage(currentLightboxIndex + 1);
    }
  }

  function showPrevImage() {
    if (currentLightboxIndex > 0) {
      showLightboxImage(currentLightboxIndex - 1);
    }
  }

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', showPrevImage);
  if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', showNextImage);
  if (lightboxPrevZone) lightboxPrevZone.addEventListener('click', showPrevImage);
  if (lightboxNextZone) lightboxNextZone.addEventListener('click', showNextImage);

  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  function handleLightboxKeydown(event) {
    if (!lightbox.classList.contains('active')) return;
    switch (event.key) {
      case 'Escape':
        event.stopPropagation(); 
        closeLightbox();
        break;
      case 'ArrowRight':
        showNextImage();
        break;
      case 'ArrowLeft':
        showPrevImage();
        break;
    }
  }
  
  // --- Swipe Functionality (Mobile) ---
  let touchstartX = 0;
  let touchendX = 0;

  function handleSwipeGesture() {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    const threshold = 50; 
    if (touchendX < touchstartX - threshold) { 
      showNextImage();
    }
    if (touchendX > touchstartX + threshold) { 
      showPrevImage();
    }
  }

  if (lightbox) {
    lightbox.addEventListener('touchstart', e => {
      touchstartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', e => {
      touchendX = e.changedTouches[0].screenX;
      handleSwipeGesture();
    }, { passive: true });
  }
  let lastWheelTime = 0;
  const wheelThrottle = 300; // ms
  
  function handleMouseWheel(event) {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    
    const currentTime = new Date().getTime();
    if(currentTime - lastWheelTime < wheelThrottle) {
        event.preventDefault(); 
        return;
    }
    lastWheelTime = currentTime;

    if (event.deltaY > 0 || event.deltaX > 0) { // Scroll down or right
        showNextImage();
    } else if (event.deltaY < 0 || event.deltaX < 0) { // Scroll up or left
        showPrevImage();
    }
    event.preventDefault();
  }

  if (lightbox) {

      lightbox.addEventListener('wheel', handleMouseWheel, { passive: false });
  }


  let lightboxJustClosed = false; 

  // Global Escape key listener
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (lightbox.classList.contains('active')) {
      } else if (modalOverlay && modalOverlay.classList.contains('active')) {
        if (lightboxJustClosed) {
          lightboxJustClosed = false;
        } else {
          closeModal();
        }
      }
    }
  });
  

  console.log("Modal and Lightbox scripts initialized.");
  // --- End of DOMContentLoaded ---
});
