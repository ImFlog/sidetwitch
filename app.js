'use strict'

let opts = {
    method: 'GET',
    headers: {
        'Content-Type': 'text'
    },
}

const containerId = 'twitch-sideplayer-container'

function startVideo(channelUrl) {
    if(document.getElementById(containerId)) {
        removeContainer(channelUrl)
    } 
    createContainer(channelUrl)
}

function removeContainer() {
    let elem = document.getElementById(containerId);
    elem.parentNode.removeChild(elem);
}

function createContainer(channelUrl) {
    let node = document.createElement('div')
    node.id = containerId

    fetch(chrome.extension.getURL('/index.html'), opts).then(data => {
        data.text().then(txt => {
            node.innerHTML = txt
            node.children[0].children[1].setAttribute("src", channelUrl)
            node.children[0].children[0].onclick = removeContainer
            document.body.appendChild(node)
        })
    })
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type && (message.type === 'CHANNEL_NAME')) {
        startVideo(message.text)
    }
})
