/* using ECMAScript 6- only need this in this file because
 * I will load this file first in the HTML. */
'use strict';

const DEBUG:boolean = true; // used to control console.log statements

/* Immutable global variable, used to chain audio
 * "as any" will force an index signature so it's not implicit. */
const audioContext = new ((window as any)["AudioContext"] || (window as any)["webkitAudioContext"])();

// keeping track of autoplay & composer
let autoplayEventLoop: number;
let composerEventLoop: number;
// keeping track of the user's click length for note times
let noteTimingEventHandler: number;
let clickedNoteLength: number = 0;

// all possible wave types- used for LFO, otherwise use getActiveWaveTypes()
const lfoWaveTypes:string[] = [
    "sine",
    "triangle",
    "sawtooth",
    "square"
];

// used to keep track of circles which represent notes
let circles:HTMLSpanElement[] = [];
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
        max: 180
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
 * Contains many methods for operating and
 * dealing with Oscillators.
 */
class Oscillator {
    mainOsc: OscillatorNode;
    masterGainNode: GainNode;
    gainNodes: GainNode[] = [];
    masterFilterNode: BiquadFilterNode;
    filterNodes: BiquadFilterNode[] = [];
    reverbNode: ConvolverNode;
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
        this.reverbNode = audioContext.createConvolver();
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
        // set the reverb
        if(this.reverbNode.buffer) { // typescript doesn't like variables that may be null
            // Fill the buffer with white noise;
            // just random values between -1.0 and 1.0
            /*for (let channel = 0; channel < this.reverbNode.buffer.numberOfChannels; channel++) {
                // This gives us the actual array that contains the data
                let nowBuffering = this.reverbNode.buffer.getChannelData(channel);
                for (let i = 0; i < this.reverbNode.buffer.length; i++) {
                    // Math.random() is in [0; 1.0]
                    // audio needs to be in [-1.0; 1.0]
                    nowBuffering[i] = Math.random() * 2 - 1;
                }
            }*/
        }
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
                //this.release = 0.75;
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
        // hook up the LFO to master gain
        this.lfoNode.connect(this.lfoGain);
        this.lfoGain.connect(this.masterGainNode.gain); // experiment with hooking up LFO to other stuff
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
        this.masterFilterNode.connect(this.reverbNode);
        this.masterGainNode.connect(audioContext.destination);
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
            this.lfoGain.gain.setValueAtTime(0, audioContext.currentTime + this.delay);
            this.lfoGain.gain.linearRampToValueAtTime(getRelativeValue(gain, 100, 0, this.volume) / 100, audioContext.currentTime + this.delay + this.attack);
            this.lfoGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + this.delay + this.attack + this.decay + this.time + this.release);
            this.lfoNode.stop(audioContext.currentTime + this.delay + this.attack + this.decay + this.time + this.release);
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
            const adjustedCurrentMaxVolume = this.volume / 200;
            // Start necessary Oscillators
            this.mainOsc.start(audioContext.currentTime + this.delay);
            // Model the ADSR Envelope
            this.masterGainNode.gain.setValueAtTime(0, audioContext.currentTime + this.delay);
            // take "attack" + "delay" to get volume to max
            this.masterGainNode.gain.linearRampToValueAtTime(adjustedCurrentMaxVolume, audioContext.currentTime + this.delay + this.attack);
            // now "decay" the max volume down to the "sustain" level
            this.masterGainNode.gain.exponentialRampToValueAtTime(adjustedCurrentMaxVolume * this.sustain, audioContext.currentTime + this.delay + this.attack + this.decay);
            // and hold that until "time" + "release" are done
            this.masterGainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + this.delay + this.attack + this.decay + this.time + this.release);
            // Stop the oscillators & disconnect the master gain when we don't need them anymore
            this.mainOsc.stop(audioContext.currentTime + this.delay + this.attack  + this.decay +  this.time + this.release);
        }
    };
}