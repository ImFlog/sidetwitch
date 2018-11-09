'use strict';

const containerId = 'twitch-sideplayer-container';
const topLayerId = 'top-layer';
const createType = 'CREATE_CHANNEL';
const removeType = 'REMOVE_CHANNEL';
const pauseType = 'PAUSE_CHANNEL';
const hideType = 'HIDE_CHANNEL';
const changeHostType = 'CHANGE_HOST_CHANNEL';
const updatePlayerInfosType = 'UPDATE_PLAYER_INFOS';

const defaultWidth = '400';
const defaultHeight = '300';

function PlayerInfos () {
    return {
        x: 0,
        y: 0,
        width: defaultWidth,
        height: defaultHeight
    };
}

let playerInfos;

let player = null;

// Drag
let selected = null; // Object of the element to be moved
let x_pos = 0, y_pos = 0; // Stores x & y coordinates of the mouse pointer
let x_elem = 0, y_elem = 0; // Stores top, left values (edge) of the element

// Resize
let startWidthResize, startHeightResize;

chrome.runtime.onMessage.addListener(function (message) {
    if (message.type) {
        if (message.type === createType) {
            playerInfos = playerInfos || message.playerInfos;
            startVideo(message.text, message.isHidden);
        } else if (message.type === removeType) {
            clearPage();
        } else if (message.type === pauseType) {
            player.pause();
        } else if (message.type === hideType) {
            togglePlayer();
        } else if (message.type === updatePlayerInfosType) {
            playerInfos = message.playerInfos;
            updatePlayerPositionAndDimensions();
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
        elem.parentNode.removeChild(elem);
    }
    player = null;
    playerInfos = null;
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

function updatePlayerInfos() {
    let clientRect;
    let container = document.getElementById(containerId);
    if (!!container) {
        clientRect = container.getBoundingClientRect();
        playerInfos.width = clientRect.width;
        playerInfos.height = clientRect.height;
        playerInfos.x = clientRect.left;
        playerInfos.y = clientRect.top;

        chrome.runtime.sendMessage({ type: updatePlayerInfosType, playerInfos });
    }
}

function updatePlayerPositionAndDimensions() {
    let container = document.getElementById(containerId);

    if (!!container) {
        container.style.width = playerInfos.width + 'px';
        container.lastElementChild.width = playerInfos.width;
        container.style.left = playerInfos.x + 'px';

        container.style.height = playerInfos.height + 'px';
        container.lastElementChild.height = playerInfos.height;
        container.style.top = playerInfos.y + 'px';
    }
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

/**
 * Create the twitch container div with embedded twitch.
 */
function createContainer(channelId, isHidden) {
    let node = document.createElement('div');
    node.id = containerId;

    if (isHidden) {
        node.style.display = 'none';
    }

    let topLayer = document.createElement('div');
    topLayer.id = topLayerId;

    node.appendChild(topLayer);

    let closeItem = createCloseItem();
    let moveItem = createMoveItem(node);
    let resizeTopLeft = createResizeItem('resize-top-left');
    let resizeBottomLeft = createResizeItem('resize-bottom-left');
    let resizeBottomRight = createResizeItem('resize-bottom-right');

    topLayer.appendChild(closeItem);
    topLayer.appendChild(moveItem);
    topLayer.appendChild(resizeTopLeft);
    topLayer.appendChild(resizeBottomLeft);
    topLayer.appendChild(resizeBottomRight);
    document.body.appendChild(node);

    // initial size and position
    if (!playerInfos) {
        playerInfos = new PlayerInfos();
        node.style.right = playerInfos.x + 'px';
        node.style.bottom = playerInfos.y + 'px';
        node.style.height = playerInfos.height + 'px';
        node.style.width = playerInfos.width + 'px';
    } else {
        updatePlayerPositionAndDimensions();
    }

    // Resize event binding
    initResize();
    makeResizableDiv();

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
        width: playerInfos.width,
        height: playerInfos.height,
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
/*
* Code from https://medium.com/the-z/making-a-resizable-div-in-js-is-not-easy-as-you-think-bda19a1bc53d
*/
function makeResizableDiv() {
    
    // get the div
    const container = document.getElementById(containerId);
    // get all the resizers
    const resizers = document.querySelectorAll('.resize-twitch-sideplayer');
    let originalWidth = 0;
    let originalHeight = 0;
    let original_x = 0;
    let original_y = 0;
    let originalMouseX = 0;
    let originalMouseY = 0;

    for (let i = 0;i < resizers.length; i++) {
        const currentResizer = resizers[i];
        currentResizer.addEventListener('mousedown', (e) => {
            e.preventDefault()
            originalWidth = parseFloat(getComputedStyle(container, null).getPropertyValue('width').replace('px', ''));
            originalHeight = parseFloat(getComputedStyle(container, null).getPropertyValue('height').replace('px', ''));
            original_x = container.getBoundingClientRect().left;
            original_y = container.getBoundingClientRect().top;
            originalMouseX = e.pageX;
            originalMouseY = e.pageY;

            let resize = (e) => {
                let width, height;

                if (currentResizer.classList.contains('resize-bottom-right')) {
                    width = originalWidth + (e.pageX - originalMouseX);
                    height = originalHeight + (e.pageY - originalMouseY);

                    // capping
                    if (width > defaultWidth) {
                        container.style.width = width + 'px';
                        container.lastElementChild.width = width;
                    }
                    if (height > defaultHeight) {
                        container.style.height = height + 'px';
                        container.lastElementChild.height = height;
                    }
                }
                else if (currentResizer.classList.contains('resize-bottom-left')) {
                    height = originalHeight + (e.pageY - originalMouseY)
                    width = originalWidth - (e.pageX - originalMouseX)
                    if (height > defaultHeight) {
                        container.style.height = height + 'px';
                        container.lastElementChild.height = height;
                    }
                    if (width > defaultWidth) {
                        container.style.width = width + 'px';
                        container.lastElementChild.width = width;
                        container.style.left = original_x + (e.pageX - originalMouseX) + 'px';
                    }
                }
                else if (currentResizer.classList.contains('resize-top-left')) {
                    width = originalWidth - (e.pageX - originalMouseX)
                    height = originalHeight - (e.pageY - originalMouseY)
                    if (width > defaultWidth) {
                        container.style.width = width + 'px';
                        container.lastElementChild.width = width;
                        container.style.left = original_x + (e.pageX - originalMouseX) + 'px';
                    }
                    if (height > defaultHeight) {
                        container.style.height = height + 'px';
                        container.lastElementChild.height = height;
                        container.style.top = original_y + (e.pageY - originalMouseY) + 'px'
                    }
                }
            };

            let stopResize = () => {
                window.removeEventListener('mousemove', resize);
                updatePlayerInfos();
            };

            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResize);
        })
        
    }
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
        updatePlayerInfos();
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
