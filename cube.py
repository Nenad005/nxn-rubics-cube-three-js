class cube():
    def get_indexes_from_direction(self, direction):
        if direction == 'right':
            return [i * self.n + (self.n - 1) for i in range(self.n)]
        if direction == 'down':
            return [( (self.n - 1) * self.n ) + i for i in range(self.n)]
        if direction == 'left':
            return [i * self.n for i in range(self.n)]
        if direction == 'up':
            return [i for i in range(self.n)]
        raise TypeError


    def turn(self, move, prime = False):
        self.rotate_face(move, prime=prime)
        order = ['right', 'up', 'left', 'down', 'right'] if prime else ['right', 'down', 'left', 'up', 'right']
        piecesLast = None

        for direction in order:
            faceStr = self.dict[move]['connections'][direction]
            face = self.dict[faceStr]['face']
            indexes = self.get_indexes_from_direction(direction=self.dict[faceStr]['connections'][move])
            if direction in self.dict[move]['mutations']: indexes.reverse()
            facePieces = [face[indexes[i]] for i in range(len(indexes))]

            if piecesLast:
                for i in range(len(indexes)):
                    face[indexes[i]] = piecesLast[i]

            piecesLast = facePieces

        self.print_cube()

    def rotate_face(self, face, prime=False):
        faceArr = self.dict[face]['face']
        n = self.n
        places = [0] * ( n ** 2 )
        for i in range(n ** 2):
            val = ( ( n-1 ) + ( i*n ) - ( i//n ) ) % ( n*n )
            if prime:
                places[val] = i
            else:
                places[i] = val
        values = [faceArr[i] for i in range(len(faceArr))]

        for i in range(n ** 2):
            faceArr[places[i]] = values[i]

    def __init__(self, n):
        self.n = n
        self.dict = {
            'F' : {
                'face' : [0] * (n ** 2),
                # 'face' : [0, 6, 0, 0, 6, 0, 6, 0, 6],
                'connections': {
                    'right': 'R',
                    'R' : 'right',
                    'down': 'D',
                    'D' : 'down',
                    'left': 'L',
                    'L' : 'left',
                    'up': 'U',
                    'U' : 'up',
                },
                'mutations': ['down', 'left']
            },
            'R' : {
                'face' : [1] * (n ** 2),
                # 'face' : [1, 6, 1, 1, 6, 1, 6, 1, 6],
                'connections': {
                    'right': 'B',
                    'B' : 'right',
                    'down': 'D',
                    'D' : 'down',
                    'left': 'F',
                    'F' : 'left',
                    'up': 'U',
                    'U' : 'up',
                },
                'mutations': ['right']
            },
            'D' : {
                'face' : [2] * (n ** 2),
                # 'face' : [2, 6, 2, 2, 6, 2, 6, 2, 6],
                'connections': {
                    'right': 'R',
                    'R' : 'right',
                    'down': 'B',
                    'B' : 'down',
                    'left': 'L',
                    'L' : 'left',
                    'up': 'F',
                    'F' : 'up',
                },
                'mutations': []
            },
            'L' : {
                'face' : [3] * (n ** 2),
                # 'face' : [3, 6, 3, 3, 6, 3, 6, 3, 6],
                'connections': {
                    'right': 'F',
                    'F' : 'right',
                    'down': 'D',
                    'D' : 'down',
                    'left': 'B',
                    'B' : 'left',
                    'up': 'U',
                    'U' : 'up',
                },
                'mutations': ['left']
            },
            'U' : {
                'face' : [4] * (n ** 2),
                # 'face' : [4, 6, 4, 4, 6, 4, 6, 4, 6],
                'connections': {
                    'right': 'R',
                    'R' : 'right',
                    'down': 'F',
                    'F' : 'down',
                    'left': 'L',
                    'L' : 'left',
                    'up': 'B',
                    'B' : 'up',
                },
                'mutations': []
            },
            'B' : {
                'face' : [5] * (n ** 2),
                # 'face' : [5, 6, 5, 5, 6, 5, 6, 5, 6],
                'connections': {
                    'right': 'L',
                    'L' : 'right',
                    'down': 'D',
                    'D' : 'down',
                    'left': 'R',
                    'R' : 'left',
                    'up': 'U',
                    'U' : 'up',
                },
                'mutations': ['left', 'up']
            },            
        }

    def print_cube(self):
        U = self.dict['U']['face']
        L = self.dict['L']['face']
        F = self.dict['F']['face']
        R = self.dict['R']['face']
        B = self.dict['B']['face']
        D = self.dict['D']['face']

        spaces = self.n * 2

        def row_to_str(face, row):
            start = row * self.n
            return ' '.join(str(face[start + i]) for i in range(self.n))

        print(f"{(spaces + 1) * ' '}U")
        for i in range(self.n):
            print(spaces * ' ', row_to_str(U, i))

        print(f"L{spaces * ' '}F{spaces * ' '}R{spaces * ' '}B")
        for i in range(self.n):
            print(row_to_str(L, i), row_to_str(F, i), row_to_str(R, i), row_to_str(B, i), sep="  ")

        print(f"{(spaces + 1) * ' '}D")
        for i in range(self.n):
            print(spaces * ' ', row_to_str(D, i))

if __name__ == "__main__":
    cubeTest = cube(n=3)
    cubeTest.print_cube()
    cubeTest.turn('F')