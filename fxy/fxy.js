/* jshint esversion: 6 */

import * as THREE from 'https://unpkg.com/three@0.121.0/build/three.module.js';
import {OrbitControls} from 'https://unpkg.com/three@0.121.0/examples/jsm/controls/OrbitControls.js';
// import {Stats} from 'https://unpkg.com/stats.js@0.17.0/build/stats.min.js';



// import {Lut} from 'https://unpkg.com/three@0.121.0/examples/jsm/math/Lut.js';
import { GUI} from '../base/dat.gui.module.js';
import {
  colorBufferVertices,
  blueUpRedDown,
  addColorBar,
  marchingSegments,
  drawAxes,
  drawGrid,
  labelAxes,
  ArrowBufferGeometry,
  vMaxMin,
  gaussLegendre,
  marchingSquares,
} from "../base/utils.js";

// Make z the default up
THREE.Object3D.DefaultUp.set(0,0,1);

/* Some constants */
const tol = 1e-12 //tolerance for comparisons
let gridMax = 1;
let gridStep = gridMax / 10;
const pi = Math.PI;



const scene = new THREE.Scene();
const canvas = document.querySelector("#c");
const renderer = new THREE.WebGLRenderer({antialias: true, alpha : true,canvas: canvas});

scene.background = new THREE.Color( 0xddddef );

const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth/canvas.clientHeight, 0.1, 1000);

camera.position.x = gridMax*2/2;
camera.position.y = -gridMax*3/2 ;
camera.position.z = gridMax*4.5/2;
camera.up.set(0,0,1);
camera.lookAt( 0,0,0 );

// Lights


// soft white light
scene.add( new THREE.AmbientLight( 0xA0A0A0 ) );

//something to make shiny things shine - a chandelier
const chandelier = new THREE.Object3D();
const candles = 2;
for (let i=0; i < candles; i++) {
  for (let j=0; j < 2; j++) {
    const light = new THREE.PointLight(0xFFFFFF, .5, 1000);
    light.position.set(20*Math.cos(i*2*pi/candles + Math.pow(-1,j) * 1/2),20*Math.sin(i*2*pi/candles + Math.pow(-1,j)*1/2),Math.pow(-1,j)*10);
    chandelier.add(light);
  }
}
scene.add(chandelier);

// controls 

const controls = new OrbitControls(camera, renderer.domElement);

// controls.rotateSpeed = 1.0;
// controls.zoomSpeed = 1.2;
// controls.panSpeed = 0.8;

// controls.keys = [ 65, 83, 68 ];

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.target.set( 0,0,0);
controls.addEventListener('change', requestFrameIfNotRequested);

window.addEventListener('resize', requestFrameIfNotRequested);

//axes

const lineMaterial = new THREE.LineBasicMaterial( { color: 0x551122, transparent: true, opacity: 0.8 } );

// Grid

let gridMeshes = new THREE.Object3D();
// gridMeshes = drawGrid( {lineMaterial});
gridMeshes.renderDepth = -1;
scene.add(gridMeshes);

// Axes
const axesMaterial = new THREE.MeshLambertMaterial( {color: 0x320032} );
let axesHolder = drawAxes( {gridMax, gridStep, axesMaterial});
scene.add(axesHolder)

// Fonts
let [axesText, font] = labelAxes( { scene , render: requestFrameIfNotRequested } );

console.log(axesText, font, "Font");

function rescale(newGridMax=1) {
  const oldGridMax = gridMax;
  gridMax = newGridMax;
  gridStep = gridMax / 10;

  freeBalls(gridMeshes);

  // gridMeshes.copy(drawGrid( {lineMaterial, gridMax, gridStep}));

  freeBalls(axesHolder)
  // Axes
  axesHolder.copy(drawAxes( {gridMax, gridStep, axesMaterial}));
  
  // Fonts

  // for (let index = axesText.length - 1; index >= 0 ; index--) {
  //   const textObject = axesText[index];
  //   freeBalls(textObject);
  //   scene.remove(textObject);
  //   axesText.remove(textObject);
  // }
  console.log(axesText.length);
   
  [axesText, font] = labelAxes( { scene , gridMax, gridStep, render: requestFrameIfNotRequested, axesText } );

  camera.position.multiplyScalar(newGridMax / oldGridMax);
}


