 // using ECMAScript 6
 'use strict';
 
 // Variables
 const audioContext = getAudioContext(); // used to chain audio
 let circles = []; // used to keep track of circles which represent notes
 
 // Pure Functions
 /**
  * Gives back an audio context.
  * Source: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
  */
 function getAudioContext() {
     // one context per document
     return new (window.AudioContext || window.webkitAudioContext)();
 }
 
 /**
  * Gives back a random array item, provided
  * the array.
  * @param {Array} array 
  */
 function getRandomArrayItem(array) {
     return array[Math.floor(Math.random()*array.length)];
 }
 
 /**
  * Gives back a number in the range provided.
  * @param {Number} min 
  * @param {Number} max 
  */
 function getRange(min, max) {
     return Math.floor(Math.random() * max) + min;
 }
 
 /**
  * Gets a type of oscillator, also has an array
  * which controls oscillators that can be generated.
  */
 function getOscillatorType() {
     return getRandomArrayItem([
         "sine",
         "sawtooth",
         "triangle",
         "pusle"]
     );
 }
 
 /**
  * Gets a frequency for an oscillator.
  */
 function getOscillatorFrequency() {
     return getRange(100, 800);
 }
 
 function getGainNode(volume) {
     if(volume > 1.0) {
         return audioContext.createGain().
                 gain.setValueAtTime(volume, 1);
     }
     return null;
 }
 
 function getNotePosition(event) {
     return {
         x: event ? event.x : null,
         y: event ? event.y : null
     };
 }
 
 function setOscProperties(osc, type, frequency) {
     osc.type = type;
     osc.frequency.setValueAtTime(frequency, 0);
     return osc;
 }
 
 /**
  * Connects an oscillator to a destination of
  * the node passed in.
  */
 function connectOscNode(gainNode) {
     let osc = audioContext.createOscillator(); // instantiate an oscillator
     if(gainNode) {
         osc.connect(gainNode);
         gainNode.connect(audioContext.destination);
         return gainNode;
     }
     else {
         osc.connect(audioContext.destination);
         return osc;
     }
 }
 
 // Non-Pure Functions
 /**
  * Will play a MIDI note. Plays a sine wave
  * at 440hz for 1 second by default.
  * @param {String} type of waveform. default is sine.
  * @param {Number} frequency in Hz. default is 440.
  * @param {Number} time in seconds. default is .5s.
  * @param {Number} volume from 0 to 1. default is 1.0.
  * @param {Number} echoDelay in milliseconds. default is false.
  * @param {HTMLEvent} event to give us x and y
  */
 function playMIDINote(type = "sine", frequency = 440, time = 0.5, volume = 1.0, echoDelay = false, event = false) {
     const osc = connectOscNode(getGainNode(volume));
     setOscProperties(osc, type, frequency);
     osc.start();
     osc.stop(audioContext.currentTime + time);
 
     drawNote(echoDelay, event, volume);
     // handle recursive echo notes
     if(echoDelay && volume >= 0.2) {
         volume = volume - 0.2;
         window.setTimeout(function() {
             playMIDINote(type, frequency, time, volume, echoDelay, event);
         }, echoDelay);
     }
 }
 
 // Not pure because it's random
 function getRandomNoteDuration() {
     return Math.random() * 0.4 + 0.08;
 }
 
 function assembleNormalNote() {
     return {
         type: getOscillatorType(),
         frequency: getOscillatorFrequency(),
         time: getRandomNoteDuration(),
         echoDelay: getRange(500, 2000), // in ms
     }
 }
 
 function drawNote(echoDelay, event, volume) {
     let coords = getNotePosition(event);
     if(echoDelay) {
         drawNoteCircle(coords.x, coords.y, volume);
     }
     else {
         drawNoteCircle(coords.x, coords.y);
     }
 }
 
 function playRandomEchoNote(event) {
     /* as long as we provide an echoDelay, we'll
      * hear an echo. */
     const note = assembleNormalNote();
     playMIDINote(note.type, note.frequency, note.time, 1, note.echoDelay, event);
 }
 /* function playQuietNote() {
     // Passing volume is easy!
     const note = assembleNormalNote();
     playMIDINote(this.type, this.frequency, this.time, 0.1);
 }
 function playNote() {
     const note = assembleNormalNote();
     playMIDINote(this.type, this.frequency, this.time);
 } */
 
 function enableControlMenu() {
     let showControlsButton = document.getElementById("ShowControls");
     let content = document.getElementById("ControlList");
     showControlsButton.addEventListener("click", function() {
         // relies on the max height being set on the content
         if(content.style.maxHeight) {
             this.classList.remove("active");
             content.style.maxHeight = null;
         }
         else {
             this.classList.add("active");
             content.style.maxHeight = content.scrollHeight + "px";
         }
     });
 }
 
 function drawNoteCircle(x, y, opacity = "1.0") {
     let newCircle = document.createElement("span");
     newCircle.classList.add("note-circle");
     newCircle.style.left = x + "px";
     newCircle.style.top = y + "px";
     newCircle.style.opacity = opacity;
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
 
 document.addEventListener("DOMContentLoaded", function() {
     enableControlMenu();
     document.getElementById("Visualizer").addEventListener("click", function(event) {
         playRandomEchoNote(event);
     });
 });