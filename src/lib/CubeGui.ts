import * as THREE from 'three';
import type { Cube } from './Cube';

type Sticker = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>
type Piece = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>

type StickersRecord = {
    [face: string]: Array<Sticker>
};

type MoveAxis = {
    move: string,
    offset: number,
}

interface piecesGeneration{
    pieces3D: Array<Array<Array<Piece>>>;
    pieces: Array<Piece>;
    movesToPiecesMap: Record<string, Record<number, Array<Piece>>>;
    piecesToMovesMap: Record<string, MoveAxis[]>;
}

interface stickersGeneration{
    stickers: StickersRecord;
    stickersToMovesMap: Record<string, string>;
}

const posVectors: Record<string, THREE.Vector3> = {
    F : new THREE.Vector3( 0, 0, 1 ), // ->  1  1  0 
    B : new THREE.Vector3( 0, 0,-1 ), // -> -1 -1  0
    U : new THREE.Vector3( 0, 1, 0 ), // ->  1  0  1
    D : new THREE.Vector3( 0,-1, 0 ), // -> -1  0 -1
    R : new THREE.Vector3( 1, 0, 0 ), // ->  0  1  1
    L : new THREE.Vector3(-1, 0, 0 ), // ->  0 -1 -1
};

const swapVectors: Record<string, THREE.Vector2> = {
    F : new THREE.Vector2( 0, 1 ),
    B : new THREE.Vector2( 0, 0 ),
    U : new THREE.Vector2( 0, 0 ),
    D : new THREE.Vector2( 1, 0 ),
    R : new THREE.Vector2( 1, 1 ),
    L : new THREE.Vector2( 1, 0 ),
}

class pieceGenerator3D {
    cube: Cube
    size: number
    scene: THREE.Scene | null
    // Cache geometries to reuse
    private geometryCache: Map<string, THREE.BoxGeometry> = new Map();
    
    constructor(cube: Cube, size: number, scene: THREE.Scene | null = null){
        this.cube = cube;
        this.size = size;
        this.scene = scene;
    }

    #getIndexesFromMove(move: string, offset: number): Array<THREE.Vector3>{
        // OPTIMIZATION: Remove console.log in production for better performance
        // console.log(move, offset)
        const indexes: Array<THREE.Vector3> = []

        const posVector = posVectors[move]
        // const shiftVector = this.#shiftVector(posVector, true);

        const reverse = (posVector.x + posVector.y + posVector.z) < 0
        const fixed = posVector.x ? 0 : posVector.y ? 1 : posVector.z ? 2 : -1;

