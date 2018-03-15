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
const baseTone = 280; // in Hz
// root tone included as 0, top octave note not included.
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
    ],
    ambient: [
        0,
        2,
        5,
        10,
    ],
    test: [
        22/7,
        Math.pow(Math.log(10), 22/7),
        0.0001,
        0.9999,
        0.5555
    ]
};
const twelfthRootOfTwo = 1.05946309; // need this to calculate Hz based on interval & scale
let currentScale = scales.ambient; // will need this later for UI

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
};

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
 * Relies on twelfthRootOfTwo.
 * @param {Number} note in Hz
 * @param {Array} scale interval array
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

/**
 * Will return a gain node, given a volume less than 1.
 * If volume is 0, null is returned.
 * Relies on audioContext.
 * @param {Number} volume
 */
const getGainNode = volume => {
    if(volume > 0 && volume < 1.0) {
        const gainNode = audioContext.createGain();
        return gainNode;
    }
    return null;
};

/**
 * Will get a note position given an event.
 * Will return null if provided no event.
 * @param {HTMLEvent} event
 */
const getNotePosition = event => {
    return {
        x: event ? event.clientX : null,
        y: event ? event.clientY : null
    };
};

/**
 * Sets the passed in osc's type and frequency,
 * then returns that osc.
 * Relies on audioContext.
 * @param {Oscillator} osc
 * @param {String} type
 * @param {Number} frequency in Hz
 */
const setOscProperties = (osc, type, frequency) => {
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
    return osc;
};

/**
 * Connects a new oscillator and hooks up a gain node
 * if it needs to, then returns the connected oscillator.
 * Relies on audioContext.
 * @param {GainNode} gainNode
 */
const connectOscNode = (gainNode) => {
    const osc = audioContext.createOscillator();
    if(gainNode) {
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
    }
    else {
        osc.connect(audioContext.destination);
    }
    return osc;
};

/**
 * Starts the given osc, then stops it in the
 * time provided, in seconds.
 * Relies on audioContext.
 * @param {Oscillator} osc
 * @param {Number} time in seconds
 */
const startOscillator = (osc, time) => {
    osc.start();
    osc.stop(audioContext.currentTime + time);
    return osc;
};

/**
 * Will set an "attack" on a gain, then
 * return that gainNode.
 * @param {GainNode} gainNode
 * @param {Number} volume from 0 to 1
 * @param {Number} attackValue in seconds
 * @param {Number} releaseValue in seconds
 */
const setADSR = (gainNode, volume, attackValue = 0.1, releaseValue = 0.1) => {
    if(gainNode) {
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + attackValue);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + attackValue + releaseValue);
    }
    return gainNode;
};

/**
 * Will generate a frequency based on a scale.
 * Relies on baseTone and twelfthRootOfTwo
 * @param {Array} scale interval array
 */
const getHarmonicNoteFrequency = scale => {
    let harmonicInterval = getRandomArrayItem(scale);
    // in a 2 octave range, 1 up 1 down
    harmonicInterval = Math.random() > 0.50 ? -(harmonicInterval) : harmonicInterval;
    // perform our calculation to give back our frequency
    return baseTone * Math.pow(twelfthRootOfTwo, harmonicInterval);
};

/**
 * Will generate a chord, returned as a set filled with
 * unique values. Relies on currentScale.
 * @param {Number} baseNote the root note of the chord, interval
 * @param {Number} tones how many notes you want in the chord
 */
const getChord = (baseNote, tones) => {
    let chordTones = [];
    for(var i = 0; i < tones; i++) {
        chordTones.push(getUniqueChordNote(baseNote, currentScale));
    }
    // since sets can only store unique values, let's make
    // a set with the chord tones, since i want them unique.
    return new Set(chordTones);
};

/**
 * Creates a click event somewhere randomly on the visualizer,
 * within a window of the gutter provided, and returns the event.
 * @param {Number} screenGutter how much edge of the screen to give, in px.
 */
const getFakeMouseClick = (screenGutter = 100) => {
    const bestGuessX = getRange(screenGutter, document.getElementById("Visualizer").offsetWidth - screenGutter);
    const bestGuessY = getRange(screenGutter, document.getElementById("Visualizer").offsetHeight - screenGutter);
    return new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true,
        'clientX': bestGuessX,
        'clientY': bestGuessY
    });
};

