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
    echoDelay: number; // in ms
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
    constructor() {
        this.mainOsc = audioContext.createOscillator();
        this.gainNode = audioContext.createGain();
        this.lfoNode = audioContext.createOscillator();
    }
    /**
     * Sets the mainOsc's type and frequency.
     * Relies on audioContext.
     * @param {String} type
     * @param {Number} frequency in Hz
     * @param {Number} delay in seconds
     */
    setProperties(type, frequency: number, delay: number) {
        if(type === "whiteNoise") {
            let whiteNoise = audioContext.createBufferSource();
            let buffer = audioContext.createBuffer(1, 4096, audioContext.sampleRate);
            let data = buffer.getChannelData(0);
            for (var i = 0; i < 4096; i++) {
                data[i] = Math.random();
            }
            whiteNoise.buffer = buffer;
            whiteNoise.loop = true;
            this.mainOsc = whiteNoise;
        }
        else {
            this.mainOsc.type = type;
            this.mainOsc.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
        }
        return this; // allow chaining
    };
    /**
     * Starts the mainOsc, then stops it in the
     * time provided, in seconds.
     * Relies on audioContext.
     * @param {Number} time in seconds
     * @param {Number} attack in seconds
     * @param {Number} release in seconds
     * @param {Number} delay in seconds
     */
    play(time: number, attack: number, release: number, delay: number) {
        this.lfoNode.start(audioContext.currentTime + delay);
        this.mainOsc.start(audioContext.currentTime + delay);
        this.lfoNode.stop(audioContext.currentTime + delay + attack + release + time);
        this.mainOsc.stop(audioContext.currentTime + delay + attack + release + time);
    };
    /**
     * Will set a attack and release on the gainNode.
     * @param {Number} volume from 0 to 100
     * @param {Number} attack in seconds
     * @param {Number} release in seconds
     * @param {Number} time how long the note should sound.
     * Needed to implement release.
     * @param {Number} delay in seconds
     */
    setADSR(volume: number, attack: number = 0.1, release: number = 0.1, time: number, delay: number) {
        this.gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
        this.gainNode.gain.linearRampToValueAtTime(volume / 100, audioContext.currentTime + delay + attack);
        this.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + delay + attack + time + release);
        return this; // allow chaining
    };
    /**
     * Sets the LFO's frequency, gain, and type.
     * @param {Number} frequency how fast the LFO modulates
     * @param {Number} gain out of 100. How strong the LFO
     * will sound.
     * @param {String} type wave shape for the LFO
     * @param {Number} delay in seconds
     */
    getLFO(frequency: number = 5, gain: number = 15, type, delay) {
        this.lfoNode = audioContext.createOscillator();
        this.lfoGain = audioContext.createGain();
        this.lfoNode.type = type;
        this.lfoNode.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
        // don't allow the gain of the LFO to surpass the current master volume
        this.lfoGain.gain.setValueAtTime(getRelativeValue(gain, 100, 0, getCurrentMasterVolume()) / 100, audioContext.currentTime);
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
        this.mainOsc.connect(this.gainNode);
        this.gainNode.connect(audioContext.destination);
        return this; // allow chaining
    };
}

// Pure Functions
/**
 * Gets a unique note in the chord, not the one provided.
 * Relies on twelfthRootOfTwo.
 * @param {Number} frequency in Hz
 */
const getUniqueChordNote = (frequency) => {
    let uniqueFrequency = getHarmonicNoteFrequency();
    // this makes sure there is enough space between the next note by
    // making sure at least one half step is between the two notes.
    while(frequency === uniqueFrequency || Math.abs(uniqueFrequency - frequency) < twelfthRootOfTwo) {
        uniqueFrequency = getHarmonicNoteFrequency();
    }
    return uniqueFrequency;
};

/**
 * Will generate a chord, returned as a set filled with
 * unique values. Relies on currentScale.
 * @param {Number} tones how many notes you want in the chord
 */
const getChord = (tones = 3) => {
    let chordTones = [];
    for(var i = 0; i < tones; i++) {
        chordTones.push(getUniqueChordNote(getCurrentBaseNote()));
    }
    // since sets can only store unique values, let's make
    // a set with the chord tones, since i want them unique.
    return new Set(chordTones);
};

/**
 * Will generate a frequency based on a scale.
 * Relies on baseTone and twelfthRootOfTwo.
 * @param {Number} interval how far away from baseTone the note is
 */
const getHarmonicNoteFrequency = (interval = getRandomArrayItem(getCurrentScale())) =>
    getCurrentBaseNote() * Math.pow(twelfthRootOfTwo, interval);

/**
 * Will return a suitable value for seconds
 * until the next note. To be called by generateSound().
 */
const getSecondsUntilNextNote = () => getRelativeValue(
    maximumDensity - getRange(getCurrentDensity() * 0.5, getCurrentDensity()), // a higher density means LESS time between notes
    maximumDensity,
    0.1,
    8
);