        for(let i = 0; i < this.cube.n; i++){
            for (let j = 0; j < this.cube.n; j++){
                let sideCoords = [j, i]
                let coords = []
                for (let k = 0; k < 3; k++){
                    if (k == fixed) {
                        coords.push( reverse ? offset-1 : this.cube.n - offset ) 
                    }
                    else {
                        coords.push(sideCoords.pop())
                    }
                }
                // let x =                                    shiftVector.x *                  i
                // let y =                                    shiftVector.y * (shiftVector.x ? j : i)
                // let z = (shiftVector.x != shiftVector.y) ? shiftVector.z *                  j : (reverse ? offset-1 : this.cube.n - offset )
                // console.log(new THREE.Vector3(x, y, z))
                // indexes.push(new THREE.Vector3(x, y, z))

                // console.log(coords)
                indexes.push(new THREE.Vector3(coords[0], coords[1], coords[2]))
            }
        }
        return indexes;
    }

    generatePieces() : piecesGeneration{
        let pieces3D: Array<Array<Array<Piece>>> = [];
        let pieces = []
        const movesToPiecesMap: Record<string, Record<number, Array<Piece>>> = {}
        const piecesToMovesMap: Record<string, MoveAxis[]> = {}

        // OPTIMIZATION: Share a single material for all pieces
        const pieceBgMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555, 
            wireframe: false,
            flatShading: true, // Reduces shading calculations
            metalness: 0, // Disable metalness for faster rendering
            roughness: 0.9, // Set roughness for simpler lighting
        });

        const cube_size = this.size / this.cube.n;
        const offset = this.size / 2 - cube_size / 2

        // OPTIMIZATION: Share a single geometry for all pieces
        const sharedPieceGeometry = new THREE.BoxGeometry(cube_size - 0.001, cube_size - 0.001, cube_size - 0.001);

        for (let i = 0; i < this.cube.n; i++){
            pieces3D[i] = [];
            for (let j = 0; j < this.cube.n; j++){
                pieces3D[i][j] = [];
                for (let k = 0; k < this.cube.n; k++){
                    // OPTIMIZATION: Only render pieces that are on the outer layers (visible)
                    // Skip inner pieces that have no stickers
                    const isOuterPiece = i === 0 || i === this.cube.n - 1 || 
                                        j === 0 || j === this.cube.n - 1 || 
                                        k === 0 || k === this.cube.n - 1;
                    
                    if (isOuterPiece) {
                        const mesh = new THREE.Mesh(sharedPieceGeometry, pieceBgMaterial);
                        mesh.position.set(cube_size * k - offset, cube_size * j - offset, cube_size * i - offset);
                        
                        // OPTIMIZATION: Disable frustum culling for better performance during rotation
                        mesh.frustumCulled = false;
                        
                        pieces3D[i][j][k] = mesh;
                        pieces.push(mesh);
                        if (this.scene) {
                            this.scene.add(mesh);
                        }
                    } else {
                        // Create a null placeholder for inner pieces to maintain array structure
                        pieces3D[i][j][k] = null as any;
                    }
                }
            }
        }

        Object.keys(this.cube.dict).forEach((move: string) => {
            movesToPiecesMap[move] = {}
            for (let i = 1; i <= this.cube.n; i++){
                const indexes = this.#getIndexesFromMove(move, i)
                movesToPiecesMap[move][i] = indexes
                    .map((index: THREE.Vector3) => pieces3D[index.z][index.y][index.x])
                    .filter(piece => piece !== null); // Filter out null inner pieces

                if (['F', 'R', 'U'].includes(move))
                movesToPiecesMap[move][i].forEach((piece: Piece) => {
                    if (piece && !piecesToMovesMap[piece.id]) piecesToMovesMap[piece.id] = []
                    if (piece) piecesToMovesMap[piece.id].push({move, offset: i})
                })
            }
        })

        // console.log(movesToPiecesMap)

        return {
            pieces3D,
            pieces,
            movesToPiecesMap,
            piecesToMovesMap
        }
    }

    #shiftVector(posVector : THREE.Vector3, absolute: boolean = false) : THREE.Vector3{
        const sgn = posVector.x + posVector.y + posVector.z;
        const shiftVector = new THREE.Vector3 (sgn - posVector.x, sgn - posVector.y, sgn - posVector.z)
        return absolute ? 
            new THREE.Vector3(
                Math.abs(shiftVector.x),
                Math.abs(shiftVector.y),
                Math.abs(shiftVector.z))
            : shiftVector
    }

    #generateSticker(face: string, pos: number) : Sticker
    {
        const posVector = posVectors[face];
        
        const cube_size = this.size / this.cube.n;
        const cubeOffset = this.size / 2;
        
        const i = Math.abs( pos % this.cube.n              - swapVectors[face].x * (this.cube.n - 1))
        const j = Math.abs( Math.floor(pos / this.cube.n)  - swapVectors[face].y * (this.cube.n - 1))
        const iOffset = i * cube_size
        const jOffset = j * cube_size
        
        const shiftVector = this.#shiftVector(posVector);
        let xOffset =                                    shiftVector.x *                  iOffset
        let yOffset =                                    shiftVector.y * (shiftVector.x ? jOffset : iOffset)
        let zOffset = (shiftVector.x != shiftVector.y) ? shiftVector.z *                  jOffset : 0

        if (['R', 'L'].includes(face)) {
            yOffset = [zOffset, zOffset = yOffset][0];
        }
        
        const part = cube_size/10
        const geoWidth  =  part + Math.abs(shiftVector.x) * part * 8.7
        const geoHeight =  part + Math.abs(shiftVector.y) * part * 8.7
        const geoDepth  =  part + Math.abs(shiftVector.z) * part * 8.7

        // OPTIMIZATION: Cache and reuse geometries
        const geoKey = `${geoWidth.toFixed(3)}_${geoHeight.toFixed(3)}_${geoDepth.toFixed(3)}`;
        let stickerGeometry = this.geometryCache.get(geoKey);
        if (!stickerGeometry) {
            stickerGeometry = new THREE.BoxGeometry(geoWidth, geoHeight, geoDepth);
            this.geometryCache.set(geoKey, stickerGeometry);
        }
        
        const stickerColor = this.cube.colorMap[this.cube.dict[face].face[pos]]
        const stickerMaterial = new THREE.MeshStandardMaterial({
            color: stickerColor, 
            wireframe: false,
            flatShading: true, // OPTIMIZATION: Reduces shading calculations
            metalness: 0, // Disable metalness for faster rendering
            roughness: 0.8, // Set roughness for simpler lighting
        })
        const stickerMesh = new THREE.Mesh(stickerGeometry, stickerMaterial)
        
        // OPTIMIZATION: Disable frustum culling for better performance during rotation
        stickerMesh.frustumCulled = false;
        
        stickerMesh.position.set(
            posVector.x * cubeOffset + xOffset - shiftVector.x * (cubeOffset - cube_size/2),
            posVector.y * cubeOffset + yOffset - shiftVector.y * (cubeOffset - cube_size/2),
            posVector.z * cubeOffset + zOffset - shiftVector.z * (cubeOffset - cube_size/2));

        if (this.scene) {
            this.scene.add(stickerMesh)
        }
        return stickerMesh
    }

    generateStickers() : stickersGeneration {
        const record: StickersRecord = {'F': [], 'B': [], 'U': [], 'D': [], 'R': [], 'L': []}
        const stickerToMoves: Record<string, string> = {}

        Object.keys(this.cube.dict).forEach((face: string) => {
            for (let i = 0; i < this.cube.n ** 2; i++) {
                const sticker = this.#generateSticker(face, i)
                record[face].push(sticker)
                stickerToMoves[sticker.id] = face;
            }
        })
        return {
            stickers: record,
            stickersToMovesMap: stickerToMoves
        }
    }
}

