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
        currentHTMLInput.min = controls[control].min;
        currentHTMLInput.max = controls[control].max;
        // Set initial values
        if(currentHTMLInput.max > 1) {
            if(control === "lfoRange") {
                controlValue = getRange(+currentHTMLInput.min, +currentHTMLInput.max / 4);
            }
            else if(control === "lfoDepth" || control === "density" || control === "lfoProbability") {
                controlValue = getRange(+currentHTMLInput.min, +currentHTMLInput.max / 2);
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
        else if(control === "autoplay" || control === "triangle") { // we do want triangle autoplay
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
        // don't evolve volume, triangle, or turn off autoplay
        if(nextInput != "triangle" && nextInput != "autoplay" && nextInput != "volume") {
            nextHTMLInput.value = ""+newValue;
        }
        /* in an amount of time, call itself again, because
         * we want to make the radio interesting over time. */
        nextInput = getRandomArrayItem(Object.keys(controls));
        const msUntilNextControlChange = getRange(maximumDensity - getCurrentDensity(), maximumDensity) * 100; // in ms
        composerEventLoop = window.setTimeout(function() {
            evolveSound(nextInput);
        }, msUntilNextControlChange);
    }
}

function toggleAutoplay() {
    if(isAutoplay()) {
        generateSound();
        evolveSound();
    }
    else {
        clearTimeout(autoplayEventLoop);
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
    // wipe the old mood class if there is one
    document.getElementById("Visualizer").className = "visualizer";
    if(mood != 1) { // we don't have a "mood1" modifier - it's just the default style
        document.getElementById("Visualizer").classList.add(updatedVisualizerClass);
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
            currentInput.htmlInput.value = getRange(currentInput.min, currentInput.max);
        }
        else {
            currentInput.htmlInput.value = maybe("1", "0");
        }
    }
    controls.triangle.htmlInput.value = "1"; // always turn triangles on with randomize
}

/**
 * Wires up the close/open functionality of the controls menu.
 */
function enableControlMenu() {
    let showControlsButton = document.getElementById("ShowControls");
    let randomizeControlsButton = document.getElementById("RandomizeControls");
    let triangleRange = <HTMLInputElement>document.getElementById("Triangle");
    let moodRange = <HTMLInputElement>document.getElementById("Mood");
    const otherRanges = [
        <HTMLInputElement>document.getElementById("Sine"),
        <HTMLInputElement>document.getElementById("Square"),
        <HTMLInputElement>document.getElementById("Saw")
    ]
    let autoplayToggle = <HTMLInputElement>document.getElementById("Autoplay");
    setInitialControlValues();
    randomizeControlsButton.addEventListener("click", function() {
        randomizeControlValues();
        toggleAutoplay();
    });
    showControlsButton.addEventListener("click", function() {
        let content = document.getElementById("ControlList");
        let controlsDiv = document.getElementsByClassName("controls")[0];
        // relies on the max height being set on the content
        if(this.classList.contains("active")) {
            this.classList.remove("active");
            content.classList.remove("active");
            controlsDiv.classList.remove("active");
        }
        else {
            this.classList.add("active");
            content.classList.add("active");
            controlsDiv.classList.add("active");
        }
    });
    /* using "change" so this only runs on mouse up.
     * NOTE: can't just fire over and over again by clicking
     * max value on the toggle because this is a "change" event,
     * and only fires when a value changes. */
    autoplayToggle.addEventListener("change", function() {
        toggleAutoplay();
    });
    moodRange.addEventListener("change", function() {
        changeBackgroundColor(+this.value + 1);
    });
    triangleRange.addEventListener("change", function() {
        const activeWaves = getActiveWaveTypes();
        if(+this.value === 0 && activeWaves.length === 1  && !activeWaves.includes("triangle")) {
            this.value = "1"; // disallow triangle from being toggled off if it's the only one
        }
    });
    otherRanges.forEach((range) => {
        range.addEventListener("change", function() {
            let activeWaves = getActiveWaveTypes();
            if(+this.value === 0 && activeWaves.length === 1 && !activeWaves.includes("triangle")) {
                triangleRange.value = "1"; // disallow triangle from being toggled off if it's the only one
            }
        });
    });
    // we are autoplay from the get go.
    generateSound();
    // and start evolving the sound from the get go.
    evolveSound();
}