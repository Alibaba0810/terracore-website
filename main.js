﻿// API Configuration - Connect to backend
const API_BASE_URL = window.location.origin + '/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(API_BASE_URL + endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Format price to Naira
function formatPrice(price) {
  return 'N' + parseInt(price).toLocaleString('en-NG');
}

// Load properties from backend API
async function loadPropertiesFromBackend() {
  const propertyDetailsSections = document.querySelectorAll('.property-details');
  if (!propertyDetailsSections.length) return;

  try {
    const result = await apiCall('/properties?featured=true&limit=6');
    const properties = result.data;

    propertyDetailsSections.forEach((section, sectionIndex) => {
      const articles = section.querySelectorAll('article');
      articles.forEach((article, index) => {
        const propertyIndex = sectionIndex * articles.length + index;
        if (properties[propertyIndex]) {
          const p = properties[propertyIndex];
          const img = article.querySelector('.property-img img');
          if (img) img.src = p.image_url || 'img/property3.png';

          const title = article.querySelector('.property-title');
          if (title) title.textContent = p.title;

          const bio = article.querySelector('.property-bio');
          if (bio) bio.textContent = p.description;

          const location = article.querySelector('.location span');
          if (location) location.textContent = p.location;

          const sqm = article.querySelector('.sqm');
          if (sqm) sqm.textContent = (p.area_sqm || 0) + ' sq.meters';

          const price = article.querySelector('.price');
          if (price) price.textContent = formatPrice(p.price);
        }
      });
    });
  } catch (error) {
    console.error('Failed to load properties:', error);
  }
}

// Load building materials from backend API
async function loadMaterialsFromBackend() {
  const buildDetailsSections = document.querySelectorAll('.build-details');
  if (!buildDetailsSections.length) return;

  try {
    const result = await apiCall('/materials?limit=6');
    const materials = result.data;

    buildDetailsSections.forEach((section) => {
      const articles = section.querySelectorAll('article');
      articles.forEach((article, index) => {
        if (materials[index]) {
          const m = materials[index];
          const img = article.querySelector('.build-img img');
          if (img) img.src = m.image_url || 'img/wood door.jpeg';

          const title = article.querySelector('.build-title');
          if (title) title.textContent = m.name;

          const bio = article.querySelector('.build-bio');
          if (bio) bio.textContent = m.description;

          const price = article.querySelector('.price');
          if (price) price.innerHTML = 'Ranges from<br>N' +
            (m.price_min || 0).toLocaleString('en-NG') + ' - N' +
            (m.price_max || 0).toLocaleString('en-NG');
        }
      });
    });
  } catch (error) {
    console.error('Failed to load materials:', error);
  }
}

// Sidebar toggle
// Sidebar toggle (use class toggles for transitions)
function showSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const toggle = document.getElementById('menuToggle');
  if (!sidebar) return;
  sidebar.classList.add('open');
  sidebar.setAttribute('aria-hidden', 'false');
  if (overlay) overlay.classList.add('visible');
  if (overlay) overlay.hidden = false;
  if (toggle) toggle.setAttribute('aria-expanded', 'true');
}

function hideSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const toggle = document.getElementById('menuToggle');
  if (!sidebar) return;
  sidebar.classList.remove('open');
  sidebar.setAttribute('aria-hidden', 'true');
  if (overlay) overlay.classList.remove('visible');
  if (overlay) overlay.hidden = true;
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

