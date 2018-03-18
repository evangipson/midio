// Non-Pure Functions
/**
 * Wires up the close/open functionality of the controls menu.
 */
function setControlMinimumsAndMaximums() {
    let currentInput;
    for(let control in controls) {
        currentInput = (<HTMLInputElement>document.getElementById(controls[control].htmlName));
        currentInput.min = controls[control].min;
        currentInput.max = controls[control].max;
    }
}

/**
 * Painfully iterative. Handles the event listeners for the
 * control panel.
 */
function hookUpControlEventListeners() {
    let lfoRangeControl = (<HTMLInputElement>document.getElementById("LFORange"));
    lfoRangeControl.addEventListener("change", function() {
        currentLFORange = this.value;
    });
    let lfoDepthControl = (<HTMLInputElement>document.getElementById("LFODepth"));
    lfoDepthControl.addEventListener("change", function() {
        currentLFODepth = this.value;
    });
}

function enableControlMenu() {
    let showControlsButton = document.getElementById("ShowControls");
    let content = document.getElementById("ControlList");
    setControlMinimumsAndMaximums();
    hookUpControlEventListeners();
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