// Pure Functions
const setNoteFrequencyFromClick = (note, event) => {
    const visualizer = document.getElementById("Visualizer");
    // "snap" our targetFrequency to currentScale
    const intervalGuess = Math.floor((event.clientX / visualizer.clientWidth) * getCurrentScale().length);
    note.frequency = getHarmonicNoteFrequency(getCurrentScale()[intervalGuess]);
    return note;
};

const setClickPositionFromNoteFrequency = (note, event) => {
    return getRelativeValue(
        note.frequency,
        getHarmonicNoteFrequency(getCurrentScale()[getCurrentScale().length - 1]),
        0,
        document.getElementById("Visualizer").clientWidth
    );
};

/**
 * Will get an x & y position given a click event.
 * Will return null if provided no event.
 * @param {HTMLEvent} event
 */
const getNotePosition = event => {
    let xPosition, yPosition;
    if(event) {
        xPosition = event["overrideX"] ? event.overrideX : event.clientX;
        yPosition = event["overrideX"] ? getRange(50, document.getElementById("Visualizer").clientHeight - 50) : event.clientY;
    }
    return {
        x: event ? xPosition : null,
        y: event ? yPosition : null
    };
};

// Non-Pure Functions
/**
 * Will draw the expanding circle factoring in volume
 * as opacity (out of 1.0). Also handles getting the note
 * position from the event.
 * @param {Number} echoDelay
 * @param {HTMLEvent} event
 * @param {Number} volume
 * @param {Number} delay
 */
function drawNoteWithVolumeBasedOpacity(echoDelay, event, volume, delay) {
    let coords = getNotePosition(event);
    if(echoDelay && delay) {
        setTimeout(function() {
            drawNoteCircle(coords.x, coords.y, volume);
        }, delay * 1000);
    }
    else if(echoDelay) {
        drawNoteCircle(coords.x, coords.y, volume);
    }
    else if(delay) {
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
 * @param {Number} x
 * @param {Number} y
 * @param {Number} opacity
 */
function drawNoteCircle(x, y, opacity = controls.volume.max) {
    let newCircle = document.createElement("span");
    newCircle.classList.add("note-circle");
    newCircle.style.left = x + "px";
    newCircle.style.top = y + "px";
    // ""+var is a string cast
    newCircle.style.opacity = ""+(opacity / controls.volume.max);
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