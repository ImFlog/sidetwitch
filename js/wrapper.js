'use strict'

const containerId = 'twitch-sideplayer-container'
const createType = 'CREATE_CHANNEL'
const removeType = 'REMOVE_CHANNEL'

var player = null
var selected = null // Object of the element to be moved
var x_pos = 0, y_pos = 0 // Stores x & y coordinates of the mouse pointer
var x_elem = 0, y_elem = 0 // Stores top, left values (edge) of the element

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
    let elem = document.getElementById(containerId)
    if (elem === null) {
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
    player = null
}

function removeContainer() {
    clearPage()
    // Send message to background to propagate the remove
    chrome.runtime.sendMessage({type: removeType})
}

// Will be called when user starts dragging an element
function drag_init(elem) {
    // Store the object of the element which needs to be moved
    selected = elem
    x_elem = x_pos - selected.offsetLeft
    y_elem = y_pos - selected.offsetTop
}

// Will be called when user is dragging an element
function move_elem(e) {
    x_pos = document.all ? window.event.clientX : e.pageX
    y_pos = document.all ? window.event.clientY : e.pageY
    if (selected !== null) {
        // set new position
        selected.style.left = (x_pos - x_elem) + 'px'
        selected.style.top = (y_pos - y_elem) + 'px'

        // Remove previously set right position
        selected.style.removeProperty('right');
        selected.style.removeProperty('bottom');
    }
}

// Destroy the object when we are done
function destroy() {
    selected = null
}

// TODO : split into multiple functions for readability
function createContainer(channelId) {
    let node = document.createElement('div')
    node.id = containerId

    let close = document.createElement('div')
    close.style.display = 'none'
    close.id = 'close-twitch-sideplayer'
    close.onclick = removeContainer

    // Drag item
    let move = document.createElement('div')
    move.id = 'move-twitch-sideplayer'
    move.style.display = 'none'
    move.onmousedown = function () {
        drag_init(node);
        return false;
    };
    document.onmousemove = move_elem
    document.onmouseup = destroy

    node.appendChild(close)
    node.appendChild(move)
    document.body.appendChild(node)

    // initial position
    node.style.right = 0 + 'px'
    node.style.bottom = 0 + 'px'

    node.onmouseover = function(e) {
        close.style.display = 'block'
        move.style.display = 'block'
    }
    node.onmouseout = function(e) {
        close.style.display = 'none'
        move.style.display = 'none'
    }

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
        player = embed.getPlayer()
        player.play()
    });
}
