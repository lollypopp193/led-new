/**
 * ANIMATION SYSTEM v1.0
 * Smooth Transitions & Animations für die gesamte App
 */
'use strict';

class AnimationSystem {
    constructor() {
        this.init();
    }

    init() {
        this.addGlobalStyles();
        this.setupPageTransitions();
        this.setupModalAnimations();
        this.setupButtonAnimations();
        this.setupListAnimations();
        // console.log('✅ Animation System initialisiert');
    }

    addGlobalStyles() {
        if (document.getElementById('animation-system-styles')) return;

        const style = document.createElement('style');
        style.id = 'animation-system-styles';
        style.textContent = `
            /* ===== GLOBAL ANIMATIONS ===== */
            
            /* Smooth Transitions für alle interaktiven Elemente */
            button, a, input, select, textarea, .card, .item {
                transition: all 0.2s ease;
            }

            /* Page Transitions */
            .page-enter {
                animation: pageEnter 0.3s ease;
            }

            .page-exit {
                animation: pageExit 0.3s ease;
            }

            @keyframes pageEnter {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes pageExit {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(-20px);
                }
            }

            /* Modal Animations */
            .modal-enter {
                animation: modalEnter 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            .modal-exit {
                animation: modalExit 0.2s ease;
            }

            @keyframes modalEnter {
                from {
                    opacity: 0;
                    transform: scale(0.8) translateY(50px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            @keyframes modalExit {
                from {
                    opacity: 1;
                    transform: scale(1);
                }
                to {
                    opacity: 0;
                    transform: scale(0.9);
                }
            }

            /* Button Hover Effects */
            button:not(:disabled):hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }

            button:not(:disabled):active {
                transform: translateY(0);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            }

            /* Button Press Animation */
            .btn-press {
                animation: btnPress 0.15s ease;
            }

            @keyframes btnPress {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(0.95); }
            }

            /* Card Hover Effects */
            .card:hover, .song-item:hover, .playlist-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
            }

            /* Fade In Animation */
            .fade-in {
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            /* Slide In Animations */
            .slide-in-left {
                animation: slideInLeft 0.3s ease;
            }

            .slide-in-right {
                animation: slideInRight 0.3s ease;
            }

            .slide-in-up {
                animation: slideInUp 0.3s ease;
            }

            .slide-in-down {
                animation: slideInDown 0.3s ease;
            }

            @keyframes slideInLeft {
                from {
                    opacity: 0;
                    transform: translateX(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes slideInDown {
                from {
                    opacity: 0;
                    transform: translateY(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Bounce Animation */
            .bounce {
                animation: bounce 0.5s ease;
            }

            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            /* Pulse Animation */
            .pulse {
                animation: pulse 1.5s ease infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
            }

            /* Shake Animation */
            .shake {
                animation: shake 0.4s ease;
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }

            /* Rotate Animation */
            .rotate {
                animation: rotate 1s linear infinite;
            }

            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            /* List Item Stagger Animation */
            .list-item-enter {
                animation: listItemEnter 0.3s ease backwards;
            }

            @keyframes listItemEnter {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            /* Smooth Scroll */
            html {
                scroll-behavior: smooth;
            }

            /* Toggle Switch Animation */
            .toggle-switch input[type="checkbox"] {
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            /* Slider Animation */
            input[type="range"]::-webkit-slider-thumb {
                transition: all 0.2s ease;
            }

            input[type="range"]::-webkit-slider-thumb:hover {
                transform: scale(1.2);
            }

            /* Loading Spinner */
            .spinner-rotate {
                animation: rotate 1s linear infinite;
            }

            /* Success Checkmark Animation */
            .success-check {
                animation: successCheck 0.5s ease;
            }

            @keyframes successCheck {
                0% { transform: scale(0) rotate(45deg); }
                50% { transform: scale(1.2) rotate(45deg); }
                100% { transform: scale(1) rotate(45deg); }
            }

            /* Error X Animation */
            .error-x {
                animation: errorX 0.4s ease;
            }

            @keyframes errorX {
                0%, 100% { transform: scale(1) rotate(0deg); }
                50% { transform: scale(1.1) rotate(5deg); }
            }

            /* Glow Effect */
            .glow {
                animation: glow 2s ease-in-out infinite;
            }

            @keyframes glow {
                0%, 100% {
                    box-shadow: 0 0 5px rgba(255, 215, 0, 0.5),
                                0 0 10px rgba(255, 215, 0, 0.3);
                }
                50% {
                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8),
                                0 0 30px rgba(255, 215, 0, 0.5);
                }
            }

            /* Reduced Motion für Accessibility */
            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupPageTransitions() {
        // Intercept page navigation
        const links = document.querySelectorAll('a[href^="#"], a[data-page]');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetPage = e.target.closest('a').dataset.page;
                if (targetPage) {
                    this.transitionToPage(targetPage);
                }
            });
        });
    }

    transitionToPage(pageName) {
        const currentPage = document.querySelector('.page.active');
        const nextPage = document.querySelector(`[data-page-name="${pageName}"]`);

        if (!nextPage) return;

        // Exit animation
        if (currentPage) {
            currentPage.classList.add('page-exit');
            setTimeout(() => {
                currentPage.classList.remove('active', 'page-exit');
            }, 300);
        }

        // Enter animation
        setTimeout(() => {
            nextPage.classList.add('active', 'page-enter');
            setTimeout(() => {
                nextPage.classList.remove('page-enter');
            }, 300);
        }, 150);
    }

    setupModalAnimations() {
        // Auto-animate modals
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 &&
                        (node.classList?.contains('modal') ||
                            node.classList?.contains('dialog') ||
                            node.id === 'renameDialog' ||
                            node.id === 'alarmNotification')) {
                        node.classList.add('modal-enter');
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: false
        });
    }

    setupButtonAnimations() {
        // Add press animation to all buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button && !button.disabled) {
                button.classList.add('btn-press');
                setTimeout(() => {
                    button.classList.remove('btn-press');
                }, 150);
            }
        }, true);
    }

    setupListAnimations() {
        // Stagger animation for list items
        const observeListItems = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 &&
                        (node.classList?.contains('song-item') ||
                            node.classList?.contains('list-item') ||
                            node.classList?.contains('card'))) {

                        const delay = Array.from(node.parentElement?.children || [])
                            .indexOf(node) * 50; // 50ms stagger

                        node.style.animationDelay = `${delay}ms`;
                        node.classList.add('list-item-enter');
                    }
                });
            });
        });

        // Observe common list containers
        const containers = document.querySelectorAll(
            '.library-grid, .library-list, .playlist-songs, #songsGrid'
        );

        containers.forEach(container => {
            if (container) {
                observeListItems.observe(container, {
                    childList: true
                });
            }
        });
    }

    /**
     * Animate Element
     * @param {HTMLElement} element - Element to animate
     * @param {string} animation - Animation class name
     * @param {number} duration - Duration in ms (optional)
     */
    animate(element, animation, duration = null) {
        if (!element) return;

        element.classList.add(animation);

        const cleanup = () => {
            element.classList.remove(animation);
        };

        if (duration) {
            setTimeout(cleanup, duration);
        } else {
            element.addEventListener('animationend', cleanup, { once: true });
        }
    }

    /**
     * Animate Multiple Elements with Stagger
     * @param {NodeList} elements - Elements to animate
     * @param {string} animation - Animation class
     * @param {number} stagger - Delay between each (ms)
     */
    stagger(elements, animation, stagger = 50) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                this.animate(element, animation);
            }, index * stagger);
        });
    }
}

// Initialize global animation system
window.animationSystem = new AnimationSystem();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationSystem;
}

// console.log('✅ Animation System geladen');
