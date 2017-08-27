'use strict'

const urlBase = 'https://player.twitch.tv/?channel='

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

    if (message.type && (message.type === 'CHANNEL_NAME')) {

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            
            chrome.tabs.sendMessage(tabs[0].id, 
                {type: message.type, text: urlBase + message.text},
                 () => {})
        })
    }
})
