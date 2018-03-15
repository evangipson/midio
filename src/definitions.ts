/* using ECMAScript 6- only need this in this file because
 * I will load this file first in the HTML. */
'use strict';

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
const twelfthRootOfTwo = 1.05946309; // need this to calculate Hz based on interval & scale

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

let currentScale = scales.ambient; // will need this later for UI