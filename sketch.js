// p5.js Sketch Variables
let vector;
let isDragging = false;
let matrix = [[2, 0], [0, 3]]; // Initial matrix
let eigenvalues = [];
let eigenvectors = [];

// p5.js Setup
function setup() {
    const canvas = createCanvas(600, 600);
    canvas.parent('canvas-container');
    vector = createVector(100, 50); // Initial vector
    frameRate(30);
}

// Main Drawing Function
function draw() {
    background(255);
    translate(width/2, height/2);
    scale(1, -1); // Mathematical Y-axis orientation
    
    drawGrid();
    drawAxes();
    updateMatrixFromInputs();
    calculateEigens();

    // Draw vectors
    drawVector(vector, color(30, 120, 200), 'Original Vector');
    const transformed = applyMatrixTransformation(vector);
    drawVector(transformed, color(200, 50, 50), 'Transformed Vector');

    // Draw eigenvectors
    if (eigenvalues.length === 2 && !eigenvalues.some(λ => math.isComplex(λ))) {
        eigenvectors.forEach((ev, i) => {
            const col = color(50 + i*100, 200, 100);
            drawEigenvector(ev, eigenvalues[i], col);
        });
    }
}


// Helper Functions
function drawGrid() {
    stroke(200);
    strokeWeight(1);
    for(let x = -width/2; x <= width/2; x += 50) {
        line(x, -height/2, x, height/2);
    }
    for(let y = -height/2; y <= height/2; y += 50) {
        line(-width/2, y, width/2, y);
    }
}

function drawAxes() {
    stroke(0);
    strokeWeight(2);
    line(-width/2, 0, width/2, 0); // X-axis
    line(0, -height/2, 0, height/2); // Y-axis
}

function drawVector(v, col, label) {
    // Draw vector line
    stroke(col);
    strokeWeight(2);
    line(0, 0, v.x, v.y);

    // Draw arrowhead
    push();
    translate(v.x, v.y);
    rotate(v.heading());
    fill(col);
    noStroke();
    triangle(0, 0, -10, 5, -10, -5);
    pop();

    // Draw label with proper orientation
    if (label) {
        // Convert vector position to screen coordinates
        const screenX = width/2 + v.x;
        const screenY = height/2 - v.y; // Flip Y for screen space
        
        push();
        resetMatrix(); // Return to default screen space
        fill(col);
        textSize(18);
        textAlign(LEFT, CENTER);
        text(label, screenX + 10, screenY + 5);
        pop();
    }
}


function drawEigenvector(ev, λ, col) {
    const scaledEv = ev.map(x => x * 100 * Math.abs(λ));
    const v = createVector(scaledEv[0], scaledEv[1]);
    drawVector(v, col, `λ = ${λ.toFixed(2)}`);
}

// Matrix Operations
function applyMatrixTransformation(v) {
    return createVector(
        matrix[0][0] * v.x + matrix[0][1] * v.y,
        matrix[1][0] * v.x + matrix[1][1] * v.y
    );
}

function updateMatrixFromInputs() {
    matrix = [
        [parseFloat(document.getElementById('a11').value) || 0,
            parseFloat(document.getElementById('a12').value) || 0],
        [parseFloat(document.getElementById('a21').value) || 0,
            parseFloat(document.getElementById('a22').value) || 0]
    ];
}