class CubeGui2D {
    canvas: any;
    ctx: any;
    colorMap: any;
    pos: any;
    order: any;
    cube: any;
    cell: number;
    gap: number;
    faceGap: number;
    block: number;
    colW: number;
    rowH: number;
    netWidth: number;
    netHeight: number;
    cssW: number;
    cssH: number;
    constructor(canvasId: string, cube: any) {
        const el = document.getElementById(canvasId);
        if (!el || el.tagName !== 'CANVAS') {
            throw new Error(`Canvas #${canvasId} not found`);
        }
        this.canvas = el;
        this.ctx = this.canvas.getContext('2d');
        this.cube = cube;

        // default numeric color map 0..5
        // F=0(green), R=1(orange), D=2(white), L=3(red), U=4(yellow), B=5(blue)
        this.colorMap = ["#00a74a", "#ff6c00", "#ffffff", "#c41e3a", "#ffd500", "#0051ba"];

        this.pos = { U: [1, 0], L: [0, 1], F: [1, 1], R: [2, 1], B: [3, 1], D: [1, 2] };
        this.order = ["U", "L", "F", "R", "B", "D"]; // indices 0..5 map to these

        // Calculate sizing once based on initial canvas size
        const N = this.cube.n;
        this.cell = Math.max(8, Math.floor(Math.min(this.canvas.clientWidth || this.canvas.width, 900) / 20));
        this.gap = Math.max(1, Math.floor(this.cell / 9));
        this.faceGap = Math.max(6, Math.floor(this.cell / 3)) + 5;
        this.block = N * this.cell + (N - 1) * this.gap;
        this.colW = this.block + this.faceGap;
        this.rowH = this.block + this.faceGap;
        this.netWidth = 4 * this.colW - this.faceGap;
        this.netHeight = 3 * this.rowH - this.faceGap;
        const padding = 40;
        this.cssW = this.netWidth + padding * 2;
        this.cssH = this.netHeight + padding * 2;

        // Set canvas CSS size once
        this.canvas.style.width = `${this.cssW}px`;
        this.canvas.style.height = `${this.cssH}px`;
    }

