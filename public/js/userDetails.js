
// Get userId from URL
function getUserIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

// Format date function
function formatDate(dateString) {
    const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
    }).format(amount);
}

// Get verification status badge HTML
function getVerificationStatusBadge(status) {
    let badgeClass = '';
    switch(status.toLowerCase()) {
    case 'verified':
        badgeClass = 'status-verified';
        break;
    case 'rejected':
        badgeClass = 'status-rejected';
        break;
    default:
        badgeClass = 'status-pending';
    }
    
    return `<span class="status-badge ${badgeClass}">${status}</span>`;
}

// Get account status badge HTML
function getAccountStatusBadge(isActive) {
    if (isActive) {
    return '<span class="badge bg-success">Active</span>';
    } else {
    return '<span class="badge bg-danger">Inactive</span>';
    }
}

// Load user data
async function loadUserData() {
    const userId = getUserIdFromUrl();
    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('userData').style.display = 'none';
    document.getElementById('errorAlert').style.display = 'none';
    
    try {
    const response = await fetch(`/api/admin/users/${userId}`,{
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
    }
    
    const userData = await response.json();
    displayUserData(userData);
    } catch (error) {
    console.error('Error loading user data:', error);
    document.getElementById('errorMessage').textContent = error.message || 'Error loading user data';
    document.getElementById('errorAlert').style.display = 'block';
    } finally {
    document.getElementById('loadingSpinner').style.display = 'none';
    }
}

// Display user data
function displayUserData(user) {
    // Update breadcrumb
    document.getElementById('breadcrumb-username').textContent = user.name;
    
    // Update user details
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userId').textContent = user._id;
    document.getElementById('displayUserId').textContent = user._id;
    document.getElementById('displayName').textContent = user.name;
    document.getElementById('displayEmail').textContent = user.email;
    document.getElementById('displayMobile').textContent = user.mobile;
    document.getElementById('displayCreatedAt').textContent = formatDate(user.createdAt);
    document.getElementById('displayVerifyStatus').innerHTML = getVerificationStatusBadge(user.verifyStatus);
    document.getElementById('displayAccountStatus').innerHTML = getAccountStatusBadge(user.isActive);
    
    // Update wallet info
    document.getElementById('displayBalance').textContent = formatCurrency(user.wallet.balance, user.wallet.currency);
    
    // Update ID proof image
    if (user.idProof) {
    document.getElementById('idProofImage').src = user.idProof;
    }
    
    // Update transactions
    const transactionsContainer = document.getElementById('transactionsContainer');
    const noTransactions = document.getElementById('noTransactions');
    
    if (user.wallet.transactions && user.wallet.transactions.length > 0) {
    noTransactions.style.display = 'none';
    
    // Clear existing transactions
    const existingTransactions = transactionsContainer.querySelectorAll('.transaction-item');
    existingTransactions.forEach(item => item.remove());
    
    // Add new transactions
    user.wallet.transactions.forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item d-flex justify-content-between';
        
        const isDeposit = transaction.amount > 0;
        const amountClass = isDeposit ? 'transaction-deposit' : 'text-danger';
        const amountPrefix = isDeposit ? '+' : '';
        
        transactionItem.innerHTML = `
        <div>
            <div>${transaction.description || 'Transaction'}</div>
            <small class="text-muted">${formatDate(transaction.date)}</small>
        </div>
        <div class="transaction-amount ${amountClass}">${amountPrefix}${formatCurrency(transaction.amount)}</div>
        `;
        
        transactionsContainer.appendChild(transactionItem);
    });
    } else {
    noTransactions.style.display = 'block';
    }
    
    // Update activity log
    const activityLog = document.getElementById('activityLog');
    activityLog.innerHTML = ''; // Clear existing logs
    
    // Add account creation log
    const creationLog = document.createElement('tr');
    creationLog.className = 'border-bottom';
    creationLog.innerHTML = `
    <td class="ps-0 py-2 text-secondary small">${formatDate(user.createdAt)}</td>
    <td class="py-2">Account created</td>
    `;
    activityLog.appendChild(creationLog);
    
    // Add ID upload log if ID exists
    if (user.idProof) {
    const idUploadLog = document.createElement('tr');
    idUploadLog.className = 'border-bottom';
    idUploadLog.innerHTML = `
        <td class="ps-0 py-2 text-secondary small">${formatDate(user.createdAt)}</td>
        <td class="py-2">ID Document uploaded</td>
    `;
    activityLog.appendChild(idUploadLog);
    }
    
    // Add verification status log
    if (user.verifyStatus !== 'pending') {
    const verificationLog = document.createElement('tr');
    verificationLog.className = 'border-bottom';
    verificationLog.innerHTML = `
        <td class="ps-0 py-2 text-secondary small">${formatDate(user.updatedAt)}</td>
        <td class="py-2">Verification ${user.verifyStatus}</td>
    `;
    activityLog.appendChild(verificationLog);
    }
    
    // Update action buttons based on verification status
    updateActionButtons(user.verifyStatus);
    
    // Show user data
    document.getElementById('userData').style.display = 'block';
}

