document.addEventListener("DOMContentLoaded", function() {
    const visualizer = document.getElementById("Visualizer");
    if(visualizer) {
        enableControlMenu();
        visualizer.addEventListener("mousedown", function() {
            noteTimingEventHandler = setInterval(function(){
                clickedNoteLength = clickedNoteLength + 0.5;
            }, 100);
        });
        visualizer.addEventListener("click", function(event) {
            clearInterval(noteTimingEventHandler);
            generateSound(event);
            clickedNoteLength = 0;
        });
    }
});