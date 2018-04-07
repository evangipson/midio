/* Define what a note is made up of
 * Note: Not in definitions because it's
 * only used in this file. */
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

// Pure Functions
/**
 * Will tell you the frequency of an interval in half
 * steps from the current base note. Used originally
 * for building melodies.
 */
const getFrequencyOfInterval = (interval: number) =>
    getCurrentBaseNote() * Math.pow(twelfthRootOfTwo, interval) - getCurrentBaseNote();

/**
 * Will generate a chord, returned as an array filled with
 * unique freqencies based on the currentScale. Needs a base
 * tone to ensure we aren't returning two of the same note.
 * @param tones how many notes you want in the chord
 */
const getChord = (baseTone: Note, tones = 3) => {
    let chordTones:number[] = [
        baseTone.frequency // we already have 1 tone in the chord
    ];
    let attemptedFrequency: number;
    for(var i = 1; i < tones; i++) {
        attemptedFrequency = getHarmonicNoteFrequency(getRandomArrayItem(getCurrentScale()));
        // If we have the tone already in the code or the interval is more than 4 whole steps away...
        while(chordTones.includes(attemptedFrequency) || Math.abs(baseTone.frequency - attemptedFrequency) > getFrequencyOfInterval(8)) {
            // get a new frequency and try again
            attemptedFrequency = getHarmonicNoteFrequency(getRandomArrayItem(getCurrentScale()));
        }
        chordTones.push(attemptedFrequency);
    }
    return chordTones;
};

/**
 * Will assemble an array of numbers that will
 * contain frequencies for a melody.
 * @param baseTone
 * @param tones 
 */
const getMelody = (baseTone: Note, tones = 3) => {
    let chordTones:number[] = [];
    let attemptedFrequency: number;
    let previousNote = baseTone;
    for(var i = 1; i < tones; i++) {
        attemptedFrequency = getHarmonicNoteFrequency(getRandomArrayItem(getCurrentScale()));
        // if the next frequency is the same as the previous or more than 6 whole steps...
        while(previousNote.frequency == attemptedFrequency || Math.abs(previousNote.frequency - attemptedFrequency) > getFrequencyOfInterval(12)) {
            // try to get a "closer" note instead so we don't have large interval steps
            attemptedFrequency = getHarmonicNoteFrequency(getRandomArrayItem(getCurrentScale()));
        }
        previousNote.frequency = attemptedFrequency;
        chordTones.push(attemptedFrequency);
    }
    return chordTones;
};

/**
 * Will generate a frequency based on a scale.
 * Relies on twelfthRootOfTwo. Will return the
 * frequency for the base tone, set by the pitch slider,
 * by default.
 * @param interval how far away from baseTone the note is
 */
const getHarmonicNoteFrequency = (interval = 0) =>
    getCurrentBaseNote() * Math.pow(twelfthRootOfTwo, interval);

/**
 * Will return a suitable value for seconds
 * until the next musical phrase.
 * To be called by generateSound().
 */
const getSecondsUntilNextPhrase = () => maybe(
    noteTimings[0], // whole note
    noteTimings[0] * 2 // 2 bars
);

/**
 * Will return, in seconds, how long a "short note"
 * should sound. Won't use whole or half notes.
 */
const getShortNoteDuration = () =>
    noteTimings[Math.floor(getRange(2, noteTimings.length - 1))];

/**
 * Will return, in seconds, how long a "melody note"
 * should sound. Won't use extremely long or short notes.
 */
const getMelodyNoteDuration = () =>
    noteTimings[Math.floor(getRange(2, noteTimings.length - 2))];


// Non-Pure Functions
/**
 * Will play the note passed in.
 * @param note Note interface containing multiple properties
 * @param event to determine where to draw the circles. default is null.
 */
function playAndShowNote(note: Note, event: CustomMouseEvent) {
    // handle creating an oscillator and starting & stopping it
    const osc = new Oscillator(note.attack, note.decay, note.sustain, note.release, note.delay, note.time, note.volume)
        .setProperties(note.type, note.frequency)
        .setInstrument(note.instrument)
        // +variable = ParseInt(variable); "+" is a unary operator
        .setLFO(
            getRange(getCurrentLFORate() * 0.6, getCurrentLFORate()),
            getCurrentLFODepth(),
            getRandomArrayItem(lfoWaveTypes)
        ) // randomize LFO
        .hookUpFilters()
        .play();
    if (DEBUG) console.info(note); 

    // draw those pretty circles on the canvas
    if(event.event) {
        drawNoteWithVolumeBasedOpacity(event, note.volume, note.delay); // volume is out of 100
    }
}

