// using ECMAScript 6
'use strict';

// Variables
// Immutable global variable, used to chain audio
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
// used to keep track of circles which represent notes
let circles = [];
const waveTypes = [
    "sine",
    "sawtooth",
    "triangle",
    "square"
];
// in half steps
const baseTone = 150;
const majorScale = [
    0,
    2,
    4,
    5,
    7,
    9,
    11
];
const minorScale = [
    0,
    2,
    3,
    5,
    7,
    9,
    11
];
const jazzScale = [
    0,
    1,
    2,
    3,
    5,
    8,
    9
];
const twelfthRootOfTwo = 1.05946309;

// Pure Functions
/**
 * Will run the provided function... maybe.
 * @param {Function} func
 */
const maybe = func => {
    if(Math.random() > 0.50) {
        return func;
    }
    return null;
}

/**
 * Gives back a random array item, provided
* the array.
* @param {Array} array 
*/
const getRandomArrayItem = array => array[Math.floor(Math.random()*array.length)];

/**
 * Gives back a number in the range provided.
* @param {Number} min 
* @param {Number} max 
*/
const getRange = (min, max) => Math.floor(Math.random() * max) + min;

const getGainNode = volume => {
    if(volume > 1.0 && audioContext) {
        return audioContext.createGain().
                gain.setValueAtTime(volume, 1);
    }
    return null;
};

/**
 * Will get a note position given an event.
 * Will default to give a position somewhere inside of the visualizer.
 * @param event 
 */
const getNotePosition = event => {
    return {
        x: event ? event.clientX : null,
        y: event ? event.clientY : null
    };
};

const setOscProperties = (osc, type, frequency) => {
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, 0);
    return osc;
};

/**
 * Connects an oscillator to a destination of
* the node passed in.
*/
const connectOscNode = (gainNode) => {
    const osc = audioContext.createOscillator();
    if(gainNode) {
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        return gainNode;
    }
    else {
        osc.connect(audioContext.destination);
        return osc;
    }
};

const startOscillator = (osc, time) => {
    osc.start();
    osc.stop(audioContext.currentTime + time);
    return osc;
};

// Non-Pure Functions
/**
 * Will play a MIDI note. Plays a sine wave
* at 440hz for 1 second by default.
* @param {String} type of waveform. default is sine.
* @param {Number} frequency in Hz. default is 440.
* @param {Number} time in seconds. default is .5s.
* @param {Number} volume from 0 to 1. default is 1.0.
* @param {Number} echoDelay in milliseconds. default is false.
* @param {HTMLEvent} event to give us x and y
*/
function playMIDINote(type = "sine", frequency = 440, time = 0.5, volume = 1.0, echoDelay = false, event) {
    // handle creating an oscillator and starting & stopping it
    const osc = startOscillator(
                setOscProperties(
                    connectOscNode(getGainNode(volume)),type,frequency
                ), time);
    // draw those pretty circles on the canvas
    if(event) {
        drawNote(echoDelay, event, volume);
    }
    // handle repeating notes
    if(echoDelay && volume > 0.2) {
        volume = volume - 0.2;
        window.setTimeout(function() {
            playMIDINote(type, frequency, time, volume, echoDelay, event);
        }, echoDelay);
    }
}

// Not pure because it's random
function getRandomNoteDuration() {
    return Math.random() * 0.4 + 0.08;
}

/**
 * Will generate a frequency based on a scale.
 * Relies on baseTone and twelfthRootOfTwo
 * @param scale an array of intervals.
 */
const getHarmonicNoteFrequency = scale => {
    let harmonicInterval = getRandomArrayItem(scale);
    // in a 2 octave range, 1 up 1 down
    harmonicInterval = Math.random() > 0.50 ? -(harmonicInterval) : harmonicInterval;
    // perform our calculation to give back our frequency
    return baseTone * (twelfthRootOfTwo ^ harmonicInterval);
};

function assemblePadNote() {
    return {
        type: Math.random() > 0.50 ? "triangle" : "sine",
        frequency: getHarmonicNoteFrequency(minorScale),
        time: getRandomNoteDuration() * getRange(2, 5),
        echoDelay: null
    }
}

function assembleNormalNote() {
    return {
        type: getRandomArrayItem(waveTypes),
        frequency: getHarmonicNoteFrequency(minorScale),
        time: getRandomNoteDuration(),
        echoDelay: maybe(getRange(200, 2000)), // in ms
    }
}

function drawNote(echoDelay, event, volume) {
    let coords = getNotePosition(event);
    if(echoDelay) {
        drawNoteCircle(coords.x, coords.y, volume);
    }
    else {
        drawNoteCircle(coords.x, coords.y);
    }
}

function playNoteOnClick(event) {
    /* as long as we provide an echoDelay, we'll
    * hear an echo. */
    const note = assembleNormalNote();
    playMIDINote(
        note.type,
        note.frequency,
        note.time,
        1,
        note.echoDelay,
        event
    );
}

/**
 * "Starts" the radio and keeps it going by calling itself.
 */
function generateNote() {
    const note = Math.random() > 0.50 ? assemblePadNote() : assembleNormalNote();
    // fake a mouse click to trigger the pretty circle and remember it's x, y
    const fakeMouseEvent = new MouseEvent("click", {
        clientX: getRange(50, document.getElementById("Visualizer").offsetWidth - 50),
        clientY: getRange(50, document.getElementById("Visualizer").offsetHeight - 50)
    });
    const event = fakeMouseEvent.initMouseEvent("click",
        false,
        false,
        window,
        0,
        0,
        0,
        getRange(50, document.getElementById("Visualizer").offsetWidth - 50),
        getRange(50, document.getElementById("Visualizer").offsetHeight - 50),
        false,
        false,
        false,
        false,
        0,
        document.getElementById("Visualizer")
    );
    playMIDINote(
        note.type,
        note.frequency,
        note.time,
        1,
        note.echoDelay,
        event
    );
    // now in a random amount of time, call itself again.
    const msUntilNextNote = getRange(0.25, 8) * 1000; // in ms
    window.setTimeout(function() {
        generateNote()
    }, msUntilNextNote);
}


function enableControlMenu() {
    let showControlsButton = document.getElementById("ShowControls");
    let content = document.getElementById("ControlList");
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

function drawNoteCircle(x, y, opacity = "1.0") {
    let newCircle = document.createElement("span");
    newCircle.classList.add("note-circle");
    newCircle.style.left = x + "px";
    newCircle.style.top = y + "px";
    newCircle.style.opacity = opacity;
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
    enableControlMenu();
    document.getElementById("Visualizer").addEventListener("click", function(event) {
        playNoteOnClick(event);
    });
    generateNote();
});