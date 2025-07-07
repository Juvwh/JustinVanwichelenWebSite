// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded and parsed. modal.js executing.");

  // --- MODAL ELEMENTS ---
  const modalTriggerButtons = document.querySelectorAll('.section-projet-en-avant .btn, .project-modal-trigger, .game-card'); // Added .game-card
  const modalOverlay = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  
  const modalTitleElement = modalOverlay ? modalOverlay.querySelector('.modal-title') : null;
  const modalDescriptionElement = modalOverlay ? modalOverlay.querySelector('.modal-description') : null;
  const modalVideoIframe = modalOverlay ? modalOverlay.querySelector('.modal-video-container iframe') : null;
  const modalVideoContainer = modalOverlay ? modalOverlay.querySelector('.modal-video-container') : null; // MODIFICATION: Get the video container itself
  const modalHoverImageElement = modalOverlay ? modalOverlay.querySelector('#modal-hover-image') : null; // MODIFICATION: Get reference to the hover image display element
  const modalGalleryElement = modalOverlay ? modalOverlay.querySelector('.modal-gallery') : null;
  const modalBadgesContainer = modalOverlay ? modalOverlay.querySelector('.modal-badges') : null;
  const modalPlayButton = modalOverlay ? modalOverlay.querySelector('.modal-play-btn') : null;

  // --- ENHANCED LIGHTBOX ELEMENTS ---
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');
  const lightboxPrevZone = document.getElementById('lightbox-prev-zone');
  const lightboxNextZone = document.getElementById('lightbox-next-zone');

  let currentLightboxImages = []; // To store {src, alt} for current gallery
  let currentLightboxIndex = 0;

  // --- MODAL FUNCTIONALITY ---

  function populateModal(data) {
    if (!modalOverlay) return;

    if (modalTitleElement) modalTitleElement.textContent = data.title || "Project Title";
    if (modalDescriptionElement) {
        modalDescriptionElement.innerHTML = data.description ? data.description.replace(/\n/g, '<br>') : "Description not available.";
    }
    if (modalVideoIframe) modalVideoIframe.src = data.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"; // Placeholder
    
    if (modalBadgesContainer) {
        modalBadgesContainer.innerHTML = ''; 
        if (data.badges && Array.isArray(data.badges)) {
            data.badges.forEach(badgeData => {
                const badgeEl = document.createElement('span');
                badgeEl.className = 'badge';
                let iconHTML = '';
                if (badgeData.icon) iconHTML = `<i class="${badgeData.icon}"></i> `;
                badgeEl.innerHTML = `${iconHTML}${badgeData.text || ''}`;
                modalBadgesContainer.appendChild(badgeEl);
            });
        }
    }

    if (modalGalleryElement) {
        modalGalleryElement.innerHTML = ''; 
        currentLightboxImages = []; // Reset for current modal
        if (data.gallery && Array.isArray(data.gallery)) {
            data.gallery.forEach((imgSrc, index) => {
                const imgEl = document.createElement('img');
                imgEl.src = imgSrc;
                // For caption: use a default or encourage data-caption on source `<a>` or in gallery array
                // For now, using a placeholder alt based on index for the thumbnail
                const altText = `Gallery image ${index + 1}${data.galleryCaptions && data.galleryCaptions[index] ? `: ${data.galleryCaptions[index]}` : ''}`;
                imgEl.alt = altText; 
                imgEl.className = 'modal-gallery-img';
                
                // Store for lightbox
                currentLightboxImages.push({ src: imgSrc, alt: altText });

                imgEl.addEventListener('click', () => {
                    openLightbox(index); // Open lightbox with the clicked image's index
                });

                // MODIFICATION START: Add hover effect for gallery images to show in video area
                if (modalHoverImageElement && modalVideoContainer) {
                  imgEl.addEventListener('mouseover', () => {
                    // Show hovered image, hide video
                    modalHoverImageElement.src = imgSrc;
                    modalHoverImageElement.style.display = 'block';
                    // Show hovered image, hide video
                    // Use visibility and opacity for video container to prevent layout shift
                    modalVideoContainer.style.visibility = 'hidden';
                    modalVideoContainer.style.opacity = '0';
                    modalVideoContainer.style.pointerEvents = 'none'; // Prevent interaction with hidden video

                    modalHoverImageElement.src = imgSrc;
                    modalHoverImageElement.style.display = 'block'; // Make it visible in layout
                    requestAnimationFrame(() => { // Ensure display block is applied before opacity transition
                        modalHoverImageElement.style.opacity = '1';
                        modalHoverImageElement.style.pointerEvents = 'auto';
                    });
                  });

                  imgEl.addEventListener('mouseout', () => {
                    // Show video, hide hovered image
                    modalHoverImageElement.style.opacity = '0';
                    modalHoverImageElement.style.pointerEvents = 'none';
                    // Can set modalHoverImageElement.style.display = 'none' after transition if needed,
                    // but opacity 0 and pointer-events none should suffice for an absolutely positioned element.
                    // For simplicity, we'll rely on opacity and pointer-events for now.
                    // If performance becomes an issue with many transparent items, display:none could be added on transitionend.

                    modalVideoContainer.style.visibility = 'visible';
                    modalVideoContainer.style.opacity = '1';
                    modalVideoContainer.style.pointerEvents = 'auto'; // Make video interactive again
                  });
                }
                // MODIFICATION END: Gallery image hover effect

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
            };
        } else {
            modalPlayButton.style.display = 'none';
        }
    }
  }

  function openModal(triggerButton) {
    if (!modalOverlay) return;

    // Extract gallery data. If `data-modal-gallery` contains objects with src and alt:
    let galleryItems = [];
    let galleryCaptions = []; // Optional, if captions are separate
    try {
        const rawGalleryData = JSON.parse(triggerButton.dataset.modalGallery || '[]');
        if (rawGalleryData.length > 0 && typeof rawGalleryData[0] === 'object') {
            galleryItems = rawGalleryData.map(item => item.src);
            // Assuming 'alt' or 'caption' field in the object for captions
            galleryCaptions = rawGalleryData.map(item => item.alt || item.caption || `Image ${galleryItems.indexOf(item.src) + 1}`);
        } else {
            galleryItems = rawGalleryData; // Assumes array of strings
            // Default captions if not objects
            galleryCaptions = galleryItems.map((_, idx) => `Image ${idx + 1}`);
        }
    } catch (e) {
        console.error("Error parsing modal gallery data:", e);
        galleryItems = [];
        galleryCaptions = [];
    }

    const modalData = {
        title: triggerButton.dataset.modalTitle,
        description: triggerButton.dataset.modalDescription,
        videoUrl: triggerButton.dataset.modalVideoUrl,
        badges: JSON.parse(triggerButton.dataset.modalBadges || '[]'),
        gallery: galleryItems,
        galleryCaptions: galleryCaptions, // Pass captions to populateModal
        playUrl: triggerButton.dataset.modalPlayUrl
    };
    
    populateModal(modalData);

    modalOverlay.classList.add('active');
    document.body.classList.add('modal-open');
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

  // --- ENHANCED LIGHTBOX FUNCTIONALITY ---

  function showLightboxImage(index) {
    if (!lightbox || !lightboxImg || !lightboxCaption || index < 0 || index >= currentLightboxImages.length) {
        // Optionally hide arrows if no images or at ends, handled by updateLightboxNavControls
        updateLightboxNavControls();
        return;
    }
    currentLightboxIndex = index;
    lightboxImg.style.opacity = 0; // Fade out current image
    lightboxCaption.style.opacity = 0;

    // Preload current image before fully showing (though browser might do this well)
    const imageToLoad = new Image();
    imageToLoad.onload = () => {
        lightboxImg.src = currentLightboxImages[currentLightboxIndex].src;
        lightboxCaption.textContent = currentLightboxImages[currentLightboxIndex].alt || ''; // Use alt as caption
        // Comments: To customize captions, ensure `alt` attribute of `modal-gallery-img` is set,
        // or modify `currentLightboxImages` to include a dedicated caption property from `data-modal-gallery`.
        
        // Fade in new image
        lightboxImg.style.opacity = 1;
        lightboxCaption.style.opacity = 1;

        updateLightboxNavControls();
        preloadNeighboringImages();
    };
    imageToLoad.onerror = () => {
        lightboxCaption.textContent = "Error loading image.";
        lightboxImg.src = ""; // Clear broken image
        lightboxImg.style.opacity = 1; // Show error message if any
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
    // Comments: Preloading next/previous images for smoother navigation.
    // Preload next
    if (currentLightboxIndex < currentLightboxImages.length - 1) {
        const nextImg = new Image();
        nextImg.src = currentLightboxImages[currentLightboxIndex + 1].src;
    }
    // Preload previous
    if (currentLightboxIndex > 0) {
        const prevImg = new Image();
        prevImg.src = currentLightboxImages[currentLightboxIndex - 1].src;
    }
  }

  function openLightbox(startIndex) {
    if (!lightbox || currentLightboxImages.length === 0) return;
    document.body.classList.add('modal-open'); // Prevent body scroll
    lightbox.classList.add('active');
    showLightboxImage(startIndex);
    // Add keydown listener when lightbox opens, remove when closes
    document.addEventListener('keydown', handleLightboxKeydown);
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    lightbox.classList.remove('active');
    document.body.classList.remove('modal-open'); // Re-enable body scroll
    lightboxImg.src = ""; // Clear image
    lightboxCaption.textContent = "";
    document.removeEventListener('keydown', handleLightboxKeydown);
    
    // Signal that lightbox was just closed to prevent modal from closing on the same Escape press.
    lightboxJustClosed = true; 
    // This flag will be reset by the global Escape handler or by opening modal again.
    // To be absolutely safe, also reset it if modal is opened and lightbox isn't the target.
    // However, the current global handler logic should suffice.
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

  // Event listeners for lightbox controls
  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', showPrevImage);
  if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', showNextImage);
  if (lightboxPrevZone) lightboxPrevZone.addEventListener('click', showPrevImage);
  if (lightboxNextZone) lightboxNextZone.addEventListener('click', showNextImage);

  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      // Close if clicked on the overlay itself, not on image, caption or controls
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  function handleLightboxKeydown(event) {
    if (!lightbox.classList.contains('active')) return;
    switch (event.key) {
      case 'Escape':
        event.stopPropagation(); // Prevent this Escape from also closing the modal
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
    const threshold = 50; // Minimum swipe distance
    if (touchendX < touchstartX - threshold) { // Swiped left
      showNextImage();
    }
    if (touchendX > touchstartX + threshold) { // Swiped right
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

  // --- Mouse Wheel Navigation (Optional) ---
  // Comments: Mouse wheel to navigate images. Can be sensitive, use with caution or make configurable.
  let lastWheelTime = 0;
  const wheelThrottle = 300; // ms
  
  function handleMouseWheel(event) {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    
    const currentTime = new Date().getTime();
    if(currentTime - lastWheelTime < wheelThrottle) {
        event.preventDefault(); // Prevent rapid scrolling if still within throttle
        return;
    }
    lastWheelTime = currentTime;

    if (event.deltaY > 0 || event.deltaX > 0) { // Scroll down or right
        showNextImage();
    } else if (event.deltaY < 0 || event.deltaX < 0) { // Scroll up or left
        showPrevImage();
    }
    event.preventDefault(); // Prevent page scroll while lightbox is open
  }

  if (lightbox) {
      // Consider adding this listener only when lightbox is active for performance
      // For now, it's general but checks if lightbox is active internally.
      // Use 'wheel' event. 'mousewheel' is deprecated.
      lightbox.addEventListener('wheel', handleMouseWheel, { passive: false });
  }


  let lightboxJustClosed = false; // Flag to signal lightbox closure

  // Global Escape key listener
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (lightbox.classList.contains('active')) {
        // This case should ideally be fully handled by handleLightboxKeydown,
        // including stopPropagation. This is a fallback.
        // handleLightboxKeydown will call closeLightbox, which sets lightboxJustClosed.
        // No direct action here, rely on handleLightboxKeydown.
      } else if (modalOverlay && modalOverlay.classList.contains('active')) {
        if (lightboxJustClosed) {
          // If lightbox was just closed by this Escape sequence, don't also close modal.
          // Reset flag for next Escape press.
          lightboxJustClosed = false;
        } else {
          closeModal();
        }
      }
    }
  });
  
  // Comments:
  // - How to add/remove images: Modify the `data-modal-gallery` attribute in `index.html`.
  //   It should be a JSON array of image URLs, e.g., `["img1.jpg", "img2.png"]`.
  //   Or an array of objects: `[{"src": "img1.jpg", "alt": "Caption 1"}, ...]`
  // - How to customize captions: Provide 'alt' text in the `data-modal-gallery` objects,
  //   or ensure the dynamically created `<img>` tags in the small modal gallery have descriptive `alt` attributes.
  //   The script currently uses the 'alt' attribute of the images in `currentLightboxImages`.
  // - How to change image size: Image sizing is primarily controlled by CSS in `style.css` (e.g., `.lightbox-image` max-width/height).
  // - How to change transitions: Transitions are CSS-based. See `.lightbox`, `.lightbox-image`, `.lightbox-caption` in `style.css`.
  // - How to change dark/light style: Dark/light mode adaptations for controls are in `style.css` using CSS variables
  //   (e.g., `--lightbox-controls-color-dark`, `--lightbox-controls-color-light`).

  console.log("Modal and Lightbox scripts initialized.");
  // --- End of DOMContentLoaded ---
});
