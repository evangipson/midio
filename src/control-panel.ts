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
    }
}

/**
 * Randomizes all control panel values.
 */
function randomizeControlValues() {
    let currentInput;
    for(let control in controls) {
        currentInput = controls[control];
        currentInput.htmlInput.value = getRange(currentInput.min, currentInput.max);
    }
}

/**
 * Wires up the close/open functionality of the controls menu.
 */
function enableControlMenu() {
    let showControlsButton = document.getElementById("ShowControls");
    let randomizeControlsButton = document.getElementById("RandomizeControls");
    let content = document.getElementById("ControlList");
    setControlMinimumsAndMaximums();
    randomizeControlsButton.addEventListener("click", randomizeControlValues);
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
}