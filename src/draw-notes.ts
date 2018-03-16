// Non-Pure Functions
/**
 * Will draw the expanding circle factoring in volume
 * as opacity (out of 1.0). Also handles getting the note
 * position from the event.
 * @param {Number} echoDelay
 * @param {HTMLEvent} event
 * @param {Number} volume
 */
function drawNoteWithVolumeBasedOpacity(echoDelay, event, volume) {
    let coords = getNotePosition(event);
    if(echoDelay) {
        drawNoteCircle(coords.x, coords.y, volume);
    }
    else {
        drawNoteCircle(coords.x, coords.y);
    }
}

/**
 * Wires up the close/open functionality of the controls menu.
 */
function enableControlMenu() {
    let showControlsButton = document.getElementById("ShowControls");
    let content = document.getElementById("ControlList");
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

/**
 * Takes care of drawing the expanding notes on screen.
 * Intended to be called by playMIDINote() so shouldn't be called directly.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} opacity
 */
function drawNoteCircle(x, y, opacity = "1.0") {
    let newCircle = document.createElement("span");
    newCircle.classList.add("note-circle");
    newCircle.style.left = x + "px";
    newCircle.style.top = y + "px";
    newCircle.style.opacity = opacity;
    document.getElementById("Visualizer").appendChild(newCircle);
    circles.push(newCircle);
    window.setTimeout(function() {
        newCircle.classList.add("active"); // "turn on" the animation in a sec
    }, 100);
    window.setTimeout(function() {
        // remove the first circle
        var removedCircle = circles.shift();
        document.getElementById("Visualizer").removeChild(removedCircle);
    }, 2000); // keep the delay consistent with the CSS
}