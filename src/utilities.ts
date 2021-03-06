// Non-Pure Functions
// NOTE: Mostly impure due to randomness

/**
 * Will return the first provided input... maybe.
 * Otherwise returns the second input. If no second
 * input is provided and first check fails, this function
 * will return null.
 * Note: Isn't a pure function because it doesn't guarantee
 * the same output given the same inputs.
 * @param condition will return... maybe.
 * @param defaultCondition will return if
 * the first condition fails.
 * @param weight 0 to 100. how likely it is
 * the first condition should happen, in percentage.
 */
function maybe(condition: any, defaultCondition: any = null, weight = 50) {
    if(Math.random() < weight / 100) {
        return condition;
    }
    else if(defaultCondition || defaultCondition === 0) { // sometimes i want 0 to return from this
        return defaultCondition;
    }
    return null;
}

/**
 * Gives back a random array item, provided
 * the array.
 * @param array
 */
function getRandomArrayItem(array:any[]) {
    return array[Math.round(getRange(0, array.length - 1))];
}

/**
 * Gives back a number in the range provided.
 * @param min
 * @param max
 */
function getRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}
/**
 * Will return a suitable value for seconds
 * until the next musical phrase.
 * To be called by generateSound().
 */
function getSecondsUntilNextPhrase() {
    return maybe(
        noteTimings[0], // whole note
        noteTimings[0] * 2 // 2 bars
    );
} 

/**
 * Will return, in seconds, how long a "short note"
 * should sound. Won't use whole or half notes.
 */
function getShortNoteDuration() {
    return noteTimings[Math.floor(getRange(2, noteTimings.length - 1))];
}

/**
 * Will return, in seconds, how long a "melody note"
 * should sound. Won't use extremely long or short notes.
 */
function getMelodyNoteDuration() {
    return noteTimings[Math.floor(getRange(2, noteTimings.length - 2))];
}

// Pure Functions
/**
 * Creates a click event somewhere randomly on the visualizer,
 * within a window of the gutter provided, and returns the event.
 * Will return null if no visualizer div is present.
 * @param screenGutter how much edge of the screen to give, in px.
 */
let fakeMouseEvent:MouseEvent;
function getFakeMouseClick(screenGutter = 300) {
    if(visualizerElement) {
        const bestGuessX = getRange(screenGutter, visualizerElement.offsetWidth - screenGutter);
        const bestGuessY = getRange(screenGutter, visualizerElement.offsetHeight - screenGutter);
        fakeMouseEvent = new MouseEvent('click', {
            'view': window,
            'bubbles': true,
            'cancelable': true,
            'clientX': bestGuessX,
            'clientY': bestGuessY
        });
    }
    return fakeMouseEvent;
}

/**
 * Takes in a value and will generate another number
 * within a defined range, then returns that number.
 * @param initialValue
 * @param maxInitialValue
 * @param minResult
 * @param maxResult
 */
function getRelativeValue(initialValue = 0, maxInitialValue = 100, minResult: number, maxResult: number) {
    return ((initialValue / maxInitialValue) * maxResult) + minResult;
}

/**
 * Will tell you the frequency of an interval in half
 * steps from the current base note. Used originally
 * for building melodies.
 */
function getFrequencyOfInterval(interval: number) {
    return getCurrentBaseNote() * Math.pow(twelfthRootOfTwo, interval) - getCurrentBaseNote();
}

/**
 * Will generate a chord, returned as an array filled with
 * unique freqencies based on the currentScale. Needs a base
 * tone to ensure we aren't returning two of the same note.
 * @param tones how many notes you want in the chord
 */
function getChord(baseTone: Note, tones = 3) {
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
}

/**
 * Will assemble an array of numbers that will
 * contain frequencies for a melody.
 * @param baseTone
 * @param tones 
 */
function getMelody(baseTone: Note, tones = 3) {
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
}