const material = new THREE.MeshPhongMaterial({color: 0x121212,shininess: 60,side: THREE.FrontSide,vertexColors: false});
const materialColors = new THREE.MeshPhongMaterial({color: 0xffffff,shininess: 70,side: THREE.DoubleSide, vertexColors: true});
const whiteLineMaterial = new THREE.LineBasicMaterial({color: 0xffffff,linewidth: 2});

whiteLineMaterial.polygonOffset = true;
whiteLineMaterial.polygonOffsetFactor = 0.1;

const redLineMaterial = new THREE.LineBasicMaterial({color: 0xbb3333,linewidth: 4});


const wireMaterial = new THREE.MeshBasicMaterial( { color: 0x333333, wireframe: true } );
const minusMaterial = new THREE.MeshPhongMaterial({color: 0xff3232, shininess: 80, side: THREE.BackSide,vertexColors: false, transparent: true, opacity: 0.7});
const plusMaterial = new THREE.MeshPhongMaterial({color: 0x3232ff, shininess: 80, side: THREE.FrontSide,vertexColors: false, transparent: true, opacity: 0.7});



const surfaces = {
  saddle: {
    z: "x^2 + e^(-y^2) - 1",
    a: "-1",
    b: "1",
    c: "-1",
    d: "1",
  },
  volcano: {
    z: "3*(x^2 + y^2)*exp(-(x^2 + y^2))",
    a: "-2",
    b: "2",
    c: "-2",
    d: "2",
  },
  mtns: {
    z: "cos(2*x)*sin(2*y)",
    a: "-pi/2",
    b: "pi/2",
    c: "-pi/2",
    d: "pi/2",
  },
  plane: {
    z: "x / 5 + y / 2",
    a: "-2",
    b: "2",
    c: "-2",
    d: "2",
  },
}






const rData = {
  a: math.parse("-1").compile(),
  b: math.parse("1").compile(),
  c: math.parse("-1").compile(),
  d: math.parse("1").compile(),
  x: math.parse("x").compile(),
  y: math.parse("y").compile(),
  z: math.parse("x^2 + e^(-y^2) - 1").compile(),
  E: math.parse("x^2 + y^2").compile(),
}

const data = {
  S: 'mtns',
  nX: 30,
  rNum: 10,
  cNum: 10,
  shards: 0,
  nVec: 0,
  shiftLevel: 0.0,
  nL: 10,
  levelDelta: -1,
}

let debug = false;
function processURLSearch() {
  const urlParams = new URLSearchParams(location.search)
  // console.log(urlParams.keys() ? true : false);
  if (urlParams.keys()) {
    urlParams.forEach((val, key) => {
      let element = document.querySelector(`input#custom${key.toUpperCase()}`);
      if (element) {
        rData[key] = math.parse(val).compile();
        element.value = val.toString();
        return;
      } 
      if (["nX", "rNum", "cNum"].indexOf(key) > -1) {
        data[key] = parseInt(val);
        return console.log(key, val);
      }
      if (key === 'debug') {
        debug = val.toLowerCase() === 'true';
        return;
      }
      element = document.querySelector(`input[name=${key}]`);
      if (element) {
        element.checked = val.toLowerCase() === 'true';
        element.oninput();
        
      }
      // const [s,c] = key.split("camera");
      // if (!s) {
      //   camera.position[c.toLowerCase()] = parseFloat(val);
      // }
      
    });
  }
}

function makeQueryStringObject() {
  let query = {};
  Object.keys(rData).forEach( (key) => {
    const element = document.querySelector(`#custom${key.toUpperCase()}`);
    if (element) {
      query[key] = element.value;
    }
  });
  document.querySelectorAll('input[type=checkbox]').forEach( el => {
    query[el.name] = el.checked;
  });
  query = {
    ...query,
    ...data,
    // cameraX: camera.position.x,
    // cameraY: camera.position.y,
    // cameraZ: camera.position.z,
  };
  return query;
}

