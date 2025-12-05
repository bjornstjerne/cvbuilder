document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const cvInput = document.getElementById('cv-input');
    const jdInput = document.getElementById('jd-input');
    const resultsSection = document.getElementById('results-section');
    const interviewSection = document.getElementById('interview-section');
    const modelSelect = document.getElementById('model-select');

    // Initialize Storage Manager
    const cvStorage = new CVStorageManager();
    const saveVersionBtn = document.getElementById('save-version-btn');
    const historyBtn = document.getElementById('history-btn');
    const lastSavedTime = document.getElementById('last-saved-time');

    // History Modal Elements
    const historyModal = document.getElementById('history-modal');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const historyList = document.getElementById('history-list');

    // Elements to update
    const scoreValue = document.getElementById('score-value');
    const scorePath = document.getElementById('score-path');
    const scoreMessage = document.getElementById('score-message');

    const jdScoreCard = document.getElementById('jd-score-card');
    const jdScoreValue = document.getElementById('jd-score-value');
    const jdScorePath = document.getElementById('jd-score-path');
    const jdScoreMessage = document.getElementById('jd-score-message');

    const wordCountEl = document.getElementById('word-count');
    const verbCountEl = document.getElementById('verb-count');
    const readabilityEl = document.getElementById('readability-score');
    const suggestionsList = document.getElementById('suggestions-list');

    const missingKeywordsCard = document.getElementById('missing-keywords-card');
    const missingKeywordsList = document.getElementById('missing-keywords-list');

    const questionsContainer = document.getElementById('questions-container');

    // Cover Letter elements
    const coverLetterAction = document.getElementById('cover-letter-action');
    const generateCoverLetterBtn = document.getElementById('generate-cover-letter-btn');
    const coverLetterModal = document.getElementById('cover-letter-modal');
    const coverLetterText = document.getElementById('cover-letter-text');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const copyCoverLetterBtn = document.getElementById('copy-cover-letter-btn');

    // Action verbs list for analysis
    const actionVerbs = [
        'led', 'managed', 'developed', 'created', 'implemented', 'designed', 'orchestrated',
        'spearheaded', 'built', 'engineered', 'optimized', 'resolved', 'improved', 'increased',
        'decreased', 'saved', 'negotiated', 'launched', 'initiated', 'coordinated', 'mentored',
        'analyzed', 'collaborated', 'achieved', 'awarded', 'generated', 'delivered'
    ];

    // Common stopwords to ignore in JD analysis
    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'experience', 'work', 'job', 'role', 'team', 'skills', 'ability', 'knowledge', 'years', 'degree', 'qualification', 'responsible', 'duties', 'requirements', 'preferred', 'plus', 'strong', 'excellent', 'good', 'communication', 'looking', 'seeking']);

    // Utility Functions for UI Feedback
    function showLoading(message = 'Processing...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        document.body.appendChild(overlay);
    }

    function hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.remove();
    }

    function showToast(title, message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>',
            info: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F766E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // File Validation
    function validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        const allowedExtensions = ['.pdf', '.txt', '.docx', '.doc'];

        if (file.size > maxSize) {
            showToast('File Too Large', 'Please upload a file smaller than 10MB', 'error');
            return false;
        }

        // Check by MIME type OR file extension (fallback for systems that don't report MIME types correctly)
        const hasValidType = allowedTypes.includes(file.type);
        const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

        if (!hasValidType && !hasValidExtension) {
            showToast('Invalid File Type', 'Please upload a PDF, Word, or text file', 'error');
            return false;
        }

        return true;
    }

    // Character Counter
    const cvCharCount = document.getElementById('cv-char-count');
    const jdCharCount = document.getElementById('jd-char-count');

    function updateCharCount(textarea, counter) {
        const count = textarea.value.length;
        counter.textContent = `${count.toLocaleString()} character${count !== 1 ? 's' : ''}`;
    }

    // Auto-Save Functionality (Quick Save)
    function saveToStorage() {
        const cvData = {
            cvText: cvInput.value,
            jdText: jdInput.value,
            timestamp: new Date().toISOString()
        };
        cvStorage.setCurrentCV(cvData);
        updateLastSavedTime();
    }

    function updateLastSavedTime() {
        const now = new Date();
        lastSavedTime.textContent = `Saved: ${now.toLocaleTimeString()}`;
    }

    function loadFromStorage() {
        const savedData = cvStorage.getCurrentCV();

        if (savedData) {
            if (savedData.cvText) {
                cvInput.value = savedData.cvText;
                updateCharCount(cvInput, cvCharCount);
            }

            if (savedData.jdText) {
                jdInput.value = savedData.jdText;
                updateCharCount(jdInput, jdCharCount);
            }

            if (savedData.cvText || savedData.jdText) {
                showToast('Restored', 'Your previous work has been restored', 'info');
                updateLastSavedTime();
            }
        }
    }

    // Save Version (Explicit Save)
    if (saveVersionBtn) {
        saveVersionBtn.addEventListener('click', () => {
            if (!cvInput.value.trim()) {
                showToast('Empty CV', 'Please enter some CV text first', 'error');
                return;
            }

            const metadata = {
                name: `Version ${new Date().toLocaleString()}`,
                tags: ['manual-save']
            };

            cvStorage.saveCV(cvInput.value, jdInput.value, metadata);
            showToast('Version Saved', 'A new version of your CV has been saved to history', 'success');
            updateLastSavedTime();
        });
    }

    // History UI Logic
    if (historyBtn && historyModal) {
        // Open History Modal
        historyBtn.addEventListener('click', () => {
            renderHistoryList();
            historyModal.classList.remove('hidden');
            historyModal.classList.add('flex');
        });

        // Close History Modal
        closeHistoryBtn.addEventListener('click', () => {
            historyModal.classList.add('hidden');
            historyModal.classList.remove('flex');
        });

        // Close on outside click
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) {
                historyModal.classList.add('hidden');
                historyModal.classList.remove('flex');
            }
        });
    }

    function renderHistoryList() {
        if (!historyList) return;

        const cvs = cvStorage.getSavedCVs();
        historyList.innerHTML = '';

        if (cvs.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No saved versions found. Click "Save Version" to create one.</div>';
            return;
        }

        cvs.forEach(cv => {
            // Get full history for this CV to show versions
            const versions = cvStorage.getVersionHistory(cv.id);

            versions.forEach((version, index) => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.style.cssText = 'padding: 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;';

                const date = new Date(version.timestamp).toLocaleString();
                const isCurrent = index === 0 && cv === cvs[0]; // Simplified check

                item.innerHTML = `
                    <div class="history-info">
                        <div style="font-weight: 600; color: var(--text-primary);">${version.name || 'Untitled Version'}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">${date} • ${version.cvText.length} chars</div>
                    </div>
                    <div class="history-actions" style="display: flex; gap: 8px;">
                        <button class="btn-restore btn btn-sm btn-outline" data-id="${cv.id}" data-index="${index}" style="padding: 4px 12px; font-size: 0.8rem;">Restore</button>
                        <button class="btn-delete btn btn-sm btn-ghost" data-id="${cv.id}" data-index="${index}" style="padding: 4px 8px; color: var(--error-color);" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                `;

                historyList.appendChild(item);
            });
        });

        // Attach event listeners to buttons
        document.querySelectorAll('.btn-restore').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cvId = e.currentTarget.dataset.id;
                const index = parseInt(e.currentTarget.dataset.index);
                restoreVersion(cvId, index);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cvId = e.currentTarget.dataset.id;
                deleteVersion(cvId);
            });
        });
    }

    function restoreVersion(cvId, index) {
        const history = cvStorage.getVersionHistory(cvId);
        if (history && history[index]) {
            const version = history[index];

            if (confirm('Restore this version? Current unsaved changes will be replaced.')) {
                cvInput.value = version.cvText || '';
                jdInput.value = version.jdText || '';

                updateCharCount(cvInput, cvCharCount);
                updateCharCount(jdInput, jdCharCount);

                // Update current active CV
                cvStorage.setCurrentCV(version);
                updateLastSavedTime();

                showToast('Version Restored', 'CV content has been restored successfully', 'success');

                // Close modal
                historyModal.classList.add('hidden');
                historyModal.classList.remove('flex');
            }
        }
    }

    function deleteVersion(cvId) {
        if (confirm('Are you sure you want to delete this version history?')) {
            cvStorage.deleteCV(cvId);
            renderHistoryList(); // Refresh list
            showToast('Deleted', 'Version history deleted', 'info');
        }
    }

    // Attach listeners for auto-save
    cvInput.addEventListener('input', () => {
        updateCharCount(cvInput, cvCharCount);
        saveToStorage();
    });

    jdInput.addEventListener('input', () => {
        updateCharCount(jdInput, jdCharCount);
        saveToStorage();
    });

    // Load saved data on startup
    loadFromStorage();

    // Clear All Button
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all inputs? This action cannot be undone.')) {
                cvInput.value = '';
                jdInput.value = '';
                document.getElementById('file-name').textContent = '';
                document.getElementById('jd-file-name').textContent = '';

                // Clear Local Storage via Manager
                cvStorage.clearAll();

                updateCharCount(cvInput, cvCharCount);
                updateCharCount(jdInput, jdCharCount);

                // Reset ATS view if active
                if (atsRawText) atsRawText.textContent = '';

                showToast('Cleared', 'All inputs and saved data have been cleared', 'info');
            }
        });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to analyze
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (analyzeBtn && !analyzeBtn.disabled) {
                analyzeBtn.click();
            }
        }
    });

    // Cover Letter Generation
    if (generateCoverLetterBtn) {
        generateCoverLetterBtn.addEventListener('click', async () => {
            const cvText = cvInput.value.trim();
            const jdText = jdInput.value.trim();

            if (!cvText) {
                showToast('CV Required', 'Please enter your CV text first', 'error');
                return;
            }

            generateCoverLetterBtn.disabled = true;
            generateCoverLetterBtn.classList.add('loading');
            showLoading('Generating your cover letter...');

            try {
                const response = await fetch('/api/coverletter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cvText, jdText })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to generate cover letter');
                }

                const data = await response.json();

                // Display the cover letter in the modal
                coverLetterText.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${data.coverLetter}</pre>`;
                coverLetterModal.classList.remove('hidden');

                showToast('Success', 'Cover letter generated!', 'success');

            } catch (error) {
                console.error('Cover letter generation error:', error);
                showToast('Generation Failed', error.message, 'error');
            } finally {
                hideLoading();
                generateCoverLetterBtn.disabled = false;
                generateCoverLetterBtn.classList.remove('loading');
            }
        });
    }

    // Modal Controls
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            coverLetterModal.classList.add('hidden');
        });
    }

    // Close modal on outside click
    if (coverLetterModal) {
        coverLetterModal.addEventListener('click', (e) => {
            if (e.target === coverLetterModal) {
                coverLetterModal.classList.add('hidden');
            }
        });
    }

    // Copy Cover Letter
    if (copyCoverLetterBtn) {
        copyCoverLetterBtn.addEventListener('click', () => {
            const text = coverLetterText.textContent;
            navigator.clipboard.writeText(text).then(() => {
                showToast('Copied!', 'Cover letter copied to clipboard', 'success');
            }).catch(err => {
                console.error('Copy failed:', err);
                showToast('Copy Failed', 'Could not copy to clipboard', 'error');
            });
        });
    }

    // Download Cover Letter as PDF
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => {
            const element = coverLetterText;
            const opt = {
                margin: 1,
                filename: 'Cover_Letter.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            // Show loading state
            downloadPdfBtn.disabled = true;
            downloadPdfBtn.classList.add('loading');

            html2pdf().set(opt).from(element).save().then(() => {
                showToast('Downloaded!', 'Cover letter saved as PDF', 'success');
                downloadPdfBtn.disabled = false;
                downloadPdfBtn.classList.remove('loading');
            }).catch(err => {
                console.error('PDF generation failed:', err);
                showToast('Download Failed', 'Could not generate PDF', 'error');
                downloadPdfBtn.disabled = false;
                downloadPdfBtn.classList.remove('loading');
            });
        });
    }

    // Copy to Clipboard Helper
    function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied!', successMessage, 'success');
        }).catch(err => {
            showToast('Copy Failed', 'Could not copy to clipboard', 'error');
        });
    }

    // ATS View Toggle
    const atsToggle = document.getElementById('ats-toggle');
    const atsViewContainer = document.getElementById('ats-view-container');
    const atsRawText = document.getElementById('ats-raw-text');

    if (atsToggle) {
        atsToggle.addEventListener('change', () => {
            if (atsToggle.checked) {
                atsViewContainer.classList.remove('hidden');
                // Sync content
                atsRawText.textContent = cvInput.value || "No text extracted yet. Upload a CV or paste text above.";
            } else {
                atsViewContainer.classList.add('hidden');
            }
        });
    }

    // Sync ATS view when CV input changes
    cvInput.addEventListener('input', () => {
        if (atsToggle && atsToggle.checked) {
            atsRawText.textContent = cvInput.value;
        }
    });

    // Fetch available models
    async function fetchModels() {
        try {
            const response = await fetch('/api/models');
            if (response.ok) {
                const data = await response.json();
                if (data.models && data.models.length > 0) {
                    modelSelect.innerHTML = '';

                    // Curated list of recommended models (in priority order)
                    const curatedModelPatterns = [
                        'gemini-2.5-flash',      // Best default - newest Flash tier
                        'gemini-2.5-pro',        // Premium option
                        'gemini-2.0-flash',      // Stable fallback (not lite)
                        'gemini-2.0-flash-lite', // Free-tier friendly
                        'gemini-1.5-pro'         // Legacy option
                    ];

                    // Filter to only stable, recommended models
                    const recommendedModels = data.models.filter(model => {
                        const name = model.name.toLowerCase();
                        // Exclude experimental, preview, dated versions, TTS, and test models
                        if (name.includes('experimental') ||
                            name.includes('preview') ||
                            name.includes('banana') ||
                            name.includes('1206') ||
                            name.includes('tts') ||
                            name.includes('robotics') ||
                            /\d{2}-\d{2}/.test(name) ||  // Excludes date patterns like 05-20
                            /-\d{3}$/.test(name)) {      // Excludes versioned like -001
                            return false;
                        }
                        // Check if model matches any of our curated patterns
                        return curatedModelPatterns.some(pattern => name.includes(pattern));
                    });

                    // Sort by curated priority order
                    const sortedModels = recommendedModels.sort((a, b) => {
                        const aName = a.name.toLowerCase();
                        const bName = b.name.toLowerCase();
                        const aIndex = curatedModelPatterns.findIndex(p => aName.includes(p));
                        const bIndex = curatedModelPatterns.findIndex(p => bName.includes(p));
                        return aIndex - bIndex;
                    });

                    // Limit to top 5 models
                    const topModels = sortedModels.slice(0, 5);

                    topModels.forEach((model, index) => {
                        const option = document.createElement('option');
                        option.value = model.name;
                        option.textContent = model.displayName;
                        // Select the first model in the sorted list by default
                        if (index === 0) {
                            option.selected = true;
                        }
                        modelSelect.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
            // Fallback to hardcoded options in HTML
        }
    }
    fetchModels();

    // --- Helper Functions ---

    async function extractTextFromPDF(file) {
        try {
            // Lazy-load pdf.js if not already loaded
            if (typeof pdfjsLib === 'undefined') {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
                // set workerSrc for pdfjs
                if (typeof pdfjsLib !== 'undefined') {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(" ");
                fullText += pageText + "\n";
            }
            return fullText;
        } catch (e) {
            console.error("PDF Extraction Error:", e);
            throw new Error("Could not read PDF. Please ensure it is a valid text-based PDF.");
        }
    }

    // Convert PDF pages to images for visual analysis
    async function extractImagesFromPDF(file, maxPages = 3) {
        try {
            // Lazy-load pdf.js if not already loaded
            if (typeof pdfjsLib === 'undefined') {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
                if (typeof pdfjsLib !== 'undefined') {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const images = [];
            const pagesToRender = Math.min(pdf.numPages, maxPages);

            for (let i = 1; i <= pagesToRender; i++) {
                const page = await pdf.getPage(i);
                const scale = 1.5; // Good balance between quality and size
                const viewport = page.getViewport({ scale });

                // Create canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render page to canvas
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                // Convert to base64 JPEG (smaller than PNG)
                const imageData = canvas.toDataURL('image/jpeg', 0.85);
                // Remove the data:image/jpeg;base64, prefix
                const base64 = imageData.split(',')[1];
                images.push({
                    page: i,
                    data: base64,
                    mimeType: 'image/jpeg'
                });
            }

            return images;
        } catch (e) {
            console.error("PDF Image Extraction Error:", e);
            throw new Error("Could not render PDF as images.");
        }
    }

    function setupDragAndDrop(dropZone, fileInput, handleFile) {
        if (!dropZone) return;

        // Click handler
        dropZone.addEventListener('click', () => fileInput.click());

        // Drag handlers
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            dropZone.classList.add('drag-over');
        }

        function unhighlight(e) {
            dropZone.classList.remove('drag-over');
        }

        dropZone.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                fileInput.files = files; // Update input files
                handleFile(files[0]);
            }
        }
    }

    // --- CV Upload Setup ---

    const cvFileInput = document.getElementById('cv-file-upload');
    const cvFileNameDisplay = document.getElementById('file-name');
    const cvDropZone = document.getElementById('cv-drop-zone');

    if (cvFileInput) {
        cvFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) handleCVFile(file);
        });
    }

    // Drag-and-drop support for CV PDF
    if (cvDropZone && cvFileInput) {
        // Highlight on drag over
        cvDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            console.log('[Drag-Drop] Dragover event on main drop zone');
            cvDropZone.classList.add('drag-over');
        });
        cvDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            cvDropZone.classList.remove('drag-over');
        });
        cvDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            console.log('[Drag-Drop] Drop event on main drop zone');
            cvDropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleCVFile(files[0]);
            }
        });
        // Click to open file dialog
        cvDropZone.addEventListener('click', () => {
            cvFileInput.click();
        });
        // Keyboard accessibility
        cvDropZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                cvFileInput.click();
            }
        });
    }

    // Also accept drops on the surrounding container and the textarea as a fallback
    const cvFileContainer = document.querySelector('.file-upload-container');
    if (cvFileContainer && cvFileInput) {
        ['dragenter', 'dragover'].forEach(evt => {
            cvFileContainer.addEventListener(evt, (e) => {
                e.preventDefault();
                console.log('[Drag-Drop] Dragenter/over event on container');
                cvFileContainer.classList.add('drag-over');
            });
        });
        ['dragleave', 'drop'].forEach(evt => {
            cvFileContainer.addEventListener(evt, (e) => {
                e.preventDefault();
                cvFileContainer.classList.remove('drag-over');
            });
        });
        cvFileContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            console.log('[Drag-Drop] Drop event on container');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                cvFileInput.files = files;
                handleCVFile(files[0]);
            }
        });
    }

    // Allow dropping onto the CV textarea as well
    if (cvInput && cvFileInput) {
        cvInput.addEventListener('dragover', (e) => {
            e.preventDefault();
            cvInput.classList.add('drag-over');
        });
        cvInput.addEventListener('dragleave', (e) => {
            e.preventDefault();
            cvInput.classList.remove('drag-over');
        });
        cvInput.addEventListener('drop', (e) => {
            e.preventDefault();
            cvInput.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                cvFileInput.files = files;
                handleCVFile(files[0]);
            }
        });
    }

    async function handleCVFile(file) {
        console.log('[CV Upload] File received:', { name: file.name, type: file.type, size: file.size });

        if (!validateFile(file)) {
            console.log('[CV Upload] File validation failed');
            return;
        }

        cvFileNameDisplay.textContent = file.name;
        cvInput.value = "Reading PDF...";
        try {
            console.log('[CV Upload] Starting file extraction...');
            if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
                console.log('[CV Upload] Processing as PDF');
                // Extract text
                const text = await extractTextFromPDF(file);
                cvInput.value = text;

                // Also extract images for visual analysis
                console.log('[CV Upload] Extracting images for visual analysis...');
                try {
                    const images = await extractImagesFromPDF(file, 3); // Max 3 pages
                    window.cvPdfImages = images; // Store for later use
                    console.log(`[CV Upload] Extracted ${images.length} page images`);
                    showToast('Visual Mode Ready', `PDF rendered for visual analysis (${images.length} pages)`, 'info');
                } catch (imgErr) {
                    console.warn('[CV Upload] Could not extract images:', imgErr);
                    window.cvPdfImages = null;
                }
            } else if (file.name.toLowerCase().endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                console.log('[CV Upload] Processing as Word document');
                const text = await extractTextFromDocx(file);
                cvInput.value = text;
                window.cvPdfImages = null; // No visual analysis for DOCX
            } else {
                console.log('[CV Upload] Processing as plain text');
                const text = await file.text();
                cvInput.value = text;
                window.cvPdfImages = null; // No visual analysis for text
            }

            // Trigger input event to update counters and ATS view
            cvInput.dispatchEvent(new Event('input'));

            console.log('[CV Upload] File processed successfully');
            showToast('File Loaded', `Successfully loaded ${file.name}`, 'success');
        } catch (error) {
            console.error(error);
            cvInput.value = "Error reading file: " + error.message;
            showToast('Error', 'Failed to read file: ' + error.message, 'error');
        }
    }

    async function extractTextFromDocx(file) {
        // Lazy-load mammoth if needed
        if (typeof mammoth === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
            // Strip HTML tags to get raw text
            const html = result.value || '';
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        } catch (e) {
            console.error('DOCX Extraction Error:', e);
            throw new Error('Could not read DOCX. Please ensure it is a valid .docx file.');
        }
    }

    // Utility to dynamically load external scripts
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load script ' + src));
            document.head.appendChild(s);
        });
    }

    // --- JD Upload Setup ---
    const jdFileInput = document.getElementById('jd-file-upload');
    const jdFileNameDisplay = document.getElementById('jd-file-name');

    if (jdFileInput) {
        jdFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) handleJDFile(file);
        });
    }

    async function handleJDFile(file) {
        if (!validateFile(file)) return;

        jdFileNameDisplay.textContent = file.name;
        jdInput.value = "Reading PDF...";
        try {
            if (file.type === "application/pdf") {
                const text = await extractTextFromPDF(file);
                jdInput.value = text;
            } else {
                const text = await file.text();
                jdInput.value = text;
            }
            updateCharCount(jdInput, jdCharCount);
            showToast('File Loaded', `Successfully loaded ${file.name}`, 'success');
        } catch (error) {
            console.error(error);
            jdInput.value = "Error reading file: " + error.message;
            showToast('Error', 'Failed to read file: ' + error.message, 'error');
        }
    }

    // Interview questions bank
    const questionBank = {
        general: [
            "Tell me about a time you faced a significant challenge at work and how you overcame it.",
            "Where do you see yourself in five years?",
            "What is your greatest professional achievement?"
        ],
        leadership: [
            "Describe a time when you had to lead a team through a difficult project.",
            "How do you handle conflict within your team?",
            "What is your leadership style?"
        ],
        technical: [
            "How do you stay updated with the latest technologies?",
            "Describe a complex technical problem you solved.",
            "How do you ensure code quality in your projects?"
        ],
        creative: [
            "Tell me about a time you had to think outside the box.",
            "How do you approach a new design project?",
            "How do you handle creative blocks?"
        ]
    };


    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            const cvText = cvInput.value.trim();
            const jdText = jdInput.value.trim();

            if (!cvText) {
                showToast('CV Required', 'Please enter your CV text first', 'error');
                return;
            }

            await analyzeWithBackend(cvText, jdText);
        });
    }

    const downloadCvBtn = document.getElementById('download-cv-btn');
    if (downloadCvBtn) {
        downloadCvBtn.addEventListener('click', () => {
            const cvText = cvInput.value;
            if (!cvText) {
                showToast('Error', 'No CV text to download', 'error');
                return;
            }
            generateCVPDF(cvText);
        });
    }

    function generateCVPDF(text) {
        // Create a temporary element for PDF generation
        const element = document.createElement('div');
        element.style.padding = '40px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.fontSize = '12pt';
        element.style.lineHeight = '1.5';
        element.style.color = '#333';

        // Simple formatting: preserve newlines and bold potential headers
        // This is a basic heuristic to make it look better than raw text
        let formattedHtml = text
            .split('\n')
            .map(line => {
                const trimmed = line.trim();
                // Check if line looks like a header (uppercase, short, no punctuation)
                if (trimmed.length > 0 && trimmed.length < 50 && trimmed === trimmed.toUpperCase() && !trimmed.includes('.')) {
                    return `<h3 style="margin-top: 20px; margin-bottom: 10px; color: #0f766e; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${trimmed}</h3>`;
                }
                // Check for bullet points
                if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
                    return `<div style="margin-left: 20px; margin-bottom: 5px;">• ${trimmed.substring(1).trim()}</div>`;
                }
                // Regular paragraph
                if (trimmed.length > 0) {
                    return `<p style="margin-bottom: 10px;">${trimmed}</p>`;
                }
                return '';
            })
            .join('');

        element.innerHTML = formattedHtml;

        // Append to body but hide it visually (off-screen) to ensure html2canvas can render it
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.top = '0';
        document.body.appendChild(element);

        const opt = {
            margin: 10,
            filename: 'Optimized_CV.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save()
            .then(() => {
                showToast('Success', 'CV downloaded successfully', 'success');
                document.body.removeChild(element);
            })
            .catch(err => {
                console.error('PDF Generation Error:', err);
                showToast('Error', 'Failed to generate PDF. Please try again.', 'error');
                if (document.body.contains(element)) {
                    document.body.removeChild(element);
                }
            });
    }

    async function analyzeWithBackend(cvText, jdText) {
        const hasImages = window.cvPdfImages && window.cvPdfImages.length > 0;
        showLoading(hasImages ? 'Analyzing your CV visually...' : 'Analyzing your CV...');
        analyzeBtn.classList.add('loading');
        analyzeBtn.disabled = true;

        try {
            const requestBody = {
                cvText,
                jdText,
                model: modelSelect.value
            };

            // Include images for visual analysis if available
            if (hasImages) {
                requestBody.cvImages = window.cvPdfImages;
                console.log(`[Analyze] Sending ${window.cvPdfImages.length} images for visual analysis`);
            }

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 429) {
                    throw new Error('Server is busy (Rate Limit). Please wait a minute and try again.');
                }
                throw new Error(errorData.message || 'Analysis failed');
            }

            const result = await response.json();
            updateResultsFromAI(result);

            showToast('Success!', 'CV analysis completed successfully', 'success');

            // Smooth scroll to results
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);

        } catch (error) {
            console.error("Analysis failed:", error);
            const isRateLimit = error.message.includes('Rate Limit') || error.message.includes('Resource exhausted');
            showToast(
                isRateLimit ? 'Server Busy' : 'Analysis Failed',
                error.message,
                'error'
            );
        } finally {
            hideLoading();
            analyzeBtn.classList.remove('loading');
            analyzeBtn.disabled = false;
        }
    }

    function updateResultsFromAI(data) {
        // Remove placeholder styling
        document.querySelectorAll('.score-text').forEach(el => el.classList.remove('placeholder'));

        // Update Scores
        animateScore(data.score, scoreValue, scorePath, scoreMessage);
        if (data.jdScore >= 0) {
            // jdScoreCard.classList.remove('hidden'); // Always visible
            animateScore(data.jdScore, jdScoreValue, jdScorePath, jdScoreMessage);
        }

        // Update Suggestions
        suggestionsList.innerHTML = '';
        data.suggestions.forEach(s => {
            const li = document.createElement('li');
            li.textContent = s;
            suggestionsList.appendChild(li);
        });

        // Update Design Feedback (from visual analysis)
        const designFeedbackCard = document.getElementById('design-feedback-card');
        const designFeedbackList = document.getElementById('design-feedback-list');
        if (data.designFeedback && data.designFeedback.length > 0) {
            designFeedbackList.innerHTML = '';
            data.designFeedback.forEach(feedback => {
                const li = document.createElement('li');
                li.textContent = feedback;
                designFeedbackList.appendChild(li);
            });
            designFeedbackCard.classList.remove('hidden');
        } else {
            designFeedbackCard.classList.add('hidden');
        }

        // Update Missing Keywords
        missingKeywordsList.innerHTML = '';
        if (data.missingKeywords && data.missingKeywords.length > 0) {
            // missingKeywordsCard.classList.remove('hidden'); // Always visible
            data.missingKeywords.forEach(keyword => {
                const tag = document.createElement('span');
                tag.className = 'keyword-tag';
                tag.textContent = keyword;
                missingKeywordsList.appendChild(tag);
            });
        }

        // Update Interview Questions
        questionsContainer.innerHTML = '';
        if (data.interviewQuestions) {
            data.interviewQuestions.forEach(q => {
                const card = document.createElement('div');
                card.className = 'question-card';
                card.innerHTML = `
                    <span class="question-tag">${q.type}</span>
                    <p class="question-text">${q.text}</p>
                `;
                questionsContainer.appendChild(card);
            });
            // interviewSection.classList.remove('hidden'); // Always visible
        }

        // Show Results
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Show cover letter button if JD is provided
        if (jdInput.value.trim()) {
            coverLetterAction.classList.remove('hidden');
        }

        // Update basic metrics just for display
        const words = cvInput.value.trim().split(/\s+/).length;
        wordCountEl.textContent = words;
        verbCountEl.textContent = "AI Analyzed";
        readabilityEl.textContent = "AI Analyzed";

        // Render Section Tuner
        renderTuner(cvInput.value);
    }

    function analyzeCV(cvText, jdText) {
        // 1. Basic Metrics
        const words = cvText.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;

        // 2. Action Verbs Analysis
        const lowerCvText = cvText.toLowerCase();
        const foundVerbs = actionVerbs.filter(verb => lowerCvText.includes(verb));
        const uniqueVerbs = [...new Set(foundVerbs)];

        // 3. Score Calculation (Simple Heuristic)
        let score = 0;

        // Length score (aim for 400-1000 words)
        if (wordCount >= 400 && wordCount <= 1000) score += 30;
        else if (wordCount > 200) score += 15;

        // Verb score
        if (uniqueVerbs.length > 10) score += 30;
        else if (uniqueVerbs.length > 5) score += 15;
        else score += 5;

        // Structure/Formatting (Mock check - looking for common section headers)
        const sections = ['experience', 'education', 'skills', 'summary', 'projects'];
        const foundSections = sections.filter(s => lowerCvText.includes(s));
        if (foundSections.length >= 3) score += 40;
        else score += (foundSections.length * 10);

        // Cap score at 100
        score = Math.min(100, score);

        // 4. JD Analysis (if provided)
        let jdScore = 0;
        let missingKeywords = [];

        if (jdText) {
            const jdAnalysis = analyzeJD(jdText, lowerCvText);
            jdScore = jdAnalysis.score;
            missingKeywords = jdAnalysis.missing;
            jdScoreCard.classList.remove('hidden');
            missingKeywordsCard.classList.remove('hidden');
        } else {
            jdScoreCard.classList.add('hidden');
            missingKeywordsCard.classList.add('hidden');
        }

        // 5. Update UI
        updateResults(score, wordCount, uniqueVerbs.length, foundSections, jdScore, missingKeywords);
        generateInterviewQuestions(cvText);

        // Show sections
        resultsSection.classList.remove('hidden');
        interviewSection.classList.remove('hidden');

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function analyzeJD(jdText, cvLowerText) {
        // Extract potential keywords from JD (words > 4 chars, not stopwords)
        const jdWords = jdText.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.has(w));

        // Count frequency to find most important words
        const frequency = {};
        jdWords.forEach(w => {
            frequency[w] = (frequency[w] || 0) + 1;
        });

        // Get top 20 keywords
        const topKeywords = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(entry => entry[0]);

        // Check which are missing
        const missing = topKeywords.filter(keyword => !cvLowerText.includes(keyword));
        const foundCount = topKeywords.length - missing.length;

        // Calculate score
        const score = Math.round((foundCount / topKeywords.length) * 100);

        return { score, missing };
    }

    function updateResults(score, wordCount, verbCount, foundSections, jdScore, missingKeywords) {
        console.log('[Debug] updateResults called with:', { score, wordCount, verbCount, jdScore, missingKeywords });
        // Animate Scores
        animateScore(score, scoreValue, scorePath, scoreMessage);
        if (jdScore > 0) {
            animateScore(jdScore, jdScoreValue, jdScorePath, jdScoreMessage);
        }

        // Update Metrics
        wordCountEl.textContent = wordCount;
        verbCountEl.textContent = verbCount;
        readabilityEl.textContent = "High"; // Mock value for now

        // Update Suggestions
        suggestionsList.innerHTML = '';
        const suggestions = [];

        if (wordCount < 400) suggestions.push("Your CV might be too short. Aim for at least 400 words to fully detail your experience.");
        if (verbCount < 5) suggestions.push("Try using more strong action verbs (e.g., 'Led', 'Developed') to describe your achievements.");
        if (!foundSections.includes('skills')) suggestions.push("Consider adding a distinct 'Skills' section.");
        if (score > 80) suggestions.push("Great job! Your CV is well-structured and uses strong language.");

        suggestions.forEach(s => {
            const li = document.createElement('li');
            li.textContent = s;
            suggestionsList.appendChild(li);
        });

        // Update Missing Keywords
        missingKeywordsList.innerHTML = '';
        if (missingKeywords.length > 0) {
            missingKeywords.forEach(keyword => {
                const tag = document.createElement('span');
                tag.className = 'keyword-tag';
                tag.textContent = keyword;
                tag.title = "Click to generate a bullet point for this keyword";

                tag.addEventListener('click', () => generateKeywordSuggestion(keyword, tag));

                missingKeywordsList.appendChild(tag);
            });
        } else if (document.getElementById('jd-input').value.trim()) {
            const msg = document.createElement('p');
            msg.textContent = "Great match! You have all the key keywords.";
            msg.style.color = "var(--success)";
            missingKeywordsList.appendChild(msg);
            missingKeywordsList.appendChild(msg);
        }

        // Render Tuner
        renderTuner(document.getElementById('cv-input').value);
    }

    function animateScore(targetScore, valueEl, pathEl, messageEl) {
        let currentScore = 0;
        const duration = 1500;
        const interval = 20;
        const step = targetScore / (duration / interval);

        // Reset path
        pathEl.setAttribute('stroke-dasharray', `0, 100`);

        const timer = setInterval(() => {
            currentScore += step;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(timer);
            }

            valueEl.textContent = Math.round(currentScore);
            pathEl.setAttribute('stroke-dasharray', `${currentScore}, 100`);

            // Color based on score
            let color;
            let text;
            if (currentScore < 50) {
                color = 'var(--danger)';
                text = "Needs Work";
            } else if (currentScore < 75) {
                color = 'var(--warning)';
                text = "Good Start";
            } else {
                color = 'var(--success)';
                text = "Excellent";
            }

            pathEl.style.stroke = color;
            messageEl.style.color = color;
            messageEl.textContent = text;

            // Update glow color
            const glowColor = currentScore < 50 ? 'rgba(248, 113, 113, 0.5)' :
                currentScore < 75 ? 'rgba(251, 191, 36, 0.5)' :
                    'rgba(74, 222, 128, 0.5)';
            pathEl.style.filter = `drop-shadow(0 0 6px ${glowColor})`;
        }, interval);
    }

    async function generateKeywordSuggestion(keyword, tagElement) {
        if (tagElement.classList.contains('loading')) return;

        tagElement.classList.add('loading');
        showToast('Generating...', `Creating a bullet point for "${keyword}"...`, 'info');

        try {
            const response = await fetch('/api/generate-bullet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword: keyword,
                    model: modelSelect.value
                })
            });

            if (!response.ok) throw new Error('Generation failed');

            const result = await response.json();
            showKeywordPopup(keyword, result.bulletPoint);

        } catch (error) {
            console.error(error);
            showToast('Error', 'Could not generate suggestion', 'error');
        } finally {
            tagElement.classList.remove('loading');
        }
    }

    function showKeywordPopup(keyword, text) {
        // Remove existing popup
        const existing = document.querySelector('.keyword-suggestion-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.className = 'keyword-suggestion-popup';
        popup.innerHTML = `
            <div class="suggestion-header">
                <div class="suggestion-title">Suggestion for "${keyword}"</div>
                <div class="suggestion-close" onclick="this.parentElement.parentElement.remove()">×</div>
            </div>
            <div class="suggestion-content">${text}</div>
            <button class="btn btn-primary copy-suggestion-btn" onclick="navigator.clipboard.writeText('${text.replace(/'/g, "\\'")}'); showToast('Copied!', 'Bullet point copied', 'success'); this.parentElement.remove();">
                Copy to Clipboard
            </button>
        `;
        document.body.appendChild(popup);
    }

    function generateInterviewQuestions(text) {
        questionsContainer.innerHTML = '';
        const lowerText = text.toLowerCase();

        // Select categories based on keywords
        let categories = ['general'];
        if (lowerText.includes('lead') || lowerText.includes('manager') || lowerText.includes('team')) {
            categories.push('leadership');
        }
        if (lowerText.includes('design') || lowerText.includes('creative') || lowerText.includes('art')) {
            categories.push('creative');
        }
        if (lowerText.includes('code') || lowerText.includes('engineer') || lowerText.includes('developer') || lowerText.includes('data')) {
            categories.push('technical');
        }

        // Flatten and shuffle questions
        let selectedQuestions = [];
        categories.forEach(cat => {
            selectedQuestions = [...selectedQuestions, ...questionBank[cat].map(q => ({ text: q, type: cat }))];
        });

        // Pick 3 random questions
        const finalQuestions = selectedQuestions.sort(() => 0.5 - Math.random()).slice(0, 3);

        finalQuestions.forEach(q => {
            const card = document.createElement('div');
            card.className = 'question-card';
            card.innerHTML = `
                <span class="question-tag">${q.type}</span>
                <p class="question-text">${q.text}</p>
            `;
            questionsContainer.appendChild(card);
        });
    }

    // --- Smart Section Tuner ---

    function parseSections(text) {
        const sections = [];
        const lines = text.split('\n');
        let currentSection = { title: 'Header/Intro', content: [] };

        // Common section headers regex
        const headerRegex = /^(experience|education|skills|summary|profile|projects|certifications|languages|objective)/i;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Heuristic: Short lines that match keywords are likely headers
            if (trimmed.length < 30 && headerRegex.test(trimmed)) {
                if (currentSection.content.length > 0) {
                    sections.push({ ...currentSection, content: currentSection.content.join('\n') });
                }
                currentSection = { title: trimmed, content: [] };
            } else {
                currentSection.content.push(line);
            }
        });

        // Push last section
        if (currentSection.content.length > 0) {
            sections.push({ ...currentSection, content: currentSection.content.join('\n') });
        }

        return sections;
    }

    function renderTuner(text) {
        console.log('[Tuner] renderTuner called with text length:', text ? text.length : 0);
        const tunerSection = document.getElementById('tuner-section');
        const container = document.getElementById('tuner-container');

        if (!tunerSection || !container) {
            console.log('[Tuner] Elements not found:', { tunerSection: !!tunerSection, container: !!container });
            return;
        }

        tunerSection.classList.remove('hidden');
        container.innerHTML = '';

        const sections = parseSections(text);
        console.log('[Tuner] Parsed sections:', sections.length, sections);

        let cardsAdded = 0;
        sections.forEach((section, index) => {
            console.log(`[Tuner] Section ${index}:`, section.title, 'content length:', section.content.length);
            // Skip very short sections (likely noise)
            if (section.content.length < 20) {
                console.log(`[Tuner] Skipping section ${index} - too short`);
                return;
            }

            const card = document.createElement('div');
            card.className = 'tuner-card';
            card.innerHTML = `
                <div class="tuner-header">
                    <div class="tuner-title">${section.title}</div>
                    <button class="btn-optimize" onclick="optimizeSection(${index}, this)">
                        <span>✨</span> Optimize
                    </button>
                </div>
                <div class="tuner-content" id="original-${index}">${section.content}</div>
                <div id="optimized-container-${index}"></div>
            `;
            container.appendChild(card);
            cardsAdded++;
        });

        console.log('[Tuner] Cards added:', cardsAdded);

        if (cardsAdded === 0) {
            container.innerHTML = '<div class="tuner-placeholder">No sections detected. Try a CV with clear headers like "Experience", "Education", or "Summary".</div>';
        }
    }

    window.optimizeSection = async function (index, btn) {
        const originalContent = document.getElementById(`original-${index}`).textContent;
        const container = document.getElementById(`optimized-container-${index}`);
        const title = btn.previousElementSibling.textContent;

        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> Optimizing...';

        try {
            const response = await fetch('/api/optimize-section', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sectionText: originalContent,
                    sectionType: title,
                    model: modelSelect.value
                })
            });

            if (!response.ok) throw new Error('Optimization failed');

            const result = await response.json();

            container.innerHTML = `
                <div class="tuner-optimized">
                    <h4><span>🚀</span> Optimized Version</h4>
                    <div style="white-space: pre-wrap; font-size: 0.9rem; margin-bottom: 12px;">${result.optimizedText}</div>
                    <button class="btn-copy-sm" onclick="navigator.clipboard.writeText(\`${result.optimizedText.replace(/`/g, "\\`")}\`); showToast('Copied!', 'Optimized text copied', 'success');">
                        Copy to Clipboard
                    </button>
                </div>
            `;

            showToast('Optimized!', `Section "${title}" updated`, 'success');

        } catch (error) {
            console.error(error);
            showToast('Error', 'Could not optimize section', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>✨</span> Optimize';
        }
    };

    // Keyboard accessibility for modal
    if (coverLetterModal) {
        coverLetterModal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                coverLetterModal.classList.add('hidden');
                closeModalBtn.focus();
            }
            if (e.key === 'Tab') {
                const focusable = coverLetterModal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
        // Focus modal when opened
        document.getElementById('generate-cover-letter-btn')?.addEventListener('click', () => {
            setTimeout(() => {
                closeModalBtn.focus();
            }, 100);
        });
    }
});
