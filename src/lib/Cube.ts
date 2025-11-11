// filepath: c:\dev\fun\three-test\src\lib\Cube.ts

interface FaceConfig {
    face: number[];
    connections: { [key: string]: string };
    mutations: string[];
}

interface CubeDict {
    [key: string]: FaceConfig;
}

export class Cube {
    n: number;
    dict: CubeDict;
    colorMap: Array<string> = ["#00a74a", "#ff6c00", "#ffffff", "#c41e3a", "#ffd500", "#0051ba"];

    constructor(n: number) {
        this.n = n;
        this.dict = {
            'F': {
                face: Array(n ** 2).fill(0),
                connections: {
                    'right': 'R',
                    'R': 'right',
                    'down': 'D',
                    'D': 'down',
                    'left': 'L',
                    'L': 'left',
                    'up': 'U',
                    'U': 'up',
                },
                mutations: ['down', 'left']
            },
            'R': {
                face: Array(n ** 2).fill(1),
                connections: {
                    'right': 'B',
                    'B': 'right',
                    'down': 'D',
                    'D': 'down',
                    'left': 'F',
                    'F': 'left',
                    'up': 'U',
                    'U': 'up',
                },
                mutations: ['right']
            },
            'D': {
                face: Array(n ** 2).fill(2),
                connections: {
                    'right': 'R',
                    'R': 'right',
                    'down': 'B',
                    'B': 'down',
                    'left': 'L',
                    'L': 'left',
                    'up': 'F',
                    'F': 'up',
                },
                mutations: []
            },
            'L': {
                face: Array(n ** 2).fill(3),
                connections: {
                    'right': 'F',
                    'F': 'right',
                    'down': 'D',
                    'D': 'down',
                    'left': 'B',
                    'B': 'left',
                    'up': 'U',
                    'U': 'up',
                },
                mutations: ['left']
            },
            'U': {
                face: Array(n ** 2).fill(4),
                connections: {
                    'right': 'R',
                    'R': 'right',
                    'down': 'F',
                    'F': 'down',
                    'left': 'L',
                    'L': 'left',
                    'up': 'B',
                    'B': 'up',
                },
                mutations: []
            },
            'B': {
                face: Array(n ** 2).fill(5),
                connections: {
                    'right': 'L',
                    'L': 'right',
                    'down': 'D',
                    'D': 'down',
                    'left': 'R',
                    'R': 'left',
                    'up': 'U',
                    'U': 'up',
                },
                mutations: ['left', 'up']
            },
        };
    }

    getIndexesFromDirection(direction: string, offset: number = 1): number[] {
        if (direction === 'right') {
            return Array.from({ length: this.n }, (_, i) => i * this.n + ( this.n - offset ));
        }
        if (direction === 'down') {
            return Array.from({ length: this.n }, (_, i) => (this.n - offset) * this.n + i);
        }
        if (direction === 'left') {
            return Array.from({ length: this.n }, (_, i) => i * this.n + ( offset - 1 ));
        }
        if (direction === 'up') {
            return Array.from({ length: this.n }, (_, i) => i + ( offset - 1 ) * this.n);
        }
        throw new TypeError(`Invalid direction: ${direction}`);
    }

    rotateFace(face: string, prime: boolean = false): void {
        const faceArr = this.dict[face].face;
        const n = this.n;
        const places: number[] = Array(n ** 2).fill(0);
        
        for (let i = 0; i < n ** 2; i++) {
            const val = ((n - 1) + (i * n) - Math.floor(i / n)) % (n * n);
            if (prime) {
                places[val] = i;
            } else {
                places[i] = val;
            }
        }
        
        const values = [...faceArr];
        
        for (let i = 0; i < n ** 2; i++) {
            faceArr[places[i]] = values[i];
        }
    }

    turn(move: string, prime: boolean = false, offset: number = 1): void {
        if ( offset <  1 ) return
        
        // Map of opposite faces
        const oppositeFaces: { [key: string]: string } = {
            'F': 'B', 'B': 'F',
            'R': 'L', 'L': 'R',
            'U': 'D', 'D': 'U'
        };
        
        // If offset == 1, rotate the specified face
        // If offset == n, rotate the opposite face with inverted direction
        if (offset == 1) {
            this.rotateFace(move, prime);
        } else if (offset == this.n) {
            const oppositeFace = oppositeFaces[move];
            this.rotateFace(oppositeFace, !prime);
        }
        
        const order = prime 
            ? ['right', 'up', 'left', 'down', 'right'] 
            : ['right', 'down', 'left', 'up', 'right'];
        let piecesLast: number[] | null = null;

        for (const direction of order) {
            const faceStr = this.dict[move].connections[direction];
            const face = this.dict[faceStr].face;
            let indexes = this.getIndexesFromDirection(this.dict[faceStr].connections[move], offset);
            
            if (this.dict[move].mutations.includes(direction)) {
                indexes.reverse();
            }
            
            const facePieces = indexes.map(i => face[i]);

            if (piecesLast) {
                for (let i = 0; i < indexes.length; i++) {
                    face[indexes[i]] = piecesLast[i];
                }
            }

            piecesLast = facePieces;
        }

        // this.printCube();
    }

    printCube(): void {
        const U = this.dict['U'].face;
        const L = this.dict['L'].face;
        const F = this.dict['F'].face;
        const R = this.dict['R'].face;
        const B = this.dict['B'].face;
        const D = this.dict['D'].face;

        const spaces = this.n * 2;

        const rowToStr = (face: number[], row: number): string => {
            const start = row * this.n;
            return Array.from({ length: this.n }, (_, i) => face[start + i]).join(' ');
        };

        console.log(' '.repeat(spaces + 1) + 'U');
        for (let i = 0; i < this.n; i++) {
            console.log(' '.repeat(spaces) + ' ' + rowToStr(U, i));
        }

        console.log(`L${' '.repeat(spaces)}F${' '.repeat(spaces)}R${' '.repeat(spaces)}B`);
        for (let i = 0; i < this.n; i++) {
            console.log([
                rowToStr(L, i),
                rowToStr(F, i),
                rowToStr(R, i),
                rowToStr(B, i)
            ].join('  '));
        }

        console.log(' '.repeat(spaces + 1) + 'D');
        for (let i = 0; i < this.n; i++) {
            console.log(' '.repeat(spaces) + ' ' + rowToStr(D, i));
        }
    }
}