document
  .querySelectorAll(`.setting-thing>input[type="range"]`)
  .forEach((element) => {
    if (element.id === "scale") {
      element.onchange = () => {
        const val = parseFloat(element.value);
        data[element.name] = val;
        let scala = Math.pow(10, Math.floor(val)) * Math.floor(Math.pow(10,val) / Math.pow(10,Math.floor(val)) );
        scala = Math.round(100 * scala) / 100;
        console.log("Scale to ", scala);
        rescale( scala );
      };
      element.oninput = () => {
        const val = element.value;
        let scala = Math.pow(10, Math.floor(val)) * Math.floor(Math.pow(10,val) / Math.pow(10,Math.floor(val)) );
        scala = Math.round(100 * scala) / 100
        // console.log(scala, "oninput")
        element.nextElementSibling.innerText =  scala.toString() ;
        // rescale (scala);
      }
    } else {
      element.oninput = () => {
        if (element.name === "shiftLevel") {
          data[element.name] = parseFloat(element.value);

          changeLevels( data.shiftLevel );
          requestFrameIfNotRequested();
          
          // if (faucet) initBalls(balls, gridMax);
        } else {
          data[element.name] = parseInt(element.value);
          updateSurface();
        }
        if (debug) {
          let element = document.querySelector("div#dataLog");
          if (!element) {
            element = document.createElement("div");
            element.id = "dataLog";
            debugLog.appendChild(element);
          }
          element.innerText = JSON.stringify(data, null, " ");
        }
        element.nextElementSibling.value = element.value;
      };
    }
  });

document.querySelectorAll("#shards").forEach( (element) => {
  element.oninput = () => {
    data[element.name] = parseInt(element.value);
    updateSurface();

    element.nextElementSibling.value = element.value;
  }
});

let stats;
if (debug) {
  stats = new Stats();
  stats.showPanel( 2 ); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild( stats.dom );
  stats.dom.style.left = 'unset';
  stats.dom.style.top = 'unset';
  stats.dom.style.bottom = '60px';
  stats.dom.style.right = '10px';

}


{
  const element = document.querySelector("input#frameBallVisible");
  element.oninput = () => {
    frameBall.visible = element.checked;
    requestFrameIfNotRequested();
  }
}

{
  const element = document.querySelector("input#levelsVisible");
  element.oninput = () => {
    levelHolder.visible = element.checked;
    requestFrameIfNotRequested();
  }
}

let acidTrails = false;
{
  const element = document.querySelector("input#flattenContours");
  element.oninput = () => {
    data.levelDelta = element.checked ? 1 : -1;
    arrows.grad.visible = element.checked;
    if ( frameRequested ) {
      cancelAnimationFrame( myReq );
    }
    frameRequested = true;
    requestAnimationFrame( animateLevel );
  }
}





let colorFunc;

let surfaceMesh;
function updateSurface() {
  const {a,b,c,d,x,y,z} = rData;
  const A = a.evaluate(), B = b.evaluate();
  const geometry = new THREE.ParametricBufferGeometry( (u,v,vec) => {
    const U = A + (B - A)*u;
    const params = {
      x: U,
      y: (1 - v)*c.evaluate( {x: U} ) + v*d.evaluate({x: U}),
    };
    vec.set(params.x, params.y, z.evaluate( params ) );
  }, data.nX, data.nX);
  const meshGeometry = meshLines(rData, data.rNum, data.cNum, data.nX);
  let material = plusMaterial;
  if (surfaces[data.S].material) {
    material = surfaces[data.S].material;
  }
  if (surfaceMesh) {
    for (let i = 0; i < surfaceMesh.children.length; i++) {
      const mesh = surfaceMesh.children[i];
      mesh.geometry.dispose()
      mesh.geometry = i < 2 ? geometry : meshGeometry;
      if (i < 1) {
        mesh.material = material;
      }

      if (i === 0) {
        if (colorFunc) {
          mesh.material = materialColors;
          let [vMax, vMin] = vMaxMin(mesh, (x,y,z) => rData.E.evaluate({x,y,z}));
          if (vMax == vMin) { 
            if (vMax == 0) {
              vMax = 1;
              vMin = -1;
            } else {
              vMax = 4/3*Math.abs(vMax);
              vMin = -4/3*Math.abs(vMin);
            }
          }
          colorBufferVertices( mesh, (x,y,z) => {
            const value = rData.E.evaluate({x,y,z});
            return blueUpRedDown( 2 * (value - vMin) / (vMax - vMin) - 1 );
          });
          const colorBar = document.querySelector(".colorBar");
          if (colorBar) document.body.removeChild(colorBar);
          addColorBar(vMin, vMax);
        }
      }
      if (i === 1) {
        mesh.visible = ! colorFunc;
      }
    }
  } else {
    surfaceMesh = new THREE.Object3D();
    const backMesh = new THREE.Mesh( geometry, minusMaterial );
    const frontMesh = new THREE.Mesh( geometry, material );
    if (colorFunc) {
      frontMesh.material = materialColors;
      backMesh.visible = false;
      let [vMax, vMin] = vMaxMin(frontMesh, (x,y,z) => rData.E.evaluate({x,y,z}));
      colorBufferVertices( frontMesh, (x,y,z) => {
        const value = rData.E.evaluate({x,y,z});
        return blueUpRedDown( 2 * (value - vMin) / (vMax - vMin) - 1 );
      });
      addColorBar(vMin, vMax);
    }
    // mesh.add(new THREE.Mesh( geometry, wireMaterial ))
    surfaceMesh.add( frontMesh );
    surfaceMesh.add( backMesh );
    surfaceMesh.add( new THREE.LineSegments( meshGeometry, whiteLineMaterial));
  // mesh.visible = false;
    scene.add(surfaceMesh);
  }
  tangentVectors();

  updateLevels();
  if (!frameRequested) render();
   
}

