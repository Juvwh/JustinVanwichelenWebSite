// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded and parsed. modal.js executing.");

  // --- MODAL DATA STORE ---
  // This is where all modal content is stored in a structured way.
  // It's fetched from a <script type="application/json"> tag in the HTML.
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
  // References to various parts of the modal structure in the HTML.
  const modalTriggerButtons = document.querySelectorAll('.section-projet-en-avant .btn, .project-modal-trigger, .game-card'); // Added .game-card
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

  // --- ENHANCED LIGHTBOX ELEMENTS ---
  // References to elements used by the image lightbox feature.
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

    // Set modal title
    if (modalTitleElement) {
      modalTitleElement.textContent = data.title || "Project Title";
    }

    // Set modal description (supports HTML content)
    if (modalDescriptionElement) {
      modalDescriptionElement.innerHTML = data.description ? data.description.replace(/\n/g, '<br>') : "Description not available.";
    }

    // Set modal video URL
    if (modalVideoIframe) {
      // Default to a placeholder if no video URL is provided
      modalVideoIframe.src = data.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"; 
    }
    
    // Populate badges
    if (modalBadgesContainer) {
        modalBadgesContainer.innerHTML = ''; // Clear existing badges
        if (data.badges && Array.isArray(data.badges)) {
            data.badges.forEach(badgeData => {
                const badgeEl = document.createElement('span');
                badgeEl.className = 'badge'; // Assuming 'badge' is your CSS class for badges
                let iconHTML = '';
                if (badgeData.icon) {
                  // Creates an <i> element for Font Awesome icons (or similar)
                  iconHTML = `<i class="${badgeData.icon}"></i> `;
                }
                badgeEl.innerHTML = `${iconHTML}${badgeData.text || ''}`;
                modalBadgesContainer.appendChild(badgeEl);
            });
        }
    }

    // Populate gallery images and set up hover/click listeners
    if (modalGalleryElement) {
        modalGalleryElement.innerHTML = ''; // Clear existing gallery images
        currentLightboxImages = []; // Reset images for the lightbox for this specific modal
        
        if (data.gallery && Array.isArray(data.gallery)) {
            data.gallery.forEach((imgSrc, index) => {
                const imgEl = document.createElement('img');
                imgEl.src = imgSrc;
                // Construct alt text: use caption from data if available, otherwise default.
                // This assumes `data.galleryCaptions` might be passed or derived.
                // For simplicity, if `data.gallery` items are strings, alt text will be basic.
                // If `data.gallery` items are objects like {src: "...", alt: "..."}, then use item.alt.
                let altText = `Gallery image ${index + 1}`;
                if (typeof imgSrc === 'object' && imgSrc.alt) {
                    altText = imgSrc.alt;
                    imgEl.src = imgSrc.src; // Adjust if gallery items are objects
                } else if (data.galleryCaptions && data.galleryCaptions[index]) {
                    altText = data.galleryCaptions[index];
                }
                imgEl.alt = altText; 
                imgEl.className = 'modal-gallery-img'; // CSS class for gallery thumbnails
                
                // Store image info for the lightbox
                currentLightboxImages.push({ src: (typeof imgSrc === 'object' ? imgSrc.src : imgSrc), alt: altText });

                // Event listener to open the lightbox when a gallery thumbnail is clicked
                imgEl.addEventListener('click', () => {
                    openLightbox(index); 
                });

                // Hover effect for gallery images (shows image in main video area)
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
    
    // Configure the "Play Demo" button
    if (modalPlayButton) {
        if (data.playUrl) {
            modalPlayButton.style.display = ''; // Show the button
            // Set the action for the play button (navigate or open link)
            modalPlayButton.onclick = () => {
                if (data.playUrl.startsWith('#')) { // Internal link
                    window.location.hash = data.playUrl;
                } else { // External link
                    window.open(data.playUrl, '_blank');
                }
                closeModal(); // Optionally close modal after clicking play
            };
        } else {
            modalPlayButton.style.display = 'none'; // Hide if no play URL
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

    // --- Primary Method: Fetch data from JSON store using modalId ---
    if (modalId && allModalData[modalId]) {
      console.log(`Fetching data for modalId: ${modalId}`);
      modalDataToDisplay = allModalData[modalId];
    } 
    // --- Fallback Method: Read data directly from button attributes ---
    // This is useful for modals not yet migrated to the JSON store or for simpler one-offs.
    else {
      console.warn(`Modal ID "${modalId}" not found in data store, or no modalId provided. Falling back to data attributes.`);
      try {
        // Gallery data parsing from attribute
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
        // Provide default/empty data to prevent errors in populateModal
        modalDataToDisplay = { title: "Error", description: "Could not load modal content." };
      }
    }
    
    if (modalDataToDisplay) {
      populateModal(modalDataToDisplay);
      modalOverlay.classList.add('active'); // Make the modal visible
      document.body.classList.add('modal-open'); // Prevent background scrolling
    } else {
      console.error("No data available to populate the modal for button:", triggerButton);
    }
  }

  /**
   * Closes the modal.
   * It also stops any playing YouTube videos in the modal if an iframe is present.
   */
  function closeModal() {
    if (!modalOverlay || !modalOverlay.classList.contains('active')) return; // Do nothing if modal isn't active
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