    draw() {
        // Get faces from the cube object
        const U = this.cube.dict['U'].face;
        const L = this.cube.dict['L'].face;
        const F = this.cube.dict['F'].face;
        const R = this.cube.dict['R'].face;
        const B = this.cube.dict['B'].face;
        const D = this.cube.dict['D'].face;

        // Convert 1D arrays to 2D arrays for drawing
        const to2D = (face1d: number[]) => {
            const arr2d: number[][] = [];
            for (let i = 0; i < this.cube.n; i++) {
                arr2d.push(face1d.slice(i * this.cube.n, (i + 1) * this.cube.n));
            }
            return arr2d;
        };

        const faces3d = [to2D(U), to2D(L), to2D(F), to2D(R), to2D(B), to2D(D)];

        const N = this.cube.n;

        // Handle HiDPI for crisp lines
        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
        this.canvas.width = this.cssW * dpr;
        this.canvas.height = this.cssH * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Clear
        this.ctx.fillStyle = "#181a1f";
        this.ctx.fillRect(0, 0, this.cssW, this.cssH);

        // Center the net in the canvas
        const originX = (this.cssW - this.netWidth) / 2;
        const originY = (this.cssH - this.netHeight) / 2;

        // Helpers
        const toColor = (v: any) => (typeof v === "number" ? (this.colorMap[v] ?? "#999") : (v || "#999"));

        const drawFace = (key: any, arr2d: any) => {
            const [col, row] = this.pos[key];
            const startX = originX + col * this.colW;
            const startY = originY + row * this.rowH;

            // subtle face bg
            this.ctx.fillStyle = "#0f111600";
            this.ctx.fillRect(startX - 4, startY - 4, this.block + 8, this.block + 8);

            // stickers
            this.ctx.lineWidth = 1;
            this.ctx.lineJoin = "round";
            this.ctx.lineCap = "round";

            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    const x = startX + c * (this.cell + this.gap);
                    const y = startY + r * (this.cell + this.gap);
                    this.ctx.fillStyle = toColor(arr2d[r][c]);
                    this.ctx.fillRect(x, y, this.cell, this.cell);
                    this.ctx.strokeStyle = "rgba(0,0,0,0.65)";
                    this.ctx.strokeRect(x + 0.5, y + 0.5, this.cell - 1, this.cell - 1);
                }
            }
        };

        // Draw in order
        for (let i = 0; i < 6; i++) {
            const key = this.order[i];
            const face = faces3d[i];
            if (!Array.isArray(face) || face.length !== N || face.some(row => row.length !== N)) {
                throw new Error(`Face ${key}: expected NxN array (got inconsistent rows).`);
            }
            drawFace(key, face);
        }
    }
}

class CubeGui3D {
    cube: Cube
    size: number
    scene: THREE.Scene | undefined
    pieces: Array<Piece> = []
    pieces3D: Array<Array<Array<Piece>>> = []
    movesToPiecesMap: Record<string, Record<number, Array<Piece>>> = {}
    piecesToMovesMap: Record<string, MoveAxis[]> = {}
    stickers: StickersRecord = {}
    stickersToMovesMap: Record<string, string> = {}
    animationQueue: Array<() => boolean> = []
    constructor(scene: THREE.Scene | undefined, cube: Cube, size: number) {
        this.scene = scene;
        this.cube = cube;
        this.size = size;
    }

    update() {
        // console.log("test")
        this.animationQueue = this.animationQueue.filter(animFn => !animFn());
    }

    generate() {
        const generator = new pieceGenerator3D(this.cube, this.size, this.scene);
        const generatedPieces = generator.generatePieces();
        this.pieces3D = generatedPieces.pieces3D;
        this.pieces = generatedPieces.pieces;
        this.movesToPiecesMap = generatedPieces.movesToPiecesMap;
        this.piecesToMovesMap = generatedPieces.piecesToMovesMap;
        const generatedStickers = generator.generateStickers();
        this.stickers = generatedStickers.stickers;
        this.stickersToMovesMap = generatedStickers.stickersToMovesMap;
    }

    move() {

    }

    updateColor(){
        // OPTIMIZATION: Batch color updates to reduce overhead
        Object.keys(this.cube.dict).forEach((face: string) => {
            const faceStickers = this.stickers[face];
            const faceArray = this.cube.dict[face].face;
            
            for (let i = 0; i < this.cube.n ** 2; i++) {
                const stickerColor = this.cube.colorMap[faceArray[i]];
                // Reuse THREE.Color object if it already matches to avoid unnecessary updates
                const currentColor = faceStickers[i].material.color;
                const newColor = new THREE.Color(stickerColor);
                
                if (!currentColor.equals(newColor)) {
                    faceStickers[i].material.color.copy(newColor);
                }
            }
        })
    }

