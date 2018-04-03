// Pure Functions
/**
 * Will prevent the last wave from being turned off.
 * @param attemptedValue 
 */
const ensureLastWaveStaysOn = (attemptedValue: string) => {
    if(getActiveWaveTypes().length !== 0) {
        return attemptedValue;
    }
    return "1";
};

/**
 * Will take care of ensuring at least one wave is turned on.
 * @param inputKey 
 * @param attemptedValue 
 */
const ensureOneWaveIsOn = (inputKey: string, attemptedValue: string) => {
    let returnValue = "0";
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
};

// Non-Pure Functions
/**
 * Runs through our list of controls, defined in
 * definitions.ts, and populates their minimum
 * and maximum values, and also sets the default
 * values for each control.
 */
function setInitialControlValues() {
    let currentHTMLInput, controlValue;
    for(let control in controls) {
        currentHTMLInput = controls[control].htmlInput;
        currentHTMLInput.min = ""+controls[control].min;
        currentHTMLInput.max = ""+controls[control].max;
        // Set initial values
        if(controls[control].max > 1) {
            // no lfo at all off the bat
            if(control === "lfoRate" || control === "lfoDepth") {
                controlValue = 0;
            }
            else{
                controlValue = getRange(+currentHTMLInput.min, +currentHTMLInput.max);
            }
        }
        else {
            controlValue = maybe(1, 0);
        }
        // Now override .value if needed per control
        if(control === "volume") { // curate volume
            controlValue = (controls.volume.min + controls.volume.max) / 2;
        }
        // we want triangle evolving autoplay off the bat
        else if(control === "autoplay" || control === "evolve" || control === "triangle") {
            controlValue = 1;
        }
        else if(control === "mood") {
            changeBackgroundColor(Math.round(controlValue) + 1);
        }
        // after we set the HTMLInput value, make sure at least one wave is on
        currentHTMLInput.value = ensureOneWaveIsOn(control, ""+Math.round(controlValue));
    }
}

/**
 * Will adjust the nextInput's value by just a little amount, maybe.
 * Note: Doesn't effect volume, autoplay, or triangle.
 * @param nextInput string value which will act as an index on controls.
 */
function evolveSound(nextInput = getRandomArrayItem(Object.keys(controls))) {
    if (DEBUG) console.info("COMPOSER evolving " + nextInput + " paramater");
    if(nextInput && controls[nextInput]) {
        let newValue;
        const nextHTMLInput = controls[nextInput].htmlInput;
        const oldValue = nextHTMLInput.value;
        const minValue = Math.floor(+nextHTMLInput.value - ((+nextHTMLInput.max - +nextHTMLInput.min) / 3));
        const maxValue = Math.ceil(+nextHTMLInput.value + ((+nextHTMLInput.max - +nextHTMLInput.min) / 3));
        // don't set anything outside the bounds
        const attemptedValue = getRange(minValue >= +nextHTMLInput.min ? minValue : +nextHTMLInput.min, maxValue <= +nextHTMLInput.max ? maxValue : +nextHTMLInput.max);
        newValue = Math.round(attemptedValue);
        if(nextInput === "mood") {
            changeBackgroundColor(newValue + 1);
        }
        // if we have a toggle or binary switch, we only need 1 or 0.
        if(+nextHTMLInput.max === 1) {
            newValue = maybe(1, 0);
        }
        // don't turn modify volume or turn off autoplay/evolve
        if(nextInput != "autoplay" && nextInput != "evolve" && nextInput != "volume") {
            // after we set the HTMLInput value, make sure at least one wave is on
            nextHTMLInput.value = ensureOneWaveIsOn(nextInput, ""+newValue);
        }
        if (DEBUG) console.info("the value was " + oldValue + " but now it's " + nextHTMLInput.value);
        /* in an amount of time, call itself again, because
         * we want to make the radio interesting over time. */
        nextInput = getRandomArrayItem(Object.keys(controls));
        const msUntilNextControlChange = Math.floor(getRange(10000, 60000)); // in ms
        composerEventLoop = window.setTimeout(function() {
            evolveSound(nextInput);
        }, msUntilNextControlChange);
    }
}

