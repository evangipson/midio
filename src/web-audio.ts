/* Define what a note is made up of
 * Note: Not in definitions because it's
 * only used in this file. */
interface Note {
    type: string;
    frequency: number; // in Hz
    time: number; // in seconds
    volume: number; // from 0 - 1
    attack: number; // in seconds
    release: number; // in seconds
    echoDelay: number; // in ms
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
     */
    setProperties(type, frequency: number) {
        this.mainOsc.type = type;
        this.mainOsc.frequency.setValueAtTime(frequency, audioContext.currentTime);
        return this; // allow chaining
    };
    /**
     * Starts the mainOsc, then stops it in the
     * time provided, in seconds.
     * Relies on audioContext.
     * @param {Number} time in seconds
     */
    play(time: number) {
        this.lfoNode.start();
        this.mainOsc.start();
        this.lfoNode.stop(audioContext.currentTime + time);
        this.mainOsc.stop(audioContext.currentTime + time);
    };
    /**
     * Will set a attack and release on the gainNode.
     * @param {Number} volume from 0 to 1
     * @param {Number} attack in seconds
     * @param {Number} release in seconds
     * @param {Number} time how long the note should sound.
     * Needed to implement release.
     */
    setADSR(volume: number, attack: number = 0.1, release: number = 0.1, time: number) {
        this.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + attack);
        this.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + attack + time + release);
        return this; // allow chaining
    };
    /**
     * Sets the LFO's frequency, gain, and type.
     * @param {Number} frequency how fast the LFO modulates
     * @param {Number} gain out of 100. How strong the LFO
     * will sound.
     * @param {String} type wave shape for the LFO
     */
    getLFO(frequency: number = 5, gain: number = 15, type) {
        this.lfoNode = audioContext.createOscillator();
        this.lfoGain = audioContext.createGain();
        this.lfoNode.type = type;
        this.lfoNode.frequency.setValueAtTime(frequency, audioContext.currentTime);
        this.lfoGain.gain.value = gain / 100;
        return this; // allow chaining
    };
    /**
     * Connects the LFO and main oscillator to the
     * gainNode, then connects the gainNode to the
     * "speaker" (or audioContext.destination).
     */
    hookUpFilters() {
        this.lfoNode.connect(this.lfoGain);
        this.lfoGain.connect(this.mainOsc.frequency); // experiment with hooking up LFO to other stuff
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
 * @param {Array} scale interval array
 */
const getUniqueChordNote = (frequency, scale) => {
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
        chordTones.push(getUniqueChordNote(baseTone, currentScale));
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
const getHarmonicNoteFrequency = (interval = getRandomArrayItem(currentScale)) =>
    baseTone * Math.pow(twelfthRootOfTwo, interval);

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
        .setProperties(note.type, note.frequency)
        .setADSR(note.volume, note.attack, note.release, note.time)
        .getLFO(maybe(getRange(1, 10), 0), getRange(5, 30), maybe("sine", "square")) // randomize LFO
        .hookUpFilters()
        .play(note.time);

    // draw those pretty circles on the canvas
    if(event) {
        drawNoteWithVolumeBasedOpacity(note.echoDelay, event, note.volume);
    }
    // handle repeating notes
    if(note.echoDelay && note.volume > 0.2) {
        note.volume = note.volume - 0.2;
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
    return Math.random() * 0.2 + 0.08;
}

/**
 * Will return an object containing properties
 * defining a "pad", or long, usually background note.
 */
function assemblePadNote(): Note {
    const attackValue = getRange(30, 100) / 10;
    return {
        type: getRandomArrayItem(waveTypes),
        frequency: getHarmonicNoteFrequency(),
        time: getRange(1, 10),
        volume: getRange(1, 7) / 10,
        attack: attackValue,
        release: attackValue,
        echoDelay: 0,
    };
}

/**
 * Will return an object containing properties
 * defining a "normal" note.
 */
function assembleNormalNote(): Note {
    const attackValue = getRange(10, 30) / 10;
    return {
        type: getRandomArrayItem(waveTypes),
        frequency: getHarmonicNoteFrequency(),
        time: getRandomNoteDuration(),
        volume: getRange(1, 4) / 10,
        attack: attackValue,
        release: attackValue,
        echoDelay: maybe(getRange(100, 1500)), // in ms
    };
}

/**
 * The function responsible for playing a MIDI note
 * after you've clicked the mouse.
 * @param {HTMLEvent} event
 */
function playNoteOnClick(event) {
    /* as long as we provide an echoDelay, we'll
    * hear an echo. */
    let note = maybe(assembleNormalNote(), assemblePadNote());
    note = setNotePropertiesFromClick(note, event);
    playAndShowNote(note, event);
}

/**
 * "Starts" the radio and keeps it going by calling itself.
 * This is the driver of the automatic radio generation.
 * Note: Can generate either a tone, echo tone, or chord.
 */
function generateSound() {
    let note = maybe(assemblePadNote(), assembleNormalNote());
    const additionalChordTones = maybe(getRange(1, 4), false, 10); // small chance for chords
    let fakeMouseEvent = getFakeMouseClick();
    note = setNotePropertiesFromClick(note, fakeMouseEvent);
    playAndShowNote(note, getFakeMouseClick());
    // take care of chords if there is one.
    getChord(additionalChordTones).forEach((chordTone) => {
        // create a new tone, with some modifications
        let chordNote = note;
        chordNote.frequency = getHarmonicNoteFrequency(chordTone);
        chordNote.echoDelay = 0; // no echo for chords
        // handle x & y seperately for chord notes, because
        // the x-axis will need to be calculated
        fakeMouseEvent["overrideX"] = setEventPropertiesFromNote(chordNote, fakeMouseEvent);
        chordNote = setNoteVolumeFromClick(chordNote, fakeMouseEvent);
        playAndShowNote(chordNote, fakeMouseEvent);
    });

    // now in a random amount of time, call itself again.
    const msUntilNextNote = getRange(0.5, 8) * 1000; // in ms
    window.setTimeout(function() {
        generateSound();
    }, msUntilNextNote);
}