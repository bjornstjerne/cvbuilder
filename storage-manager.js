/**
 * CV Optima - Enhanced Save System
 * Manages CV versions, history, and advanced storage features
 */

class CVStorageManager {
    constructor() {
        this.STORAGE_PREFIX = 'cvoptima_';
        this.MAX_VERSIONS = 10; // Maximum versions to keep per CV
        this.MAX_SAVED_CVS = 5; // Maximum number of different CVs to save
    }

    // Save a new CV version with metadata
    saveCV(cvText, jdText = '', metadata = {}) {
        const timestamp = new Date().toISOString();
        const cvId = metadata.id || this.generateCVId();

        const cvData = {
            id: cvId,
            cvText: cvText,
            jdText: jdText,
            timestamp: timestamp,
            name: metadata.name || `CV - ${new Date().toLocaleDateString()}`,
            tags: metadata.tags || [],
            score: metadata.score || null,
            jdScore: metadata.jdScore || null,
            version: this.getNextVersion(cvId)
        };

        // Save to version history
        this.addToHistory(cvId, cvData);

        // Update quick access (most recent CV)
        this.setCurrentCV(cvData);

        return cvData;
    }

    // Get all saved CVs (metadata only)
    getSavedCVs() {
        const savedList = localStorage.getItem(`${this.STORAGE_PREFIX}cv_list`);
        return savedList ? JSON.parse(savedList) : [];
    }