// Property Page Carousel - Interactive Hero Section
function initPropertyCarousel() {
  const carousel = document.getElementById('heroCarousel');
  if (!carousel) return;

  const track = carousel.querySelector('.carousel-track');
  const items = carousel.querySelectorAll('.carousel-item');
  const dotsContainer = carousel.querySelector('.carousel-dots');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');

  if (!track || !items.length) return;

  let currentIndex = 0;
  let autoPlayTimer = null;
  let isPaused = false;
  const autoPlayInterval = 5000;

  // Clear any existing dots and create fresh ones
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
  }

  // Create dot indicators
  items.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    if (index === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    dot.addEventListener('click', () => goToSlide(index));
    if (dotsContainer) dotsContainer.appendChild(dot);
  });

  const dots = carousel.querySelectorAll('.carousel-dot');

  // Initialize first slide as active
  if (items.length > 0) {
    items[0].classList.add('active');
  }
  if (dots.length > 0) {
    dots[0].classList.add('active');
  }

  // Go to specific slide
  function goToSlide(index) {
    // Update active class on items
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update active dot
    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Move track
    track.style.transform = `translateX(-${index * 100}%)`;

    currentIndex = index;
  }

  // Next slide
  function nextSlide() {
    const nextIndex = (currentIndex + 1) % items.length;
    goToSlide(nextIndex);
  }

  // Previous slide
  function prevSlide() {
    const prevIndex = (currentIndex - 1 + items.length) % items.length;
    goToSlide(prevIndex);
  }

  // Auto-play functionality
  function startAutoPlay() {
    if (autoPlayTimer) clearTimeout(autoPlayTimer);
    autoPlayTimer = setTimeout(() => {
      if (!isPaused) {
        nextSlide();
        startAutoPlay();
      }
    }, autoPlayInterval);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  // Button event listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoPlay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoPlay();
    });
  }

  // Click on carousel image to go to next slide
  items.forEach((item) => {
    const img = item.querySelector('img');
    if (img) {
      img.addEventListener('click', () => {
        nextSlide();
        startAutoPlay();
      });
    }
  });

  // Pause on hover
  carousel.addEventListener('mouseenter', () => {
    isPaused = true;
    stopAutoPlay();
  });

  carousel.addEventListener('mouseleave', () => {
    isPaused = false;
    startAutoPlay();
  });

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    isPaused = true;
    stopAutoPlay();
  }, { passive: true });

  carousel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    isPaused = false;
    startAutoPlay();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextSlide(); // Swipe left = next
      } else {
        prevSlide(); // Swipe right = prev
      }
    }
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Only handle if carousel is in viewport
    const rect = carousel.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (!isVisible) return;

    if (e.key === 'ArrowLeft') {
      prevSlide();
      startAutoPlay();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      startAutoPlay();
    }
  });

  // Start auto-play
  startAutoPlay();
}

// Legacy carousel (for other pages using .carousel-slide)
let slideIndex = 0;
let carouselTimer = null;
let carouselPaused = false;
function showSlides() {
  const slides = document.querySelectorAll('.carousel-slide');
  if (!slides.length) return;
  slideIndex++;
  if (slideIndex > slides.length) slideIndex = 1;
  // hide all slides and texts
  slides.forEach(slide => {
    slide.classList.remove('active');
    const text = slide.querySelector('.carousel-text');
    if (text) text.classList.remove('visible');
  });
  // show current slide and text
  const currentSlide = slides[slideIndex - 1];
  currentSlide.classList.add('active');
  const currentText = currentSlide.querySelector('.carousel-text');
  if (currentText) currentText.classList.add('visible');
  // schedule next only if not paused
  if (carouselTimer) clearTimeout(carouselTimer);
  carouselTimer = setTimeout(() => {
    if (!carouselPaused) showSlides();
  }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  showSlides();
  // Initialize property page carousel
  initPropertyCarousel();
  
  // ensure sidebar is hidden on load
  hideSidebar();

  const toggle = document.getElementById('menuToggle');
  const closeBtn = document.getElementById('sidebarClose');
  const overlay = document.getElementById('overlay');
  if (toggle) toggle.addEventListener('click', showSidebar);
  if (closeBtn) closeBtn.addEventListener('click', hideSidebar);
  if (overlay) overlay.addEventListener('click', hideSidebar);
  // pause carousel on hover
  const carouselSection = document.querySelector('.carousel-section');
  if (carouselSection) {
    carouselSection.addEventListener('mouseenter', () => { carouselPaused = true; if (carouselTimer) clearTimeout(carouselTimer); });
    carouselSection.addEventListener('mouseleave', () => { carouselPaused = false; showSlides(); });
  }

  // set footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // contact form submit handler: show success note and reset
  const contactForm = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      // show success message
      if (formNote) {
        formNote.hidden = false;
        formNote.setAttribute('aria-hidden', 'false');
        formNote.classList.add('show');
      }
      // reset form
      contactForm.reset();
      // hide after 5s
      setTimeout(() => {
        if (formNote) {
          formNote.hidden = true;
          formNote.setAttribute('aria-hidden', 'true');
          formNote.classList.remove('show');
        }
      }, 5000);
    });
  }

  // wire footer theme buttons (if present) to the same functions and persist selection
  const btnDark = document.getElementById('btnDark');
  const btnLight = document.getElementById('btnLight');
  if (btnDark) btnDark.addEventListener('click', () => { darktheme(); localStorage.setItem('eloke-theme', 'dark'); });
  if (btnLight) btnLight.addEventListener('click', () => { lighttheme(); localStorage.setItem('eloke-theme', 'light'); });
  // apply persisted theme on load and set initial button states
  const savedTheme = localStorage.getItem('eloke-theme');
  if (savedTheme === 'dark') {
    darktheme();
  } else if (savedTheme === 'light') {
    lighttheme();
  } else {
    // Default: light theme active, set button states accordingly
    if (btnLight) {
      btnLight.classList.add('active');
      btnLight.setAttribute('aria-pressed', 'true');
    }
    if (btnDark) {
      btnDark.classList.remove('active');
      btnDark.setAttribute('aria-pressed', 'false');
    }
  }

  // Scroll reveal using IntersectionObserver
  const revealSelector = ['section:not(.carousel-section)', '.property-details article', '.review-wrapper', '.build-details article', '.about', '.carousel-text'].join(',');
  const revealNodes = Array.from(document.querySelectorAll(revealSelector));
  revealNodes.forEach(n => n.classList.add('reveal'));
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  revealNodes.forEach(n => revealObserver.observe(n));

  // Simple image lightbox for property images
  function openImageModal(src, alt) {
    const modal = document.createElement('div');
    modal.className = 'img-modal';
    modal.innerHTML = `<button class="close-modal" aria-label="Close image">\u2715</button><img src="${src}" alt="${alt || ''}">`;
    document.body.appendChild(modal);
    const close = modal.querySelector('.close-modal');
    function removeModal() {
      modal.remove();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') removeModal(); }
    close.addEventListener('click', removeModal);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) removeModal(); });
    document.addEventListener('keydown', onKey);
  }

  document.body.addEventListener('click', (e) => {
    const img = e.target.closest('.property-img img');
    if (img) { openImageModal(img.src, img.alt); }
  });
});

