// Dark mode functionality
document.addEventListener('DOMContentLoaded', () => {
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    const html = document.documentElement;
    
    // Check for saved dark mode preference
    const darkMode = localStorage.getItem('darkMode');
    
    // Apply saved preference or system preference
    if (darkMode === 'true' || (!darkMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
    }
    
    // Toggle dark mode
    darkModeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        // Save preference
        localStorage.setItem('darkMode', html.classList.contains('dark'));
        
        // Update icon
        const moonIcon = darkModeToggle.querySelector('.fa-moon');
        const sunIcon = darkModeToggle.querySelector('.fa-sun');
        
        if (html.classList.contains('dark')) {
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            moonIcon.classList.remove('hidden');
            sunIcon.classList.add('hidden');
        }
    });
});

// Zip file handling functionality
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('zipFile');
    const fileTree = document.getElementById('fileTree');
    const placeholderText = document.getElementById('placeholderText');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = uploadProgress.querySelector('div > div');
    const expandAllBtn = document.getElementById('expandAllBtn');
    const collapseAllBtn = document.getElementById('collapseAllBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const fileInfo = document.getElementById('fileInfo');
    const totalFiles = document.getElementById('totalFiles');
    const totalSize = document.getElementById('totalSize');

    // File type icons mapping
    const fileIcons = {
        // Code files
        'js': 'fa-js',
        'ts': 'fa-js',
        'py': 'fa-python',
        'java': 'fa-java',
        'cpp': 'fa-code',
        'c': 'fa-code',
        'h': 'fa-code',
        'cs': 'fa-code',
        'php': 'fa-php',
        'rb': 'fa-code',
        'go': 'fa-code',
        'rs': 'fa-code',
        'swift': 'fa-code',
        'kt': 'fa-code',
        
        // Web files
        'html': 'fa-html5',
        'css': 'fa-css3-alt',
        'scss': 'fa-sass',
        'less': 'fa-less',
        'json': 'fa-code',
        'xml': 'fa-code',
        'md': 'fa-markdown',
        
        // Data files
        'csv': 'fa-file-csv',
        'xlsx': 'fa-file-excel',
        'xls': 'fa-file-excel',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'pdf': 'fa-file-pdf',
        
        // Image files
        'png': 'fa-file-image',
        'jpg': 'fa-file-image',
        'jpeg': 'fa-file-image',
        'gif': 'fa-file-image',
        'svg': 'fa-file-image',
        
        // Archive files
        'zip': 'fa-file-zipper',
        'rar': 'fa-file-zipper',
        '7z': 'fa-file-zipper',
        'tar': 'fa-file-zipper',
        'gz': 'fa-file-zipper',
        
        // Default
        'default': 'fa-file'
    };

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-dark-300');
    }

    function unhighlight(e) {
        dropZone.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-dark-300');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            // Check file type
            if (!file.type.match(/application\/zip|application\/x-zip-compressed/) && !file.name.toLowerCase().endsWith('.zip')) {
                showToast('Please upload a valid ZIP file. Other file types are not supported.', 'error');
                fileInput.value = '';
                return;
            }

            // Check if file is empty
            if (file.size === 0) {
                showToast('The file is empty. Please upload a valid ZIP file with contents.', 'error');
                fileInput.value = '';
                return;
            }

            // Show warning for large files (over 100MB)
            const warningSize = 100 * 1024 * 1024; // 100MB in bytes
            if (file.size > warningSize) {
                const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
                showToast(`Large file detected (${sizeInMB}MB). Processing may take longer...`, 'warning');
            }

            // Show processing message
            showToast('Processing your ZIP file...', 'info');
            processZipFile(file);
        }
    }

    // Toast notification system
    function createToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer') || (() => {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'fixed bottom-4 right-4 flex flex-col gap-2 z-50';
            document.body.appendChild(container);
            return container;
        })();

        const toast = document.createElement('div');
        toast.className = 'px-4 py-2 rounded-lg shadow-lg transform translate-y-full opacity-0 transition-all duration-300 bg-white dark:bg-dark-200 border border-gray-200 dark:border-dark-400';
        
        // Create toast content
        const content = document.createElement('div');
        content.className = 'flex items-center';
        
        const icon = document.createElement('i');
        const text = document.createElement('span');
        text.className = 'text-sm font-medium text-gray-700 dark:text-gray-200';
        text.textContent = message;
        
        // Set icon and colors based on type
        let iconClass, textColor;
        switch(type) {
            case 'success':
                iconClass = 'fa-check-circle';
                textColor = 'text-green-500';
                break;
            case 'error':
                iconClass = 'fa-exclamation-circle';
                textColor = 'text-red-500';
                break;
            case 'warning':
                iconClass = 'fa-exclamation-triangle';
                textColor = 'text-yellow-500';
                break;
            case 'info':
                iconClass = 'fa-info-circle';
                textColor = 'text-blue-500';
                break;
            default:
                iconClass = 'fa-info-circle';
                textColor = 'text-blue-500';
        }
        
        icon.className = `fas ${iconClass} mr-2 ${textColor}`;
        content.appendChild(icon);
        content.appendChild(text);
        toast.appendChild(content);
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Force a reflow to ensure the animation works
        toast.offsetHeight;
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-full', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        });
        
        // Remove after delay
        const delay = type === 'warning' ? 5000 : 3000;
        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => {
                toast.remove();
                // Remove container if empty
                if (toastContainer.children.length === 0) {
                    toastContainer.remove();
                }
            }, 300);
        }, delay);
    }

    // Make createToast globally accessible
    window.createToast = createToast;

    // Replace old showToast with new createToast
    function showToast(message, type = 'success') {
        createToast(message, type);
    }

    function processZipFile(file) {
        // Show progress
        uploadProgress.classList.remove('hidden');
        progressBar.style.width = '0%';
        
        // Show initial toast
        createToast('Starting file processing...', 'info');
        
        // Read the file
        const reader = new FileReader();
        reader.onload = function(e) {
            const loadingMessage = uploadProgress.querySelector('p');
            loadingMessage.textContent = 'Processing zip file...';
            
            // Show estimated time for large files
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > 100) {
                const estimatedTime = Math.ceil(fileSizeMB / 50);
                loadingMessage.textContent = `Processing large file (${fileSizeMB.toFixed(1)}MB). Estimated time: ${estimatedTime} seconds...`;
                createToast(`Large file detected (${fileSizeMB.toFixed(1)}MB). Processing may take longer...`, 'warning');
            }
            
            // Reset any previous errors
            fileTree.innerHTML = '';
            placeholderText.style.display = 'none';
            
            JSZip.loadAsync(e.target.result, {
                checkCRC32: true,
                optimizedBinaryString: true,
                createFolders: true
            })
            .then(zip => {
                // Validate zip contents
                if (!zip) {
                    throw new Error('Invalid zip file structure');
                }

                const files = Object.entries(zip.files);
                if (files.length === 0) {
                    throw new Error('The zip file appears to be empty');
                }

                // Track skipped files for reporting
                const skippedFiles = [];
                const skippedReasons = {
                    invalidEntry: 0,
                    missingData: 0,
                    invalidSize: 0
                };

                // First pass: validate files and build directory structure
                const tree = {};
                let fileCount = 0;
                let totalSizeBytes = 0;

                files.forEach(([relativePath, zipEntry]) => {
                    // Skip empty directories
                    if (zipEntry.dir && !zipEntry._data) {
                        return;
                    }

                    // Handle directories
                    if (zipEntry.dir) {
                        const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
                        let current = tree;
                        
                        // Create folder structure
                        for (let i = 0; i < parts.length; i++) {
                            const part = parts[i];
                            if (!current[part]) {
                                current[part] = { type: 'folder', children: {} };
                            }
                            current = current[part].children;
                        }
                        return;
                    }

                    // Handle files
                    if (!zipEntry._data || zipEntry._data.uncompressedSize === undefined) {
                        skippedFiles.push({
                            path: relativePath,
                            reason: !zipEntry ? 'Invalid entry' : 'Missing data'
                        });
                        skippedReasons[!zipEntry ? 'invalidEntry' : 'missingData']++;
                        return;
                    }

                    const fileSize = zipEntry._data.uncompressedSize;
                    if (isNaN(fileSize)) {
                        skippedFiles.push({
                            path: relativePath,
                            reason: 'Invalid size'
                        });
                        skippedReasons.invalidSize++;
                        return;
                    }

                    // Add file to tree
                    const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
                    let current = tree;
                    
                    // Create folder structure
                    for (let i = 0; i < parts.length - 1; i++) {
                        const part = parts[i];
                        if (!current[part]) {
                            current[part] = { type: 'folder', children: {} };
                        }
                        current = current[part].children;
                    }
                    
                    // Add file to the last folder
                    const fileName = parts[parts.length - 1];
                    if (fileName) {
                        current[fileName] = zipEntry;
                        fileCount++;
                        totalSizeBytes += fileSize;
                    }
                });

                if (fileCount === 0) {
                    throw new Error('No valid files found in the zip archive');
                }

                // Log skipped files details if any
                if (skippedFiles.length > 0) {
                    console.group('Skipped Files Report');
                    console.log(`Total skipped files: ${skippedFiles.length}`);
                    console.log('Skipped files by reason:');
                    console.table(skippedReasons);
                    
                    // Group skipped files by reason
                    const groupedByReason = skippedFiles.reduce((acc, file) => {
                        if (!acc[file.reason]) {
                            acc[file.reason] = [];
                        }
                        acc[file.reason].push(file.path);
                        return acc;
                    }, {});
                    
                    console.log('Skipped files grouped by reason:');
                    Object.entries(groupedByReason).forEach(([reason, paths]) => {
                        console.group(`${reason} (${paths.length} files)`);
                        paths.forEach(path => console.log(path));
                        console.groupEnd();
                    });
                    
                    console.groupEnd();

                    // Store skipped files info for later use
                    window.skippedFilesInfo = {
                        total: skippedFiles.length,
                        details: skippedFiles,
                        reasons: skippedReasons,
                        groupedByReason
                    };
                }

                // Update progress message
                loadingMessage.textContent = 'Building file structure...';
                
                // Update UI with file info
                totalFiles.textContent = fileCount.toLocaleString();
                totalSize.textContent = formatFileSize(totalSizeBytes);
                
                // Show buttons
                expandAllBtn.classList.remove('hidden');
                collapseAllBtn.classList.remove('hidden');
                downloadBtn.classList.remove('hidden');
                fileInfo.classList.remove('hidden');
                devToolsBtn.classList.remove('hidden');
                
                // Render tree
                if (Object.keys(tree).length > 0) {
                    renderTree(tree, fileTree);
                } else {
                    throw new Error('No valid content to display');
                }
                
                // Complete progress
                progressBar.style.width = '100%';
                loadingMessage.textContent = 'Processing complete!';
                
                // Show skipped files message if any
                if (skippedFiles.length > 0) {
                    createToast(`Processed ${fileCount} files. ${skippedFiles.length} files were skipped.`, 'warning');
                } else {
                    createToast('File processed successfully!', 'success');
                }
                
                // Store current zip
                currentZip = zip;
                
                // Hide progress after delay
                setTimeout(() => {
                    uploadProgress.classList.add('hidden');
                }, 1000);
            })
            .catch(error => {
                console.error('Zip processing error:', error);
                handleProcessingError(error);
            });
        };
        
        reader.onerror = function() {
            console.error('File reading error:', reader.error);
            handleProcessingError(reader.error);
        };
        
        reader.onprogress = function(e) {
            if (e.lengthComputable) {
                const percentLoaded = (e.loaded / e.total) * 100;
                progressBar.style.width = percentLoaded + '%';
                const loadingMessage = uploadProgress.querySelector('p');
                const fileSizeMB = file.size / (1024 * 1024);
                
                if (fileSizeMB > 100) {
                    const loadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
                    loadingMessage.textContent = `Loading large file... ${loadedMB}MB of ${fileSizeMB.toFixed(1)}MB (${Math.round(percentLoaded)}%)`;
                } else {
                    loadingMessage.textContent = `Loading file... ${Math.round(percentLoaded)}%`;
                }
            }
        };
        
        try {
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error starting file read:', error);
            handleProcessingError(error);
        }
    }

    function handleProcessingError(error) {
        console.error('Processing error:', error);
        let errorMessage = '';
        let errorType = 'error';
        
        // Friendly error messages based on error type
        if (error.message.includes('empty')) {
            errorMessage = 'The file is empty. Please upload a valid ZIP file with contents.';
        } else if (error.message.includes('corrupted')) {
            errorMessage = 'The file appears to be corrupted. Please try a different ZIP file.';
        } else if (error.message.includes('format')) {
            errorMessage = 'Invalid file format. Please ensure you\'re uploading a valid ZIP archive.';
        } else if (error.message.includes('CRC32')) {
            errorMessage = 'The file may be corrupted. Please try a different ZIP file.';
        } else if (error.message.includes('Invalid zip file structure')) {
            errorMessage = 'The ZIP file structure is invalid. Please try a different file.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = 'The file cannot be read. It may be corrupted or in use by another program.';
        } else if (error.name === 'SecurityError') {
            errorMessage = 'Security error: The file cannot be accessed. Please try a different file.';
        } else if (error.message.includes('No valid files')) {
            errorMessage = 'No valid files found in the ZIP archive. Please check the contents of your ZIP file.';
        } else if (error.message.includes('No valid content')) {
            errorMessage = 'The ZIP file contains no displayable content. Please try a different file.';
        } else {
            errorMessage = 'An error occurred while processing the file. Please try again with a different ZIP file.';
        }
        
        // Show error toast
        createToast(errorMessage, errorType);
        
        // Reset UI state
        uploadProgress.classList.add('hidden');
        fileInput.value = '';
        
        // Reset file tree and info
        fileTree.innerHTML = '';
        placeholderText.style.display = 'block';
        expandAllBtn.classList.add('hidden');
        collapseAllBtn.classList.add('hidden');
        downloadBtn.classList.add('hidden');
        fileInfo.classList.add('hidden');
        devToolsBtn.classList.add('hidden');
        
        // Clear current zip
        currentZip = null;
    }

    function getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        return fileIcons[extension] || fileIcons.default;
    }

    function displayZipContents(zip) {
        try {
            // Clear previous content
            fileTree.innerHTML = '';
            placeholderText.style.display = 'none';
            
            // Show buttons
            expandAllBtn.classList.remove('hidden');
            collapseAllBtn.classList.remove('hidden');
            downloadBtn.classList.remove('hidden');
            fileInfo.classList.remove('hidden');
            devToolsBtn.classList.remove('hidden');
            
            // Process files
            let fileCount = 0;
            let totalSizeBytes = 0;
            let validFiles = 0;
            
            // Create tree structure
            const tree = {};
            const files = Object.entries(zip.files);
            
            // First pass: validate and count files
            files.forEach(([relativePath, zipEntry]) => {
                if (zipEntry && zipEntry._data && !zipEntry.dir) {
                    fileCount++;
                    const fileSize = zipEntry._data.uncompressedSize;
                    if (!isNaN(fileSize)) {
                        totalSizeBytes += fileSize;
                        validFiles++;
                    }
                }
            });
            
            // Second pass: build tree structure
            files.forEach(([relativePath, zipEntry]) => {
                if (zipEntry && zipEntry._data && !zipEntry.dir) {
                    // Handle both forward and backward slashes
                    const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
                    let current = tree;
                    
                    // Create folder structure
                    for (let i = 0; i < parts.length - 1; i++) {
                        const part = parts[i];
                        if (!current[part]) {
                            current[part] = { type: 'folder', children: {} };
                        }
                        current = current[part].children;
                    }
                    
                    // Add file to the last folder
                    const fileName = parts[parts.length - 1];
                    if (fileName) {
                        current[fileName] = zipEntry;
                    }
                }
            });
            
            // Update file info with safe values
            if (validFiles > 0) {
                totalFiles.textContent = validFiles.toLocaleString();
                totalSize.textContent = formatFileSize(totalSizeBytes);
                
                // Add skipped files count if any
                if (window.skippedFilesInfo) {
                    const skippedCount = document.createElement('div');
                    skippedCount.className = 'text-sm text-gray-500 dark:text-gray-400 mt-1';
                    skippedCount.textContent = `(${window.skippedFilesInfo.total} files skipped)`;
                    fileInfo.appendChild(skippedCount);
                }
            } else {
                throw new Error('No valid files found in zip');
            }
            
            // Render tree
            if (Object.keys(tree).length > 0) {
                renderTree(tree, fileTree);
            } else {
                throw new Error('No valid content to display');
            }
            
        } catch (error) {
            console.error('Error displaying zip contents:', error);
            
            // Reset UI state
            fileTree.innerHTML = '';
            placeholderText.style.display = 'block';
            expandAllBtn.classList.add('hidden');
            collapseAllBtn.classList.add('hidden');
            downloadBtn.classList.add('hidden');
            fileInfo.classList.add('hidden');
            devToolsBtn.classList.add('hidden');
            
            // Show appropriate error message
            let errorMessage = 'Error displaying zip contents. ';
            if (error.message.includes('No valid files')) {
                errorMessage = 'No valid files found in the zip archive. Please try a different file.';
            } else if (error.message.includes('No valid content')) {
                errorMessage = 'The zip file contains no displayable content. Please try a different file.';
            } else {
                errorMessage += 'Please try again with a different zip file.';
            }
            
            showToast(errorMessage, 'error');
            
            // Clear current zip
            currentZip = null;
        }
    }

    function formatFileSize(bytes) {
        if (isNaN(bytes) || bytes === undefined) {
            return '0 B';
        }

        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        // Format number with appropriate precision
        let formattedSize;
        if (unitIndex === 0) {
            formattedSize = Math.round(size); // No decimals for bytes
        } else if (size < 10) {
            formattedSize = size.toFixed(2); // 2 decimals for small numbers
        } else if (size < 100) {
            formattedSize = size.toFixed(1); // 1 decimal for medium numbers
        } else {
            formattedSize = Math.round(size); // No decimals for large numbers
        }
        
        return `${formattedSize} ${units[unitIndex]}`;
    }

    function renderTree(tree, container, level = 0) {
        try {
            // Sort entries: folders first, then files
            const entries = Object.entries(tree).sort(([aName, aContent], [bName, bContent]) => {
                const aIsFolder = aContent && aContent.type === 'folder';
                const bIsFolder = bContent && bContent.type === 'folder';
                if (aIsFolder && !bIsFolder) return -1;
                if (!aIsFolder && bIsFolder) return 1;
                return aName.localeCompare(bName);
            });

            for (const [name, content] of entries) {
                const isFile = content && content._data && content._data.uncompressedSize !== undefined;
                const isFolder = content && content.type === 'folder';
                
                if (!isFile && !isFolder) continue; // Skip invalid entries
                
                const item = document.createElement('div');
                item.className = 'file-tree-item flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-300';
                item.style.paddingLeft = `${level * 20 + 8}px`;
                
                const icon = document.createElement('i');
                if (isFile) {
                    const fileIcon = getFileIcon(name);
                    icon.className = `fas ${fileIcon} mr-2 text-primary-500`;
                } else {
                    icon.className = 'fas fa-folder mr-2 text-primary-500';
                }
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = name;
                nameSpan.className = 'text-gray-700 dark:text-gray-300';
                
                if (isFile) {
                    const sizeSpan = document.createElement('span');
                    sizeSpan.className = 'ml-2 text-xs text-gray-500 dark:text-gray-400';
                    const fileSize = content._data.uncompressedSize;
                    sizeSpan.textContent = formatFileSize(fileSize);
                    
                    item.appendChild(icon);
                    item.appendChild(nameSpan);
                    item.appendChild(sizeSpan);
                    container.appendChild(item);
                } else {
                    const toggle = document.createElement('i');
                    toggle.className = 'fas fa-chevron-right ml-2 text-gray-400 cursor-pointer transform transition-transform';
                    
                    item.appendChild(toggle);
                    item.appendChild(icon);
                    item.appendChild(nameSpan);
                    
                    const children = document.createElement('div');
                    children.className = 'hidden';
                    
                    // Only render children if there are any
                    if (content.children && Object.keys(content.children).length > 0) {
                        renderTree(content.children, children, level + 1);
                    }
                    
                    toggle.addEventListener('click', (e) => {
                        e.stopPropagation();
                        toggle.classList.toggle('rotate-90');
                        children.classList.toggle('hidden');
                    });
                    
                    container.appendChild(item);
                    container.appendChild(children);
                }
                
                if (isFile) {
                    item.addEventListener('click', () => {
                        // Remove active class from all items
                        document.querySelectorAll('.file-tree-item').forEach(el => {
                            el.classList.remove('active');
                        });
                        // Add active class to clicked item
                        item.classList.add('active');
                    });
                }
            }
        } catch (error) {
            console.error('Error rendering tree:', error);
            throw new Error('Error rendering file structure');
        }
    }

    // Expand/Collapse functionality
    expandAllBtn.addEventListener('click', () => {
        const toggles = fileTree.querySelectorAll('.fa-chevron-right');
        const children = fileTree.querySelectorAll('div > div');
        toggles.forEach(toggle => {
            toggle.classList.add('rotate-90');
        });
        children.forEach(child => {
            child.classList.remove('hidden');
        });
    });

    collapseAllBtn.addEventListener('click', () => {
        const toggles = fileTree.querySelectorAll('.fa-chevron-right');
        const children = fileTree.querySelectorAll('div > div');
        toggles.forEach(toggle => {
            toggle.classList.remove('rotate-90');
        });
        children.forEach(child => {
            child.classList.add('hidden');
        });
    });

    // Developer Tools functionality
    const devToolsBtn = document.getElementById('devToolsBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const copyStructureBtn = document.getElementById('copyStructureBtn');

    function generateTreeStructure(tree, prefix = '', isLast = true) {
        let output = '';
        const entries = Object.entries(tree).sort(([aName, aContent], [bName, bContent]) => {
            const aIsFolder = aContent && aContent.type === 'folder';
            const bIsFolder = bContent && bContent.type === 'folder';
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            return aName.localeCompare(bName);
        });

        entries.forEach(([name, content], index) => {
            const isLastEntry = index === entries.length - 1;
            const isFolder = content && content.type === 'folder';
            
            // Add the current entry
            output += prefix + (isLast ? '└── ' : '├── ') + name + '\n';
            
            // If it's a folder, recursively add its contents
            if (isFolder && content.children) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                output += generateTreeStructure(content.children, newPrefix, isLastEntry);
            }
        });

        return output;
    }

    function copyStructure(zip) {
        try {
            const tree = {};
            zip.forEach((relativePath, zipEntry) => {
                // Skip directories
                if (zipEntry.dir) return;
                
                const parts = relativePath.split('/');
                let current = tree;
                
                // Create directory structure
                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    if (!current[part]) {
                        current[part] = { type: 'folder', children: {} };
                    }
                    current = current[part].children;
                }
                
                // Add file
                const fileName = parts[parts.length - 1];
                if (fileName) {
                    current[fileName] = { type: 'file' };
                }
            });

            const structure = generateTreeStructure(tree);
            
            navigator.clipboard.writeText(structure)
                .then(() => {
                    createToast('File structure copied to clipboard!', 'success');
                })
                .catch(() => {
                    createToast('Failed to copy structure to clipboard. Please try again.', 'error');
                });
        } catch (error) {
            console.error('Error copying structure:', error);
            createToast('Failed to prepare file structure. Please try again.', 'error');
        }
    }

    // Add event listeners for dev tools buttons
    exportJsonBtn.addEventListener('click', () => {
        if (currentZip) {
            exportJson(currentZip);
        }
    });

    copyStructureBtn.addEventListener('click', () => {
        if (currentZip) {
            copyStructure(currentZip);
        }
    });

    // Store current zip file
    let currentZip = null;

       document.getElementById('year').textContent = new Date().getFullYear();

  function closeWelcomePopup() {
    const popup = document.getElementById("welcomePopup");
    popup.style.display = "none";
    popup.classList.remove('active');
    localStorage.setItem("zipTreeToolPopupShown", "true");
}

        window.addEventListener("DOMContentLoaded", function () {
            const alreadyShown = localStorage.getItem("zipTreeToolPopupShown");
            if (!alreadyShown) {
                const popup = document.getElementById("welcomePopup");
                popup.style.display = "flex";
                popup.classList.add('active');
            }
        });

        // Make sure function is global (optional if script is inline)
      window.closeWelcomePopup = closeWelcomePopup;
    
});
