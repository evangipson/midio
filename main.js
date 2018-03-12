var _audioContext;
var oscTypes = ["sine", "sawtooth", "triangle"];
var circles = [];

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
 * @param {Number} echoDelay
 */
function playMIDINote(type, frequency, time, volume, echoDelay, circleX, circleY) {
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
        console.log("Weird value recieved for volume. It's: %s. Exiting.", volume);
        return;
    }
    else {
        console.log("Custom value for volume recieved. Playing note at %s volume", volume);
        gainNode = _audioContext.createGain(); // to control volume
    }
    if(!time) {
        time = 1; // in seconds
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
    osc.stop(_audioContext.currentTime + time); // turn off the note
    if(circleX && circleY) {
        if(echoDelay) {
            drawNoteCircle(circleX, circleY, volume);
        }
        else {
            drawNoteCircle(circleX, circleY);
        }
    }
    // handle recursive echo notes
    if(echoDelay && volume >= 0.2) {
        volume = volume - 0.2;
        window.setTimeout(function() {
            playMIDINote(type, frequency, time, volume, echoDelay, circleX, circleY);
        }, echoDelay);
    }
}

function playRandomEchoNote(event) {
    var type = getRandomArrayItem(oscTypes);
    var freq = getRange(100, 800);
    var time = Math.random() * 0.4 + 0.08;
    var echoDelay = getRange(500, 2000); // in ms
    /* as long as we provide an echoDelay, we'll
     * hear an echo. */
    playMIDINote(type, freq, time, 1, echoDelay, event.clientX, event.clientY);
}

function playRandomQuietNote() {
    var type = getRandomArrayItem(oscTypes);
    var freq = getRange(100, 800);
    var time = Math.random() * 0.4 + 0.08;
    // Passing volume is easy!
    playMIDINote(type, freq, time, 0.1);
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

function drawNoteCircle(x, y, opacity) {
    var mouseX = x;
    var mouseY = y;
    var newCircle = document.createElement("span");
    newCircle.classList.add("note-circle");
    newCircle.style.left = mouseX + "px";
    newCircle.style.top = mouseY + "px";
    newCircle.style.opacity = opacity ? opacity : 1;
    document.getElementById("Visualizer").appendChild(newCircle);
    circles.push(newCircle);
    window.setTimeout(function() {
        newCircle.classList.add("active"); // "turn on" the animation in a sec
    }, 100);
    window.setTimeout(function() {
        // remove the first circle
        var removedCircle = circles.shift();
        document.getElementById("Visualizer").removeChild(removedCircle);
    }, 2000); // keep the delay consistent with the CSS
}

document.addEventListener("DOMContentLoaded", function() {
    getAudioContext();
    enableControlMenu();
    var visualizer = document.getElementById("Visualizer");
    visualizer.addEventListener("click", function(event) {
        playRandomEchoNote(event);
    });
});