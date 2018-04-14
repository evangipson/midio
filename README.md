# [midio: generative synthesizer radio](http://evangipson.com/midio)
midio is a web-based generative synthesizer "radio" which uses the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) and [TypeScript](https://www.typescriptlang.org/) to create intertwining, evolving musical phrases on the fly.

It utilizes 4 basic oscillator waves (sine, sawtooth, square, and triangle), 3 noise waves (white, pink, and brown), filters (bandpass, lowpass, and highpass), delay, reverb (via convolution), and gain to create all of it's sounds. It features the ability to:
- Create musical phrases (melodies, chords, and arpeggios) with no user input
- Remember and play back those musical phrases (to increase the user's tonal familiarity with the song)
- Give the user an idea of the frequency of any note that is playing by hooking it's frequency to the x axis, then drawing a quick animation
- Have it's paramaters (oscillator waves, noise waves, LFO, etc.) modified in a control panel by the user
- "Evolve the song" by adjusting the control panel values regularly within a range of their current value

It can be used in the following ways:
- Load midio, sit back and listen while midio generates an ever-evolving song without any input
- Load midio, turn autoplay off, and click the colorful area that takes up most of the screen and experiment with the inputs to have some fun

midio started as a randomly generated sequence of MIDI notes based on a scale, then it was moved forward by my curiosity toward [functional programming](https://en.wikipedia.org/wiki/Functional_programming) and the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API).

| midio Readme |
|---|
| [Built With](#built-with) |
| [Compiling](#compiling) |
| [Contributing](#contributing) |
| [License](#license) |

# Built With
* [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
* [TypeScript](https://www.typescriptlang.org/)
* [CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS3)
* [HTML5](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
* [Visual Studio Code](https://code.visualstudio.com/)
* [Google Chrome](https://www.google.com/chrome/)
* [npm](https://www.npmjs.com/)
* [Impulse Reponses](https://en.wikipedia.org/wiki/Impulse_response) from [The Open Air Library](http://www.openairlib.net/)
* Additional Resources:
    * https://stackoverflow.com/questions/6343450/generating-sound-on-the-fly-with-javascript-html5
    * https://wiki.mozilla.org/Audio_Data_API#Complete_Example%3a_Creating_a_Web_Based_Tone_Generator
    * http://tobyho.com/2015/11/09/functional-programming-by-example/
    * https://medium.com/@cscalfani/so-you-want-to-be-a-functional-programmer-part-1-1f15e387e536
    * http://www.openairlib.net/auralizationdb/content/1st-baptist-nashville

# Compiling
To compile the TypeScript in the project:
* Run ```npm install --save-dev typescript```
* When in Visual Studio Code, type **control + shift + B** to bring up your list of tasks.
* Start the ```tsc-watch``` task.
* Save any file, and you will now have a **src/main.js**, which is referenced by the main **index.html** file.
    * Note: This is due to the [tsconfig.json](tsconfig.json) file.

# Contributing
Thank you so much for your interest in contributing to midio! You should read and follow the [code of conduct](CODE_OF_CONDUCT.md) and [contribution guidelines](CONTRIBUTING.md).

If you find a bug - then check out any [open issues](https://github.com/evangipson/midio/issues) to see if your bug is already reported. If not, [create a new issue](https://github.com/evangipson/midio/issues/new), please!

# License
midio is licensed under [AGPL 3.0](https://www.gnu.org/licenses/agpl-3.0.en.html). If you are interested, [take a look at midio's license](LICENSE).
