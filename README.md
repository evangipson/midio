# midio
midio is a web-based generative synthesizer "radio" which uses the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) and [TypeScript](https://www.typescriptlang.org/) to create tones of varying lengths and intervals based on some user input (which lives in a control panel) and internal logic, defined in the source code.

The user can either load up the page and just listen while midio generates an ever-evolving song for them, or turn autoplay off and click the colorful area that takes up most of the screen and experiment with the inputs to have some fun.

midio started as a randomly generated sequence of MIDI notes based on a scale, then it was moved forward by my curiosity toward [functional programming](https://en.wikipedia.org/wiki/Functional_programming) and the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API).

| midio Readme |
|---|
| [Built With](#built-with) |
| [Compiling](#compiling) |
| [TODO](#todo) |

# Built With
* [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
* [TypeScript](https://www.typescriptlang.org/)
* [CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS3)
* [HTML5](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
* [Visual Studio Code](https://code.visualstudio.com/)
* [Google Chrome](https://www.google.com/chrome/)
* [npm](https://www.npmjs.com/)
* Additional Resources:
    * https://stackoverflow.com/questions/6343450/generating-sound-on-the-fly-with-javascript-html5
    * https://wiki.mozilla.org/Audio_Data_API#Complete_Example%3a_Creating_a_Web_Based_Tone_Generator
    * http://tobyho.com/2015/11/09/functional-programming-by-example/
    * https://medium.com/@cscalfani/so-you-want-to-be-a-functional-programmer-part-1-1f15e387e536

# Compiling
To compile the TypeScript in the project:
* Run ```npm install --save-dev typescript```
* When in Visual Studio Code, type **control + shift + B** to bring up your list of tasks.
* Start the ```tsc-watch``` task.
* Save any file, and you will now have a **src/main.js**, which is referenced by the main **index.html** file.
    * Note: This is due to the [tsconfig.json](https://github.com/evangipson/midio/blob/master/tsconfig.json) file.

# TODO
If you'd like to see what I have planned for midio, you can get an idea from the [issues page](https://github.com/evangipson/midio/issues). Feel free to help me by contributing pull requests which I will approve and merge.
