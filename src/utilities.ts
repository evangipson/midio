// Pure Functions
/**
 * Will run the provided function... maybe.
 * @param {Function} func
 */
const maybe = func => {
    if(Math.random() > 0.50) {
        return func;
    }
    return null;
};

/**
 * Gives back a random array item, provided
 * the array.
 * @param {Array} array
 */
const getRandomArrayItem = array => array[Math.floor(Math.random()*array.length)];

/**
 * Gives back a number in the range provided.
 * @param {Number} min
 * @param {Number} max
 */
const getRange = (min, max) => Math.floor(Math.random() * max) + min;

/**
 * Creates a click event somewhere randomly on the visualizer,
 * within a window of the gutter provided, and returns the event.
 * @param {Number} screenGutter how much edge of the screen to give, in px.
 */
const getFakeMouseClick = (screenGutter = 100) => {
    const bestGuessX = getRange(screenGutter, document.getElementById("Visualizer").offsetWidth - screenGutter);
    const bestGuessY = getRange(screenGutter, document.getElementById("Visualizer").offsetHeight - screenGutter);
    return new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true,
        'clientX': bestGuessX,
        'clientY': bestGuessY
    });
};
