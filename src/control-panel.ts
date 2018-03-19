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
        currentInput.htmlInput.value = 0;
        if(control === "volume" || control === "softness" || control == "density") {
            currentInput.htmlInput.value = Math.floor(currentInput.min + currentInput.max / 2);
        }
        else if(control === "baseNote") {
            currentInput.htmlInput.value = baseTone;
        }
        else if(control === "autoplay" || control === "triangle") { // we do want triangle autoplay
            currentInput.htmlInput.value = 1;
        }
    }
}

function toggleDensityVisibility() {
    /* .parentElement is here because label is a direct parent of input,
    * and i need to hide/show the label as well. */
    let densityLabelWithInput = document.getElementById("Density").parentElement;
    // +variable = ParseInt(variable); unary operator
    if(+controls.autoplay.htmlInput.value === 0) {
        clearTimeout(autoplayEventLoop);
        densityLabelWithInput.style.display = "none";
    }
    else {
        generateSound();
        densityLabelWithInput.style.display = "block";
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
            currentInput.htmlInput.value = maybe(1, 0);
        }
    }
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
    let content = document.getElementById("ControlList");
    setControlMinimumsAndMaximums();
    randomizeControlsButton.addEventListener("click", function() {
        randomizeControlValues();
        toggleDensityVisibility();
    });
    showControlsButton.addEventListener("click", function() {
        // relies on the max height being set on the content
        if(content.style.maxHeight) {
            this.classList.remove("active");
            content.style.maxHeight = null;
        }
        else {
            this.classList.add("active");
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
    /* using "change" so this only runs on mouse up.
     * NOTE: can't just fire over and over again by clicking
     * max value on the toggle because this is a "change" event,
     * and only fires when a value changes. */
    autoplayToggle.addEventListener("change", function() {
        toggleDensityVisibility();
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
    }
    // we are autoplay from the get go.
    generateSound();
}