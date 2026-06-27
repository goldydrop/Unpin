document.addEventListener('DOMContentLoaded', () => {
    const toggles = document.querySelectorAll('.yt-setting'); 
    const offSection = document.getElementById('off');
    const optionsSection = document.getElementById('options');
    const masterToggleTop = document.getElementById('pin_on_top'); 
    const masterToggleHidden = document.getElementById('pin_on');  
    
    const darkModeIcon = document.getElementById('dark_mode_icon');

    const defaultSettings = {
        pin_on_top: true,      
        pin_on: true,          
        hide_feed: true,       
        hide_related: true,    
        hide_unorganized_ideas: true, 
        hide_board_suggestions: true, 
        dark_mode: false       
    };

    chrome.storage.sync.get(defaultSettings, (settings) => {
        toggles.forEach(toggle => {
            if (settings[toggle.id] !== undefined) {
                toggle.checked = settings[toggle.id];
            }
        });

        updateUI(settings.pin_on_top);
        applyPopupDarkMode(settings.dark_mode);
    });

    toggles.forEach(toggle => {
        toggle.addEventListener('change', (event) => {
            const toggleId = event.target.id;
            const isChecked = event.target.checked;

            if (toggleId === 'pin_on_top') {
                masterToggleHidden.checked = isChecked;
                chrome.storage.sync.set({ pin_on_top: isChecked, pin_on: isChecked });
                updateUI(isChecked);
            } 
            else if (toggleId === 'pin_on') {
                masterToggleTop.checked = isChecked;
                chrome.storage.sync.set({ pin_on_top: isChecked, pin_on: isChecked });
                updateUI(isChecked);
            } 
            else {
                chrome.storage.sync.set({ [toggleId]: isChecked });
            }

            sendMessageToContentJs();
        });
    });

    if (darkModeIcon) {
        darkModeIcon.addEventListener('click', () => {
            chrome.storage.sync.get('dark_mode', (settings) => {
                const currentDarkMode = settings.dark_mode || false;
                const newDarkMode = !currentDarkMode; 

                chrome.storage.sync.set({ dark_mode: newDarkMode }, () => {
                    applyPopupDarkMode(newDarkMode);
                    sendMessageToContentJs();
                });
            });
        });
    }

    function sendMessageToContentJs() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "updateSettings" }, function(response) {
                    if (chrome.runtime.lastError) {}
                });
            }
        });
    }

    function updateUI(isExtensionOn) {
        if (isExtensionOn) {
            offSection.style.display = 'none';
            optionsSection.style.display = 'flex';
        } else {
            offSection.style.display = 'block';
            optionsSection.style.display = 'none';
        }
    }

    function applyPopupDarkMode(isDark) {
        if (isDark) {
            document.body.style.backgroundColor = '#1a1a1a';
            document.body.style.color = '#f1f1f1';
        } else {
            document.body.style.backgroundColor = '#ffffff';
            document.body.style.color = '#111111';
        }
    }
});