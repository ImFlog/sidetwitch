'use strict';

const containerId = 'twitch-sideplayer-container';
const topLayerId = 'top-layer';
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
    node.style.right = 0 + 'px';
    node.style.bottom = 0 + 'px';
    node.style.height = defaultHeight + 'px';
    node.style.width = defaultWidth + 'px';


    // Resize event binding
    initResize();
    makeResizableDiv(containerId);

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
/*
* Code from https://medium.com/the-z/making-a-resizable-div-in-js-is-not-easy-as-you-think-bda19a1bc53d
*/
function makeResizableDiv(div) {
    
    // get the div
    const element = document.getElementById(div);
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
            originalWidth = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
            originalHeight = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
            original_x = element.getBoundingClientRect().left;
            original_y = element.getBoundingClientRect().top;
            originalMouseX = e.pageX;
            originalMouseY = e.pageY;

            let resize = (e) => {
                if (currentResizer.classList.contains('resize-bottom-right')) {
                    const width = originalWidth + (e.pageX - originalMouseX);
                    const height = originalHeight + (e.pageY - originalMouseY);

                    // capping
                    if (width > defaultWidth) {
                        element.style.width = width + 'px';
                        element.lastElementChild.width = width;
                    }
                    if (height > defaultHeight) {
                        element.style.height = height + 'px';
                        element.lastElementChild.height = height;
                    }
                }
                else if (currentResizer.classList.contains('resize-bottom-left')) {
                    const height = originalHeight + (e.pageY - originalMouseY)
                    const width = originalWidth - (e.pageX - originalMouseX)
                    if (height > defaultHeight) {
                        element.style.height = height + 'px';
                        element.lastElementChild.height = height;
                    }
                    if (width > defaultWidth) {
                        element.style.width = width + 'px';
                        element.lastElementChild.width = width;
                        element.style.left = original_x + (e.pageX - originalMouseX) + 'px';
                    }
                }
                else if (currentResizer.classList.contains('resize-top-left')) {
                    const width = originalWidth - (e.pageX - originalMouseX)
                    const height = originalHeight - (e.pageY - originalMouseY)
                    if (width > defaultWidth) {
                        element.style.width = width + 'px';
                        element.lastElementChild.width = width;
                        element.style.left = original_x + (e.pageX - originalMouseX) + 'px';
                    }
                    if (height > defaultHeight) {
                        element.style.height = height + 'px';
                        element.lastElementChild.height = height;
                        element.style.top = original_y + (e.pageY - originalMouseY) + 'px'
                    }
                }
            };

            let stopResize = () => {
                window.removeEventListener('mousemove', resize);
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
