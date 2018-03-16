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

// Pure Functions
/**
 * Gets a unique note in the chord, not the one provided.
 * Relies on twelfthRootOfTwo.
 * @param {Number} note in Hz
 * @param {Array} scale interval array
 */
const getUniqueChordNote = (note, scale) => {
    let returnNote = getHarmonicNoteFrequency(getRandomArrayItem(scale));
    // this makes sure there is enough space between the next note by
    // making sure at least one half step is between the two notes.
    while(note === returnNote || returnNote - note < twelfthRootOfTwo || note - returnNote < twelfthRootOfTwo) {
        returnNote = getHarmonicNoteFrequency(getRandomArrayItem(scale));
    }
    return returnNote;
};

/**
 * Will return a gain node, given a volume less than 1.
 * If volume is 0, null is returned.
 * Relies on audioContext.
 * @param {Number} volume
 */
const getGainNode = volume => {
    if(volume > 0 && volume < 1.0) {
        const gainNode = audioContext.createGain();
        return gainNode;
    }
    return null;
};

/**
 * Will get a note position given an event.
 * Will return null if provided no event.
 * @param {HTMLEvent} event
 */
const getNotePosition = event => {
    return {
        x: event ? event.clientX : null,
        y: event ? event.clientY : null
    };
};

/**
 * Sets the passed in osc's type and frequency,
 * then returns that osc.
 * Relies on audioContext.
 * @param {Oscillator} osc
 * @param {String} type
 * @param {Number} frequency in Hz
 */
const setOscProperties = (osc, type, frequency) => {
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
    return osc;
};

/**
 * Connects a new oscillator and hooks up a gain node
 * if it needs to, then returns the connected oscillator.
 * Relies on audioContext.
 * @param {GainNode} gainNode
 */
const connectOscNode = (gainNode) => {
    const osc = audioContext.createOscillator();
    if(gainNode) {
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
    }
    else {
        osc.connect(audioContext.destination);
    }
    return osc;
};

/**
 * Starts the given osc, then stops it in the
 * time provided, in seconds.
 * Relies on audioContext.
 * @param {Oscillator} osc
 * @param {Number} time in seconds
 */
const startOscillator = (osc, time) => {
    osc.start();
    osc.stop(audioContext.currentTime + time);
    return osc;
};

/**
 * Will set an "attack" on a gain, then
 * return that gainNode.
 * @param {GainNode} gainNode
 * @param {Number} volume from 0 to 1
 * @param {Number} attack in seconds
 * @param {Number} release in seconds
 */
const setADSR = (gainNode, volume, attack = 0.1, release = 0.1) => {
    if(gainNode) {
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + attack);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + attack + release);
    }
    return gainNode;
};

/**
 * Will generate a chord, returned as a set filled with
 * unique values. Relies on currentScale.
 * @param {Number} tones how many notes you want in the chord
 */
const getChord = (tones = 3) => {
    let chordTones = [];
    for(var i = 0; i < tones; i++) {
        chordTones.push(getUniqueChordNote(0, currentScale));
    }
    // since sets can only store unique values, let's make
    // a set with the chord tones, since i want them unique.
    return new Set(chordTones);
};

// Non-Pure Functions
/**
 * Will generate a frequency based on a scale.
 * Relies on baseTone and twelfthRootOfTwo
 * @param {Number} interval how far away from baseTone the note is
 */
const getHarmonicNoteFrequency = (interval = getRandomArrayItem(currentScale)) =>
    baseTone * Math.pow(twelfthRootOfTwo, maybe(-(interval), interval));

/**
 * Will play the note passed in.
 * Relies on note.attack, note.release, note.volume,
 * note.type, note.frequency, note.time, note.echoDelay
 * @param {Note} note Note interface containing multiple properties
 * @param {HTMLEvent} event to determine where to draw the circles. default is null.
 */
function playMIDINote(note: Note, event = null) {
    // handle creating an oscillator and starting & stopping it
    const osc = startOscillator(
                    setOscProperties(
                            connectOscNode(setADSR(getGainNode(note.volume), note.volume, note.attack, note.release)),
                    note.type, note.frequency),
                note.time);
    // draw those pretty circles on the canvas
    if(event) {
        drawNoteWithVolumeBasedOpacity(note.echoDelay, event, note.volume);
    }
    // handle repeating notes
    if(note.echoDelay && note.volume > 0.2) {
        note.volume = note.volume - 0.2;
        window.setTimeout(function() {
            playMIDINote(note, event);
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
    const attackValue = getRange(10, 100) / 10;
    return {
        type: maybe("triangle", "sine"),
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
    const attackValue = getRange(2, 20) / 10;
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
    const note = assembleNormalNote();
    playMIDINote(note, event);
}

/**
 * "Starts" the radio and keeps it going by calling itself.
 * This is the driver of the automatic radio generation.
 * Note: Can generate either a tone, echo tone, or chord.
 */
function generateSound() {
    const note = maybe(assemblePadNote(), assembleNormalNote());
    const additionalChordTones = maybe(getRange(1, 4), false, 10); // small chance for chords
    playMIDINote(note, getFakeMouseClick());
    // take care of chords if there is one.
    getChord(additionalChordTones).forEach((chordTone) => {
        // create a new tone, with some modifications
        let chordNote = note;
        chordNote.frequency = getHarmonicNoteFrequency(chordTone);
        chordNote.echoDelay = 0; // no echo for chords
        playMIDINote(chordNote, getFakeMouseClick());
    });

    // now in a random amount of time, call itself again.
    const msUntilNextNote = getRange(0.25, 5) * 1000; // in ms
    window.setTimeout(function() {
        generateSound();
    }, msUntilNextNote);
}