/* using ECMAScript 6- only need this in this file because
 * I will load this file first in the HTML. */
'use strict';

const DEBUG:boolean = true; // used to control console.log statements
const ACTIVE_NOTES:number = 8; // how many notes on screen at any given time

/* Immutable global variable, used to chain audio
 * "as any" will force an index signature so it's not implicit. */
let audioContext = new ((window as any)["AudioContext"] || (window as any)["webkitAudioContext"])();

// keeping track of autoplay & composer
let autoplayEventLoop: number;
let composerEventLoop: number;
// keeping track of the user's click length for note times
let noteTimingEventHandler: number;
let clickedNoteLength: number = 0;

// all possible wave types- used for LFO, otherwise use getActiveWaveTypes()
const lfoWaveTypes:string[] = [
    "triangle",
    // "sine",
    // "square",
    // "sawtooth",
];

// only grab the visualizer once so we don't query the document a lot
let visualizerElement = document.getElementById("Visualizer");

// used to keep track of spans which represent notes
let visualNotes:HTMLSpanElement[] = [];
// pre-fill our visualizer with spans to prevent memory leaks
let spanElement: HTMLSpanElement;
for(let i = 0; i < ACTIVE_NOTES; i++) {
    spanElement = document.createElement("span");
    spanElement.classList.add("note-circle");
    visualNotes.push(spanElement);
    if(visualizerElement) {
        visualizerElement.appendChild(visualNotes[i]);
    }
}
// keep track of which note we can use
let noteAnimationIndex = 0;
// keeps track of the events used to active & remove notes from the visualizer
let circleEventLoop:number;
let circleActiveEventLoop:number;
// used to keep track of recently played melodies and chords
let shortTermMemory:Note[][] = [];
const twelfthRootOfTwo:number = Math.pow(2, 1/12); // need this to calculate Hz based on interval & scale

/* array representing intervals from the root tone.
 * root tone included as 0.
 * NOTE: must line up with number of palettes in css/variables.css!
 * NOTE: all scales must have at least 2 tones in them to create chords and arpeggios. */
