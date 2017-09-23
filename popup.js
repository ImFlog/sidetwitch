'use strict'

const createType = 'CREATE_CHANNEL'

document.getElementById('start-stream').addEventListener(
    'click', sendStartMessage, false)

document.getElementById("channel-name").addEventListener("keypress",
    function(event) {
        if (event.which == 13 || event.keyCode == 13) {
            sendStartMessage()
        }
    }, false)

function sendStartMessage() {
	let element = document.getElementById('channel-name')
	chrome.runtime.sendMessage({type: createType, text: element.value})
    window.close()
}
