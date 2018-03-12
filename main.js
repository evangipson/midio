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
 * @param {Number} volume from 0 to 1
 */
function playMIDINote(type, frequency, time, volume) {
    var gainNode; // if we need "custom" volume, we'll need a gain

    if(!type) {
        type = "sine";
    }
    if(!frequency) {
        frequency = 440; // in Hz
    }
    if(!volume) {
        volume = 1.0;
    }
    else if(volume < 0 || volume > 1) {
        console.log("Weird value recieved for volume. It's: %s. Setting volume to 100% for this note.", volume);
        volume = 1.0; // disallow odd values
    }
    else {
        console.log("Custom value for volume recieved. Playing note at %s volume", volume);
        gainNode = _audioContext.createGain(); // to control volume
    }
    if(!time) {
        time = _audioContext.currentTime + 1;
    }
    else {
        time = _audioContext.currentTime + time; // in seconds
    }
    var osc = _audioContext.createOscillator(); // instantiate an oscillator
    osc.type = type;
    // if we have any custom volume, connect the gain node to control volume
    if(gainNode) {
        osc.connect(gainNode);
        gainNode.connect(_audioContext.destination);
    }
    else {
        osc.connect(_audioContext.destination); // connect it to the destination
    }
    osc.frequency.setValueAtTime(frequency, 0);
    if(gainNode) {
        gainNode.gain.setValueAtTime(volume, 1);
    }
    osc.start(); // sound the note
    osc.stop(time); // turn off the note
}

function playRandomEchoNote() {
    var type = getRandomArrayItem(oscTypes);
    var freq = getRange(100, 800);
    var time = Math.random() * 0.4 + 0.08;
    var delay = getRange(200, 1000);
    var echoLength = getRange(2, 3) / 10;
    var note = setInterval(function() {
        if(!this.vol) { this.vol = 1.0 }
        else { this.vol = this.vol - echoLength }
        if(this.vol > 0 && this.vol <= 1) {
            playMIDINote(type, freq, time, this.vol);
        } 
        else {
            // stop the echo after it's done (or has weird volume)
            this.vol = null;
            clearInterval(note);
        }
    }, delay); // let the note go with varying echo
    /*window.setTimeout(function() {
        clearInterval(note);
    }, delay * ((1 / echoLength) + 1));*/
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
        playRandomEchoNote();
    });
});