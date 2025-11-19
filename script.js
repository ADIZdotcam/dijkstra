const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 400;

const infoTable = document.getElementById("info-table").querySelector("tbody");
const nextBtn = document.getElementById("next");
const resetBtn = document.getElementById("reset");
const openClosedDiv = document.getElementById("open-closed-display");

// Define nodes and edges
const nodes = {
    A: { x: 50, y: 100 },
    B: { x: 200, y: 50 },
    C: { x: 350, y: 100 },
    D: { x: 150, y: 200 },
    E: { x: 300, y: 250 },
    F: { x: 450, y: 200 },
    G: { x: 400, y: 350 },
    H: { x: 200, y: 350 }
};

const edges = [
    ["A", "B", 4], ["A", "D", 2],
    ["B", "C", 3], ["B", "D", 5],
    ["C", "E", 7], ["C", "F", 6],
    ["D", "E", 3], ["D", "H", 8],
    ["E", "G", 2], ["F", "G", 4],
    ["H", "G", 5]
];

const startNode = "A";
const goalNode = "G";

// Draw graph nodes and edges
function drawGraph(openSet, closedSet) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    edges.forEach(([start, end, weight]) => {
        const { x: startX, y: startY } = nodes[start];
        const { x: endX, y: endY } = nodes[end];

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const angle = Math.atan2(endY - startY, endX - startX);
        const offset = 15;
        const weightX = midX + offset * Math.cos(angle + Math.PI / 2);
        const weightY = midY + offset * Math.sin(angle + Math.PI / 2);
        ctx.fillStyle = "red";
        ctx.font = "14px Arial";
        ctx.fillText(weight, weightX, weightY);
    });

    Object.keys(nodes).forEach(node => {
        ctx.beginPath();
        ctx.arc(nodes[node].x, nodes[node].y, 20, 0, 2 * Math.PI);

        if (node === startNode) ctx.fillStyle = "green";
        else if (node === goalNode) ctx.fillStyle = "cyan";
        else if (visitedNodes[node].fixed) ctx.fillStyle = "#ff9999"; // fixed node
        else if (openSet.map(n => n.node).includes(node)) ctx.fillStyle = "#90ee90"; // in open set
        else ctx.fillStyle = "lightblue";

        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText(node, nodes[node].x - 5, nodes[node].y + 5);
    });
}

// Initialize visitedNodes
function initializeVisitedNodes() {
    const visited = {};
    Object.keys(nodes).forEach(node => {
        visited[node] = {
            g: node === startNode ? 0 : Infinity,
            prevG: node === startNode ? 0 : Infinity,
            from: "-",
            fixed: node === startNode
        };
    });
    return visited;
}

// Initialize
let openSet = [{ node: startNode, g: 0, from: null }];
let closedSet = [];
let visitedNodes = initializeVisitedNodes();

// Dijkstra Step
function dijkstraStep() {
    if (openSet.length === 0) return;

    openSet.sort((a, b) => a.g - b.g);
    const current = openSet.shift();

    visitedNodes[current.node].fixed = true;
    closedSet.push(current.node);

    // Relax edges
    edges.forEach(([from, to, cost]) => {
        if (from !== current.node) return;
        if (visitedNodes[to].fixed) return;

        const g = current.g + cost;
        const prevG = visitedNodes[to].g;

        if (g < visitedNodes[to].g) {
            visitedNodes[to].prevG = prevG;
            visitedNodes[to].g = g;
            visitedNodes[to].from = current.node;

            const existing = openSet.find(n => n.node === to);
            if (!existing) openSet.push({ node: to, g, from: current.node });
            else existing.g = g;
        }
    });

    updateTable();
    drawGraph(openSet, closedSet);
    updateOpenClosedDisplay(current.node);

    if (current.node === goalNode) {
        drawShortestPath();
        printPathText();
    }
}

// Update Table
function updateTable() {
    infoTable.innerHTML = "";
    Object.entries(visitedNodes).forEach(([node, { g, prevG, from, fixed }]) => {
        const row = document.createElement("tr");
        if (fixed) row.style.backgroundColor = "#ffcccc";
        row.innerHTML = `<td>${node}</td><td>${prevG} → ${g}</td><td>${from || "-"}</td>`;
        infoTable.appendChild(row);
    });
}

// Update priority queue display
function updateOpenClosedDisplay(chosenNode = "-") {
    const iteration = closedSet.length;
    const openSetText = openSet.map(n => `${n.node}(${n.g})`).join(", ");
    openClosedDiv.innerHTML = `Iteration ${iteration}: Priority Queue = {${openSetText}}; Node Chosen = ${chosenNode}`;
}

// Draw shortest path on canvas
function drawShortestPath() {
    let current = goalNode;
    ctx.strokeStyle = "purple";
    ctx.lineWidth = 4;

    while (current && visitedNodes[current]?.from !== null && visitedNodes[current].from !== "-") {
        const fromNode = visitedNodes[current].from;
        const { x: x1, y: y1 } = nodes[current];
        const { x: x2, y: y2 } = nodes[fromNode];

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        current = fromNode;
    }
}

// Print shortest path as text
function printPathText() {
    let path = [];
    let current = goalNode;
    while (current && visitedNodes[current]?.from !== null && visitedNodes[current].from !== "-") {
        path.push(current);
        current = visitedNodes[current].from;
    }
    path.push(startNode);
    path.reverse();
    openClosedDiv.innerHTML += `<br>Shortest Path: ${path.join(" → ")}`;
}

// Next Step
nextBtn.addEventListener("click", () => {
    dijkstraStep();
});

// Reset
resetBtn.addEventListener("click", () => {
    openSet = [{ node: startNode, g: 0, from: null }];
    closedSet = [];
    visitedNodes = initializeVisitedNodes();
    infoTable.innerHTML = "";
    drawGraph([], []);
    openClosedDiv.innerHTML = "";
});

// Initial draw
drawGraph([], []);