    #getFaceAxis(face: string): ['x' | 'y' | 'z', boolean] {
        const axisMap: Record<string, string> = {
            'R': 'x', 'L': 'x',
            'U': 'y', 'D': 'y',
            'F': 'z', 'B': 'z'
        };
        const reverseMap: Record<string, boolean> = {
            'R': false, 'L': true,
            'U': false, 'D': true,
            'F': false, 'B': true,
        }
        return [axisMap[face] as 'x' | 'y' | 'z', reverseMap[face]];
    }

    #getRotatingPieces(move: string, offset: number): Array<Piece>{
        return this.movesToPiecesMap[move][offset]
    }

    #getRotatingStickers(move: string, offset: number) : Array<Sticker>{
        let stickers: Array<Sticker> = []
        for (const direction of ['right', 'up', 'left', 'down']){
            const faceStr = this.cube.dict[move].connections[direction];
            const faceStickers = this.stickers[faceStr];

            const indexesToMove = this.cube.getIndexesFromDirection(this.cube.dict[faceStr].connections[move], offset)
            const stickersToMove = Array.from({length: this.cube.n}, (_, i) => faceStickers[indexesToMove[i]])            

            stickers = stickers.concat(stickersToMove)
        }

        //if first or last layers are rotating add the faces of that layer to the rotation GROUP
        if (offset == 1) {
            const faceStickers = this.stickers[move]
            stickers = stickers.concat(faceStickers)
        } else if (offset == this.cube.n) {
            // When offset == n, we need to rotate the opposite face
            const oppositeFaces: { [key: string]: string } = {
                'F': 'B', 'B': 'F',
                'R': 'L', 'L': 'R',
                'U': 'D', 'D': 'U'
            };
            const oppositeFace = oppositeFaces[move];
            const faceStickers = this.stickers[oppositeFace]
            stickers = stickers.concat(faceStickers)
        }

        return stickers
    }

    animateRotation(move: string, prime: boolean = false, offset: number, onFinishedCallback: () => void) {
        // When offset == n, we need to use the opposite face's axis but invert the prime
        let actualMove = move;
        let actualPrime = prime;
        
        if (offset == this.cube.n) {
            const oppositeFaces: { [key: string]: string } = {
                'F': 'B', 'B': 'F',
                'R': 'L', 'L': 'R',
                'U': 'D', 'D': 'U'
            };
            actualMove = oppositeFaces[move];
            actualPrime = !prime;
        }
        
        const [axis, reversed] = this.#getFaceAxis(actualMove);

        const rightAngle = Math.PI / 2;
        const angle = actualPrime != reversed ? rightAngle : -rightAngle
        const duration = 150; // ms
        const startTime = Date.now();
        
        const stickersToRotate = this.#getRotatingStickers(move, offset)
        const piecesToRotate = this.#getRotatingPieces(move, offset)

        const group = new THREE.Group();
        
        // OPTIMIZATION: Disable matrix auto-update for better performance
        group.matrixAutoUpdate = false;
        
        // OPTIMIZATION: Batch add to group for better performance
        const allObjects = [...stickersToRotate, ...piecesToRotate];
        allObjects.forEach(obj => {
            if (obj) {
                group.add(obj);
                obj.matrixAutoUpdate = false; // Disable during animation
            }
        });
        
        this.scene?.add(group);
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentAngle = angle * this.#easeInOutCubic(progress);
            
            group.rotation[axis] = currentAngle;
            
            // OPTIMIZATION: Update matrix manually only when rotation changes
            group.updateMatrix();
            
            // Return true when done
            if (progress >= 1) {
                // Finalize rotation
                onFinishedCallback();
                group.rotation[axis] = 0;
                
                // Re-enable matrix auto-update when adding back to scene
                allObjects.forEach(obj => {
                    if (obj) {
                        obj.matrixAutoUpdate = true;
                        obj.updateMatrix();
                        this.scene?.add(obj);
                    }
                });
                
                this.scene?.remove(group);
                return true; // Animation complete
            }
            return false; // Continue animating
        };
        
        this.animationQueue.push(animate);
    }

    #easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}

export { CubeGui2D, CubeGui3D, posVectors, swapVectors };