document.addEventListener("DOMContentLoaded", function() {
    enableControlMenu();
    document.getElementById("Visualizer").addEventListener("mousedown", function() {
        noteTimingEventHandler = setInterval(function(){
            clickedNoteLength = clickedNoteLength + 0.5;
        }, 100);
    });
    document.getElementById("Visualizer").addEventListener("click", function(event) {
        clearInterval(noteTimingEventHandler);
        generateSound(event);
        clickedNoteLength = 0;
    });
});