/**
 * Will search the shortTermMemory for a musical
 * phrase, and play that phrase, then maybe remove
 * that phrase from shortTermMemory.
 */
function searchMemoryForPhrase(event: MouseEvent) {
    if (DEBUG) console.info("searching short term memory for a phrase");
    if (DEBUG) console.info("========================================");
    let overrideX: number;
    // get a note array from 
    const memoryIndex = Math.round(getRange(0, shortTermMemory.length - 1));
    const rememberedPhrase = shortTermMemory[memoryIndex];
    rememberedPhrase.forEach((note) => {
        overrideX = setClickPositionFromNoteFrequency(note, event);
        playAndShowNote(note, {event, overrideX} as CustomMouseEvent);
    });
    if(maybe(true, false, 66)) {
        if (DEBUG) console.info("COMPOSER removing the phrase from memory");
        shortTermMemory.splice(memoryIndex, 1);
        if (DEBUG) console.info(shortTermMemory);
    }
}

/**
 * Will attempt to remember a phrase, as long as
 * shortTermMemory isn't full.
 * @param phrase 
 */
function attemptToRememberPhrase(phrase: Note[]) {
    if(shortTermMemory.length < 5) {
        if (DEBUG) console.info("COMPOSER remembering the last phrase");
        shortTermMemory.push(phrase);
        if (DEBUG) console.info(shortTermMemory);
    }
}

/**
 * Will return an object containing properties
 * defining a "normal" note.
 */
function assembleNote(): Note {
    return {
        type: getRandomArrayItem(getActiveWaveTypes()),
        frequency: getHarmonicNoteFrequency(getRandomArrayItem(getCurrentScale())),
        time: maybe(getMelodyNoteDuration(), getShortNoteDuration()),
        volume: getCurrentMasterVolume(),
        attack: getRange(getCurrentSoftness() * 0.5, getCurrentSoftness() * 1.2),
        decay: getRange(0.1, 0.5),
        sustain: getRange(0.35, 0.8),
        release: getRange(1.2, 2.5),
        delay: 0,
        instrument: maybe("piano")
    };
}

/**
 * Will build and play a chord given a Note and a MouseEvent.
 * @param note 
 * @param event 
 */
function buildChordFromNote(note: Note, event: MouseEvent) {
    if (DEBUG) console.info("creating a chord");
    let chordNote: Note;
    let overrideX: number;
    let rememberedPhrase: Note[] = [];
    /* Our chord should have at last 2 tones, and at maximum 4 tones, unless
     * our scale doesn't have 4 tones, then just use as many as possible. */
    const additionalChordTones = Math.floor(getRange(2, shortestScaleLength > 4 ? 4 : shortestScaleLength));
    if (DEBUG) console.info("the chord will be " + additionalChordTones + " notes");
    if (DEBUG) console.info("========================================");
    // then for every other frequency in our chord...
    getChord(note, additionalChordTones).forEach((chordTone) => {
        chordNote = note;
        chordNote.frequency = chordTone;
        // handle x & y seperately for chord notes, because
        // the x-axis will need to be calculated
        overrideX = setClickPositionFromNoteFrequency(chordNote, event);
        rememberedPhrase.push({...chordNote}); // push a new copy of chordNote so it doesn't get overwritten
        playAndShowNote(chordNote, {event, overrideX} as CustomMouseEvent);
    });
    attemptToRememberPhrase(rememberedPhrase);
}

/**
 * Will build and play an arpeggio given a Note and a MouseEvent.
 * @param note 
 * @param event 
 */
function buildArpeggioFromNote(note: Note, event: MouseEvent) {
    if (DEBUG) console.info("creating an arpeggio");
    let chordNote: Note;
    let overrideX: number;
    /* Our arpeggio should have at last 2 tones, and at maximum 5 tones, unless
     * our scale doesn't have 5 tones, then just use as many as possible. */
    const additionalChordTones = Math.floor(getRange(2, shortestScaleLength > 5 ? 5 : shortestScaleLength));
    if (DEBUG) console.info("the arpeggio will be " + additionalChordTones + " notes");
    if (DEBUG) console.info("========================================");
    note.time = getShortNoteDuration();
    let previousDelay = note.time;
    // for every frequency in our arpeggio...
    getChord(note, additionalChordTones).forEach((chordTone) => {
        chordNote = note;
        chordNote.frequency = chordTone;
        // compound delay
        previousDelay += previousDelay;
        chordNote.delay = previousDelay;
        // handle x & y seperately for chord notes, because
        // the x-axis will need to be calculated
        overrideX = setClickPositionFromNoteFrequency(chordNote, event);
        playAndShowNote(chordNote, {event, overrideX} as CustomMouseEvent);
    });
}