// Theme toggles
const body = document.body;
function darktheme() {
  body.classList.add('dark');
  // Update theme toggle button states
  const btnDark = document.getElementById('btnDark');
  const btnLight = document.getElementById('btnLight');
  if (btnDark) {
    btnDark.classList.add('active');
    btnDark.setAttribute('aria-pressed', 'true');
  }
  if (btnLight) {
    btnLight.classList.remove('active');
    btnLight.setAttribute('aria-pressed', 'false');
  }
}

function lighttheme() {
  body.classList.remove('dark');
  // Update theme toggle button states
  const btnDark = document.getElementById('btnDark');
  const btnLight = document.getElementById('btnLight');
  if (btnDark) {
    btnDark.classList.remove('active');
    btnDark.setAttribute('aria-pressed', 'false');
  }
  if (btnLight) {
    btnLight.classList.add('active');
    btnLight.setAttribute('aria-pressed', 'true');
  }
}

// ---------- Team bio modal (open/close logic) ----------
let __lastFocusedTeamButton = null;
function openTeamModal({ name, role, bio, imgSrc }) {
  // build modal
  const modal = document.createElement('div');
  modal.className = 'team-modal';
  modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-label="${name} bio">
      <button class="modal-close" aria-label="Close">\u2715</button>
      <div class="modal-photo"><img src="${imgSrc}" alt="${name}"></div>
      <div class="modal-body">
        <h3>${name}</h3>
        <div class="modal-role">${role}</div>
        <div class="modal-bio">${bio}</div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.modal-close');
  function remove() {
    modal.remove();
    document.removeEventListener('keydown', onKey);
    if (__lastFocusedTeamButton) __lastFocusedTeamButton.focus();
  }
  function onKey(e) { if (e.key === 'Escape') remove(); }
  closeBtn.addEventListener('click', remove);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) remove(); });
  document.addEventListener('keydown', onKey);
  closeBtn.focus();
}

