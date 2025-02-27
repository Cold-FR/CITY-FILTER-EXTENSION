/**
 * @file This file contains the content script for the extension.
 * @author Cold-FR
 * @last-modified 2024-10-14
 * @version 2.1
 * @github https://github.com/Cold-FR/CITY-FILTER-EXTENSION
 */

/**
 * @type {string[]} - The list of usernames to filter.
 * @default []
 */
let usernamesFiltered = [];

/**
 * @type {string[]} - The list of words to filter.
 * @default []
 */
let wordsFiltered = [];

/**
 * Options for the observers.
 * @constant {Object}
 * @property {boolean} childList - Whether to observe the addition of new child nodes or removal of existing child nodes.
 * @property {boolean} subtree - Whether to extend monitoring to the entire subtree of nodes rooted at the target.
 * @default {childList: true, subtree: true}
 */
const observerOptions = {childList: true, subtree: true};

/**
 * The state of the chat observer.
 * True if the chat observer is active, false otherwise.
 * @type {boolean}
 * @default false
 */
let chatObserverState = false;

/**
 * The chat observer.
 * Calls the filterMessages function when a new message is added to the chat.
 * @const {MutationObserver}
 * @default {new MutationObserver}
 */
const chatObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) filterMessages();
    });
});

/**
 * Sets up the chat observer to active mode.
 * @function
 * @returns {void}
 */
function setUpChatObserver() {
    chatObserverState = true;
    const chatContainer = document.querySelector('.nitro-chat-widget');

    if (chatContainer) chatObserver.observe(chatContainer, observerOptions);
}

/**
 * Disconnect the chat observer.
 * @function
 * @returns {void}
 */
function disconnectChatObserver() {
    chatObserverState = false;
    chatObserver.disconnect();
}

/**
 * The state of the mentions observer.
 * True if the mentions observer is active, false otherwise.
 * @type {boolean}
 * @default false
 */
let mentionsObserverState = false;

/**
 * The mentions observer.
 * Calls the filterMentions function when a new mention is added.
 * @const {MutationObserver}
 * @default {new MutationObserver}
 */
const mentionsObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) filterMentions();
    });
});

/**
 * Sets up the mentions observer to active mode.
 * @function
 * @returns {void}
 */
function setUpMentionsObserver() {
    mentionsObserverState = true;
    const mentionsContainer = document.querySelector('.CompNotification');

    if (mentionsContainer) {
        mentionsObserver.observe(mentionsContainer, observerOptions);
        filterMentions();
    }
}

/**
 * Disconnect the mentions observer.
 * @function
 * @returns {void}
 */
function disconnectMentionsObserver() {
    mentionsObserverState = false;
    mentionsObserver.disconnect();
}

/**
 * Sets up the ignore button in the context menu of Nitro.
 * @function
 * @returns {void}
 */
function setUpIgnoreButton() {
    const contextMenu = document.querySelector('.nitro-context-menu');
    if (!contextMenu) return;

    const btnIgnore = document.createElement('div');
    btnIgnore.className = 'd-flex w-100 align-items-center justify-content-center menu-item list-item';

    if (!usernamesFiltered.includes(contextMenu.querySelector('.menu-header').textContent.toLowerCase().trim())) {
        btnIgnore.textContent = 'Ignorer (City Filter)';
        btnIgnore.dataset.ignore = 'true';
    } else {
        btnIgnore.textContent = 'Ecouter (City Filter)';
        btnIgnore.dataset.ignore = 'false';
    }
    
    contextMenu.appendChild(btnIgnore);

    btnIgnore.addEventListener('click', () => {
        if (btnIgnore.dataset.ignore === 'true') addUsernameToFilter(contextMenu.querySelector('.menu-header').innerText);
        else removeUsernameFromFilter(contextMenu.querySelector('.menu-header').innerText);

        btnIgnore.dataset.ignore = btnIgnore.dataset.ignore === 'true' ? 'false' : 'true';
        btnIgnore.textContent = btnIgnore.dataset.ignore === 'true' ? 'Ignorer (City Filter)' : 'Ecouter (City Filter)';
    });
}

/**
 * Adds a player's username to the filter.
 * @param username - The username to add.
 * @function
 * @returns {void}
 */
function addUsernameToFilter(username) {
    if (username.trim() === '') return;

    chrome.storage.local.get('usernames', (data) => {
        const usernames = data.usernames || [];
        const usernamesCheck = usernames.map((user) => user.toLowerCase());
        if (usernamesCheck.includes(username.toLowerCase())) return;

        usernames.push(username);

        chrome.storage.local.set({usernames}, () => {
            usernamesFiltered = usernames.map((user) => user.toLowerCase());
        });
    });
}

/**
 * Removes a player's username from the filter.
 * @param username - The username to remove.
 * @function
 * @returns {void}
 */
