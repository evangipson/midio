document.addEventListener("DOMContentLoaded", function() {
    enableControlMenu();
    document.getElementById("Visualizer").addEventListener("click", function(event) {
        playNoteOnClick(event);
    });
    generateSound();
});