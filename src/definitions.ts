/* using ECMAScript 6- only need this in this file because
 * I will load this file first in the HTML. */
'use strict';

const DEBUG = true; // used to control console.log statements

/* Immutable global variable, used to chain audio
 * "as any" will force an index signature so it's not implicit. */
const audioContext = new ((window as any)["AudioContext"] || (window as any)["webkitAudioContext"])();

// keeping track of autoplay & composer
let autoplayEventLoop: number;
let composerEventLoop: number;
// keeping track of the user's click length for note times
let noteTimingEventHandler: number;
let clickedNoteLength = 0;

// all possible wave types- used for LFO, otherwise use getActiveWaveTypes()
const lfoWaveTypes = [
    "sine",
    "triangle",
    "sawtooth",
    "square"
];

// used to keep track of circles which represent notes
let circles:HTMLSpanElement[] = [];

const twelfthRootOfTwo = Math.pow(2, 1/12); // need this to calculate Hz based on interval & scale

/* array representing intervals from the root tone.
 * root tone included as 0.
 * NOTE: must line up with number of palettes in css/variables.css!
 * NOTE: all scales must have at least 2 tones in them to create chords and arpeggios. */
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
    // blues
    [
        0,
        3,
        5,
        6,
        7,
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
// Some information for chord & arpeggio building
let shortestScaleLength = 0;
for(let scale in scales) {
    if(scales[scale].length > shortestScaleLength) {
        shortestScaleLength = scales[scale].length;
    }
}

// HTML Control Variables
/**
 * Our interfaces used to instantiate HTML controls.
 */
interface HTMLControl {
    htmlInput: HTMLInputElement,
    min: number,
    max: number
};
interface HTMLControlList {
    [key: string]: HTMLControl
};
interface CustomMouseEvent extends MouseEvent {
    event: MouseEvent,
    overrideX: number
};
/* List of controls used in the control panel.
 * Implemented in control-panel.ts.
 * htmlInput lines up with the ID of the control in HTML. */
const controls:HTMLControlList = {
    "volume" : {
        htmlInput: (<HTMLInputElement>document.getElementById("MasterVolume")),
        min: 0,
        max: 100
    },
    "lfoRate" : {
        htmlInput: (<HTMLInputElement>document.getElementById("LFORate")),
        min: 0,
        max: 13
    },
    "lfoDepth" : {
        htmlInput: (<HTMLInputElement>document.getElementById("LFODepth")),
        min: 0,
        max: 20
    },
    "baseNote" : {
        htmlInput: (<HTMLInputElement>document.getElementById("BaseNote")),
        min: 220,
        max: 350
    },
    "softness" : {
        htmlInput: (<HTMLInputElement>document.getElementById("Softness")),
        min: .5,
        max: 40
    },
    "mood": {
        htmlInput: (<HTMLInputElement>document.getElementById("Mood")),
        min: 0,
        max: scales.length - 1
    },
    "tempo": {
        htmlInput: (<HTMLInputElement>document.getElementById("Tempo")),
        min: 60,
        max: 110
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
    "sawtooth": {
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
const getCurrentLFORate = () => +controls.lfoRate.htmlInput.value;
const getCurrentLFODepth = () => +controls.lfoDepth.htmlInput.value;
const getCurrentMasterVolume = () => +controls.volume.htmlInput.value;
const getCurrentBaseNote = () => +controls.baseNote.htmlInput.value;
const getCurrentSoftness = () => +controls.softness.htmlInput.value / 10;
const getCurrentTempo = () => +controls.tempo.htmlInput.value;
const getCurrentScale = () => scales[+controls.mood.htmlInput.value];
const isAutoplay = () => +controls.autoplay.htmlInput.value === 0 ? false : true;
const isEvolve = () => +controls.evolve.htmlInput.value === 0 ? false : true;
const getActiveWaveTypes = () => {
    let activeWaveTypes:string[] = [];
    if(+controls.sine.htmlInput.value === 1) {
        activeWaveTypes.push("sine");
    }
    if(+controls.sawtooth.htmlInput.value === 1) {
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

/**
 * Responsible for setting all of the timings for
 * the common note lengths. Should be invoked from
 * the control panel, when tempo is adjusted.
 */
let noteTimings = [
    240 / getCurrentTempo(), // whole note
    120 / getCurrentTempo(), // half note
    60 / getCurrentTempo(), // quarter note
    30 / getCurrentTempo(), // eighth note
    15 / getCurrentTempo(), // sixteenth note
];
function setNoteTimings() {
    noteTimings[0] = 240 / getCurrentTempo(); // whole note
    noteTimings[1] = 120 / getCurrentTempo(); // half note
    noteTimings[2] = 60 / getCurrentTempo(); // quarter note
    noteTimings[3] = 30 / getCurrentTempo(); // eighth note
    //noteTimings[4] = 15 / getCurrentTempo(); // sixteenth note
    if (DEBUG) console.info(noteTimings);
};