const ignoredPlayersList = document.getElementById('ignored-players-list');
const loader = document.getElementById('loader');
document.getElementById('ignore-player').addEventListener('submit', (e) => {
    e.preventDefault();

    addIgnoredPlayer(e.target[0].value);
});

document.addEventListener('DOMContentLoaded', () => {
    displayIgnoredPlayers();
    
    chrome.storage.sync.get('darkMode', (data) => {
        if(data.darkMode) document.documentElement.classList.add('black');
    });
});

document.getElementById('colorMode').addEventListener('click', () => {
    toggleColorMode();
});

/**
 * Toggles the color mode.
 * @function
 * @returns {void}
 */
function toggleColorMode() {
    if(document.documentElement.classList.contains('black')) {
        document.documentElement.classList.remove('black');
        chrome.storage.sync.set({ darkMode: false });
    } else {
        document.documentElement.classList.add('black');
        chrome.storage.sync.set({ darkMode: true });
    }
}

/**
 * Adds a username to the ignored players list.
 * @function
 * @param {string} username - The username to add.
 * @returns {void}
 */
function addIgnoredPlayer(username) {
    chrome.storage.sync.get('usernames', (data) => {
        const usernames = data.usernames || [];
        const usernamesCheck = usernames.map((username) => username.toLowerCase());
        if(usernamesCheck.includes(username.toLowerCase())) return;
        usernames.push(username);

        chrome.storage.sync.set({ usernames: usernames }, () => {
            displayIgnoredPlayers();
            sendCheckUsernames();
        });
    });
}

/**
 * Displays the ignored players list.
 * @function
 * @returns {void}
 */
function displayIgnoredPlayers() {
    ignoredPlayersList.innerHTML = '';

    chrome.storage.sync.get('usernames', (data) => {
        if (data.usernames && data.usernames.length > 0) {
            data.usernames.forEach((username) => {
                const newUsernames = data.usernames.filter((u) => u !== username);
                const div = document.createElement('div');
                div.classList.add('ignored-player');
                div.textContent = username;
                div.addEventListener('click', () => {
                    loader.style.display = 'flex';
                    chrome.storage.sync.set({ usernames: newUsernames }, () => {
                        sendCheckUsernames();
                        newUsernames.length === 0 ? displayIgnoredPlayers() : div.remove();
                        setTimeout(() => {
                            loader.style.display = 'none';
                        }, 300);
                    });
                });
                ignoredPlayersList.appendChild(div);
            });
        } else {
            const p = document.createElement('p');
            p.classList.add('empty');
            p.textContent = 'Vous n\'avez ignoré aucun joueur.';
            ignoredPlayersList.appendChild(p);
        }
    });
}

/**
 * Sends a message to the content script to check the usernames.
 * @function
 * @returns {void}
 */
function sendCheckUsernames() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if(!activeTab.url.match('habbocity.me')) return;

        chrome.tabs.sendMessage(activeTab.id, { checkUsernames: true });
    });
}