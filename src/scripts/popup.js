/**
 * @file This file contains the popup script.
 * @author Cold-FR
 * @last-modified 2024-10-10
 * @version 2.0
 * @github https://github.com/Cold-FR/CITY-FILTER-EXTENSION
 */

/**
 * The mode of the ignored values.
 * @type {string}
 * @default 'usernames'
 */
let mode = 'usernames';

/**
 * @type {HTMLDivElement} - The ignored values list.
 * @default document.getElementById('ignored-values-list')
 * @readonly
 */
const ignoredValuesList = document.getElementById('ignored-values-list');

/**
 * @type {HTMLDivElement} - The loader.
 * @default document.getElementById('loader')
 * @readonly
 */
const loader = document.getElementById('loader');

/**
 * @type {HTMLFormElement} - The ignore add form.
 * @default document.getElementById('ignore-add-form')
 * @readonly
 */
const form = document.getElementById('ignore-add-form');

/**
 * The form submit event.
 * @function
 * @param {Event} e - The event.
 * @returns {void}
 * @listens submit
 */
form.addEventListener('submit', (e) => {
    e.preventDefault();

    return addIgnoredValue(e.target[0].value);
});

/**
 * The document ready event.
 * @function
 * @returns {void}
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    displayIgnoredValues();
    
    chrome.storage.local.get('darkMode', (data) => {
        if(data.darkMode) document.documentElement.classList.add('black');
    });
});

/**
 * The color mode button click event.
 * @function
 * @returns {void}
 * @listens click
 */
document.getElementById('colorMode').addEventListener('click', () => {
    toggleColorMode();
});

/**
 * The change mode button.
 * @type {HTMLDivElement}
 * @default document.getElementById('changeMode')
 */
const btnChangeMode = document.getElementById('changeMode');

/**
 * The change mode button click event.
 * @function
 * @returns {void}
 * @listens click
 */
btnChangeMode.addEventListener('click', () => {
    showLoader();

    btnChangeMode.classList.toggle('usernames');
    if(mode === 'usernames') {
        mode = 'words';
    } else {
        mode = 'usernames';
    }

    document.getElementById('head-title').innerText = mode === 'usernames' ? 'Ignorer un joueur' : 'Ignorer un mot';
    if(mode === 'usernames') {
        document.getElementById('head-description').innerText ='Vous pouvez ignorer des joueurs pour ne plus voir leurs messages apparaître dans le tchat.'
    } else {
        document.getElementById('head-description').innerText = 'Vous pouvez ignorer des mots pour ne plus voir les messages contenant ces mots apparaître dans le tchat.';
    }
    form.dataset.mode = mode;
    document.getElementById('ignore-input').placeholder = mode === 'usernames' ? 'Nom d\'utilisateur' : 'Mot à ignorer';
    document.getElementById('ignore-submit').value = mode === 'usernames' ? 'Ignorer le joueur' : 'Ignorer le mot';
    document.getElementById('ignored-values-title').innerText = `${mode === 'usernames' ? 'Joueurs' : 'Mots'} ignorés`;
    document.getElementById('ignored-values-description').innerText = `Vous pouvez retirer un ${mode === 'usernames' ? 'joueur' : 'mot'} de la liste en cliquant dessus.`;

    displayIgnoredValues();

    hideLoader();
});

/**
 * Shows the loader.
 * @function
 * @returns {void}
 */
function showLoader() {
    loader.style.display = 'flex';
}

/**
 * Hides the loader.
 * @function
 * @returns {void}
 */
function hideLoader() {
    setTimeout(() => {
        loader.style.display = 'none';
    }, 300);
}

/**
 * Toggles the color mode.
 * @function
 * @returns {void}
 */
function toggleColorMode() {
    if(document.documentElement.classList.contains('black')) {
        chrome.storage.local.set({darkMode: false}).then(r => document.documentElement.classList.remove('black'));
    } else {
        chrome.storage.local.set({darkMode: true}).then(r => document.documentElement.classList.add('black'));
    }
}

/**
 * Adds a value to the ignored list.
 * @function
 * @param {string} value - The value to add.
 * @returns {void}
 */
function addIgnoredValue(value) {
    chrome.storage.local.get(mode, (data) => {
        const values = data[mode] || [];
        const valuesCheck = values.map((value) => value.toLowerCase());
        if(valuesCheck.includes(value.toLowerCase())) return;
        values.push(value);

        chrome.storage.local.set({ [mode]: values }, () => {
            displayIgnoredValues();
            sendCheckValues();
        });
    });
}

/**
 * Displays the ignored values list.
 * @function
 * @returns {void}
 */
function displayIgnoredValues() {
    ignoredValuesList.innerHTML = '';

    chrome.storage.local.get(mode, (data) => {
        if (data[mode] && data[mode].length > 0) {
            data[mode].forEach((value) => {
                const div = document.createElement('div');
                div.classList.add('ignored-value');
                div.innerText = value;

                div.addEventListener('click', async () => {
                    const currentValues = await chrome.storage.local.get(mode);
                    const newValues = currentValues[mode].filter((v) => v !== value);
                    showLoader();
                    chrome.storage.local.set({ [mode]: newValues }, () => {
                        sendCheckValues();
                        newValues.length === 0 ? displayIgnoredValues() : div.remove();
                        hideLoader();
                    });
                });

                ignoredValuesList.appendChild(div);
            });
        } else {
            const p = document.createElement('p');
            p.classList.add('empty');
            p.innerText = `Vous n'avez ignoré aucun ${mode === 'usernames' ? 'joueur' : 'mot'}.`;
            ignoredValuesList.appendChild(p);
        }
    });
}

/**
 * Sends a message to the content script to check the values.
 * @function
 * @returns {void}
 */
function sendCheckValues() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab.url.match('habbocity.me')) return;

        chrome.tabs.sendMessage(activeTab.id, {checkUsernames: mode === 'usernames', checkWords: mode === 'words'});
    });
}