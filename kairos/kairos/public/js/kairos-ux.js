/**
 * Kairos - UX Enhancements
 *
 * Modern UX improvements for Frappe Desk
 * - Keyboard shortcuts
 * - Enhanced notifications
 * - Accessibility improvements
 * - Loading states
 * - Quick actions
 */

(function() {
    'use strict';

    // Only run in desk (not web)
    if (!frappe || !frappe.boot) return;

    // ==========================================================================
    // Configuration
    // ==========================================================================

    const KAIROS_CONFIG = {
        enableKeyboardShortcuts: true,
        enableQuickActions: true,
        enableEnhancedNotifications: true,
        enableLoadingIndicators: true,
        animationDuration: 200,
    };

    // ==========================================================================
    // Keyboard Shortcuts
    // ==========================================================================

    const SHORTCUTS = {
        // Navigation
        'g h': { action: function() { frappe.set_route('/'); }, description: 'Go to Home' },
        'g s': { action: function() { frappe.set_route('List', 'Student'); }, description: 'Go to Students' },
        'g m': { action: function() { frappe.set_route('List', 'Message'); }, description: 'Go to Messages' },
        'g e': { action: function() { frappe.set_route('List', 'School Event'); }, description: 'Go to Events' },
        'g n': { action: function() { frappe.set_route('List', 'News'); }, description: 'Go to News' },

        // Actions
        '/': { action: function() { focusAwesomebar(); }, description: 'Focus search' },
        'n': { action: function() { createNew(); }, description: 'Create new (in list)' },
        'e': { action: function() { editCurrent(); }, description: 'Edit current document' },
        's': { action: function() { saveCurrent(); }, description: 'Save current document' },

        // Navigation within forms
        'j': { action: function() { navigateList('next'); }, description: 'Next item in list' },
        'k': { action: function() { navigateList('prev'); }, description: 'Previous item in list' },

        // Help
        '?': { action: function() { showShortcutsHelp(); }, description: 'Show keyboard shortcuts' },
    };

    var keySequence = '';
    var keyTimeout = null;

    function initKeyboardShortcuts() {
        if (!KAIROS_CONFIG.enableKeyboardShortcuts) return;

        document.addEventListener('keydown', handleKeyDown);
    }

    function handleKeyDown(e) {
        // Ignore if typing in input
        if (isTypingInInput(e.target)) return;

        // Ignore if modifier keys (except shift) are pressed
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        var key = e.key.toLowerCase();

        // Build key sequence
        clearTimeout(keyTimeout);
        keySequence += (keySequence ? ' ' : '') + key;

        // Check for matching shortcut
        if (SHORTCUTS[keySequence]) {
            e.preventDefault();
            SHORTCUTS[keySequence].action();
            keySequence = '';
            return;
        }

        // Check if this could be start of a sequence
        var possibleSequence = Object.keys(SHORTCUTS).some(function(s) {
            return s.startsWith(keySequence);
        });

        if (!possibleSequence) {
            keySequence = '';
        } else {
            // Wait for next key
            keyTimeout = setTimeout(function() {
                keySequence = '';
            }, 1000);
        }
    }

    function isTypingInInput(element) {
        var tagName = element.tagName.toLowerCase();
        var type = element.type ? element.type.toLowerCase() : '';

        return (
            tagName === 'input' ||
            tagName === 'textarea' ||
            tagName === 'select' ||
            element.isContentEditable ||
            (tagName === 'input' && ['text', 'password', 'email', 'number', 'search', 'tel', 'url'].indexOf(type) !== -1)
        );
    }

    function focusAwesomebar() {
        var awesomebar = document.querySelector('.awesomebar');
        if (awesomebar) {
            awesomebar.focus();
            awesomebar.select();
        }
    }

    function createNew() {
        if (typeof cur_list !== 'undefined' && cur_list && cur_list.doctype) {
            frappe.new_doc(cur_list.doctype);
        }
    }

    function editCurrent() {
        if (typeof cur_frm !== 'undefined' && cur_frm && !cur_frm.is_new() && !cur_frm.doc.__islocal) {
            cur_frm.enable_save();
        }
    }

    function saveCurrent() {
        if (typeof cur_frm !== 'undefined' && cur_frm && cur_frm.doc && cur_frm.is_dirty()) {
            cur_frm.save();
        }
    }

    function navigateList(direction) {
        if (typeof cur_list === 'undefined' || !cur_list) return;

        var rows = document.querySelectorAll('.frappe-list .list-row');
        var rowsArray = Array.prototype.slice.call(rows);
        var currentIndex = rowsArray.findIndex(function(row) {
            return row.classList.contains('selected');
        });

        var newIndex;
        if (direction === 'next') {
            newIndex = currentIndex < rows.length - 1 ? currentIndex + 1 : currentIndex;
        } else {
            newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        }

        if (rows[newIndex]) {
            rows[newIndex].click();
            rows[newIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function showShortcutsHelp() {
        var tableRows = Object.keys(SHORTCUTS).map(function(key) {
            return '<tr><td><kbd>' + key + '</kbd></td><td>' + SHORTCUTS[key].description + '</td></tr>';
        }).join('');

        var messageContent = '<table class="table table-bordered" style="margin: 0;">' +
            '<thead><tr><th style="width: 100px;">Shortcut</th><th>Action</th></tr></thead>' +
            '<tbody>' + tableRows + '</tbody></table>' +
            '<p class="text-muted mt-3 mb-0"><small>Press <kbd>?</kbd> anytime to show this help.</small></p>';

        frappe.msgprint({
            title: __('Keyboard Shortcuts'),
            message: messageContent,
            wide: true,
        });
    }

    // ==========================================================================
    // Enhanced Notifications (Toast style)
    // ==========================================================================

    function initEnhancedNotifications() {
        if (!KAIROS_CONFIG.enableEnhancedNotifications) return;

        // Override frappe.show_alert for toast-style notifications
        var originalShowAlert = frappe.show_alert;

        frappe.show_alert = function(message, seconds, actions) {
            // Use original for complex messages
            if (typeof message === 'object' && message.body) {
                return originalShowAlert.call(frappe, message, seconds, actions);
            }

            // Create toast notification
            var messageText = typeof message === 'object' ? message.message : message;
            var indicator = typeof message === 'object' ? message.indicator : 'blue';

            showToast(messageText, indicator, seconds || 5);
        };
    }

    function showToast(message, type, duration) {
        type = type || 'info';
        duration = duration || 5;

        // Create toast container if not exists
        var container = document.getElementById('kairos-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'kairos-toast-container';
            container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; max-width: 400px;';
            document.body.appendChild(container);
        }

        // Color mapping
        var colors = {
            blue: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
            green: { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
            orange: { bg: '#fef3c7', text: '#b45309', border: '#f59e0b' },
            red: { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444' },
            info: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
            success: { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
            warning: { bg: '#fef3c7', text: '#b45309', border: '#f59e0b' },
            error: { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444' },
        };

        var color = colors[type] || colors.blue;

        // Create toast element using DOM methods
        var toast = document.createElement('div');
        toast.className = 'kairos-toast';
        toast.style.cssText = 'background: ' + color.bg + '; color: ' + color.text + '; border-left: 4px solid ' + color.border + '; padding: 12px 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); display: flex; align-items: center; gap: 12px; animation: slideInRight 0.3s ease; font-size: 14px; font-weight: 500;';

        var messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        toast.appendChild(messageSpan);

        var closeBtn = document.createElement('button');
        closeBtn.textContent = '\u00D7';
        closeBtn.style.cssText = 'background: transparent; border: none; color: inherit; opacity: 0.5; cursor: pointer; padding: 4px; font-size: 18px; line-height: 1;';
        closeBtn.addEventListener('click', function() {
            toast.remove();
        });
        toast.appendChild(closeBtn);

        container.appendChild(toast);

        // Auto remove
        setTimeout(function() {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration * 1000);
    }

    // Add toast animations
    function addToastStyles() {
        if (document.getElementById('kairos-toast-styles')) return;

        var style = document.createElement('style');
        style.id = 'kairos-toast-styles';
        style.textContent = '@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } } .kairos-toast:hover { transform: translateX(-4px); transition: transform 0.2s ease; }';
        document.head.appendChild(style);
    }

    // ==========================================================================
    // Quick Actions Panel
    // ==========================================================================

    function initQuickActions() {
        if (!KAIROS_CONFIG.enableQuickActions) return;

        // Add quick action button to navbar
        setTimeout(function() {
            addQuickActionButton();
        }, 1000);
    }

    function addQuickActionButton() {
        var navbar = document.querySelector('.navbar-right');
        if (!navbar || document.querySelector('.kairos-quick-action-btn')) return;

        var btn = document.createElement('button');
        btn.className = 'kairos-quick-action-btn btn btn-sm';
        btn.title = 'Quick Actions';
        btn.style.cssText = 'margin-right: 8px; padding: 6px 10px; border-radius: 6px; background: transparent; border: 1px solid #e4e4e7; color: #52525b; cursor: pointer; transition: all 0.15s ease;';

        // Create SVG icon using DOM
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');

        var circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle1.setAttribute('cx', '12');
        circle1.setAttribute('cy', '12');
        circle1.setAttribute('r', '1');
        svg.appendChild(circle1);

        var circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle2.setAttribute('cx', '12');
        circle2.setAttribute('cy', '5');
        circle2.setAttribute('r', '1');
        svg.appendChild(circle2);

        var circle3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle3.setAttribute('cx', '12');
        circle3.setAttribute('cy', '19');
        circle3.setAttribute('r', '1');
        svg.appendChild(circle3);

        btn.appendChild(svg);

        btn.addEventListener('click', showQuickActionsPanel);
        btn.addEventListener('mouseenter', function() {
            btn.style.background = '#f4f4f5';
        });
        btn.addEventListener('mouseleave', function() {
            btn.style.background = 'transparent';
        });

        navbar.insertBefore(btn, navbar.firstChild);
    }

    function showQuickActionsPanel() {
        var actions = [
            { label: 'New Student', icon: '\uD83D\uDC64', action: function() { frappe.new_doc('Student'); } },
            { label: 'New Message', icon: '\u2709\uFE0F', action: function() { frappe.new_doc('Message'); } },
            { label: 'New Event', icon: '\uD83D\uDCC5', action: function() { frappe.new_doc('School Event'); } },
            { label: 'New News', icon: '\uD83D\uDCF0', action: function() { frappe.new_doc('News'); } },
            { divider: true },
            { label: 'View Students', icon: '\uD83D\uDCCB', action: function() { frappe.set_route('List', 'Student'); } },
            { label: 'View Messages', icon: '\uD83D\uDCEC', action: function() { frappe.set_route('List', 'Message'); } },
            { label: 'View Events', icon: '\uD83D\uDDD3\uFE0F', action: function() { frappe.set_route('List', 'School Event'); } },
        ];

        var d = new frappe.ui.Dialog({
            title: __('Quick Actions'),
            fields: [],
        });

        var container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 4px; padding: 8px 0;';

        actions.forEach(function(action) {
            if (action.divider) {
                var divider = document.createElement('hr');
                divider.style.cssText = 'margin: 8px 0; border: 0; border-top: 1px solid #e4e4e7;';
                container.appendChild(divider);
                return;
            }

            var btn = document.createElement('button');
            btn.className = 'btn btn-default';
            btn.style.cssText = 'display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 10px 12px; border-radius: 6px; border: none; background: transparent; transition: background 0.15s ease;';

            var iconSpan = document.createElement('span');
            iconSpan.style.fontSize = '18px';
            iconSpan.textContent = action.icon;
            btn.appendChild(iconSpan);

            var labelSpan = document.createElement('span');
            labelSpan.textContent = action.label;
            btn.appendChild(labelSpan);

            btn.addEventListener('click', function() {
                d.hide();
                action.action();
            });

            btn.addEventListener('mouseenter', function() {
                btn.style.background = '#f4f4f5';
            });
            btn.addEventListener('mouseleave', function() {
                btn.style.background = 'transparent';
            });

            container.appendChild(btn);
        });

        d.$body.empty().append(container);
        d.show();
    }

    // ==========================================================================
    // Loading Indicators
    // ==========================================================================

    function initLoadingIndicators() {
        if (!KAIROS_CONFIG.enableLoadingIndicators) return;

        // Add loading state styles
        var style = document.createElement('style');
        style.textContent = '.kairos-loading { position: relative; pointer-events: none; } .kairos-loading::after { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.7); display: flex; align-items: center; justify-content: center; } .kairos-loading::before { content: ""; position: absolute; top: 50%; left: 50%; width: 24px; height: 24px; margin: -12px 0 0 -12px; border: 3px solid #e4e4e7; border-top-color: #2563eb; border-radius: 50%; animation: kairos-spin 0.8s linear infinite; z-index: 1; } @keyframes kairos-spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }

    // ==========================================================================
    // Form Enhancements
    // ==========================================================================

    function initFormEnhancements() {
        // Add smooth transitions to form sections
        $(document).on('click', '.section-head', function() {
            var body = $(this).next('.section-body');
            body.slideToggle(KAIROS_CONFIG.animationDuration);
        });

        // Auto-focus first empty required field
        $(document).on('form-refresh', function() {
            setTimeout(function() {
                if (typeof cur_frm !== 'undefined' && cur_frm && cur_frm.is_new()) {
                    var firstRequired = document.querySelector('.frappe-control.has-error input, .frappe-control[data-reqd="1"] input:not([value])');
                    if (firstRequired) firstRequired.focus();
                }
            }, 100);
        });
    }

    // ==========================================================================
    // Accessibility Improvements
    // ==========================================================================

    function initAccessibility() {
        // Add aria labels to buttons without text
        document.querySelectorAll('.btn:not([aria-label])').forEach(function(btn) {
            var title = btn.getAttribute('title');
            if (title && !btn.textContent.trim()) {
                btn.setAttribute('aria-label', title);
            }
        });

        // Improve focus visibility
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }
        });

        document.addEventListener('mousedown', function() {
            document.body.classList.remove('keyboard-nav');
        });

        // Add focus visibility styles
        var style = document.createElement('style');
        style.textContent = 'body.keyboard-nav :focus { outline: 2px solid #2563eb !important; outline-offset: 2px !important; }';
        document.head.appendChild(style);
    }

    // ==========================================================================
    // Initialize
    // ==========================================================================

    function init() {
        // Wait for Frappe to be ready
        if (!frappe.boot) {
            setTimeout(init, 100);
            return;
        }

        addToastStyles();
        initKeyboardShortcuts();
        initEnhancedNotifications();
        initQuickActions();
        initLoadingIndicators();
        initFormEnhancements();
        initAccessibility();

        console.log('Kairos UX enhancements loaded');
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.kairos = {
        config: KAIROS_CONFIG,
        showToast: showToast,
        showShortcuts: showShortcutsHelp,
    };

})();
