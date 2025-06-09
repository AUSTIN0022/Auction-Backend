// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
// Global variables
let selectedFiles = []; // New files to upload
let existingImages = []; // Existing images from the server
let imagesToRemove = []; // URLs of images to remove
const MIN_REQUIRED_IMAGES = 2;
const MAX_ALLOWED_IMAGES = 5;
let auctionId = null;
let auctionData = null;

// Fetch auction ID from the URL
getAuctionIdFromUrl();

// Setup form event listeners
setupFormHandlers();
setupImageUpload();

// Fetch categories and auction data
fetchCategories();
fetchAuctionData();

/**
 * Extract auction ID from the URL
 */
function getAuctionIdFromUrl() {
  // URL pattern: /auctions/edit/:id
  const pathParts = window.location.pathname.split('/');
  auctionId = pathParts[pathParts.length - 1];
  console.log(`Auction ID: ${auctionId}`);
  
  if (!auctionId) {
    showError('Could not determine auction ID. Please go back and try again.');
  }
}

/**
 * Show loading spinner
 */
function showLoading() {
  document.getElementById('loadingSpinner').style.display = 'flex';
}

/**
 * Hide loading spinner
 */
function hideLoading() {
  document.getElementById('loadingSpinner').style.display = 'none';
}

/**
 * Fetch auction data from the API
 */
