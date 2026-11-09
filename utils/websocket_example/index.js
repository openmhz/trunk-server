// Install first: npm install socket.io-client
const io = require('socket.io-client');
const serverUrl = 'http://api.openmhz.test'; // Update URL to match your server

// Connect to the WebSocket server
const socket = io(serverUrl); // Update URL to match your server


// filterType can be "group", "talkgroup", "all", or "firehose"
// if filterType is "group" then filterCode is the group ID
// if filterType is "talkgroup" then filterCode is the talkgroup ID
// if filterType is "all" then filterCode is ""
// if filterType is "firehose" then filterCode is set to the FIREHOSE_KEY

// shortName is the shortName for the System to monitor, unless it is in firehose mode, then it is set to ""
// filterStarred is ignored, so just set to false



// Connection event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit("start", {
        filterCode: "",
        filterType: "all",
        filterName: "Test Client",
        filterStarred: false,
        shortName: "test"
      });
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Listen for incoming messages
socket.on('new message', (message) => {
    message = JSON.parse(message);
    const date = new Date(message.time);
    console.log('\n=== Call Details ===');
    console.log(`Time: ${date.toLocaleString()}`);
    console.log(`Talkgroup: ${message.talkgroupNum}`);
    console.log(`System: ${message.shortName}`);
    console.log(`Duration: ${message.len} seconds`);
    console.log(`Frequency: ${(message.freq / 1000000).toFixed(3)} MHz`);
    console.log(`Emergency: ${message.emergency ? 'Yes' : 'No'}`);
    console.log('\nSource List:');
    message.srcList.forEach(src => {
        console.log(`- Source ${src.src} at position ${src.pos}s`);
    });
    console.log('\nAudio URL:', message.url);
    console.log('==================\n');
});

// Error handling
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

