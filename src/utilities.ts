// Pure Functions
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

// Non-Pure Functions
/**
 * Will return the first provided input... maybe.
 * Otherwise returns the second input. If no second
 * input is provided and first check fails, this function
 * will return null.
 * Note: Isn't a pure function because it doesn't guarantee
 * the same output given the same inputs, or in other words,
 * it deals with Math.random().
 * @param {Object} condition will return... maybe.
 * @param {Object} defaultCondition will return if
 * the first condition fails.
 * @param {Number} weight 0 to 100. how likely it is
 * the first condition should happen, in percentage.
 */
const maybe = (condition, defaultCondition = null, weight = 50) => {
    if(Math.random() < weight / 100) {
        return condition;
    }
    else if(defaultCondition) {
        return defaultCondition;
    }
    return null;
};