// Update action buttons based on verification status
function updateActionButtons(verifyStatus) {
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    
    if (verifyStatus.toLowerCase() === 'verified') {
    approveBtn.style.display = 'none';
    rejectBtn.textContent = 'Revoke Verification';
    } else if (verifyStatus.toLowerCase() === 'rejected') {
    rejectBtn.style.display = 'none';
    approveBtn.textContent = 'Approve Verification';
    } else {
    approveBtn.style.display = 'block';
    rejectBtn.style.display = 'block';
    approveBtn.textContent = 'Approve Verification';
    rejectBtn.textContent = 'Reject Verification';
    }
}

// Add event listeners to buttons
function addButtonEventListeners() {
    const userId = getUserIdFromUrl();
    
    // Send Email button
    document.getElementById('sendEmailBtn').addEventListener('click', function() {
    alert('Email notification feature will be implemented soon!');
    });
    
    // Approve button
    document.getElementById('approveBtn').addEventListener('click', async function() {
    try {
        const response = await fetch(`/admin/users/${userId}/verify`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'verified' })
        });
        
        if (!response.ok) {
        throw new Error(`Failed to update verification status: ${response.status}`);
        }
        
        alert('User verification approved successfully!');
        loadUserData(); // Reload data to reflect changes
    } catch (error) {
        console.error('Error approving user:', error);
        alert(`Error: ${error.message}`);
    }
    });
    
    // Reject button
    document.getElementById('rejectBtn').addEventListener('click', async function() {
    try {
        const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected' })
        });
        
        if (!response.ok) {
        throw new Error(`Failed to update verification status: ${response.status}`);
        }
        
        alert('User verification rejected successfully!');
        loadUserData(); // Reload data to reflect changes
    } catch (error) {
        console.error('Error rejecting user:', error);
        alert(`Error: ${error.message}`);
    }
    });
}

// Toggle sidebar functionality
document.getElementById('menuToggle').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('main');
    const footer = document.getElementById('footer');
    this.classList.toggle('menu-open');
    
    sidebar.classList.toggle('sidebar-open');
    
    if (window.innerWidth > 992) {
    main.classList.toggle('main-full');
    footer.classList.toggle('footer-full');
    }
});

// Responsive behavior
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('main');
    const footer = document.getElementById('footer');
    const menuToggle = document.getElementById('menuToggle');
    
    if (window.innerWidth <= 992) {
    main.classList.add('main-full');
    footer.classList.add('footer-full');
    sidebar.classList.remove('sidebar-open');
    menuToggle.classList.remove('menu-open');
    } else {
    if (!sidebar.classList.contains('sidebar-collapsed')) {
        main.classList.remove('main-full');
        footer.classList.remove('footer-full');
    }
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    addButtonEventListeners();
});
