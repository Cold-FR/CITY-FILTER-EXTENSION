/**
 * @file This file contains the content script for the extension.
 * @author Cold-FR
 * @last-modified 2024-10-10
 * @version 2.0
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
 * The body observer.
 * Check if the chat is added to the DOM and calls the setUpChatObserver function.
 * @constant {MutationObserver}
 * @default {new MutationObserver}
 */
const bodyObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            if (mutation.addedNodes.length > 0 && !chatObserverState) {
                if (mutation.addedNodes[0].classList && mutation.addedNodes[0].classList.contains('nitro-chat-widget')) setUpChatObserver();
            } else if (mutation.removedNodes.length > 0 && chatObserverState) {
                if (mutation.removedNodes[0].classList && mutation.removedNodes[0].classList.contains('nitro-chat-widget')) disconnectChatObserver();
            }
        }
    });
});

bodyObserver.observe(document.getElementById('root'), observerOptions);

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
        if (usernamesFiltered.includes(username.toLowerCase())) div.style.display = 'none';

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
 * Fetches the list of usernames to filter from the storage.
 * @function
 * @returns {void}
 */
function fetchUsernames() {
    chrome.storage.local.get('usernames', (data) => {
        const usernames = data.usernames;

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