# Brickiebot Project

run the simulation : 
```
python main.py
```

## Simulation Setup and Libraries
This simulation leverages various functions and libraries:

<b> Swift Simulator:</b> Forms the base of the simulation. <br>
<b>Enable3D:</b> Added to implement physics laws. </br>
<b><a href="https://github.com/mkkellogg/GaussianSplats3D" target="_blank"> Gaussian Splatting Viewer by Mkkellogg:</a></b> Introduced to enhance the immersive aspect of the simulation.

### Activating Gaussian Splatting Visualization
To enable Gaussian splatting visualization, set the `splat` variable to true in the `swift/swift/public/js/index.js` file.


## Major Changes to Libraries

<b>Swift: </b> Overhauled the entire JavaScript portion of the project. </br>
<b>Enable3D: </b> Changed to a Z-up orientation to align with the convention and Swift. </br>
<b>Gaussian Splatting: </b>Converted the library to a standalone version. </br>


## Next steps

The two main improvements for the project would be:

<b>Stabilize Gaussian Splatting Image:</b> Currently, adding the splatting feature results in the loss of OrbitControl. The goal is to make the Gaussian splatting image fixed while retaining control.

<b>Enhance Library Performance:</b> Regularly update and improve Mkkellogg's library to enhance the fluidity of the splatting effect.




## If error with windows : 

replace ligne from SwiftRoute.py which contain :
```Python
self.path = urllib.parse.unquote(self.path[9:])
```

by 

```Python
self.path = urllib.parse.unquote(self.path[10:])
```