/* Define what a note is made up of
 * Note: Not in definitions because it's
 * only used in this file. */
interface Note {
    type: string;
    frequency: number; // in Hz
    time: number; // in seconds
    volume: number; // from 0 - 100
    attack: number; // in seconds
    release: number; // in seconds
    delay: number;
}

/**
 * Contains many methods for operating and
 * dealing with Oscillators.
 */
class Oscillator {
    mainOsc: OscillatorNode;
    gainNode: GainNode;
    lfoNode: OscillatorNode;
    lfoGain: GainNode; // how loud the LFO will be
    biquadNode: BiquadFilterNode;
    attack: number; // in seconds
    delay: number; // in seconds
    time: number; // in seconds
    release: number; // in seconds
    volume: number; // out of 100
    /**
     * Will create an oscillator given ADSR values.
     * @param attack how long it takes the note to fade in, in seconds.
     * @param delay how long to wait before playing the note, in seconds.
     * @param time how long to play the note, in seconds. 
     * @param release how long to let the note fade out, in seconds.
     * @param volume how loud to make the note, out of 100.
     */
    constructor(attack: number, delay: number, time: number, release: number, volume: number) {
        this.mainOsc = audioContext.createOscillator();
        this.gainNode = audioContext.createGain();
        this.lfoNode = audioContext.createOscillator();
        this.lfoGain = audioContext.createGain();
        this.biquadNode = audioContext.createBiquadFilter();
        this.attack = attack;
        this.delay = delay;
        this.time = time;
        this.release = release;
        this.volume = volume;
    };
    /**
     * Sets the mainOsc's type and frequency.
     * Relies on audioContext.
     * @param {String} type
     * @param {Number} frequency in Hz
     */
    setProperties(type: string, frequency: number) {
        // don't play any super high frequencies ever
        this.biquadNode.type = "lowpass";
        this.biquadNode.frequency.setValueAtTime(2000, audioContext.currentTime + this.delay);
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
                this.biquadNode.frequency.setValueAtTime(1000, audioContext.currentTime + this.delay);
            }
            else if(type === "brownNoise") {
                this.biquadNode.frequency.setValueAtTime(650, audioContext.currentTime + this.delay);
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
     * Connects the LFO and main oscillator to the
     * gainNode, then connects the gainNode to the
     * "speaker" (or audioContext.destination).
     */
    hookUpFilters() {
        this.lfoNode.connect(this.lfoGain);
        this.lfoGain.connect(this.gainNode.gain); // experiment with hooking up LFO to other stuff
        this.mainOsc.connect(this.biquadNode);
        this.biquadNode.connect(this.gainNode);
        this.gainNode.connect(audioContext.destination);
        return this; // allow chaining
    };
    /**
     * Sets the LFO's frequency, gain, and type.
     * @param {Number} frequency how fast the LFO modulates
     * @param {Number} gain out of 100. How strong the LFO
     * will sound.
     * @param {String} type wave shape for the LFO
     */
    setLFO(frequency: number = 5, gain: number, type: string) {
        this.lfoNode.type = <OscillatorType>type;
        if(frequency && gain) {
            this.lfoNode.start(audioContext.currentTime + this.delay);
            this.lfoNode.frequency.setValueAtTime(frequency, audioContext.currentTime);
            // don't allow the gain of the LFO to surpass the current master volume
            this.lfoGain.gain.setValueAtTime(0, audioContext.currentTime + this.delay);
            this.lfoGain.gain.linearRampToValueAtTime(getRelativeValue(gain, 100, 0, this.volume) / 100, audioContext.currentTime + this.delay + this.attack);
            this.lfoGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + this.delay + this.attack + this.release + this.time);
            this.lfoNode.stop(audioContext.currentTime + this.delay + this.attack + this.release + this.time);
        }
        return this; // allow chaining
    };
    /**
     * Starts the mainOsc, then stops it in the
     * time provided, in seconds.
     * Relies on audioContext.
     */
    play() {
        // Start necessary Oscillators
        this.mainOsc.start(audioContext.currentTime + this.delay);
        // Do ADSR envelope
        this.gainNode.gain.setValueAtTime(0, audioContext.currentTime + this.delay);
        this.gainNode.gain.linearRampToValueAtTime(this.volume / 200, audioContext.currentTime + this.delay + this.attack);
        this.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + this.delay + this.attack + this.time + this.release);
        // Stop the oscillators when we don't need them anymore
        this.mainOsc.stop(audioContext.currentTime + this.delay + this.attack + this.release + this.time);
    };
}

