function setUpFrontEnd() {
    if(visualizerElement) {
        initControlMenu(); // starts autoplay & evolve
        visualizerElement.addEventListener("mousedown", function() {
            noteTimingEventHandler = setInterval(function(){
                clickedNoteLength = clickedNoteLength + 0.01;
            }, 100);
        });
        visualizerElement.addEventListener("click", function(event) {
            clearInterval(noteTimingEventHandler);
            generateSound(event);
            clickedNoteLength = 0;
        });
    }
}

/**
 * Responsible for loading the impulse reponse file,
 * and setting up the buffer of audioContext to be reverberated.
 * Will start up midio.
 */
(function initReverbAndMidio() {
    let impulseResponseFileRead = new XMLHttpRequest();
    impulseResponseFileRead.open('GET', './audio/1st_baptist_nashville_far_wide.wav', true);
    impulseResponseFileRead.responseType = 'arraybuffer';
    impulseResponseFileRead.onload = () => {
        let audioData = impulseResponseFileRead.response;
        audioContext.decodeAudioData(audioData, (buffer: AudioBuffer) => {
            reverbNode.buffer = buffer;
        }, function(e: any){"Error with decoding audio data" + e.err});
        setUpFrontEnd(); // set up visualizer and control panel after we load the impulse response
    };
    impulseResponseFileRead.send();
})(); // immediately invoked - starting point for the application