/**
 * Will generate a frequency based on a scale.
 * Relies on twelfthRootOfTwo. Will return the
 * frequency for the base tone, set by the pitch slider,
 * by default.
 * @param interval how far away from baseTone the note is
 */
function getHarmonicNoteFrequency(interval = 0) {
    return getCurrentBaseNote() * Math.pow(twelfthRootOfTwo, interval);
}

/**
 * Will prevent the last wave from being turned off.
 * @param attemptedValue 
 */
function ensureLastWaveStaysOn(attemptedValue: string) {
    if(getActiveWaveTypes().length !== 0) {
        return attemptedValue;
    }
    return "1";
}

/**
 * Will take care of ensuring at least one wave is turned on.
 * Meant to be called anytime an input that has potential
 * to be a wave input changes.
 * @param inputKey 
 * @param attemptedValue 
 */
function ensureOneWaveIsOn(inputKey: string, attemptedValue: string) {
    let returnValue = attemptedValue;
    if(inputKey === "triangle" ||
    inputKey === "sine" ||
    inputKey === "sawtooth" ||
    inputKey === "square" ||
    inputKey === "whiteNoise" ||
    inputKey === "pinkNoise" ||
    inputKey === "brownNoise") {
        returnValue = ensureLastWaveStaysOn(attemptedValue); // counts on the HTMLInput already being toggled
    }
    return returnValue;
}

/**
 * Will return a note's frequency given a MouseEvent.
 * If no visualizer is present, will return the same frequency.
 * @param note
 * @param event 
 */
function setNoteFrequencyFromClick(note: Note, event: MouseEvent) {
    if(visualizerElement) {
        // "snap" our targetFrequency to currentScale
        const intervalGuess = Math.floor((event.clientX / visualizerElement.clientWidth) * getCurrentScale().length);
        note.frequency = getHarmonicNoteFrequency(getCurrentScale()[intervalGuess]);
    }
    return note.frequency;
}

/**
 * Will set a click's X position given a frequency based on
 * the current scale. If no visualizer is present, will return
 * 0.
 * @param note 
 * @param event 
 */
function setClickPositionFromNoteFrequency(note: Note, event: MouseEvent) {
    let clickXPosition = 0;
    if(visualizerElement) {
        clickXPosition = getRelativeValue(
            note.frequency,
            getHarmonicNoteFrequency(getCurrentScale()[getCurrentScale().length - 1]),
            0,
            visualizerElement.clientWidth
        );
    }
    return clickXPosition;
}

/**
 * Will get an x & y position given a click event.
 * Will return null if provided no event. If no
 * event or visualizer is given, will return {x:0, y:0}.
 * @param event
 */
function getNotePosition(event: CustomMouseEvent) {
    let xPosition = 0;
    let yPosition = 0;
    if(event.event) {
        xPosition = event.overrideX ? event.overrideX : event.event.clientX;
        yPosition = event.overrideX ? 0 : event.event.clientY;
    }
    return {
        x: event.event ? xPosition : 0,
        y: event.event ? yPosition : 0
    };
}

/* Control Panel Utilities */
function getCurrentLFORate() {
    return +controls.lfoRate.htmlInput.value;
}
function getCurrentLFODepth() {
    return +controls.lfoDepth.htmlInput.value;
}
function getCurrentMasterVolume() {
    return +controls.volume.htmlInput.value;
}
function getCurrentBaseNote() {
    return +controls.baseNote.htmlInput.value;
}
function getCurrentSoftness() {
    return +controls.softness.htmlInput.value / 10;
}
function getCurrentTempo() {
    return +controls.tempo.htmlInput.value;
}
function getCurrentScale() {
    return scales[+controls.mood.htmlInput.value];
}
function isAutoplay() {
    return +controls.autoplay.htmlInput.value === 0 ? false : true;
}
function isEvolve() {
    return +controls.evolve.htmlInput.value === 0 ? false : true;
}
function getActiveWaveTypes() {
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
}