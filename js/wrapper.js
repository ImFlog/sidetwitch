'use strict';

const containerId = 'twitch-sideplayer-container';
const createType = 'CREATE_CHANNEL';
const removeType = 'REMOVE_CHANNEL';
const pauseType = 'PAUSE_CHANNEL';
const hideType = 'HIDE_CHANNEL';
const changeHostType = 'CHANGE_HOST_CHANNEL';

const defaultWidth = '400';
const defaultHeight = '300';

const MAX_WIDTH = '1200';
const MAX_HEIGHT = '900';

let player = null;

// Drag
let selected = null; // Object of the element to be moved
let x_pos = 0, y_pos = 0; // Stores x & y coordinates of the mouse pointer
let x_elem = 0, y_elem = 0; // Stores top, left values (edge) of the element

// Resize
let startXResize, startYResize, startWidthResize, startHeightResize;

chrome.runtime.onMessage.addListener(function (message) {
    if (message.type) {
        if (message.type === createType) {
            startVideo(message.text, message.isHidden)
        } else if (message.type === removeType) {
            clearPage()
        } else if (message.type === pauseType) {
            player.pause()
        } else if (message.type === hideType) {
            togglePlayer()
        }
    }
});

function startVideo(channelId, isHidden) {
    let elem = document.getElementById(containerId);
    if (elem === null) {
        createContainer(channelId, isHidden)
    } else if (player.getChannel() !== channelId) {
        clearPage();
        createContainer(channelId, isHidden)
    } else if (!isHidden && player && player.isPaused()) {
        player.play()
    }
}

function clearPage() {
    let elem = document.getElementById(containerId);
    if (elem != null) {
        elem.parentNode.removeChild(elem)
    }
    player = null
}

function togglePlayer() {
    let elem = document.getElementById(containerId);
    if (elem) {
        if (elem.style.display === 'none') {
            // Show player
            player.play();
            elem.style.display = 'block'
        } else {
            // Hide player
            player.pause();
            elem.style.display = 'none'
        }
    }
}

function removeContainer() {
    clearPage();
    // Send message to background to propagate the remove
    chrome.runtime.sendMessage({ type: removeType });
}

// Will be called when user starts dragging an element
function dragInit(elem) {
    // Store the object of the element which needs to be moved
    selected = elem;
    x_elem = x_pos - selected.offsetLeft;
    y_elem = y_pos - selected.offsetTop;
}

function doDrag(e) {
    x_pos = document.all ? window.event.clientX : e.pageX;
    y_pos = document.all ? window.event.clientY : e.pageY;
    if (selected !== null) {
        // set new position
        selected.style.left = (x_pos - x_elem) + 'px';
        selected.style.top = (y_pos - y_elem) + 'px';

        // Remove previously set right position
        selected.style.removeProperty('right');
        selected.style.removeProperty('bottom');
    }
}

function initResize() {
    startWidthResize = parseInt(document.defaultView.getComputedStyle(document.getElementById(containerId)).width, 10);
    startHeightResize = parseInt(document.defaultView.getComputedStyle(document.getElementById(containerId)).height, 10);
}

function defineResizingHandling(resizeItem) {
    resizeItem.addEventListener('mousedown', (e) => {
        startXResize = e.clientX;
        startYResize = e.clientY;
        initResize();
        /*document.documentElement.addEventListener('mousemove', doResize, false);
        document.documentElement.addEventListener('mouseup', stopResize, false);*/
        document.getElementById(containerId).addEventListener('mousemove', (e) => {
            console.log('TARGET', e.target);
            doResize(e);
        }, false);
        document.getElementById(containerId).addEventListener('mouseup', stopResize, false);
    });
}