/**
 * Used for autoplay capability.
 */
function toggleAutoplay() {
    if(isAutoplay()) {
        generateSound();
    }
    else {
        clearTimeout(autoplayEventLoop);
    }
}

/**
 * used for evolve capability.
 */
function toggleEvolve() {
    if(isEvolve()) {
        evolveSound();
    }
    else {
        clearTimeout(composerEventLoop);
    }
}

/**
 * We are relying on the number of moods in the CSS being
 * proportionate to the number of scales in definitions.ts.
 */
function changeBackgroundColor(mood = 1) {
    const updatedVisualizerClass = "mood" + mood;
    const visualizerElement = document.getElementById("Visualizer");
    if(visualizerElement) {
        // wipe the old mood class if there is one
        visualizerElement.className = "visualizer";
        visualizerElement.classList.add(updatedVisualizerClass);
    }
}

/**
 * Randomizes all control panel values.
 */
function randomizeControlValues() {
    let currentInput;
    for(let control in controls) {
        currentInput = controls[control];
        evolveSound(control);
    }
}

/**
 * Will take care of wiring up the event listeners
 * for the inputs in the control panel.
 */
function addInputEventListeners() {
    const allWaveRanges = [
        controls.triangle.htmlInput,
        controls.sine.htmlInput,
        controls.square.htmlInput,
        controls.sawtooth.htmlInput,
        controls.whiteNoise.htmlInput,
        controls.pinkNoise.htmlInput,
        controls.brownNoise.htmlInput
    ];
    /* using "change" so this only runs on mouse up.
     * NOTE: can't just fire over and over again by clicking
     * max value on the toggle because this is a "change" event,
     * and only fires when a value changes. */
    controls.autoplay.htmlInput.addEventListener("change", function() {
        toggleAutoplay();
    });
    controls.evolve.htmlInput.addEventListener("change", function() {
        toggleEvolve();
    });
    controls.mood.htmlInput.addEventListener("change", function() {
        changeBackgroundColor(+this.value + 1);
    });
    controls.tempo.htmlInput.addEventListener("change", function() {
        setNoteTimings(); // uses getCurrentTempo() to fetch value
    });
    allWaveRanges.forEach((range) => {
        range.addEventListener("change", function() {
            if(+this.value === 0) {
                this.value = ensureLastWaveStaysOn(this.value); // disallow this wave from being toggled off if it's the only one
            }
        });
    });
}

/**
 * Will wire up the buttons for the control panel,
 * to hide and show itself, and to randomize (or evolve)
 * all inputs.
 */
function addButtonEventListeners() {
    const showControlsButton = document.getElementById("ShowControls");
    const randomizeControlsButton = document.getElementById("RandomizeControls");
    if(randomizeControlsButton) {
        randomizeControlsButton.addEventListener("click", function() {
            randomizeControlValues();
            toggleAutoplay();
            toggleEvolve();
        });
    }
    if(showControlsButton) {
        showControlsButton.addEventListener("click", function() {
            let content = document.getElementById("ControlList");
            const controlsDiv = document.getElementsByClassName("controls")[0];
            // relies on the max height being set on the content
            if(content && this.classList.contains("active")) {
                this.classList.remove("active");
                content.classList.remove("active");
                controlsDiv.classList.remove("active");
            }
            else if(content) {
                this.classList.add("active");
                content.classList.add("active");
                controlsDiv.classList.add("active");
            }
        });
    }
}

/**
 * Is responsible for initializing the control panel and
 * initializing autoplay & evolving.
 */
function initControlMenu() {
    setInitialControlValues();
    addButtonEventListeners();
    addInputEventListeners();
    generateSound();
    evolveSound();
}