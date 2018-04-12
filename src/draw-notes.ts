/**
 * Will draw the expanding circle factoring in volume
 * as opacity (out of 1.0). Also handles getting the note
 * position from the event.
 * @param event
 * @param volume
 * @param delay
 */
function drawNoteWithVolumeBasedOpacity(event: CustomMouseEvent, volume: number, delay: number) {
    const coords = getNotePosition(event);
    if(delay) {
        setTimeout(function() {
            drawNoteCircle(coords.x, coords.y);
        }, delay * 1000);
    }
    else {
        drawNoteCircle(coords.x, coords.y);
    }
}

/**
 * Takes care of drawing the expanding notes on screen.
 * Intended to be called by playAndShowNote(), shouldn't be called directly.
 * @param x
 * @param y
 */
function drawNoteCircle(x: number, y: number) {
    let newCircle = document.createElement("span");
    const visualizer = document.getElementById("Visualizer");
    if(visualizer) {
        newCircle.classList.add("note-circle");
        newCircle.style.left = x + "px";
        visualizer.appendChild(newCircle);
        circles.push(newCircle);
        circleActiveEventLoop = window.setTimeout(function() {
            newCircle.classList.add("active"); // "turn on" the animation in a sec
        }, 100);
        circleEventLoop = window.setTimeout(function() {
            // remove the first circle
            let removedCircle:any = circles.shift();
            if(removedCircle) {
                visualizer.removeChild(removedCircle);
            }
        }, 2000); // keep the delay consistent with the CSS
    }
}