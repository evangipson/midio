// Non-Pure Functions
/**
 * Wires up the close/open functionality of the controls menu.
 */
function setControlMinimumsAndMaximums() {
    let currentInput;
    for(let control in controls) {
        currentInput = controls[control];
        currentInput.htmlInput.min = currentInput.min;
        currentInput.htmlInput.max = currentInput.max;
    }
}

function enableControlMenu() {
    let showControlsButton = document.getElementById("ShowControls");
    let content = document.getElementById("ControlList");
    setControlMinimumsAndMaximums();
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