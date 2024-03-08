/**
 * @file This file contains the content script for the extension.
 * @author Cold-FR
 * @last-modified 2024-08-20
 * @version 1.0
 * @github https://github.com/Cold-FR/CITY-FILTER-EXTENSION
 */

/**
 * Options for the observers.
 * @constant {Object}
 * @property {boolean} childList - Whether to observe the addition of new child nodes or removal of existing child nodes.
 * @property {boolean} subtree - Whether to extend monitoring to the entire subtree of nodes rooted at the target.
 * @default
 */
const observerOptions = {childList: true, subtree: true};

/**
 * The state of the chat observer.
 * True if the chat observer is active, false otherwise.
 * @type {boolean}
 * @default
 */
let chatObserverState = false;

/**
 * The chat observer.
 * Calls the filterMessages function when a new message is added to the chat.
 * @const {MutationObserver}
 * @default
 */
const chatObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) filterMessages();
    });
});

/**
 * @type {string[]} - The list of usernames to filter.
 * @default
 */
let usernamesFiltered = [];
chrome.storage.sync.get('usernames', (data) => {
    usernamesFiltered = data;
});

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
    });
}

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
