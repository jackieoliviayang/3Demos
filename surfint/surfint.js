/* jshint esversion: 6 */

import * as THREE from 'https://unpkg.com/three@0.121.0/build/three.module.js';
import {OrbitControls} from 'https://unpkg.com/three@0.121.0/examples/jsm/controls/OrbitControls.js';
// import {Stats} from 'https://unpkg.com/stats.js@0.17.0/build/stats.min.js';

// const stats = new Stats();
// stats.showPanel( 2 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild( stats.dom );


// import {Lut} from 'https://unpkg.com/three@0.121.0/examples/jsm/math/Lut.js';
import { GUI} from '../base/dat.gui.module.js';
import { colorBufferVertices, blueUpRedDown, addColorBar, marchingSegments, drawAxes, drawGrid, labelAxes, ArrowBufferGeometry } from "../base/utils.js";

// Make z the default up
THREE.Object3D.DefaultUp.set(0,0,1);

/* Some constants */
const nX = 30; // resolution for surfaces
const tol = 1e-12 //tolerance for comparisons
const xmin = -1; // domain of function
const xmax = 1;
const ymin = -1;
const ymax = 1;
const gridMax = Math.max(...[xmin,xmax,ymin,ymax].map(Math.abs));
const gridStep = gridMax / 10;
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
// let directionalLight = new THREE.PointLight( 0xffffff, 0.5 );
// directionalLight.position.set(0,50,0)
// scene.add( directionalLight );
// directionalLight = new THREE.PointLight( 0xffffff, 0.5 );
// directionalLight.position.set(0,-50,0)
// scene.add( directionalLight );
// directionalLight = new THREE.PointLight( 0xffffff, 0.5 );
// directionalLight.position.set(50,0,50)
// scene.add( directionalLight );
// directionalLight = new THREE.PointLight( 0xffffff, 0.5 );
// directionalLight.position.set(-50,0,-50)
// scene.add( directionalLight );
// directionalLight = new THREE.PointLight( 0xffffff, 0.5 );
// directionalLight.position.set(50,0,-50)
// scene.add( directionalLight );
// directionalLight = new THREE.PointLight( 0xffffff, 0.5 );
// directionalLight.position.set(-50,0,50)
// scene.add( directionalLight );

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
// controls.addEventListener('change',render);

// window.addEventListener('resize', render);

//axes

const lineMaterial = new THREE.LineBasicMaterial( { color: 0x551122, transparent: true, opacity: 0.8 } );

// Grid

let gridMeshes = drawGrid( {lineMaterial});
gridMeshes.renderDepth = -1;
scene.add(gridMeshes);

// Axes
const axesMaterial = new THREE.MeshLambertMaterial( {color: 0x320032} );
const axesHolder = drawAxes( {gridMax, gridStep, axesMaterial});
scene.add(axesHolder)

// Fonts
const [axesText, font] = labelAxes( { scene } );


const material = new THREE.MeshPhongMaterial({color: 0x121212,shininess: 60,side: THREE.FrontSide,vertexColors: false});
const materialRandom = new THREE.MeshPhongMaterial({color: 0x0000ff,shininess: 70,side: THREE.FrontSide,vertexColors: false});
const whiteLineMaterial = new THREE.LineBasicMaterial({color: 0xffffff,linewidth: 2});

whiteLineMaterial.polygonOffset = true;
whiteLineMaterial.polygonOffsetFactor = 0.1;

const redLineMaterial = new THREE.LineBasicMaterial({color: 0xbb0000,linewidth: 14});


const wireMaterial = new THREE.MeshBasicMaterial( { color: 0x333333, wireframe: true } );
const minusMaterial = new THREE.MeshPhongMaterial({color: 0xff3232, shininess: 80, side: THREE.BackSide,vertexColors: false, transparent: true, opacity: 0.7});
const plusMaterial = new THREE.MeshPhongMaterial({color: 0x3232ff, shininess: 80, side: THREE.FrontSide,vertexColors: false, transparent: true, opacity: 0.7});



