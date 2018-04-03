// Pure Functions
/**
 * Creates a click event somewhere randomly on the visualizer,
 * within a window of the gutter provided, and returns the event.
 * Will return null if no visualizer div is present.
 * @param screenGutter how much edge of the screen to give, in px.
 */
const getFakeMouseClick = (screenGutter = 300) => {
    const visualizerElement = document.getElementById("Visualizer");
    let click = new MouseEvent("", undefined);
    if(visualizerElement) {
        const bestGuessX = getRange(screenGutter, visualizerElement.offsetWidth - screenGutter);
        const bestGuessY = getRange(screenGutter, visualizerElement.offsetHeight - screenGutter);
        click = new MouseEvent('click', {
            'view': window,
            'bubbles': true,
            'cancelable': true,
            'clientX': bestGuessX,
            'clientY': bestGuessY
        });
    }
    return click;
};

/**
 * Takes in a value and will generate another number
 * within a defined range, then returns that number.
 * @param initialValue
 * @param maxInitialValue
 * @param minResult
 * @param maxResult
 */
const getRelativeValue = (initialValue = 0, maxInitialValue = 100, minResult: number, maxResult: number) =>
    ((initialValue / maxInitialValue) * maxResult) + minResult;

// Non-Pure Functions
/**
 * Will return the first provided input... maybe.
 * Otherwise returns the second input. If no second
 * input is provided and first check fails, this function
 * will return null.
 * Note: Isn't a pure function because it doesn't guarantee
 * the same output given the same inputs, or in other words,
 * it deals with Math.random().
 * @param condition will return... maybe.
 * @param defaultCondition will return if
 * the first condition fails.
 * @param weight 0 to 100. how likely it is
 * the first condition should happen, in percentage.
 */
const maybe = (condition: any, defaultCondition: any = null, weight = 50) => {
    if(Math.random() < weight / 100) {
        return condition;
    }
    else if(defaultCondition || defaultCondition === 0) { // sometimes i want 0 to return from this
        return defaultCondition;
    }
    return null;
};

/**
 * Gives back a random array item, provided
 * the array.
 * @param array
 */
const getRandomArrayItem = (array:any[]) => array[Math.floor(Math.random()*array.length)];

/**
 * Gives back a number in the range provided.
 * @param min
 * @param max
 */
const getRange = (min: number, max: number) => Math.random() * (max - min) + min;