/**
 * Will draw the note on the visualizer, also
 * handles getting the note position from the event
 * provided.
 * @param event
 * @param delay
 */
function drawNoteOnVisualizer(event: CustomMouseEvent, delay: number) {
    const coords = getNotePosition(event);
    if(delay) {
        circleActiveEventLoop = window.setTimeout(function() {
            animateNextActiveNote(coords.x, coords.y);
        }, delay * 1000);
    }
    else {
        // "turn on" the animation
        animateNextActiveNote(coords.x, coords.y);
    }
}

/**
 * Takes care of drawing the notes on screen. Originally
 * intended to be called by playAndShowNote().
 * @param x
 * @param y
 */
function animateNextActiveNote(x: number, y: number) {
    // get the next non-active note span
    let noteSpan = visualNotes[noteAnimationIndex];
    noteSpan.classList.add("active");
    noteSpan.style.left = x + "px";
    noteAnimationIndex = (noteAnimationIndex + 1) < ACTIVE_NOTES ? (noteAnimationIndex + 1) : 0;
    circleEventLoop = window.setTimeout(function() {
        noteSpan.classList.remove("active"); // "turn off" the animation when complete
        //noteAnimationIndex = (noteAnimationIndex - 1) > 0 ? (noteAnimationIndex - 1) : ACTIVE_NOTES - 1;
    }, 2000); // keep the delay consistent with the CSS*/
}