let scales:number[][] = [
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
let shortestScaleLength: number = 0;
for(let scale in scales) {
    if(scales[scale].length > shortestScaleLength) {
        shortestScaleLength = scales[scale].length;
    }
}

// Create only one reverb node for performance reasons
const reverbNode: ConvolverNode = audioContext.createConvolver();
reverbNode.connect(audioContext.destination);
const reverbLength = 8; // how long the reverb is, in seconds

// HTML Control Variables
/**
 * Our interfaces used to instantiate HTML controls.
 */
interface HTMLControl {
    htmlInput: HTMLInputElement,
    min: number,
    max: number
}
interface HTMLControlList {
    [key: string]: HTMLControl
}
interface CustomMouseEvent extends MouseEvent {
    event: MouseEvent,
    overrideX: number
}
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
        min: -10,
        max: 10
    },
    "lfoDepth" : {
        htmlInput: (<HTMLInputElement>document.getElementById("LFODepth")),
        min: -15,
        max: 15
    },
    "baseNote" : {
        htmlInput: (<HTMLInputElement>document.getElementById("BaseNote")),
        min: 220,
        max: 350
    },
    "softness" : {
        htmlInput: (<HTMLInputElement>document.getElementById("Softness")),
        min: 3,
        max: 30
    },
    "mood": {
        htmlInput: (<HTMLInputElement>document.getElementById("Mood")),
        min: 0,
        max: scales.length - 1
    },
    "tempo": {
        htmlInput: (<HTMLInputElement>document.getElementById("Tempo")),
        min: 20,
        max: 100
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
// used in addInputEventListeners() in control-panel.ts
const allWaveRanges = [
    controls.triangle.htmlInput,
    controls.sine.htmlInput,
    controls.square.htmlInput,
    controls.sawtooth.htmlInput,
    controls.whiteNoise.htmlInput,
    controls.pinkNoise.htmlInput,
    controls.brownNoise.htmlInput
];

/**
 * Responsible for setting all of the timings for
 * the common note lengths. Should be invoked from
 * the control panel, when tempo is adjusted.
 */
let noteTimings: number[] = [
    240 / getCurrentTempo(), // whole note
    120 / getCurrentTempo(), // half note
    90 / getCurrentTempo(), // dotted quarter note
    60 / getCurrentTempo(), // quarter note
    45 / getCurrentTempo(), // dotted eighth note
    30 / getCurrentTempo(), // eighth note
    22.5 / getCurrentTempo(), // dotted sixtenth note
    15 / getCurrentTempo(), // sixteenth note
];
function setNoteTimings() {
    noteTimings[0] = 240 / getCurrentTempo(); // whole note
    noteTimings[1] = 120 / getCurrentTempo(); // half note
    noteTimings[2] = 90 / getCurrentTempo(); // dotted quarter note
    noteTimings[3] = 60 / getCurrentTempo(); // quarter note
    noteTimings[4] = 45 / getCurrentTempo(); // dotted eighth note
    noteTimings[5] = 30 / getCurrentTempo(); // eighth note
    noteTimings[6] = 22.5 / getCurrentTempo(); // dotted sixteenth note
    noteTimings[7] = 15 / getCurrentTempo(); // sixteenth note
}

// Define what a note is made up of
interface Note {
    type: string;
    frequency: number; // in Hz
    time: number; // in seconds
    volume: number; // from 0 - 100
    attack: number; // in seconds
    sustain: number; // from 0 - 1
    decay: number; // from 0 - 1
    release: number; // in seconds
    delay: number;
    instrument?: string; // optional, if used will set an instrument
}

/**
 * Will be used as an object containing properties
 * defining a "normal" note. Used in generateSound().
 */
let normalNote:Note = {
    type: "sine",
    frequency: getCurrentBaseNote(),
    time: 0,
    volume: getCurrentMasterVolume(),
    attack: 0,
    decay: 0,
    sustain: 1,
    //release: getRange(1.2, 2.5),
    release: 0,
    delay: 0,
    instrument: maybe("piano")
};

/**
 * Contains many methods for operating and
 * dealing with Oscillators.
 */
class Oscillator {
    mainOsc: OscillatorNode;
    masterGainNode: GainNode;
    gainNodes: GainNode[] = [];
    masterFilterNode: BiquadFilterNode;
    filterNodes: BiquadFilterNode[] = [];
    attack: number; // in seconds
    decay: number; // from 0 - 1
    sustain: number; // from 0 - 1
    release: number; // in seconds
    delay: number; // in seconds
    time: number; // in seconds
    volume: number; // out of 100
    lfoNode: OscillatorNode;
    lfoGain: GainNode; // how loud the LFO will be
    /**
     * Will create an oscillator given ADSR values.
     * @param attack how long it takes the note to fade in, in seconds.
     * @param decay how long it takes the note to get to the sustain volume, in seconds.
     * @param sustain how loud the note is while the key is pressed, in seconds.
     * @param release how long the note takes to fade out complete after key is released, in seconds.
     * @param delay how long to wait before playing the note, in seconds.
     * @param time how long to play the note, in seconds. 
     * @param volume how loud to make the note, out of 100.
     */
    constructor(attack: number, decay: number, sustain: number, release: number, delay: number, time: number, volume: number) {
        this.mainOsc = audioContext.createOscillator();
        this.masterGainNode = audioContext.createGain();
        this.lfoNode = audioContext.createOscillator();
        this.lfoGain = audioContext.createGain();
        this.masterFilterNode = audioContext.createBiquadFilter();
        this.attack = attack;
        this.decay = decay;
        this.sustain = sustain;
        this.release = release;
        this.time = time;
        this.delay = delay;
        this.volume = volume;
    };
    /**
     * Sets the mainOsc's type and frequency.
     * Relies on audioContext.
     * @param type
     * @param frequency in Hz
     */
    setProperties(type: string, frequency: number) {
        // don't play any super high frequencies ever by using a lowpass filter
        this.filterNodes.push(audioContext.createBiquadFilter());
        this.filterNodes[0].type = "lowpass";
        this.filterNodes[0].frequency.setValueAtTime(4000, audioContext.currentTime + this.delay);
        if(type === "whiteNoise" || type === "pinkNoise" || type === "brownNoise") {
            let whiteNoise = audioContext.createBufferSource();
            let buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
            let data = buffer.getChannelData(0);
            for (var i = 0; i < audioContext.sampleRate; i++) {
                data[i] = Math.random();
            }
            whiteNoise.buffer = buffer;
            whiteNoise.loop = true;
            if(type === "pinkNoise") {
                this.filterNodes[0].frequency.setValueAtTime(1000, audioContext.currentTime + this.delay);
            }
            else if(type === "brownNoise") {
                this.filterNodes[0].frequency.setValueAtTime(650, audioContext.currentTime + this.delay);
            }
            this.mainOsc = whiteNoise;
        }
        else {
            this.mainOsc.type = <OscillatorType>type;
            this.mainOsc.frequency.setValueAtTime(frequency, audioContext.currentTime);
        }
        return this; // allow chaining
    };
    /**
     * Sets the instrument. Should happen after
     * setting properties, because the filters applied
     * in this function are more important.
     * @param instrument
     */
    setInstrument(instrument?: string) {
        switch(instrument) {
            case "choir":
                // create two more biquad filter nodes
                this.filterNodes.push(audioContext.createBiquadFilter());
                this.filterNodes.push(audioContext.createBiquadFilter());
                for(let filterNode in this.filterNodes) {
                    this.filterNodes[filterNode].type = "bandpass";
                }
                this.filterNodes[0].frequency.setValueAtTime(207, audioContext.currentTime + this.delay);
                this.filterNodes[0].gain.setValueAtTime(100, audioContext.currentTime + this.delay);
                this.filterNodes[0].Q.setValueAtTime(5, audioContext.currentTime + this.delay);
                this.filterNodes[1].frequency.setValueAtTime(2300, audioContext.currentTime + this.delay);
                this.filterNodes[1].gain.setValueAtTime(75, audioContext.currentTime + this.delay);
                this.filterNodes[1].Q.setValueAtTime(20, audioContext.currentTime + this.delay);
                this.filterNodes[2].frequency.setValueAtTime(3000, audioContext.currentTime + this.delay);
                this.filterNodes[2].gain.setValueAtTime(91, audioContext.currentTime + this.delay);
                this.filterNodes[2].Q.setValueAtTime(50, audioContext.currentTime + this.delay);
                break;
            case "piano":
                // create a lowpass filter for a cool sounding piano
                this.filterNodes.push(audioContext.createBiquadFilter());
                this.filterNodes[1].type = "lowpass";
                this.filterNodes[1].frequency.setValueAtTime(1000, audioContext.currentTime + this.delay);
                this.filterNodes[1].gain.setValueAtTime(100, audioContext.currentTime + this.delay);
                this.filterNodes[1].Q.setValueAtTime(10, audioContext.currentTime + this.delay);
                // adjust our ADSR envelope
                this.attack = 0.1;
                this.decay = 0.5;
                this.sustain = 0.1;
                this.release = 0.75;
                break;
            default:
                break;
        }
        return this; // allow chaining
    }
    /**
     * Connects the LFO and main oscillator to the
     * gainNode, then connects the gainNode to the
     * "speaker" (or audioContext.destination).
     */
    hookUpFilters() {
        // hook up the LFO to master gain if we don't have a noise wave
        if(this.mainOsc.frequency != undefined) {
            this.lfoNode.connect(this.mainOsc.frequency); // experiment with hooking up LFO to other stuff
        }
        this.lfoNode.connect(this.lfoGain); // experiment with hooking up LFO to other stuff
        this.lfoGain.connect(this.masterGainNode.gain);
        // for every biquad node we have (in case of formant filters)
        for(let filterNode in this.filterNodes) {
            // connect it to the master filter
            this.masterFilterNode.connect(this.filterNodes[filterNode]);
            // make a new gain node
            this.gainNodes[filterNode] = audioContext.createGain();
            // add it to our gainNodes array
            this.gainNodes.push(this.gainNodes[filterNode]);
            // hook it up to it's own gain node
            this.filterNodes[filterNode].connect(this.gainNodes[filterNode]);
            // finally, hook the gain node up to the master gain node
            this.gainNodes[filterNode].connect(this.masterGainNode);
        }
        this.mainOsc.connect(this.masterFilterNode);
        this.masterGainNode.connect(reverbNode);
        return this; // allow chaining
    };
    /**
     * Sets the LFO's frequency, gain, and type.
     * @param frequency how fast the LFO modulates
     * @param gain out of 100. How strong the LFO
     * will sound.
     * @param type wave shape for the LFO
     */
    setLFO(frequency: number = 5, gain: number, type: string) {
        this.lfoNode.type = <OscillatorType>type;
        if(frequency && gain) {
            this.lfoNode.start(audioContext.currentTime + this.delay);
            this.lfoNode.frequency.setValueAtTime(frequency, audioContext.currentTime);
            // don't allow the gain of the LFO to surpass the current master volume
            this.lfoGain.gain.linearRampToValueAtTime(getCurrentLFODepth() / 100, audioContext.currentTime);
            this.lfoGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + this.delay + this.attack + this.decay + this.time + this.release + reverbLength);
            this.lfoNode.stop(audioContext.currentTime + this.delay + this.attack + this.decay + this.time + this.release + reverbLength);
        }
        return this; // allow chaining
    };
    /**
     * Starts the mainOsc, then stops it in the
     * time provided, in seconds.
     * Relies on audioContext.
     */
    play() {
        if(this.volume > 0) {
            const adjustedCurrentMaxVolume = this.volume * 0.005;
            // Start necessary Oscillators
            this.mainOsc.start(audioContext.currentTime + this.delay);
            // Model the ADSR Envelope
            this.masterGainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.01);
            // take "attack" + "delay" to get volume to max
            this.masterGainNode.gain.linearRampToValueAtTime(adjustedCurrentMaxVolume, audioContext.currentTime + this.delay + this.attack);
            // now "decay" the max volume down to the "sustain" level
            this.masterGainNode.gain.exponentialRampToValueAtTime(adjustedCurrentMaxVolume * this.sustain, audioContext.currentTime + this.delay + this.attack + this.decay);
            // and hold that until "time" + "release" are done
            this.masterGainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + this.delay + this.attack + this.decay + this.time + this.release);
        }
        // garbage collect? TODO: make sure this does something
        this.mainOsc.stop(audioContext.currentTime + this.delay + this.attack + this.decay + this.time + this.release + reverbLength);
    };
}