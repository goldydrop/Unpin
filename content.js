const STYLE_ID = 'unpin-custom-styles';
let currentExtensionSettings = {}; 

function updatePinterest(settings) {
    let styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        document.documentElement.appendChild(styleEl); 
    }

    if (settings.pin_on === false || settings.pin_on_top === false) {
        styleEl.textContent = '';
        return;
    }

    const isPinPage = window.location.pathname.includes('/pin/');
    let css = '';

    // Hide Home Feed
    if (settings.hide_feed && !isPinPage) {
        css += `
            [data-test-id="homefeed-feed"] > div { 
                opacity: 0 !important; 
                pointer-events: none !important;
            }
            [data-test-id="homefeed-feed"] {
                height: 80vh !important;
                overflow: hidden !important;
                position: relative !important;
            }
            [data-test-id="homefeed-feed"]::before {
                content: "Home feed hidden by Unpin 📌";
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 22px;
                color: #767676;
                font-weight: 600;
                z-index: 999;
                display: block !important;
            }
        `;
    }

    // Hide Related Pins
    if (settings.hide_related && isPinPage) {
        css += `
            [data-grid-item]:has([data-test-id="closeup-body"]) ~ [data-grid-item],
            [data-grid-item]:has([data-test-id="pin-closeup"]) ~ [data-grid-item],
            [data-grid-item]:has([data-test-id="closeup-lego-container"]) ~ [data-grid-item] { 
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
        `;
    }

    // Hide Board Suggestions
    if (settings.hide_board_suggestions) {
        css += `
            [data-test-id="board-suggestions"],
            [data-test-id="suggested-boards"],
            [data-test-id="board-suggestions-carousel"],
            [aria-label="Suggested boards"],
            [aria-label="Board suggestions"],
            [aria-label="Ideas for your boards"],
            [aria-label="Board suggestion"],
            [data-test-id="pin-cluster"],
            div:has(> div > h2):has([aria-label="Board suggestion"]),
            div:has(> div > h2):has([data-test-id="create-pin-cluster-button"]),
            .moreIdeasOnBoard,
            div:has(> .moreIdeasOnBoard),
            [data-grid-item]:has([data-test-id="board-rep-tap-area-link"]) { 
                opacity: 0 !important; 
                visibility: hidden !important;
                height: 0px !important; 
                overflow: hidden !important; 
                pointer-events: none !important; 
                margin: 0 !important; 
                padding: 0 !important;
            }
        `;
    }

    // Visual crush for Unorganized Ideas
    css += `
        [data-up-hidden="true"] {
            opacity: 0 !important;
            height: 0px !important;
            overflow: hidden !important;
            pointer-events: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
        }
    `;

    styleEl.textContent = css;
}

function applyCurrentSettings() {
    chrome.storage.sync.get(null, (settings) => {
        const ds = {
            pin_on: true, 
            pin_on_top: true, 
            hide_feed: true, 
            hide_related: true, 
            hide_unorganized_ideas: true,
            hide_board_suggestions: true
        };
        currentExtensionSettings = {...ds, ...settings};
        updatePinterest(currentExtensionSettings);
    });
}

applyCurrentSettings();

chrome.runtime.onMessage.addListener((req) => {
    if (req.action === "updateSettings") applyCurrentSettings();
});

let lastUrl = location.href;

setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        applyCurrentSettings();
    }
    
    const shouldHideUnorganized = currentExtensionSettings.pin_on && currentExtensionSettings.pin_on_top && currentExtensionSettings.hide_unorganized_ideas;
    
    if (shouldHideUnorganized) {
        const targets = document.querySelectorAll('[data-test-id="unorganized-feed-header"], h2, h3');
        
        targets.forEach(node => {
            if (node.getAttribute('data-test-id') === 'unorganized-feed-header' || 
                node.textContent.trim() === 'Unorganized ideas') {
                
                // Tag the header for our CSS to crush it
                if (node.dataset.upHidden !== 'true') node.dataset.upHidden = 'true';
                
                let currentWrapper = node;
                for (let i = 0; i < 5; i++) {
                    if (currentWrapper && currentWrapper.nextElementSibling) {
                        const sibling = currentWrapper.nextElementSibling;
                        
                        if (sibling.querySelector('[data-test-id="masonry-container"]') || 
                            sibling.querySelector('.masonryContainer') ||
                            sibling.classList.contains('masonryContainer')) {
                            
                            // Tag the grid for our CSS to crush it
                            if (sibling.dataset.upHidden !== 'true') sibling.dataset.upHidden = 'true';
                            break; 
                        }
                    }
                    if (currentWrapper) currentWrapper = currentWrapper.parentElement;
                }
            }
        });
    } else {
        // Instantly restore everything by removing the tags—no reload needed!
        document.querySelectorAll('[data-up-hidden="true"]').forEach(el => {
            el.dataset.upHidden = 'false';
        });
    }
}, 500);