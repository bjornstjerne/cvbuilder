// ui-helpers.js
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

function updateCharCount(textarea, counter) {
    const count = textarea.value.length;
    counter.textContent = `${count.toLocaleString()} character${count !== 1 ? 's' : ''}`;
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

// Expose globally
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.updateCharCount = updateCharCount;
window.animateScore = animateScore;
