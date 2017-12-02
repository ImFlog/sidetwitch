'use strict'

// TODO : This is duplicated ...
const createType = 'CREATE_CHANNEL'
const removeType = 'REMOVE_CHANNEL'
const pauseType = 'PAUSE_CHANNEL'
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
    chrome.tabs.query({active: false, currentWindow: true}, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(
                tabs[i].id,
                {type: pauseType},
                () => {}
            )
        }
    })
}

function notifyContainerDeletion() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(
                tabs[i].id,
                {type: removeType},
                () => {}
            )
        }
    })
    chrome.tabs.query({active: false, currentWindow: true}, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(
                tabs[i].id,
                {type: removeType},
                () => {}
            )
        }
    })
}
