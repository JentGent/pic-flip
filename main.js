width = 800;
height = 800;
function setup() {
    createCanvas(800, 800);
}

let   DISPLAY_GRID = false,
      DISPLAY_DENSITY = false,
      DISPLAY_PARTICLES = true,
      GRAB_SIZE = 60,
      DRAW_SIZE = 30,
      GRAVITY = 0.001,
      DAMPING = 1,
      SIZE = 10,
      GRID_WIDTH = 80,
      GRID_HEIGHT = 80,
      COLLISION_GRID_WIDTH = (width / SIZE) | 0,
      COLLISION_GRID_HEIGHT = (height / SIZE) | 0,
      STIFFNESS = 1,
      FLIP = 0.5,
      SOLVER_ITERATIONS = 5,
      PARTICLE_COLLISION_ITERATIONS = 1,
      SUBSTEPS = 2;

const CELL_WIDTH = width / GRID_WIDTH,
      CELL_HEIGHT = height / GRID_HEIGHT,
      DENSITY = CELL_WIDTH / SIZE,
      INV_CELL_WIDTH = 1 / CELL_WIDTH,
      INV_CELL_HEIGHT = 1 / CELL_HEIGHT,
      COLLISION_CELL_WIDTH = width / COLLISION_GRID_WIDTH,
      COLLISION_CELL_HEIGHT = height / COLLISION_GRID_HEIGHT,
      INV_COLLISION_CELL_WIDTH = 1 / COLLISION_CELL_WIDTH,
      INV_COLLISION_CELL_HEIGHT = 1 / COLLISION_CELL_HEIGHT;

let xVelGrid = [], yVelGrid = [],
    xWgtGrid = [], yWgtGrid = [],
    wallGrid = [], coefGrid = [],
    collGrid = [], densGrid = [];
for(let i = 0; i < (GRID_WIDTH + 1) * GRID_HEIGHT; i += 1) {
    xVelGrid[i] = 0;
    xWgtGrid[i] = 0;
}
for(let i = 0; i < GRID_WIDTH * (GRID_HEIGHT + 1); i += 1) {
    yVelGrid[i] = 0;
    yWgtGrid[i] = 0;
}
for(let i = 0; i < GRID_WIDTH * GRID_HEIGHT; i += 1) {
    wallGrid[i] = i < GRID_WIDTH || i % GRID_WIDTH === 0 || (i + 1) % GRID_WIDTH === 0 || i > GRID_WIDTH * (GRID_HEIGHT - 1) ? 1 : 0;
    coefGrid[i] = 0;
    densGrid[i] = 0;
}
for(let i = 0; i < COLLISION_GRID_WIDTH * COLLISION_GRID_HEIGHT; i += 1) {
    collGrid[i] = [];
}
function clearGrid(g) {
    for(let i = 0, l = g.length; i < l; i += 1) {
        g[i] = 0;
    }
    return g;
}

let particles = [];

// for(let i = 0; i < 1500; i += 1) {
//     particles.push(CELL_WIDTH + SIZE / 2 + Math.random() * (width - CELL_WIDTH * 2 - SIZE), CELL_HEIGHT + SIZE / 2 + Math.random() * (height - CELL_HEIGHT * 2 - SIZE), 0, 0);
// }
function waterDrop(x, y, r) {
    let d = CELL_WIDTH / DENSITY;
    for(let i = x - r; i < x + r; i += d) {
        for(let j = y - r; j < y + r; j += d) {
            const dx = x - i, dy = y - j;
            if(dx * dx + dy * dy > r * r) { continue; }
            let bx = i / d | 0, by = j / d | 0;
            particles.push((bx + 0.5) * d, (by + 0.5) * d, 0, 0);
        }
    }
}
let dropletRadius = Math.sqrt((width - CELL_WIDTH * 2) * (height - CELL_HEIGHT * 2) / 2 / Math.PI);
waterDrop(width / 2, CELL_HEIGHT + dropletRadius, dropletRadius);
// for(let i = CELL_WIDTH + SIZE / 2; i < CELL_WIDTH + SIZE / 2 + (SIZE) * (((width - CELL_WIDTH * 2) / SIZE)) * 0.707106781; i += SIZE) {
//     for(let j = CELL_HEIGHT + SIZE / 2; j < CELL_HEIGHT + SIZE / 2 + (SIZE) * (((height - CELL_HEIGHT * 2) / SIZE)) * 0.707106781; j += SIZE) {
//         particles.push(i, j, 0, 0);
//     }
// }