// delegate clicks for team cards (open bio on button or on photo)
document.body.addEventListener('click', (e) => {
  const btn = e.target.closest('.team-open-bio');
  if (btn) {
    const card = btn.closest('.team-card');
    if (!card) return;
    const name = card.querySelector('.team-name').textContent.trim();
    const role = card.querySelector('.team-role').textContent.trim();
    const bioEl = card.querySelector('.team-full-bio');
    const bio = bioEl ? bioEl.textContent.trim() : card.querySelector('.team-bio').textContent.trim();
    const img = card.querySelector('.team-photo img');
    const imgSrc = img ? img.src : '';
    __lastFocusedTeamButton = btn;
    openTeamModal({ name, role, bio, imgSrc });
    return;
  }

  const photo = e.target.closest('.team-photo');
  if (photo) {
    const card = photo.closest('.team-card');
    if (!card) return;
    const name = card.querySelector('.team-name').textContent.trim();
    const role = card.querySelector('.team-role').textContent.trim();
    const bioEl = card.querySelector('.team-full-bio');
    const bio = bioEl ? bioEl.textContent.trim() : card.querySelector('.team-bio').textContent.trim();
    const img = card.querySelector('.team-photo img');
    const imgSrc = img ? img.src : '';
    __lastFocusedTeamButton = photo;
    openTeamModal({ name, role, bio, imgSrc });
    return;
  }
});

// Listing form handler: render submission and open WhatsApp for approval
(function () {
  const form = document.getElementById('listForm');
  const listingsWrap = document.querySelector('.user-listings');

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function createListingCard(data) {
    const art = document.createElement('article');
    art.className = 'card pending-card';
    art.innerHTML = `<img src="${data.image || 'img/property3.png'}" alt="${escapeHtml(data.title)}">
   <div class="card-body">
        <h3>${escapeHtml(data.title)}</h3>
        <p>${escapeHtml(data.description)}</p>
        <div class="meta">${escapeHtml(data.price || 'Contact')}</div>
        <div class="status">Status: <span class="badge">Pending approval</span></div>
    </div>`;
    return art;
  }

  if (form && listingsWrap) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = {
        title: form.matTitle.value.trim(),
        type: form.matType.value,
        location: form.location.value.trim(),
        price: form.price.value.trim(),
        name: form.contactName.value.trim(),
        phone: form.contactPhone.value.trim(),
        image: form.imageUrl.value.trim(),
        description: form.description.value.trim()
      };

      // Render locally as pending
      const card = createListingCard({
        title: data.title || (data.type + ' listing'),
        description: data.description || (data.type + ' at ' + data.location),
        price: data.price,
        image: data.image
      });
      listingsWrap.prepend(card);

      // Open WhatsApp to request approval with prefilled message
      const phone = '2348148742229';
      const msg = `Requesting listing approval%0ATitle: ${encodeURIComponent(data.title)}%0AType: ${encodeURIComponent(data.type)}%0ALocation: ${encodeURIComponent(data.location)}%0APrice: ${encodeURIComponent(data.price)}%0AContact: ${encodeURIComponent(data.name)} ${encodeURIComponent(data.phone)}`;
      const wa = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(wa, '_blank');

      form.reset();
    });
  }
})();

document.addEventListener("DOMContentLoaded", function () {

  function typeEffect(element, text, speed, delay = 0) {
    let i = 0;
    setTimeout(() => {
      function typing() {
        if (i < text.length) {
          element.innerHTML += text.charAt(i);
          i++;
          setTimeout(typing, speed);
        }
      }
      typing();
    }, delay);
  }

  const title = document.getElementById("typed-title");
  const subtitle = document.getElementById("typed-subtitle");
  const tagline = document.getElementById("typed-tagline");

  typeEffect(title, "Welcome to TerraCore Solutions", 60);
  typeEffect(subtitle, "Secure Land & Property Solutions You Can Trust", 40, 2500);
  typeEffect(tagline, "Building Value • Creating Opportunities", 40, 5000);

});

document.addEventListener("DOMContentLoaded", function () {

  const heroContent = document.querySelector(".hero-content");
  const heroSection = document.querySelector(".hero-section");
  const ambientSound = document.getElementById("ambientSound");

  
  setTimeout(() => {
    heroContent.classList.add("show");
  }, 800);

  
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      heroSection.classList.add("scrolled");
    } else {
      heroSection.classList.remove("scrolled");
    }
  });

  
  document.addEventListener("click", () => {
    ambientSound.volume = 0.25;
    ambientSound.play().catch(() => { });
  }, { once: true });

});
document.querySelectorAll('.slider').forEach(slider => {

    let slides = slider.querySelectorAll('img');
    let current = 0;

    function nextSlide() {
        slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
    }

    setInterval(nextSlide, 3000); // Change every 3 seconds

});
// IMAGE SLIDER FOR PROPERTY & BUILD MATERIALS
document.querySelectorAll('.slider').forEach(slider => {

  let slides = slider.querySelectorAll('img');
  let current = 0;

  function nextSlide() {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }

  setInterval(nextSlide, 3000); // 3 seconds

});

