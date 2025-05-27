// script.js
document.addEventListener("DOMContentLoaded", () => {
    const zipFileInput = document.getElementById("zipFile");
    const dropZone = document.getElementById("dropZone");
    const fileTree = document.getElementById("fileTree");
    const previewPanel = document.getElementById("previewPanel");
    const previewTitle = document.getElementById("previewTitle");
    const previewContent = document.getElementById("previewContent");
    const downloadBtn = document.getElementById("downloadBtn");
    const closePreviewBtn = document.getElementById("closePreview");
    const searchInput = document.getElementById("searchInput");
    const clearSearchBtn = document.getElementById("clearSearch");
    const breadcrumb = document.getElementById("breadcrumb");
    const expandAllBtn = document.getElementById("expandAll");
    const collapseAllBtn = document.getElementById("collapseAll");
    const themeToggleBtn = document.getElementById("themeToggle");
    const helpBtn = document.getElementById("helpBtn");
    const helpModal = document.getElementById("helpModal");
    const closeHelpBtn = document.getElementById("closeHelp");
    const jsonViewBtn = document.getElementById("jsonViewBtn");
    const urlInput = document.getElementById('urlInput');
    const shareBtn = document.getElementById('shareBtn');
    const uploadToggle = document.getElementById('uploadToggle');
    const urlToggle = document.getElementById('urlToggle');
    const fileUploadSection = document.getElementById('fileUploadSection');
    const urlInputSection = document.getElementById('urlInputSection');
    const exportJsonBtn = document.getElementById('exportJson');
    const copyStructureBtn = document.getElementById('copyStructure');
    const folderInput = document.getElementById("folderInput");
  
    // Make fileStructure globally accessible
    window.fileStructure = {};
  
    let zip; // JSZip instance
    let currentPath = []; // Array of folder names, root is []
    let lastPreviewedFile = null; // Store last previewed file
  
    let jsonViewMode = false; // Whether JSON raw view is enabled
  
    // List of CORS proxies to try
    const CORS_PROXIES = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/',
        'https://api.codetabs.com/v1/proxy?quest='
    ];
  
    // Helper: Clear preview
    function clearPreview() {
      previewTitle.textContent = "File Preview";
      previewContent.innerHTML = "";
      previewPanel.classList.add("hidden");
      downloadBtn.onclick = null;
    }
  
    // Helper: Escape HTML to prevent XSS
    function escapeHTML(str) {
      return str.replace(/[&<>"']/g, tag => ({
        '&': "&amp;",
        '<': "&lt;",
        '>': "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[tag]));
    }
  
    // Helper: Detect if file is previewable text type
    function isTextFile(name) {
      return /\.(txt|md|json|js|css|html|xml|csv|log|ini|yaml|yml|ts|tsx|jsx|scss|less)$/i.test(name);
    }
  
    // Helper: Detect if file is image
    function isImageFile(name) {
      return /\.(png|jpe?g|gif|svg|webp)$/i.test(name);
    }
  
    // Helper: Get file type icon
    function getFileTypeIcon(fileName) {
      if (isImageFile(fileName)) {
        return { icon: "fa-image", type: "image" };
      } else if (isTextFile(fileName)) {
        if (/\.(js|ts|jsx|tsx|html|css|scss|less|json|xml|yaml|yml)$/i.test(fileName)) {
          return { icon: "fa-code", type: "code" };
        }
        return { icon: "fa-file-lines", type: "text" };
      }
      return { icon: "fa-file", type: "document" };
    }
  
    // Build nested file structure object from JSZip files
    function buildFileStructure(zip) {
        console.log('Building file structure from ZIP');
      const root = {};
  
      zip.forEach((relativePath, file) => {
            console.log('Processing file:', relativePath);
        const parts = relativePath.split("/");
        let current = root;
  
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!part) continue; // skip empty parts (from trailing /)
  
          if (i === parts.length - 1 && !file.dir) {
            // file
            if (!current.files) current.files = {};
            current.files[part] = file;
                    console.log('Added file:', part);
          } else {
            // folder
            if (!current.folders) current.folders = {};
            if (!current.folders[part]) current.folders[part] = {};
            current = current.folders[part];
                    console.log('Added folder:', part);
          }
        }
      });
  
        console.log('Final file structure:', root);
      return root;
    }
  
    // Render breadcrumb navigation
    function renderBreadcrumb() {
      breadcrumb.innerHTML = "";
  
      // Home / root link
      const rootCrumb = document.createElement("span");
      rootCrumb.className = "breadcrumb-item";
      rootCrumb.innerHTML = '<i class="fas fa-home"></i> Home';
      rootCrumb.title = "Go to root";
      rootCrumb.onclick = () => {
        currentPath = [];
        renderFileTree();
        renderBreadcrumb();
        clearPreview();
        searchInput.value = "";
      };
      breadcrumb.appendChild(rootCrumb);
  
      // Add current path segments
      currentPath.forEach((folder, i) => {
        const separator = document.createElement("span");
        separator.className = "breadcrumb-separator";
        separator.textContent = "/";
        breadcrumb.appendChild(separator);
  
        const crumb = document.createElement("span");
        crumb.className = "breadcrumb-item";
        crumb.innerHTML = `<i class="fas fa-folder"></i> ${folder}`;
        crumb.title = `Go to ${folder}`;
        crumb.onclick = () => {
          currentPath = currentPath.slice(0, i + 1);
          renderFileTree();
          renderBreadcrumb();
          clearPreview();
          searchInput.value = "";
        };
        breadcrumb.appendChild(crumb);
      });
    }
  
    // Recursively render folders and files into a ul list
    function renderList(baseStructure, container, searchTerm = "", level = 0) {
        container.innerHTML = "";
        
        const ul = document.createElement("ul");
        ul.className = "file-list";
        ul.style.marginLeft = level > 0 ? "20px" : "0";
        
        // Folders first
        if (baseStructure.folders) {
            const sortedFolders = Object.keys(baseStructure.folders).sort();
            for (const folderName of sortedFolders) {
                const folder = baseStructure.folders[folderName];
                if (searchTerm && !folderContainsSearch(folder, folderName, searchTerm)) {
                    continue;
                }
                
                const li = document.createElement("li");
                li.className = "folder";
                li.setAttribute("data-path", folder.path);
                
                const folderToggle = document.createElement("span");
                folderToggle.className = "folder-toggle";
                folderToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
                folderToggle.setAttribute("aria-label", "Toggle folder");
                folderToggle.title = "Expand/Collapse folder";
                
                const folderIcon = document.createElement("i");
                folderIcon.className = "fas fa-folder";
                folderIcon.style.color = "var(--primary-color)";
                
                const folderNameSpan = document.createElement("span");
                folderNameSpan.className = "folder-name";
                folderNameSpan.textContent = folderName;
                folderNameSpan.title = `Open ${folderName}`;
                
                li.appendChild(folderToggle);
                li.appendChild(folderIcon);
                li.appendChild(folderNameSpan);
                
                const nestedUl = document.createElement("ul");
                nestedUl.className = "file-list nested";
                nestedUl.style.display = "none";
                
                renderList(folder, nestedUl, searchTerm, level + 1);
                
                li.appendChild(nestedUl);
                
                folderToggle.onclick = (e) => {
                    e.stopPropagation();
                    const isExpanded = li.classList.contains("expanded");
                    if (isExpanded) {
                        li.classList.remove("expanded");
                        nestedUl.style.display = "none";
                        folderToggle.querySelector("i").style.transform = "rotate(0deg)";
                    } else {
                        li.classList.add("expanded");
                        nestedUl.style.display = "block";
                        folderToggle.querySelector("i").style.transform = "rotate(90deg)";
                    }
                };
                
                folderNameSpan.onclick = (e) => {
                    e.stopPropagation();
                    currentPath.push(folderName);
                    renderFileTree();
                    renderBreadcrumb();
                    clearPreview();
                    searchInput.value = "";
                };
                
                ul.appendChild(li);
            }
        }
        
        // Then files
        if (baseStructure.files) {
            const sortedFiles = Object.keys(baseStructure.files).sort();
            for (const fileName of sortedFiles) {
                const file = baseStructure.files[fileName];
                if (searchTerm && !fileName.toLowerCase().includes(searchTerm.toLowerCase())) {
                    continue;
                }
                
                const li = document.createElement("li");
                li.className = "file";
                li.setAttribute("data-path", file.path);
                
                const { icon, type } = getFileTypeIcon(fileName);
                const fileIcon = document.createElement("i");
                fileIcon.className = "fas " + icon;
                li.setAttribute("data-type", type);
                
                const fileNameSpan = document.createElement("span");
                fileNameSpan.textContent = fileName;
                fileNameSpan.title = `View ${fileName}`;
                
                li.appendChild(fileIcon);
                li.appendChild(fileNameSpan);
                
                li.onclick = (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.file').forEach(f => f.classList.remove('selected'));
                    li.classList.add('selected');
                    previewFile(file);
                };
                
                ul.appendChild(li);
            }
        }
        
        container.appendChild(ul);
    }
  
    // Check if folder or any of its subfolders/files match search term
    function folderContainsSearch(folderObj, folderName, searchTerm) {
      searchTerm = searchTerm.toLowerCase();
  
      if (folderName.toLowerCase().includes(searchTerm)) return true;
  
      if (folderObj.files) {
        for (const fileName in folderObj.files) {
          if (fileName.toLowerCase().includes(searchTerm)) return true;
        }
      }
  
      if (folderObj.folders) {
        for (const subFolderName in folderObj.folders) {
          if (folderContainsSearch(folderObj.folders[subFolderName], subFolderName, searchTerm)) {
            return true;
          }
        }
      }
  
      return false;
    }
  
    // Render the file tree based on currentPath and fileStructure
    function renderFileTree(searchTerm = "") {
      let currentNode = window.fileStructure;
      for (const folderName of currentPath) {
        if (!currentNode.folders || !currentNode.folders[folderName]) {
          // Invalid path, reset to root
          currentPath = [];
          currentNode = window.fileStructure;
          break;
        }
        currentNode = currentNode.folders[folderName];
      }
  
      renderList(currentNode, fileTree, searchTerm);
    }
  
    // Helper function to get all files from a folder
    async function getAllFiles(dirEntry, basePath = '') {
        const files = [];
        
        return new Promise((resolve, reject) => {
            const reader = dirEntry.createReader();
            
            function readEntries() {
                reader.readEntries(async (entries) => {
                    if (entries.length === 0) {
                        resolve(files);
                        return;
                    }
                    
                    for (const entry of entries) {
                        const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;
                        
                        if (entry.isFile) {
                            const file = await new Promise((resolve) => {
                                entry.file(resolve);
                            });
                            // Preserve the full path structure
                            file.webkitRelativePath = entryPath;
                            files.push(file);
                        } else if (entry.isDirectory) {
                            // Recursively get files from subdirectories
                            const subFiles = await getAllFiles(entry, entryPath);
                            files.push(...subFiles);
                        }
                    }
                    
                    readEntries();
                }, reject);
            }
            
            readEntries();
        });
    }
  
    // Function to build file structure from FileList
    async function buildStructureFromFiles(files) {
        const structure = {
            folders: {},
            files: {}
        };
        
        // Sort files by path to ensure consistent structure
        const sortedFiles = Array.from(files).sort((a, b) => {
            return (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name);
        });
        
        for (const file of sortedFiles) {
            // Get the full path and split it into parts
            const path = file.webkitRelativePath || file.name;
            const parts = path.split('/').filter(part => part); // Remove empty parts
            let current = structure;
            
            // Process each part of the path
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                
                if (i === parts.length - 1) {
                    // It's a file
                    if (!current.files) current.files = {};
                    current.files[part] = {
                        name: part,
                        file: file,
                        path: path,
                        type: getFileTypeIcon(part).type,
                        size: file.size,
                        lastModified: file.lastModified
                    };
                } else {
                    // It's a folder
                    if (!current.folders) current.folders = {};
                    if (!current.folders[part]) {
                        current.folders[part] = {
                            name: part,
                            path: parts.slice(0, i + 1).join('/'),
                            folders: {},
                            files: {},
                            type: 'folder'
                        };
                    }
                    current = current.folders[part];
                }
            }
        }
        
        return structure;
    }

    // Function to handle folder selection
    async function handleFolder(files) {
        console.log('Handling folder:', files);
        clearPreview();
        fileTree.innerHTML = "";
        fileTree.classList.add("loading");
        
        try {
            // Build the file structure
            window.fileStructure = await buildStructureFromFiles(files);
            console.log('Built file structure:', window.fileStructure);
            
            // Reset the view
            currentPath = [];
            fileTree.classList.remove("loading");
            renderFileTree();
            renderBreadcrumb();
            searchInput.value = "";
            
            // Preview the first file if available
            const firstFile = findFirstFile(window.fileStructure);
            if (firstFile) {
                previewFile(firstFile);
            }

            // Show the file structure preview - removed as it's not a direct function here.
            // previewFileStructure(); 
        } catch (err) {
            console.error('Error loading folder:', err);
            fileTree.classList.remove("loading");
            fileTree.innerHTML = `<p class="error">Failed to load folder: ${err.message}</p>`;
        }
    }

    // Helper function to find first file in structure
    function findFirstFile(structure) {
        if (structure.files && Object.keys(structure.files).length > 0) {
            const firstFileName = Object.keys(structure.files)[0];
            return structure.files[firstFileName];
        }
        if (structure.folders && Object.keys(structure.folders).length > 0) {
            const firstFolderName = Object.keys(structure.folders)[0];
            return findFirstFile(structure.folders[firstFolderName]);
        }
        return null;
    }

    // Update previewFile function to handle both ZIP and folder files
    async function previewFile(file) {
        console.log('Starting file preview for:', file.name);
        try {
            lastPreviewedFile = file;
            clearPreview();
            previewPanel.classList.remove("hidden");
            previewTitle.textContent = file.name;

            // Setup download button
            downloadBtn.onclick = () => {
                if (file.file) {
                    // Handle folder file
                    const url = URL.createObjectURL(file.file);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = file.name;
                    a.click();
                    URL.revokeObjectURL(url);
                } else {
                    // Handle ZIP file
                    file.async("blob").then(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = file.name.split("/").pop();
                        a.click();
                        URL.revokeObjectURL(url);
                    });
                }
            };

            // Get file content
            let content;
            if (file.file) {
                // Handle folder file
                content = await file.file.text();
            } else {
                // Handle ZIP file
                content = await file.async("text");
            }

            if (isTextFile(file.name)) {
                if (jsonViewMode && /\.(json)$/i.test(file.name)) {
                    try {
                        const jsonObj = JSON.parse(content);
                        const formattedJson = JSON.stringify(jsonObj, null, 2);
                        previewContent.innerHTML = `<pre class="code-preview"><code class="language-json">${escapeHTML(formattedJson)}</code></pre>`;
                        Prism.highlightElement(previewContent.querySelector('code'));
                    } catch (e) {
                        previewContent.innerHTML = `<pre class="code-preview"><code class="language-json">${escapeHTML(content)}</code></pre>`;
                        Prism.highlightElement(previewContent.querySelector('code'));
                    }
                } else {
                    previewContent.innerHTML = `<pre class="code-preview"><code>${escapeHTML(content)}</code></pre>`;
                }
            } else if (isImageFile(file.name)) {
                let url;
                if (file.file) {
                    url = URL.createObjectURL(file.file);
                } else {
                    const blob = await file.async("blob");
                    url = URL.createObjectURL(blob);
                }
                previewContent.innerHTML = `<img src="${url}" alt="${file.name}" style="max-width: 100%;">`;
            } else {
                previewContent.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Preview not supported for this file type.
                        <br>
                        <small>You can still download the file using the download button.</small>
                    </div>`;
            }
        } catch (error) {
            console.error('Error in previewFile:', error);
            previewContent.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Error loading file: ${error.message}
                </div>`;
        }
    }
  
    // Update handleUrl function to handle both ZIP and previews
    async function handleUrl(url) {
        try {
            clearPreview();
            fileTree.innerHTML = "";
            fileTree.classList.add("loading");

            // Validate URL
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                throw new Error('Please enter a valid URL starting with http:// or https://');
            }

            // Try to detect content type
            let contentType;
            // Removed direct HEAD request try, as fetchWithProxy already handles potential CORS
            
            const response = await fetchWithProxy(url);
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const fileName = url.split('/').pop().split('?')[0].split('#')[0]; // Clean filename from URL
            
            contentType = blob.type; // Get content type from the blob

            if (contentType === 'application/zip' || fileName.toLowerCase().endsWith('.zip')) {
                // Handle ZIP file
                const zip = await JSZip.loadAsync(blob);
                window.fileStructure = buildFileStructure(zip);
                currentPath = [];
                fileTree.classList.remove("loading");
                renderFileTree();
                renderBreadcrumb();

                // Preview the first file in the ZIP if available
                const firstFile = Object.values(zip.files).find(file => !file.dir);
                if (firstFile) {
                    previewFile(firstFile);
                }
            } else if (contentType && contentType.includes('text/html')) {
                // Handle webpage (this logic might need full implementation as it's partial)
                // For a simpler case, we can just preview the HTML file itself.
                const file = new File([blob], fileName || 'index.html', { type: blob.type });
                window.fileStructure = { files: { [file.name]: file } };
                fileTree.classList.remove("loading");
                renderFileTree();
                renderBreadcrumb();
                previewFile(file);

            } else {
                // Handle single file
                const file = new File([blob], fileName || 'downloaded_file', { type: blob.type });
                
                // Create a simple file structure for single files
                window.fileStructure = {
                    files: {
                        [fileName]: { // Store simplified file info
                            name: fileName,
                            file: file,
                            path: fileName,
                            type: getFileTypeIcon(fileName).type,
                            size: file.size,
                            lastModified: file.lastModified
                        }
                    }
                };
                
                // Update UI
                fileTree.classList.remove("loading");
                renderFileTree();
                renderBreadcrumb();
                previewFile(window.fileStructure.files[fileName]);
            }
        } catch (error) {
            fileTree.classList.remove("loading");
            let errorMessage = error.message;
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                errorMessage = 'Unable to access the URL. This might be due to CORS restrictions or the URL being inaccessible. Trying a different proxy.';
            }
            
            // Attempt with CORS proxies
            try {
                const proxiedUrl = await fetchWithProxy(url, {}, true); // Pass true to try proxies
                await handleUrl(proxiedUrl); // Recurse with proxied URL, but this might lead to infinite loops.
                                            // A better approach would be to manage proxy attempts directly within fetchWithProxy or here.
                return; // If proxied attempt works, exit
            } catch (proxyError) {
                errorMessage = `Failed to load from URL: ${error.message}. Tried proxies, but still failed: ${proxyError.message}`;
            }

            fileTree.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Failed to load from URL: ${errorMessage}
                    <br><br>
                    <small>Note: The URL must be publicly accessible. Try using a different URL or check if the resource is available.</small>
                </div>`;
        }
    }

    // Helper for fetching with CORS proxy
    async function fetchWithProxy(url, options = {}, tryProxies = false) {
        if (!tryProxies) {
            return fetch(url, options);
        }

        for (const proxy of CORS_PROXIES) {
            try {
                const response = await fetch(proxy + url, options);
                if (response.ok) {
                    return response;
                }
            } catch (e) {
                console.warn(`Proxy ${proxy} failed for ${url}:`, e);
            }
        }
        throw new Error('All CORS proxies failed or original URL is inaccessible.');
    }
  
    // Update handleZipFile function to also preview first file
    function handleZipFile(file) {
        console.log('Handling ZIP file:', file.name);
      clearPreview();
        fileTree.innerHTML = "";
        fileTree.classList.add("loading");
        
      JSZip.loadAsync(file).then(loadedZip => {
            console.log('ZIP file loaded successfully');
        zip = loadedZip;
        window.fileStructure = buildFileStructure(zip);
            console.log('File structure built:', window.fileStructure);
        currentPath = [];
            fileTree.classList.remove("loading");
        renderFileTree();
        renderBreadcrumb();
        searchInput.value = "";

            // Preview the first file in the ZIP if available
            const firstFile = Object.values(loadedZip.files).find(file => !file.dir);
            if (firstFile) {
                previewFile(firstFile);
            }
      }).catch(err => {
            console.error('Error loading ZIP file:', err);
            fileTree.classList.remove("loading");
        fileTree.innerHTML = `<p class="error">Failed to load ZIP file: ${err.message}</p>`;
      });
    }
  
    // Search input handler
    function handleSearchInput() {
      const term = searchInput.value.trim();
      renderFileTree(term);
      clearPreview();
    }
  
    // Clear search input
    function clearSearch() {
      searchInput.value = "";
      renderFileTree();
      clearPreview();
    }
  
    // Expand all folders recursively
    function expandAllFolders() {
      document.querySelectorAll(".folder").forEach(folder => {
        const toggle = folder.querySelector(".folder-toggle");
        const nestedUl = folder.querySelector("ul.nested");
        if (!folder.classList.contains("expanded")) {
          folder.classList.add("expanded");
          if (nestedUl) nestedUl.style.display = "block";
          if (toggle) toggle.querySelector("i").style.transform = "rotate(90deg)";
        }
        // Recursively expand nested folders
        if (nestedUl) {
          expandAllFolders(nestedUl);
        }
      });
    }
  
    // Collapse all folders recursively
    function collapseAllFolders() {
      document.querySelectorAll(".folder.expanded").forEach(folder => {
        const toggle = folder.querySelector(".folder-toggle");
        const nestedUl = folder.querySelector("ul.nested");
        if (folder.classList.contains("expanded")) {
          folder.classList.remove("expanded");
          if (nestedUl) nestedUl.style.display = "none";
          if (toggle) toggle.querySelector("i").style.transform = "rotate(0deg)";
        }
        // Recursively collapse nested folders
        if (nestedUl) {
          collapseAllFolders(nestedUl);
        }
      });
    }
  
    // Theme toggle (dark/light)
    function toggleTheme() {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-bs-theme') === 'dark';
      const theme = isDark ? 'light' : 'dark';
      html.setAttribute('data-bs-theme', theme);
      localStorage.setItem('theme', theme);
      
      // Update theme toggle icon
      const themeIcon = document.querySelector('#themeToggle i');
      themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
  
    // Initialize theme from localStorage
    function initializeTheme() {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = savedTheme || (prefersDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-bs-theme', theme);
      
      // Set initial theme icon
      const themeIcon = document.querySelector('#themeToggle i');
      themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
  
    // Prevent default behavior for drag and drop
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
  
    function highlightDropZone() {
      dropZone.classList.add('drag-over');
    }
  
    function unhighlightDropZone() {
      dropZone.classList.remove('drag-over');
    }
  
    // Update drag and drop handler
    async function handleDrop(e) {
        preventDefaults(e); // Prevent default behavior
        const dt = e.dataTransfer;
        if (dt.items) {
            // Check if it's a folder being dropped
            const items = Array.from(dt.items);
            const hasFolder = items.some(item => {
                const entry = item.webkitGetAsEntry();
                return entry && entry.isDirectory;
            });

            if (hasFolder) {
                // Show error message for folder drag and drop
                fileTree.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Folder drag and drop is not supported.</strong>
                        <br>
                        <small class="mt-2 d-block">
                            Please use the "Choose Folder" button to select a folder.
                            <br>
                            Drag and drop only works with ZIP files.
                        </small>
                    </div>`;
                unhighlightDropZone();
                return;
            }

            // Handle ZIP file drop
            if (dt.files.length > 0) {
                handleZipFile(dt.files[0]);
            }
        } else if (dt.files && dt.files.length > 0) {
            handleZipFile(dt.files[0]);
        }
        unhighlightDropZone();
    }
  
    // Update drag over handler
    function handleDragOver(e) {
        preventDefaults(e); // Prevent default behavior
        const dt = e.dataTransfer;
        if (dt.items) {
            const items = Array.from(dt.items);
            const hasFolder = items.some(item => {
                const entry = item.webkitGetAsEntry();
                return entry && entry.isDirectory;
            });

            if (hasFolder) {
                dropZone.classList.add('drag-over');
                dropZone.querySelector('p.text-muted').innerHTML = 
                    '<span class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i>Please use the "Choose Folder" button</span>';
            } else {
                dropZone.classList.add('drag-over');
                dropZone.querySelector('p.text-muted').textContent = 'Drop your ZIP file here';
            }
        }
    }

    // Update drag leave handler
    function handleDragLeave(e) {
        preventDefaults(e); // Prevent default behavior
        dropZone.classList.remove('drag-over');
        dropZone.querySelector('p.text-muted').textContent = 'or drag and drop your ZIP file here';
    }

    // Add event listeners for drag and drop
    dropZone.addEventListener("dragenter", preventDefaults);
    dropZone.addEventListener("dragover", handleDragOver);
    dropZone.addEventListener("dragleave", handleDragLeave);
    dropZone.addEventListener("drop", handleDrop);
  
    closePreviewBtn.addEventListener("click", clearPreview);
    searchInput.addEventListener("input", handleSearchInput);
    clearSearchBtn.addEventListener("click", clearSearch);
    expandAllBtn.addEventListener("click", () => expandAllFolders());
    collapseAllBtn.addEventListener("click", () => collapseAllFolders());
    themeToggleBtn.addEventListener("click", toggleTheme);
    helpBtn.addEventListener("click", openHelp);
    closeHelpBtn.addEventListener("click", closeHelp);
    jsonViewBtn.addEventListener("click", toggleJsonView);
  
    // Event listeners for modal
    helpModal.addEventListener('hidden.bs.modal', () => {
      document.body.style.overflow = '';
    });
  
    // Close modal when clicking outside
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        closeHelp();
      }
    });
  
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && helpModal.classList.contains('show')) {
        closeHelp();
      }
    });
  
    // Event listeners for URL input
    if (urlInput) {
        // Handle Enter key
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleUrlInput();
            }
        });

        // Handle Load button click
        const loadUrlBtn = document.getElementById('loadUrl');
        if (loadUrlBtn) {
            loadUrlBtn.addEventListener('click', handleUrlInput);
        }
    }

    // Add share button handler
    if (shareBtn) {
        shareBtn.addEventListener("click", () => {
            if (lastPreviewedFile) {
                const shareLink = generateShareLink(lastPreviewedFile);
                if (shareLink) {
                    // Check if clipboard API is available and 'writeText' is a function
                    if (typeof navigator.clipboard !== 'undefined' && typeof navigator.clipboard.writeText === 'function') {
                        navigator.clipboard.writeText(shareLink).then(() => {
                            alert('Share link copied to clipboard!');
                        }).catch(err => {
                            console.error('Failed to copy share link using Clipboard API:', err);
                            // Fallback for cases where writeText fails (e.g., permissions)
                            fallbackCopyTextToClipboard(shareLink);
                        });
                    } else {
                        // Fallback for non-secure contexts or older browsers
                        console.warn('Clipboard API not available or writeText not a function. Using fallback for share link.');
                        fallbackCopyTextToClipboard(shareLink);
                    }
                }
            }
        });
    }

    // Handle shared links on page load
    handleSharedLink();
  
    // Initial setup: clear preview and file tree
    clearPreview();
    fileTree.innerHTML = "<p>No ZIP file loaded.</p>";
    initializeTheme();
    renderFileTree();
    renderBreadcrumb();

    // Add toggle functionality for upload/URL sections
    if (uploadToggle && urlToggle) {
        uploadToggle.addEventListener('click', () => {
            uploadToggle.classList.add('active');
            urlToggle.classList.remove('active');
            fileUploadSection.classList.remove('d-none');
            urlInputSection.classList.add('d-none');
        });

        urlToggle.addEventListener('click', () => {
            urlToggle.classList.add('active');
            uploadToggle.classList.remove('active');
            urlInputSection.classList.remove('d-none');
            fileUploadSection.classList.add('d-none');
        });
    }

    // Add URL input handling
    function handleUrlInput() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();
        
        if (url) {
            try {
                // Validate URL format - new URL() constructor does this
                new URL(url); 
                handleUrl(url);
            } catch (error) {
                fileTree.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Invalid URL format. Please enter a valid URL starting with http:// or https://
                    </div>`;
            }
        } else {
            fileTree.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Please enter a URL
                </div>`;
        }
    }

    // Add share functionality
    function generateShareLink(file) {
        if (!file) return null;
        
        // Use file.path for files loaded from folder, file.name for ZIP files
        const filePath = file.path || file.name; 
        const shareData = {
            path: filePath,
            timestamp: Date.now()
        };
        
        // In a real application, you would store this on a server
        // For demo purposes, we'll use localStorage
        const shareId = btoa(JSON.stringify(shareData));
        localStorage.setItem(`share_${shareId}`, JSON.stringify(shareData));
        
        return `${window.location.origin}${window.location.pathname}?share=${shareId}`
    }

    // Add event listener for folder input
    folderInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFolder(e.target.files);
        }
    });

    // Add handleSharedLink function
    function handleSharedLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share');
        
        if (shareId) {
            try {
                const shareData = JSON.parse(localStorage.getItem(`share_${shareId}`));
                if (shareData && shareData.path) {
                    // This will only work if fileStructure is already loaded.
                    // For shared links, you'd ideally want to fetch the content again
                    // or ensure the ZIP/folder is loaded first.
                    // For this example, we assume the structure will be loaded.

                    const findFile = (structure, path) => {
                        if (!structure) return null; // Add null check for structure
                        
                        // Check files directly at current level
                        if (structure.files) {
                            for (const fileName in structure.files) {
                                // For files from folders, use file.path. For ZIP, file.name might be the full path.
                                const currentFilePath = structure.files[fileName].path || structure.files[fileName].name;
                                if (currentFilePath === path) {
                                    return structure.files[fileName];
                                }
                            }
                        }
                        
                        // Recurse into folders
                        if (structure.folders) {
                            for (const folderName in structure.folders) {
                                const found = findFile(structure.folders[folderName], path);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    
                    // Delay preview until fileStructure is potentially populated
                    const attemptPreview = () => {
                        const file = findFile(window.fileStructure, shareData.path);
                        if (file) {
                            previewFile(file);
                        } else {
                            // If file not found immediately, wait and retry.
                            // This is a basic retry; a more robust solution might involve
                            // re-loading the source (ZIP/URL) if the share link refers to it.
                            if (Object.keys(window.fileStructure).length === 0) {
                                setTimeout(attemptPreview, 500); // Retry after 500ms
                            } else {
                                console.warn('Shared file not found in loaded structure:', shareData.path);
                            }
                        }
                    };
                    attemptPreview();
                }
            } catch (error) {
                console.error('Error handling shared link:', error);
            }
        }
    }

    // Helper function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Function to generate structure preview
    function generateStructurePreview(structure, level = 0, prefix = '') {
        let output = '';
        const indent = '  '.repeat(level);
        
        // Add folders
        if (structure.folders) {
            for (const folderName of Object.keys(structure.folders).sort()) {
                const folder = structure.folders[folderName];
                output += `${indent}📁 ${folderName}/\n`;
                if (folder.folders || folder.files) {
                    output += generateStructurePreview(folder, level + 1, prefix + folderName + '/');
                }
            }
        }
        
        // Add files
        if (structure.files) {
            for (const fileName of Object.keys(structure.files).sort()) {
                const file = structure.files[fileName];
                const { icon } = getFileTypeIcon(fileName);
                const iconMap = {
                    'fa-image': '🖼️',
                    'fa-code': '📄',
                    'fa-file-lines': '📝',
                    'fa-file': '📄'
                };
                const emoji = iconMap[icon] || '📄';
                const fileSize = file.size ? ` (${formatFileSize(file.size)})` : '';
                // Only include path if it's different from the filename itself and not already in prefix
                const displayPath = (file.path && file.path !== fileName) ? ` [${file.path}]` : '';
                output += `${indent}${emoji} ${fileName}${fileSize}${displayPath}\n`;
            }
        }
        
        return output;
    }

    // Add copy structure functionality
    window.copyStructure = function() {
        console.log('Copy structure clicked'); // Debug log
        if (!window.fileStructure || (Object.keys(window.fileStructure.folders || {}).length === 0 && Object.keys(window.fileStructure.files || {}).length === 0)) {
            console.log('No structure to copy'); // Debug log
            const copyBtn = document.getElementById('copyStructure');
            if (copyBtn) {
                copyBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> No Structure';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Structure';
                }, 2000);
            }
            return;
        }

        const structureText = generateStructurePreview(window.fileStructure);
        console.log('Generated structure:', structureText); // Debug log
        
        // Check if Clipboard API is available and in a secure context
        if (typeof navigator.clipboard !== 'undefined' && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(structureText).then(() => {
                console.log('Structure copied successfully'); // Debug log
                // Show success message
                const copyBtn = document.getElementById('copyStructure');
                if (copyBtn) {
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    copyBtn.classList.add('copied');
                    
                    // Reset button after 2 seconds
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }
            }).catch(err => {
                console.error('Failed to copy structure using Clipboard API:', err);
                // Fallback for cases where writeText fails (e.g., permissions)
                fallbackCopyTextToClipboard(structureText);
            });
        } else {
            // Fallback for non-secure contexts or older browsers
            console.warn('Clipboard API not available or not in a secure context. Using fallback.');
            fallbackCopyTextToClipboard(structureText);
        }
    };

    // Fallback function for copying text to clipboard
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Avoid scrolling to bottom
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            const msg = successful ? 'Copied to clipboard!' : 'Failed to copy! Please copy manually.';
            alert(msg);
            const copyBtn = document.getElementById('copyStructure');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = successful ? '<i class="fas fa-check"></i> Copied!' : '<i class="fas fa-exclamation-circle"></i> Failed';
                copyBtn.classList.add(successful ? 'copied' : 'failed');
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('copied', 'failed');
                }, 2000);
            }
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            alert('Failed to copy structure. Your browser does not support automatic copying. Please copy the structure from the console or manually.');
            const copyBtn = document.getElementById('copyStructure');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            }
        }
        document.body.removeChild(textArea);
    }


    // Add event listener for copy structure button
    if (copyStructureBtn) {
        console.log('Copy structure button found, adding click listener'); // Debug log
        copyStructureBtn.addEventListener('click', window.copyStructure); // Call global function
    } else {
        console.warn('Copy structure button not found in DOM'); // Debug log
    }

    // Add CSS for copy button animation
    const style = document.createElement('style');
    style.textContent = `
        #copyStructure.copied {
            background-color: var(--bs-success) !important;
            color: white !important;
            border-color: var(--bs-success) !important;
        }
        #copyStructure.copied:hover {
            background-color: var(--bs-success) !important;
            color: white !important;
        }
        #copyStructure.failed {
            background-color: var(--bs-danger) !important;
            color: white !important;
            border-color: var(--bs-danger) !important;
        }
        #copyStructure {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    // Add help modal functions
    function openHelp() {
        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            const modal = new bootstrap.Modal(helpModal);
            modal.show();
            document.body.style.overflow = 'hidden';
        }
    }

    function closeHelp() {
        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            const modal = bootstrap.Modal.getInstance(helpModal);
            if (modal) {
                modal.hide();
            }
            document.body.style.overflow = '';
        }
    }

    // Add JSON view toggle function
    function toggleJsonView() {
        jsonViewMode = !jsonViewMode;
        const jsonViewBtn = document.getElementById('jsonViewBtn');
        if (jsonViewBtn) {
            jsonViewBtn.classList.toggle('active');
            if (lastPreviewedFile) {
                previewFile(lastPreviewedFile);
            }
        }
    }
});