function fetchAuctionData() {
    if (!auctionId) return;
    
    showLoading();
    
    fetch(`/api/admin/auction/${auctionId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
      .then(response => response.json())
      .then(data => {
        hideLoading();
        
        if (data.success && data.auctionDetails && data.auctionDetails._id) {
          auctionData = data.auctionDetails;
          populateFormWithData(data.auctionDetails);
        } else {
          console.error('Invalid auction data format:', data);
          showError('Failed to load auction data. Please try again later.');
        }
      })
      .catch(error => {
        hideLoading();
        console.error('Error fetching auction data:', error);
        showError('Failed to load auction data. Please try again later.');
      });
  }

/**
 * Populate the form with data from the API
 */
function populateFormWithData(data) {
  document.getElementById('itemTitle').value = data.title || '';
  document.getElementById('description').value = data.description || '';
  document.getElementById('basePrice').value = data.basePrice || '';
  document.getElementById('emdAmount').value = data.emdAmount || '';
  
  // Format dates for input fields (YYYY-MM-DD)
  if (data.startDate) {
    const startDate = new Date(data.startDate);
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
  }
  
  if (data.endDate) {
    const endDate = new Date(data.endDate);
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
  }
  
  if (data.registrationDeadline) {
    const regDeadline = new Date(data.registrationDeadline);
    document.getElementById('registrationDeadline').value = regDeadline.toISOString().split('T')[0];
  }
  
  // Set status
  if (data.status) {
    document.getElementById('auctionStatus').value = data.status;
  }
  
  // Store and display existing images
  if (data.images && Array.isArray(data.images)) {
    existingImages = [...data.images];
    updateExistingImagesPreview();
  }
  
  // Select the category if available
  if (data.categorie) {
    // Wait for categories to load
    const intervalId = setInterval(() => {
      const categorySelect = document.getElementById('itemCategory');
      if (categorySelect.options.length > 1) {
        categorySelect.value = data.categorie;
        clearInterval(intervalId);
      }
    }, 100);
  }
}

/**
 * Update the existing images preview
 */
function updateExistingImagesPreview() {
  const existingImagesContainer = document.getElementById('existing-images-container');
  existingImagesContainer.innerHTML = '';
  
  if (existingImages.length === 0) {
    existingImagesContainer.innerHTML = '<p class="text-muted text-center w-100">No images available</p>';
    return;
  }
  
  existingImages.forEach((imageUrl, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'image-preview-item';
    
    const previewImg = document.createElement('img');
    previewImg.src = imageUrl;
    previewImg.alt = 'Auction Image';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-image-btn';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', function() {
      // Add to removal list
      imagesToRemove.push(imageUrl);
      
      // Remove from existing images array
      existingImages.splice(index, 1);
      
      // Update UI
      updateExistingImagesPreview();
      updateImageCounter();
    });
    
    previewItem.appendChild(previewImg);
    previewItem.appendChild(removeBtn);
    existingImagesContainer.appendChild(previewItem);
  });
  
  updateImageCounter();
}

/**
 * Fetch categories from the API and populate the dropdown
 */
function fetchCategories() {
  fetch('/api/admin/auction/categories', {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    }
})
    .then(response => response.json())
    .then(data => {
      if (data.success && data.categories) {
        populateCategoriesDropdown(data.categories);
      } else {
        showError('Failed to load categories');
      }
    })
    .catch(error => {
      console.error('Error fetching categories:', error);
      showError('Failed to load categories. Please try again later.');
    });
}

/**
 * Populate the categories dropdown with data from the API
 */
function populateCategoriesDropdown(categories) {
  const categorySelect = document.getElementById('itemCategory');
  
  // Clear existing options
  categorySelect.innerHTML = '';
  
  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.textContent = 'Select a category';
  defaultOption.value = '';
  defaultOption.selected = true;
  defaultOption.disabled = true;
  categorySelect.appendChild(defaultOption);
  
  // Add categories from API
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category._id;
    option.textContent = category.name;
    option.dataset.description = category.description;
    categorySelect.appendChild(option);
  });
}

/**
 * Setup form event handlers
 */
function setupFormHandlers() {
  const form = document.getElementById('auctionForm');
  const updateButton = document.getElementById('updateButton');
  const saveDraftButton = document.getElementById('saveDraftButton');
  const backButton = document.getElementById('backButton');
  
  updateButton.addEventListener('click', function(e) {
    e.preventDefault();
    submitForm(document.getElementById('auctionStatus').value);
  });
  
  saveDraftButton.addEventListener('click', function(e) {
    e.preventDefault();
    submitForm('draft');
  });
  
  backButton.addEventListener('click', function() {
    // Handle back button - redirect to previous page
    window.history.back();
  });
  
  // Set minimum date for date inputs
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').min = today;
  document.getElementById('endDate').min = today;
  document.getElementById('registrationDeadline').min = today;
}

/**
 * Setup image upload functionality
 */
function setupImageUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const browseButton = document.getElementById('browseButton');
  const fileInput = document.getElementById('fileInput');
  
  // Trigger file input when browse button is clicked
  browseButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });
  
  // Handle file selection
  fileInput.addEventListener('change', function() {
    handleFileSelection(fileInput.files);
  });
  
  // Make the entire upload area clickable
  uploadArea.addEventListener('click', function(e) {
    // Prevent triggering if clicking on a button or image preview
    if (e.target === uploadArea || e.target.parentElement === uploadArea) {
      fileInput.click();
    }
  });
  
  // Setup drag and drop
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.classList.add('border-primary');
  });
  
  uploadArea.addEventListener('dragleave', function() {
    uploadArea.classList.remove('border-primary');
  });
  
  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('border-primary');
    handleFileSelection(e.dataTransfer.files);
  });
}

/**
 * Handle file selection and preview
 */
function handleFileSelection(files) {
  const totalImageCount = existingImages.length + selectedFiles.length;
  
  // Check if adding these files would exceed the maximum
  if (totalImageCount + files.length > MAX_ALLOWED_IMAGES) {
    showError(`You can have a maximum of ${MAX_ALLOWED_IMAGES} images in total`);
    return;
  }
  
  // Add new files to our array
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type.startsWith('image/')) {
      selectedFiles.push(file);
    }
  }
  
  // Update the UI with selected files
  updateImagePreview();
  updateImageCounter();
}

/**
 * Update the image preview area for newly selected files
 */
function updateImagePreview() {
  const previewContainer = document.getElementById('image-preview-container');
  
  // Clear existing preview
  previewContainer.innerHTML = '';
  
  if (selectedFiles.length === 0) {
    return;
  }
  
  // Add image previews
  selectedFiles.forEach((file, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'image-preview-item';
    
    const previewImg = document.createElement('img');
    previewImg.src = URL.createObjectURL(file);
    previewImg.alt = 'Image preview';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-image-btn';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent triggering upload area click
      selectedFiles.splice(index, 1);
      updateImagePreview();
      updateImageCounter();
    });
    
    previewItem.appendChild(previewImg);
    previewItem.appendChild(removeBtn);
    previewContainer.appendChild(previewItem);
  });
}

/**
 * Update the image counter text
 */
function updateImageCounter() {
  const imageCounter = document.getElementById('imageCounter');
  const totalImageCount = existingImages.length + selectedFiles.length;
  
  if (totalImageCount < MIN_REQUIRED_IMAGES) {
    imageCounter.className = 'image-counter error';
    imageCounter.textContent = `(${selectedFiles.length} new + ${existingImages.length} existing = ${totalImageCount} total - minimum ${MIN_REQUIRED_IMAGES} required)`;
  } else {
    imageCounter.className = 'image-counter success';
    imageCounter.textContent = `(${selectedFiles.length} new + ${existingImages.length} existing = ${totalImageCount} total images ✓)`;
  }
}

/**
 * Submit the form data
 */
function submitForm(status) {
  // Validate form before submission
  if (!validateForm()) {
    return;
  }
  
  // Create FormData to send
  const formData = new FormData();
  
  // Get form values
  const categoryId = document.getElementById('itemCategory').value;
  const title = document.getElementById('itemTitle').value;
  const description = document.getElementById('description').value;
  const basePrice = document.getElementById('basePrice').value;
  const emdAmount = document.getElementById('emdAmount').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const registrationDeadline = document.getElementById('registrationDeadline').value;
  
  // Get user ID from localStorage
  const userId = localStorage.getItem('userId') || "67697d43d1df912d7ac760af"; // Fallback for testing
  
  // Format dates properly with timezone
  const startDateTime = new Date(startDate).toISOString();
  const endDateTime = new Date(endDate).toISOString();
  const registrationDeadlineTime = new Date(registrationDeadline).toISOString();
  
  // Add form fields to FormData
  formData.append('auctionId', auctionId);
  formData.append('title', title);
  formData.append('description', description);
  formData.append('basePrice', parseInt(basePrice));
  formData.append('emdAmount', parseInt(emdAmount));
  formData.append('startDate', startDateTime);
  formData.append('endDate', endDateTime);
  formData.append('registrationDeadline', registrationDeadlineTime);
  formData.append('status', status);
  formData.append('categorie', categoryId);
  formData.append('createdBy', userId.replace(/^"|"$/g, ''));
  
  // Add images to remove
  if (imagesToRemove.length > 0) {
    formData.append('imagesToRemove', JSON.stringify(imagesToRemove));
  }
  
  // Add existing images to keep
  if (existingImages.length > 0) {
    formData.append('existingImages', JSON.stringify(existingImages));
  }
  
  // Add all new images to FormData
  selectedFiles.forEach((file, index) => {
    formData.append('auction_images', file);
  });
  
  // Show loading state
  toggleLoadingState(true);
  showLoading();

  
  // Send the request
  fetch(`/api/admin/auction/${auctionId}`, {
    method: 'PUT',
    body: formData,
    credentials: 'include',
    headers: {
      // Don't set Content-Type when using FormData
      'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token'}`
    }
  })
    .then(response => response.json())
    .then(data => {
      toggleLoadingState(false);
      hideLoading();
      
      if (data.success) {
        showSuccess('Auction updated successfully!');
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/view-auctions'; // Redirect to auctions list
        }, 2000);
      } else {
        showError(data.message || 'Failed to update auction');
      }
    })
    .catch(error => {
      toggleLoadingState(false);
      hideLoading();
      console.error('Error updating auction:', error);
      showError('An error occurred. Please try again later.');
    });
}