// Pure Functions
/**
 * Will return an interval that isn't present in
 * the chordIntervals passed in, to build a chord.
 */
const getUniqueChordNote = (chordIntervals: number[]) => {
    let attemptedInterval = getRandomArrayItem(getCurrentScale());
    while(chordIntervals.includes(attemptedInterval)) {
        attemptedInterval = getRandomArrayItem(getCurrentScale());
    }
    return attemptedInterval;
};

/**
 * Will generate a chord, returned as an array filled with
 * unique freqencies based on the currentScale.
 * @param {Number} tones how many notes you want in the chord
 */
const getChord = (tones = 3) => {
    let chordTones:number[] = [];
    for(var i = 0; i < tones; i++) {
        chordTones.push(getHarmonicNoteFrequency(getUniqueChordNote(chordTones)));
    }
    return chordTones;
};

/**
 * Will generate a frequency based on a scale.
 * Relies on baseTone and twelfthRootOfTwo. Will return
 * the frequency for the base tone, set by the pitch slider,
 * by default.
 * @param {Number} interval how far away from baseTone the note is
 */
const getHarmonicNoteFrequency = (interval = 0) =>
    getCurrentBaseNote() * Math.pow(twelfthRootOfTwo, interval);

/**
 * Will return a suitable value for seconds
 * until the next note. To be called by generateSound().
 */
const getSecondsUntilNextNote = () => getRelativeValue(
    controls.density.max - getCurrentDensity(), // a higher density means LESS time between notes
    controls.density.max,
    2,
    8
);

/**
 * Will return, in seconds, how long to delay until
 * the next arpeggio note. Based on density.
 */
const timeUntilNextArpeggioNote = () => getRelativeValue(
    controls.density.max - getCurrentDensity(), // a higher density means LESS time between notes
    controls.density.max,
    getRange(.33, 1),
    getRange(1, 3)
);

// Non-Pure Functions
/**
 * Will play the note passed in.
 * @param {Note} note Note interface containing multiple properties
 * @param {HTMLEvent} event to determine where to draw the circles. default is null.
 */
function playAndShowNote(note: Note, event: CustomMouseEvent) {
    // handle creating an oscillator and starting & stopping it
    const osc = new Oscillator(note.attack, note.delay, note.time, note.release, note.volume)
        .setProperties(note.type, note.frequency)
        // +variable = ParseInt(variable); "+" is a unary operator
        .setLFO(
            getRange(getCurrentLFORate() * 0.6, getCurrentLFORate()),
            getCurrentLFODepth(),
            getRandomArrayItem(lfoWaveTypes)
        ) // randomize LFO
        .hookUpFilters()
        .play();

    // draw those pretty circles on the canvas
    if(event.event) {
        drawNoteWithVolumeBasedOpacity(event, note.volume, note.delay); // volume is out of 100
    }
}

/**
 * Will return a random note duration, in seconds.
 * Note: Isn't pure because it's random, and has no inputs.
 */
function getRandomNoteDuration() {
    return Math.random() + 0.25;
}

/**
 * Will return an object containing properties
 * defining a "pad", or long, usually background note.
 */
function assemblePadNote(): Note {
    return {
        type: getRandomArrayItem(getActiveWaveTypes()),
        frequency: getHarmonicNoteFrequency(getRandomArrayItem(getCurrentScale())),
        time: getRange(1, 5), // in seconds
        volume: getCurrentMasterVolume(),
        // pads have higher attack & release than normal notes
        attack: getRange((controls.softness.max/10) * 0.75, (controls.softness.max/10)),
        release: getRange((controls.softness.max/10) * 0.75, (controls.softness.max/10) * 1.25),
        delay: 0
    };
}

/**
 * Will return an object containing properties
 * defining a "normal" note.
 */
