// file-processor.js
window.fileProcessor = {
    async extractTextFromPDF(file) {
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
    },

    async extractImagesFromPDF(file, maxPages = 3) {
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
    },

    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        const allowedExtensions = ['.pdf', '.txt', '.docx', '.doc'];

        if (file.size > maxSize) {
            if (window.showToast) window.showToast('File Too Large', 'Please upload a file smaller than 10MB', 'error');
            return false;
        }

        // Check by MIME type OR file extension
        const hasValidType = allowedTypes.includes(file.type);
        const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

        if (!hasValidType && !hasValidExtension) {
            if (window.showToast) window.showToast('Invalid File Type', 'Please upload a PDF, Word, or text file', 'error');
            return false;
        }

        return true;
    }
};

// Helper to load scripts dynamically
window.loadScript = function (url) {
    return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (document.querySelector(`script[src="${url}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};
