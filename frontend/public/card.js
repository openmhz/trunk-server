'use strict';

// Create an instance
let wavesurfer;

// Init & load audio file
document.addEventListener('DOMContentLoaded', function() {
    // Init
    wavesurfer = WaveSurfer.create({
        container: document.querySelector('#waveform'),
        waveColor: '#A8DBA8',
        progressColor: '#3B8686',
        backend: 'MediaElement',
        mediaControls: false
    });

    wavesurfer.once('ready', function() {
        console.log('Using wavesurfer.js ' + WaveSurfer.VERSION);
    });

    wavesurfer.on('error', function(e) {
        console.warn(e);
    });

    // Load audio from URL
    wavesurfer.load('https://s3.us-west-1.wasabisys.com/openmhz-west/media/dcfd-1039-1613917169.m4a');

    // toggle play button
    document
        .querySelector('[data-action="play"]')
        .addEventListener('click', wavesurfer.playPause.bind(wavesurfer));


});