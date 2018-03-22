/* using ECMAScript 6- only need this in this file because
 * I will load this file first in the HTML. */
'use strict';

// Immutable global variable, used to chain audio
const audioContext = new (window["AudioContext"] || window["webkitAudioContext"])();

const baseTone = 280; // in Hz
const maximumDensity = 65;
let autoplayEventLoop, composerEventLoop; // keeping track of autoplay & composer

// all possible wave types- used for LFO, otherwise use getActiveWaveTypes()
const allWaveTypes = [
    "sine",
    "sawtooth",
    "triangle",
    "square"
];

// used to keep track of circles which represent notes
let circles = [];

const twelfthRootOfTwo = Math.pow(2, 1/12); // need this to calculate Hz based on interval & scale

/* array representing intervals from the root tone.
 * root tone included as 0.
 * NOTE: must line up with number of palettes in css/variables.css! */
const scales = [
    // major
    [
        0,
        2,
        4,
        5,
        7,
        9,
        11
    ],
    // naturalMinor
    [
        0,
        2,
        3,
        5,
        7,
        8,
        10
    ],
    // harmonicMinor
    [
        0,
        2,
        3,
        5,
        7,
        8,
        11
    ],
    // melodicMinor
    [
        0,
        2,
        3,
        5,
        7,
        9,
        11
    ],
    // pentatonic
    [
        0,
        2,
        4,
        7,
        11
    ],
    // my own custom "jazz"
    [
        0,
        1,
        2,
        4,
        5,
        6,
        8,
        10
    ],
    // my own custom "ambient"
    [
        0,
        2,
        5,
        10,
    ]
    /* TODO: let's try crazy stuff
    [
        Math.pow(Math.log2(11), 11),
        22/7,
        Math.pow(Math.log(10), 22/7),
        0.0001,
        0.9999,
        0.5555,
        99/9,
        1.0000020345627,
        5.5/5.4
    ] */
];

// Add negative intervals and top octave
for(let scale in scales) {
    let twoOctaveScale = [];
    for(let interval in scales[scale]) {
        if(scales[scale][interval] != 0) {
            twoOctaveScale.unshift(-1 * scales[scale][interval]);
        }
    }
    scales[scale] = twoOctaveScale.concat(scales[scale]);
    scales[scale].push(12); // add the octave
}

// HTML Control Variables
/* List of controls used in the control panel.
 * Implemented in control-panel.ts.
 * htmlInput lines up with the ID of the control in HTML. */
const controls = {
    "volume" : {
        htmlInput: (<HTMLInputElement>document.getElementById("MasterVolume")),
        min: 0,
        max: 30
    },
    "lfoRange" : {
        htmlInput: (<HTMLInputElement>document.getElementById("LFORange")),
        min: 0,
        max: 15
    },
    "lfoDepth" : {
        htmlInput: (<HTMLInputElement>document.getElementById("LFODepth")),
        min: 0,
        max: 100
    },
    "lfoProbability" : {
        htmlInput: (<HTMLInputElement>document.getElementById("LFOProbability")),
        min: 0,
        max: 100
    },
    "baseNote" : {
        htmlInput: (<HTMLInputElement>document.getElementById("BaseNote")),
        min: 50,
        max: baseTone * 2
    },
    "softness" : {
        htmlInput: (<HTMLInputElement>document.getElementById("Softness")),
        min: 0,
        max: 20
    },
    "density" : {
        htmlInput: (<HTMLInputElement>document.getElementById("Density")),
        min: 15,
        max: maximumDensity
    },
    "mood": {
        htmlInput: (<HTMLInputElement>document.getElementById("Mood")),
        min: 0,
        max: scales.length - 1
    },
    // "Toggles"
    "autoplay": {
        htmlInput: (<HTMLInputElement>document.getElementById("Autoplay")),
        min: 0,
        max: 1
    },
    "chords": {
        htmlInput: (<HTMLInputElement>document.getElementById("Chords")),
        min: 0,
        max: 1
    },
    "arpeggios": {
        htmlInput: (<HTMLInputElement>document.getElementById("Arpeggios")),
        min: 0,
        max: 1
    },
    "sine": {
        htmlInput: (<HTMLInputElement>document.getElementById("Sine")),
        min: 0,
        max: 1
    },
    "square": {
        htmlInput: (<HTMLInputElement>document.getElementById("Square")),
        min: 0,
        max: 1
    },
    "triangle": {
        htmlInput: (<HTMLInputElement>document.getElementById("Triangle")),
        min: 0,
        max: 1
    },
    "saw": {
        htmlInput: (<HTMLInputElement>document.getElementById("Saw")),
        min: 0,
        max: 1
    }
};
const getCurrentLFORange = () => +controls.lfoRange.htmlInput.value;
const getCurrentLFODepth = () => +controls.lfoDepth.htmlInput.value;
const getCurrentLFOProbability = () => +controls.lfoProbability.htmlInput.value;
const getCurrentMasterVolume = () => +controls.volume.htmlInput.value;
const getCurrentBaseNote = () => +controls.baseNote.htmlInput.value;
const getCurrentSoftness = () => +controls.softness.htmlInput.value / 10;
const getCurrentDensity = () => +controls.density.htmlInput.value;
const getCurrentScale = () => scales[+controls.mood.htmlInput.value];
const isAutoplay = () => +controls.autoplay.htmlInput.value === 0 ? false : true;
const isChordal = () => +controls.chords.htmlInput.value === 0 ? false : true;
const isArpeggiated = () => +controls.arpeggios.htmlInput.value === 0 ? false : true;
const getActiveWaveTypes = () => {
    let activeWaveTypes = [];
    if(+controls.sine.htmlInput.value === 1) {
        activeWaveTypes.push("sine");
    }
    if(+controls.saw.htmlInput.value === 1) {
        activeWaveTypes.push("sawtooth");
    }
    if(+controls.triangle.htmlInput.value === 1) {
        activeWaveTypes.push("triangle");
    }
    if(+controls.square.htmlInput.value === 1) {
        activeWaveTypes.push("square");
    }
    return activeWaveTypes.length > 0 ? activeWaveTypes : ["triangle"]; // default is triangle wavess
};