/*
==========================================================================
CryptoVault - Crypto Dashboard Template
Template Name: CryptoVault
Template URL: https://templatemo.com
Description: JavaScript functionality for CryptoVault dashboard
Author: TemplateMo
Version: 1.0
==========================================================================

TemplateMo 609 Crypto Vault

https://templatemo.com/tm-609-crypto-vault

*/

(function() {
    'use strict';

    /* ========================================
       Mobile Menu
    ======================================== */
    function initMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        function toggleMobileMenu() {
            if (mobileMenuToggle && sidebar && sidebarOverlay) {
                mobileMenuToggle.classList.toggle('active');
                sidebar.classList.toggle('active');
                sidebarOverlay.classList.toggle('active');
                document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
            }
        }

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', toggleMobileMenu);
        }

        // Close menu when clicking nav items
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.addEventListener('click', function() {
                if (window.innerWidth <= 1024 && sidebar && sidebar.classList.contains('active')) {
                    toggleMobileMenu();
                }
            });
        });

        // Close menu on window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 1024 && sidebar && sidebar.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    }

    /* ========================================
       Toggle Switches
    ======================================== */
    function initToggleSwitches() {
        document.querySelectorAll('.toggle-switch').forEach(function(toggle) {
            // Skip dark mode toggle as it's handled separately
            if (toggle.id !== 'darkModeToggle') {
                toggle.addEventListener('click', function() {
                    toggle.classList.toggle('active');
                });
            }
        });
    }

    /* ========================================
       Copy to Clipboard
    ======================================== */
    function initCopyButtons() {
        document.querySelectorAll('.copy-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const addressElement = btn.parentElement.querySelector('.wallet-address');
                if (addressElement) {
                    const address = addressElement.textContent;
                    navigator.clipboard.writeText(address).then(function() {
                        // Show success state
                        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b8e6b" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
                        
                        // Reset after 2 seconds
                        setTimeout(function() {
                            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
                        }, 2000);
                    });
                }
            });
        });
    }

    /* ========================================
       Settings Tabs
    ======================================== */
    function initSettingsTabs() {
        document.querySelectorAll('.settings-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                // Remove active from all tabs
                document.querySelectorAll('.settings-tab').forEach(function(t) {
                    t.classList.remove('active');
                });
                
                // Remove active from all content
                document.querySelectorAll('.settings-content').forEach(function(c) {
                    c.classList.remove('active');
                });
                
                // Add active to clicked tab
                tab.classList.add('active');
                
                // Show corresponding content
                const targetId = tab.dataset.tab;
                const targetContent = document.getElementById(targetId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    /* ========================================
       Filter Tabs (Markets Page)
    ======================================== */
    function initFilterTabs() {
        document.querySelectorAll('.filter-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.filter-tab').forEach(function(t) {
                    t.classList.remove('active');
                });
                tab.classList.add('active');
            });
        });
    }

    /* ========================================
       Star/Favorite Toggle
    ======================================== */
    function initStarButtons() {
        document.querySelectorAll('.star-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                btn.classList.toggle('active');
                btn.textContent = btn.classList.contains('active') ? '★' : '☆';
            });
        });
    }

    /* ========================================
       Search Functionality
    ======================================== */
    function initSearch() {
        const searchInput = document.getElementById('searchInput');
        
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                const search = e.target.value.toLowerCase();
                
                document.querySelectorAll('.market-table tbody tr').forEach(function(row) {
                    const nameElement = row.querySelector('.coin-name');
                    const symbolElement = row.querySelector('.coin-symbol');
                    
                    if (nameElement && symbolElement) {
                        const name = nameElement.textContent.toLowerCase();
                        const symbol = symbolElement.textContent.toLowerCase();
                        row.style.display = (name.includes(search) || symbol.includes(search)) ? '' : 'none';
                    }
                });
            });
        }
    }

    /* ========================================
       Checkbox Toggle
    ======================================== */
    function initCheckboxes() {
        document.querySelectorAll('.checkbox-wrapper').forEach(function(wrapper) {
            wrapper.addEventListener('click', function() {
                const checkbox = wrapper.querySelector('.checkbox');
                if (checkbox) {
                    checkbox.classList.toggle('checked');
                }
            });
        });
    }

    /* ========================================
       Password Toggle
    ======================================== */
    function initPasswordToggle() {
        document.querySelectorAll('.password-toggle').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const targetId = btn.dataset.target;
                const input = document.getElementById(targetId);
                
                if (input) {
                    const type = input.type === 'password' ? 'text' : 'password';
                    input.type = type;
                }
            });
        });
    }

    /* ========================================
       Password Strength Meter
    ======================================== */
    function initPasswordStrength() {
        const passwordInput = document.getElementById('registerPassword');
        const strengthBars = document.querySelectorAll('.strength-bar');
        
        if (passwordInput && strengthBars.length > 0) {
            passwordInput.addEventListener('input', function() {
                const password = passwordInput.value;
                let strength = 0;

                if (password.length >= 8) strength++;
                if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
                if (/\d/.test(password)) strength++;
                if (/[^a-zA-Z0-9]/.test(password)) strength++;

                strengthBars.forEach(function(bar, index) {
                    bar.classList.remove('weak', 'medium', 'strong');
                    if (index < strength) {
                        if (strength <= 1) bar.classList.add('weak');
                        else if (strength <= 2) bar.classList.add('medium');
                        else bar.classList.add('strong');
                    }
                });
            });
        }
    }

    /* ========================================
       Auth Tabs (Login Page)
    ======================================== */
    function initAuthTabs() {
        const authTabs = document.querySelectorAll('.auth-tab');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const formHeader = document.querySelector('.form-header');

        authTabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                authTabs.forEach(function(t) {
                    t.classList.remove('active');
                });
                tab.classList.add('active');

                if (tab.dataset.form === 'login') {
                    if (loginForm) loginForm.classList.add('active');
                    if (registerForm) registerForm.classList.remove('active');
                    if (formHeader) {
                        formHeader.querySelector('h1').textContent = 'Bem-vindo de volta';
                        formHeader.querySelector('p').textContent = 'Digite suas credenciais para acessar sua conta';
                    }
                } else {
                    if (registerForm) registerForm.classList.add('active');
                    if (loginForm) loginForm.classList.remove('active');
                    if (formHeader) {
                        formHeader.querySelector('h1').textContent = 'Criar Conta';
                        formHeader.querySelector('p').textContent = 'Comece sua jornada hoje';
                    }
                }
            });
        });

        // Quick switch links
        const switchToRegister = document.getElementById('switchToRegister');
        const switchToLogin = document.getElementById('switchToLogin');

        if (switchToRegister && authTabs[1]) {
            switchToRegister.addEventListener('click', function(e) {
                e.preventDefault();
                authTabs[1].click();
            });
        }

        if (switchToLogin && authTabs[0]) {
            switchToLogin.addEventListener('click', function(e) {
                e.preventDefault();
                authTabs[0].click();
            });
        }
    }

    /* ========================================
       Form Submissions
    ======================================== */
    function initFormSubmissions() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                window.location.href = 'index.html';
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const successMessage = document.getElementById('successMessage');
                const formHeader = document.querySelector('.form-header');
                const authTabs = document.querySelector('.auth-tabs');
                
                if (successMessage) {
                    registerForm.style.display = 'none';
                    if (authTabs) authTabs.style.display = 'none';
                    successMessage.classList.add('active');
                    if (formHeader) {
                        formHeader.querySelector('h1').textContent = 'Sucesso!';
                        formHeader.querySelector('p').textContent = '';
                    }
                }
            });
        }
    }

    /* ========================================
       Toast Notification
    ======================================== */
    function showToast(message) {
        var existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = 'position:fixed;bottom:30px;right:30px;background:var(--accent-copper,#b87333);color:#1c1c1e;padding:14px 24px;border-radius:10px;font-weight:600;font-size:14px;z-index:9999;opacity:0;transform:translateY(20px);transition:all .3s ease;font-family:inherit;';
        document.body.appendChild(toast);
        requestAnimationFrame(function() {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(function() { toast.remove(); }, 300);
        }, 2500);
    }

    /* ========================================
       Placeholder Buttons
    ======================================== */
    function initPlaceholderButtons() {
        // Notification button
        var notifBtn = document.querySelector('.notification-btn');
        if (notifBtn) {
            notifBtn.addEventListener('click', function() {
                showToast('Você não tem novas notificações');
                var badge = notifBtn.querySelector('.notification-badge');
                if (badge) badge.style.display = 'none';
            });
        }

        // Action buttons (Deposit, Withdraw, Swap, Stake)
        document.querySelectorAll('.action-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var text = btn.textContent.trim();
                showToast('Função "' + text + '" em breve!');
            });
        });

        // QR Copy button
        document.querySelectorAll('.qr-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var text = btn.textContent.trim();
                if (text === 'Copy') {
                    var addr = document.querySelector('.qr-address');
                    if (addr) {
                        navigator.clipboard.writeText(addr.textContent).then(function() {
                            showToast('Endereço copiado!');
                        });
                    }
                } else {
                    showToast('Função "' + text + '" em breve!');
                }
            });
        });

        // Staking manage buttons
        document.querySelectorAll('.staking-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                showToast('Gerenciamento de stake em breve!');
            });
        });

        // Settings buttons (Save, Cancel, etc)
        document.querySelectorAll('.btn-group .btn').forEach(function(btn) {
            if (!btn.getAttribute('onclick')) {
                btn.addEventListener('click', function() {
                    var text = btn.textContent.trim();
                    if (text.includes('Save') || text.includes('Salvar')) {
                        showToast('Alterações salvas com sucesso!');
                    } else if (text.includes('Cancel') || text.includes('Cancelar')) {
                        showToast('Alterações descartadas');
                    } else if (text.includes('Delete') || text.includes('Excluir')) {
                        showToast('Função indisponível no momento');
                    } else {
                        showToast('Função "' + text + '" em breve!');
                    }
                });
            }
        });

        // Security buttons (Change Password, Manage, Enable, View All, Disconnect, Connect)
        document.querySelectorAll('.security-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var text = btn.textContent.trim();
                showToast('Função "' + text + '" em breve!');
            });
        });
    }

    /* ========================================
       Initialize All
    ======================================== */
    function init() {
        initMobileMenu();
        initToggleSwitches();
        initCopyButtons();
        initSettingsTabs();
        initFilterTabs();
        initStarButtons();
        initSearch();
        initCheckboxes();
        initPasswordToggle();
        initPasswordStrength();
        initAuthTabs();
        initFormSubmissions();
        initPlaceholderButtons();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
