export function setupUIListeners() {
    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (sidebar && menuToggle && sidebarCloseBtn && backdrop) {
        const toggleSidebar = () => {
            const isHidden = sidebar.classList.contains('-translate-x-full');
            if (isHidden) {
                sidebar.classList.remove('-translate-x-full');
                backdrop.classList.remove('hidden');
                if (window.innerWidth >= 768) { 
                     mainContent.classList.add('md:ml-64');
                }
            } else {
                sidebar.classList.add('-translate-x-full');
                backdrop.classList.add('hidden');
                if (window.innerWidth >= 768) {
                    mainContent.classList.remove('md:ml-64');
                }
            }
        };
        menuToggle.addEventListener('click', toggleSidebar);
        sidebarCloseBtn.addEventListener('click', toggleSidebar);
        backdrop.addEventListener('click', toggleSidebar);
    }

    // Modal Buttons (only if they exist on the page)
    document.getElementById('addProspectBtnHeader')?.addEventListener('click', () => {
        if (typeof openFormModal !== 'undefined') { // Check if openFormModal is defined (i.e., on index.html)
            openFormModal();
        }
    });
    document.getElementById('exportBtnSidebar')?.addEventListener('click', () => {
        if (typeof exportData !== 'undefined') {
            exportData();
        }
    });
    document.getElementById('importBtnSidebar')?.addEventListener('click', () => {
        if (typeof openImportModal !== 'undefined') {
            openImportModal();
        }
    });
    
    // Form and Modal controls (only if they exist on the page)
    document.getElementById('closeFormModalBtn')?.addEventListener('click', () => {
        if (typeof closeFormModal !== 'undefined') {
            closeFormModal();
        }
    });
    document.getElementById('cancelFormBtn')?.addEventListener('click', () => {
        if (typeof closeFormModal !== 'undefined') {
            closeFormModal();
        }
    });
    const prospectForm = document.getElementById('prospectForm');
    if (prospectForm && typeof handleFormSubmit !== 'undefined') {
        prospectForm.addEventListener('submit', handleFormSubmit);
    }
    document.getElementById('closeImportModalBtn')?.addEventListener('click', () => {
        if (typeof closeImportModal !== 'undefined') {
            closeImportModal();
        }
    });
    document.getElementById('cancelImportBtn')?.addEventListener('click', () => {
        if (typeof closeImportModal !== 'undefined') {
            closeImportModal();
        }
    });
    document.getElementById('processImportBtn')?.addEventListener('click', () => {
        if (typeof handleImport !== 'undefined') {
            handleImport();
        }
    });

    // Filters (only if they exist on the page)
    document.getElementById('searchInput')?.addEventListener('keyup', () => {
        if (typeof applyFilters !== 'undefined') {
            applyFilters();
        }
    });
    document.getElementById('priorityFilter')?.addEventListener('change', () => {
        if (typeof applyFilters !== 'undefined') {
            applyFilters();
        }
    });
    document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
        if (typeof applyFilters !== 'undefined') {
            document.getElementById('searchInput').value = '';
            document.getElementById('priorityFilter').value = '';
            applyFilters();
        }
    });
}
