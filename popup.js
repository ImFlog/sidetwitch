'user strict'

document.getElementById('start-stream').addEventListener('click', function(e) {
	let element = document.getElementById('channel-name')
	chrome.runtime.sendMessage({type: 'CHANNEL_NAME', text: element.value})
}, false)
