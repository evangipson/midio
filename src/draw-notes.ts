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
            animateNextActiveNote(visualNotes[noteAnimationIndex], coords.x, coords.y);
        }, delay * 1000);
    }
    else {
        animateNextActiveNote(visualNotes[noteAnimationIndex], coords.x, coords.y);
    }
}

/**
 * Takes care of drawing the notes on screen. Originally
 * intended to be called by playAndShowNote().
 * @param x
 * @param y
 */
function animateNextActiveNote(noteSpan: HTMLSpanElement, x: number, y: number) {
    noteSpan.style.left = x + "px";
    // "turn on" the animation in a sec
    requestAnimationFrame(function() {
        noteSpan.classList.add("active");
        // ensure we'll animate the next note next time
        noteAnimationIndex = (noteAnimationIndex + 1) < ACTIVE_NOTES ? (noteAnimationIndex + 1) : 0;
        circleEventLoop = window.setTimeout(function() {
            noteSpan.classList.remove("active"); // "turn off" the animation when complete
        }, 2000); // keep the delay consistent with the CSS*/
    });
}