// Exercises
// 

function simpleMathString(s) {return math.simplify(math.parse(s)).toTex()}


const ghostMesh = new THREE.Mesh(undefined, wireMaterial);
scene.add(ghostMesh);

{
  const element = document.querySelector("input#surfaceVisible");
  element.oninput = () => {
    surfaceMesh.visible = element.checked;
    requestFrameIfNotRequested();
  }
}



// let [vMax, vMin] = vMaxMin(surfaceMesh.children[0])

function lcm(x, y) {
  if ((typeof x !== 'number') || (typeof y !== 'number')) 
   return false;
 return (!x || !y) ? 0 : Math.abs((x * y) / gcd(x, y));
}

function gcd(x, y) {
 x = Math.abs(x);
 y = Math.abs(y);
 while(y) {
   var t = y;
   y = x % y;
   x = t;
 }
 return x;
}

let cMin, dMax; // make these globals as useful for tangents.

function meshLines(rData, rNum = 10, cNum = 10, nX = 30) {
  const { a, b, c, d, x, y, z } = rData;
  const N = lcm(lcm(rNum, cNum), nX);
  const A = a.evaluate(),
    B = b.evaluate();
  const du = (B - A) / rNum;
  const dx = (B - A) / lcm(nX, cNum);
  const points = [];
  for (let u = A; u <= B; u += du) {
    const C = c.evaluate({ x: u }),
      D = d.evaluate({ x: u });
    const dy = (D - C) / lcm(nX, rNum);
    const params = { x: u, y: C };
    points.push(
      new THREE.Vector3(
        x.evaluate(params),
        y.evaluate(params),
        z.evaluate(params)
      )
    );
    for (let v = C + dy; v < D; v += dy) {
      params.y = v;
      points.push(
        new THREE.Vector3(
          x.evaluate(params),
          y.evaluate(params),
          z.evaluate(params)
        )
      );
      points.push(
        new THREE.Vector3(
          x.evaluate(params),
          y.evaluate(params),
          z.evaluate(params)
        )
      );
    }
    params.v = D;
    points.push(
      new THREE.Vector3(
        x.evaluate(params),
        y.evaluate(params),
        z.evaluate(params)
      )
    );
  }

  // v-Meshes
  const params = { x: A };
  (cMin = c.evaluate(params)), (dMax = d.evaluate(params));
  for (let u = A + dx; u <= B; u += dx) {
    params.x = u;
    cMin = Math.min(cMin, c.evaluate(params));
    dMax = Math.max(dMax, d.evaluate(params));
  }

  for (let v = cMin; v <= dMax; v += (dMax - cMin) / cNum) {
    const zs = marchingSegments(
      (x) => (c.evaluate({ x: x }) - v) * (v - d.evaluate({ x: x })),
      A,
      B,
      nX
    );
    params.y = v;
    let nextZero = zs.shift();
    for (let u = A; u <= B - dx + tol; u += dx) {
      params.x = u;
      if (c.evaluate(params) <= v && v <= d.evaluate(params)) {
        points.push(
          new THREE.Vector3(
            x.evaluate(params),
            y.evaluate(params),
            z.evaluate(params)
          )
        );
        if (nextZero < u + dx) {
          params.x = nextZero;
          points.push(
            new THREE.Vector3(
              x.evaluate(params),
              y.evaluate(params),
              z.evaluate(params)
            )
          );
          nextZero = zs.shift();
        } else {
          params.x = u + dx;
          points.push(
            new THREE.Vector3(
              x.evaluate(params),
              y.evaluate(params),
              z.evaluate(params)
            )
          );
        }
      } else {
        if (nextZero < u + dx) {
          params.x = nextZero;
          points.push(
            new THREE.Vector3(
              x.evaluate(params),
              y.evaluate(params),
              z.evaluate(params)
            )
          );
          nextZero = zs.shift();
          params.x = u + dx;
          points.push(
            new THREE.Vector3(
              x.evaluate(params),
              y.evaluate(params),
              z.evaluate(params)
            )
          );
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return geometry;
}

//
//
// UI for parametric surface
//
//
// {
//   const surfaceMenu = document.querySelector("#surfaceMenu");
// Object.keys(surfaces).forEach(surf => {
  
// });
// }


const surfs = Object.keys(surfaces);
for (let i = 0; i < surfs.length; i++) {
  const surf = surfs[i];
  const element = document.getElementById(surf);

  element.onclick = () => {
    data.S = surf;
    const sf = surfaces[surf];
    let el;
    for (let i = 0; i < "zabcd".length; i++) {;
      const c = "zabcd"[i];
      console.log(surf, c);
      el = document.querySelector(`#custom${c.toUpperCase()}`);
      el.value = sf[c];
      rData[c] = math.parse(sf[c]).compile();
      // el.dispatchEvent(new Event('change'));
    }
    updateSurface();
    for (let j = 0; j < surfs.length; j++) {
      const el = document.getElementById(surfs[j]);
      const elForm = document.querySelector(`.surface-choices-item#${surfs[j]}-formula`)
      if (i === j) {
        el.classList.add("choices-selected");
        if (elForm) elForm.style.visibility = 'visible';
      } else {
        el.classList.remove("choices-selected");
        if (elForm) elForm.style.visibility = 'hidden';
      }
    }
  }
}

{
  const XYZ = "ZABCD";
  for (let i = 0; i < XYZ.length; i++) {
    const ch = XYZ[i];
    const id = `custom${ch}`;
    const element = document.querySelector(`#${id}`);

    element.onchange = () => {
      const c = ch.toLowerCase();
      // console.log(element.value, "is the value of" + ch);
      const form = document.querySelector(`#${id} + .form-warning`);
      try {
        const expr = math.parse(element.value).compile();
        rData[c] = expr;
        form.innerText = '';
      } catch (e) {
        console.error( e );
        form.innerText = ' ' + e.name;
        return;
      }
      // console.log(expr.evaluate( {u: 2, v: 1} ));
      updateSurface();
    };
  }
}

// Color based on scalar field

// Runge-Kutta method
function rk4(x, y, z, F, dt) {
  // Returns final (x1,y1,z1) array after time dt has passed.
  //        x,y,z: initial position
  //        F: r' function a(x,v,dt) (must be callable)
  //        dt: timestep
  const vec = new THREE.Vector3(),
        f1 = new THREE.Vector3(),
        f2 = new THREE.Vector3(),
        f3 = new THREE.Vector3(),
        f4 = new THREE.Vector3();
  
  f1.copy(F(x,y,z,vec).multiplyScalar(dt));
  f2.copy(F(x + f1.x/2, y + f1.y/2, z + f1.z/2,vec).multiplyScalar(dt));
  f3.copy(F(x + f2.x/2, y + f2.y/2, z + f2.z/2,vec).multiplyScalar(dt));
  f4.copy(F(x + f3.x, y + f3.y, z + f3.z,vec).multiplyScalar(dt));

  const x1 = x + (f1.x + 2*f2.x + 2*f3.x + f4.x)/6;
  const y1 = y + (f1.y + 2*f2.y + 2*f3.y + f4.y)/6;
  const z1 = z + (f1.z + 2*f2.z + 2*f3.z + f4.z)/6;

  return [x1, y1, z1];
}

// 1-norm
function norm1(v) {
  return Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
}


const balls = new THREE.Object3D();
const fieldMaterial = new THREE.MeshLambertMaterial( {color: 0x373765 } )
const curlMaterial = new THREE.MeshLambertMaterial( {color: 0x653737 } )
const trailMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, vertexColors: true } );
const trails = new THREE.LineSegments(new THREE.BufferGeometry(), trailMaterial );
const arrowGeometries = [], heightResolution = 150, vfScale = gridStep*5;
const arrowArgs = {radiusTop: vfScale/30, radiusBottom: vfScale/100, heightTop: vfScale/8};
let trailColors = [], trailPoints = [], colors = [];
const trailLength = 250; 
// scene.add(trails);



for (let i = 1; i <= heightResolution; i++) {
  const geometry = new ArrowBufferGeometry( {
    radiusBottom: vfScale/100, 
    height: i/heightResolution*vfScale, 
    heightTop: Math.min(i/heightResolution*vfScale/3,vfScale/8) ,
    radiusTop: Math.min(vfScale/30, i/heightResolution*vfScale/6)
  });
  arrowGeometries.push(geometry)
}




function freeBalls(objectHolder) {
  for (let i = objectHolder.children.length - 1; i >= 0 ; i--) {
    const element = objectHolder.children[i];
    if (element.geometry.dispose) element.geometry.dispose();
    objectHolder.remove(element);
  }
}

function freeTrails() {
  trailPoints = [];
}

 



//
//   UI for field
//





// Select a point
const frameBall = new THREE.Object3D();
const arrows = {u: new THREE.Mesh(), v: new THREE.Mesh(), n: new THREE.Mesh(), grad: new THREE.Mesh()};
const ruColors = {u: 0x992525, v: 0x252599, grad: 0x259925, n: 0xb6b6b6};
for (let key of Object.keys(arrows)) {
  arrows[key].material = new THREE.MeshBasicMaterial( {color: ruColors[key] });
  frameBall.add(arrows[key])
}

const pointMaterial = new THREE.MeshLambertMaterial( { color: 0xffff33});
const point = new THREE.Mesh( new THREE.SphereGeometry(gridStep/8, 16,16),pointMaterial);

scene.add(point);

const planeBall = new THREE.Mesh();
frameBall.add(planeBall);

const curveBall = new THREE.LineSegments(new THREE.BufferGeometry(), redLineMaterial );
scene.add(curveBall);

frameBall.visible = false;

scene.add(frameBall);

function ruFrame({u = 0.5, v = 0.5, dt = .001, du = 1, dv = 1 } = {} ) {
  const {a,b,c,d,x,y,z} = rData;
  const A = a.evaluate(), B = b.evaluate()
  const U = (1 - u)*A + u*B; 
  const C = c.evaluate( {x: U} ), D = d.evaluate( {x: U} );
  const V = (1 - v)*C + v*D; 
  // const du = (B - A) / data.rNum, dv = (dMax - cMin) / data.cNum;

  const p = new THREE.Vector3(x.evaluate({x: U, y: V}), y.evaluate({x: U, y: V}), z.evaluate({x: U, y: V})), 
    ruForward = new THREE.Vector3(x.evaluate({x: U + dt/2, y: V}), y.evaluate({x: U + dt/2, y: V}), z.evaluate({x: U + dt/2, y: V})), 
    ruBackward = new THREE.Vector3(x.evaluate({x: U - dt/2, y: V}), y.evaluate({x: U - dt/2, y: V}), z.evaluate({x: U - dt/2, y: V})), 
    rvForward = new THREE.Vector3(x.evaluate({x: U, y: V + dt/2}), y.evaluate({x: U, y: V + dt/2}), z.evaluate({x: U, y: V + dt/2})),
    rvBackward = new THREE.Vector3(x.evaluate({x: U, y: V - dt/2}), y.evaluate({x: U, y: V - dt/2}), z.evaluate({x: U, y: V - dt/2}));
  
    
    ruForward.sub(ruBackward).multiplyScalar((B - A) * du / dt);
    rvForward.sub(rvBackward).multiplyScalar((D - C) * dv / dt);
    // console.log("inside ruF",dMax,cMin,{p: p, u: ruForward, v: rvForward, n: ruForward.clone().cross(rvForward)}dv);
  // console.log(p,ru,rv);
  
  // level curve
  const pts = marchingSquares( {
    f: (x,y) => z.evaluate( {x: x, y: y} ),
    level: z.evaluate( {x: U, y: V}),
    xmin: A,
    xmax: B,
    ymin: c.evaluate(),
    ymax: d.evaluate(),
    zLevel: 0,
    nX: data.nX,
    nY: data.nX,
  })

  return {p: p, u: ruForward, v: rvForward, n: ruForward.clone().cross(rvForward), levelSegments: pts}
}

// Construct tangent vectors at a point u,v (both 0 to 1)
function tangentVectors( {u = 0.5, v = 0.5, dt = .001, plane = true } = {} ) {

  const dr = ruFrame( {u,v,dt,du: 1/data.rNum, dv: 1/data.cNum});

  point.position.copy(dr.p);


  const arrowParams = { radiusTop: gridStep / 10,  radiusBottom: gridStep / 20, heightTop: gridStep/7 }

  for (const [key, arrow] of Object.entries(arrows)) {
    const pos = dr.p.clone();
    if (key === "grad") {
      pos.set(pos.x, pos.y, 0)
      arrow.position.copy(pos);
      const grad = new THREE.Vector3(dr.u.z, dr.v.z, 0);
      arrow.geometry = new ArrowBufferGeometry( { ...arrowParams, height: grad.length() } )
      arrow.lookAt(pos.add(grad));
      scene.add(arrow);
      arrow.visible = document.querySelector("input#flattenContours").checked;
      // console.log(document.querySelector("input#flattenContours").checked, "flat click")
    } else {
      arrow.position.copy(pos);
      if ( arrow.geometry ) arrow.geometry.dispose();
      arrow.geometry = new ArrowBufferGeometry( { ...arrowParams, height: dr[key].length() } )
      arrow.lookAt(pos.add(dr[key]));
    }
  }

  // tangent plane
  planeBall.geometry.dispose();

  const tangentPlaneGeometry = new THREE.ParametricBufferGeometry((u,v,vec) => {
    const U = -2 + 4*u, V = -2 + 4*v;

    vec.copy(dr.p).add(dr.u.clone().multiplyScalar(U)).add(dr.v.clone().multiplyScalar(V));
    vec.add(new THREE.Vector3(0,0,0.0001));
  }, 2,2)

  planeBall.geometry = tangentPlaneGeometry;
  planeBall.material = shardMaterial;

  // level curve
  curveBall.geometry.setFromPoints(dr.levelSegments);
  curveBall.level = point.position.z;
  curveBall.position.set(0,0,shiftInterpolation(data.shiftLevel, curveBall.level))

}







const raycaster = new THREE.Raycaster();

let mouseVector = new THREE.Vector2();


function onMouseMove( e ) {
    // normalized mouse coordinates
    if (selectNewPoint) {
      mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
      mouseVector.y = 1 - 2 * ( e.clientY / window.innerHeight );
    
      raycaster.setFromCamera( mouseVector, camera );

      const intersects = raycaster.intersectObjects( [ surfaceMesh.children[0], surfaceMesh.children[1] ], true );

      if ( intersects.length > 0 ) {
        const intersect = intersects[0];
        // console.log(intersect.uv);
        point.position.x = intersect.point.x;
        point.position.y = intersect.point.y;
        point.position.z = intersect.point.z;

        const u = intersect.uv.x, v = intersect.uv.y;
        tangentVectors({u,v});
      }    
    }
	}


let selectNewPoint = false;


window.addEventListener('mousemove',onMouseMove,false);
window.addEventListener('keydown',(e) => {
  if (e.key === "Shift") {
    selectNewPoint = true;
    cancelAnimationFrame(myReq);
    frameRequested = true;
    myReq = requestAnimationFrame(animateLevel);
    // frameBall.visible = true;
  }
},false);
window.addEventListener('keyup',(e) => {
  if (e.key === "Shift") {
    selectNewPoint = false;
    cancelAnimationFrame(myReq);
    frameRequested = false;
    last = null;
    // frameBall.visible = false;
  }
},false);


// Add surface area pieces

const shards = new THREE.Object3D();
const shardMaterial = new THREE.MeshPhongMaterial( {color: 0x4b4b4b, shininess: 80, side: THREE.DoubleSide, transparent: true, opacity: 0.5})
scene.add(shards);


// from https://threejsfundamentals.org 
function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

let myReq,last,frameRequested = false;

function requestFrameIfNotRequested() {
  if (!frameRequested) {
    frameRequested = true;
    myReq = requestAnimationFrame(render);
  }
}

function animateLevel(time) {
  controls.update();
  for (let index = 0; index < axesText.length; index++) {
    const element = axesText[index];
    element.lookAt(camera.position);
  }

  if (! last) {
    last = time;
  }

  if (debug) {
    stats.begin() ;
    const element = document.querySelector("div#timeLog");
    timeLog.innerText = (Math.round((time - last)*1000)/1000).toString();
  }

  if (((data.shiftLevel < 3) && data.levelDelta > 0 ) || ((data.shiftLevel > 0) && data.levelDelta < 0)) {
    const newLevel = data.shiftLevel + data.levelDelta*(time - last)*0.001;
    data.shiftLevel = Math.max(0,Math.min(3,newLevel));
    changeLevels( data.shiftLevel );

    myReq = requestAnimationFrame(animateLevel);
    last = time;
  } else {
    if (selectNewPoint) {
      myReq = requestAnimationFrame(animateLevel);
      last = time;
    } else {
      frameRequested = false;
      last = null;
    }
  }


  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

  }


  renderer.render(scene, camera);

  if (debug) stats.end();
}

let debugLog;
if (debug) {
  debugLog = document.createElement('div');
  const timeLog = document.createElement('div');
  debugLog.classList.add('debugger');
  document.body.appendChild(debugLog);
  debugLog.appendChild(timeLog);
  timeLog.id = "timeLog";
  }

// start the tap closed
let faucet = false;



document.getElementById("encodeURL").onclick = () => {
    // console.log();
    const qString = new URLSearchParams( makeQueryStringObject() );
    // console.log(qString.toString());
    window.location.search = qString.toString();
};

document.querySelector("#cameraReset").onclick = () => {
  // console.log();
  controls.target.set(0,0,0);
  requestFrameIfNotRequested();
};

{

  const saveBlob = (function() {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    return function saveData(blob, fileName) {
       const url = window.URL.createObjectURL(blob);
       a.href = url;
       a.download = fileName;
       a.click();
    };
  }());

  const elem = document.querySelector('#screenshot');
  elem.addEventListener('click', () => {
    renderer.render(scene, camera);
    canvas.toBlob((blob) => {
      saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
    });
  });
}

// gui.domElement.style.zIndex = 2000;


function render() {
    frameRequested = false;

    for (let index = 0; index < axesText.length; index++) {
      const element = axesText[index];
      element.lookAt(camera.position);
    }

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
  
    }

    controls.update();
    renderer.render(scene, camera);
}

