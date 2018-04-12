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
    const memoryIndex = Math.round(getRange(0, shortTermMemory.length - 1));
    const rememberedPhrase = shortTermMemory[memoryIndex];
    rememberedPhrase.forEach((rememberedNote) => {
        overrideX = setClickPositionFromNoteFrequency(rememberedNote, event);
        playAndShowNote(rememberedNote, {event, overrideX} as CustomMouseEvent);
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
        //release: getRange(1.2, 2.5),
        release: 0,
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
    // we'll attempt to remember this chord
    let rememberedPhrase: Note[] = [];
    /* Our chord should have at last 2 tones, and at maximum 4 tones, unless
     * our scale doesn't have 4 tones, then just use as many as possible. */
    const additionalChordTones = Math.floor(getRange(2, shortestScaleLength > 4 ? 4 : shortestScaleLength));
    if (DEBUG) console.info("the chord will be " + additionalChordTones + " notes");
    if (DEBUG) console.info("========================================");
    // then for every other frequency in our chord...
    getChord(note, additionalChordTones).forEach((chordTone) => {
        // copy the "base note"
        chordNote = {...note}; // push a new copy of chordNote so it doesn't get overwritten
        chordNote.frequency = chordTone;
        rememberedPhrase.push(chordNote);
        overrideX = setClickPositionFromNoteFrequency(chordNote, event);
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
    let melodyNote: Note;
    let overrideX: number;
    // we'll attempt to remember this melody
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
    getMelody(note, additionalMelodyTones).forEach((melodyTone) => {
        // get a new note length
        let currentNoteLength = getMelodyNoteDuration();
        // copy the "base note"
        melodyNote = {...note}; // push a new copy of melodyNote so it doesn't get overwritten
        // use our new note length
        melodyNote.time = currentNoteLength;
        // set the frequency to what getMelody() advises
        melodyNote.frequency = melodyTone;
        // apply then compound the delay to ensure space between notes
        melodyNote.delay = currentNoteDelay;
        currentNoteDelay += currentNoteLength;
        rememberedPhrase.push(melodyNote);
        overrideX = setClickPositionFromNoteFrequency(melodyNote, event);
        playAndShowNote(melodyNote, {event, overrideX} as CustomMouseEvent);
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
            // play an accompanying chord/arpeggio as well sometimes
            if(maybe(true, false, 66)) {
                maybe(true, false, 66) ? buildChordFromNote(note, event) : buildArpeggioFromNote(note, event);
            }
        }
    }
    // If the user input a note, we'll just play the single tone
    else {
        playAndShowNote(note, {event} as CustomMouseEvent);
    }
}