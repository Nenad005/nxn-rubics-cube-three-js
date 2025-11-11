from cube import cube
from cube_gui import CubeGUI

if __name__ == "__main__":
    # Test with a 4x4 cube
    cubeTest = cube(4)
    gui = CubeGUI(cubeTest)
    gui.run()
