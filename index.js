const canvas = document.getElementById('drawing-board');
const toolbar = document.getElementById('toolbar');
const drawOptionsBar = document.getElementById('doptions');
const ctx = canvas.getContext('2d');

const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let isPainting = false;
let lineWidth = 1;
let startPosition = { x: 0, y: 0 };
let lineCoordinates = { x: 0, y: 0 };
let drawOptions = "free-hand";
var clicks = [];
var canvasHistory = {
  undo_list: [],
  saveState: function (canvas, list) {
    (list || this.undo_list).push(canvas.toDataURL());
  },
  undo: function (canvas, ctx) {
    this.restoreState(canvas, ctx, this.undo_list);
  },
  restoreState: function (canvas, ctx, pop) {
    if (pop.length) {
      var restore_state = pop.pop();
      let img = document.createElement('img');
      img.setAttribute(
        'src',
        restore_state,
      );
      img.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      }
    }
  }
}

const clearCanvas = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

const distance = (x1, y1, x2, y2) => { return Math.sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1))); }

toolbar.addEventListener('click', e => {
  if (e.target.id === 'clear') {
    clearCanvas();
  }
});

toolbar.addEventListener('change', e => {
  if (e.target.id === 'stroke') {
    ctx.strokeStyle = e.target.value;
  }

  if (e.target.id === 'lineWidth') {
    lineWidth = e.target.value;
  }

});

drawOptionsBar.addEventListener('change', e => {
  if (e?.target?.value) {
    drawOptions = e.target.value;
  }
  if (drawOptions === "polygon")
    alert("Click to make points of polygon!")
});

//download button event listener
document.querySelector('#download').addEventListener('click', () => {
  let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
  const element = document.createElement('a');
  const filename = 'test.png';
  element.setAttribute('href', image);
  element.setAttribute('download', filename);

  element.click();
})

//share button event listener
document.querySelector('#share').addEventListener('click', () => {
  let image = canvas.toDataURL("image/png");
  alert(`Please use this url to share \n${image}`);
})

//undo functionality
document.querySelector('#undo').addEventListener('click', () => {
  return canvasHistory.undo(canvas, ctx);
})

const drawLine = (e) => {
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  const clientOffset = getClientOffset(e);
  if (distance(clientOffset.x, clientOffset.y, startPosition.x, startPosition.y) > 20) {
    ctx.beginPath();
    ctx.moveTo(startPosition.x, startPosition.y);
    ctx.lineTo(clientOffset.x, clientOffset.y);
    ctx.stroke();
    startPosition = getClientOffset(e);
  }
}

const freeHandDraw = (e) => {
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineTo(e.clientX - canvasOffsetX, e.clientY);
  ctx.stroke();
}
const polygonDraw = (e) => {
  canvas.width = canvas.width; // Clears the canvas 
  drawPolygon();
  drawPoints();
}

const circleDraw = (e) => {
  const clientOffset = getClientOffset(e);
  clearCanvas();
  ctx.beginPath();
  const currOffsetX = clientOffset.x;
  const currOffsetY = clientOffset.y;
  const startOffsetX = startPosition.x;
  const startOffsetY = startPosition.x;
  ctx.moveTo(startOffsetX, startOffsetY + (currOffsetY - startOffsetY) / 2);
  ctx.bezierCurveTo(startOffsetX, startOffsetY, currOffsetX, startOffsetY, currOffsetX, startOffsetY + (currOffsetY - startOffsetY) / 2);
  ctx.bezierCurveTo(currOffsetX, currOffsetY, startOffsetX, currOffsetY, startOffsetX, startOffsetY + (currOffsetY - startOffsetY) / 2);
  ctx.stroke();
  ctx.closePath();
}


const draw = (e) => {
  if (!isPainting) {
    return;
  }
  switch (drawOptions) {
    case "free-hand": return freeHandDraw(e);
    case "line": return drawLine(e);
    case "circle": return circleDraw(e);
    default: return freeHandDraw(e);
  }
}

const getClientOffset = (event) => {
  const { clientX, clientY } = event;
  const x = parseInt(clientX - canvasOffsetX);
  const y = parseInt(clientY - canvasOffsetY);

  return {
    x,
    y
  }
}

function drawPolygon() {
  ctx.fillStyle = 'white';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(clicks[0].x, clicks[0].y);
  for (var i = 1; i < clicks.length; i++) {
    ctx.lineTo(clicks[i].x, clicks[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

function drawPoints() {
  ctx.strokeStyle = "black";
  ctx.lineJoin = "round";
  ctx.lineWidth = lineWidth;

  for (var i = 0; i < clicks.length; i++) {
    ctx.beginPath();
    ctx.arc(clicks[i].x, clicks[i].y, 3, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.stroke();
  }
};


canvas.addEventListener('mousedown', (e) => {
  isPainting = true;
  startPosition = getClientOffset(e);
  canvasHistory.saveState(canvas);
});

canvas.addEventListener('mouseup', e => {
  isPainting = false;
  ctx.stroke();
  ctx.beginPath();
  if (drawOptions === "polygon") {
    const clientOffset = getClientOffset(e);
    clicks.push({
      x: clientOffset.x,
      y: clientOffset.y
    });
    polygonDraw(e);
  }
});

canvas.addEventListener('mousemove', draw);
