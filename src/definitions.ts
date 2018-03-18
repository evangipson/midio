/* using ECMAScript 6- only need this in this file because
 * I will load this file first in the HTML. */
'use strict';

// Immutable global variable, used to chain audio
const audioContext = new (window["AudioContext"] || window["webkitAudioContext"])();

const baseTone = 280; // in Hz

const maximumDensity = 100;

// HTML Control Variables
/* List of controls used in the control panel.
 * Implemented in control-panel.ts.
 * htmlInput lines up with the ID of the control in HTML. */
const controls = {
    "volume" : {
        htmlInput: (<HTMLInputElement>document.getElementById("MasterVolume")),
        min: 0,
        max: 50
    },
    "lfoRange" : {
        htmlInput: (<HTMLInputElement>document.getElementById("LFORange")),
        min: 0,
        max: 30
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
        min: baseTone / 3,
        max: baseTone * 3
    },
    "softness" : {
        htmlInput: (<HTMLInputElement>document.getElementById("Softness")),
        min: 0,
        max: 3
    },
    "density" : {
        htmlInput: (<HTMLInputElement>document.getElementById("Density")),
        min: 0,
        max: maximumDensity
    }
};
const getCurrentLFORange = () => +controls.lfoRange.htmlInput.value;
const getCurrentLFODepth = () => +controls.lfoDepth.htmlInput.value;
const getCurrentLFOProbability = () => +controls.lfoProbability.htmlInput.value;
const getCurrentMasterVolume = () => +controls.volume.htmlInput.value;
const getCurrentBaseNote = () => +controls.baseNote.htmlInput.value;
const getCurrentSoftness = () => +controls.softness.htmlInput.value;
const getCurrentDensity = () => +controls.density.htmlInput.value;

// used to keep track of circles which represent notes
let circles = [];

const waveTypes = [
    "sine",
    "sawtooth",
    "triangle",
    "square"
];
const twelfthRootOfTwo = 1.05946309; // need this to calculate Hz based on interval & scale

// root tone included as 0, top octave note not included.
let scales = {
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
        2,
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
// Add negative intervals also
for(let scale in scales) {
    let twoOctaveScale = [];
    for(let interval in scales[scale]) {
        if(scales[scale][interval] != 0) {
            twoOctaveScale.unshift(-1 * scales[scale][interval]);
        }
    }
    scales[scale] = twoOctaveScale.concat(scales[scale]);
}
let currentScale = scales.ambient; // will need this later for UI