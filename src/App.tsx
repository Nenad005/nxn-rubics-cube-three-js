import { useEffect, useState } from 'react'

import * as THREE from 'three';
import SceneInit from './lib/SceneInit';
// import CubeGui3D from './lib/CubeGui';
import { CubeGui2D, CubeGui3D, posVectors } from './lib/CubeGui';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Cube } from './lib/Cube';

function App() {
    useEffect(() => {

        const env = new SceneInit('cube3D');
        env.initialize();

        const cube = new Cube(3);

        // const cube2D = new CubeGui2D('cube2D', cube)
        const cube3D = new CubeGui3D(env.scene, cube, 40);
        // cube2D.draw()
        cube3D.generate()

        //Unos poteza sa tastature
        const handleKeyPress = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            const isShift = event.shiftKey;

            const moveMap: { [key: string]: string } = {
                'f': 'F',
                'r': 'R',
                'u': 'U',
                'l': 'L',
                'd': 'D',
                'b': 'B'
            };

            if (moveMap[key]) {
                const face = moveMap[key];
                const isPrime = isShift; // Shift + key = prime move


                cube3D.animateRotation(face, isPrime, 1, () => {
                    cube.turn(face, isPrime, 1);
                    cube3D.updateColor();
                    // cube2D.draw()
                })

                console.log(`Move: ${face}${isPrime ? "'" : ''}`);
            }
        };
        window.addEventListener('keydown', handleKeyPress);

        const panel = new GUI({ width: 300 })
        const movesFolder = panel.addFolder('moves');

        //Dodavanje poteza u meni
        {
            // const movesOffset = 2;
            // const moves = {
            //     TEST: () => { cube3D.animateRotation('F', false, 1, () => {
            //         cube.turn('F', false, 1);
            //         cube3D.updateColor();
            //         cube2D.draw()
            //     })},
            //     F: () => { cube.turn('F', false, movesOffset); cube2D.draw(); cube3D.updateColor() },
            //     "F'": () => { cube.turn('F', true, movesOffset); cube2D.draw(); cube3D.updateColor() },
            //     R: () => { cube.turn('R', false, movesOffset); cube2D.draw(); cube3D.updateColor() },
            //     "R'": () => { cube.turn('R', true, movesOffset); cube2D.draw(); cube3D.updateColor() },
            //     U: () => { cube.turn('U', false, movesOffset); cube2D.draw(); cube3D.updateColor() },
            //     "U'": () => { cube.turn('U', true, movesOffset); cube2D.draw(); cube3D.updateColor() },
            //     L: () => { cube.turn('L', false, movesOffset); cube2D.draw(); cube3D.updateColor() },
            //     "L'": () => { cube.turn('L', true, movesOffset); cube2D.draw(); cube3D.updateColor() },
            //     D: () => { cube.turn('D', false, movesOffset); cube2D.draw(); cube3D.updateColor() },
            //     "D'": () => { cube.turn('D', true, movesOffset); cube2D.draw(); cube3D.updateColor() },
            //     B: () => { cube.turn('B', false, movesOffset); cube2D.draw(); cube3D.updateColor() },
            //     "B'": () => { cube.turn('B', true, movesOffset); cube2D.draw(); cube3D.updateColor() },
            // };

            // movesFolder.add(moves, 'TEST');
            // movesFolder.add(moves, 'F');
            // movesFolder.add(moves, "F'");
            // movesFolder.add(moves, 'R');
            // movesFolder.add(moves, "R'");
            // movesFolder.add(moves, 'U');
            // movesFolder.add(moves, "U'");
            // movesFolder.add(moves, 'L');
            // movesFolder.add(moves, "L'");
            // movesFolder.add(moves, 'D');
            // movesFolder.add(moves, "D'");
            // movesFolder.add(moves, 'B');
            // movesFolder.add(moves, "B'");
        }

        // Initialize variables needed for mouse interactions
        const pointer = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
        let clickedPiece: THREE.Object3D | null = null;
        let clickedFace: string | null = null
        let clickedSticker: THREE.Object3D | null = null;
        let originalPieceMaterial: THREE.Material | null = null;
        let originalStickerMaterial: THREE.Material | null = null;
        let arrowHelpers: THREE.ArrowHelper[] = [];
        let dragLine: THREE.Line | null = null;
        let clickStartPoint: THREE.Vector3 | null = null;
        let isMouseDown = false;
        let hasCalculatedAngles = false;
        const directionToMovesMap : Record<string, Record<string, any>> = {
            'F': {
                '+X' : {move: "U", prime: true},
                '-X' : {move: "U", prime: false},
                '+Y' : {move: "R", prime: false},
                '-Y' : {move: "R", prime: true},
            },
            'B': {
                '+X' : {move: "U", prime: false},
                '-X' : {move: "U", prime: true},
                '+Y' : {move: "R", prime: true},
                '-Y' : {move: "R", prime: false},
            },
            'R': {
                '+Y' : {move: "F", prime: true},
                '-Y' : {move: "F", prime: false},
                '+Z' : {move: "U", prime: false},
                '-Z' : {move: "U", prime: true},
            },
            'L': {
                '+Y' : {move: "F", prime: false},
                '-Y' : {move: "F", prime: true},
                '+Z' : {move: "U", prime: true},
                '-Z' : {move: "U", prime: false},
            },
            'U': {
                '+X' : {move: "F", prime: false},
                '-X' : {move: "F", prime: true},
                '+Z' : {move: "R", prime: true},
                '-Z' : {move: "R", prime: false},
            },
            'D': {
                '+X' : {move: "F", prime: true},
                '-X' : {move: "F", prime: false},
                '+Z' : {move: "R", prime: false},
                '-Z' : {move: "R", prime: true},
            }
        }

        const gridHelperSize = 100;
        const gridHelperDivisions = 10;
        const gridHelper = new THREE.GridHelper(gridHelperSize, gridHelperDivisions);
        // env.scene?.add(gridHelper);

        const axisHelper = new THREE.AxesHelper(5);
        env.scene?.add(axisHelper);

        function drawDirectionArrows(clickPosition: THREE.Vector3, face: string) {
            const posVector = posVectors[face]

            const directions = [
                { dir: new THREE.Vector3(1, 0, 0), color: 0xff0000 },   // +X (red)
                { dir: new THREE.Vector3(-1, 0, 0), color: 0x880000 },  // -X (dark red)
                { dir: new THREE.Vector3(0, 1, 0), color: 0x00ff00 },   // +Y (green)
                { dir: new THREE.Vector3(0, -1, 0), color: 0x008800 },  // -Y (dark green)
                { dir: new THREE.Vector3(0, 0, 1), color: 0x0000ff },   // +Z (blue)
                { dir: new THREE.Vector3(0, 0, -1), color: 0x000088 },  // -Z (dark blue)
            ];

            const arrowLength = 5;
            const arrowHeadLength = 1;
            const arrowHeadWidth = 0.5;

            directions.forEach(({ dir, color }) => {
                if (!dir.equals(posVector) && !dir.equals(posVector.negate())) {
                    const arrow = new THREE.ArrowHelper(
                        dir,
                        clickPosition,
                        arrowLength,
                        color,
                        arrowHeadLength,
                        arrowHeadWidth
                    );
                    
                    // Make arrows render on top of everything
                    arrow.renderOrder = 999;
                    arrow.traverse((child) => {
                        if ((child as any).material) {
                            (child as any).material.depthTest = false;
                            (child as any).material.depthWrite = false;
                        }
                    });
                    
                    arrowHelpers.push(arrow);
                    env.scene?.add(arrow);
                }
            });
        }

        function onMouseDown(event: MouseEvent) {
            // Update pointer position
            pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

            if (env.camera && env.scene && env.controls) {
                raycaster.setFromCamera(pointer, env.camera);
                
                // Get all stickers into a flat array
                const allStickers: THREE.Mesh[] = [];
                Object.values(cube3D.stickers).forEach(stickerArray => {
                    allStickers.push(...stickerArray);
                });
                
                // Check for sticker intersections first
                const stickerIntersects = raycaster.intersectObjects(allStickers, false);
                
                // Then check for piece intersections
                const pieceIntersects = raycaster.intersectObjects(cube3D.pieces, true);

                // If clicking on a sticker
                if (stickerIntersects.length > 0) {
                    const firstSticker = stickerIntersects[0].object;

                    clickedFace = cube3D.stickersToMovesMap[firstSticker.id]
                    console.log('Clicked face:', clickedFace);
                    
                    // Store and highlight the sticker
                    originalStickerMaterial = (firstSticker as any).material;
                    (firstSticker as any).material = new THREE.MeshStandardMaterial({
                        color: 0xff0000,
                        emissive: 0xff0000,
                        emissiveIntensity: 0.5
                    });
                    clickedSticker = firstSticker;
                }

                // If clicking on a cube piece
                if (pieceIntersects.length > 0) {
                    const firstIntersect = pieceIntersects[0];
                    const firstObject = firstIntersect.object;

                    console.log(cube3D.piecesToMovesMap[firstObject.id])
                    
                    // Store the original material
                    originalPieceMaterial = (firstObject as any).material;
                    
                    // Apply highlight color
                    (firstObject as any).material = new THREE.MeshStandardMaterial({
                        color: 0xff0000,
                        emissive: 0xff0000,
                        emissiveIntensity: 0.3
                    });
                    
                    clickedPiece = firstObject;
                    
                    // Get the exact 3D point where the click intersected the object
                    const clickPosition = firstIntersect.point;
                    clickStartPoint = clickPosition.clone();
                    isMouseDown = true;
                    
                    // Create the drag line
                    const lineMaterial = new THREE.LineBasicMaterial({ 
                        color: 0xffff00,
                        linewidth: 3,
                        depthTest: false,
                        depthWrite: false
                    });
                    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                        clickPosition,
                        clickPosition.clone()
                    ]);
                    dragLine = new THREE.Line(lineGeometry, lineMaterial);
                    dragLine.renderOrder = 1000;
                    env.scene?.add(dragLine);
                    
                    if (clickedFace) drawDirectionArrows(clickPosition, clickedFace)
                    
                    // Create 6 arrow helpers pointing in each direction
                    
                    
                    // Disable orbit controls
                    env.controls.enabled = false;
                    // console.log('Clicked on cube piece - orbit controls disabled');
                }
            }
        }

        function calculateAngles(): string | null {
            console.log("stigao")
            if (!dragLine || !clickStartPoint || !env.camera) return null;
            
            // Get the end point of the drag line
            const positions = dragLine.geometry.attributes.position;
            const endPoint = new THREE.Vector3(
                positions.getX(1),
                positions.getY(1),
                positions.getZ(1)
            );
            
            // Project both start and end points to 2D screen space
            const startPoint2D = clickStartPoint.clone().project(env.camera);
            const endPoint2D = endPoint.clone().project(env.camera);
            
            // Calculate the drag vector in 2D screen space
            const dragVector2D = new THREE.Vector2(
                endPoint2D.x - startPoint2D.x,
                endPoint2D.y - startPoint2D.y
            );
            
            console.log('=== Angle Calculations ===');
            console.log('Drag vector 2D:', dragVector2D);
            
            // Define the directional vectors (same as arrows, excluding the face normal)
            const directions = [
                { name: '+X', dir: new THREE.Vector3(1, 0, 0) },
                { name: '-X', dir: new THREE.Vector3(-1, 0, 0) },
                { name: '+Y', dir: new THREE.Vector3(0, 1, 0) },
                { name: '-Y', dir: new THREE.Vector3(0, -1, 0) },
                { name: '+Z', dir: new THREE.Vector3(0, 0, 1) },
                { name: '-Z', dir: new THREE.Vector3(0, 0, -1) },
            ];
            
            let moveDirection = {
                name: "+X",
                dir: new THREE.Vector3(1,0,0),
                angle: 181
            }

            directions.forEach(({ name, dir }) => {
                if (!clickedFace) return;
                const posVector = posVectors[clickedFace]
                if (!dir.equals(posVector) && !dir.equals(posVector.negate())) {
                    // Create a 3D point along this direction from the start point
                    const dirEndPoint = clickStartPoint!.clone().add(dir.clone().multiplyScalar(5));
                    
                    // Project to 2D
                    const dirEndPoint2D = dirEndPoint.clone().project(env.camera!);
                    const dirStartPoint2D = clickStartPoint!.clone().project(env.camera!);
                    
                    // Calculate the direction vector in 2D
                    const dirVector2D = new THREE.Vector2(
                        dirEndPoint2D.x - dirStartPoint2D.x,
                        dirEndPoint2D.y - dirStartPoint2D.y
                    );
                    
                    // Calculate angle between drag vector and direction vector in 2D
                    const dotProduct = dragVector2D.dot(dirVector2D);
                    const magnitudes = dragVector2D.length() * dirVector2D.length();
                    
                    if (magnitudes > 0) {
                        const angleRad = Math.acos(Math.max(-1, Math.min(1, dotProduct / magnitudes)));
                        const angleDeg = angleRad * (180 / Math.PI);

                        if (angleDeg < moveDirection.angle) {
                            moveDirection = {
                                name, dir, angle: angleDeg
                            }
                        }
                    }
                }
            });

            console.log(`${moveDirection.name}: THREE.Vector3(${moveDirection.dir.x}, ${moveDirection.dir.y}, ${moveDirection.dir.z}) - ${moveDirection.angle.toFixed(2)}°`)
            return moveDirection.name
        }

        function onMouseMove(event: MouseEvent) {
            if (!isMouseDown || !dragLine || !clickStartPoint || !env.camera) return;
            
            // Update pointer position
            pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Cast a ray to get a point in 3D space
            raycaster.setFromCamera(pointer, env.camera);
            
            // Create a plane at the click point facing the camera
            const cameraDirection = new THREE.Vector3();
            env.camera.getWorldDirection(cameraDirection);
            const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
                cameraDirection.negate(),
                clickStartPoint
            );
            
            // Find where the ray intersects the plane
            const intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, intersectionPoint);
            
            if (intersectionPoint) {
                // Update the line geometry
                const positions = dragLine.geometry.attributes.position;
                positions.setXYZ(1, intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);
                positions.needsUpdate = true;
                
                // Check if line length exceeds 50px in 2D screen space
                if (!hasCalculatedAngles) {
                    const startPoint2D = clickStartPoint.clone().project(env.camera);
                    const endPoint2D = intersectionPoint.clone().project(env.camera);
                    
                    // Convert normalized device coordinates to pixel coordinates
                    const canvasWidth = window.innerWidth;
                    const canvasHeight = window.innerHeight;
                    
                    const startPixel = new THREE.Vector2(
                        (startPoint2D.x + 1) * canvasWidth / 2,
                        (-startPoint2D.y + 1) * canvasHeight / 2
                    );
                    const endPixel = new THREE.Vector2(
                        (endPoint2D.x + 1) * canvasWidth / 2,
                        (-endPoint2D.y + 1) * canvasHeight / 2
                    );
                    
                    const lineLength = startPixel.distanceTo(endPixel);
                    
                    if (lineLength > 50) {
                        hasCalculatedAngles = true;
                        const calculatedDirection: string | null = calculateAngles();
                        if (calculatedDirection && clickedFace && clickedPiece) {
                            const directionName: string = calculatedDirection;

                            const possibleMoves = cube3D.piecesToMovesMap[clickedPiece.id];
                            const moveToOffsetMap = new Map<string, number>(possibleMoves.map(m => [m.move, m.offset]));


                            const {move, prime} = directionToMovesMap[clickedFace][directionName];
                            const offset = moveToOffsetMap.get(move)
                            if (!offset) return
                            cube3D.animateRotation(move, prime, offset, () => {
                                cube.turn(move, prime, offset);
                                cube3D.updateColor();
                                // cube2D.draw();
                            });
                        }
                        resetVariables();
                    }
                }
            }
        }

        function resetVariables(){
            hasCalculatedAngles = false;
            
            // Remove the drag line
            if (dragLine) {
                env.scene?.remove(dragLine);
                dragLine = null;
            }
            clickStartPoint = null;
            
            // Remove all arrow helpers
            arrowHelpers.forEach(arrow => {
                env.scene?.remove(arrow);
            });
            arrowHelpers = [];
            if (clickedFace) clickedFace = null;
            // Restore original sticker material if a sticker was clicked
            if (clickedSticker && originalStickerMaterial) {
                (clickedSticker as any).material = originalStickerMaterial;
                clickedSticker = null;
                originalStickerMaterial = null;
            }
            
            // Restore original piece material if a piece was clicked
            if (clickedPiece && originalPieceMaterial) {
                (clickedPiece as any).material = originalPieceMaterial;
                clickedPiece = null;
                originalPieceMaterial = null;
            }
        }

        function onMouseUp() {
            isMouseDown = false;
            
            resetVariables()

            // Re-enable orbit controls on mouse release
            if (env.controls) {
                env.controls.enabled = true;
                // console.log('Orbit controls enabled');
            }
        }

        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        env.addUpdateCallback(() => cube3D.update())
        env.animate();

        // Cleanup function
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [])

    return (
        <>
            <div>
                <canvas id='cube3D'></canvas>
                <canvas id='cube2D' className='absolute bottom-2 left-2 border-white border-2 w-[30rem] h-[20rem]'></canvas>
            </div>
        </>
    )
}

export default App
