function setUpFrontEnd() {
    const visualizer = document.getElementById("Visualizer");
    if(visualizer) {
        initControlMenu(); // starts autoplay & evolve
        visualizer.addEventListener("mousedown", function() {
            noteTimingEventHandler = setInterval(function(){
                clickedNoteLength = clickedNoteLength + 0.01;
            }, 100);
        });
        visualizer.addEventListener("click", function(event) {
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
const impulseResponseFileRead = new XMLHttpRequest();
impulseResponseFileRead.open('GET', 'audio/1st_baptist_nashville_far_wide.wav', true);
impulseResponseFileRead.responseType = 'arraybuffer';
impulseResponseFileRead.onload = () => {
    const audioData = impulseResponseFileRead.response;
    audioContext.decodeAudioData(audioData, (buffer: AudioBuffer) => {
        reverbNode.buffer = buffer;
    }, function(e: any){"Error with decoding audio data" + e.err});
    setUpFrontEnd(); // set up visualizer and control panel after we load the impulse response
};
impulseResponseFileRead.send();