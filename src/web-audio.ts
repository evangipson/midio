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
 * @param {Number} attackValue in seconds
 * @param {Number} releaseValue in seconds
 */
const setADSR = (gainNode, volume, attackValue = 0.1, releaseValue = 0.1) => {
    if(gainNode) {
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + attackValue);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + attackValue + releaseValue);
    }
    return gainNode;
};

/**
 * Will generate a frequency based on a scale.
 * Relies on baseTone and twelfthRootOfTwo
 * @param {Array} scale interval array
 */
const getHarmonicNoteFrequency = scale => {
    let harmonicInterval = getRandomArrayItem(scale);
    // in a 2 octave range, 1 up 1 down
    harmonicInterval = maybe(-(harmonicInterval), harmonicInterval);
    // perform our calculation to give back our frequency
    return baseTone * Math.pow(twelfthRootOfTwo, harmonicInterval);
};

/**
 * Will generate a chord, returned as a set filled with
 * unique values. Relies on currentScale.
 * @param {Number} baseNote the root note of the chord, interval
 * @param {Number} tones how many notes you want in the chord
 */
const getChord = (baseNote, tones) => {
    let chordTones = [];
    for(var i = 0; i < tones; i++) {
        chordTones.push(getUniqueChordNote(baseNote, currentScale));
    }
    // since sets can only store unique values, let's make
    // a set with the chord tones, since i want them unique.
    return new Set(chordTones);
};

// Non-Pure Functions
/**
 * Will play a MIDI note. Plays a sine wave
* at 440hz for 1 second by default.
* @param {String} type of waveform. default is sine.
* @param {Number} frequency in Hz. default is 440.
* @param {Number} time in seconds. default is .5s.
* @param {Number} volume from 0 to 1. default is 1.0, so 100%.
* @param {Number} attack from 0 to 1. default is 0.1.
* @param {Number} release from 0 to 1. default is 0.1.
* @param {Number} echoDelay used with notes that have echo, in milliseconds. default is false.
* @param {HTMLEvent} event to determine where to draw the circles. default is null.
*/
function playMIDINote(type = "sine", frequency = 440, time = 0.5, volume = 1.0, attack = 0.1, release = 0.1, echoDelay = false, event = null) {
    // handle creating an oscillator and starting & stopping it
    const osc = startOscillator(
                    setOscProperties(
                            connectOscNode(setADSR(getGainNode(volume), volume, attack, release)),
                    type, frequency),
                time);
    // draw those pretty circles on the canvas
    if(event) {
        drawNoteWithVolumeBasedOpacity(echoDelay, event, volume);
    }
    // handle repeating notes
    if(echoDelay && volume > 0.2) {
        volume = volume - 0.2;
        window.setTimeout(function() {
            playMIDINote(type, frequency, time, volume, attack, release, echoDelay, event);
        }, echoDelay);
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
function assemblePadNote() {
    const attackValue = getRange(10, 100) / 10;
    return {
        type: maybe("triangle", "sine"),
        frequency: getHarmonicNoteFrequency(currentScale),
        time: getRange(1, 10),
        volume: getRange(1, 7) / 10,
        attackValue: attackValue,
        releaseValue: attackValue,
        echoDelay: null,
    };
}

/**
 * Will return an object containing properties
 * defining a "normal" note.
 */
function assembleNormalNote() {
    const attackValue = getRange(2, 20) / 10;
    return {
        type: getRandomArrayItem(waveTypes),
        frequency: getHarmonicNoteFrequency(currentScale),
        time: getRandomNoteDuration(),
        volume: getRange(1, 4) / 10,
        attackValue: attackValue,
        releaseValue: attackValue,
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
    playMIDINote(
        note.type,
        note.frequency,
        note.time,
        getRange(1, 7) / 10,
        note.attackValue,
        note.releaseValue,
        note.echoDelay,
        event
    );
}

/**
 * "Starts" the radio and keeps it going by calling itself.
 * This is the driver of the automatic radio generation.
 * Note: Can generate either a tone, echo tone, or chord.
 */
function generateSound() {
    const note = maybe(assemblePadNote(), assembleNormalNote());
    const additionalChordTones = maybe(getRange(1, 4), false, 10); // small chance for chords
    playMIDINote(
        note.type,
        note.frequency,
        note.time,
        note.volume,
        note.attackValue,
        note.releaseValue,
        note.echoDelay,
        getFakeMouseClick()
    );
    // take care of chords if there is one.
    getChord(note, additionalChordTones).forEach((chordTone) => {
        playMIDINote(
            chordTone.type,
            chordTone.frequency,
            chordTone.time,
            chordTone.volume,
            chordTone.attackValue,
            chordTone.releaseValue,
            false, // no echo for chords
            getFakeMouseClick()
        );
    });

    // now in a random amount of time, call itself again.
    const msUntilNextNote = getRange(0.25, 5) * 1000; // in ms
    window.setTimeout(function() {
        generateSound();
    }, msUntilNextNote);
}