    // Get full CV data by ID
    getCV(cvId) {
        const key = `${this.STORAGE_PREFIX}cv_${cvId}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // Get version history for a specific CV
    getVersionHistory(cvId) {
        const key = `${this.STORAGE_PREFIX}history_${cvId}`;
        const history = localStorage.getItem(key);
        return history ? JSON.parse(history) : [];
    }

    // Add version to history
    addToHistory(cvId, cvData) {
        const key = `${this.STORAGE_PREFIX}history_${cvId}`;
        let history = this.getVersionHistory(cvId);

        // Add new version at the beginning
        history.unshift(cvData);

        // Keep only MAX_VERSIONS recent versions
        if (history.length > this.MAX_VERSIONS) {
            history = history.slice(0, this.MAX_VERSIONS);
        }

        localStorage.setItem(key, JSON.stringify(history));

        // Update CV list
        this.updateCVList(cvId, cvData);
    }

    // Update the list of all CVs
    updateCVList(cvId, latestVersion) {
        let cvList = this.getSavedCVs();

        // Check if CV already exists
        const existingIndex = cvList.findIndex(cv => cv.id === cvId);

        const summary = {
            id: cvId,
            name: latestVersion.name,
            lastModified: latestVersion.timestamp,
            score: latestVersion.score,
            jdScore: latestVersion.jdScore,
            versionCount: this.getVersionHistory(cvId).length
        };

        if (existingIndex >= 0) {
            cvList[existingIndex] = summary;
        } else {
            cvList.unshift(summary);
        }

        // Keep only MAX_SAVED_CVS CVs
        if (cvList.length > this.MAX_SAVED_CVS) {
            // Remove oldest CV and its history
            const removed = cvList.pop();
            this.deleteCV(removed.id);
        }

        localStorage.setItem(`${this.STORAGE_PREFIX}cv_list`, JSON.stringify(cvList));
    }

    // Set current/active CV (quick access)
    setCurrentCV(cvData) {
        localStorage.setItem(`${this.STORAGE_PREFIX}current`, JSON.stringify(cvData));
        // Also save separately for backward compatibility
        localStorage.setItem('cvText', cvData.cvText);
        localStorage.setItem('jdText', cvData.jdText || '');
    }

    // Get current CV
    getCurrentCV() {
        const current = localStorage.getItem(`${this.STORAGE_PREFIX}current`);
        if (current) {
            return JSON.parse(current);
        }

        // Fallback to old storage format
        const cvText = localStorage.getItem('cvText');
        const jdText = localStorage.getItem('jdText');
        if (cvText) {
            return {
                id: 'legacy',
                cvText: cvText,
                jdText: jdText || '',
                name: 'Current CV',
                timestamp: new Date().toISOString(),
                version: 1
            };
        }

        return null;
    }

    // Delete CV and all its versions
    deleteCV(cvId) {
        const historyKey = `${this.STORAGE_PREFIX}history_${cvId}`;
        localStorage.removeItem(historyKey);

        // Update CV list
        let cvList = this.getSavedCVs();
        cvList = cvList.filter(cv => cv.id !== cvId);
        localStorage.setItem(`${this.STORAGE_PREFIX}cv_list`, JSON.stringify(cvList));
    }

    // Rename a CV
    renameCV(cvId, newName) {
        let cvList = this.getSavedCVs();
        const cv = cvList.find(c => c.id === cvId);
        if (cv) {
            cv.name = newName;
            localStorage.setItem(`${this.STORAGE_PREFIX}cv_list`, JSON.stringify(cvList));

            // Also update the most recent version in history
            const history = this.getVersionHistory(cvId);
            if (history.length > 0) {
                history[0].name = newName;
                localStorage.setItem(`${this.STORAGE_PREFIX}history_${cvId}`, JSON.stringify(history));
            }
        }
    }

    // Compare two CV versions
    compareVersions(cvId, version1Index, version2Index) {
        const history = this.getVersionHistory(cvId);
        if (version1Index < history.length && version2Index < history.length) {
            return {
                version1: history[version1Index],
                version2: history[version2Index],
                diff: this.calculateDiff(history[version1Index].cvText, history[version2Index].cvText)
            };
        }
        return null;
    }

    // Simple diff calculation (character count, word count changes)
    calculateDiff(text1, text2) {
        const words1 = text1.trim().split(/\s+/).length;
        const words2 = text2.trim().split(/\s+/).length;

        return {
            charDiff: text2.length - text1.length,
            wordDiff: words2 - words1,
            percentChange: ((Math.abs(text2.length - text1.length) / text1.length) * 100).toFixed(1)
        };
    }

    // Get next version number for a CV
    getNextVersion(cvId) {
        const history = this.getVersionHistory(cvId);
        return history.length + 1;
    }

    // Generate unique CV ID
    generateCVId() {
        return `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Export all data (for backup)
    exportAllData() {
        const data = {
            cvList: this.getSavedCVs(),
            histories: {},
            current: this.getCurrentCV(),
            exportDate: new Date().toISOString()
        };

        const cvs = this.getSavedCVs();
        cvs.forEach(cv => {
            data.histories[cv.id] = this.getVersionHistory(cv.id);
        });

        return JSON.stringify(data, null, 2);
    }

    // Import data from backup
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Restore CV list
            localStorage.setItem(`${this.STORAGE_PREFIX}cv_list`, JSON.stringify(data.cvList));

            // Restore histories
            Object.keys(data.histories).forEach(cvId => {
                localStorage.setItem(`${this.STORAGE_PREFIX}history_${cvId}`, JSON.stringify(data.histories[cvId]));
            });

            // Restore current CV
            if (data.current) {
                this.setCurrentCV(data.current);
            }

            return true;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    }

    // Get storage usage info
    getStorageInfo() {
        const cvList = this.getSavedCVs();
        let totalVersions = 0;
        let totalSize = 0;

        cvList.forEach(cv => {
            const history = this.getVersionHistory(cv.id);
            totalVersions += history.length;
            history.forEach(version => {
                totalSize += JSON.stringify(version).length;
            });
        });

        return {
            totalCVs: cvList.length,
            totalVersions: totalVersions,
            estimatedSize: `${(totalSize / 1024).toFixed(2)} KB`,
            maxCVs: this.MAX_SAVED_CVS,
            maxVersionsPerCV: this.MAX_VERSIONS
        };
    }

    // Clear all data
    clearAll() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.STORAGE_PREFIX) || key === 'cvText' || key === 'jdText') {
                localStorage.removeItem(key);
            }
        });
    }
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CVStorageManager;
} else {
    window.CVStorageManager = CVStorageManager;
}
