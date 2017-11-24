'use strict'

// const urlBase = 'https://player.twitch.tv/?channel='
const createType = 'CREATE_CHANNEL'
const removeType = 'REMOVE_CHANNEL'
let currentChannel = ''

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type && (message.type === createType)) {
        currentChannel = message.text
        notifyContainerCreation()
    } else if (message.type && (message.type === removeType)) {
        currentChannel = ''
        notifyContainerDeletion()
    }
})

// TODO : add pause message on non activated tab ?
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (currentChannel != '') {
        notifyContainerCreation()
    } else {
        notifyContainerDeletion()
    }
});

chrome.tabs.onCreated.addListener(function(tab) {
    if (currentChannel != '') {
        notifyContainerCreation()
    } else {
        notifyContainerDeletion()
    }
});

chrome.tabs.onActivated.addListener(function(tabId, changeInfo, tab) {
    if (currentChannel != '') {
        notifyContainerCreation()
    } else {
        notifyContainerDeletion()
    }
});

function notifyContainerCreation() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {type: createType, text: currentChannel},
            () => {}
        )
    })
}

function notifyContainerDeletion() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {type: removeType},
            () => {}
        )
    })
}
