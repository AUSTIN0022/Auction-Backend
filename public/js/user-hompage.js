
document.addEventListener('DOMContentLoaded', function() {
    
    loadFeaturedAuctions();
    
    
    loadEndingSoonAuctions();
    
    
    loadTestimonials();
    
    
    initializeEventListeners();
  });
  
  /**
   * Load featured auctions into the homepage
   */
  function loadFeaturedAuctions() {
    const featuredAuctionsContainer = document.getElementById('featured-auctions');
    
    if (!featuredAuctionsContainer) return;
    
    featuredAuctionsContainer.innerHTML = '';
    
    featuredAuctions.forEach(auction => {
      const auctionCard = createAuctionCard(auction);
      featuredAuctionsContainer.appendChild(auctionCard);
    });
  }
  
  /**
   * Load auctions ending soon into the homepage
   */
  function loadEndingSoonAuctions() {
    const endingSoonContainer = document.getElementById('ending-soon');
    
    if (!endingSoonContainer) return;
    
    endingSoonContainer.innerHTML = '';
    
    endingSoonAuctions.forEach(auction => {
      const auctionCard = createAuctionCard(auction);
      endingSoonContainer.appendChild(auctionCard);
    });
  }
  
  /**
   * Load user testimonials
   */
  function loadTestimonials() {
    const testimonialsContainer = document.getElementById('testimonials');
    
    if (!testimonialsContainer) return;
    
    testimonialsContainer.innerHTML = '';
    
    testimonials.forEach(testimonial => {
      const testimonialCard = createTestimonialCard(testimonial);
      testimonialsContainer.appendChild(testimonialCard);
    });
  }
  

  function createAuctionCard(auction) {
    const cardCol = document.createElement('div');
    cardCol.className = 'col-md-3 mb-4';
    
    const statusClass = auction.status === 'active' ? 'status-active' : 
                        auction.status === 'upcoming' ? 'status-upcoming' : 
                        auction.status === 'ended' ? 'status-ended' : '';
    
    const statusText = auction.status === 'active' ? 'Active' : 
                       auction.status === 'upcoming' ? 'Upcoming' : 
                       auction.status === 'ended' ? 'Ended' : '';
    
    const timeLabel = auction.status === 'upcoming' ? 'Starts in' : 'Ends in';
    
    cardCol.innerHTML = `
      <div class="card h-100 border-0 shadow-sm">
        <div class="bg-secondary" style="height:180px;display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-${auction.image} text-white fs-1"></i>
        </div>
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="status-pill ${statusClass}">${statusText}</span>
            <small class="text-muted">${timeLabel} ${auction.endsIn}</small>
          </div>
          <h5 class="card-title mb-1">${auction.title}</h5>
          <p class="text-muted small mb-3">#${auction.id}</p>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <p class="text-muted mb-0 small">${auction.status === 'upcoming' ? 'Base Price' : 'Current Bid'}</p>
              <p class="fs-5 fw-bold mb-0">₹${formatNumber(auction.status === 'upcoming' ? auction.basePrice : auction.currentBid)}</p>
            </div>
            <button class="btn btn-sm btn-outline-danger">
              <i class="far fa-heart"></i>
            </button>
          </div>
          <button class="btn ${auction.status === 'active' ? 'btn-primary' : 'btn-outline-primary'} w-100 rounded-pill">
            ${auction.status === 'active' ? 'Bid Now' : auction.status === 'upcoming' ? 'Remind Me' : 'View Details'}
          </button>
        </div>
      </div>
    `;
    
    return cardCol;
  }
  
  function createTestimonialCard(testimonial) {
    const cardCol = document.createElement('div');
    cardCol.className = 'col-md-4 mb-4';
    
    // Create star rating HTML
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      const starClass = i <= testimonial.rating ? 'fas fa-star text-warning' : 'far fa-star text-warning';
      starsHtml += `<i class="${starClass}"></i>`;
    }
    
    cardCol.innerHTML = `
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body p-4 text-center">
          <div class="mb-3">
            ${starsHtml}
          </div>
          <p class="mb-4">"${testimonial.comment}"</p>
          <div class="d-flex justify-content-center align-items-center">
            <div class="bg-secondary rounded-circle" style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
              <i class="fas fa-user text-white"></i>
            </div>
            <div class="ms-3 text-start">
              <h5 class="mb-0">${testimonial.name}</h5>
              <p class="text-muted mb-0">${testimonial.role}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return cardCol;
  }
  
  /**
   * Initialize event listeners for interactive elements
   */
  function initializeEventListeners() {
    // Category buttons
    const categoryButtons = document.querySelectorAll('.categories .btn');
    categoryButtons.forEach(button => {
      button.addEventListener('click', function() {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
    
    // Search bar functionality
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    
    if (searchButton && searchInput) {
      searchButton.addEventListener('click', function() {
        const searchQuery = searchInput.value.trim();
        if (searchQuery) {
          alert(`Searching for: ${searchQuery}`);
          // In a real application, this would navigate to search results
        }
      });
      
      // Enable enter key search
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          searchButton.click();
        }
      });
    }
  }
  
  /**
   * Format number with commas for Indian number system (lakhs, crores)
   * @param {number} number - Number to format
   * @returns {string} - Formatted number string
   */
  function formatNumber(number) {
    // Convert to Indian number format (lakhs, crores)
    if (number >= 10000000) {
      return (number / 10000000).toFixed(2) + ' Cr';
    } else if (number >= 100000) {
      return (number / 100000).toFixed(2) + ' L';
    } else {
      return new Intl.NumberFormat('en-IN').format(number);
    }
  }