// Pure Functions
/**
 * Will take care of ensuring at least one wave is turned on.
 * @param length of the current active waves
 */
const ensureOneWaveIsOn = (length = getActiveWaveTypes().length) => {
    if(!length) {
        return "1";
    }
    return "0";
}

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
            if(control === "lfoRate" || control === "lfoDepth") {
                controlValue = getRange(+currentHTMLInput.min, +currentHTMLInput.max / 4);
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
            controlValue = (+currentHTMLInput.min + +currentHTMLInput.max) / 2;
        }
        // we want triangle evolving autoplay off the bat
        else if(control === "autoplay" || control === "evolve" || control === "triangle") {
            controlValue = 1;
        }
        // we never want noise waves on by default
        else if(control === "whiteNoise" || control === "brownNoise" || control === "pinkNoise") {
            controlValue = 0;
        }
        else if(control === "mood") {
            changeBackgroundColor(Math.round(controlValue) + 1);
        }
        currentHTMLInput.value = ""+Math.round(controlValue);
    }
    controls.triangle.htmlInput.value = ensureOneWaveIsOn(); // make sure at least triangle is on.
}

/**
 * Will adjust the nextInput's value by just a little amount, maybe.
 * Note: Doesn't effect volume, autoplay, or triangle.
 * @param nextInput string value which will act as an index on controls.
 */
function evolveSound(nextInput = getRandomArrayItem(Object.keys(controls))) {
    if(nextInput && controls[nextInput]) {
        let newValue;
        const nextHTMLInput = controls[nextInput].htmlInput;
        const oldValue = nextHTMLInput.value;
        const minValue = Math.floor(+nextHTMLInput.value - ((+nextHTMLInput.max - +nextHTMLInput.min) / 3));
        const maxValue = Math.ceil(+nextHTMLInput.value + ((+nextHTMLInput.max - +nextHTMLInput.min) / 3));
        // don't set anything outside the bounds
        const attemptedValue = getRange(minValue >= +nextHTMLInput.min ? minValue : +nextHTMLInput.min, maxValue <= +nextHTMLInput.max ? maxValue : +nextHTMLInput.max );
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
            nextHTMLInput.value = ""+newValue;
        }
        // after we set the HTMLInput value, make sure at least one wave is on
        if(nextInput === "triangle" ||
            nextInput === "sine" ||
            nextInput === "sawtooth" ||
            nextInput === "square" ||
            nextInput === "whiteNoise" ||
            nextInput === "pinkNoise" ||
            nextInput === "brownNoise") {
                nextHTMLInput.value = ""+ensureOneWaveIsOn(); // counts on the HTMLInput already being toggled
        }
        /* in an amount of time, call itself again, because
         * we want to make the radio interesting over time. */
        nextInput = getRandomArrayItem(Object.keys(controls));
        const msUntilNextControlChange = Math.floor(getRange(8000, 30000)); // in ms
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
    let updatedVisualizerClass = "mood";
    updatedVisualizerClass += ""+mood;
    const visualizerElement = document.getElementById("Visualizer");
    if(visualizerElement && mood != 1) { // we don't have a "mood1" modifier - it's just the default style
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
        if(currentInput.max > 1) {
            currentInput.htmlInput.value = ""+getRange(currentInput.min, currentInput.max);
        }
        else {
            currentInput.htmlInput.value = maybe("1", "0");
        }
    }
    controls.triangle.htmlInput.value = ensureOneWaveIsOn();
}

/**
 * Wires up the close/open functionality of the controls menu.
 */
function enableControlMenu() {
    const showControlsButton = document.getElementById("ShowControls");
    const randomizeControlsButton = document.getElementById("RandomizeControls");
    const moodRange = <HTMLInputElement>document.getElementById("Mood");
    const allWaveRanges = [
        <HTMLInputElement>document.getElementById("Triangle"),
        <HTMLInputElement>document.getElementById("Sine"),
        <HTMLInputElement>document.getElementById("Square"),
        <HTMLInputElement>document.getElementById("Saw"),
        <HTMLInputElement>document.getElementById("WhiteNoise"),
        <HTMLInputElement>document.getElementById("PinkNoise"),
        <HTMLInputElement>document.getElementById("BrownNoise")
    ]
    const autoplayToggle = <HTMLInputElement>document.getElementById("Autoplay");
    const evolveToggle = <HTMLInputElement>document.getElementById("Evolve");
    setInitialControlValues();
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
    /* using "change" so this only runs on mouse up.
     * NOTE: can't just fire over and over again by clicking
     * max value on the toggle because this is a "change" event,
     * and only fires when a value changes. */
    autoplayToggle.addEventListener("change", function() {
        toggleAutoplay();
    });
    evolveToggle.addEventListener("change", function() {
        toggleEvolve();
    });
    moodRange.addEventListener("change", function() {
        changeBackgroundColor(+this.value + 1);
    });
    allWaveRanges.forEach((range) => {
        range.addEventListener("change", function() {
            if(+this.value === 0) {
                this.value = ensureOneWaveIsOn(); // disallow this wave from being toggled off if it's the only one
            }
        });
    });
    // we are autoplay from the get go.
    generateSound();
    // and start evolving the sound from the get go.
    evolveSound();
}