/* using ECMAScript 6- only need this in this file because
 * I will load this file first in the HTML. */
'use strict';

// Immutable global variable, used to chain audio
const audioContext = new (window["AudioContext"] || window["webkitAudioContext"])();

const baseTone = 280; // in Hz
const maximumDensity = 65;
// keeping track of autoplay & composer
let autoplayEventLoop;
let composerEventLoop;
// keeping track of the user's click length for note times
let noteTimingEventHandler;
let clickedNoteLength = 0;

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
let scales = [
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
        9
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
    ],
    // mixolydian
    [
        0,
        2,
        4,
        5,
        7,
        9,
        10
    ],
    // lydian
    [
        0,
        2,
        4,
        6,
        7,
        9,
        11
    ],
    // phrygian dominant
    [
        0,
        1,
        4,
        5,
        7,
        8,
        10
    ],
    // blues
    [
        0,
        3,
        5,
        6,
        7,
        10
    ],
    // altered scale
    [
        0,
        1,
        3,
        4,
        6,
        8,
        10
    ],
    // whole tone
    [
        0,
        2,
        4,
        6,
        8,
        10
    ],
    // hexatonic scale
    [
        0,
        3,
        4,
        7,
        8,
        11
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
// mix up the order of scales
for (let i = scales.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [scales[i], scales[j]] = [scales[j], scales[i]];
}
// Add negative intervals and top octave
for(let scale in scales) {
    let multiOctaveScale = new Set();
    for(let interval in scales[scale]) {
        multiOctaveScale.add(scales[scale][interval]); // add base tone
        multiOctaveScale.add(scales[scale][interval] + 12); // add an octave higher
        multiOctaveScale.add(-1 * scales[scale][interval]); // add same interval but negative
        multiOctaveScale.add(-1 * (scales[scale][interval] + 12)); // add negative octave interval
    }
    // add top and bottom 2 octave root
    multiOctaveScale.add(-24);
    multiOctaveScale.add(24);
    // sort our array numerically
    scales[scale] = Array.from(multiOctaveScale).sort((a, b) => {
        return a - b;
    });
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
    "evolve": {
        htmlInput: (<HTMLInputElement>document.getElementById("Evolve")),
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
    },
    "whiteNoise": {
        htmlInput: (<HTMLInputElement>document.getElementById("WhiteNoise")),
        min: 0,
        max: 1
    },
    "pinkNoise": {
        htmlInput: (<HTMLInputElement>document.getElementById("PinkNoise")),
        min: 0,
        max: 1
    },
    "brownNoise": {
        htmlInput: (<HTMLInputElement>document.getElementById("BrownNoise")),
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
const isEvolve = () => +controls.evolve.htmlInput.value === 0 ? false : true;
const isChordal = () => +controls.chords.htmlInput.value === 0 ? false : true;
const isArpeggiated = () => +controls.arpeggios.htmlInput.value === 0 ? false : true;
const getActiveWaveTypes = () => {
    let activeWaveTypes:string[] = [];
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
    if(+controls.whiteNoise.htmlInput.value === 1) {
        activeWaveTypes.push("whiteNoise");
    }
    if(+controls.pinkNoise.htmlInput.value === 1) {
        activeWaveTypes.push("pinkNoise");
    }
    if(+controls.brownNoise.htmlInput.value === 1) {
        activeWaveTypes.push("brownNoise");
    }
    return activeWaveTypes;
};