function updateParticles(dt) {
    
    // integrate
    for(let i = 0; i < particles.length; i += 4) {
        let x = i, y = i + 1,
            xVel = i + 2, yVel = i + 3;
        particles[yVel] += GRAVITY * dt;
        particles[xVel] *= DAMPING;
        particles[yVel] *= DAMPING;
        if(mouseIsPressed && mouseButton === LEFT) {
            let dx = mouseX - particles[x], dy = mouseY - particles[y];
            if(dx * dx + dy * dy < GRAB_SIZE * GRAB_SIZE) {
                particles[xVel] = (mouseX - pmouseX) / dt / SUBSTEPS;
                particles[yVel] = (mouseY - pmouseY) / dt / SUBSTEPS;
            }
        }
        particles[y] += particles[yVel] * dt;
        for(let j = particles[x] - CELL_WIDTH, right = particles[x] + CELL_WIDTH; j <= right; j += CELL_WIDTH) {
            for(let k = particles[y] - CELL_HEIGHT, bottom = particles[y] + CELL_HEIGHT; k <= bottom; k += CELL_HEIGHT) {
                let bx = j * INV_CELL_WIDTH | 0,
                    by = k * INV_CELL_HEIGHT | 0;
                if(wallGrid[bx + by * GRID_WIDTH]) {
                    bx *= CELL_WIDTH;
                    by *= CELL_HEIGHT;
                    if(particles[x] > bx - SIZE / 2 && particles[x] < bx + CELL_WIDTH + SIZE / 2 && particles[y] > by - SIZE / 2 && particles[y] < by + CELL_HEIGHT + SIZE / 2) {
                        if(particles[y] > by + CELL_HEIGHT / 2) {
                            particles[y] = by + CELL_HEIGHT + SIZE / 2 + 0.1;
                        }
                        else {
                            particles[y] = by - SIZE / 2 - 0.1;
                        }
                        particles[yVel] = 0;
                    }
                }
            }
        }
        
        particles[x] += particles[xVel] * dt;
        for(let j = particles[x] - CELL_WIDTH, right = particles[x] + CELL_WIDTH; j <= right; j += CELL_WIDTH) {
            for(let k = particles[y] - CELL_HEIGHT, bottom = particles[y] + CELL_HEIGHT; k <= bottom; k += CELL_HEIGHT) {
                let bx = j * INV_CELL_WIDTH | 0,
                    by = k * INV_CELL_HEIGHT | 0;
                if(wallGrid[bx + by * GRID_WIDTH]) {
                    bx *= CELL_WIDTH;
                    by *= CELL_HEIGHT;
                    if(particles[x] > bx - SIZE / 2 && particles[x] < bx + CELL_WIDTH + SIZE / 2 && particles[y] > by - SIZE / 2 && particles[y] < by + CELL_HEIGHT + SIZE / 2) {
                        if(particles[x] > bx + CELL_WIDTH / 2) {
                            particles[x] = bx + CELL_WIDTH + SIZE / 2 + 0.1;
                        }
                        else {
                            particles[x] = bx - SIZE / 2 - 0.1;
                        }
                        particles[xVel] = 0;
                    }
                }
            }
        }
    }
    
    // collision
    for(let i = 0; i < particles.length; i += 4) {
        let x = i, y = i + 1,
            xVel = i + 2, yVel = i + 3;
        if(particles[x] < CELL_WIDTH + SIZE / 2) {
            particles[x] = CELL_WIDTH + SIZE / 2;
            particles[xVel] = 0;
        }
        else if(particles[x] > width - CELL_WIDTH - SIZE / 2) {
            particles[x] = width - CELL_WIDTH - SIZE / 2;
            particles[xVel] = 0;
        }
        if(particles[y] < CELL_HEIGHT + SIZE / 2) {
            particles[y] = CELL_HEIGHT + SIZE / 2;
            particles[yVel] = 0;
        }
        else if(particles[y] > height - CELL_HEIGHT - SIZE / 2) {
            particles[y] = height - CELL_HEIGHT - SIZE / 2;
            particles[yVel] = 0;
        }
    }
    // clear collision grid
    for(let i = 0; i < collGrid.length; i += 1) {
        collGrid[i].length = 0;
    }
    for(let i = 0; i < particles.length; i += 4) {
        let x = i, y = i + 1;
        let id = (particles[x] * INV_COLLISION_CELL_WIDTH | 0) + (particles[y] * INV_COLLISION_CELL_HEIGHT | 0) * COLLISION_GRID_WIDTH;
        let collCell = collGrid[id - 1];
        if(collCell) { collCell.push(i); }
        collCell = collGrid[id];
        if(collCell) { collCell.push(i); }
        collCell = collGrid[id + 1];
        if(collCell) { collCell.push(i); }
        
        collCell = collGrid[id - 1 - COLLISION_GRID_WIDTH];
        if(collCell) { collCell.push(i); }
        collCell = collGrid[id - COLLISION_GRID_WIDTH];
        if(collCell) { collCell.push(i); }
        collCell = collGrid[id + 1 - COLLISION_GRID_WIDTH];
        if(collCell) { collCell.push(i); }
        
        collCell = collGrid[id - 1 + COLLISION_GRID_WIDTH];
        if(collCell) { collCell.push(i); }
        collCell = collGrid[id + COLLISION_GRID_WIDTH];
        if(collCell) { collCell.push(i); }
        collCell = collGrid[id + 1 + COLLISION_GRID_WIDTH];
        if(collCell) { collCell.push(i); }
    }
    for(let iter = 0; iter < PARTICLE_COLLISION_ITERATIONS; iter += 1) {
        for(let i = 0; i < particles.length; i += 4) {
            let x = i, y = i + 1;
            let colls = collGrid[(particles[x] * INV_COLLISION_CELL_WIDTH | 0) + (particles[y] * INV_COLLISION_CELL_HEIGHT | 0) * COLLISION_GRID_WIDTH];
            if(colls) {
                for(let j = 0, l = colls.length; j < l; j += 1) {
                    if(colls[j] === i) { continue; }
                    const x2 = colls[j], y2 = colls[j] + 1;
                    let dx = (particles[x2] - particles[x]) || (Math.random() * 0.2 - 0.1),
                        dy = (particles[y2] - particles[y]) || (Math.random() * 0.2 - 0.1);
                    let d = dx * dx + dy * dy;
                    if(d > 0 && d < SIZE * SIZE) {
                        d = 1 / Math.sqrt(d);
                        d = SIZE * d * 0.5 - 0.5;
                        dx *= d;
                        dy *= d;
                        particles[x ] -= dx;
                        particles[y ] -= dy;
                        particles[x2] += dx;
                        particles[y2] += dy;
                    }
                }
            }
        }
        for(let i = 0; i < particles.length; i += 4) {
            let x = i, y = i + 1,
                xVel = i + 2, yVel = i + 3;
            if(particles[x] < CELL_WIDTH + SIZE / 2) {
                particles[x] = CELL_WIDTH + SIZE / 2;
                particles[xVel] = 0;
            }
            else if(particles[x] > width - CELL_WIDTH - SIZE / 2) {
                particles[x] = width - CELL_WIDTH - SIZE / 2;
                particles[xVel] = 0;
            }
            if(particles[y] < CELL_HEIGHT + SIZE / 2) {
                particles[y] = CELL_HEIGHT + SIZE / 2;
                particles[yVel] = 0;
            }
            else if(particles[y] > height - CELL_HEIGHT - SIZE / 2) {
                particles[y] = height - CELL_HEIGHT - SIZE / 2;
                particles[yVel] = 0;
            }
            for(let j = particles[x] - CELL_WIDTH, right = particles[x] + CELL_WIDTH; j <= right; j += CELL_WIDTH) {
                for(let k = particles[y] - CELL_HEIGHT, bottom = particles[y] + CELL_HEIGHT; k <= bottom; k += CELL_HEIGHT) {
                    let bx = j * INV_CELL_WIDTH | 0,
                        by = k * INV_CELL_HEIGHT | 0;
                    if(wallGrid[bx + by * GRID_WIDTH]) {
                        bx *= CELL_WIDTH;
                        by *= CELL_HEIGHT;
                        if(particles[x] >= bx - SIZE / 2 && particles[x] <= bx + CELL_WIDTH + SIZE / 2 && particles[y] >= by - SIZE / 2 && particles[y] <= by + CELL_HEIGHT + SIZE / 2) {
                            const dxl = particles[x] - bx, dxr = bx + CELL_WIDTH - particles[x],
                                  dyt = particles[y] - by, dyb = by + CELL_HEIGHT - particles[y];
                            if(dyt >= -SIZE / 2 && dyt <= dyb && dyt <= dxl && dyt <= dxr) {
                                particles[y] = by - SIZE / 2;
                                particles[yVel] = 0;
                            }
                            else if(dxl >= -SIZE / 2 && dxl <= dxr && dxl <= dyt && dxl <= dyb) {
                                particles[x] = bx - SIZE / 2;
                                particles[xVel] = 0;
                            }
                            else if(dxr >= -SIZE / 2 && dxr <= dxl && dxr <= dyt && dxr <= dyb) {
                                particles[x] = bx + CELL_WIDTH + SIZE / 2;
                                particles[xVel] = 0;
                            }
                            else if(dyb >= -SIZE / 2) {
                                particles[y] = by + CELL_HEIGHT + SIZE / 2;
                                particles[yVel] = 0;
                            }
                        }
                    }
                }
            }
        }
    }
}
function xVelsToCell(x, y, xVel) {
    const ROUNDED_X = x * INV_CELL_WIDTH | 0,
          ROUNDED_Y = (y * INV_CELL_HEIGHT - 0.5) | 0;
    let topLeft = ROUNDED_X + ROUNDED_Y * (GRID_WIDTH + 1),
        topRight = topLeft + 1,
        bottomLeft = topLeft + GRID_WIDTH + 1,
        bottomRight = bottomLeft + 1;
    let xLeft = ROUNDED_X * CELL_WIDTH,
        yTop = (ROUNDED_Y + 0.5) * CELL_HEIGHT;
    let rightWgt = (x - xLeft) * INV_CELL_WIDTH,
        bottomWgt = (y - yTop) * INV_CELL_HEIGHT;
    
    let id = ROUNDED_X + ROUNDED_Y * GRID_WIDTH;
    if(!wallGrid[id] && !wallGrid[id - 1]) {
        let weight = (1 - rightWgt) * (1 - bottomWgt);
        xVelGrid[topLeft] += xVel * weight;
        xWgtGrid[topLeft] += weight;
    }
    if(!wallGrid[id] && !wallGrid[id + 1]) {
        let weight = rightWgt * (1 - bottomWgt);
        xVelGrid[topRight] += xVel * weight;
        xWgtGrid[topRight] += weight;
    }
    if(!wallGrid[id + GRID_WIDTH] && !wallGrid[id + GRID_WIDTH - 1]) {
        let weight = (1 - rightWgt) * bottomWgt;
        xVelGrid[bottomLeft] += xVel * weight;
        xWgtGrid[bottomLeft] += weight;
    }
    if(!wallGrid[id + GRID_WIDTH] && !wallGrid[id + GRID_WIDTH + 1]) {
        let weight = rightWgt * bottomWgt;
        xVelGrid[bottomRight] += xVel * weight;
        xWgtGrid[bottomRight] += weight;
    }
}
function yVelsToCell(x, y, yVel) {
    const ROUNDED_X = (x * INV_CELL_WIDTH - 0.5) | 0,
          ROUNDED_Y = y * INV_CELL_HEIGHT | 0;
    let topLeft = ROUNDED_X + ROUNDED_Y * GRID_WIDTH,
        topRight = topLeft + 1,
        bottomLeft = topLeft + GRID_WIDTH,
        bottomRight = bottomLeft + 1;
    let xLeft = (ROUNDED_X + 0.5) * CELL_WIDTH,
        yTop = ROUNDED_Y * CELL_HEIGHT;
    let rightWgt = (x - xLeft) * INV_CELL_WIDTH,
        bottomWgt = (y - yTop) * INV_CELL_HEIGHT;
    
    if(!wallGrid[topLeft] && !wallGrid[topLeft - GRID_WIDTH]) {
        let weight = (1 - rightWgt) * (1 - bottomWgt);
        yVelGrid[topLeft] += yVel * weight;
        yWgtGrid[topLeft] += weight;
    }
    if(!wallGrid[topLeft + 1] && !wallGrid[topLeft - GRID_WIDTH + 1]) {
        let weight = rightWgt * (1 - bottomWgt);
        yVelGrid[topRight] += yVel * weight;
        yWgtGrid[topRight] += weight;
    }
    if(!wallGrid[topLeft] && !wallGrid[topLeft + GRID_WIDTH]) {
        let weight = (1 - rightWgt) * bottomWgt;
        yVelGrid[bottomLeft] += yVel * weight;
        yWgtGrid[bottomLeft] += weight;
    }
    if(!wallGrid[topLeft] && !wallGrid[topLeft + GRID_WIDTH + 1]) {
        let weight = rightWgt * bottomWgt;
        yVelGrid[bottomRight] += yVel * weight;
        yWgtGrid[bottomRight] += weight;
    }
}
function addDensity(x, y) {
    const ROUNDED_X = (x * INV_CELL_WIDTH - 0.5) | 0,
          ROUNDED_Y = (y * INV_CELL_HEIGHT - 0.5) | 0;
    let topLeft = ROUNDED_X + ROUNDED_Y * GRID_WIDTH,
        topRight = topLeft + 1,
        bottomLeft = topLeft + GRID_WIDTH,
        bottomRight = bottomLeft + 1;
    let xLeft = (ROUNDED_X + 0.5) * CELL_WIDTH,
        yTop = (ROUNDED_Y + 0.5) * CELL_HEIGHT;
    let rightWgt = (x - xLeft) * INV_CELL_WIDTH,
        bottomWgt = (y - yTop) * INV_CELL_HEIGHT;
    
    densGrid[topLeft] += (1 - rightWgt) * (1 - bottomWgt) * !wallGrid[topLeft];
    densGrid[topRight] += rightWgt * (1 - bottomWgt) * !wallGrid[topRight];
    densGrid[bottomLeft] += (1 - rightWgt) * bottomWgt * !wallGrid[bottomLeft];
    densGrid[bottomRight] += rightWgt * bottomWgt * !wallGrid[bottomRight];
}
function particleVelsToGrid() {
    clearGrid(xVelGrid);
    clearGrid(yVelGrid);
    clearGrid(xWgtGrid);
    clearGrid(yWgtGrid);
    clearGrid(coefGrid);
    clearGrid(densGrid);
    for(let i = 0; i < particles.length; i += 4) {
        let x = particles[i], y = particles[i + 1],
            xVel = particles[i + 2], yVel = particles[i + 3];
        let id = (x * INV_CELL_WIDTH | 0) + (y * INV_CELL_HEIGHT | 0) * GRID_WIDTH;
        if(!wallGrid[id]) {
            xVelsToCell(x, y, xVel);
            yVelsToCell(x, y, yVel);
        }
    
        // this is a water cell
        coefGrid[id] = 1;
    }
    for(let i = 0; i < xVelGrid.length; i += 1) {
        if(xWgtGrid[i]) {
            xVelGrid[i] /= xWgtGrid[i];
        }
    }
    for(let i = 0; i < yVelGrid.length; i += 1) {
        if(yWgtGrid[i]) {
            yVelGrid[i] /= yWgtGrid[i];
        }
    }
    
    for(let i = 0; i < particles.length; i += 4) {
        let x = particles[i], y = particles[i + 1];
        addDensity(x, y);
    }
}
function copyGrid() {
    return [xVelGrid.slice(0), yVelGrid.slice(0)];
}
function applyGrid(grid) {
    const xVels = grid[0],
          yVels = grid[1];
    for(let i = 0, l = xVels.length; i < l; i += 1) {
        xVelGrid[i] = xVels[i];
    }
    for(let i = 0, l = yVels.length; i < l; i += 1) {
        yVelGrid[i] = yVels[i];
    }
}
function solve() {
    for(let i = 0; i < SOLVER_ITERATIONS; i += 1) {
        let stored = copyGrid();
        let xVels = stored[0],
            yVels = stored[1];
        for(let xCell = 0; xCell < GRID_WIDTH; xCell += 1) {
            for(let yCell = 0; yCell < GRID_HEIGHT; yCell += 1) {
                let id = xCell + yCell * GRID_WIDTH;
                if(!wallGrid[id] && coefGrid[id]) {
                    const LEFT_IS_NOT_WALL = !wallGrid[id - 1],
                        RIGHT_IS_NOT_WALL = !wallGrid[id + 1],
                        TOP_IS_NOT_WALL = !wallGrid[id - GRID_WIDTH],
                        BOTTOM_IS_NOT_WALL = !wallGrid[id + GRID_WIDTH];
                    let divisor = LEFT_IS_NOT_WALL + RIGHT_IS_NOT_WALL + TOP_IS_NOT_WALL + BOTTOM_IS_NOT_WALL;
                    if(!divisor) { continue; }
                    let left = xCell + yCell * (GRID_WIDTH + 1),
                        right = left + 1,
                        top = xCell + yCell * GRID_WIDTH,
                        bottom = top + GRID_WIDTH;
                    let divergence = (
                                    xVelGrid[right] * RIGHT_IS_NOT_WALL - 
                                    xVelGrid[left] * LEFT_IS_NOT_WALL + 
                                    yVelGrid[bottom] * BOTTOM_IS_NOT_WALL - 
                                    yVelGrid[top] * TOP_IS_NOT_WALL - 
                                    Math.max(0, STIFFNESS * (densGrid[id] - DENSITY))
                                    ) / divisor;
                    xVels[left] += divergence * LEFT_IS_NOT_WALL;
                    xVels[right] -= divergence * RIGHT_IS_NOT_WALL;
                    yVels[top] += divergence * TOP_IS_NOT_WALL;
                    yVels[bottom] -= divergence * BOTTOM_IS_NOT_WALL;
                }
            }
        }
        applyGrid(stored);
    }
}
function xCellVelsToParticle(i, xVelsBeforeSolve) {
    const x = particles[i],
          y = particles[i + 1];
    let xVel = i + 2;
    
    const ROUNDED_X = x * INV_CELL_WIDTH | 0,
          ROUNDED_Y = (y * INV_CELL_HEIGHT - 0.5) | 0;
    
    let topLeft = ROUNDED_X + ROUNDED_Y * (GRID_WIDTH + 1),
        topRight = topLeft + 1,
        bottomLeft = topLeft + GRID_WIDTH + 1,
        bottomRight = bottomLeft + 1;
    let xLeft = ROUNDED_X * CELL_WIDTH,
        yTop = (ROUNDED_Y + 0.5)  * CELL_HEIGHT;
    let rightWgt = (x - xLeft) * INV_CELL_WIDTH,
        bottomWgt = (y - yTop) * INV_CELL_HEIGHT;
    
    let topLeftVel = xVelGrid[topLeft],
        topRightVel = xVelGrid[topRight],
        bottomLeftVel = xVelGrid[bottomLeft],
        bottomRightVel = xVelGrid[bottomRight];
    let topLeftWgt = (1 - rightWgt) * (1 - bottomWgt),
        topRightWgt = rightWgt * (1 - bottomWgt),
        bottomLeftWgt = (1 - rightWgt) * bottomWgt,
        bottomRightWgt = rightWgt * bottomWgt;
    particles[xVel] = (
                       topLeftVel * topLeftWgt + 
                       topRightVel * topRightWgt + 
                       bottomLeftVel * bottomLeftWgt + 
                       bottomRightVel * bottomRightWgt
                      ) * (1 - FLIP) + 
                      (particles[xVel] + 
                       (topLeftVel - xVelsBeforeSolve[topLeft]) * topLeftWgt + 
                       (topRightVel - xVelsBeforeSolve[topRight]) * topRightWgt + 
                       (bottomLeftVel - xVelsBeforeSolve[bottomLeft]) * bottomLeftWgt + 
                       (bottomRightVel - xVelsBeforeSolve[bottomRight]) * bottomRightWgt
                      ) * FLIP;
}
function yCellVelsToParticle(i, yVelsBeforeSolve) {
    const x = particles[i],
          y = particles[i + 1];
    let yVel = i + 3;
    
    let topLeft = ((x * INV_CELL_WIDTH - 0.5) | 0) + (y * INV_CELL_HEIGHT | 0) * GRID_WIDTH,
        topRight = topLeft + 1,
        bottomLeft = topLeft + GRID_WIDTH,
        bottomRight = bottomLeft + 1;
    let xLeft = (((x * INV_CELL_WIDTH - 0.5) | 0) + 0.5) * CELL_WIDTH,
        yTop = (y * INV_CELL_HEIGHT | 0)  * CELL_HEIGHT;
    let rightWgt = (x - xLeft) * INV_CELL_WIDTH,
        bottomWgt = (y - yTop) * INV_CELL_HEIGHT;
    
    let topLeftVel = yVelGrid[topLeft],
        topRightVel = yVelGrid[topRight],
        bottomLeftVel = yVelGrid[bottomLeft],
        bottomRightVel = yVelGrid[bottomRight];
    let topLeftWgt = (1 - rightWgt) * (1 - bottomWgt),
        topRightWgt = rightWgt * (1 - bottomWgt),
        bottomLeftWgt = (1 - rightWgt) * bottomWgt,
        bottomRightWgt = rightWgt * bottomWgt;
    particles[yVel] = (
                        topLeftVel * topLeftWgt + 
                        topRightVel * topRightWgt + 
                        bottomLeftVel * bottomLeftWgt + 
                        bottomRightVel * bottomRightWgt
                        ) * (1 - FLIP) + 
                        (particles[yVel] + 
                        (topLeftVel - yVelsBeforeSolve[topLeft]) * topLeftWgt + 
                        (topRightVel - yVelsBeforeSolve[topRight]) * topRightWgt + 
                        (bottomLeftVel - yVelsBeforeSolve[bottomLeft]) * bottomLeftWgt + 
                        (bottomRightVel - yVelsBeforeSolve[bottomRight]) * bottomRightWgt
                        ) * FLIP;
}
function gridVelsToParticles(gridBeforeSolve) {
    for(let i = 0; i < particles.length; i += 4) {
        xCellVelsToParticle(i, gridBeforeSolve[0]);
        yCellVelsToParticle(i, gridBeforeSolve[1]);
    }
}