//initialize frame
{
  const uv = {x: 0.5, y: 0.5};
  point.position.set(rData.x.evaluate(uv));
  tangentVectors();
}

const levelHolder = new THREE.Object3D();
scene.add(levelHolder)

let shiftLevel = 0;

function shiftInterpolation(t,L) {
  if (t < 2) {
    return L - L/2*t;
  }
  else {
    return L/2*((3 - t)**3 - (3 - t)**2);
  }
}

function changeLevels( t ) {
  for (let index = 0; index < levelHolder.children.length; index++) {
    const element = levelHolder.children[index];
    element.position.set(0, 0, shiftInterpolation( t, element.level ))
  }
  curveBall.position.set(0, 0, shiftInterpolation( t, curveBall.level ))

}

function updateLevels() {
  for (let index = levelHolder.children.length - 1; index >= 0; index--) {
    const element = levelHolder.children[index];
    element.geometry.dispose();
    levelHolder.remove(element);
  }
  const {a,b,c,d,z} = rData;
  let C=0, D=0, zMin = 0, zMax = 0;
  const [A,B] = [a.evaluate(),b.evaluate()];
  for (let i=0; i <= data.nL; i++) {
    C = Math.min(C,c.evaluate({x: A + (B - A)*i/data.nL}));
    D = Math.max(D,d.evaluate({x: A + (B - A)*i/data.nL}));
    for (let j=0; j <= data.nL; j++) {
      const Z = z.evaluate( {x: A + (B - A)*i/data.nL, y:C + (D - C)*j/data.nL});
      zMin = Math.min(zMin, Z);
      zMax = Math.max(zMax, Z)
    }
  }

  for (let lev = zMin; lev <= zMax; lev += Math.max((zMax - zMin) / data.nL ), 0.01) {

    const points = marchingSquares( {
      f: (x,y) =>  { return z.evaluate( {x, y} ); },
      xmin: A,
      xmax: B,
      ymin: C,
      ymax: D,
      level: lev,
      zLevel: 0,
      nX: data.nX,
      nY: data.nX,
    } );

    // console.log(points[2]);

    if (points.length > 1) {
      const levelGeometry = new THREE.BufferGeometry();

      levelGeometry.setFromPoints( points );
      
      const levelMesh = new THREE.LineSegments( levelGeometry, new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 3, transparent: false } ));
      
      levelMesh.level = lev;
      levelMesh.position.set(0,0,shiftInterpolation(data.shiftLevel, lev))

      levelHolder.add(levelMesh);
    }
  }

  // change selected level curve height
  curveBall.position.set(0,0,shiftInterpolation(data.shiftLevel, curveBall.level))


}

processURLSearch()

updateSurface();

requestFrameIfNotRequested();