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
    let newCircle = circles[noteAnimationIndex];
    newCircle.classList.add("note-circle");
    newCircle.style.left = x + "px";
    noteAnimationIndex = (noteAnimationIndex + 1) <= 10 ? (noteAnimationIndex + 1) : 0; // gotta animate the next note, with wrap
    circleActiveEventLoop = window.setTimeout(function() {
        newCircle.classList.add("active"); // "turn on" the animation in a sec
    }, 100);
    circleEventLoop = window.setTimeout(function() {
        noteAnimationIndex = (noteAnimationIndex - 1) >= 0 ? (noteAnimationIndex - 1) : 0; // gotta animate the next note, with wrap
    }, 2000); // keep the delay consistent with the CSS
}