/* using ECMAScript 6- only need this in this file because
 * I will load this file first in the HTML. */
'use strict';

// Immutable global variable, used to chain audio
const audioContext = new (window["AudioContext"] || window["webkitAudioContext"])();

// HTML Control Variables
// TypeScript needs the correct type so I'm casting to an HTMLInputElement
let currentLFORange = (<HTMLInputElement>document.getElementById("LFORange")).value;
let currentLFODepth = (<HTMLInputElement>document.getElementById("LFODepth")).value;
/* List of controls used in the control panel.
 * Implemented in control-panel.ts.
 * htmlName lines up with the ID of the control. */
const controls = {
    "volume" : {
        htmlName: "MasterVolume",
        min: 0,
        max: 100,
        variable: currentLFORange
    },
    "lfoRange" : {
        htmlName: "LFORange",
        min: 0,
        max: 50
    },
    "lfoDepth" : {
        htmlName: "LFODepth",
        min: 0,
        max: 100
    }
};

// used to keep track of circles which represent notes
let circles = [];

const waveTypes = [
    "sine",
    "sawtooth",
    "triangle",
    "square"
];

const baseTone = 280; // in Hz
const maximumFrequency = baseTone * 3;
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