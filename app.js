'use strict'

let opts = {
    method: 'GET',
    headers: {
        'Content-Type': 'text'
    },
}

const containerId = 'twitch-sideplayer-container'
const createType = 'CREATE_CHANNEL'
const removeType = 'REMOVE_CHANNEL'

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type) {
        if (message.type === createType) {
            startVideo(message.text)
        } else if (message.type === removeType) {
            clearPage()
        }
    }
})

function startVideo(channelUrl) {
    clearPage(channelUrl)
    createContainer(channelUrl)
}

function clearPage(channelUrl) {
    // TODO : clean this
    let container = document.getElementById(containerId)
    if(container && container.children[0].children[1].src != channelUrl) {
        let elem = document.getElementById(containerId)
        elem.parentNode.removeChild(elem)
    }
}

function removeContainer() {
    let elem = document.getElementById(containerId)
    elem.parentNode.removeChild(elem)
    // Send message to background to propagate the remove
    chrome.runtime.sendMessage({type: removeType})
}

function createContainer(channelUrl) {
    let node = document.createElement('div')
    node.id = containerId

    fetch(chrome.extension.getURL('/index.html'), opts).then(data => {
        data.text().then(txt => {
            node.innerHTML = txt
            // TODO : clean this
            node.children[0].children[1].setAttribute("src", channelUrl)
            node.children[0].children[0].onclick = removeContainer
            document.body.appendChild(node)
        })
    })
}