function assembleNormalNote(): Note {
    return {
        type: getRandomArrayItem(getActiveWaveTypes()),
        frequency: getHarmonicNoteFrequency(getRandomArrayItem(getCurrentScale())),
        time: getRandomNoteDuration(),
        volume: getCurrentMasterVolume(),
        attack: getRange(getCurrentSoftness(), getCurrentSoftness() * 1.2),
        release: getRange(getCurrentSoftness() * 1.2, getCurrentSoftness() * 2),
        delay: 0
    };
}

/**
 * Will build and play a chord given a Note and a MouseEvent.
 * @param note z
 * @param event 
 */
function buildChordFromNote(note: Note, event: MouseEvent) {
    let chordNote: Note;
    let overrideX: number;
    /* Our chord should have at last 2 tones, and at maximum 4 tones, unless
     * our scale doesn't have 4 tones, then just use as many as possible. */
    const additionalChordTones = Math.floor(getRange(2, shortestScaleLength > 4 ? 4 : shortestScaleLength));
    getChord(additionalChordTones).forEach((chordTone) => {
        // create a new tone, with some modifications
        chordNote = note;
        chordNote.frequency = chordTone;
        // handle x & y seperately for chord notes, because
        // the x-axis will need to be calculated
        overrideX = setClickPositionFromNoteFrequency(chordNote, event);
        playAndShowNote(chordNote, {event, overrideX} as CustomMouseEvent);
    });
    // give our "sanitized" chord note back
    return note;
}

/**
 * Will build and play an arpeggio given a Note and a MouseEvent.
 * @param note 
 * @param event 
 */
function buildArpeggioFromNote(note: Note, event: MouseEvent) {
    let chordNote: Note;
    let overrideX: number;
    /* Our arpeggio should have at last 2 tones, and at maximum 8 tones, unless
     * our scale doesn't have 8 tones, then just use as many as possible. */
    const additionalChordTones = Math.floor(getRange(2, shortestScaleLength > 8 ? 8 : shortestScaleLength));
    let previousDelay = timeUntilNextArpeggioNote();
    /* change our base note to be more "arppegio" friendly,
     * no pad arps */
    note.time = clickedNoteLength ? clickedNoteLength : getRandomNoteDuration();
    // use shorter notes when we have an arp
    note.attack = +controls.softness.min / 10;
    note.release = note.attack * getRange(1.25, 1.5);
    // create new tones, with some modifications
    getChord(additionalChordTones).forEach((chordTone) => {
        chordNote = note;
        chordNote.frequency = chordTone;
        // compound delay
        chordNote.delay = previousDelay;
        previousDelay += timeUntilNextArpeggioNote();
        // handle x & y seperately for chord notes, because
        // the x-axis will need to be calculated
        overrideX = setClickPositionFromNoteFrequency(chordNote, event);
        playAndShowNote(chordNote, {event, overrideX} as CustomMouseEvent);
    });
    // give our "sanitized" arpeggio note back
    return note;
}

/**
 * Responsible for generating a sound. If passed an event,
 * this function will use that click data, and will not try
 * and continually generate a new tone some time after
 * (if autoplay is enabled).
 * Note: Can generate either a tone, echo tone, or chord.
 * @param {MouseEvent} event
 */
function generateSound(event:MouseEvent = new MouseEvent("", undefined)) {
    let note = maybe(assembleNormalNote(), assemblePadNote());
    // If we've called this function from the autoplay loop
    if(!event.clientX) {
        event = getFakeMouseClick();
        /* in an amount of time, call itself again, because
         * we can be sure this is a generated note due to the absence
         * of an event. */
        const msUntilNextNote = getSecondsUntilNextNote() * 1000; // in ms
        autoplayEventLoop = window.setTimeout(function() {
            generateSound();
        }, msUntilNextNote);
    }
    // If we've called this function from a user click
    else {
        note.time = clickedNoteLength;
    }
    // note frequency is driven by our (maybe fake) event
    note.frequency = setNoteFrequencyFromClick(note, event);
    // small chance to get a chord
    if(maybe(true, false, 33)) {
        note = buildChordFromNote(note, event); // we mutate the note in buildChordFromNote()
    }
    // we will probably play an arpeggio because they are interesting.
    else if(maybe(true, false)) {
        note = buildArpeggioFromNote(note, event); // we mutate the note in buildArpeggioFromNote()
    }
    // now that we "sanitized" the note, we can play it
    playAndShowNote(note, {event} as CustomMouseEvent);
}