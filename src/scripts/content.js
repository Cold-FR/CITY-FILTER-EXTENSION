/**
 * @file This file contains the content script for the extension.
 * @author Cold-FR
 * @last-modified 2024-08-20
 * @version 1.0
 * @github https://github.com/Cold-FR/CITY-FILTER-EXTENSION
 */

/**
 * Filters messages from the chat in game.
 * @function
 * @name filterMessages
 * @returns {void}
 */
function filterMessages() {
    let chats = Array.from(document.querySelectorAll('.bubble-container:not(.fetched)'));
    chats.forEach((div) => {
        div.classList.add('fetched');
        const username = div.querySelector('.chat-content .username').innerText.replace(':', '').replace(' ', '');
        if (usernames.includes(username.toLowerCase())) div.style.display = 'none';
    });
}