function removeUsernameFromFilter(username) {
    if (username.trim() === '') return;

    chrome.storage.local.get('usernames', (data) => {
        const usernames = data.usernames || [];
        const newUsernames = usernames.filter((user) => user !== username);

        chrome.storage.local.set({usernames: newUsernames}, () => {
            usernamesFiltered = newUsernames.map((user) => user.toLowerCase());
        });
    });
}

/**
 * The Nitro Client observer.
 * Check if the chat is added to the DOM and calls the setUpChatObserver function.
 * @constant {MutationObserver}
 * @default {new MutationObserver}
 */
const nitroObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].classList) {
                const mutatedNode = mutation.addedNodes[0];
                if (mutatedNode.classList.contains('nitro-context-menu') && (mutatedNode.textContent.includes('Ignorer') || mutatedNode.textContent.includes('Ecouter'))) setUpIgnoreButton();

                if (!chatObserverState && mutatedNode.classList.contains('nitro-chat-widget')) setUpChatObserver();
            } else if (mutation.removedNodes.length > 0 && chatObserverState) {
                if (mutation.removedNodes[0].classList && mutation.removedNodes[0].classList.contains('nitro-chat-widget')) disconnectChatObserver();
            }
        }
    });
});

if (document.getElementById('root')) nitroObserver.observe(document.getElementById('root'), observerOptions);

/**
 * The body observer.
 * Check if the mentions container is added to the DOM and calls the setUpMentionsObserver function.
 * @constant {MutationObserver}
 * @default {new MutationObserver}
 */
const bodyObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].classList) {
                const mutatedNode = mutation.addedNodes[0];
                if (!mentionsObserverState && mutatedNode.classList.contains('CompNotification')) setUpMentionsObserver();
            } else if (mutation.removedNodes.length > 0 && mentionsObserverState) {
                if (mutation.removedNodes[0].classList && mutation.removedNodes[0].classList.contains('CompNotification')) disconnectMentionsObserver();
            }
        }
    });
});

if (document.querySelector('body.webBody')) bodyObserver.observe(document.querySelector('body.webBody'), observerOptions);

/**
 * Filters messages from the chat in game based on the global list of usernames to filter.
 * @function
 * @returns {void}
 */
function filterMessages() {
    const chats = Array.from(document.querySelectorAll('.bubble-container:not(.fetched)'));
    chats.forEach((div) => {
        div.classList.add('fetched');
        const username = div.querySelector('.chat-content .username').innerText.replace(':', '').replace(' ', '');
        if (usernamesFiltered.includes(username.toLowerCase().trim())) div.style.display = 'none';

        const msg = div.querySelector('.chat-content .message');
        const msgContent = msg.innerText.toLowerCase();
        if (wordsFiltered.some((word) => msgContent.includes(word))) {
            msg.style.fontStyle = 'italic';
            msg.style.color = '#595959';
            msg.innerText = 'Message ignoré.';
        }
    });
}

/**
 * Filters mentions from the mentions container based on the global list of usernames to filter.
 * @function
 * @returns {void}
 */
function filterMentions() {
    let mentions = Array.from(document.querySelectorAll('.CompNotification .notification:not(.fetched)'));
    mentions.forEach((mention) => {
        mention.classList.add('fetched');
        const username = mention.querySelector('.ntf3OpenProfile').innerText;
        if (usernamesFiltered.includes(username.toLowerCase().trim())) mention.querySelector('.ntf3Close').click();
    });

    mentions = Array.from(document.querySelectorAll('.CompNotification .notification'));
    if (mentions.length === 0) document.querySelector('.CompNotification .closeAll').style.display = 'none';
}

/**
 * Fetches the list of usernames to filter from the storage.
 * @function
 * @returns {void}
 */
function fetchUsernames() {
    chrome.storage.local.get('usernames', (data) => {
        const usernames = data.usernames;
        if (!usernames || (usernames.length === 0 && usernamesFiltered.length === 0)) return [];

        usernamesFiltered = usernames.map((user) => user.toLowerCase());
    });
}

/**
 * Fetches the list of words to filter from the storage.
 * @function
 * @returns {void}
 */
function fetchWords() {
    chrome.storage.local.get('words', (data) => {
        const words = data.words;
        if (!words || (words.length === 0 && wordsFiltered.length === 0)) return [];

        wordsFiltered = words.map((word) => word.toLowerCase());
    });
}

/**
 * Listens for messages from the popup script.
 * @function
 * @param {Object} request - The request object.
 * @returns {void}
 * @listens chrome.runtime.onMessage
 */
chrome.runtime.onMessage.addListener((request) => {
    if (request.checkUsernames) fetchUsernames();

    if (request.checkWords) fetchWords();
});

fetchUsernames();
fetchWords();