function display() {
    if(DISPLAY_DENSITY) {
        for(let i = 0; i < width; i += CELL_WIDTH) {
            for(let j = 0; j < height; j += CELL_HEIGHT) {
                let xCell = i * INV_CELL_WIDTH | 0,
                    yCell = j * INV_CELL_HEIGHT | 0;
                let id = xCell + yCell * GRID_WIDTH;
                let d = densGrid[id];
                if(!d) { continue; }
                fill(Math.min(255, map(d, 0, DENSITY, 255, 0)), Math.min(255, map(d, 0, DENSITY, 255, 100)), 255);
                rect(i, j, CELL_WIDTH, CELL_HEIGHT);
            }
        }
    }
    if(DISPLAY_GRID) {
        stroke(50);
        strokeWeight(1);
        noFill();
        for(let i = 0; i < width; i += CELL_WIDTH) {
            for(let j = 0; j < height; j += CELL_HEIGHT) {
                rect(i, j, CELL_WIDTH, CELL_HEIGHT);
            }
        }
        stroke(0, 255, 0);
        for(let i = 0; i <= GRID_WIDTH; i += 1) {
            for(let j = 0; j < GRID_HEIGHT; j += 1) {
                let x = i * CELL_WIDTH,
                    y = j * CELL_HEIGHT + CELL_HEIGHT / 2;
                line(x, y, x + xVelGrid[i + j * (GRID_WIDTH + 1)] * 10, y);
            }
        }
        for(let i = 0; i < GRID_WIDTH; i += 1) {
            for(let j = 0; j <= GRID_HEIGHT; j += 1) {
                let x = i * CELL_WIDTH + CELL_WIDTH / 2,
                    y = j * CELL_HEIGHT;
                line(x, y, x, y + yVelGrid[i + j * (GRID_WIDTH)] * 10);
            }
        }
    }
    
    if(DISPLAY_PARTICLES) {
        strokeWeight(SIZE);
        for(let i = 0; i < particles.length; i += 4) {
            const x = particles[i],
                  y = particles[i + 1];
            const ROUNDED_X = (x * INV_CELL_WIDTH - 0.5) | 0,
                ROUNDED_Y = (y * INV_CELL_HEIGHT - 0.5) | 0;
            let topLeft = ROUNDED_X + ROUNDED_Y * GRID_WIDTH,
                topRight = topLeft + 1,
                bottomLeft = topLeft + GRID_WIDTH,
                bottomRight = bottomLeft + 1;
            let xLeft = (ROUNDED_X + 0.5) * CELL_WIDTH,
                yTop = (ROUNDED_Y + 0.5) * CELL_HEIGHT;
            let rightWgt = (x - xLeft) * INV_CELL_WIDTH,
                bottomWgt = (y - yTop) * INV_CELL_HEIGHT;
            let d = densGrid[topLeft] * (1 - rightWgt) * (1 - bottomWgt) + densGrid[topRight] * rightWgt * (1 - bottomWgt) + densGrid[bottomLeft] * (1 - rightWgt) * bottomWgt + densGrid[bottomRight] * rightWgt * bottomWgt;
            stroke(Math.min(255, map(d, 0, DENSITY, 255, 0)), Math.min(255, map(d, 0, DENSITY, 255, 100)), 255);
            point(x, y);
        }
    }
    
    noStroke();
    fill(50);
    for(let i = 0; i < width; i += CELL_WIDTH) {
        for(let j = 0; j < height; j += CELL_HEIGHT) {
            let xCell = i * INV_CELL_WIDTH | 0,
                yCell = j * INV_CELL_HEIGHT | 0;
            let id = xCell + yCell * GRID_WIDTH;
            if(wallGrid[id]) {
                rect(i, j, CELL_WIDTH, CELL_HEIGHT);
            }
        }
    }
}