const surfaces = {
  graphs: {
    x: "u",
    y: "v", 
    z: "sin(3*u - v)*exp(-u^2/2 - v^2/2)/2",
    a: "-1",
    b: "1",
    c: "-1",
    d: "1",
    // tex: {
    //   x: "u",
    //   y: "v",
    //   z: " \\frac12\\sin(3u - v) e^{-\\frac{u^2 + v^2}{2}}",
    //   ru: "\\vec i + f_u\\,\\vec k",
    //   rv: "\\vec j + f_v\\,\\vec k",
    //   n: "-f_u\\,\\vec i -f_v\\,\\vec j + \\vec k",
    // },
  },
  revolutions: {
    x: "u", 
    y: "4/5 cos(u) sin(v)",
    z: "4/5 cos(u) cos(v)",
    a: "-pi/2",
    b: "pi/2",
    c: "0",
    d: "2*pi",
  },
  spheres: {
    x: "sin(u) cos(v)", 
    y: "sin(u) sin(v)",
    z: "cos(u)",
    a: "0.0001",
    b: "pi/2",
    c: "0",
    d: "2 pi",
  },
  customSurf: {
    x: "(1 + cos(u/2)*v/3)*cos(u)", 
    y: "(1 + cos(u/2)*v/3)*sin(u)",
    z: "(sin(u/2)*v/3)",
    a: "0",
    b: "2 pi",
    c: "-1",
    d: "1",
  },
  kiss: {
    x: "(cos(u) + 1.001)sin(v) / 2", 
    y: "(cos(u) + 1.001)cos(v) / 2",
    z: "u/2",
    a: "-pi/6",
    b: "pi",
    c: "0",
    d: "2 pi",
    material: new THREE.MeshStandardMaterial( {color: 0xffffff, roughness: 0.5, metalness: 0.7 } )
  },
  bugle: {
    x: "u < 0 ? (1 + cos(v)*2^(-9*pi/20)/8) : (u < 9*pi/2 ? (1 + cos(v)*2^((-9*pi/2 + u)/10)/8)*cos(u) : -1.4*(u - 9*pi/2))", 
    y: "u < 0 ? (u + cos(v)*2^(-9*pi/20)/8) : (u < 9*pi/2 ? (1 + cos(v)*2^((-9*pi/2 + u)/10)/8)*sin(u) : 1 + (2^((u - 9*pi/2)/10)/8 + (u - 9*pi/2)^2/2)*cos(v))", 
    z: "u < 0 ? (sin(v)*2^(-9*pi/20)/8) : (u < 9*pi/2 ? (sin(v)*2^((-9*pi/2 + u)/10)/8) + ( (u*4/(9*pi) - 1)*((u*4/(9*pi) - 1)^2-1)^2/3 ) : (2^((u - 9*pi/2)/10)/8 + (u - 9*pi/2)^2/2)*sin(v))", 
    a: "-1.3",
    b: "9*pi/2 + 1",
    c: "0",
    d: "2 pi",
    material: new THREE.MeshStandardMaterial( {color: 0xffffbb, roughness: 0.5, metalness: 0.7 } )
  },
}

const rData = {
  a: math.parse("-1").compile(),
  b: math.parse("1").compile(),
  c: math.parse("-1").compile(),
  d: math.parse("1").compile(),
  x: math.parse("u").compile(),
  y: math.parse("v").compile(),
  z: math.parse("(1/4 - u/4)^3").compile(),
}

const data = {
  r: 'graphs',
  nX: 30,
  rNum: 10,
  cNum: 10,
  shards: 0,
}

const urlParams = new URLSearchParams(location.search)
console.log(urlParams.keys() ? true : false);
if (urlParams.keys()) {
  urlParams.forEach((val, key) => {
    const element = document.querySelector(`input#custom${key.toUpperCase()}`);
    if (element) {
      rData[key] = math.parse(val).compile();
      element.value = val.toString();
      return;
    } 
    if (["nX", "rNum", "cNum"].indexOf(key) > -1) {
      data[key] = parseInt(val);
      return console.log(key, val);
    }
    // const [s,c] = key.split("camera");
    // if (!s) {
    //   camera.position[c.toLowerCase()] = parseFloat(val);
    // }
    
  });
}

