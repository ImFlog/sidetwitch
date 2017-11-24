'use strict'

const containerId = 'twitch-sideplayer-container'
const createType = 'CREATE_CHANNEL'
const removeType = 'REMOVE_CHANNEL'

// Is it possible to share the player between tabs ?
var player = null

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type) {
        if (message.type === createType) {
            startVideo(message.text)
        } else if (message.type === removeType) {
            clearPage()
        }
    }
})

function startVideo(channelId) {
    if (player === null) {
        createContainer(channelId)
    } else if(player.getChannel() != channelId) {
        clearPage()
        createContainer(channelId)
    }
}

function clearPage() {
    let elem = document.getElementById(containerId)
    if (elem != null) {
        elem.parentNode.removeChild(elem)
    }
}

function removeContainer() {
    clearPage()
    // Send message to background to propagate the remove
    chrome.runtime.sendMessage({type: removeType})
}

function createContainer(channelId) {
    let node = document.createElement('div')
    node.id = containerId

    let close = document.createElement('p')
    close.id = 'close-twitch-sideplayer'
    close.onclick = removeContainer

    node.appendChild(close)
    document.body.appendChild(node)

    let options = {
        width: 400,
        height: 300,
        channel: channelId,
        allowfullscreen: false,
        layout: 'video', // Add chat ?
        theme: 'dark',
    };

    let embed = new Twitch.Embed(containerId, options);
    embed.addEventListener(Twitch.Embed.VIDEO_READY, () => {
        player = embed.getPlayer();
        player.play();
    });
}
