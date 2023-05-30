# pic-flip
Unlike my [WebGL fluid simulation](https://github.com/JentGent/webgl-fluid-sim), the velocities in this fluid simulation are represented with a staggered, rather than collocated, grid, and the simulation uses a particle-in-cell rather than a purely grid-based method. It still involves eliminating the divergence of the velocity field, but here, the divergence-free field is directly solved for instead of the pressure field.

## [Demo](https://raw.githack.com/JentGent/pic-flip/main/index.html)
![Demo](https://github.com/JentGent/pic-flip/blob/main/demo.gif)