/**
 * Validate the form before submission
 */
function validateForm() {
  // Reset previous error messages
  clearErrorMessages();
  
  let isValid = true;
  
  // Validate category
  const categorySelect = document.getElementById('itemCategory');
  if (!categorySelect.value) {
    showFieldError(categorySelect, 'Please select a category');
    isValid = false;
  }
  
  // Validate title
  const titleInput = document.getElementById('itemTitle');
  if (!titleInput.value.trim()) {
    showFieldError(titleInput, 'Please enter a title');
    isValid = false;
  }
  
  // Validate description
  const descriptionInput = document.getElementById('description');
  if (!descriptionInput.value.trim()) {
    showFieldError(descriptionInput, 'Please enter a description');
    isValid = false;
  }
  
  // Validate base price
  const basePriceInput = document.getElementById('basePrice');
  if (!basePriceInput.value.trim() || isNaN(parseInt(basePriceInput.value))) {
    showFieldError(basePriceInput, 'Please enter a valid base price');
    isValid = false;
  }
  
  // Validate EMD amount
  const emdAmountInput = document.getElementById('emdAmount');
  if (!emdAmountInput.value.trim() || isNaN(parseInt(emdAmountInput.value))) {
    showFieldError(emdAmountInput, 'Please enter a valid EMD amount');
    isValid = false;
  }
  
  // Validate dates
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const registrationDeadlineInput = document.getElementById('registrationDeadline');
  
  if (!startDateInput.value) {
    showFieldError(startDateInput, 'Please select a start date');
    isValid = false;
  }
  
  if (!endDateInput.value) {
    showFieldError(endDateInput, 'Please select an end date');
    isValid = false;
  }
  
  if (!registrationDeadlineInput.value) {
    showFieldError(registrationDeadlineInput, 'Please select a registration deadline');
    isValid = false;
  }
  
  if (startDateInput.value && endDateInput.value && registrationDeadlineInput.value) {
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    const registrationDeadline = new Date(registrationDeadlineInput.value);
    
    // Validate date order
    if (registrationDeadline >= startDate) {
      showFieldError(registrationDeadlineInput, 'Registration deadline must be before the start date');
      isValid = false;
    }
    
    if (startDate >= endDate) {
      showFieldError(startDateInput, 'Start date must be before the end date');
      isValid = false;
    }
  }
  
  // Validate minimum number of images
  const totalImageCount = existingImages.length + selectedFiles.length;
  if (totalImageCount < MIN_REQUIRED_IMAGES) {
    showError(`At least ${MIN_REQUIRED_IMAGES} images are required. You currently have ${totalImageCount}.`);
    isValid = false;
  }
  
  return isValid;
}