function makeQueryStringObject() {
  let query = {};
  Object.keys(rData).forEach( (key) => {
    const element = document.querySelector(`#custom${key.toUpperCase()}`);
    if (element) {
      query[key] = element.value;
    }
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

document.querySelectorAll("#settings-box>div>input").forEach( (element) => {
  element.oninput = () => {
    data[element.name] = parseInt(element.value);
    updateSurface();

    element.nextElementSibling.value = element.value;
  }
});

document.querySelectorAll("#shards").forEach( (element) => {
  element.oninput = () => {
    data[element.name] = parseInt(element.value);
    updateSurface();

    element.nextElementSibling.value = element.value;
  }
});

{
  const element = document.querySelector("input#frameBallVisible");
  element.oninput = () => {
    frameBall.visible = element.checked;
    // console.log("frameball checked", element.checked)
    // updateSurface
  }
}

// const gui = new GUI();
// gui.add(data, 'nX', 2, 60, 1).name("Segments").onChange(() => {
//   if (myReq) {
//     cancelAnimationFrame(myReq);
//   }
//   myReq = requestAnimationFrame(updateSurface);
// });
// gui.add(data,'rNum',2,60,1).name("u-Meshes").onChange(() => {
//   if (myReq) {
//     cancelAnimationFrame(myReq);
//   }
//   myReq = requestAnimationFrame(updateSurface)
// });
// gui.add(data,'cNum',2,60,1).name("v-Meshes").onChange(() => {
//   if (myReq) {
//     cancelAnimationFrame(myReq);
//   }
//   myReq = requestAnimationFrame(updateSurface)
// });

let surfaceMesh;
function updateSurface() {
  const {a,b,c,d,x,y,z} = rData;
  const A = a.evaluate(), B = b.evaluate();
  const geometry = new THREE.ParametricBufferGeometry( (u,v,vec) => {
    const U = A + (B - A)*u;
    const params = {
      u: U,
      v: (1 - v)*c.evaluate( {u: U} ) + v*d.evaluate({u: U}),
    };
    vec.set(x.evaluate( params ), y.evaluate( params ), z.evaluate( params ) );
  }, data.nX, data.nX);
  const meshGeometry = meshLines(rData, data.rNum, data.cNum, data.nX);
  let material = plusMaterial;
  if (surfaces[data.r].material) {
    material = surfaces[data.r].material;
  }
  if (surfaceMesh) {
    for (let i = 0; i < surfaceMesh.children.length; i++) {
      const mesh = surfaceMesh.children[i];
      mesh.geometry.dispose()
      mesh.geometry = i < 2 ? geometry : meshGeometry;
      if (i < 1) {
        mesh.material = material;
      }
    }
  } else {
    surfaceMesh = new THREE.Object3D();
    const frontMesh = new THREE.Mesh( geometry, material );
    const backMesh = new THREE.Mesh( geometry, minusMaterial );
    // mesh.add(new THREE.Mesh( geometry, wireMaterial ))
    surfaceMesh.add( frontMesh );
    surfaceMesh.add( backMesh );
    surfaceMesh.add( new THREE.LineSegments( meshGeometry, whiteLineMaterial));
  // mesh.visible = false;
    scene.add(surfaceMesh);
  }
  tangentVectors();
  updateShards(data.shards);
}



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

function meshLines( rData, rNum=10, cNum=10 , nX=30) {
  const {a,b,c,d,x,y,z} = rData;
  const N = lcm(lcm(rNum,cNum),nX);
  const A = a.evaluate(), B = b.evaluate();
  const du = (B - A)/rNum;
  const dx = (B - A)/lcm(nX,cNum);
  const points = [];
  for (let u=A; u <= B; u += du ) {
    const C = c.evaluate( {u: u} ), D = d.evaluate( {u: u} );
    const dy = (D - C)/lcm(nX,rNum);
    const params = {u: u, v: C};
    points.push(new THREE.Vector3(x.evaluate( params ), y.evaluate( params ), z.evaluate( params )))
    for (let v=C + dy; v < D; v += dy) {
      params.v = v;
      points.push(new THREE.Vector3(x.evaluate( params ), y.evaluate( params ), z.evaluate( params )))
      points.push(new THREE.Vector3(x.evaluate( params ), y.evaluate( params ), z.evaluate( params )))
    }
    params.v = D;
    points.push(new THREE.Vector3(x.evaluate( params ), y.evaluate( params ), z.evaluate( params )))
  }
  
  // v-Meshes
  const params = {u: A};
  cMin = c.evaluate( params ), dMax = d.evaluate( params );
  for (let u=A+dx; u <= B; u += dx) {
    params.u = u;
    cMin = Math.min(cMin, c.evaluate( params ) );
    dMax = Math.max(dMax, d.evaluate( params ) );
  }

  for (let v = cMin; v <= dMax; v += (dMax - cMin)/cNum ) {
    const zs = marchingSegments( x => (c.evaluate( {u: x} ) - v)*(v - d.evaluate( {u: x} )), A, B, nX);
    params.v = v;
    let nextZero = zs.shift();
    for (let u=A; u <= B - dx + tol; u += dx) {
      params.u = u;
      if (c.evaluate( params ) <= v && v <= d.evaluate( params )) {
        points.push(new THREE.Vector3( x.evaluate( params ), y.evaluate( params ), z.evaluate( params )));
        if (nextZero < u + dx) {
          params.u = nextZero;
          points.push(new THREE.Vector3( x.evaluate( params ), y.evaluate( params ), z.evaluate( params )));
          nextZero = zs.shift();
        } else {
          params.u = u + dx;
          points.push(new THREE.Vector3( x.evaluate( params ), y.evaluate( params ), z.evaluate( params )));
        }
      } else {
          if (nextZero < u + dx) {
            params.u = nextZero;
            points.push(new THREE.Vector3( x.evaluate( params ), y.evaluate( params ), z.evaluate( params )));
            nextZero = zs.shift();
            params.u = u + dx;
            points.push(new THREE.Vector3( x.evaluate( params ), y.evaluate( params ), z.evaluate( params )));
          }
      }
    }
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints( points );
  return geometry;
}


const surfs = ["graphs","revolutions","spheres","customSurf"];
for (let i = 0; i < surfs.length; i++) {
  const surf = surfs[i];
  const element = document.getElementById(surf);

  element.onclick = () => {
    data.r = surf;
    const sf = surfaces[surf];
    let el;
    for (let i = 0; i < "xyzabcd".length; i++) {;
      const c = "xyzabcd"[i];
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
  const XYZ = "XYZABCD";
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


// Select a point
const frameBall = new THREE.Object3D();
const arrows = {u: new THREE.Mesh(), v: new THREE.Mesh(), n: new THREE.Mesh()};
const ruColors = {u: 0xffff33, v: 0xff33ff, n: 0x33ffff};
for (let key of Object.keys(arrows)) {
  arrows[key].material = new THREE.MeshBasicMaterial( {color: ruColors[key] });
  frameBall.add(arrows[key])
}

const pointMaterial = new THREE.MeshLambertMaterial( { color: 0xffff33});
const point = new THREE.Mesh( new THREE.SphereGeometry(gridStep/8, 16,16),pointMaterial);

frameBall.add(point);
frameBall.visible = false;

scene.add(frameBall);

function ruFrame({u = 0.5, v = 0.5, dt = .001, du = 1, dv = 1 } = {} ) {
  const {a,b,c,d,x,y,z} = rData;
  const A = a.evaluate(), B = b.evaluate()
  const U = (1 - u)*A + u*B; 
  const C = c.evaluate( {u: U} ), D = d.evaluate( {u: U} );
  const V = (1 - v)*C + v*D; 
  // const du = (B - A) / data.rNum, dv = (dMax - cMin) / data.cNum;

  const p = new THREE.Vector3(x.evaluate({u: U, v: V}), y.evaluate({u: U, v: V}), z.evaluate({u: U, v: V})), 
    ruForward = new THREE.Vector3(x.evaluate({u: U + dt/2, v: V}), y.evaluate({u: U + dt/2, v: V}), z.evaluate({u: U + dt/2, v: V})), 
    ruBackward = new THREE.Vector3(x.evaluate({u: U - dt/2, v: V}), y.evaluate({u: U - dt/2, v: V}), z.evaluate({u: U - dt/2, v: V})), 
    rvForward = new THREE.Vector3(x.evaluate({u: U, v: V + dt/2}), y.evaluate({u: U, v: V + dt/2}), z.evaluate({u: U, v: V + dt/2})),
    rvBackward = new THREE.Vector3(x.evaluate({u: U, v: V - dt/2}), y.evaluate({u: U, v: V - dt/2}), z.evaluate({u: U, v: V - dt/2}));
  
    
    ruForward.sub(ruBackward).multiplyScalar((B - A) * du / dt);
    rvForward.sub(rvBackward).multiplyScalar((D - C) * dv / dt);
    // console.log("inside ruF",dMax,cMin,{p: p, u: ruForward, v: rvForward, n: ruForward.clone().cross(rvForward)}dv);
  // console.log(p,ru,rv);


  return {p: p, u: ruForward, v: rvForward, n: ruForward.clone().cross(rvForward)}
}

// Construct tangent vectors at a point u,v (both 0 to 1)
function tangentVectors( {u = 0.5, v = 0.5, dt = .001 } = {} ) {
  // if (1 - v < dt) {dt = - dt};

  // const {a,b,c,d,x,y,z} = rData;
  // const A = a.evaluate(), B = b.evaluate()
  // const U = (1 - u)*A + u*B; 
  // const C = c.evaluate( {u: U} ), D = d.evaluate( {u: U} );
  // const V = (1 - v)*C + v*D; 
  // const du = (B - A) / data.rNum, dv = (dMax - cMin) / data.cNum;

  // const p = new THREE.Vector3(x.evaluate({u: U, v: V}), y.evaluate({u: U, v: V}), z.evaluate({u: U, v: V})), 
  //   ruForward = new THREE.Vector3(x.evaluate({u: U + dt/2, v: V}), y.evaluate({u: U + dt/2, v: V}), z.evaluate({u: U + dt/2, v: V})), 
  //   rvForward = new THREE.Vector3(x.evaluate({u: U, v: V + dt/2}), y.evaluate({u: U, v: V + dt/2}), z.evaluate({u: U, v: V + dt/2})),
  //   ruBackward = new THREE.Vector3(x.evaluate({u: U - dt/2, v: V}), y.evaluate({u: U - dt/2, v: V}), z.evaluate({u: U - dt/2, v: V})), 
  //   rvBackward = new THREE.Vector3(x.evaluate({u: U, v: V - dt/2}), y.evaluate({u: U, v: V - dt/2}), z.evaluate({u: U, v: V - dt/2}));

  // point.position.copy(p);
  // ruForward.sub(ruBackward).multiplyScalar(du / dt);
  // rvForward.sub(rvBackward).multiplyScalar(dv / dt);
  // // console.log(p,ru,rv);

  const dr = ruFrame( {u,v,dt,du: 1/data.rNum, dv: 1/data.cNum});

  point.position.copy(dr.p);


  const arrowParams = { radiusTop: gridStep / 10,  radiusBottom: gridStep / 20, heightTop: gridStep/10 }

  for (const [key, arrow] of Object.entries(arrows)) {
    const pos = dr.p.clone();
    arrow.position.copy(pos);
    if ( arrow.geometry ) arrow.geometry.dispose();
    arrow.geometry = new ArrowBufferGeometry( { ...arrowParams, height: dr[key].length() } )
    arrow.lookAt(pos.add(dr[key]));
  }

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
        console.log(intersect.uv);
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
    // frameBall.visible = true;
  }
},false);
window.addEventListener('keyup',(e) => {
  if (e.key === "Shift") {
    selectNewPoint = false;
    // frameBall.visible = false;
  }
},false);


// Add surface area pieces

const shards = new THREE.Object3D();
const shardMaterial = new THREE.MeshPhongMaterial( {color: 0xb4b4b4, shininess: 80, side: THREE.DoubleSide })
scene.add(shards);

function updateShards(N=0) {
  for (let index = shards.children.length - 1; index >= 0 ; index--) {
    const element = shards.children[index];
    element.geometry.dispose()
    shards.remove(element);
  }
  if (N < 1) return;
  const dt = 1/N;
  const vec = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const {p,u,v} = ruFrame( {u: i*dt, v: j*dt, du: dt, dv: dt } );
      const geometry = new THREE.ParametricBufferGeometry( (x,y,vec) => {
        vec.copy(p);
        vec.add(u.clone().multiplyScalar(x)).add(v.clone().multiplyScalar(y));
        vec.z += 0.001;
        // console.log(x, y, vec)
      },1,1);
      const shard = new THREE.Mesh( geometry, shardMaterial );
      shards.add(shard);
    }
  }
}

// updateShards(22);
// console.log(shards.children)


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

let myReq;

function animate() {
  controls.update();
  for (let index = 0; index < axesText.length; index++) {
    const element = axesText[index];
    element.lookAt(camera.position);
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

  }
  myReq = requestAnimationFrame(animate);

  // stats.begin() ;

  renderer.render(scene, camera);

  // stats.end();
}








document.getElementById("encodeURL").onclick = () => {
    // console.log();
    const qString = new URLSearchParams( makeQueryStringObject() );
    console.log(qString.toString());
    window.location.search = qString.toString();
};

document.querySelector("#cameraReset").onclick = () => {
  // console.log();
  controls.target.set(0,0,0);
};

// gui.domElement.style.zIndex = 2000;
updateSurface();

//initialize frame
{
  const uv = {u: 0.5, v: 0.5};
  point.position.set(rData.x.evaluate(uv));
  tangentVectors();
}

// go
animate();