// Non-Pure Functions

/**
 * Will play the note passed in.
 * Relies on note.attack, note.release, note.volume,
 * note.type, note.frequency, note.time, note.echoDelay
 * @param {Note} note Note interface containing multiple properties
 * @param {HTMLEvent} event to determine where to draw the circles. default is null.
 */
function playAndShowNote(note: Note, event = null) {
    // handle creating an oscillator and starting & stopping it
    const osc = new Oscillator()
        .setProperties(note.type, note.frequency, note.delay)
        .setADSR(note.volume, note.attack, note.release, note.time, note.delay)
        // +variable = ParseInt(variable); "+" is a unary operator
        .getLFO(
            maybe(getCurrentLFORange(), 0, getCurrentLFOProbability()),
            getCurrentLFODepth(),
            getRandomArrayItem(allWaveTypes),
            note.delay
        ) // randomize LFO
        .hookUpFilters()
        .play(note.time, note.attack, note.release, note.delay);

    // draw those pretty circles on the canvas
    if(event) {
        drawNoteWithVolumeBasedOpacity(note.echoDelay, event, note.volume, note.delay);
    }
    // handle repeating notes
    if(note.echoDelay && note.volume > 20) {
        note.volume = note.volume - 20;
        window.setTimeout(function() {
            playAndShowNote(note, event);
        }, note.echoDelay);
    }
}

/**
 * Will return a random note duration, in seconds.
 * Note: Isn't pure because it's random, and has no inputs.
 */
function getRandomNoteDuration() {
    return Math.random() * 1.25 + 0.1;
}

/**
 * Will return an object containing properties
 * defining a "pad", or long, usually background note.
 */
function assemblePadNote(): Note {
    return {
        type: getRandomArrayItem(getActiveWaveTypes()),
        frequency: getHarmonicNoteFrequency(),
        time: getRange(1, 8), // in seconds
        volume: getCurrentMasterVolume(),
        // pads have higher attack & release than normal notes
        attack: getRange(getCurrentSoftness(), getCurrentSoftness() * 1.2),
        release: getRange(getCurrentSoftness() * 1.2, getCurrentSoftness() * 1.5),
        echoDelay: 0,
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
        frequency: getHarmonicNoteFrequency(),
        time: getRandomNoteDuration(),
        volume: getCurrentMasterVolume(),
        attack: getRange(getCurrentSoftness() * 0.8, getCurrentSoftness() * 1.2),
        release: getRange(getCurrentSoftness() * 1.2, getCurrentSoftness() * 1.5),
        echoDelay: maybe(getRange(250, 2000), 0, 25), // in ms
        delay: 0
    };
}

/**
 * Responsible for generating a sound. If passed an event,
 * this function will use that click data, and will not try
 * and continually generate a new tone some time after
 * (if autoplay is enabled).
 * Note: Can generate either a tone, echo tone, or chord.
 * @param {ClickEvent} event
 */
function generateSound(event = null) {
    if(!event) {
        event = getFakeMouseClick();
        /* in an amount of time, call itself again, because
         * we can be sure this is a generated note due to the absence
         * of an event. */
        const msUntilNextNote = getSecondsUntilNextNote() * 1000; // in ms
        autoplayEventLoop = window.setTimeout(function() {
            generateSound();
        }, msUntilNextNote);
    }
    let note = maybe(assemblePadNote(), assembleNormalNote());
    note = setNoteFrequencyFromClick(note, event);
    playAndShowNote(note, event);
    // take care of chords if the user wants them.
    if(maybe(isChordal())) { // 50% chance of chords if user wants them
        const additionalChordTones = Math.floor(getRange(2, 5));
        getChord(additionalChordTones).forEach((chordTone) => {
            // create a new tone, with some modifications
            let chordNote = note;
            chordNote.frequency = chordTone;
            // handle x & y seperately for chord notes, because
            // the x-axis will need to be calculated
            event["overrideX"] = setClickPositionFromNoteFrequency(chordNote, event);
            playAndShowNote(chordNote, event);
        });
    }
    // 50% chance of arpeggios if user wants them
    // 5% chance of arpeggios randomly happening
    else if(maybe(true, false, 5) || maybe(isArpeggiated())) {
        const additionalChordTones = Math.floor(getRange(3, 8));
        let previousDelay = getRange(maximumDensity - getCurrentDensity(), maximumDensity) / 100;
        getChord(additionalChordTones).forEach((chordTone) => {
            // create a new tone, with some modifications
            let chordNote = note;
            chordNote.frequency = chordTone;
            previousDelay += previousDelay;
            chordNote.delay = previousDelay;
            // handle x & y seperately for chord notes, because
            // the x-axis will need to be calculated
            event["overrideX"] = setClickPositionFromNoteFrequency(chordNote, event);
            playAndShowNote(chordNote, event);
        });
    }
}