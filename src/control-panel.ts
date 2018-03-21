// Non-Pure Functions
/**
 * Runs through our list of controls, defined in
 * definitions.ts, and populates their minimum
 * and maximum values, and also sets the default
 * values for each control.
 */
function setControlMinimumsAndMaximums() {
    let currentInput;
    for(let control in controls) {
        currentInput = controls[control];
        currentInput.htmlInput.min = currentInput.min;
        currentInput.htmlInput.max = currentInput.max;
        // Set initial values
        if(currentInput.max > 1) {
            currentInput.htmlInput.value = getRange(currentInput.min, currentInput.max);
        }
        else {
            currentInput.htmlInput.value = maybe("1", "0");
        }
        // Now override .value if needed per control
        if(control === "volume") { // curate volume
            currentInput.htmlInput.value = Math.floor(currentInput.min + currentInput.max / 2);
        }
        else if(control === "autoplay" || control === "triangle") { // we do want triangle autoplay
            currentInput.htmlInput.value = 1;
        }
    }
}

/**
 * Will adjust the nextInput's value by just a little amount, maybe.
 * Note: Doesn't effect volume, autoplay, or triangle.
 * @param nextInput string value which will act as an index on controls.
 */
function evolveSound(nextInput = getRandomArrayItem(Object.keys(controls))) {
    if(nextInput && controls[nextInput]) {
        const oldValue = controls[nextInput].htmlInput.value;
        if(controls[nextInput].max === 1 && nextInput != "triangle" && nextInput != "autoplay") { // don't change triangle or turn off autoplay
            controls[nextInput].htmlInput.value = maybe("1", "0");
        }
        else if(nextInput != "volume") { // don't evolve volume
            let attemptedIncrement = getRange(+controls[nextInput].htmlInput.value - +controls[nextInput].htmlInput.max * 0.2, +controls[nextInput].htmlInput.value + +controls[nextInput].htmlInput.max * 0.2);
            if(attemptedIncrement >= controls[nextInput].htmlInput.min && attemptedIncrement <= controls[nextInput].htmlInput.max) {
                controls[nextInput].htmlInput.value = ""+attemptedIncrement;
            }
        }
        console.log("took %s from %s to %s", nextInput, oldValue, controls[nextInput].htmlInput.value)
        nextInput = getRandomArrayItem(Object.keys(controls));
        /* in an amount of time, call itself again, because
         * we want to make the radio interesting over time. */
        const msUntilNextControlChange = getRange(maximumDensity - getCurrentDensity(), maximumDensity) * 500; // in ms
        autoplayEventLoop = window.setTimeout(function() {
            evolveSound(nextInput);
        }, msUntilNextControlChange);
    }
}

function toggleAutoplay() {
    // +variable = ParseInt(variable); unary operator
    if(+controls.autoplay.htmlInput.value === 0) {
        clearTimeout(autoplayEventLoop);
    }
    else {
        generateSound();
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
    const otherRanges = [
        <HTMLInputElement>document.getElementById("Sine"),
        <HTMLInputElement>document.getElementById("Square"),
        <HTMLInputElement>document.getElementById("Saw")
    ]
    let autoplayToggle = <HTMLInputElement>document.getElementById("Autoplay");
    setControlMinimumsAndMaximums();
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
    triangleRange.addEventListener("change", function() {
        const activeWaves = getActiveWaveTypes();
        if(+this.value === 0 && activeWaves.length === 1 && activeWaves[0] === "triangle") {
            this.value = "1"; // disallow triangle from being toggled off if it's the only one
        }
    });
    otherRanges.forEach((range) => {
        range.addEventListener("change", function() {
            const activeWaves = getActiveWaveTypes();
            if(+this.value === 0 && activeWaves.length === 1 && activeWaves[0] === "triangle") {
                triangleRange.value = "1"; // disallow triangle from being toggled off if it's the only one
            }
        });
    });
    // we are autoplay from the get go.
    generateSound();
    // and start evolving the sound from the get go.
    evolveSound();
}