// Non-Pure Functions
/**
 * Will play a MIDI note. Plays a sine wave
* at 440hz for 1 second by default.
* @param {String} type of waveform. default is sine.
* @param {Number} frequency in Hz. default is 440.
* @param {Number} time in seconds. default is .5s.
* @param {Number} volume from 0 to 1. default is 1.0, so 100%.
* @param {Number} attack from 0 to 1. default is 0.1.
* @param {Number} release from 0 to 1. default is 0.1.
* @param {Number} echoDelay used with notes that have echo, in milliseconds. default is false.
* @param {HTMLEvent} event to determine where to draw the circles. default is null.
*/
function playMIDINote(type = "sine", frequency = 440, time = 0.5, volume = 1.0, attack = 0.1, release = 0.1, echoDelay = false, event = null) {
    // handle creating an oscillator and starting & stopping it
    const osc = startOscillator(
                    setOscProperties(
                            connectOscNode(setADSR(getGainNode(volume), volume, attack, release)),
                    type, frequency),
                time);
    // draw those pretty circles on the canvas
    if(event) {
        drawNoteWithVolumeBasedOpacity(echoDelay, event, volume);
    }
    // handle repeating notes
    if(echoDelay && volume > 0.2) {
        volume = volume - 0.2;
        window.setTimeout(function() {
            playMIDINote(type, frequency, time, volume, attack, release, echoDelay, event);
        }, echoDelay);
    }
}

/**
 * Will return a random note duration, in seconds.
 * Note: Isn't pure because it's random, and has no inputs.
 */
function getRandomNoteDuration() {
    return Math.random() * 0.2 + 0.08;
}

/**
 * Will return an object containing properties
 * defining a "pad", or long, usually background note.
 */
function assemblePadNote() {
    const attackValue = getRange(10, 100) / 10;
    return {
        type: Math.random() > 0.50 ? "triangle" : "sine",
        frequency: getHarmonicNoteFrequency(currentScale),
        time: getRange(1, 10),
        volume: getRange(1, 7) / 10,
        attackValue: attackValue,
        releaseValue: attackValue,
        echoDelay: null,
    };
}

/**
 * Will return an object containing properties
 * defining a "normal" note.
 */
function assembleNormalNote() {
    const attackValue = getRange(2, 20) / 10;
    return {
        type: getRandomArrayItem(waveTypes),
        frequency: getHarmonicNoteFrequency(currentScale),
        time: getRandomNoteDuration(),
        volume: getRange(1, 4) / 10,
        attackValue: attackValue,
        releaseValue: attackValue,
        echoDelay: maybe(getRange(100, 1500)), // in ms
    };
}

/**
 * Will draw the expanding circle factoring in volume
 * as opacity (out of 1.0). Also handles getting the note
 * position from the event.
 * @param {Number} echoDelay
 * @param {HTMLEvent} event
 * @param {Number} volume
 */
function drawNoteWithVolumeBasedOpacity(echoDelay, event, volume) {
    let coords = getNotePosition(event);
    if(echoDelay) {
        drawNoteCircle(coords.x, coords.y, volume);
    }
    else {
        drawNoteCircle(coords.x, coords.y);
    }
}

/**
 * The function responsible for playing a MIDI note
 * after you've clicked the mouse.
 * @param {HTMLEvent} event
 */
function playNoteOnClick(event) {
    /* as long as we provide an echoDelay, we'll
    * hear an echo. */
    const note = assembleNormalNote();
    playMIDINote(
        note.type,
        note.frequency,
        note.time,
        getRange(1, 7) / 10,
        note.attackValue,
        note.releaseValue,
        note.echoDelay,
        event
    );
}

/**
 * "Starts" the radio and keeps it going by calling itself.
 * This is the driver of the automatic radio generation.
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
        note.attackValue,
        note.releaseValue,
        note.echoDelay,
        getFakeMouseClick()
    );
    // take care of chords if there is one.
    getChord(note, additionalChordTones).forEach((chordTone) => {
        playMIDINote(
            chordTone.type,
            chordTone.frequency,
            chordTone.time,
            chordTone.volume,
            chordTone.attackValue,
            chordTone.releaseValue,
            false, // no echo for chords
            getFakeMouseClick()
        );
    });

    // now in a random amount of time, call itself again.
    const msUntilNextNote = getRange(0.25, 5) * 1000; // in ms
    window.setTimeout(function() {
        generateSound();
    }, msUntilNextNote);
}

/**
 * Wires up the close/open functionality of the controls menu.
 */
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

/**
 * Takes care of drawing the expanding notes on screen.
 * Intended to be called by playMIDINote() so shouldn't be called directly.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} opacity
 */
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