let pt = 0;
function draw() {
    let t = (function() { return this.window; })().performance.now(),
         DT = t - (pt || t),
         dt = Math.min(30, DT);
    
    background(0);
    
    let erasing = keyIsPressed, drawing = mouseIsPressed && mouseButton === RIGHT;
    if(erasing || drawing) {
        for(let i = Math.max(mouseX - DRAW_SIZE, CELL_WIDTH); i < Math.min(mouseX + DRAW_SIZE, width - CELL_WIDTH); i += CELL_WIDTH) {
            for(let j = Math.max(mouseY - DRAW_SIZE, CELL_HEIGHT); j < Math.min(mouseY + DRAW_SIZE, height - CELL_HEIGHT); j += CELL_HEIGHT) {
                let dx = mouseX - i, dy = mouseY - j;
                if(dx * dx + dy * dy > DRAW_SIZE * DRAW_SIZE) { continue; }
                let x = i * INV_CELL_WIDTH | 0, y = j * INV_CELL_HEIGHT | 0;
                let id = x + y * GRID_WIDTH;
                wallGrid[id] = erasing ? 0 : 1;
            }
        }
    }
    
    dt /= SUBSTEPS;
    for(let iter = 0; iter < SUBSTEPS; iter += 1) {
        updateParticles(dt);
        
        particleVelsToGrid();
        const gridBeforeSolve = copyGrid();
        solve();
        gridVelsToParticles(gridBeforeSolve);
    }
    
    display();
    fill(255);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(15);
    text(DT, 0, 0);
    pt = t;
}
