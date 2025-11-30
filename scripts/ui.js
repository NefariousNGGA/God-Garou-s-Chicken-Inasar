// UI Controls & Panel Management
class UIController {
    constructor() {
        this.currentPanel = 'share';
        this.init();
    }

    init() {
        this.setupHamburger();
        this.setupPanelNavigation();
        this.setupOverlay();
    }

    setupHamburger() {
        const hamburger = document.getElementById('hamburger');
        const sideNav = document.getElementById('sideNav');
        const navClose = document.getElementById('navClose');
        const overlay = this.createOverlay();

        hamburger.addEventListener('click', () => {
            sideNav.classList.add('open');
            overlay.classList.add('active');
        });

        navClose.addEventListener('click', () => {
            this.closeNavigation();
        });

        overlay.addEventListener('click', () => {
            this.closeNavigation();
        });
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.body.appendChild(overlay);
        return overlay;
    }

    closeNavigation() {
        const sideNav = document.getElementById('sideNav');
        const overlay = document.querySelector('.overlay');
        sideNav.classList.remove('open');
        overlay.classList.remove('active');
    }

    setupPanelNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const panelName = item.dataset.panel;
                this.switchPanel(panelName);
                this.closeNavigation();
                
                // Update active states
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    switchPanel(panelName) {
        // Hide all panels
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Show selected panel
        const targetPanel = document.getElementById(`${panelName}-panel`);
        if (targetPanel) {
            targetPanel.classList.add('active');
            this.currentPanel = panelName;
        }
    }

    setupOverlay() {
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
                this.closeNavigation();
            }
        });
    }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uiController = new UIController();
});
