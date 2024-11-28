    // Constants
// This object holds all the constant values and states used throughout the application
const constants = {
    currentScreenshot: null, // Currently displayed screenshot
    screenshots: [], // Array to store all uploaded screenshots
    boxes: [], // Array to store all drawn boxes
    globalBoxes: [], // Array to store boxes that appear on multiple screenshots
    isDrawing: false, // Flag to indicate if the user is currently drawing a box
    startX: null, // Starting X coordinate for box drawing
    startY: null, // Starting Y coordinate for box drawing
    scale: 1, // Scale factor for image display
    isMoving: false, // Flag to indicate if a box is being moved
    movingBox: null, // Reference to the box being moved
    currentScreenshotIndex: -1, // Index of the currently displayed screenshot
    lastMoveTime: 0, // Timestamp of the last box move action
    showUIElements: true, // Flag to control visibility of UI elements
    isResizing: false, // Flag to indicate if a box is being resized
    resizingBox: null, // Reference to the box being resized
    drawBoxShortcut: { key: 'C', shiftKey: true, ctrlKey: false, altKey: false }, // Keyboard shortcut for drawing boxes
    resizeTimeout: null, // Timeout for resize event handling
    linkedBoxColor: '#3498db', // Color for linked boxes
    globalBoxColor: '#9b59b6', // Color for global boxes
    originalDrawBoxShortcut: null, // Stores the original draw box shortcut
    imageSizes: [65, 87, 135, 270], // Predefined image sizes for thumbnails
    lastClickTime: 0, // Timestamp of the last click event
    modeIndicator: null,
    // In the constants object, add these new properties:
    snapThreshold: 10, // Distance in pixels to trigger snapping
    snapStickiness: 15 // Distance in pixels required to unstick a snapped box
};

