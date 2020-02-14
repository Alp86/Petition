var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var drawing = false;
var signature = document.getElementById('signature');



canvas.addEventListener("mousedown", event => {
    context.beginPath();
    context.moveTo(event.offsetX, event.offsetY);
    drawing = true;
    console.log("down");
});

canvas.addEventListener("mousemove", event => {
    if (drawing) {
        context.lineTo(event.offsetX, event.offsetY);
        context.stroke();
    }
});

document.addEventListener("mouseup", () => {
    if (drawing) {
        context.closePath();
        drawing = false;
        signature.value = canvas.toDataURL();
    }
});
