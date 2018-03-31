// Pure Functions
/**
 * Will set a note's frequency given a MouseEvent.
 * If no visualizer is present, will return the same note without
 * changing frequency.
 * @param note
 * @param event 
 */
const setNoteFrequencyFromClick = (note: Note, event: MouseEvent) => {
    const visualizer = document.getElementById("Visualizer");
    if(visualizer) {
        // "snap" our targetFrequency to currentScale
        const intervalGuess = Math.floor((event.clientX / visualizer.clientWidth) * getCurrentScale().length);
        note.frequency = getHarmonicNoteFrequency(getCurrentScale()[intervalGuess]);
    }
    return note;
};

/**
 * Will set a click's X position given a frequency based on
 * the current scale. If no visualizer is present, will return
 * 0.
 * @param note 
 * @param event 
 */
const setClickPositionFromNoteFrequency = (note: Note, event: MouseEvent) => {
    const visualizer = document.getElementById("Visualizer");
    let clickXPosition = 0;
    if(visualizer) {
        clickXPosition = getRelativeValue(
            note.frequency,
            getHarmonicNoteFrequency(getCurrentScale()[getCurrentScale().length - 1]),
            0,
            visualizer.clientWidth
        );
    }
    return clickXPosition;
};

/**
 * Will get an x & y position given a click event.
 * Will return null if provided no event. If no
 * event or visualizer is given, will return {x:0, y:0}.
 * @param {CustomMouseEvent} event
 */
const getNotePosition = (event: CustomMouseEvent) => {
    let xPosition = 0;
    let yPosition = 0;
    const visualizer = document.getElementById("Visualizer");
    if(event.event && visualizer) {
        xPosition = event.overrideX ? event.overrideX : event.event.clientX;
        yPosition = event.overrideX ? getRange(200, visualizer.clientHeight - 200) : event.event.clientY;
    }
    return {
        x: event.event ? xPosition : 0,
        y: event.event ? yPosition : 0
    };
};

// Non-Pure Functions
/**
 * Will draw the expanding circle factoring in volume
 * as opacity (out of 1.0). Also handles getting the note
 * position from the event.
 * @param {MouseEvent} event
 * @param {Number} volume
 * @param {Number} delay
 */
function drawNoteWithVolumeBasedOpacity(event: CustomMouseEvent, volume: number, delay: number) {
    let coords = getNotePosition(event);
    if(delay) {
        setTimeout(function() {
            drawNoteCircle(coords.x, coords.y, volume);
        }, delay * 1000);
    }
    else {
        drawNoteCircle(coords.x, coords.y);
    }
}

/**
 * Takes care of drawing the expanding notes on screen.
 * Intended to be called by playAndShowNote(), shouldn't be called directly.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} opacity
 */
function drawNoteCircle(x: number, y: number, opacity = controls.volume.max) {
    let newCircle = document.createElement("span");
    const visualizer = document.getElementById("Visualizer");
    if(visualizer) {
        newCircle.classList.add("note-circle");
        newCircle.style.left = x + "px";
        newCircle.style.top = y + "px";
        // ""+var is a string cast
        newCircle.style.opacity = ""+(opacity / controls.volume.max);
        visualizer.appendChild(newCircle);
        circles.push(newCircle);
        window.setTimeout(function() {
            newCircle.classList.add("active"); // "turn on" the animation in a sec
        }, 100);
        window.setTimeout(function() {
            // remove the first circle
            const removedCircle = circles.shift();
            if(removedCircle) {
                visualizer.removeChild(removedCircle);
            }
        }, 2000); // keep the delay consistent with the CSS
    }
}