// DOM Elements
// This object stores references to frequently used DOM elements
const domElements = {
    imageContainer: document.getElementById('imageContainer'),
    toolbarIcon: document.getElementById('toolbarIcon'),
    toolbar: document.getElementById('toolbar'),
    uploadScreenshotInput: document.getElementById('uploadScreenshot'),
    drawBoxBtn: document.getElementById('drawBox'),
    saveProjectBtn: document.getElementById('saveProject'),
    openProjectBtn: document.getElementById('openProject'),
    imageList: document.getElementById('imageList'),
    contextMenu: document.getElementById('contextMenu'),
    sideToolbarWrapper: document.getElementById('sideToolbarWrapper'),
    sideToolbarToggle: document.getElementById('sideToolbarToggle'),
    deleteAllScreenshotsBtn: document.getElementById('deleteAllScreenshots'),
    imageSizeSlider: document.getElementById('imageSizeSlider'),
    helpIcon: document.getElementById('helpIcon'),
    helpModal: document.getElementById('helpModal'),
    closeHelp: document.getElementById('closeHelp'),
    helpContent: document.getElementById('helpContent'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    drawBoxShortcutInput: document.getElementById('drawBoxShortcut'),
    saveSettingsBtn: document.getElementById('saveSettings'),
    closeSettingsBtn: document.getElementById('closeSettings'),
    sideToolbar: document.getElementById('sideToolbar'),
    modeIndicator: document.getElementById('modeIndicator')

};

// Utility Functions
// This object contains helper functions used throughout the application
const utils = {
    // Debounce function to limit the rate at which a function can fire
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Calculate the scale factor for image display
    calculateScaleFactor: (imgWidth, imgHeight, containerWidth, containerHeight) => {
        const widthRatio = containerWidth / imgWidth;
        const heightRatio = containerHeight / imgHeight;
        return Math.min(widthRatio, heightRatio, 1);
    },
    
    // Mix two colors
    mixColors: (color1, color2) => {
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        
        const r = Math.round((r1 + r2) / 2).toString(16).padStart(2, '0');
        const g = Math.round((g1 + g2) / 2).toString(16).padStart(2, '0');
        const b = Math.round((b1 + b2) / 2).toString(16).padStart(2, '0');
        
        return `#${r}${g}${b}`;
    },

    // Monitor click performance
    monitorClickPerformance: (e) => {
        const now = performance.now();
        const timeSinceLastClick = now - constants.lastClickTime;
        console.log(`Time since last click: ${timeSinceLastClick.toFixed(2)}ms`);
        constants.lastClickTime = now;
    },

    // Check for overlapping elements at click position
    checkOverlappingElements: (e) => {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        console.log('Elements at click position:', elements);
    }
};

// Core Functions
// This object contains the main functionality of the application
const core = {
    // Update the list of images in the sidebar
    updateImageList: () => {
        console.log('Updating image list...');
        // Clear the existing image list
        domElements.imageList.innerHTML = '';
        // Iterate through all screenshots
        constants.screenshots.forEach((screenshot, index) => {
            console.log(`Adding screenshot to list: ${screenshot.name}`);
            // Create a new div for each screenshot
            const div = document.createElement('div');
            // Set the class name, marking the current screenshot as active
            div.className = `image-item ${index === constants.currentScreenshotIndex ? 'active' : ''}`;
            // Populate the div with screenshot details and action buttons
            div.innerHTML = `
                <img src="${screenshot.data}" alt="${screenshot.name}">
                <div class="image-name">${screenshot.name}</div>
                <div class="image-tags">${(screenshot.tags || []).join(', ')}</div>
                <div class="image-actions">
                    <button class="rename-btn" title="Rename"><i class="fas fa-edit"></i></button>
                    <button class="tag-btn" title="Manage Tags"><i class="fas fa-tags"></i></button>
                    <button class="delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            // Add event listener for mousedown on the div
            div.addEventListener('mousedown', (e) => {
                // Prevent event propagation if rename or delete buttons are clicked
                if (e.target.closest('.rename-btn, .delete-btn')) {
                    e.stopPropagation();
                    return;
                }

                // Record the starting position of the mouse
                const startX = e.clientX;
                const startY = e.clientY;

                // Define a handler for the mouseup event
                const mouseUpHandler = (upEvent) => {
                    // Calculate the distance the mouse has moved
                    const endX = upEvent.clientX;
                    const endY = upEvent.clientY;
                    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

                    // If the mouse hasn't moved much, consider it a click
                    if (distance < 5) {
                        console.log(`Clicked on screenshot: ${screenshot.name}`);
                        // Display the screenshot if we're not in linking mode
                        if (!domElements.imageList.classList.contains('linking')) {
                            core.displayScreenshot(index);
                        }
                    }

                    // Remove the mouseup event listener
                    document.removeEventListener('mouseup', mouseUpHandler);
                };

                // Add the mouseup event listener
                document.addEventListener('mouseup', mouseUpHandler);
            });
            
            // Add event listener for the rename button
            const renameBtn = div.querySelector('.rename-btn');
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Prompt for a new name and update if provided
                const newName = prompt('Enter new name:', screenshot.name);
                if (newName && newName !== screenshot.name) {
                    screenshot.name = newName;
                    core.updateImageList();
                }
            });
            
            // Add event listener for the delete button
            const deleteBtn = div.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Confirm before deleting
                if (confirm('Are you sure you want to delete this image?')) {
                    core.deleteScreenshot(index);
                }
            });

            // Add event listener for the tag button
            const tagBtn = div.querySelector('.tag-btn');
            tagBtn.addEventListener('mousedown', (e) => {
                if (e.button === 0) { // Left mouse button
                    e.stopPropagation();
                    console.log('Tag button clicked for image:', screenshot.name);
                    ui.showTagManager(index);
                }
            });
            
            // Add the div to the image list
            domElements.imageList.appendChild(div);
        });
        console.log('Image list updated.');
        // Update the size of images in the list
        ui.updateImageSize();

        // Show placeholder if there are no screenshots
        if (constants.screenshots.length === 0) {
            ui.showPlaceholder();
        } else {
            // Hide placeholder if it exists
            const placeholderMessage = document.getElementById('placeholderMessage');
            if (placeholderMessage) {
                placeholderMessage.style.display = 'none';
            }
        }
    },

    // Replace the calculateSnapPosition function with this new version:
    calculateSnapPosition: (movingBox, allBoxes, currentPosition) => {
        const snapThreshold = constants.snapThreshold;
        let snapX = null;
        let snapY = null;
        let snapped = false;

        // Get the bounding rectangle of the image container
        const imageContainerRect = domElements.imageContainer.getBoundingClientRect();

        // Get the bounding rectangle of the moving box
        const movingRect = movingBox.getBoundingClientRect();

        // Calculate the moving box's position relative to the container
        const movingRelativeLeft = currentPosition.x;
        const movingRelativeTop = currentPosition.y;
        const movingWidth = movingRect.width;
        const movingHeight = movingRect.height;

        allBoxes.forEach(otherBox => {
            if (otherBox !== movingBox) {
                const otherRect = otherBox.getBoundingClientRect();

                // Calculate the other box's position relative to the container
                const otherRelativeLeft = otherRect.left - imageContainerRect.left;
                const otherRelativeTop = otherRect.top - imageContainerRect.top;
                const otherWidth = otherRect.width;
                const otherHeight = otherRect.height;

                // Define all edges and centers
                const edges = {
                    movingLeft: movingRelativeLeft,
                    movingRight: movingRelativeLeft + movingWidth,
                    movingTop: movingRelativeTop,
                    movingBottom: movingRelativeTop + movingHeight,
                    movingCenterX: movingRelativeLeft + movingWidth / 2,
                    movingCenterY: movingRelativeTop + movingHeight / 2,
                    otherLeft: otherRelativeLeft,
                    otherRight: otherRelativeLeft + otherWidth,
                    otherTop: otherRelativeTop,
                    otherBottom: otherRelativeTop + otherHeight,
                    otherCenterX: otherRelativeLeft + otherWidth / 2,
                    otherCenterY: otherRelativeTop + otherHeight / 2
                };

                // Check all possible snap positions
                const snapPositions = [
                    { check: Math.abs(edges.movingLeft - edges.otherLeft), snapX: edges.otherLeft },
                    { check: Math.abs(edges.movingRight - edges.otherRight), snapX: edges.otherRight - movingWidth },
                    { check: Math.abs(edges.movingLeft - edges.otherRight), snapX: edges.otherRight },
                    { check: Math.abs(edges.movingRight - edges.otherLeft), snapX: edges.otherLeft - movingWidth },
                    { check: Math.abs(edges.movingCenterX - edges.otherCenterX), snapX: edges.otherCenterX - movingWidth / 2 },
                    { check: Math.abs(edges.movingTop - edges.otherTop), snapY: edges.otherTop },
                    { check: Math.abs(edges.movingBottom - edges.otherBottom), snapY: edges.otherBottom - movingHeight },
                    { check: Math.abs(edges.movingTop - edges.otherBottom), snapY: edges.otherBottom },
                    { check: Math.abs(edges.movingBottom - edges.otherTop), snapY: edges.otherTop - movingHeight },
                    { check: Math.abs(edges.movingCenterY - edges.otherCenterY), snapY: edges.otherCenterY - movingHeight / 2 }
                ];

                snapPositions.forEach(pos => {
                    if (pos.check < snapThreshold) {
                        if (pos.hasOwnProperty('snapX')) snapX = pos.snapX;
                        if (pos.hasOwnProperty('snapY')) snapY = pos.snapY;
                        snapped = true;
                    }
                });
            }
        });

        return { snapX, snapY, snapped };
    },
    
    // Delete a screenshot and update related data
    deleteScreenshot: (index) => {
        // Store the current tag filter value
        const currentTagFilter = document.getElementById('tagFilter').value;

        constants.boxes = constants.boxes.filter(box => box.screenshotIndex !== index);
        constants.boxes.forEach(box => {
            if (box.screenshotIndex > index) box.screenshotIndex--;
            if (box.linkedTo === index) box.linkedTo = null;
            else if (box.linkedTo > index) box.linkedTo--;
        });
        
        constants.screenshots.splice(index, 1);
        
        if (constants.currentScreenshotIndex === index) {
            constants.currentScreenshotIndex = Math.max(0, index - 1);
            if (constants.screenshots.length > 0) {
                core.displayScreenshot(constants.currentScreenshotIndex);
            } else {
                domElements.imageContainer.innerHTML = '';
                constants.currentScreenshot = null;
                ui.showPlaceholder();
            }
        } else if (constants.currentScreenshotIndex > index) {
            constants.currentScreenshotIndex--;
        }

        // Update the tag filter dropdown
        ui.updateTagFilter();
        
        // Restore the previously selected tag if it still exists
        const tagFilter = document.getElementById('tagFilter');
        if (Array.from(tagFilter.options).some(option => option.value === currentTagFilter)) {
            tagFilter.value = currentTagFilter;
        }

        core.updateImageList();
        core.displayBoxes();

        // Apply the current filter to update the image list view
        ui.applyCurrentFilter();
    },
    
    // Scale the displayed image to fit the container
    scaleImage: () => {
        // Get the dimensions of the container
        const containerWidth = domElements.imageContainer.clientWidth;
        const containerHeight = domElements.imageContainer.clientHeight;

        // Find the image element within the container
        const img = domElements.imageContainer.querySelector('img');
        if (!img) {
            //console.log('No image found in container');
            return;
        }

        // Get the natural dimensions of the image
        const imgNaturalWidth = img.naturalWidth;
        const imgNaturalHeight = img.naturalHeight;

        // Calculate the scale factor to fit the image in the container
        const scaleFactor = utils.calculateScaleFactor(imgNaturalWidth, imgNaturalHeight, containerWidth, containerHeight);
        
        // Apply the calculated dimensions to the image
        img.style.width = `${imgNaturalWidth * scaleFactor}px`;
        img.style.height = `${imgNaturalHeight * scaleFactor}px`;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';

        // Update the scale in the current screenshot object
        if (constants.currentScreenshot) {
            constants.currentScreenshot.scale = scaleFactor;
        } else {
            console.log('currentScreenshot is null');
        }

        // Adjust the font size of box indicators based on box size
        const boxes = domElements.imageContainer.querySelectorAll('.box');
        boxes.forEach(box => {
            const width = parseFloat(box.style.width);
            const height = parseFloat(box.style.height);
            const minSize = Math.min(width, height);
            const indicatorScaleFactor = minSize / 100;
            const indicators = box.querySelector('.box-indicators');
            if (indicators) {
                // Set font size between 8px and 16px based on box size
                indicators.style.fontSize = `${Math.max(8, Math.min(16, indicatorScaleFactor * 12))}px`;
            }
        });

        // Redisplay boxes to ensure they're correctly positioned
        core.displayBoxes();
    },
    
    // Display boxes on the current screenshot
    
    displayBoxes: () => {
    // Remove all existing non-temporary boxes
    const existingBoxes = domElements.imageContainer.querySelectorAll('.box:not(.temp-box)');
    existingBoxes.forEach(box => box.remove());

    // Get the current image element
    const img = domElements.imageContainer.querySelector('img');
    if (!img) return;

    // Calculate offsets for box positioning
    const imgRect = img.getBoundingClientRect();
    const containerRect = domElements.imageContainer.getBoundingClientRect();
    
    const offsetX = imgRect.left - containerRect.left;
    const offsetY = imgRect.top - containerRect.top;

    const borderWidth = 2;

    // Function to create and display a box
    const displayBox = (box, isGlobal = false) => {
        // Skip if the box shouldn't be displayed on the current screenshot
        if (!isGlobal && box.screenshotIndex !== constants.currentScreenshotIndex) return;
        if (isGlobal && !box.visibleOn.includes(constants.currentScreenshotIndex)) return;

        // Create the box element
        const boxElement = document.createElement('div');
        boxElement.className = `box ${isGlobal ? 'global' : ''}`;
        if (box.linkedTo !== null && box.linkedTo !== undefined) boxElement.classList.add('linked');

        // Create indicators container
        const indicators = document.createElement('div');
        indicators.className = 'box-indicators';

        // Show/hide indicators based on UI visibility setting
        indicators.classList.add(constants.showUIElements ? 'show-indicators' : 'hide-indicators');
        
        // Add global indicator if the box is global
        if (isGlobal) {
            const globalIndicator = document.createElement('span');
            globalIndicator.className = 'indicator global-indicator';
            globalIndicator.innerHTML = '<i class="fas fa-globe"></i> Global';
            indicators.appendChild(globalIndicator);
        }
        
        // Add linked indicator if the box is linked
        if (box.linkedTo !== null && box.linkedTo !== undefined) {
            const linkedIndicator = document.createElement('span');
            linkedIndicator.className = 'indicator linked-indicator';
            linkedIndicator.innerHTML = '<i class="fas fa-link"></i> Linked';
            indicators.appendChild(linkedIndicator);
        }
        
        boxElement.appendChild(indicators);

        // Calculate and set box position and size
        const left = offsetX + (box.x * imgRect.width);
        const top = offsetY + (box.y * imgRect.height);
        const width = box.width * imgRect.width;
        const height = box.height * imgRect.height;

        boxElement.style.left = `${left}px`;
        boxElement.style.top = `${top}px`;
        boxElement.style.width = `${width}px`;
        boxElement.style.height = `${height}px`;

        // Add coordinate and dimension information
        const coordInfo = document.createElement('div');
        coordInfo.className = 'coord-info';
        coordInfo.innerHTML = `
            TL: (${box.x.toFixed(4)}, ${box.y.toFixed(4)})<br>
            BR: (${(box.x + box.width).toFixed(4)}, ${(box.y + box.height).toFixed(4)})<br>
            W: ${box.width.toFixed(4)}, H: ${box.height.toFixed(4)}
        `;
        coordInfo.style.position = 'absolute';
        coordInfo.style.top = '2px';
        coordInfo.style.left = '2px';
        coordInfo.style.fontSize = '10px';
        coordInfo.style.color = 'white';
        coordInfo.style.backgroundColor = 'rgba(0,0,0,0.7)';
        coordInfo.style.padding = '2px 4px';
        coordInfo.style.borderRadius = '3px';
        coordInfo.style.lineHeight = '1.2';
        coordInfo.style.display = 'none'; // Add this line to hide the coord-info
        boxElement.appendChild(coordInfo);

        // Position indicators
        indicators.style.position = 'absolute';
        indicators.style.top = '0';
        indicators.style.left = '0';
        indicators.style.transform = 'translate(0, -100%)';
        indicators.style.flexDirection = 'row';
        indicators.style.gap = '2px';

        // Scale indicators based on box size
        const minSize = Math.min(width, height);
        const scaleFactor = minSize / 100;
        indicators.style.fontSize = `${Math.max(8, Math.min(16, scaleFactor * 12))}px`;

        // Set data attributes for the box
        boxElement.setAttribute('data-x', box.x);
        boxElement.setAttribute('data-y', box.y);
        boxElement.setAttribute('data-width', box.width);
        boxElement.setAttribute('data-height', box.height);
        if (box.linkedTo !== null && box.linkedTo !== undefined) boxElement.setAttribute('data-linked-to', box.linkedTo);

        // Add event listeners
        boxElement.addEventListener('contextmenu', (e) => ui.showContextMenu(e, boxElement));
        boxElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

        boxElement.addEventListener('click', (e) => {
            // Navigate to linked screenshot if the box is linked and not recently moved
            if (Date.now() - constants.lastMoveTime > 200 && boxElement.classList.contains('linked')) {
                core.displayScreenshot(parseInt(boxElement.getAttribute('data-linked-to')));
            }
        });

        // Append the box to the image container
        domElements.imageContainer.appendChild(boxElement);
    };

    // Display regular boxes
    constants.boxes.forEach(box => displayBox(box));
    // Display global boxes
    constants.globalBoxes.forEach(box => displayBox(box, true));
},


    
    
    // Create a new box element
    createBoxElement: (box) => {
        // Create the main box element
        const boxElement = document.createElement('div');
        boxElement.className = 'box';
        if (box.isGlobal) boxElement.classList.add('global');
        if (box.linkedTo !== null && box.linkedTo !== undefined) boxElement.classList.add('linked');

        // Create indicators container
        const indicators = document.createElement('div');
        indicators.className = 'box-indicators';

        // Add global indicator if the box is global
        if (box.isGlobal) {
            const globalIndicator = document.createElement('span');
            globalIndicator.className = 'indicator global-indicator';
            globalIndicator.innerHTML = '<i class="fas fa-globe"></i> Global';
            indicators.appendChild(globalIndicator);
        }

        // Add linked indicator if the box is linked
        if (box.linkedTo !== null && box.linkedTo !== undefined) {
            const linkedIndicator = document.createElement('span');
            linkedIndicator.className = 'indicator linked-indicator';
            linkedIndicator.innerHTML = '<i class="fas fa-link"></i> Linked';
            indicators.appendChild(linkedIndicator);
        }

        // Append indicators to the box element
        boxElement.appendChild(indicators);

        // Get the image element
        const img = domElements.imageContainer.querySelector('img');
        if (img) {
            // Calculate box position and size based on image dimensions
            const imgRect = img.getBoundingClientRect();
            const containerRect = domElements.imageContainer.getBoundingClientRect();
            
            const offsetX = imgRect.left - containerRect.left;
            const offsetY = imgRect.top - containerRect.top;
            
            const borderWidth = 2;

            const left = offsetX + (box.x * imgRect.width);
            const top = offsetY + (box.y * imgRect.height);
            const width = box.width * imgRect.width;
            const height = box.height * imgRect.height;

            // Set box position and size
            boxElement.style.left = `${left - borderWidth / 2}px`;
            boxElement.style.top = `${top - borderWidth / 2}px`;
            boxElement.style.width = `${width}px`;
            boxElement.style.height = `${height}px`;
        }

        // Add coordinate and dimension information
        const coordInfo = document.createElement('div');
        coordInfo.className = 'coord-info';
        coordInfo.innerHTML = `
            TL: (${box.x.toFixed(4)}, ${box.y.toFixed(4)})<br>
            BR: (${(box.x + box.width).toFixed(4)}, ${(box.y + box.height).toFixed(4)})<br>
            W: ${box.width.toFixed(4)}, H: ${box.height.toFixed(4)}
        `;
        coordInfo.style.position = 'absolute';
        coordInfo.style.top = '2px';
        coordInfo.style.left = '2px';
        coordInfo.style.fontSize = '10px';
        coordInfo.style.color = 'white';
        coordInfo.style.backgroundColor = 'rgba(0,0,0,0.7)';
        coordInfo.style.padding = '2px 4px';
        coordInfo.style.borderRadius = '3px';
        coordInfo.style.lineHeight = '1.2';
        coordInfo.style.display = 'none'; // Add this line to hide the coord-info
        boxElement.appendChild(coordInfo);

        // Set data attributes for the box
        boxElement.setAttribute('data-x', box.x);
        boxElement.setAttribute('data-y', box.y);
        boxElement.setAttribute('data-width', box.width);
        boxElement.setAttribute('data-height', box.height);
        if (box.linkedTo !== null && box.linkedTo !== undefined) boxElement.setAttribute('data-linked-to', box.linkedTo);

        // Add event listeners
        boxElement.addEventListener('contextmenu', (e) => ui.showContextMenu(e, boxElement));
        boxElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

        boxElement.addEventListener('click', (e) => {
            // Navigate to linked screenshot if applicable
            if (Date.now() - constants.lastMoveTime > 200 && boxElement.classList.contains('linked')) {
                core.displayScreenshot(parseInt(boxElement.getAttribute('data-linked-to')));
            }
        });

        // Append the box to the image container
        domElements.imageContainer.appendChild(boxElement);
        return boxElement;
        },
    
    // Start drawing a new box
    startDrawing: (e) => {
        if (constants.isDrawing) {
            const rect = domElements.imageContainer.getBoundingClientRect();
            constants.startX = e.clientX - rect.left;
            constants.startY = e.clientY - rect.top;
        }
    },

    // Draw a box as the user moves the mouse
    drawBox: (e) => {
        if (constants.isDrawing && constants.startX !== null && constants.startY !== null) {
            const rect = domElements.imageContainer.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            let tempBox = domElements.imageContainer.querySelector('.temp-box') || core.createTempBox();
            
            const left = Math.min(constants.startX, currentX);
            const top = Math.min(constants.startY, currentY);
            const width = Math.abs(currentX - constants.startX);
            const height = Math.abs(currentY - constants.startY);
            
            Object.assign(tempBox.style, { 
                left: `${left}px`, 
                top: `${top}px`, 
                width: `${width}px`, 
                height: `${height}px`,
                display: 'block'
            });
        }
    },

    // Finish drawing a box
    endDrawing: () => {
        if (constants.isDrawing) {
            const tempBox = domElements.imageContainer.querySelector('.temp-box');
            if (tempBox) {
                const width = parseFloat(tempBox.style.width);
                const height = parseFloat(tempBox.style.height);
                
                // Check if the box is at least 10x10 pixels
                if (width >= 10 && height >= 10) {
                    const img = domElements.imageContainer.querySelector('img');
                    const imgRect = img.getBoundingClientRect();
                    const containerRect = domElements.imageContainer.getBoundingClientRect();
                    
                    const offsetX = imgRect.left - containerRect.left;
                    const offsetY = imgRect.top - containerRect.top;
                    
                    const box = {
                        x: (parseFloat(tempBox.style.left) - offsetX) / imgRect.width,
                        y: (parseFloat(tempBox.style.top) - offsetY) / imgRect.height,
                        width: width / imgRect.width,
                        height: height / imgRect.height,
                        linkedTo: null,
                        screenshotIndex: constants.currentScreenshotIndex
                    };
                    constants.boxes.push(box);
                    core.createBoxElement(box);
                }
                // Remove the temporary box regardless of its size
                tempBox.remove();
            }
            
            constants.isDrawing = false;
            domElements.imageContainer.style.cursor = 'default';
            domElements.drawBoxBtn.classList.remove('active');
            constants.startX = null;
            constants.startY = null;
        }
        // Only hide the mode indicator if we're not in linking mode
        if (!domElements.imageList.classList.contains('linking')) {
            ui.hideModeIndicator();
        }
        },

    // Create a temporary box element while drawing
    createTempBox: () => {
        const tempBox = document.createElement('div');
        tempBox.className = 'box temp-box';
        tempBox.style.display = 'none';
        domElements.imageContainer.appendChild(tempBox);
        return tempBox;
    },

    // Display a specific screenshot
    displayScreenshot: (index) => {
        // Check if the index is valid
        if (index < 0 || index >= constants.screenshots.length) {
            return;
        }
        // Set the current screenshot and index
        constants.currentScreenshot = constants.screenshots[index];
        constants.currentScreenshotIndex = index;
        
        // Update the active state of image items in the sidebar
        const imageItems = domElements.imageList.querySelectorAll('.image-item');
        imageItems.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        // Hide the placeholder message if it exists
        const placeholderMessage = document.getElementById('placeholderMessage');
        if (placeholderMessage) {
            placeholderMessage.style.display = 'none';
        }
        
        // Clear the image container
        domElements.imageContainer.innerHTML = '';
        
        // Create and display a loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = 'Loading...';
        domElements.imageContainer.appendChild(loadingDiv);
        
        // Create a new Image object and set up its onload handler
        const img = new Image();
        img.onload = function() {
            // Clear the image container and add the loaded image
            domElements.imageContainer.innerHTML = '';
            domElements.imageContainer.appendChild(img);
            // Scale the image, display boxes, and prevent dragging
            core.scaleImage();
            core.displayBoxes();
            ui.preventImageDrag();
        };
        // Set the image source and alt text
        img.src = constants.currentScreenshot.data;
        img.alt = "Screenshot";
        
        // Update the active image state in the UI
        ui.updateActiveImageState(index);
        
        // Apply the current filter to the image
        ui.applyCurrentFilter();
    },

    // Initialize the application
    initializeApp: () => {
        // Add loading styles to the UI
        ui.addLoadingStyles();

        // Check if project data is available in the DOM
        const projectDataScript = document.getElementById('projectData');
        if (projectDataScript) {
            // If project data exists, parse and load it
            const projectData = JSON.parse(projectDataScript.textContent);
            core.loadProjectData(projectData, false);
        } else {
            // If no project data, set up initial UI state
            constants.showUIElements = true;
            ui.updateUIVisibility();
            ui.updateImageSize();
            
            // Create or update placeholder message for empty state
            let placeholderMessage = document.getElementById('placeholderMessage');
            if (!placeholderMessage) {
                // Create new placeholder message if it doesn't exist
                placeholderMessage = document.createElement('div');
                placeholderMessage.id = 'placeholderMessage';
                placeholderMessage.className = 'placeholder-message';
                placeholderMessage.innerHTML = `
                    <div class="placeholder-content">
                        <i class="fas fa-image fa-10x"></i>
                        <h2>No Images Added</h2>
                        <p>Upload screenshots to get started</p>
                        <p>Click the <i class="fas fa-upload"></i> button in the sidebar</p>
                    </div>
                `;
                domElements.imageContainer.appendChild(placeholderMessage);
            }

            // Show or hide placeholder message based on screenshot availability
            if (constants.screenshots.length === 0) {
                placeholderMessage.style.display = 'block';
            } else {
                placeholderMessage.style.display = 'none';
            }
        }
    },

    // Load project data
    loadProjectData: (projectData, forceShowUI = false) => {
        // Set UI visibility based on forceShowUI or project data
        constants.showUIElements = forceShowUI ? true : projectData.showUIElements;
        ui.updateUIVisibility();

        // Map screenshots from project data to constants, including tags
        constants.screenshots = projectData.screenshots.map(screenshot => ({
            name: screenshot.name,
            data: screenshot.data,
            tags: screenshot.tags || []  // Use empty array if tags are not present
        }));

        // Map boxes from project data to constants, ensuring linkedTo is null if not set
        constants.boxes = projectData.boxes.map(box => ({
            ...box,
            linkedTo: box.linkedTo !== null ? box.linkedTo : null
        }));

        // Map global boxes from project data to constants, ensuring linkedTo is null if not set
        constants.globalBoxes = projectData.globalBoxes.map(box => ({
            ...box,
            linkedTo: box.linkedTo !== null ? box.linkedTo : null
        }));

        // Set the current screenshot to the first one
        constants.currentScreenshotIndex = 0;
        constants.currentScreenshot = constants.screenshots[constants.currentScreenshotIndex];

        // Update box colors if provided in project data
        if (projectData.linkedBoxColor) {
            constants.linkedBoxColor = projectData.linkedBoxColor;
        }
        if (projectData.globalBoxColor) {
            constants.globalBoxColor = projectData.globalBoxColor;
        }
        ui.updateBoxStyles();

        // Update UI elements
        core.updateImageList();
        core.displayScreenshot(constants.currentScreenshotIndex);
        ui.updateImageSize();
        ui.updateTagFilterDropdown();
    },

    // Toggle a box between global and local
    toggleGlobalBox: (box) => {
        const isGlobal = box.classList.contains('global');
        const toggleButton = document.getElementById('toggleGlobalBox');
        
        const boxData = isGlobal 
            ? constants.globalBoxes.find(b => 
                b.x === parseFloat(box.getAttribute('data-x')) && 
                b.y === parseFloat(box.getAttribute('data-y')))
            : constants.boxes.find(b => 
                b.screenshotIndex === constants.currentScreenshotIndex && 
                b.x === parseFloat(box.getAttribute('data-x')) && 
                b.y === parseFloat(box.getAttribute('data-y')));
        
        if (boxData) {
            if (isGlobal) {
                // Convert global box to local
                const localBox = {
                    ...boxData,
                    isGlobal: false,
                    screenshotIndex: constants.currentScreenshotIndex
                };
                delete localBox.visibleOn;
                constants.boxes.push(localBox);
                
                const globalIndex = constants.globalBoxes.findIndex(b => b === boxData);
                if (globalIndex !== -1) {
                    constants.globalBoxes.splice(globalIndex, 1);
                }
                
                toggleButton.classList.remove('active');
            } else {
                // Convert local box to global
                const globalBox = {
                    ...boxData,
                    isGlobal: true,
                    visibleOn: [constants.currentScreenshotIndex]
                };
                delete globalBox.screenshotIndex;
                constants.globalBoxes.push(globalBox);
                
                const localIndex = constants.boxes.findIndex(b => b === boxData);
                if (localIndex !== -1) {
                    constants.boxes.splice(localIndex, 1);
                }
                
                toggleButton.classList.add('active');
            }
            core.displayBoxes();
        }
        
        domElements.contextMenu.classList.add('hidden');
        
    },


    // Initialize image dimensions
    initializeImageDimensions: () => {
        const img = domElements.imageContainer.querySelector('img');
        if (img) {
            img.onload = () => {
                core.scaleImage();
                core.displayBoxes();
            };
        }
    },

    // Initialize drawing functionality
    initializeDrawing: () => {
        const tempBox = domElements.imageContainer.querySelector('.temp-box');
        if (tempBox) {
            tempBox.remove();
        }
        core.createTempBox();
    },
};

// UI Functions
// This object contains functions related to user interface interactions
const ui = {
    // Show placeholder when no images are present
    showPlaceholder: () => {
        let placeholderMessage = document.getElementById('placeholderMessage');
        const sideToolbarWrapper = document.getElementById('sideToolbarWrapper');
        const isSidebarHidden = sideToolbarWrapper.classList.contains('hidden');

        if (!placeholderMessage) {
            placeholderMessage = document.createElement('div');
            placeholderMessage.id = 'placeholderMessage';
            placeholderMessage.className = 'placeholder-message';
        }

        placeholderMessage.innerHTML = `
            <div class="placeholder-content">
                <i class="fas fa-image fa-10x"></i>
                <h2>No Images Added</h2>
                <p>${isSidebarHidden ? 'Open the sidebar to get started' : 'Upload screenshots to get started'}</p>
                <p>${isSidebarHidden ? 
                    'Click the <i class="fas fa-chevron-right glow-indicator"></i> button to open the sidebar' : 
                    'Click the <i class="fas fa-upload glow-indicator"></i> button to upload images'}</p>
            </div>
        `;
        
        placeholderMessage.style.display = 'flex';
        domElements.imageContainer.appendChild(placeholderMessage);

        ui.updateGlowIndicators();
    },

    showHelpModal: () => {
        domElements.helpModal.classList.remove('hidden');
        domElements.helpModal.addEventListener('click', ui.closeModal);
    },

    showSettingsModal: () => {
        domElements.settingsModal.classList.remove('hidden');
        domElements.settingsModal.addEventListener('click', ui.closeModal);
    },

    closeModal: (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.classList.add('hidden');
            event.target.removeEventListener('click', ui.closeModal);

            // Save settings if closing the settings modal
            if (event.target === domElements.settingsModal) {
                ui.saveSettings();
            }
        }
    },

    saveSettings: () => {
        constants.drawBoxShortcut = ui.parseShortcut(domElements.drawBoxShortcutInput.value);
        constants.linkedBoxColor = domElements.linkedBoxColorInput.value;
        constants.globalBoxColor = domElements.globalBoxColorInput.value;
        ui.updateBoxStyles();
    },
    
    // Update the size of image thumbnails
    updateImageSize: () => {
        const containerWidth = domElements.sideToolbar.clientWidth - 10;
        const sliderValue = parseInt(domElements.imageSizeSlider.value);
        
        let imagesPerRow = 6 - sliderValue;
        let optimalSize = constants.imageSizes[sliderValue - 1];
        
        const imageItems = document.querySelectorAll('.image-item');
        
        // Add transition to image items
        imageItems.forEach(item => {
            item.style.transition = 'width 0.3s ease, height 0.3s ease';
        });
        
        // Update image sizes and action button sizes
        imageItems.forEach(item => {
            item.style.width = `${optimalSize}px`;
            item.style.height = `${optimalSize}px`;

            // Adjust action button sizes
            const actionButtons = item.querySelectorAll('.image-actions button');
            const buttonSize = 20 + (sliderValue - 1) * 5; // Increase by 5px for each slider step
            const fontSize = 10 + (sliderValue - 1) * 2; // Increase font size by 2px for each slider step

            actionButtons.forEach(button => {
                button.style.width = `${buttonSize}px`;
                button.style.height = `${buttonSize}px`;
                button.style.fontSize = `${fontSize}px`;
            });
        });

        const totalImagesWidth = optimalSize * imagesPerRow;
        
        // Add transition to image list
        domElements.imageList.style.transition = 'width 0.3s ease, margin-left 0.3s ease';
        domElements.imageList.style.width = `${totalImagesWidth}px`;
        
        // Center the image list
        domElements.imageList.style.marginLeft = `${(containerWidth - totalImagesWidth) / 2}px`;

        // Force reflow to ensure transitions are applied
        domElements.imageList.offsetHeight;

        // Remove transitions after they complete
        setTimeout(() => {
            imageItems.forEach(item => {
                item.style.transition = '';
            });
            domElements.imageList.style.transition = '';
        }, 300);
    },
    
    // Toggle the sidebar visibility
    toggleSidebar: () => {
        const sideToolbarWrapper = document.getElementById('sideToolbarWrapper');
        const imageContainer = document.getElementById('imageContainer');
        const sideToolbarToggle = document.getElementById('sideToolbarToggle');
    
        // Define the handler for the transition end
        const handleTransitionEnd = (event) => {
            if (event.propertyName === 'transform') { // Ensure the transition is for the transform property
                // Introduce a slight delay to ensure image resizing is complete
                setTimeout(() => {
                    core.scaleImage();
                    core.displayBoxes();
                    ui.recalculateImageListLayout();
                }, 5); // Delay in milliseconds (adjust as needed)
    
                // Clean up the event listener after it's called
                sideToolbarWrapper.removeEventListener('transitionend', handleTransitionEnd);
            }
        };
    
        // Add the transition end listener
        sideToolbarWrapper.addEventListener('transitionend', handleTransitionEnd);
    
        // Toggle the 'hidden' class to start the sidebar transition
        sideToolbarWrapper.classList.toggle('hidden');
    
        if (sideToolbarWrapper.classList.contains('hidden')) {
            sideToolbarWrapper.style.transform = 'translateX(-280px)';
            imageContainer.style.marginLeft = '20px';
            sideToolbarToggle.style.left = '0px';
        } else {
            sideToolbarWrapper.style.transform = 'translateX(0)';
            imageContainer.style.marginLeft = '300px';
            sideToolbarToggle.style.left = '280px';
            
        }
    
        ui.updateGlowIndicators();
    
        const placeholderMessage = document.getElementById('placeholderMessage');
        if (placeholderMessage && placeholderMessage.style.display !== 'none') {
            ui.showPlaceholder();
        }
    
        // Fallback in case 'transitionend' doesn't fire (e.g., if there's no transition)
        // Delay slightly longer than the expected transition duration
        setTimeout(() => {
            core.scaleImage();
            core.displayBoxes();
            ui.recalculateImageListLayout();
        }, 5); // Adjust the timeout duration as needed based on your CSS transition
    },
    
    // Update glow indicators for UI elements
    updateGlowIndicators: () => {
        const placeholderMessage = document.getElementById('placeholderMessage');
        const uploadBtn = document.querySelector('.upload-btn');
        const sideToolbarWrapper = document.getElementById('sideToolbarWrapper');
        const sideToolbarToggle = document.getElementById('sideToolbarToggle');

        if (placeholderMessage && placeholderMessage.style.display !== 'none') {
            if (sideToolbarWrapper.classList.contains('hidden')) {
                sideToolbarToggle.classList.add('glow-indicator');
                uploadBtn.classList.remove('glow-indicator');
                placeholderMessage.querySelector('p:last-child').innerHTML = 
                    'Click the <i class="fas fa-chevron-right glow-indicator"></i> button to open the sidebar';
            } else {
                sideToolbarToggle.classList.remove('glow-indicator');
                uploadBtn.classList.add('glow-indicator');
                placeholderMessage.querySelector('p:last-child').innerHTML = 
                    'Click the <i class="fas fa-upload glow-indicator"></i> button to upload images';
            }
        } else {
            sideToolbarToggle.classList.remove('glow-indicator');
            uploadBtn.classList.remove('glow-indicator');
        }
    },
    
    // Handle window resize events
    handleResize: () => {
        cancelAnimationFrame(constants.resizeTimeout);
        
        // Immediately update critical elements
        const sideToolbarWrapper = document.getElementById('sideToolbarWrapper');
        if (sideToolbarWrapper.classList.contains('hidden')) {
            domElements.imageContainer.style.marginLeft = '20px';
            domElements.sideToolbarToggle.style.left = '0px';
        } else {
            domElements.imageContainer.style.marginLeft = '300px';
            domElements.sideToolbarToggle.style.left = '280px';
        }

        core.scaleImage();
        core.displayBoxes();

        // Debounce less critical updates
        constants.resizeTimeout = requestAnimationFrame(() => {
            ui.recalculateImageListLayout();
        });
    },

    // Update visibility of UI elements
    updateUIVisibility: () => {
        const elementsToToggle = [
            domElements.toolbar,
            domElements.contextMenu,
            domElements.sideToolbarWrapper,
            domElements.toolbarIcon,
            domElements.helpIcon
        ];

        elementsToToggle.forEach(element => {
            if (element) {
                element.style.display = constants.showUIElements ? '' : 'none';
            }
        });

        if (!constants.showUIElements) {
            domElements.sideToolbarToggle.style.display = 'none';
            domElements.imageContainer.style.marginLeft = '0';
        } else {
            domElements.sideToolbarToggle.style.display = '';
            ui.handleResize();
        }

        const boxes = document.querySelectorAll('.box');
        boxes.forEach(box => {
            if (constants.showUIElements) {
                box.style.border = '';
                box.style.backgroundColor = '';
                box.querySelector('.box-indicators').classList.remove('hide-indicators');
                box.querySelector('.box-indicators').classList.add('show-indicators');
            } else {
                box.style.border = 'none';
                box.style.backgroundColor = 'transparent';
                box.querySelector('.box-indicators').classList.remove('show-indicators');
                box.querySelector('.box-indicators').classList.add('hide-indicators');
            }
        });
    },

    showContextMenu: (e, box) => {
        e.preventDefault();

        if (domElements.imageList.classList.contains('linking')) {
            domElements.imageList.classList.remove('linking');
            const linkMessageOverlay = document.querySelector('.link-message-overlay');
            if (linkMessageOverlay) {
                linkMessageOverlay.remove();
            }
            domElements.imageList.removeEventListener('click', ui.linkHandler);
            ui.hideModeIndicator();
        }

        const menuItems = {
            moveBox: { id: 'moveBox', icon: 'fa-arrows-alt', title: 'Move this box', color: '#4CAF50' },
            copyBox: { id: 'copyBox', icon: 'fa-copy', title: 'Copy this box', color: '#3498db' },
            resizeBox: { id: 'resizeBox', icon: 'fa-expand', title: 'Resize this box', color: '#2196F3' },
            linkBox: { id: 'linkBox', icon: 'fa-link', title: 'Link this box to image', color: '#FF9800' },
            unlinkBox: { id: 'unlinkBox', icon: 'fa-unlink', title: 'Remove link from box', color: '#FF5722' },
            toggleGlobalBox: { id: 'toggleGlobalBox', icon: 'fa-globe', title: 'Toggle global visibility for this box', color: '#9C27B0' },
            editVisibility: { id: 'editVisibility', icon: 'fa-eye', title: 'Edit visibility of this global box on all images', color: '#00BCD4' },
            hideUnhideGlobal: { id: 'hideUnhideGlobal', icon: 'fa-eye-slash', title: 'Hide this global box on current image', color: '#795548' },
            deleteBox: { id: 'deleteBox', icon: 'fa-trash-alt', title: 'Delete this box', color: '#F44336' }
        };

        const isGlobal = box.classList.contains('global');

        let menuContent = '';
        let globalOptionsContent = '';

        Object.entries(menuItems).forEach(([key, item]) => {
            if (key === 'toggleGlobalBox' || (isGlobal && (key === 'editVisibility' || key === 'hideUnhideGlobal'))) {
                globalOptionsContent += `<li id="${item.id}" class="global-option ${isGlobal && key === 'toggleGlobalBox' ? 'active' : ''}" title="${item.title}" data-color="${item.color}"><i class="fas ${item.icon}"></i></li>`;
            } else {
                menuContent += `<li id="${item.id}" title="${item.title}" data-color="${item.color}"><i class="fas ${item.icon}"></i></li>`;
            }
        });

        if (globalOptionsContent) {
            menuContent += `<div class="global-options-container">${globalOptionsContent}</div>`;
        }

        domElements.contextMenu.querySelector('ul').innerHTML = menuContent;

        domElements.contextMenu.querySelectorAll('li').forEach(li => li.classList.remove('hover'));

        // Add event listeners for menu items
        document.getElementById('moveBox').onclick = () => ui.startMovingBox(box);
        document.getElementById('copyBox').onclick = () => ui.copyBox(box);
        document.getElementById('resizeBox').onclick = () => ui.startResizingBox(box);
        document.getElementById('linkBox').onclick = () => ui.linkBox(box);
        document.getElementById('unlinkBox').onclick = () => ui.unlinkBox(box);
        document.getElementById('deleteBox').onclick = () => ui.deleteBox(box);
        document.getElementById('toggleGlobalBox').onclick = () => {
            const toggleButton = document.getElementById('toggleGlobalBox');
            toggleButton.classList.toggle('active');
            core.toggleGlobalBox(box);
        };

        const editVisibilityBtn = document.getElementById('editVisibility');
        const hideUnhideGlobalBtn = document.getElementById('hideUnhideGlobal');

        if (editVisibilityBtn) {
            editVisibilityBtn.onclick = () => ui.editGlobalBoxVisibility(box);
            editVisibilityBtn.style.display = isGlobal ? 'inline-block' : 'none';
        }

        if (hideUnhideGlobalBtn) {
            hideUnhideGlobalBtn.onclick = () => ui.hideUnhideGlobalBox(box);
            hideUnhideGlobalBtn.style.display = isGlobal ? 'inline-block' : 'none';
        }

        document.getElementById('linkBox').style.display = box.classList.contains('linked') ? 'none' : 'inline-block';
        document.getElementById('unlinkBox').style.display = box.classList.contains('linked') ? 'inline-block' : 'none';

        // Show or hide the border for global options
        const globalOptionsContainer = domElements.contextMenu.querySelector('.global-options-container');
        if (globalOptionsContainer) {
            globalOptionsContainer.style.boxShadow = isGlobal ? '0px 0px 0px .25px #FFF, 0px 0px 9px 0px #6c3391' : 'none';
        }

        domElements.contextMenu.addEventListener('mousemove', ui.handleContextMenuHover);

        ui.hideModeIndicator();
        
        const linkMessageOverlay = document.querySelector('.link-message-overlay');
        if (linkMessageOverlay) {
            linkMessageOverlay.style.opacity = '0';
        }

        domElements.contextMenu.addEventListener('mouseleave', () => {
            domElements.contextMenu.querySelectorAll('li').forEach(li => li.classList.remove('hover'));
        });

       // Position the context menu
       const contextMenu = domElements.contextMenu;
       contextMenu.classList.remove('hidden', 'vertical');
   
       // Set initial position to make the menu visible
       contextMenu.style.left = '0px';
       contextMenu.style.top = '0px';
       
       // Get the dimensions of the context menu and the move button
       const menuRect = contextMenu.getBoundingClientRect();
       const moveButton = document.getElementById('moveBox');
       const moveButtonRect = moveButton.getBoundingClientRect();
       
       // Calculate available space
       const viewportWidth = window.innerWidth;
       const viewportHeight = window.innerHeight;
       
       let left, top;

       // Buffer space (adjust as needed)
       const buffer = -20;
   
       // Check if there's enough space to the right
       const spaceToRight = viewportWidth - e.clientX;
       if (spaceToRight < menuRect.width + buffer) {
           // Not enough space, switch to vertical layout
           contextMenu.classList.add('vertical');
           
           // Recalculate menu dimensions after switching to vertical
           const verticalMenuRect = contextMenu.getBoundingClientRect();
           
           // Position the menu with "Move Box" centered over the cursor
           left = e.clientX - moveButtonRect.width / 2;
           top = e.clientY - moveButtonRect.height / 2;
           
           // Adjust if it goes off the right edge
           if (left + verticalMenuRect.width > viewportWidth) {
               left = viewportWidth - verticalMenuRect.width;
           }
           
           // Adjust if it goes off the bottom
           if (top + verticalMenuRect.height > viewportHeight) {
               top = viewportHeight - verticalMenuRect.height;
           }
       } else {
           // Enough space for horizontal layout
           // Calculate the position to center the move button on the cursor
           left = e.clientX - (moveButtonRect.left - menuRect.left) - moveButtonRect.width / 2;
           top = e.clientY - (moveButtonRect.top - menuRect.top) - moveButtonRect.height / 2;
           
           // Check if it would be cut off on the right
           if (left + menuRect.width > viewportWidth - buffer) {
               // Try to adjust horizontally first
               left = viewportWidth - menuRect.width - buffer;
               
               // If still not enough space, switch to vertical layout
               if (left < 0) {
                   contextMenu.classList.add('vertical');
                   const verticalMenuRect = contextMenu.getBoundingClientRect();
                   
                   left = e.clientX - moveButtonRect.width / 2;
                   // Adjust if it goes off the right edge
                   if (left + verticalMenuRect.width > viewportWidth) {
                       left = viewportWidth - verticalMenuRect.width;
                   }
               }
           }
       }
       
       // Ensure the menu doesn't go above the top of the viewport
       if (top < 0) {
           top = 0;
       }
       
       // Set the position of the context menu
       contextMenu.style.left = `${left}px`;
       contextMenu.style.top = `${top}px`;
   
       // After setting the position, check if vertical layout is cut off at the bottom and switch back to horizontal if necessary
       const finalMenuRect = contextMenu.getBoundingClientRect();
       if (contextMenu.classList.contains('vertical') && finalMenuRect.bottom > viewportHeight) {
           contextMenu.classList.remove('vertical');
           // Recalculate position for horizontal layout
           left = e.clientX - (moveButtonRect.left - menuRect.left) - moveButtonRect.width / 2;
           top = e.clientY - (moveButtonRect.top - menuRect.top) - moveButtonRect.height / 2;
           
           // Adjust if it goes off the right edge
           if (left + menuRect.width > viewportWidth) {
               left = viewportWidth - menuRect.width;
           }
           
           // Adjust if it goes off the bottom
           if (top + menuRect.height > viewportHeight) {
               top = viewportHeight - menuRect.height;
           }
           
           contextMenu.style.left = `${left}px`;
           contextMenu.style.top = `${top}px`;
       }
   },




    // Handle hover effects in the context menu
    handleContextMenuHover: (e) => {
        const menuRect = domElements.contextMenu.getBoundingClientRect();
        const mouseX = e.clientX - menuRect.left;
        const mouseY = e.clientY - menuRect.top;

        domElements.contextMenu.querySelectorAll('li').forEach(li => {
            const liRect = li.getBoundingClientRect();
            const relativeRect = {
                left: liRect.left - menuRect.left,
                top: liRect.top - menuRect.top,
                right: liRect.right - menuRect.left,
                bottom: liRect.bottom - menuRect.top
            };

            if (mouseX >= relativeRect.left && mouseX <= relativeRect.right &&
                mouseY >= relativeRect.top && mouseY <= relativeRect.bottom) {
                li.classList.add('hover');
            } else {
                li.classList.remove('hover');
            }
        });
    },

    // Start moving a box
    startMovingBox: (box) => {
    constants.isMoving = true;
    constants.movingBox = box;
    box.classList.add('moving');
    domElements.contextMenu.classList.add('hidden');

    // Get the current mouse position
    const initialMouseX = event.clientX;
    const initialMouseY = event.clientY;

    // Get the image container's position
    const containerRect = domElements.imageContainer.getBoundingClientRect();

    // Get the box dimensions
    const boxRect = box.getBoundingClientRect();
    const boxWidth = boxRect.width;
    const boxHeight = boxRect.height;

    // Calculate the new position to center the box on the cursor, accounting for container offset
    const newLeft = initialMouseX - containerRect.left - boxWidth / 2;
    const newTop = initialMouseY - containerRect.top - boxHeight / 2;

    // Set the new position
    box.style.left = `${newLeft}px`;
    box.style.top = `${newTop}px`;

    let isSnappedX = false;
    let isSnappedY = false;
    let snappedX = null;
    let snappedY = null;

    function moveHandler(e) {
        if (constants.isMoving) {
            const currentLeft = e.clientX - containerRect.left - boxWidth / 2;
            const currentTop = e.clientY - containerRect.top - boxHeight / 2;

            const allBoxes = Array.from(domElements.imageContainer.querySelectorAll('.box'));

            const { snapX, snapY, snapped } = core.calculateSnapPosition(constants.movingBox, allBoxes, { x: currentLeft, y: currentTop });

            // Handle horizontal snapping
            if (snapX !== null && !isSnappedX) {
                isSnappedX = true;
                snappedX = snapX;
            } else if (isSnappedX) {
                if (Math.abs(currentLeft - snappedX) > constants.snapStickiness) {
                    isSnappedX = false;
                }
            }

            // Handle vertical snapping
            if (snapY !== null && !isSnappedY) {
                isSnappedY = true;
                snappedY = snapY;
            } else if (isSnappedY) {
                if (Math.abs(currentTop - snappedY) > constants.snapStickiness) {
                    isSnappedY = false;
                }
            }

            // Apply snapping
            let finalLeft = isSnappedX ? snappedX : currentLeft;
            let finalTop = isSnappedY ? snappedY : currentTop;

            constants.movingBox.style.left = `${finalLeft}px`;
            constants.movingBox.style.top = `${finalTop}px`;
        }
    }

    function stopMoving(e) {
        if (constants.isMoving && e.button === 0) {
            constants.isMoving = false;
            constants.movingBox.classList.remove('moving');

            const img = domElements.imageContainer.querySelector('img');
            const imgRect = img.getBoundingClientRect();
            const offsetX = imgRect.left - containerRect.left;
            const offsetY = imgRect.top - containerRect.top;

            const newX = (parseFloat(constants.movingBox.style.left) - offsetX) / imgRect.width;
            const newY = (parseFloat(constants.movingBox.style.top) - offsetY) / imgRect.height;

            const isGlobal = constants.movingBox.classList.contains('global');
            let boxData = isGlobal
                ? constants.globalBoxes.find(b => b.x === parseFloat(constants.movingBox.getAttribute('data-x')) && b.y === parseFloat(constants.movingBox.getAttribute('data-y')))
                : constants.boxes.find(b => b.screenshotIndex === constants.currentScreenshotIndex && b.x === parseFloat(constants.movingBox.getAttribute('data-x')) && b.y === parseFloat(constants.movingBox.getAttribute('data-y')));

            if (boxData) {
                boxData.x = newX;
                boxData.y = newY;
                constants.movingBox.setAttribute('data-x', newX);
                constants.movingBox.setAttribute('data-y', newY);
            }

            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', stopMoving);
            
            constants.lastMoveTime = Date.now();

            e.preventDefault();
            e.stopPropagation();

            ui.hideModeIndicator();
        }
    }

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', stopMoving);

    ui.showModeIndicator('Move Box Mode', 'fa-arrows-alt');
},

    // Add a new copyBox function to the ui object
    copyBox: (box) => {
    const isGlobal = box.classList.contains('global');
    const originalBoxData = isGlobal
        ? constants.globalBoxes.find(b => b.x === parseFloat(box.getAttribute('data-x')) && b.y === parseFloat(box.getAttribute('data-y')))
        : constants.boxes.find(b => b.screenshotIndex === constants.currentScreenshotIndex && b.x === parseFloat(box.getAttribute('data-x')) && b.y === parseFloat(box.getAttribute('data-y')));

    if (originalBoxData) {
        const img = domElements.imageContainer.querySelector('img');
        const imgRect = img.getBoundingClientRect();
        const containerRect = domElements.imageContainer.getBoundingClientRect();

        // Calculate cursor position relative to the image
        const cursorX = (event.clientX - imgRect.left) / imgRect.width;
        const cursorY = (event.clientY - imgRect.top) / imgRect.height;

        // Create a new box centered on the cursor
        const newBox = {
            x: cursorX - (originalBoxData.width / 2),
            y: cursorY - (originalBoxData.height / 2),
            width: originalBoxData.width,
            height: originalBoxData.height,
            linkedTo: null,
            screenshotIndex: constants.currentScreenshotIndex
        };

        // Add the new box to the appropriate array
        if (isGlobal) {
            newBox.visibleOn = [constants.currentScreenshotIndex];
            constants.globalBoxes.push(newBox);
        } else {
            constants.boxes.push(newBox);
        }

        // Hide the context menu
        domElements.contextMenu.classList.add('hidden');

        // Redisplay all boxes to ensure correct positioning
        core.displayBoxes();

        // Find the newly created box element
        const newBoxElement = domElements.imageContainer.querySelector(`.box[data-x="${newBox.x}"][data-y="${newBox.y}"]`);

        // Start moving the new box if found
        if (newBoxElement) {
            ui.startMovingBox(newBoxElement);
        }
    }
},

    // Start resizing a box
    startResizingBox: (box) => {
        // Set resizing state and update UI
        constants.isResizing = true;
        constants.resizingBox = box;
        box.classList.add('resizing');
        domElements.contextMenu.classList.add('hidden');

        // Create and add resize handle to the box
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.right = '0';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.width = '10px';
        resizeHandle.style.height = '10px';
        resizeHandle.style.cursor = 'se-resize';
        resizeHandle.style.backgroundColor = 'white';
        resizeHandle.style.border = '1px solid black';
        box.appendChild(resizeHandle);

        // Get initial box position and dimensions
        const boxRect = box.getBoundingClientRect();
        const cornerX = boxRect.right;
        const cornerY = boxRect.bottom;
        const initialBoxWidth = boxRect.width;
        const initialBoxHeight = boxRect.height;

        // Get all other boxes for snapping
        const allBoxes = [...document.querySelectorAll('.box:not(.resizing)')];

        // Get border width (assuming it's the same for all sides)
        const borderWidth = parseInt(getComputedStyle(box).borderWidth) || 0;

        // Handler for resizing the box
        function resizeHandler(e) {
            if (constants.isResizing) {
                // Calculate new dimensions
                let dx = e.clientX - cornerX;
                let dy = e.clientY - cornerY;

                let newWidth = Math.max(10, initialBoxWidth + dx - borderWidth);
                let newHeight = Math.max(10, initialBoxHeight + dy - borderWidth);

                let snappedWidth = null;
                let snappedHeight = null;

                // Get the current position of the resizing box
                const resizingBoxRect = constants.resizingBox.getBoundingClientRect();
                const resizingBoxLeft = resizingBoxRect.left;
                const resizingBoxTop = resizingBoxRect.top;

                // Check for snapping only with boxes that are already snapped
                allBoxes.forEach(otherBox => {
                    const otherRect = otherBox.getBoundingClientRect();
                    
                    // Check if the boxes are snapped horizontally or vertically
                    const isSnappedHorizontally = Math.abs(resizingBoxLeft - otherRect.left) < constants.snapThreshold || 
                                                  Math.abs(resizingBoxLeft - otherRect.right) < constants.snapThreshold ||
                                                  Math.abs(resizingBoxRect.right - otherRect.left) < constants.snapThreshold ||
                                                  Math.abs(resizingBoxRect.right - otherRect.right) < constants.snapThreshold;
                    
                    const isSnappedVertically = Math.abs(resizingBoxTop - otherRect.top) < constants.snapThreshold ||
                                                Math.abs(resizingBoxTop - otherRect.bottom) < constants.snapThreshold ||
                                                Math.abs(resizingBoxRect.bottom - otherRect.top) < constants.snapThreshold ||
                                                Math.abs(resizingBoxRect.bottom - otherRect.bottom) < constants.snapThreshold;

                    // Only snap to size if the boxes are already snapped
                    if (isSnappedHorizontally) {
                        // Snap width (accounting for borders)
                        if (Math.abs(newWidth - otherRect.width) < constants.snapThreshold) {
                            snappedWidth = otherRect.width - (2 * borderWidth);
                        }
                    }
                    
                    if (isSnappedVertically) {
                        // Snap height (accounting for borders)
                        if (Math.abs(newHeight - otherRect.height) < constants.snapThreshold) {
                            snappedHeight = otherRect.height - (2 * borderWidth);
                        }
                    }
                });

                // Apply snapped dimensions if available
                if (snappedWidth !== null) {
                    newWidth = snappedWidth;
                }
                if (snappedHeight !== null) {
                    newHeight = snappedHeight;
                }

                // Update box size with exact snapped dimensions
                constants.resizingBox.style.width = `${newWidth}px`;
                constants.resizingBox.style.height = `${newHeight}px`;
            }
        }

        // Handler for stopping the resize operation
        function stopResizing(e) {
            if (constants.isResizing && e.button === 0) {
                // Reset resizing state and update UI
                constants.isResizing = false;
                constants.resizingBox.classList.remove('resizing');
                constants.resizingBox.removeChild(resizeHandle);

                // Get image dimensions
                const img = domElements.imageContainer.querySelector('img');
                const imgRect = img.getBoundingClientRect();

                // Calculate new box dimensions relative to image (excluding border)
                const newWidth = parseFloat(constants.resizingBox.style.width) / imgRect.width;
                const newHeight = parseFloat(constants.resizingBox.style.height) / imgRect.height;

                // Update box data in constants
                const isGlobal = constants.resizingBox.classList.contains('global');
                let boxData = isGlobal
                    ? constants.globalBoxes.find(b => b.x === parseFloat(constants.resizingBox.getAttribute('data-x')) && b.y === parseFloat(constants.resizingBox.getAttribute('data-y')))
                    : constants.boxes.find(b => b.screenshotIndex === constants.currentScreenshotIndex && b.x === parseFloat(constants.resizingBox.getAttribute('data-x')) && b.y === parseFloat(constants.resizingBox.getAttribute('data-y')));

                if (boxData) {
                    // Store dimensions without border
                    boxData.width = newWidth;
                    boxData.height = newHeight;
                    constants.resizingBox.setAttribute('data-width', newWidth);
                    constants.resizingBox.setAttribute('data-height', newHeight);

                    // Update box indicators
                    const indicators = constants.resizingBox.querySelector('.box-indicators');
                    if (indicators) {
                        const minSize = Math.min(newWidth * imgRect.width, newHeight * imgRect.height);
                        const scaleFactor = minSize / 100;
                        indicators.style.fontSize = `${Math.max(8, Math.min(16, scaleFactor * 12))}px`;
                        indicators.style.top = '0';
                        indicators.style.left = '0';
                        indicators.style.transform = 'translate(0, -100%)';
                    }
                }

                // Remove event listeners
                document.removeEventListener('mousemove', resizeHandler);
                document.removeEventListener('mouseup', stopResizing);
                
                // Update last move time
                constants.lastMoveTime = Date.now();

                // Prevent default behavior and stop event propagation
                e.preventDefault();
                e.stopPropagation();
            }
        }

        // Add event listeners for mouse movement and release
        document.addEventListener('mousemove', resizeHandler);
        document.addEventListener('mouseup', stopResizing);

        ui.showModeIndicator('Resize Box Mode', 'fa-expand');
    },

    // Link a box to another image
    linkBox: (box) => {
        console.log('Entering linkBox function');
        // Hide the context menu
        domElements.contextMenu.classList.add('hidden');
        // Add 'linking' class to the image list for visual feedback
        domElements.imageList.classList.add('linking');

        // Remove any existing link message overlay
        const existingMessage = document.querySelector('.link-message-overlay');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create and add a new link message overlay
        const message = document.createElement('div');
        message.innerHTML = 'Click on <i class="fas fa-image"></i> to link';
        message.className = 'link-message-overlay';
        domElements.sideToolbarWrapper.appendChild(message);

        // Show persistent mode indicator
        ui.showModeIndicator('Link Box Mode', 'fa-link', true);

        // Define the link handler function
        const linkHandler = (e) => {
            console.log('Link handler triggered');
            const imageItem = e.target.closest('.image-item');
            if (imageItem) {
                console.log('Image item clicked for linking');
                e.preventDefault();
                e.stopPropagation();
                
                // Get the index of the clicked image
                const linkedToIndex = Array.from(domElements.imageList.children).indexOf(imageItem);
                console.log(`Linking to index: ${linkedToIndex}`);
                
                // Find the box data in either global or regular boxes
                const isGlobal = box.classList.contains('global');
                let boxData = isGlobal 
                    ? constants.globalBoxes.find(b => b.x === parseFloat(box.getAttribute('data-x')) && b.y === parseFloat(box.getAttribute('data-y')))
                    : constants.boxes.find(b => b.screenshotIndex === constants.currentScreenshotIndex && b.x === parseFloat(box.getAttribute('data-x')) && b.y === parseFloat(box.getAttribute('data-y')));
                
                // Update the box data and UI if the box is found
                if (boxData) {
                    boxData.linkedTo = linkedToIndex;
                    box.classList.add('linked');
                    box.setAttribute('data-linked-to', linkedToIndex);
                    console.log('Box linked successfully');
                    
                    // Add a temporary highlight to the linked image
                    imageItem.classList.add('linked-highlight');
                    setTimeout(() => {
                        imageItem.classList.remove('linked-highlight');
                    }, 800);
                }
                
                // Clean up after linking
                domElements.imageList.classList.remove('linking');
                message.remove();
                domElements.imageList.removeEventListener('click', linkHandler);
                domElements.sideToolbarWrapper.removeEventListener('mouseover', hideMessage);
                domElements.sideToolbarWrapper.removeEventListener('mouseout', showMessage);
                core.displayBoxes();

                // Hide the mode indicator
                ui.hideModeIndicator();
            }
        };

        // Define functions to hide and show the link message
        const hideMessage = () => {
            message.style.opacity = '0';
        };

        const showMessage = () => {
            message.style.opacity = '1';
        };

        console.log('Adding link handler');
        // Add event listeners for linking and message visibility
        domElements.imageList.addEventListener('click', linkHandler);
        domElements.sideToolbarWrapper.addEventListener('mouseover', hideMessage);
        domElements.sideToolbarWrapper.removeEventListener('mouseout', showMessage);
    },

    // Unlink a box
    unlinkBox: (box) => {
        const isGlobal = box.classList.contains('global');
        let boxData = isGlobal
            ? constants.globalBoxes.find(b => b.x === parseFloat(box.getAttribute('data-x')) && b.y === parseFloat(box.getAttribute('data-y')))
            : constants.boxes.find(b => b.screenshotIndex === constants.currentScreenshotIndex && b.x === parseFloat(box.getAttribute('data-x')) && b.y === parseFloat(box.getAttribute('data-y')));

        if (boxData) {
            boxData.linkedTo = null;
            box.classList.remove('linked');
            box.removeAttribute('data-linked-to');
        }

        domElements.contextMenu.classList.add('hidden');
        core.displayBoxes();
    },

    // Delete a box
    deleteBox: (box) => {
        const isGlobal = box.classList.contains('global');
        if (isGlobal) {
            const globalBoxIndex = constants.globalBoxes.findIndex(b => 
                b.x === parseFloat(box.getAttribute('data-x')) && 
                b.y === parseFloat(box.getAttribute('data-y')));
            if (globalBoxIndex > -1) {
                constants.globalBoxes.splice(globalBoxIndex, 1);
            }
        } else {
            const boxData = constants.boxes.find(b => 
                b.screenshotIndex === constants.currentScreenshotIndex && 
                b.x === parseFloat(box.getAttribute('data-x')) && 
                b.y === parseFloat(box.getAttribute('data-y')));
            if (boxData) {
                const index = constants.boxes.indexOf(boxData);
                if (index > -1) {
                    constants.boxes.splice(index, 1);
                }
            }
        }

        box.remove();
        core.displayBoxes();
    },

// Edit visibility of a global box
editGlobalBoxVisibility: (box) => {
    // Find the global box data based on its coordinates
    const globalBox = constants.globalBoxes.find(b => 
        b.x === parseFloat(box.getAttribute('data-x')) && 
        b.y === parseFloat(box.getAttribute('data-y'))
    );

    if (globalBox) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';

        // Create visibility menu
        const visibilityMenu = document.createElement('div');
        visibilityMenu.id = 'visibilityMenu';
        visibilityMenu.className = 'visibility-modal';
        visibilityMenu.innerHTML = `
            <div class="visibility-header">
                <h3>Edit Global Box Visibility</h3>
                <p>Select images to show this box on:</p>
                <div class="visibility-controls">
                    <button id="selectAll">Select All</button>
                    <button id="deselectAll">Deselect All</button>
                    <select id="tagFilter">
                        <option value="">All Tags</option>
                        ${Array.from(new Set(constants.screenshots.flatMap(s => s.tags))).map(tag => 
                            `<option value="${tag}">${tag}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="checkbox-list-container">
                <div class="checkbox-list"></div>
            </div>
        `;

        // Get the checkbox list container
        const checkboxList = visibilityMenu.querySelector('.checkbox-list');

        // Function to create checkboxes
        const createCheckboxes = (filter = '') => {
            checkboxList.innerHTML = ''; // Clear existing checkboxes
            constants.screenshots.forEach((screenshot, index) => {
                if (filter === '' || screenshot.tags.includes(filter)) {
                    const checkboxItem = document.createElement('div');
                    checkboxItem.className = 'checkbox-item';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `visibility-${index}`;
                    checkbox.checked = globalBox.visibleOn.includes(index);
                    
                    // Add event listener to automatically save changes
                    checkbox.addEventListener('change', () => {
                        if (checkbox.checked) {
                            if (!globalBox.visibleOn.includes(index)) {
                                globalBox.visibleOn.push(index);
                            }
                        } else {
                            globalBox.visibleOn = globalBox.visibleOn.filter(i => i !== index);
                        }
                        core.displayBoxes();
                    });
                    
                    const label = document.createElement('label');
                    label.htmlFor = `visibility-${index}`;
                    label.innerHTML = `
                        <img src="${screenshot.data}" alt="${screenshot.name}">
                        <span title="${screenshot.name}">${screenshot.name}</span>
                    `;
                    
                    checkboxItem.appendChild(checkbox);
                    checkboxItem.appendChild(label);
                    checkboxList.appendChild(checkboxItem);
                }
            });
        };

        // Create initial checkboxes
        createCheckboxes();

        // Add visibility menu to modal overlay and append to body
        modalOverlay.appendChild(visibilityMenu);
        document.body.appendChild(modalOverlay);

        // Add event listener for tag filter
        const tagFilter = visibilityMenu.querySelector('#tagFilter');
        tagFilter.addEventListener('change', (e) => {
            createCheckboxes(e.target.value);
        });

        // Add event listener for "Select All" button
        document.getElementById('selectAll').addEventListener('click', () => {
            checkboxList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = true;
                cb.dispatchEvent(new Event('change'));
            });
        });

        // Add event listener for "Deselect All" button
        document.getElementById('deselectAll').addEventListener('click', () => {
            checkboxList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
                cb.dispatchEvent(new Event('change'));
            });
        });

        // Close modal when clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });
    }

    // Hide the context menu
    domElements.contextMenu.classList.add('hidden');
},


    // Hide or unhide a global box on the current image
    hideUnhideGlobalBox: (box) => {
        const globalBox = constants.globalBoxes.find(b => 
            b.x === parseFloat(box.getAttribute('data-x')) && 
            b.y === parseFloat(box.getAttribute('data-y'))
        );

        if (globalBox) {
            if (globalBox.visibleOn.includes(constants.currentScreenshotIndex)) {
                globalBox.visibleOn = globalBox.visibleOn.filter(i => i !== constants.currentScreenshotIndex);
            } else {
                globalBox.visibleOn.push(constants.currentScreenshotIndex);
            }
            core.displayBoxes();
        }

        domElements.contextMenu.classList.add('hidden');
    },

    // Set initial layout
    setInitialLayout: () => {
        if (constants.screenshots.length > 0) {
            core.scaleImage();
        } else {
            console.log('No screenshots available');
        }
    },

    // Recalculate image list layout
    recalculateImageListLayout: () => {
        domElements.sideToolbar.offsetHeight;
        ui.updateImageSize();
        domElements.sideToolbarWrapper.style.display = 'none';
        domElements.sideToolbarWrapper.offsetHeight;
        domElements.sideToolbarWrapper.style.display = '';
    },

    // Prevent dragging of the main image
    preventImageDrag: () => {
        const mainImage = domElements.imageContainer.querySelector('img');
        if (mainImage) {
            mainImage.addEventListener('dragstart', (e) => {
                e.preventDefault();
            });
        }
    },

    // Update styles for boxes
    updateBoxStyles: () => {
        const style = document.createElement('style');
        style.textContent = `
            .box.linked {
                border-color: ${constants.linkedBoxColor};
            }
            .box.linked:hover {
                background-color: ${constants.linkedBoxColor}66;
                border-color: ${constants.linkedBoxColor};
            }
            .box.global {
                border-color: ${constants.globalBoxColor};
            }
            .box.global.linked {
                border-color: ${constants.globalBoxColor};
            }
            .box.global.linked:hover {
                background-color: ${constants.globalBoxColor}66;
                border-color: ${constants.globalBoxColor};
            }
            .indicator.linked-indicator {
                background-color: ${constants.linkedBoxColor}B3;
            }
            .indicator.global-indicator {
                background-color: ${constants.globalBoxColor}B3;
            }
        `;

        const existingStyle = document.getElementById('boxStyles');
        if (existingStyle) {
            existingStyle.remove();
        }

        style.id = 'boxStyles';
        document.head.appendChild(style);
    },

    // Update active image state in the sidebar
    updateActiveImageState: (activeIndex) => {
        const imageItems = domElements.imageList.querySelectorAll('.image-item');
        imageItems.forEach((item, i) => {
            item.classList.toggle('active', i === activeIndex);
        });
    },

    // Show mode indicator
    showModeIndicator: (mode, icon, persistent = false) => {
        if (!constants.modeIndicator) return;

        const iconElement = constants.modeIndicator.querySelector('i');
        const textElement = constants.modeIndicator.querySelector('span');

        iconElement.className = `fas ${icon}`;
        textElement.textContent = mode;

        constants.modeIndicator.classList.remove('hidden');

        // Clear any existing timeout
        clearTimeout(ui.modeIndicatorTimeout);

    },

    hideModeIndicator: () => {
        if (constants.modeIndicator) {
            constants.modeIndicator.classList.add('hidden');
        }
        clearTimeout(ui.modeIndicatorTimeout);
    },
    // Handle keyboard shortcuts
    handleKeyboardShortcuts: (event) => {
        if (event.key.toUpperCase() === constants.drawBoxShortcut.key &&
            event.shiftKey === constants.drawBoxShortcut.shiftKey &&
            event.ctrlKey === constants.drawBoxShortcut.ctrlKey &&
            event.altKey === constants.drawBoxShortcut.altKey) {
            event.preventDefault();
            
            if (constants.screenshots.length > 0 && constants.showUIElements) {
                constants.isDrawing = !constants.isDrawing;
                domElements.imageContainer.style.cursor = constants.isDrawing ? 'crosshair' : 'default';
                domElements.drawBoxBtn.classList.toggle('active', constants.isDrawing);
                if (constants.isDrawing) {
                    ui.showModeIndicator('Draw Box Mode', 'fa-draw-polygon');
                } else {
                    ui.hideModeIndicator();
                }
                console.log('Draw rectangle tool toggled:', constants.isDrawing);
            } else if (constants.screenshots.length === 0) {
                console.log('No images added. Cannot toggle draw rectangle tool.');
            } else if (!constants.showUIElements) {
                console.log('UI elements are hidden. Cannot toggle draw rectangle tool.');
            }
        }
    },

    // Apply current filter to images
    applyCurrentFilter: () => {
        const searchTerm = document.getElementById('imageSearch').value.toLowerCase();
        const selectedTag = document.getElementById('tagFilter').value;

        ui.filterImages(searchTerm, selectedTag);
    },

    // Add loading styles
    addLoadingStyles: () => {
        const style = document.createElement('style');
        style.textContent = `
            .loading {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                font-size: 24px;
                color: #888;
            }
        `;
        document.head.appendChild(style);
    },

    showTagManager: (index) => {
        console.log('showTagManager called for index:', index);
        const screenshot = constants.screenshots[index];
        
        // Create a Set to store unique recent tags
        const recentTags = new Set();

        // Populate recentTags with tags from all screenshots
        constants.screenshots.forEach(ss => {
            ss.tags.forEach(tag => recentTags.add(tag));
        });

        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'tag-manager-modal modal';
        modal.innerHTML = `
            <div class="tag-manager-content modal-content" onclick="event.stopPropagation();">
                <h2>Manage Tags for ${screenshot.name}</h2>
                <div id="currentTags"></div>
                <input type="text" id="newTag" placeholder="Add new tag (press Enter to add)">
                <div id="recentTags">
                    <h3>Recent Tags</h3>
                    <div id="recentTagsList"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Get references to DOM elements
        const currentTags = modal.querySelector('#currentTags');
        const newTagInput = modal.querySelector('#newTag');
        const recentTagsContainer = modal.querySelector('#recentTagsList');

        // Function to update the display of current tags
        function updateTagDisplay() {
            currentTags.innerHTML = screenshot.tags.map(tag => 
                `<span class="tag">${tag} <button class="remove-tag" data-tag="${tag}">×</button></span>`
            ).join('');
        }

        // Function to update the display of recent tags
        function updateRecentTagsDisplay() {
            recentTagsContainer.innerHTML = Array.from(recentTags)
                .filter(tag => !screenshot.tags.includes(tag))
                .map(tag => `<button class="recent-tag">${tag}</button>`)
                .join('');
        }

        updateTagDisplay();
        updateRecentTagsDisplay();

        // Function to add a new tag
        function addTag(newTag) {
            if (newTag && !screenshot.tags.includes(newTag)) {
                screenshot.tags.push(newTag);
                recentTags.add(newTag);
                newTagInput.value = '';
                updateTagDisplay();
                updateRecentTagsDisplay();
                core.updateImageList();
                ui.updateTagFilter();
            }
        }

        // Event listener for adding new tag on Enter key press
        newTagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag(newTagInput.value.trim());
            }
        });

        // Event listener for removing tags
        currentTags.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-tag')) {
                const tagToRemove = e.target.dataset.tag;
                screenshot.tags = screenshot.tags.filter(tag => tag !== tagToRemove);
                updateTagDisplay();
                updateRecentTagsDisplay();
                core.updateImageList();
                ui.updateTagFilter();
            }
        });

        // Event listener for adding recent tags
        recentTagsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('recent-tag')) {
                addTag(e.target.textContent);
            }
        });

        // Event listener for closing the modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Function to focus on the input field
        const focusInput = () => {
            newTagInput.focus();
            newTagInput.select();
        };

        // Focus on the input field multiple times to ensure it gets focus
        focusInput();
        setTimeout(focusInput, 50);
        setTimeout(focusInput, 300);
    },

    filterImages: (searchTerm, selectedTag) => {
        const imageItems = domElements.imageList.querySelectorAll('.image-item');
        imageItems.forEach((item, index) => {
            const imageName = item.querySelector('.image-name').textContent.toLowerCase();
            const imageTags = item.querySelector('.image-tags').textContent.split(', ');

            const matchesSearch = imageName.includes(searchTerm) || imageTags.some(tag => tag.toLowerCase().includes(searchTerm));
            const matchesTag = selectedTag === '' || imageTags.includes(selectedTag);

            if (matchesSearch && matchesTag) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },

    // Update tag filter dropdown
    updateTagFilterDropdown: () => {
        const tagFilter = document.getElementById('tagFilter');
        const allTags = new Set();

        constants.screenshots.forEach(screenshot => {
            screenshot.tags.forEach(tag => allTags.add(tag));
        });

tagFilter.innerHTML = '<option value="">All Tags</option>';
allTags.forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
});
},

// Update the tag filter dropdown with all unique tags from screenshots
updateTagFilter: () => {
    const tagFilter = document.getElementById('tagFilter');
    const currentValue = tagFilter.value;
    const allTags = new Set();

    // Collect all unique tags from all screenshots
    constants.screenshots.forEach(screenshot => {
        screenshot.tags.forEach(tag => allTags.add(tag));
    });

    // Clear existing options and add default "All Tags" option
    tagFilter.innerHTML = '<option value="">All Tags</option>';

    // Add an option for each unique tag
    allTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });

    // Restore the previously selected value if it still exists
    if (Array.from(tagFilter.options).some(option => option.value === currentValue)) {
        tagFilter.value = currentValue;
    }

    // Disable the dropdown if there are no tags
    tagFilter.disabled = allTags.size === 0;
},

// Open the settings modal and initialize its content
openSettings: () => {
    // Show the settings modal
    domElements.settingsModal.classList.remove('hidden');
    
    // Update the shortcut display in the settings
    ui.updateShortcutDisplay();
    
    // Set the current color values in the color pickers
    document.getElementById('linkedBoxColor').value = constants.linkedBoxColor;
    document.getElementById('globalBoxColor').value = constants.globalBoxColor;

    // Store the original colors in the modal's dataset for potential reset
    domElements.settingsModal.dataset.originalLinkedColor = constants.linkedBoxColor;
    domElements.settingsModal.dataset.originalGlobalColor = constants.globalBoxColor;
    
    // Store the original draw box shortcut for potential reset
    constants.originalDrawBoxShortcut = { ...constants.drawBoxShortcut };

    // Add event listeners for real-time color updates
    document.getElementById('linkedBoxColor').addEventListener('input', ui.updateBoxColorsRealTime);
    document.getElementById('globalBoxColor').addEventListener('input', ui.updateBoxColorsRealTime);
},

// Close the settings modal and reset any unsaved changes
closeSettings: () => {
    // Reset colors to their original values
    constants.linkedBoxColor = domElements.settingsModal.dataset.originalLinkedColor;
    constants.globalBoxColor = domElements.settingsModal.dataset.originalGlobalColor;
    
    // Reset the draw box shortcut to its original value
    constants.drawBoxShortcut = { ...constants.originalDrawBoxShortcut };
    
    // Update the UI to reflect the reset values
    ui.updateBoxStyles();
    ui.updateShortcutDisplay();
    
    // Hide the settings modal
    domElements.settingsModal.classList.add('hidden');

    // Remove the event listeners for real-time color updates
    document.getElementById('linkedBoxColor').removeEventListener('input', ui.updateBoxColorsRealTime);
    document.getElementById('globalBoxColor').removeEventListener('input', ui.updateBoxColorsRealTime);
},

// Update box colors in real-time as the user changes them in the settings
updateBoxColorsRealTime: () => {
    // Update the linked box color from the color picker
    constants.linkedBoxColor = document.getElementById('linkedBoxColor').value;
    // Update the global box color from the color picker
    constants.globalBoxColor = document.getElementById('globalBoxColor').value;
    // Apply the new colors to all boxes
    ui.updateBoxStyles();
},

// Update the display of the draw box shortcut in the settings
updateShortcutDisplay: () => {
    let shortcutText = '';
    // Add modifier keys to the shortcut text if they are set
    if (constants.drawBoxShortcut.ctrlKey) shortcutText += 'Ctrl+';
    if (constants.drawBoxShortcut.altKey) shortcutText += 'Alt+';
    if (constants.drawBoxShortcut.shiftKey) shortcutText += 'Shift+';
    // Add the main key to the shortcut text
    shortcutText += constants.drawBoxShortcut.key;
    // Update the shortcut input field with the new text
    domElements.drawBoxShortcutInput.value = shortcutText;
},

// Save the current settings
saveSettings: () => {
    // Store the current colors as the new original colors
    domElements.settingsModal.dataset.originalLinkedColor = constants.linkedBoxColor;
    domElements.settingsModal.dataset.originalGlobalColor = constants.globalBoxColor;
    // Store the current draw box shortcut as the new original shortcut
    constants.originalDrawBoxShortcut = { ...constants.drawBoxShortcut };
    // Close the settings modal
    ui.closeSettings();
},

// Function to display help content in the help modal
displayHelpContent: () => {
    // Set the inner HTML of the help content element
    domElements.helpContent.innerHTML = `
        <h3>Welcome to the Interactive Screenshot Application</h3>
        <p>This application allows you to upload, organize, and annotate screenshots. Here are some key features:</p>
        <style>
            /* Styling for the help list */
            .help-list {
                list-style-type: none;
                padding-left: 0;
            }
            .help-list li {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            .help-list i {
                width: 30px;
                font-size: 1.2em;
                text-align: center;
                margin-right: 10px;
                color: #4CAF50;
            }
        </style>
        <ul class="help-list">
            <!-- List of features with icons and descriptions -->
            <li><i class="fas fa-upload"></i> <strong>Upload Images: &nbsp;</strong> Click the upload button in the sidebar to add screenshots.</li>
            <li><i class="fas fa-draw-polygon"></i> <strong>Draw Boxes: &nbsp;</strong> Use the draw box tool (Shift+C) to create annotations on images.</li>
            <li><i class="fas fa-link"></i> <strong>Link Boxes: &nbsp;</strong> Right-click on a box to link it to another image.</li>
            <li><i class="fas fa-globe"></i> <strong>Global Boxes: &nbsp;</strong> Create boxes that appear on multiple images.</li>
            <li><i class="fas fa-arrows-alt-h"></i> <strong>Resize Images: &nbsp;</strong> Use the slider in the sidebar to adjust thumbnail sizes.</li>
            <li><i class="fas fa-save"></i> <strong>Save Projects: &nbsp;</strong> Save your work for later use.</li>
            <li><i class="fas fa-folder-open"></i> <strong>Open Projects: &nbsp;</strong> Open existing projects you've saved before.</li>
            <li><i class="fas fa-trash-alt"></i> <strong>Delete All: &nbsp;</strong> Remove all images and annotations (use with caution).</li>
            <li><i class="fas fa-eye"></i> <strong>Visibility Control: &nbsp; </strong> Manage which images a global box appears on.</li>
        </ul>
        <!-- Additional tips and information -->
        <p>Hover over buttons to see tooltips.</p>
        <p><strong>Tip:</strong> Use <u>Shift+C</u> as a shortcut to toggle the draw box tool.</p>
    `;
},
};

// Event Listeners
const eventListeners = {
    // Initialize all event listeners for the application
    initializeEventListeners: () => {
        // Image size slider event
        domElements.imageSizeSlider.addEventListener('input', ui.updateImageSize);

        // Project management events
        domElements.openProjectBtn.addEventListener('click', eventListeners.openProject);
        domElements.saveProjectBtn.addEventListener('click', eventListeners.saveProject);
        domElements.helpIcon.addEventListener('click', ui.showHelpModal);
        domElements.settingsBtn.addEventListener('click', ui.showSettingsModal);

        // Settings events
        domElements.settingsBtn.addEventListener('click', ui.openSettings);
        

        // Sidebar toggle event
        domElements.sideToolbarToggle.addEventListener('click', () => {
            ui.toggleSidebar();
            ui.updateGlowIndicators();
        });
        
        // Drawing box events
        domElements.imageContainer.addEventListener('mousedown', core.startDrawing);
        domElements.imageContainer.addEventListener('mousemove', core.drawBox);
        domElements.imageContainer.addEventListener('mouseup', core.endDrawing);

        // Shortcut input event
        domElements.drawBoxShortcutInput.addEventListener('keydown', (e) => {
            e.preventDefault();
            constants.drawBoxShortcut = {
                key: e.key.toUpperCase(),
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey
            };
            ui.updateShortcutDisplay();
        });

        // Help modal events
        domElements.helpIcon.addEventListener('click', () => {
            domElements.helpModal.classList.remove('hidden');
            ui.displayHelpContent();
        });
        

        // Other UI events
        domElements.deleteAllScreenshotsBtn.addEventListener('click', eventListeners.deleteAllScreenshots);
        domElements.saveProjectBtn.addEventListener('click', eventListeners.saveProject);
        domElements.drawBoxBtn.addEventListener('click', eventListeners.toggleDrawBox);
        domElements.toolbarIcon.addEventListener('click', eventListeners.toggleToolbar);
        domElements.uploadScreenshotInput.addEventListener('change', eventListeners.uploadScreenshot);

        // Global document events
        document.addEventListener('click', () => domElements.contextMenu.classList.add('hidden'));
        document.addEventListener('DOMContentLoaded', ui.setInitialLayout);
        document.addEventListener('DOMContentLoaded', core.initializeApp);
        document.addEventListener('keydown', eventListeners.handleKeyboardShortcuts);

        // Window resize event
        window.addEventListener('resize', () => {
            ui.handleResize();
            ui.updateImageSize();
        });

        // Image search and filter events
        document.getElementById('imageSearch').addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const selectedTag = document.getElementById('tagFilter').value;
            ui.filterImages(searchTerm, selectedTag);
        });
        document.getElementById('tagFilter').addEventListener('change', function() {
            const searchTerm = document.getElementById('imageSearch').value.toLowerCase();
            const selectedTag = this.value;
            ui.filterImages(searchTerm, selectedTag);
        });

        // Prevent zoom gestures
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });

        document.addEventListener('gesturechange', function(e) {
            e.preventDefault();
        });

        document.addEventListener('gestureend', function(e) {
            e.preventDefault();
        });

        // Prevent mousewheel zoom
        document.addEventListener('wheel', function(e) {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        }, { passive: false });

        // Prevent pinch zoom on touchpads
        document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
    },

    // Function to open a project file
    openProject: () => {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.html';
        
        // Add event listener for file selection
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const htmlContent = e.target.result;
                    // Parse the HTML content
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlContent, 'text/html');
                    // Find the project data script
                    const projectDataScript = doc.querySelector('#projectData');
                    if (projectDataScript) {
                        // Parse and load the project data
                        const projectData = JSON.parse(projectDataScript.textContent);
                        core.loadProjectData(projectData, true);
                    } else {
                        alert('Invalid project file.');
                    }
                };
                reader.readAsText(file);
            }
        });
        
        // Trigger file selection dialog
        fileInput.click();
    },

    // Function to delete all screenshots
    deleteAllScreenshots: () => {
        if (confirm('Are you sure you want to delete all images? This action cannot be undone.')) {
            // Clear all data
            constants.screenshots = [];
            constants.boxes = [];
            constants.globalBoxes = [];
            constants.currentScreenshotIndex = -1;
            constants.currentScreenshot = null;
            domElements.imageContainer.innerHTML = '';
            core.updateImageList();
            
            // Update the tag filter dropdown
            ui.updateTagFilter();
            
            // Show placeholder message
            const placeholderMessage = document.getElementById('placeholderMessage');
            if (placeholderMessage) {
                placeholderMessage.style.display = 'flex';
                if (!domElements.imageContainer.contains(placeholderMessage)) {
                    domElements.imageContainer.appendChild(placeholderMessage);
                }
            } else {
                // Create new placeholder if it doesn't exist
                const newPlaceholder = document.createElement('div');
                newPlaceholder.id = 'placeholderMessage';
                newPlaceholder.className = 'placeholder-message';
                newPlaceholder.innerHTML = `
                    <div class="placeholder-content">
                        <i class="fas fa-image fa-10x"></i>
                        <h2>No Images Added</h2>
                        <p>Upload screenshots to get started</p>
                        <p>Click the <i class="fas fa-upload"></i> button in the sidebar</p>
                    </div>
                `;
                newPlaceholder.style.display = 'flex';
                domElements.imageContainer.appendChild(newPlaceholder);
            }
        }
    },

    // Function to save the current project
    saveProject: () => {
        // Set current screenshot to the first one if available
        if (constants.screenshots.length > 0) {
            constants.currentScreenshotIndex = 0;
            core.displayScreenshot(0);
        }

        // Hide UI elements for clean export
        constants.showUIElements = false;
        ui.updateUIVisibility();

        domElements.toolbar.classList.add('hidden');
        domElements.contextMenu.classList.add('hidden');
        domElements.sideToolbarWrapper.classList.add('hidden');
        domElements.sideToolbarToggle.style.left = '0px';
        domElements.imageContainer.style.marginLeft = '20px';

        // Prepare project data for export
        const projectData = {
            isSavedProject: true,
            showUIElements: false,
            screenshots: constants.screenshots.map(screenshot => ({
                name: screenshot.name,
                data: screenshot.data,
                tags: screenshot.tags || [] 
            })),
            boxes: constants.boxes.map(box => ({
                ...box,
                linkedTo: box.linkedTo !== null ? box.linkedTo : null
            })),
            globalBoxes: constants.globalBoxes.map(box => ({
                ...box,
                linkedTo: box.linkedTo !== null ? box.linkedTo : null
            })),
            linkedBoxColor: constants.linkedBoxColor,
            globalBoxColor: constants.globalBoxColor
        };
        
        // Serialize project data
        const serializedData = JSON.stringify(projectData);
        
        // Create or update project data script
        const dataScript = document.createElement('script');
        dataScript.id = 'projectData';
        dataScript.type = 'application/json';
        dataScript.textContent = serializedData;
        
        const existingDataScript = document.getElementById('projectData');
        if (existingDataScript) {
            existingDataScript.replaceWith(dataScript);
        } else {
            document.body.appendChild(dataScript);
        }
        
        // Generate HTML content for export
        const htmlContent = document.documentElement.outerHTML;
        
        // Create and trigger download of project file
        const blob = new Blob([htmlContent], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'interactive_screenshot_app.html';
        a.click();
        
        URL.revokeObjectURL(url);

        // Restore UI elements after short delay
        setTimeout(() => {
            constants.showUIElements = true;
            ui.updateUIVisibility();
        }, 100);
    },

    // Function to toggle draw box mode
    toggleDrawBox: () => {
        constants.isDrawing = !constants.isDrawing;
        domElements.imageContainer.style.cursor = constants.isDrawing ? 'crosshair' : 'default';
        domElements.drawBoxBtn.classList.toggle('active', constants.isDrawing);
        if (constants.isDrawing) {
            core.initializeDrawing();
            ui.showModeIndicator('Draw Box Mode', 'fa-draw-polygon');
        } else {
            ui.hideModeIndicator();
        }
    },

    // Function to toggle toolbar visibility
    toggleToolbar: (e) => {
        e.stopPropagation();
        domElements.toolbar.classList.toggle('hidden');
    },

    // Function to handle screenshot upload
uploadScreenshot: (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) {
        console.log('No files selected');
        return;
    }
    
    // Function to extract tags from filename
    const extractTags = (filename) => {
        const tagRegex = /\[([^\]]+)\]/g;
        const tags = [];
        let match;
        while ((match = tagRegex.exec(filename)) !== null) {
            tags.push(match[1]);
        }
        return tags;
    };

    // Function to remove file extension and tags from filename
    const cleanFileName = (filename) => {
        return filename.replace(/\[[^\]]+\]/g, '') // Remove tags
                    .replace(/\.[^/.]+$/, '')   // Remove file extension
                    .trim();
    };

    // Read and process each file
    Promise.all(files.map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const tags = extractTags(file.name);
                const cleanName = cleanFileName(file.name);
                resolve({ 
                    name: cleanName, 
                    data: e.target.result, 
                    tags: tags,
                    originalName: file.name // Keep original name for sorting
                });
            };
            reader.onerror = (e) => {
                reject(new Error(`Failed to read file ${file.name}: ${e.target.error}`));
            };
            reader.readAsDataURL(file);
        });
    })).then(newScreenshots => {
        // Store the current number of screenshots
        const originalScreenshotCount = constants.screenshots.length;

        // Merge and sort all screenshots
        const allScreenshots = [...constants.screenshots, ...newScreenshots];
        allScreenshots.sort((a, b) => a.name.localeCompare(b.name));

        // Create a mapping of old indices to new indices
        const indexMap = new Map();
        constants.screenshots.forEach((screenshot, oldIndex) => {
            const newIndex = allScreenshots.findIndex(s => s.name === screenshot.name);
            indexMap.set(oldIndex, newIndex);
        });

        // Update constants.screenshots with the sorted array
        constants.screenshots = allScreenshots;

        // Update box indices
        constants.boxes.forEach(box => {
            if (box.screenshotIndex < originalScreenshotCount) {
                // Only update indices for existing screenshots
                box.screenshotIndex = indexMap.get(box.screenshotIndex);
            }
        });

        // Update global box indices
        constants.globalBoxes.forEach(box => {
            box.visibleOn = box.visibleOn.map(index => {
                if (index < originalScreenshotCount) {
                    // Only update indices for existing screenshots
                    return indexMap.get(index);
                }
                return index;
            });
        });

        core.updateImageList();
        if (originalScreenshotCount === 0) {
            core.displayScreenshot(0);
        } else {
            // Find the index of the first new screenshot
            const firstNewIndex = constants.screenshots.findIndex(s => newScreenshots.some(ns => ns.name === s.name));
            core.displayScreenshot(firstNewIndex);
        }
        
        // Hide placeholder message if it exists
        const placeholderMessage = document.getElementById('placeholderMessage');
        if (placeholderMessage) {
            placeholderMessage.style.display = 'none';
        }
        ui.updateGlowIndicators();
        ui.updateTagFilter();
    }).catch(error => {
        console.error('Error uploading files:', error);
        alert('An error occurred while uploading files. Please try again.');
    }).finally(() => {
        // Reset file input
        e.target.value = '';
    });
},

    // Function to handle keyboard shortcuts
    handleKeyboardShortcuts: (event) => {
        if (event.key.toUpperCase() === constants.drawBoxShortcut.key &&
            event.shiftKey === constants.drawBoxShortcut.shiftKey &&
            event.ctrlKey === constants.drawBoxShortcut.ctrlKey &&
            event.altKey === constants.drawBoxShortcut.altKey) {
            event.preventDefault();
            
            if (constants.screenshots.length > 0 && constants.showUIElements) {
                constants.isDrawing = !constants.isDrawing;
                domElements.imageContainer.style.cursor = constants.isDrawing ? 'crosshair' : 'default';
                domElements.drawBoxBtn.classList.toggle('active', constants.isDrawing);
                if (constants.isDrawing) {
                    ui.showModeIndicator('Draw Box Mode', 'fa-draw-polygon');
                } else {
                    ui.hideModeIndicator();
                }
                console.log('Draw rectangle tool toggled:', constants.isDrawing);
            } else if (constants.screenshots.length === 0) {
                console.log('No images added. Cannot toggle draw rectangle tool.');
            } else if (!constants.showUIElements) {
                console.log('UI elements are hidden. Cannot toggle draw rectangle tool.');
            }
        }
    },
};

// Initialization function
const init = () => {
    // Set up event listeners
    eventListeners.initializeEventListeners();
    // Set initial layout
    ui.setInitialLayout();
    // Initialize the application
    core.initializeApp();

    // Configure image size slider
    domElements.imageSizeSlider.min = 1;
    domElements.imageSizeSlider.max = 4;
    domElements.imageSizeSlider.value = 2;

    // Initialize the modeIndicator
    constants.modeIndicator = domElements.modeIndicator;

    // Update image size based on slider value
    ui.updateImageSize();
    // Handle initial window size
    ui.handleResize();
    // Update glow indicators for UI elements
    ui.updateGlowIndicators();
    // Update styles for boxes
    ui.updateBoxStyles();
};

// Start the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);

// Initialize Sortable for image list when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    let autoScrollInterval;

    new Sortable(domElements.imageList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        chosenClass: 'sortable-chosen',
        forceFallback: true,
        fallbackClass: 'sortable-fallback',
        fallbackOnBody: true,
        scroll: true,
        scrollSensitivity: 30,
        scrollSpeed: 10,
        delay: 50,
        delayOnTouchOnly: false,
        touchStartThreshold: 5,
        // When dragging starts
        onStart: function(evt) {
            // Set up auto-scroll
            autoScrollInterval = setInterval(function() {
                const imageListRect = domElements.imageList.getBoundingClientRect();
                const draggedItemRect = evt.item.getBoundingClientRect();
                const scrollSpeed = 1;
                const scrollThreshold = 100;

                // Auto-scroll up
                if (draggedItemRect.top < imageListRect.top + scrollThreshold) {
                    const scrollAmount = Math.max(scrollSpeed, (imageListRect.top + scrollThreshold - draggedItemRect.top) / 2);
                    domElements.imageList.scrollTop -= scrollAmount;
                } 
                // Auto-scroll down
                else if (draggedItemRect.bottom > imageListRect.bottom - scrollThreshold) {
                    const scrollAmount = Math.max(scrollSpeed, (draggedItemRect.bottom - (imageListRect.bottom - scrollThreshold)) / 2);
                    domElements.imageList.scrollTop += scrollAmount;
                }
            }, 16);
        },
        // When dragging ends
        onEnd: function(evt) {
            // Clear auto-scroll interval
            clearInterval(autoScrollInterval);
            
            // Update screenshots array
            const [movedItem] = constants.screenshots.splice(evt.oldIndex, 1);
            constants.screenshots.splice(evt.newIndex, 0, movedItem);
            
            // Update box indices
            constants.boxes.forEach(box => {
                if (box.screenshotIndex === evt.oldIndex) {
                    box.screenshotIndex = evt.newIndex;
                } else if (box.screenshotIndex < evt.oldIndex && box.screenshotIndex >= evt.newIndex) {
                    box.screenshotIndex++;
                } else if (box.screenshotIndex > evt.oldIndex && box.screenshotIndex <= evt.newIndex) {
                    box.screenshotIndex--;
                }

                // Update linked box indices
                if (box.linkedTo !== null && box.linkedTo !== undefined) {
                    if (box.linkedTo === evt.oldIndex) {
                        box.linkedTo = evt.newIndex;
                    } else if (box.linkedTo < evt.oldIndex && box.linkedTo >= evt.newIndex) {
                        box.linkedTo++;
                    } else if (box.linkedTo > evt.oldIndex && box.linkedTo <= evt.newIndex) {
                        box.linkedTo--;
                    }
                }
            });

            // Update global box indices
            constants.globalBoxes.forEach(box => {
                box.visibleOn = box.visibleOn.map(index => {
                    if (index === evt.oldIndex) {
                        return evt.newIndex;
                    } else if (index < evt.oldIndex && index >= evt.newIndex) {
                        return index + 1;
                    } else if (index > evt.oldIndex && index <= evt.newIndex) {
                        return index - 1;
                    }
                    return index;
                });
            });

            // Update UI
            core.updateImageList();
            if (constants.currentScreenshotIndex === evt.oldIndex) {
                constants.currentScreenshotIndex = evt.newIndex;
            } else if (constants.currentScreenshotIndex < evt.oldIndex && constants.currentScreenshotIndex >= evt.newIndex) {
                constants.currentScreenshotIndex++;
            } else if (constants.currentScreenshotIndex > evt.oldIndex && constants.currentScreenshotIndex <= evt.newIndex) {
                constants.currentScreenshotIndex--;
            }
            core.displayScreenshot(constants.currentScreenshotIndex);
        },
        // When an item is being moved
        onMove: function(evt, originalEvent) {
            const placeholderEl = evt.related;
            if (placeholderEl.className === 'sortable-placeholder') return;
            
            // Create a placeholder element
            const placeholder = document.createElement('div');
            placeholder.className = 'sortable-placeholder';
            placeholder.style.width = evt.dragged.offsetWidth + 'px';
            placeholder.style.height = evt.dragged.offsetHeight + 'px';
            
            // Insert the placeholder
            if (evt.willInsertAfter) {
                if (placeholderEl.nextSibling) {
                    placeholderEl.parentNode.insertBefore(placeholder, placeholderEl.nextSibling);
                } else {
                    placeholderEl.parentNode.appendChild(placeholder);
                }
            } else {
                placeholderEl.parentNode.insertBefore(placeholder, placeholderEl);
            }
            
            // Remove any existing placeholders
            const existingPlaceholder = domElements.imageList.querySelector('.sortable-placeholder:not(:last-child)');
            if (existingPlaceholder) {
                existingPlaceholder.remove();
            }
        }
    });
});
