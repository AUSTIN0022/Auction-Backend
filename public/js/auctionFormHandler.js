document.addEventListener('DOMContentLoaded', function() {
    let selectedFiles = [];
    const MIN_REQUIRED_IMAGES = 5;
    
    // Fetch categories on page load
    fetchCategories();
    
    // Setup form event listeners
    setupFormHandlers();
    setupImageUpload();
    
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
      const form = document.querySelector('form');
      const publishButton = form.querySelector('.btn-success');
      const saveDraftButton = form.querySelector('.btn-secondary');
      const backButton = document.querySelector('.card-header .btn-primary');
      
      publishButton.addEventListener('click', function(e) {
        e.preventDefault();
        submitForm(false);
      });
      
      saveDraftButton.addEventListener('click', function(e) {
        e.preventDefault();
        submitForm(true);
      });
      
      backButton.addEventListener('click', function() {
        // Handle back button - you might want to redirect to a previous page
        window.history.back();
      });
    }
    
    /**
     * Setup image upload functionality
     */
    function setupImageUpload() {
      const uploadArea = document.querySelector('.upload-area');
      const browseButton = uploadArea.querySelector('.btn-primary');
      
      // Create a hidden file input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.multiple = true;
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      
      // Trigger file input when browse button is clicked
      browseButton.addEventListener('click', function() {
        fileInput.click();
      });
      
      // Handle file selection
      fileInput.addEventListener('change', function() {
        handleFileSelection(fileInput.files);
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
      // Add new files to our array
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          selectedFiles.push(file);
        }
      }
      
      // Update the UI with selected files
      updateImagePreview();
    }
    
    /**
     * Update the image preview area
     */
    function updateImagePreview() {
      const uploadArea = document.querySelector('.upload-area');
      
      // Clear existing preview
      const existingPreview = document.getElementById('image-preview-container');
      if (existingPreview) {
        existingPreview.remove();
      }
      
      // If no files, reset to original state
      if (selectedFiles.length === 0) {
        uploadArea.innerHTML = `
          <i class="fas fa-cloud-upload-alt text-primary mb-3" style="font-size: 40px;"></i>
          <div class="mb-3">Drop images here or click to upload</div>
          <button type="button" class="btn btn-primary"><i class="fas fa-folder-open me-2"></i> Browse Files</button>
        `;
        return;
      }
      
      // Create preview container
      const previewContainer = document.createElement('div');
      previewContainer.id = 'image-preview-container';
      previewContainer.className = 'row g-2 mt-3';
      
      // Add image previews
      selectedFiles.forEach((file, index) => {
        const previewCol = document.createElement('div');
        previewCol.className = 'col-4 col-md-3 col-lg-2 position-relative';
        
        const previewImg = document.createElement('img');
        previewImg.src = URL.createObjectURL(file);
        previewImg.className = 'img-fluid rounded';
        previewImg.style.height = '80px';
        previewImg.style.width = '100%';
        previewImg.style.objectFit = 'cover';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.style.padding = '0.2rem 0.4rem';
        removeBtn.style.fontSize = '0.7rem';
        removeBtn.addEventListener('click', function() {
          selectedFiles.splice(index, 1);
          updateImagePreview();
        });
        
        previewCol.appendChild(previewImg);
        previewCol.appendChild(removeBtn);
        previewContainer.appendChild(previewCol);
      });
      
      // Update upload area
      uploadArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <i class="fas fa-images text-primary me-2"></i>
            <span>${selectedFiles.length} ${selectedFiles.length === 1 ? 'image' : 'images'} selected</span>
            ${selectedFiles.length < MIN_REQUIRED_IMAGES ? 
              `<span class="text-danger ms-2">(Minimum ${MIN_REQUIRED_IMAGES} required)</span>` : 
              '<span class="text-success ms-2"><i class="fas fa-check-circle"></i></span>'}
          </div>
          <button type="button" class="btn btn-sm btn-primary">
            <i class="fas fa-plus me-1"></i> Add More
          </button>
        </div>
      `;
      
      uploadArea.appendChild(previewContainer);
      
      // Re-attach event listener to the "Add More" button
      uploadArea.querySelector('.btn-primary').addEventListener('click', function() {
        document.querySelector('input[type="file"]').click();
      });
    }
    
    /**
     * Submit the form data
     */
    function submitForm(isDraft) {
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
      const regFee = document.getElementById('regFee').value;
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      
      // Add form fields to FormData
      formData.append('categoryId', categoryId);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('basePrice', parseFloat(basePrice));
      formData.append('registrationFee', parseFloat(regFee));
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('isDraft', isDraft);
      
      // Add all images to FormData
      selectedFiles.forEach((file, index) => {
        formData.append('images', file);
      });
      
      // Show loading state
      toggleLoadingState(true);
      
      // Send the request
      fetch('/api/admin/auction/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: formData,
      })
        .then(response => response.json())
        .then(data => {
          toggleLoadingState(false);
          
          if (data.success) {
            showSuccess('Auction created successfully!');
            // You might want to redirect or reset the form here
            setTimeout(() => {
              window.location.href = '/view-auctions'; // Redirect to auctions list
            }, 2000);
          } else {
            showError(data.message || 'Failed to create auction');
          }
        })
        .catch(error => {
          toggleLoadingState(false);
          console.error('Error creating auction:', error);
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
      if (!basePriceInput.value.trim() || isNaN(parseFloat(basePriceInput.value))) {
        showFieldError(basePriceInput, 'Please enter a valid base price');
        isValid = false;
      }
      
      // Validate registration fee
      const regFeeInput = document.getElementById('regFee');
      if (!regFeeInput.value.trim() || isNaN(parseFloat(regFeeInput.value))) {
        showFieldError(regFeeInput, 'Please enter a valid registration fee');
        isValid = false;
      }
      
      // Validate dates
      const startDateInput = document.getElementById('startDate');
      const endDateInput = document.getElementById('endDate');
      
      if (!startDateInput.value) {
        showFieldError(startDateInput, 'Please select a start date');
        isValid = false;
      }
      
      if (!endDateInput.value) {
        showFieldError(endDateInput, 'Please select an end date');
        isValid = false;
      }
      
      if (startDateInput.value && endDateInput.value) {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        
        if (endDate <= startDate) {
          showFieldError(endDateInput, 'End date must be after start date');
          isValid = false;
        }
      }
      
      // Validate minimum number of images
      if (selectedFiles.length < MIN_REQUIRED_IMAGES) {
        showError(`Please upload at least ${MIN_REQUIRED_IMAGES} images`);
        isValid = false;
      }
      
      return isValid;
    }
    
    /**
     * Show error message for a specific field
     */
    function showFieldError(field, message) {
      // Check if error message already exists
      let errorElement = field.nextElementSibling;
      if (!errorElement || !errorElement.classList.contains('invalid-feedback')) {
        errorElement = document.createElement('div');
        errorElement.className = 'invalid-feedback';
        field.parentNode.insertBefore(errorElement, field.nextSibling);
      }
      
      // Add error message and styling
      errorElement.textContent = message;
      field.classList.add('is-invalid');
    }
    
    /**
     * Clear all error messages
     */
    function clearErrorMessages() {
      // Remove field-specific errors
      document.querySelectorAll('.is-invalid').forEach(field => {
        field.classList.remove('is-invalid');
      });
      
      // Remove any alert messages
      const existingAlerts = document.querySelectorAll('.alert');
      existingAlerts.forEach(alert => alert.remove());
    }
    
    /**
     * Show a general error message
     */
    function showError(message) {
      showAlert(message, 'danger');
    }
    
    /**
     * Show a success message
     */
    function showSuccess(message) {
      showAlert(message, 'success');
    }
    
    /**
     * Show an alert message
     */
    function showAlert(message, type) {
      // Remove any existing alerts
      const existingAlerts = document.querySelectorAll('.alert');
      existingAlerts.forEach(alert => alert.remove());
      
      // Create alert element
      const alertElement = document.createElement('div');
      alertElement.className = `alert alert-${type} alert-dismissible fade show mt-3`;
      alertElement.role = 'alert';
      
      // Add alert content
      alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      
      // Insert at the top of the form
      const form = document.querySelector('form');
      form.insertBefore(alertElement, form.firstChild);
    }
    
    /**
     * Toggle loading state of the form
     */
    function toggleLoadingState(isLoading) {
      const submitButtons = document.querySelectorAll('form button[type="button"]');
      
      submitButtons.forEach(button => {
        button.disabled = isLoading;
        
        if (isLoading) {
          button.dataset.originalHtml = button.innerHTML;
          button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        } else if (button.dataset.originalHtml) {
          button.innerHTML = button.dataset.originalHtml;
        }
      });
    }
  });