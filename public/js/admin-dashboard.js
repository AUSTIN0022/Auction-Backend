    import auctions from './Data/auctionData.js';
    
    // DOM elements
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('main');
    const footer = document.getElementById('footer');
    const recentAuctionsTab = document.getElementById('recentAuctionsTab');
    const userActivityTab = document.getElementById('userActivityTab');
    const systemAlertsTab = document.getElementById('systemAlertsTab');
    const auctionTableBody = document.getElementById('auctionTableBody');

    // Logout
    async function logout() {
        if(!confirm("Are you sure you want to Logout")) return;
        try {
            const response = await fetch("/api/auth/logout", {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            
            if (!response.ok) {
                throw new Error(`Logout failed with status: ${response.status}`);
            }
            let data = await response.json();
            console.log(data.message);
            localStorage.clear();
            
            
            window.location.href = "/";
        } catch (error) {
            alert("Error logging out: " + error.message);
            console.error("Logout error:", error);
        }
    }

    const logoutLink = document.querySelector('.logout-link');

    
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    } else {
        console.error("Logout link not found");
    }

    // Function to render auction table
    function renderAuctionTable() {
      auctionTableBody.innerHTML = '';
      
      auctions.forEach(auction => {
        const row = document.createElement('tr');
        
        // Get status class based on auction status
        let statusClass = '';
        switch(auction.status) {
          case 'ACTIVE':
            statusClass = 'status-active';
            break;
          case 'UPCOMING':
            statusClass = 'status-upcoming';
            break;
          case 'ENDED':
            statusClass = 'status-ended';
            break;
          default:
            statusClass = '';
        }
        
        row.innerHTML = `
          <td>#${auction.id}</td>
          <td>${auction.item}</td>
          <td> ${auction.basePrice}</td>
          <td>${auction.currentBid}</td>
          <td><span class="status-pill ${statusClass}">${auction.status}</span></td>
          <td>
            <button class="btn btn-primary btn-sm action-btn" data-auction-id="${auction.id}">
              <i class="fas fa-eye me-1"></i> View
            </button>
          </td>
        `;
        
        auctionTableBody.appendChild(row);
      });
      
      // Add event listeners to view buttons
      document.querySelectorAll('.action-btn').forEach(button => {
        button.addEventListener('click', function() {
          const auctionId = this.getAttribute('data-auction-id');
          alert(`View details for Auction #${auctionId} - This is a demo function.`);
        });
      });
    }

    // Initialize the auction table
    renderAuctionTable();

    // Toggle sidebar
    menuToggle.addEventListener('click', function() {
      menuToggle.classList.toggle('menu-open');
      sidebar.classList.toggle('sidebar-open');
      
      // For desktop view
      if (window.innerWidth >= 992) {
        sidebar.classList.toggle('sidebar-collapsed');
        main.classList.toggle('main-full');
        footer.classList.toggle('footer-full');
      }
    });

    // Handle tab click
    function handleTabClick(e) {
      e.preventDefault();
      
      // Remove active class from all tabs
      recentAuctionsTab.classList.remove('active');
      userActivityTab.classList.remove('active');
      systemAlertsTab.classList.remove('active');
      
      // Add active class to clicked tab
      e.target.classList.add('active');
      
      // Here you would normally update the content based on the selected tab
      alert(`You clicked on "${e.target.textContent}" tab - This functionality is a demo.`);
    }

    // Attach event listeners to tabs
    recentAuctionsTab.addEventListener('click', handleTabClick);
    userActivityTab.addEventListener('click', handleTabClick);
    systemAlertsTab.addEventListener('click', handleTabClick);

    // Handle sidebar menu items
    document.querySelectorAll('.sidebar-menu a').forEach(item => {
      item.addEventListener('click', function(e) {
        if (!this.classList.contains('active')) {
          e.preventDefault();
          
          // For mobile, close the sidebar when clicked
          if (window.innerWidth < 992) {
            sidebar.classList.remove('sidebar-open');
            menuToggle.classList.remove('menu-open');
          }
          
          // Show notification for demo
          alert(`You clicked on "${this.textContent.trim()}" - This is a demo navigation.`);
        }
      });
    });

    // Handle responsive behavior
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 992) {
        // Reset for desktop view
        sidebar.classList.remove('sidebar-open');
        if (menuToggle.classList.contains('menu-open')) {
          main.classList.add('main-full');
          footer.classList.add('footer-full');
          sidebar.classList.add('sidebar-collapsed');
        } else {
          main.classList.remove('main-full');
          footer.classList.remove('footer-full');
          sidebar.classList.remove('sidebar-collapsed');
        }
      } else {
        // Mobile view
        main.classList.remove('main-full');
        footer.classList.remove('footer-full');
        sidebar.classList.remove('sidebar-collapsed');
      }
    });

    // Create New Auction button
    document.querySelector('.create-btn').addEventListener('click', function() {
      window.location.href = './create-auction.html';
    });

    // Set initial responsive state
    if (window.innerWidth < 992) {
      sidebar.classList.remove('sidebar-open');
    }
  