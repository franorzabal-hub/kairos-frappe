/**
 * Kairos - Modern UI Styles
 * Applies modern styling to Frappe Desk
 */

(function() {
    'use strict';

    function init() {
        if (typeof frappe === 'undefined' || !frappe.boot) {
            setTimeout(init, 100);
            return;
        }

        injectStyles();
        applyDirectStyles();

        // Use MutationObserver for dynamic elements
        var observer = new MutationObserver(function(mutations) {
            applyDirectStyles();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also apply on route change
        if (frappe.router && frappe.router.on) {
            frappe.router.on('change', function() {
                setTimeout(applyDirectStyles, 200);
            });
        }

        console.log('Kairos UI loaded');
    }

    function injectStyles() {
        if (document.getElementById('kairos-styles')) return;

        var style = document.createElement('style');
        style.id = 'kairos-styles';
        style.textContent = [
            // Status indicators
            '.indicator-pill.green, .indicator.green { background-color: #dcfce7 !important; color: #166534 !important; }',
            '.indicator-pill.blue, .indicator.blue { background-color: #dbeafe !important; color: #1e40af !important; }',
            '.indicator-pill.orange, .indicator.orange, .indicator-pill.yellow, .indicator.yellow { background-color: #fef3c7 !important; color: #b45309 !important; }',
            '.indicator-pill.red, .indicator.red { background-color: #fee2e2 !important; color: #b91c1c !important; }',
            '.indicator-pill.gray, .indicator.gray, .indicator-pill.grey, .indicator.grey { background-color: #f4f4f5 !important; color: #52525b !important; }',
            '.indicator-pill { border-radius: 9999px !important; padding: 2px 10px !important; font-size: 11px !important; font-weight: 500 !important; }',
            // Focus states
            'input:focus, select:focus, textarea:focus, .form-control:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; outline: none !important; }',
            // Scrollbar
            '::-webkit-scrollbar { width: 8px; height: 8px; }',
            '::-webkit-scrollbar-track { background: #f4f4f5; }',
            '::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 4px; }',
            '::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }'
        ].join(' ');
        document.head.appendChild(style);
    }

    function applyDirectStyles() {
        // Primary buttons - blue
        document.querySelectorAll('.btn-primary, .btn-primary-dark, .primary-btn').forEach(function(el) {
            if (!el.dataset.kairosStyled) {
                el.style.setProperty('background-color', '#2563eb', 'important');
                el.style.setProperty('border-color', '#2563eb', 'important');
                el.style.setProperty('border-radius', '6px', 'important');
                el.style.setProperty('color', '#ffffff', 'important');
                el.dataset.kairosStyled = 'true';
            }
        });

        // All buttons - rounded
        document.querySelectorAll('.btn, button').forEach(function(el) {
            el.style.setProperty('border-radius', '6px', 'important');
        });

        // Inputs - rounded
        document.querySelectorAll('input, select, textarea').forEach(function(el) {
            if (!el.dataset.kairosStyled) {
                el.style.setProperty('border-radius', '6px', 'important');
                el.dataset.kairosStyled = 'true';
            }
        });

        // Cards and sections - rounded
        document.querySelectorAll('.frappe-card, .form-section, .widget, .frappe-list').forEach(function(el) {
            el.style.setProperty('border-radius', '8px', 'important');
        });

        // Modal - rounded
        document.querySelectorAll('.modal-content').forEach(function(el) {
            el.style.setProperty('border-radius', '12px', 'important');
        });

        // Dropdown - rounded
        document.querySelectorAll('.dropdown-menu').forEach(function(el) {
            el.style.setProperty('border-radius', '8px', 'important');
        });

        // Links - blue (only text links, not buttons)
        document.querySelectorAll('a:not(.btn):not(.dropdown-item):not(.nav-link)').forEach(function(el) {
            if (!el.closest('.btn') && !el.closest('.navbar')) {
                el.style.setProperty('color', '#2563eb', 'important');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