/**
 * Will build and play a melody given a Note and a MouseEvent.
 * @param note 
 * @param event 
 */
function buildMelodyFromNote(note: Note, event: MouseEvent) {
    if (DEBUG) console.info("creating a melody");
    let chordNote: Note;
    let overrideX: number;
    let rememberedPhrase: Note[] = [note];
    /* Our melody should have at last 4 tones, and at maximum 8 tones, unless
     * our scale doesn't have 8 tones, then just use as many as possible. */
    const additionalMelodyTones = Math.floor(getRange(4, shortestScaleLength > 8 ? 8 : shortestScaleLength));
    if (DEBUG) console.info("the melody will be " + additionalMelodyTones + " notes");
    if (DEBUG) console.info("========================================");
    let currentNoteDelay = note.time;
    // play the initial tone first...
    playAndShowNote(note, {event} as CustomMouseEvent);
    // for every frequency in our melody...
    getMelody(note, additionalMelodyTones).forEach((chordTone) => {
        // get a new note length
        let currentNoteLength = getMelodyNoteDuration();
        // copy the "base note"
        chordNote = {...note}; // push a new copy of chordNote so it doesn't get overwritten
        // use our new note length
        chordNote.time = currentNoteLength;
        // set the frequency to what getMelody() advises
        chordNote.frequency = chordTone;
        // apply then compound the delay to ensure space between notes
        chordNote.delay = currentNoteDelay;
        currentNoteDelay += currentNoteLength;
        // handle x & y seperately for chord notes, because
        // the x-axis will need to be calculated
        overrideX = setClickPositionFromNoteFrequency(chordNote, event);
        rememberedPhrase.push(chordNote);
        playAndShowNote(chordNote, {event, overrideX} as CustomMouseEvent);
    });
    attemptToRememberPhrase(rememberedPhrase);
}

/**
 * Responsible for generating a sound. If passed an event,
 * this function will use that click data, and will not try
 * and continually generate a new tone some time after
 * (if autoplay is enabled).
 * Note: Can generate either a tone, echo tone, or chord.
 * @param event
 */
function generateSound(event:MouseEvent = new MouseEvent("", undefined)) {
    let note = assembleNote();
    let userNote = false; // we'll assume autoplay is firing this note unless told otherwise
    // If we've called this function from the autoplay loop
    if(!event.clientX) {
        if (DEBUG) console.info("COMPOSER composing...");
        event = getFakeMouseClick();
        /* in an amount of time, call itself again, because
         * we can be sure this is a generated note due to the absence
         * of an event. */
        const msUntilNextNote = getSecondsUntilNextPhrase() * 1000; // in ms
        autoplayEventLoop = window.setTimeout(function() {
            generateSound();
        }, msUntilNextNote);
    }
    // If we've called this function from a user click
    else {
        userNote = true;
        if (DEBUG) console.info("user input a note.");
        note.time = clickedNoteLength;
    }
    // note frequency is driven by our (maybe fake) event
    note.frequency = setNoteFrequencyFromClick(note, event);
    // If we autoplayed the note, create a musical phrase of some kind
    if(!userNote) {
        // large chance to pull stuff from memory if we can
        if(shortTermMemory.length > 0 && maybe(true, false, 75)) {
            searchMemoryForPhrase(event);
        }
        // if we don't have any memory, small chance to generate a chord
        else if(maybe(true, false, 33)) {
            // if we are autoplaying a note, if it's a chord, draw it out
            if(!userNote) {
                note.time = maybe(noteTimings[0], maybe(noteTimings[1], noteTimings[0] * 2));
            }
            // soften up the edges of the chord sometimes
            if(maybe(true)) {
                note.attack = getRange((controls.softness.max/10) * 0.75, (controls.softness.max/10));
                note.release = getRange((controls.softness.max/10) * 0.75, (controls.softness.max/10) * 1.25);
            }
            buildChordFromNote(note, event);
        }
        // we will rarely generate arpeggios
        else if(maybe(true, false, 15)) {
            buildArpeggioFromNote(note, event);
        }
        // default case, large chance to generate a melody
        else {
            buildMelodyFromNote(note, event);
        }
    }
    // If the user input a note, we'll just play the single tone
    else {
        playAndShowNote(note, {event} as CustomMouseEvent);
    }
}