/**
 * Show field-specific error message
 */
function showFieldError(field, message) {
  field.classList.add('is-invalid');
  
  // Create error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'invalid-feedback';
  errorDiv.textContent = message;
  
  // Insert after the field
  field.parentNode.appendChild(errorDiv);
}

/**
 * Clear all error messages
 */
function clearErrorMessages() {
  // Clear field errors
  const invalidFields = document.querySelectorAll('.is-invalid');
  invalidFields.forEach(field => {
    field.classList.remove('is-invalid');
  });
  
  // Remove error messages
  const errorMessages = document.querySelectorAll('.invalid-feedback');
  errorMessages.forEach(msg => {
    msg.remove();
  });
  
  // Clear alerts
  document.getElementById('alertContainer').innerHTML = '';
}

/**
 * Show error alert
 */
function showError(message) {
  const alertContainer = document.getElementById('alertContainer');
  
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show';
  alertDiv.innerHTML = `
    <i class="fas fa-exclamation-circle me-2"></i> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  alertContainer.appendChild(alertDiv);
  
  // Scroll to top to show the error
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Show success alert
 */
function showSuccess(message) {
  const alertContainer = document.getElementById('alertContainer');
  
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success alert-dismissible fade show';
  alertDiv.innerHTML = `
    <i class="fas fa-check-circle me-2"></i> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  alertContainer.appendChild(alertDiv);
  
  // Scroll to top to show the success message
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Toggle loading state of the form buttons
 */
function toggleLoadingState(isLoading) {
  const updateButton = document.getElementById('updateButton');
  const saveDraftButton = document.getElementById('saveDraftButton');
  const backButton = document.getElementById('backButton');
  
  if (isLoading) {
    // Disable buttons and show loading indicators
    updateButton.disabled = true;
    updateButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Updating...';
    
    saveDraftButton.disabled = true;
    backButton.disabled = true;
  } else {
    // Re-enable buttons and restore text
    updateButton.disabled = false;
    updateButton.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Update Auction';
    
    saveDraftButton.disabled = false;
    backButton.disabled = false;
  }
}
});
