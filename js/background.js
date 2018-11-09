'use strict';

// TODO : This is duplicated ...
const createType = 'CREATE_CHANNEL';
const removeType = 'REMOVE_CHANNEL';
const pauseType = 'PAUSE_CHANNEL';
const hideType = 'HIDE_CHANNEL';
const changeHostType = 'CHANGE_HOST_CHANNEL';
const updatePlayerInfosType = 'UPDATE_PLAYER_INFOS';

let currentChannel = '';
let isHidden = false;
let playerInfos;

let isPlaying = false;


chrome.runtime.onMessage.addListener(function (message) {
    if (message.type && (message.type === createType)) {
        currentChannel = message.text;
        notifyContainerCreation()
    } else if (message.type && (message.type === removeType)) {
        currentChannel = '';
        playerInfos = null;
        notifyContainerDeletion()
    } else if (message.type && (message.type === changeHostType)) {
        currentChannel = message.channelId
    } else if (message.type && (message.type === updatePlayerInfosType)) {
        notifyContainerInfos(message.playerInfos);
    }
});

chrome.tabs.onUpdated.addListener(function () {
    if (!!currentChannel) {
        notifyContainerCreation()
    } else {
        notifyContainerDeletion()
    }
});

chrome.tabs.onCreated.addListener(function () {
    if (!!currentChannel) {
        notifyContainerCreation()
    } else {
        notifyContainerDeletion()
    }
});

chrome.tabs.onActivated.addListener(function () {
    if (!!currentChannel) {
        notifyContainerCreation()
    } else {
        notifyContainerDeletion()
    }
});

function notifyContainerCreation() {
    // get current tab and send a message to it
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!!tabs[0]) {
            chrome.tabs.sendMessage(
                tabs[0].id,
                { type: createType, text: currentChannel, isHidden: isHidden, playerInfos },
                () => { }
            )
        }
    });
    // get inactive tabs and send a message to it
    chrome.tabs.query({ active: false, currentWindow: true }, function (tabs) {
        for (let i = 0; i < tabs.length; i++) {
            if (!!tabs[i]) {
                chrome.tabs.sendMessage(
                    tabs[i].id,
                    { type: pauseType },
                    () => { }
                )
            }
        }
    })
}

function notifyContainerInfos(infos) {
    playerInfos = infos;
    chrome.tabs.query({ active: false, currentWindow: true }, function (tabs) {
        for (let i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(
                tabs[i].id,
                { type: updatePlayerInfosType, playerInfos },
                () => { }
            )
        }
    });
}

function notifyContainerDeletion() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        for (let i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(
                tabs[i].id,
                { type: removeType },
                () => { }
            )
        }
    });
    chrome.tabs.query({ active: false, currentWindow: true }, function (tabs) {
        for (let i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(
                tabs[i].id,
                { type: removeType },
                () => { }
            )
        }
    });
}

// Player hidding feature
chrome.commands.onCommand.addListener(function (command) {
    if (command === "toggle-display") {
        isHidden = !isHidden
        // Send a message to every content-script asking to pause and hide.
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            for (let i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(
                    tabs[i].id,
                    { type: hideType },
                    () => { }
                )
            }
        });
        chrome.tabs.query({ active: false, currentWindow: true }, function (tabs) {
            for (let i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(
                    tabs[i].id,
                    { type: hideType },
                    () => { }
                )
            }
        })
    }
});