// Eigenvalue Calculation
function calculateEigens() {
    const a = matrix[0][0];
    const b = matrix[0][1];
    const c = matrix[1][0];
    const d = matrix[1][1];
    
    try {
        // Calculate eigenvalues using characteristic equation
        const trace = a + d;
        const det = a * d - b * c;
        const discriminant = trace * trace - 4 * det;
        
        if (discriminant < 0) {
            // Complex eigenvalues
            eigenvalues = [];
            eigenvectors = [];
            document.getElementById('eigen-display').innerHTML = `
                <p class="warning">Complex eigenvalues: λ = ${(trace/2).toFixed(2)} ± ${(Math.sqrt(-discriminant)/2).toFixed(2)}i</p>
            `;
            return;
        }

        // Real eigenvalues
        const sqrtDisc = Math.sqrt(discriminant);
        eigenvalues = [
            (trace + sqrtDisc) / 2,
            (trace - sqrtDisc) / 2
        ];

        // Calculate eigenvectors
        eigenvectors = eigenvalues.map(λ => {
            // Solve (A - λI)v = 0
            const matrixMinusλI = [
                [a - λ, b],
                [c, d - λ]
            ];
            
            // Find non-trivial solution
            if (matrixMinusλI[0][0] !== 0 || matrixMinusλI[0][1] !== 0) {
                return [matrixMinusλI[0][1], -matrixMinusλI[0][0]];
            }
            return [matrixMinusλI[1][1], -matrixMinusλI[1][0]];
        });

        // Normalize eigenvectors
        eigenvectors = eigenvectors.map(ev => {
            const length = Math.sqrt(ev[0]**2 + ev[1]**2);
            return length > 0 ? [ev[0]/length, ev[1]/length] : [0, 0];
        });

        // Display results
        let displayHTML = '';
        eigenvalues.forEach((λ, i) => {
            displayHTML += `
                <div class="eigen-item">
                    <strong>λ${i+1}:</strong> ${λ.toFixed(2)}<br>
                    <strong>v${i+1}:</strong> [${eigenvectors[i][0].toFixed(2)}, ${eigenvectors[i][1].toFixed(2)}]
                </div>
            `;
        });
        document.getElementById('eigen-display').innerHTML = displayHTML;

    } catch (error) {
        document.getElementById('eigen-display').innerHTML = 
            `<p class="error">Error: ${error.message}</p>`;
    }
}

// Preset Handler
function updatePreset(type) {
    const transformations = {
        identity() {
            return [[1, 0], [0, 1]];
        },
        rotation() {
            const θ = Math.PI/6; // 30 degrees
            return [
                [Math.cos(θ), -Math.sin(θ)],
                [Math.sin(θ), Math.cos(θ)]
            ];
        },
        shear() {
            return [[1, 0.2], [0, 1]]; // Shear factor 0.2
        },
        scale() {
            return [[1.1, 0], [0, 1.1]]; // Scale 10%
        }
    };

    const currentMatrix = [
        [parseFloat(document.getElementById('a11').value) || 0,
        parseFloat(document.getElementById('a12').value) || 0],
        [parseFloat(document.getElementById('a21').value) || 0,
        parseFloat(document.getElementById('a22').value) || 0]
    ];

    let newMatrix;
    if (type === 'identity') {
        newMatrix = transformations.identity();
    } else {
        const transform = transformations[type]();
        newMatrix = multiplyMatrices(transform, currentMatrix);
    }

    // Update matrix inputs
    document.getElementById('a11').value = newMatrix[0][0].toFixed(2);
    document.getElementById('a12').value = newMatrix[0][1].toFixed(2);
    document.getElementById('a21').value = newMatrix[1][0].toFixed(2);
    document.getElementById('a22').value = newMatrix[1][1].toFixed(2);
}

function multiplyMatrices(a, b) {
    return [
        [
            a[0][0] * b[0][0] + a[0][1] * b[1][0],
            a[0][0] * b[0][1] + a[0][1] * b[1][1]
        ],
        [
            a[1][0] * b[0][0] + a[1][1] * b[1][0],
            a[1][0] * b[0][1] + a[1][1] * b[1][1]
        ]
    ];
}


// Vector Dragging Logic
function mousePressed() {
    const mx = mouseX - width/2;
    const my = height/2 - mouseY;
    const d = dist(mx, my, vector.x, vector.y);
    isDragging = d < 20;
}

function mouseDragged() {
    if (isDragging) {
        vector.x = mouseX - width/2;
        vector.y = height/2 - mouseY;
    }
}

function mouseReleased() {
    isDragging = false;
}