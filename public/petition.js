var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var drawing = false;
var signature = document.getElementById('signature');
var resetButton = document.querySelector("button[name='reset']");
var first = true;

resetButton.addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    signature.value = "";
    signHere();
    first = true;
});

var signHere = () => {
    context.fillStyle = "grey";
    context.font = "14px Roboto, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "bottom";
    context.beginPath();
    context.fillText("Signature", 175, 135);
    context.closePath();
};

signHere();

canvas.addEventListener("mousedown", event => {
    if (first) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        first = false;
    }
    context.strokeStyle = "blue";
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
