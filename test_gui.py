from cube import cube
from cube_gui import CubeGUI

if __name__ == "__main__":
    cubeTest = cube(3)
    gui = CubeGUI(cubeTest)
    gui.run()