function doResize(e) {
    let container = document.getElementById(containerId);


    let newWidth = startWidthResize + (startXResize - e.clientX);
    let newHeight = startHeightResize + (startYResize - e.clientY);

    // we cap the width and the height
    if (newWidth < parseInt(defaultWidth, 10)) {
        newWidth = parseInt(defaultWidth, 10);
    } else if (newWidth > MAX_WIDTH) {
        newWidth = MAX_WIDTH;
    }

    if (newHeight < parseInt(defaultHeight, 10)) {
        newHeight = parseInt(defaultHeight, 10);
    } else if (newHeight > MAX_HEIGHT) {
        newHeight = MAX_HEIGHT;
    }
    container.style.width = newWidth + 'px';
    container.style.height = newHeight + 'px';
    container.lastElementChild.width = newWidth;
    container.lastElementChild.height = newHeight;
}

function stopResize() {
    /*document.documentElement.removeEventListener('mousemove', doResize, false);
    document.documentElement.removeEventListener('mouseup', stopResize, false);*/
    document.getElementById(containerId).removeEventListener('mousemove', doResize, false);
    document.getElementById(containerId).removeEventListener('mouseup', stopResize, false);
}

/**
 * Create the twitch container div with embedded twitch.
 */
function createContainer(channelId, isHidden) {
    let node = document.createElement('div');
    node.id = containerId;
    if (isHidden) {
        node.style.display = 'none';
    }

    let closeItem = createCloseItem();
    let moveItem = createMoveItem(node);
    let resizeTopLeft = createResizeItem('resize-top-left');
    let resizeBottomLeft = createResizeItem('resize-bottom-left');
    let resizeBottomRight = createResizeItem('resize-bottom-right');

    node.appendChild(closeItem);
    node.appendChild(moveItem);
    node.appendChild(resizeTopLeft);
    node.appendChild(resizeBottomLeft);
    node.appendChild(resizeBottomRight);
    document.body.appendChild(node);

    // initial size and position
    node.style.right = 0 + 'px';
    node.style.bottom = 0 + 'px';
    node.style.height = defaultHeight + 'px';
    node.style.width = defaultWidth + 'px';


    // Resize event binding
    initResize();

    defineResizingHandling(resizeTopLeft);
    defineResizingHandling(resizeBottomLeft);
    defineResizingHandling(resizeBottomRight);


    // Show buttons on mouseover
    node.onmouseover = function () {
        closeItem.style.display = 'block';
        moveItem.style.display = 'block'
    };
    
    // Hide buttons on mouseover
    node.onmouseout = function () {
        closeItem.style.display = 'none';
        moveItem.style.display = 'none';
    };

    let options = {
        width: defaultWidth,
        height: defaultHeight,
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
    embed.addEventListener(Twitch.Embed.VIDEO_PLAY, () => {
        if (channelId !== player.getChannel()) {
            chrome.runtime.sendMessage({ type: changeHostType, channelId: player.getChannel() });
        }
    });
}

/**
 * Create the close button.
 */
function createCloseItem() {
    let close = document.createElement('div');
    close.id = 'close-twitch-sideplayer';

    // Custom style applied at runtime
    let closeImg = chrome.runtime.getURL('img/x-circle.svg');
    close.style.backgroundImage = 'url("' + closeImg + '")';
    close.style.display = 'none';

    // Bind close event
    close.onclick = removeContainer;
    return close;
}

/**
 * Create the dragging button.
 */
function createMoveItem(container) {
    let move = document.createElement('div');
    move.id = 'move-twitch-sideplayer';

    // Custom style applied at runtime
    let moveImg = chrome.runtime.getURL('img/move.svg');
    move.style.backgroundImage = 'url("' + moveImg + '")';
    move.style.display = 'none';

    // Moving events binding
    move.onmousedown = function () {
        dragInit(container);
        return false;
    };
    document.onmousemove = doDrag;
    document.onmouseup = function () {
        selected = null;
    };
    return move;
}

/**
 * Create the resizing div.
 */
function createResizeItem(position) {
    let resizeItem = document.createElement('div');
    let className = 'resize-twitch-sideplayer ' + position;
    resizeItem.className = className;
    return resizeItem;
}
