/**
 * Shared Navigation Logic
 * Handles sidebar toggling, mobile responsiveness, and top-bar initialization.
 */

async function initNavigation() {
    const appNav = document.getElementById('appNav');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const pageContent = document.querySelector('.page-content');
    const overlay = document.getElementById('sidebarOverlay');
    const topBar = document.querySelector('.top-user-bar');

    if (!appNav || !hamburgerBtn) {
        console.warn('Navigation elements not found on this page.');
        return;
    }

    function openSidebar() {
        appNav.classList.add('expanded');
        pageContent.classList.add('sidebar-open');
        if (overlay) overlay.classList.add('show');
        if (topBar) topBar.style.left = '230px';
    }

    function closeSidebar() {
        appNav.classList.remove('expanded');
        pageContent.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('show');
        if (topBar) topBar.style.left = '68px';
    }

    hamburgerBtn.addEventListener('click', () => {
        appNav.classList.contains('expanded') ? closeSidebar() : openSidebar();
    });

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // Auto-close on mobile when link is clicked
    document.querySelectorAll('.app-nav-links a:not(.logout-link)').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeSidebar();
        });
    });

    // Common Logout Logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (typeof logout === 'function') {
                await logout();
            } else {
                console.error('Logout function not found. Ensure auth.js is loaded.');
            }
        });
    }

    // Initialize Top User Bar Data (if present)
    if (document.getElementById('topUserName') || document.getElementById('userAvatar')) {
        try {
            if (typeof getUserProfile === 'function') {
                const profile = await getUserProfile();
                if (profile) {
                    const topUserName = document.getElementById('topUserName');
                    const userAvatar = document.getElementById('userAvatar');
                    if (topUserName) topUserName.textContent = profile.name;
                    if (userAvatar) userAvatar.textContent = profile.name.charAt(0).toUpperCase();
                }
            }
        } catch (e) {
            console.error('Error loading nav profile info:', e);
        }
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', initNavigation);
