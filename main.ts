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
const baseTone = 120;
// root not included, top octave note note included.
const scales = {
    major: [
        0,
        2,
        4,
        5,
        7,
        9,
        11
    ],
    naturalMinor: [
        0,
        2,
        3,
        5,
        7,
        8,
        10
    ],
    harmonicMinor: [
        0,
        2,
        3,
        5,
        7,
        8,
        11
    ],
    melodicMinor: [
        0,
        2,
        3,
        5,
        7,
        9,
        11
    ],
    pentatonic: [
        0,
        3,
        4,
        7,
        11
    ],
    jazz: [
        0,
        1,
        2,
        4,
        5,
        6,
        8,
        10
    ]
};
const twelfthRootOfTwo = 1.05946309;
let currentScale = scales.naturalMinor; // will need this later for UI

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

/**
 * Gets a unique note in the chord, not the one provided.
 */
const getUniqueChordNote = (note, scale) => {
    let returnNote = getHarmonicNoteFrequency(getRandomArrayItem(scale));
    // this makes sure there is enough space between the next note by
    // making sure at least one half step is between the two notes.
    while(note === returnNote || returnNote - note < twelfthRootOfTwo || note - returnNote < twelfthRootOfTwo) {
        returnNote = getHarmonicNoteFrequency(getRandomArrayItem(scale));
    }
    return returnNote;
};

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
        frequency: getHarmonicNoteFrequency(currentScale),
        time: getRandomNoteDuration() * getRange(3, 10),
        echoDelay: null,
        volume: getRange(0.4, 0.7)
    }
}

function assembleNormalNote() {
    return {
        type: getRandomArrayItem(waveTypes),
        frequency: getHarmonicNoteFrequency(currentScale),
        time: getRandomNoteDuration(),
        volume: 1.0,
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
 * Clicks somewhere randomly on the visualizer, within a window.
 * @param {Number} screenGutter how much edge of the screen to give, in px.
 */
function fakeMouseClick(screenGutter = 100) {
    const bestGuessX = getRange(screenGutter, document.getElementById("Visualizer").offsetWidth - screenGutter);
    const bestGuessY = getRange(screenGutter, document.getElementById("Visualizer").offsetHeight - screenGutter);
    return new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true,
        'clientX': bestGuessX,
        'clientY': bestGuessY
    });
}

/**
 * Will generate a chord, returned as a set filled with
 * unique values. Relies on currentScale.
 * @param baseNote the root note of the chord
 * @param tones how many notes you want in the chord
 */
const getChord = (baseNote, tones) => {
    let chordTones = [];
    for(var i = 0; i < tones; i++) {
        chordTones.push(getUniqueChordNote(baseNote, currentScale));
    }
    // since sets can only store unique values, let's make
    // a set with the chord tones, since i want them unique.
    return new Set(chordTones);
}

/**
 * "Starts" the radio and keeps it going by calling itself.
 * Note: Can generate either a tone, echo tone, or chord.
 */
function generateSound() {
    const note = Math.random() > 0.50 ? assemblePadNote() : assembleNormalNote();
    const additionalChordTones = Math.random() < 0.10 ? getRange(1, 4) : false; // small chance for chords
    playMIDINote(
        note.type,
        note.frequency,
        note.time,
        note.volume,
        note.echoDelay,
        fakeMouseClick()
    );
    // take care of chords if there is one.
    getChord(note, additionalChordTones).forEach((chordTone) => {
        playMIDINote(
            chordTone.type,
            chordTone.frequency,
            chordTone.time,
            chordTone.volume,
            false, // no echo for chords
            fakeMouseClick()
        );
    });

    // now in a random amount of time, call itself again.
    const msUntilNextNote = getRange(0.25, 5) * 1000; // in ms
    window.setTimeout(function() {
        generateSound()
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
    generateSound();
});