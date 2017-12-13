'use strict'

const containerId = 'twitch-sideplayer-container'
const createType = 'CREATE_CHANNEL'
const removeType = 'REMOVE_CHANNEL'
const pauseType = 'PAUSE_CHANNEL'

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
        } else if (message.type === pauseType) {
            player.pause()
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
    } else if(player.isPaused()) {
        player.play()
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

function move_elem(e) {
    x_pos = document.all ? window.event.clientX : e.pageX
    y_pos = document.all ? window.event.clientY : e.pageY
    if (selected !== null) {
        // set new position
        selected.style.left = (x_pos - x_elem) + 'px'
        selected.style.top = (y_pos - y_elem) + 'px'

        // Remove previously set right position
        selected.style.removeProperty('right')
        selected.style.removeProperty('bottom')
    }
}

/**
 * Create the twitch container div with embedded twitch.
 */
function createContainer(channelId) {
    let node = document.createElement('div')
    node.id = containerId

    let closeItem = createCloseItem()
    let moveItem = createMoveItem(node)

    node.appendChild(closeItem)
    node.appendChild(moveItem)
    document.body.appendChild(node)

    // initial position
    node.style.right = 0 + 'px'
    node.style.bottom = 0 + 'px'

    // Show buttons on mouseover
    node.onmouseover = function(e) {
        closeItem.style.display = 'block'
        moveItem.style.display = 'block'
    }
    // Hide buttons on mouseover
    node.onmouseout = function(e) {
        closeItem.style.display = 'none'
        moveItem.style.display = 'none'
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
    })
}

/**
 * Create the close button.
 */
function createCloseItem() {
    let close = document.createElement('div')
    close.id = 'close-twitch-sideplayer'

    // Custom style applied at runtime
    let closeImg = chrome.runtime.getURL('img/x-circle.svg')
    close.style.backgroundImage  = 'url("' + closeImg + '")'
    close.style.display = 'none'

    // Bind close event
    close.onclick = removeContainer
    return close
}

/**
 * Create the dragging button.
 */
function createMoveItem(container) {
    let move = document.createElement('div')
    move.id = 'move-twitch-sideplayer'
    
    // Custom style applied at runtime
    let moveImg = chrome.runtime.getURL('img/move.svg')
    move.style.backgroundImage  = 'url("' + moveImg + '")'
    move.style.display = 'none'

    // Moving events binding
    move.onmousedown = function() {
        drag_init(container)
        return false
    }
    document.onmousemove = move_elem
    document.onmouseup = function() {
        selected = null
    }

    return move
}