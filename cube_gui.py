import tkinter as tk

class CubeGUI:
    def __init__(self, cube):
        self.cube = cube
        self.root = tk.Tk()
        self.root.title("Rubik's Cube 2D View")
        
        # Calculate canvas size based on cube size
        n = cube.n
        face_size = n * 30  # 30 pixels per square
        canvas_width = 4 * face_size + 50  # 4 faces horizontally + padding
        canvas_height = 3 * face_size + 90  # 3 faces vertically + padding
        
        self.canvas = tk.Canvas(self.root, width=canvas_width, height=canvas_height)
        self.canvas.pack()
        self.draw_cube()
        self.root.bind('<Key>', self.on_key)
        self.root.focus_set()  # Ensure the window can receive key events

    def on_key(self, event):
        # Map keys to moves
        move = None
        # Normal moves: U, D, L, R, F, B (lowercase)
        if event.char in 'udlrfb':
            move = event.char.upper()
        # Prime moves: Shift + key (U', D', ...)
        elif event.char in 'UDLRFB':
            move = event.char + "'"
        # Double moves: 2 (e.g. U2)
        elif event.char in '123456':
            # For demo, not mapped to a face
            pass
        if move:
            self.handle_move(move)

    def handle_move(self, move):
        print(f"Move called: {move}")
        if move.endswith("'"):
            # Prime move (counterclockwise)
            face = move[0]
            self.cube.turn(face, prime=True)
        else:
            # Normal move (clockwise)
            self.cube.turn(move)
        self.draw_cube()
        self.root.update_idletasks()

    def draw_face(self, arr, x_offset, y_offset, face_label):
        size = 30
        n = self.cube.n  # Get the size of the cube
        for i in range(n):
            for j in range(n):
                # Convert 2D coordinates to 1D index
                index = i * n + j
                color = arr[index]
                if color is None:
                    color = "#cccccc"
                else:
                    # Map int to color for demo
                    color_map = {
                        0: "green", 1: "orange", 2: "white", 3: "red", 4: "yellow", 5: "blue", 6: "cyan"
                    }
                    color = color_map.get(color, "gray")
                x = x_offset + j * size
                y = y_offset + i * size
                self.canvas.create_rectangle(x, y, x+size, y+size, fill=color, outline="black")
                # Add the array index as text in the center of each square
                text_x = x + size // 2
                text_y = y + size // 2
                self.canvas.create_text(text_x, text_y, text=str(index), font=("Arial", 8, "bold"), fill="black")
        self.canvas.create_text(x_offset + (n/2)*size, y_offset - 10, text=face_label, font=("Arial", 12, "bold"))

    def draw_cube(self):
        # Clear canvas first
        self.canvas.delete("all")
        
        n = self.cube.n
        face_size = n * 30  # 30 pixels per square
        
        U = self.cube.dict['U']['face']
        L = self.cube.dict['L']['face']
        F = self.cube.dict['F']['face']
        R = self.cube.dict['R']['face']
        B = self.cube.dict['B']['face']
        D = self.cube.dict['D']['face']
        
        # Calculate positions based on face size
        # U (top)
        self.draw_face(U, 1 * face_size + 10, 20, "U")
        # L F R B (middle)
        # self.draw_face(B, 10, face_size + 20, "B")
        self.draw_face(L, 0 * face_size + 10, face_size + 30, "L")
        self.draw_face(F, 1 * face_size + 10, face_size + 30, "F")
        self.draw_face(R, 2 * face_size + 10, face_size + 30, "R")
        self.draw_face(B, 3 * face_size + 10, face_size + 30, "B")
        # D (bottom)
        self.draw_face(D, 1 * face_size + 10, 2 * face_size + 40, "D")

    def run(self):
        self.root.mainloop()
