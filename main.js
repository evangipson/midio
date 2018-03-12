var _audioContext;
var oscTypes = ["sine", "sawtooth", "triangle"];

function getAudioContext() {
    // one context per document
    _audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function getRandomArrayItem(array) {
    return array[Math.floor(Math.random()*array.length)];
}
function getRange(min, max) {
    return Math.floor(Math.random() * max) + min;
}

/**
 * Will play a MIDI note. Plays a sine wave
 * at 440hz for 1 second by default.
 * @param {String} type 
 * @param {Number} frequency 
 * @param {Number} time
 */
function playMIDINote(type, frequency, time) {
    if(!type) {
        type = "sine";
    }
    if(!frequency) {
        frequency = 440; // in Hz
    }
    if(!time) {
        time = _audioContext.currentTime + 1;
    }
    else {
        time = _audioContext.currentTime + time; // in seconds
    }
    var osc = _audioContext.createOscillator(); // instantiate an oscillator
    osc.type = type;
    osc.frequency.value = frequency;
    osc.connect(_audioContext.destination); // connect it to the destination
    osc.start(); // sound the note
    osc.stop(time); // turn off the note
}

function playRandomNote() {
    var type = getRandomArrayItem(oscTypes);
    var freq = getRange(100, 800);
    var time = Math.random() * 0.4 + 0.08;
    playMIDINote(type, freq, time);
}

function enableControlMenu() {
    var showControlsButton = document.getElementById("ShowControls");
    var content = document.getElementById("ControlList");
    showControlsButton.addEventListener("click", function() {
        // relies on the max height being set on the content
        if(content.style.maxHeight) {
            this.classList.remove("active");
            content.style.maxHeight = null;
        }
        else {
            this.classList.add("active");
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
}

document.addEventListener("DOMContentLoaded", function() {
    getAudioContext();
    enableControlMenu();
    var visualizer = document.getElementById("Visualizer");
    visualizer.addEventListener("click", function() {
        playRandomNote();
    });
});