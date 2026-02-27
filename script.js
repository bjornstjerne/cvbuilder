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
    const tunerSection = document.getElementById('tuner-section');
    const tunerContainer = document.getElementById('tuner-container');
    let latestCoverLetter = '';
    let clientErrorEventsSent = 0;
    const MAX_CLIENT_ERROR_EVENTS = 8;

    function safeStringify(value, fallback = 'Unknown') {
        try {
            if (value == null) return fallback;
            if (typeof value === 'string') return value;
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
        } catch (_) {
            return fallback;
        }
    }

    function shouldIgnoreClientError(message) {
        const text = String(message || '').toLowerCase();
        if (!text) return true;

        const ignoredPatterns = [
            'resizeobserver loop limit exceeded',
            'non-error promise rejection captured',
            'networkerror when attempting to fetch resource'
        ];

        return ignoredPatterns.some((pattern) => text.includes(pattern));
    }

    function sendClientErrorToServer(payload) {
        if (clientErrorEventsSent >= MAX_CLIENT_ERROR_EVENTS) return;
        clientErrorEventsSent += 1;

        const body = JSON.stringify(payload);

        // sendBeacon is resilient during page unload/navigation.
        if (navigator.sendBeacon) {
            const blob = new Blob([body], { type: 'application/json' });
            navigator.sendBeacon('/api/log-client-error', blob);
            return;
        }

        fetch('/api/log-client-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true
        }).catch(() => {
            // Avoid recursive reporting loops if logging endpoint is unavailable.
        });
    }

    function installClientErrorMonitoring() {
        if (window.__cvErrorMonitoringInstalled) return;
        window.__cvErrorMonitoringInstalled = true;

        const basePayload = {
            page: window.location.pathname,
            build: new URLSearchParams(window.location.search).get('build') || '',
            userAgent: navigator.userAgent
        };

        window.addEventListener('error', (event) => {
            const message = safeStringify(event.message);
            if (shouldIgnoreClientError(message)) return;

            sendClientErrorToServer({
                type: 'window-error',
                message: message.slice(0, 240),
                source: safeStringify(event.filename || '').slice(0, 240),
                line: Number(event.lineno) || 0,
                col: Number(event.colno) || 0,
                stack: safeStringify(event.error && event.error.stack || '').slice(0, 1200),
                ...basePayload
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            const reason = event.reason;
            const message = (reason && reason.message) ? reason.message : safeStringify(reason, 'Unhandled promise rejection');
            if (shouldIgnoreClientError(message)) return;

            sendClientErrorToServer({
                type: 'unhandled-rejection',
                message: safeStringify(message).slice(0, 240),
                stack: safeStringify(reason && reason.stack || '').slice(0, 1200),
                ...basePayload
            });
        });
    }
    installClientErrorMonitoring();

    // Action verbs and stopwords moved to js/analyzer.js
    // UI Helpers moved to js/ui-helpers.js

    // File Validation moved to js/file-processor.js

    // Character Counter
    const cvCharCount = document.getElementById('cv-char-count');
    const jdCharCount = document.getElementById('jd-char-count');
    let storageWarningShown = false;

    // Character Counting logic moved to js/ui-helpers.js

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

    function safeSaveToStorage() {
        try {
            saveToStorage();
            return true;
        } catch (error) {
            console.warn('[Storage] Failed to save quick draft:', error);
            if (!storageWarningShown) {
                showToast(
                    'Draft Not Saved',
                    'Browser storage is full. Upload still works, but auto-save is paused.',
                    'info'
                );
                storageWarningShown = true;
            }
            return false;
        }
    }

    function updateLastSavedTime() {
        const now = new Date();
        lastSavedTime.textContent = `Saved: ${now.toLocaleTimeString()}`;
    }

    function loadFromStorage() {
        const savedData = cvStorage.getCurrentCV();

        if (savedData) {
            const hasDraft = Boolean((savedData.cvText && savedData.cvText.trim()) || (savedData.jdText && savedData.jdText.trim()));
            if (!hasDraft) return;

            const shouldRestore = window.confirm('Restore previous draft?');

            if (shouldRestore) {
                if (savedData.cvText) {
                    cvInput.value = savedData.cvText;
                    updateCharCount(cvInput, cvCharCount);
                }

                if (savedData.jdText) {
                    jdInput.value = savedData.jdText;
                    updateCharCount(jdInput, jdCharCount);
                }

                showToast('Restored', 'Your previous work has been restored', 'info');
                updateLastSavedTime();
            } else {
                // Remove current quick-draft so the user starts clean.
                localStorage.removeItem(`${cvStorage.STORAGE_PREFIX}current`);
                localStorage.removeItem('cvText');
                localStorage.removeItem('jdText');
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
        safeSaveToStorage();
    });

    jdInput.addEventListener('input', () => {
        updateCharCount(jdInput, jdCharCount);
        safeSaveToStorage();
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

                // Reset results and related actions
                resultsSection.classList.add('hidden');
                coverLetterAction.classList.add('hidden');
                if (tunerSection) tunerSection.classList.add('hidden');
                suggestionsList.innerHTML = '';
                missingKeywordsList.innerHTML = '';
                questionsContainer.innerHTML = '';
                wordCountEl.textContent = '-';
                verbCountEl.textContent = '-';
                readabilityEl.textContent = '-';

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
                latestCoverLetter = (data.coverLetter || '').trim();
                coverLetterText.textContent = latestCoverLetter;
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
            const text = latestCoverLetter || coverLetterText.textContent || '';
            if (!text.trim()) {
                showToast('No Content', 'Generate a cover letter first', 'error');
                return;
            }
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
        downloadPdfBtn.addEventListener('click', async () => {
            const text = latestCoverLetter || coverLetterText.textContent || '';
            if (!text.trim()) {
                showToast('No Content', 'Generate a cover letter first', 'error');
                return;
            }

            downloadPdfBtn.disabled = true;
            downloadPdfBtn.classList.add('loading');

            try {
                if (window.jspdf && window.jspdf.jsPDF) {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
                    const margin = 54;
                    const lineHeight = 18;
                    const pageHeight = doc.internal.pageSize.getHeight();
                    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;

                    doc.setFont('times', 'normal');
                    doc.setFontSize(12);

                    const paragraphs = text.split('\n');
                    let y = 72;

                    paragraphs.forEach(paragraph => {
                        const wrappedLines = doc.splitTextToSize(paragraph || ' ', maxWidth);
                        wrappedLines.forEach(line => {
                            if (y > pageHeight - 72) {
                                doc.addPage();
                                y = 72;
                            }
                            doc.text(line, margin, y);
                            y += lineHeight;
                        });
                        y += 6;
                    });

                    doc.save('Cover_Letter.pdf');
                } else {
                    const exportNode = document.createElement('div');
                    exportNode.style.cssText = 'width: 816px; padding: 72px; background: #fff; color: #111827; font-family: Georgia, serif; font-size: 14px; line-height: 1.65; white-space: pre-wrap;';
                    exportNode.textContent = text;
                    document.body.appendChild(exportNode);

                    const opt = {
                        margin: 0,
                        filename: 'Cover_Letter.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
                        jsPDF: { unit: 'pt', format: 'letter', orientation: 'portrait' }
                    };

                    await html2pdf().set(opt).from(exportNode).save();
                    document.body.removeChild(exportNode);
                }

                showToast('Downloaded!', 'Cover letter saved as PDF', 'success');
            } catch (err) {
                console.error('PDF generation failed:', err);
                showToast('Download Failed', 'Could not generate PDF', 'error');
            } finally {
                downloadPdfBtn.disabled = false;
                downloadPdfBtn.classList.remove('loading');
            }
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
            const data = await window.api.fetchModels();
            if (data.models && data.models.length > 0) {
                modelSelect.innerHTML = '';
                data.models.forEach((model, index) => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = model.displayName;
                    if (index === 0) option.selected = true;
                    modelSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
            // Fallback to hardcoded Claude options in HTML
        }
    }
    fetchModels();

    // --- Helper Functions ---
    // PDF extraction moved to js/file-processor.js
    function validateFile(file) {
        if (window.fileProcessor && typeof window.fileProcessor.validateFile === 'function') {
            return window.fileProcessor.validateFile(file);
        }

        showToast('Uploader Unavailable', 'File processor is not loaded. Refresh the page and try again.', 'error');
        return false;
    }

    async function extractTextFromPDF(file) {
        if (window.fileProcessor && typeof window.fileProcessor.extractTextFromPDF === 'function') {
            return window.fileProcessor.extractTextFromPDF(file);
        }
        throw new Error('PDF parser not loaded. Please refresh the page and try again.');
    }

    async function extractImagesFromPDF(file, maxPages = 3) {
        if (window.fileProcessor && typeof window.fileProcessor.extractImagesFromPDF === 'function') {
            return window.fileProcessor.extractImagesFromPDF(file, maxPages);
        }
        // Non-blocking fallback: text extraction can still continue.
        return [];
    }

    const SERVER_PDF_FALLBACK_LIMIT_BYTES = 4 * 1024 * 1024;
    const MIN_PDF_TEXT_LENGTH = 20;

    function normalizeExtractedText(text) {
        return String(text || '').replace(/\u0000/g, '').trim();
    }

    function hasExtractableText(text) {
        return normalizeExtractedText(text).length >= MIN_PDF_TEXT_LENGTH;
    }

    async function extractTextFromPDFViaBackend(file) {
        if (file.size > SERVER_PDF_FALLBACK_LIMIT_BYTES) {
            throw new Error('PDF is too large for server fallback. Trying browser parser only.');
        }

        const toBase64 = (blob) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        const fileBase64 = await toBase64(file);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        let response;
        try {
            response = await fetch('/api/extract-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileBase64 }),
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeoutId);
        }

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload.error || payload.message || 'Server PDF extraction failed');
        }
        return normalizeExtractedText(payload.text || '');
    }

    async function extractPdfTextReliable(file, contextLabel = 'CV') {
        let browserText = '';
        let backendText = '';
        let browserError = null;
        let backendError = null;

        // Browser parser first: avoids payload limits and works offline once loaded.
        try {
            browserText = normalizeExtractedText(await extractTextFromPDF(file));
            if (hasExtractableText(browserText)) {
                return { text: browserText, method: 'browser' };
            }
        } catch (error) {
            browserError = error;
            console.warn(`[${contextLabel} Upload] Browser PDF extraction failed:`, error);
        }

        // Server parser second: useful fallback for edge cases in browser parsing.
        try {
            backendText = normalizeExtractedText(await extractTextFromPDFViaBackend(file));
            if (hasExtractableText(backendText)) {
                return { text: backendText, method: 'server' };
            }
        } catch (error) {
            backendError = error;
            console.warn(`[${contextLabel} Upload] Server PDF extraction failed:`, error);
        }

        // Keep partial text if one parser produced something non-empty.
        const bestEffortText = (backendText.length > browserText.length) ? backendText : browserText;
        if (bestEffortText) {
            return { text: bestEffortText, method: backendText.length > browserText.length ? 'server' : 'browser', partial: true };
        }

        const reasons = [browserError?.message, backendError?.message].filter(Boolean).join(' | ');
        const reasonSuffix = reasons ? ` (${reasons})` : '';
        throw new Error(
            `Could not extract readable text from this PDF${reasonSuffix}. ` +
            'If this is a scanned PDF, export as DOCX or paste text directly.'
        );
    }

    function queuePdfImageExtraction(file, contextLabel = 'CV') {
        (async () => {
            try {
                const images = await extractImagesFromPDF(file, 3);
                window.cvPdfImages = images;
                if (images.length > 0) {
                    showToast('Visual Mode Ready', `PDF rendered for visual analysis (${images.length} pages)`, 'info');
                }
            } catch (error) {
                console.warn(`[${contextLabel} Upload] Could not extract PDF images:`, error);
                window.cvPdfImages = null;
            }
        })();
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
    const cvUploadTriggerLabel = document.querySelector('#cv-drop-zone label[for="cv-file-upload"]');

    if (cvFileInput) {
        cvFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) handleCVFile(file);
        });
    }

    // Drag-and-drop support for CV PDF
    if (cvDropZone && cvFileInput) {
        // Prevent double file-dialog opens:
        // the label already triggers the file input natively.
        if (cvUploadTriggerLabel) {
            cvUploadTriggerLabel.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Highlight on drag over
        cvDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Drag-Drop] Dragover event on main drop zone');
            cvDropZone.classList.add('drag-over');
        });
        cvDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cvDropZone.classList.remove('drag-over');
        });
        cvDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Drag-Drop] Drop event on main drop zone');
            cvDropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleCVFile(files[0]);
            }
        });
        // Click to open file dialog
        cvDropZone.addEventListener('click', (e) => {
            if (e.target && e.target.closest && e.target.closest('label[for="cv-file-upload"]')) {
                return;
            }
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
            cvFileInput.value = '';
            return;
        }

        cvFileNameDisplay.textContent = file.name;
        cvInput.value = "Reading file...";
        try {
            console.log('[CV Upload] Starting file extraction...');
            if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
                console.log('[CV Upload] Processing as PDF');
                const { text, method, partial } = await extractPdfTextReliable(file, 'CV');
                if (!text || !text.trim()) {
                    throw new Error('No selectable text found. This PDF may be scanned/image-based. Please upload a text-based PDF, DOCX, or paste text.');
                }
                cvInput.value = text;
                cvInput.dispatchEvent(new Event('input'));
                showToast('File Loaded', `Loaded ${file.name} (${method} parser)`, 'success');
                if (partial) {
                    showToast('Check Formatting', 'Some PDF text may be incomplete. Review before analyzing.', 'info');
                }
                queuePdfImageExtraction(file, 'CV');
                console.log(`[CV Upload] PDF processed successfully via ${method} parser`);
            } else if (file.name.toLowerCase().endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                console.log('[CV Upload] Processing as Word document');
                const text = await extractTextFromDocx(file);
                if (!text || !text.trim()) {
                    throw new Error('Could not extract readable text from this DOCX. Please export as PDF or paste the text.');
                }
                cvInput.value = text;
                cvInput.dispatchEvent(new Event('input'));
                window.cvPdfImages = null; // No visual analysis for DOCX
            } else if (file.name.toLowerCase().endsWith('.doc') || file.type === 'application/msword') {
                throw new Error('Legacy .doc files are not supported reliably in-browser. Please convert to .docx or PDF.');
            } else {
                console.log('[CV Upload] Processing as plain text');
                const text = await file.text();
                if (!text || !text.trim()) {
                    throw new Error('This text file appears empty.');
                }
                cvInput.value = text;
                cvInput.dispatchEvent(new Event('input'));
                window.cvPdfImages = null; // No visual analysis for text
            }

            console.log('[CV Upload] File processed successfully');
            if (!(file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf'))) {
                showToast('File Loaded', `Successfully loaded ${file.name}`, 'success');
            }
        } catch (error) {
            console.error(error);
            cvInput.value = "Error reading file: " + error.message;
            showToast('Error', 'Failed to read file: ' + error.message, 'error');
        } finally {
            if (cvFileInput) cvFileInput.value = '';
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
        if (!validateFile(file)) {
            jdFileInput.value = '';
            return;
        }

        jdFileNameDisplay.textContent = file.name;
        jdInput.value = "Reading file...";
        try {
            if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
                const { text, method, partial } = await extractPdfTextReliable(file, 'JD');
                if (!text || !text.trim()) {
                    throw new Error('No selectable text found in this PDF. Please use a text-based PDF or paste the job description.');
                }
                jdInput.value = text;
                jdInput.dispatchEvent(new Event('input'));
                showToast('File Loaded', `Loaded ${file.name} (${method} parser)`, 'success');
                if (partial) {
                    showToast('Check Formatting', 'Some job description text may be incomplete. Review before analyzing.', 'info');
                }
            } else if (file.name.toLowerCase().endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const text = await extractTextFromDocx(file);
                if (!text || !text.trim()) {
                    throw new Error('Could not extract readable text from this DOCX.');
                }
                jdInput.value = text;
                jdInput.dispatchEvent(new Event('input'));
            } else if (file.name.toLowerCase().endsWith('.doc') || file.type === 'application/msword') {
                throw new Error('Legacy .doc files are not supported reliably in-browser. Please convert to .docx or PDF.');
            } else {
                const text = await file.text();
                if (!text || !text.trim()) {
                    throw new Error('This file appears empty.');
                }
                jdInput.value = text;
                jdInput.dispatchEvent(new Event('input'));
            }
            if (!(file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf'))) {
                showToast('File Loaded', `Successfully loaded ${file.name}`, 'success');
            }
        } catch (error) {
            console.error(error);
            jdInput.value = "Error reading file: " + error.message;
            showToast('Error', 'Failed to read file: ' + error.message, 'error');
        } finally {
            if (jdFileInput) jdFileInput.value = '';
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
            const result = await window.api.analyzeCV(
                cvText,
                jdText,
                modelSelect.value,
                hasImages ? window.cvPdfImages : []
            );

            updateResultsFromAI(result);
            showToast('Success!', 'CV analysis completed successfully', 'success');

            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);

        } catch (error) {
            console.error("Analysis failed:", error);
            showToast('Analysis Failed', error.message, 'error');
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
        const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
        suggestions.forEach(s => {
            const normalized = typeof s === 'string'
                ? {
                    title: 'Improvement',
                    recommendation: s,
                    evidence: 'No direct evidence snippet was returned.',
                    priority: 'medium'
                }
                : {
                    title: s.title || s.issue || 'Improvement',
                    recommendation: s.recommendation || s.action || '',
                    evidence: s.evidence || s.cvEvidence || s.snippet || 'No direct evidence snippet was returned.',
                    priority: ['high', 'medium', 'low'].includes(String(s.priority || '').toLowerCase())
                        ? String(s.priority).toLowerCase()
                        : 'medium'
                };

            const li = document.createElement('li');
            li.className = 'suggestion-item';

            const header = document.createElement('div');
            header.className = 'suggestion-header';

            const title = document.createElement('strong');
            title.className = 'suggestion-title';
            title.textContent = normalized.title;

            const priority = document.createElement('span');
            priority.className = `priority-badge priority-${normalized.priority}`;
            priority.textContent = normalized.priority;

            header.appendChild(title);
            header.appendChild(priority);

            const recommendation = document.createElement('p');
            recommendation.className = 'suggestion-recommendation';
            recommendation.textContent = normalized.recommendation || 'No recommendation provided.';

            const evidence = document.createElement('p');
            evidence.className = 'suggestion-evidence';
            evidence.textContent = `Evidence: "${normalized.evidence}"`;

            li.appendChild(header);
            li.appendChild(recommendation);
            li.appendChild(evidence);
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
                const tag = document.createElement('span');
                tag.className = 'question-tag';
                tag.textContent = (q && q.type) ? String(q.type) : 'general';

                const text = document.createElement('p');
                text.className = 'question-text';
                text.textContent = (q && q.text) ? String(q.text) : '';

                card.appendChild(tag);
                card.appendChild(text);
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
        const method = data.scoringDetails && data.scoringDetails.methodology;
        readabilityEl.textContent = method ? "Calibrated" : "AI Analyzed";
        if (method && data.scoringDetails.penalties) {
            const penalties = data.scoringDetails.penalties;
            readabilityEl.title =
                `Scoring model: ${method}\n` +
                `Raw CV score: ${data.scoringDetails.rawModelScore}\n` +
                `Raw JD score: ${data.scoringDetails.rawModelJdScore}\n` +
                `Calibration penalties: CV ${penalties.cvPenalty}, JD keywords ${penalties.missingKeywordPenalty}, JD years gap ${penalties.yearsGapPenalty}`;
        } else {
            readabilityEl.title = '';
        }

        // Render Section Tuner (if available)
        if (typeof renderTuner === 'function') {
            renderTuner(cvInput.value);
        }
    }

    // Legacy local heuristic analysis functions moved to js/analyzer.js

    // --- Smart Section Tuner ---

    function parseSections(text) {
        if (window.analyzer && typeof window.analyzer.parseSections === 'function') {
            return window.analyzer.parseSections(text);
        }
        return [];
    }

    function renderTuner(text) {
        if (!tunerSection || !tunerContainer) return;

        const sections = parseSections(text)
            .map((section) => ({
                title: String(section.title || 'Section').trim(),
                content: String(section.content || '').trim()
            }))
            .filter((section) => section.content.length > 30)
            .slice(0, 8);

        tunerContainer.innerHTML = '';

        if (!sections.length) {
            const placeholder = document.createElement('div');
            placeholder.className = 'tuner-placeholder';
            placeholder.textContent = 'No clear sections detected yet. Add section headings like Experience, Education, or Skills.';
            tunerContainer.appendChild(placeholder);
            tunerSection.classList.remove('hidden');
            return;
        }

        sections.forEach((section, index) => {
            const card = document.createElement('div');
            card.className = 'tuner-card';

            const header = document.createElement('div');
            header.className = 'tuner-header';

            const title = document.createElement('h3');
            title.className = 'tuner-title';
            title.textContent = section.title;

            const optimizeBtn = document.createElement('button');
            optimizeBtn.className = 'btn-optimize';
            optimizeBtn.type = 'button';
            optimizeBtn.innerHTML = '<span>✨</span> Optimize';
            optimizeBtn.addEventListener('click', () => window.optimizeSection(index, optimizeBtn));

            header.appendChild(title);
            header.appendChild(optimizeBtn);

            const content = document.createElement('div');
            content.className = 'tuner-content';
            content.id = `original-${index}`;
            content.textContent = section.content;

            const optimizedContainer = document.createElement('div');
            optimizedContainer.id = `optimized-container-${index}`;

            card.appendChild(header);
            card.appendChild(content);
            card.appendChild(optimizedContainer);
            tunerContainer.appendChild(card);
        });

        tunerSection.classList.remove('hidden');
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
                        sectionTitle: title,
                        model: modelSelect.value
                    })
                });

                if (!response.ok) throw new Error('Optimization failed');

                const result = await response.json();

                container.innerHTML = '';
                const optimizedBlock = document.createElement('div');
                optimizedBlock.className = 'tuner-optimized';

                const optimizedTitle = document.createElement('h4');
                optimizedTitle.textContent = '🚀 Optimized Version';

                const optimizedText = document.createElement('div');
                optimizedText.style.whiteSpace = 'pre-wrap';
                optimizedText.style.fontSize = '0.9rem';
                optimizedText.style.marginBottom = '12px';
                optimizedText.textContent = result.optimizedText || '';

                const copyBtn = document.createElement('button');
                copyBtn.className = 'btn-copy-sm';
                copyBtn.textContent = 'Copy to Clipboard';
                copyBtn.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(result.optimizedText || '');
                        showToast('Copied!', 'Optimized text copied', 'success');
                    } catch (_) {
                        showToast('Copy Failed', 'Could not copy optimized text', 'error');
                    }
                });

                optimizedBlock.appendChild(optimizedTitle);
                optimizedBlock.appendChild(optimizedText);
                optimizedBlock.appendChild(copyBtn);
                container.appendChild(optimizedBlock);

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
        // --- Authentication Logic ---
        const authManager = new AuthManager();
        const loginBtn = document.getElementById('login-btn');
        const authModal = document.getElementById('auth-modal');
        const closeAuthBtn = document.getElementById('close-auth-btn');
        const googleSignInBtn = document.getElementById('google-signin-btn');
        const emailAuthForm = document.getElementById('email-auth-form');
        const toggleAuthMode = document.getElementById('toggle-auth-mode');
        const authSwitchLabel = document.getElementById('auth-switch-label');
        const authModalTitle = document.getElementById('auth-modal-title');
        const emailAuthBtn = emailAuthForm.querySelector('button');

        const userProfile = document.getElementById('user-profile');
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        const logoutBtn = document.getElementById('logout-btn');

        let isSignUpMode = false;

        function updateAuthModeUI() {
            if (isSignUpMode) {
                authModalTitle.textContent = "Create account";
                emailAuthBtn.textContent = "Create account with email";
                toggleAuthMode.textContent = "Sign in";
                if (authSwitchLabel) authSwitchLabel.textContent = "Already have an account?";

                if (!document.getElementById('auth-name-group')) {
                    const nameGroup = document.createElement('div');
                    nameGroup.className = 'form-group';
                    nameGroup.id = 'auth-name-group';
                    nameGroup.innerHTML = `
                        <label for="auth-name" class="input-label">Full Name</label>
                        <input type="text" id="auth-name" placeholder="John Doe" class="input-field" required>
                    `;
                    emailAuthForm.insertBefore(nameGroup, emailAuthForm.firstChild);
                }
            } else {
                authModalTitle.textContent = "Sign in";
                emailAuthBtn.textContent = "Sign in with email";
                toggleAuthMode.textContent = "Create account";
                if (authSwitchLabel) authSwitchLabel.textContent = "Don't have an account?";
                const nameGroup = document.getElementById('auth-name-group');
                if (nameGroup) nameGroup.remove();
            }
        }

        // Toggle between Login and Sign Up
        if (toggleAuthMode) {
            toggleAuthMode.addEventListener('click', (e) => {
                e.preventDefault();
                isSignUpMode = !isSignUpMode;
                updateAuthModeUI();
            });
        }

        // Open Auth Modal
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                isSignUpMode = false;
                updateAuthModeUI();
                authModal.classList.remove('hidden');
                authModal.style.display = 'flex';
            });
        }

        // Close Auth Modal
        if (closeAuthBtn) {
            closeAuthBtn.addEventListener('click', () => {
                authModal.classList.add('hidden');
                authModal.style.display = 'none';
            });
        }

        // Google Sign In
        if (googleSignInBtn) {
            googleSignInBtn.addEventListener('click', async () => {
                try {
                    googleSignInBtn.disabled = true;
                    const originalText = googleSignInBtn.innerHTML;
                    googleSignInBtn.innerHTML = 'Signing in...';
                    await authManager.signInWithGoogle();
                    authModal.classList.add('hidden');
                    authModal.style.display = 'none';
                    showToast('Welcome!', 'Successfully signed in with Google', 'success');
                    googleSignInBtn.innerHTML = originalText;
                } catch (error) {
                    showToast('Error', error.message, 'error');
                } finally {
                    googleSignInBtn.disabled = false;
                }
            });
        }

        // Email Sign In / Sign Up
        if (emailAuthForm) {
            emailAuthForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('auth-email').value;
                const password = document.getElementById('auth-password').value;
                const btn = emailAuthForm.querySelector('button');

                try {
                    btn.disabled = true;
                    if (isSignUpMode) {
                        const name = document.getElementById('auth-name').value;
                        btn.textContent = 'Creating account...';
                        await authManager.signUpWithEmail(email, password, name);
                        showToast('Welcome!', 'Account created successfully', 'success');
                    } else {
                        btn.textContent = 'Signing in...';
                        await authManager.signInWithEmail(email, password);
                        showToast('Welcome!', 'Successfully signed in', 'success');
                    }
                    authModal.classList.add('hidden');
                    authModal.style.display = 'none';
                } catch (error) {
                    showToast('Error', error.message, 'error');
                } finally {
                    btn.disabled = false;
                    btn.textContent = isSignUpMode ? 'Create account with email' : 'Sign in with email';
                }
            });
        }

        // Sign Out
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await authManager.signOut();
                showToast('Signed Out', 'See you next time!', 'info');
            });
        }

        // Update UI on Auth State Change
        authManager.onAuthStateChanged((user) => {
            if (user) {
                // Update storage manager with user ID
                cvStorage.setUserId(user.uid);

                loginBtn.classList.add('hidden');
                userProfile.classList.remove('hidden');
                userProfile.style.display = 'flex';
                userName.textContent = user.displayName || user.email;
                userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`;

                // Reload UI components that depend on storage
                if (typeof updateHistoryList === 'function') updateHistoryList();
                if (typeof updateTunerSections === 'function') updateTunerSections();
            } else {
                // Reset to guest storage
                cvStorage.setUserId(null);

                loginBtn.classList.remove('hidden');
                userProfile.classList.add('hidden');
                userProfile.style.display = 'none';

                // Reload UI components
                if (typeof updateHistoryList === 'function') updateHistoryList();
            }
        });
});
