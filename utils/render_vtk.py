#!/Users/tim/anaconda3/bin/python

# This simple example shows how to do basic rendering and pipeline
# creation.

# noinspection PyUnresolvedReferences
import vtkmodules.vtkInteractionStyle

# noinspection PyUnresolvedReferences
import vtkmodules.vtkRenderingOpenGL2
from vtkmodules.vtkCommonColor import vtkNamedColors
from vtkmodules.vtkIOImage import vtkPNGWriter
from vtkmodules.vtkRenderingCore import (
    vtkActor,
    vtkPolyDataMapper,
    vtkRenderWindow,
    vtkRenderWindowInteractor,
    vtkRenderer,
    vtkWindowToImageFilter,
)
from vtk import vtkPolyDataReader
# import random
import os
import hashlib

def convertRange(val, old_min, old_max, new_min, new_max):
    if old_min == old_max:
        return new_min
    return (((val - old_min) * (new_max - new_min)) / (old_max - old_min)) + new_min

def main(c):
    os.makedirs(f"/Users/tim/repos/bridgeport/data/static/MINA/C{c}", exist_ok=True)
    # there are 32 f's (the highest digit in hex) because a md5 hash is 32 characters long
    max_hash = 0xffffffffffffffffffffffffffffffff

    for rot in range(-180, 180, 1):
        print(c, rot)
        out = f"/Users/tim/repos/bridgeport/data/static/MINA/C{c}/C{c}_rot{rot}.png"
        if os.path.exists(out):
            continue
        # Create the graphics structure. The renderer renders into the render
        # window. The render window interactor captures mouse events and will
        # perform appropriate camera or actor manipulation depending on the
        # nature of the events.
        ren = vtkRenderer()
        renWin = vtkRenderWindow()
        renWin.AddRenderer(ren)
        # iren = vtkRenderWindowInteractor()
        # iren.SetRenderWindow(renWin)
        ren.SetBackground(1, 1, 1)
        renWin.SetSize(800, 800)
        renWin.SetWindowName("test")
        # random.seed(123)

        for i in range(1, c + 1):
            reader = vtkPolyDataReader()
            reader.SetFileName(f"/Users/tim/repos/bridgeport/data/MINA/C{c}/C{c}_C{i}.vtk")
            reader.Update()
            polydata = reader.GetOutput()
            mapper = vtkPolyDataMapper()
            actor = vtkActor()
            actor.SetMapper(mapper)
            mapper.SetInputData(polydata)
            h1 = int(hashlib.md5((f"C{c}_{i}_r").encode('utf-8')).hexdigest(), 16) / max_hash
            h2 = int(hashlib.md5((f"C{c}_{i}_g").encode('utf-8')).hexdigest(), 16) / max_hash
            h3 = int(hashlib.md5((f"C{c}_{i}_b").encode('utf-8')).hexdigest(), 16) / max_hash
            actor.GetProperty().SetColor(h1, h2, h3)
            # actor.GetProperty().SetColor(random.random(), random.random(), random.random())
            # set orientation
            actor.RotateY(rot)
            ren.AddActor(actor)

        # This allows the interactor to initalize itself. It has to be
        # called before an event loop.
        # iren.Initialize()

        # We'll zoom in a little by accessing the camera and invoking a "Zoom"
        # method on it.
        ren.ResetCamera()
        # ren.GetActiveCamera().Zoom(1.5)
        # want to zoom more in the 2nd + 3rd quarters
        # when close to 45 or 135, zoom should be largest
        arot = abs(rot)
        if arot <= 45:
            ren.GetActiveCamera().Zoom(convertRange(arot, 1, 45, 1, 1.3))
        elif arot <= 90:
            ren.GetActiveCamera().Zoom(convertRange(90 - arot, 0, 45, 1, 1.3))
        elif arot <= 135:
            ren.GetActiveCamera().Zoom(convertRange(arot, 90, 135, 1, 1.3))
        else:
            ren.GetActiveCamera().Zoom(convertRange(180 - arot, 0, 45, 1, 1.3))
        renWin.Render()

        # screenshot code
        w2if = vtkWindowToImageFilter()
        w2if.SetInput(renWin)
        w2if.Update()
        writer = vtkPNGWriter()
        writer.SetFileName(out)
        writer.SetInputConnection(w2if.GetOutputPort())
        writer.Write()

        # Start the event loop.
        # iren.Start()


if __name__ == "__main__":
    main(32)
    for c in [64, 128, 256, 512, 1024]:
        main(c)
