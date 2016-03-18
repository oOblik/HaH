'use strict';

/**************************
	Global variables
**************************/

if(typeof(String.prototype.trim) === "undefined")
{
	String.prototype.trim = function(){
		return String(this).replace(/^\s+|\s+$/g, '');
	}
}

var renderer;
var camera;
var scene = new THREE.Scene();
var root = new THREE.Object3D();
scene.add(root);


/**************************
	Initialization
**************************/

if( altspace.inClient )
{
	// convert all this altspace craziness into a normal coordinate space
	// i.e. units in meters, z-axis up, with origin on the floor
	renderer = altspace.getThreeJSRenderer();
	altspace.getEnclosure().then(function(enc){
		root.scale.set(enc.pixelsPerMeter, enc.pixelsPerMeter, enc.pixelsPerMeter);
		root.position.setY( -enc.innerHeight/2 );
		root.rotation.set( -Math.PI/2, 0, 0 );
	});
}
else
{
	// set up preview renderer, in case we're out of world
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(1280, 720);
	renderer.setClearColor( 0x888888 );
	document.body.appendChild(renderer.domElement);

	// add an orbiting camera
	camera = new THREE.PerspectiveCamera(45, 1280/720, 1, 1000);
	camera.up.set(0,0,1);
	camera.position.set(0, 4, 1.5);
	camera.lookAt( new THREE.Vector3(0, 0, 1.5) );
	root.add(camera);
}


// add table surface
var table = new THREE.Mesh(
	new THREE.CylinderGeometry(1.5, 1.5, 0.05, 12, 1),
	new THREE.MeshBasicMaterial({color: 0x22aa22})
);
table.position.setZ(0.8);
table.rotation.set(Math.PI/2, 0, 0);
root.add(table);

// add a big black card
generateCard(
	[
		'The new',
		'Chevy Tahoe.',
		'With the power',
		'and space to take',
		'_______________',
		'everywhere you go.'
	],
	'black',
	function(card){
		card.position.setZ(1.5);
		card.scale.set(12,12,12);
		card.rotation.set(Math.PI/2, 0, 0);

		root.add(card);
	}
);




/******************************
	Functions
******************************/

var cardModel = null;
function generateCard(text, color, cb)
{
	// color is optional, defaults to white
	// but callback is mandatory, so reassign if necessary
	if(!cb){
		cb = color;
		color = null;
	}
	
	// card face texture resolution
	var cardWidth = 256;
	
	// load card model if not done yet
	if(!cardModel){
		var loader = new THREE.ColladaLoader();
		loader.load('models/card.dae', function(result){
			cardModel = result.scene.children[0].children[0];
			generateTexture(cardModel.clone());
		});
	}
	else {
		generateTexture(cardModel.clone());
	}
	
	
	function generateTexture(model)
	{
		// set up canvas
		var bmp = document.createElement('canvas');
		var g = bmp.getContext('2d');
		bmp.width = 2*cardWidth;
		bmp.height = 2*cardWidth;
		g.fillStyle = color === 'black' ? 'black' : 'white';
		g.fillRect(0, 0, 2*cardWidth, 2*cardWidth);
		
		// write text
		g.font = 0.09*cardWidth+'px sans-serif';
		g.fillStyle = color === 'black' ? 'white' : 'black';
		for(var i=0; i<text.length; i++){
			g.fillText(text[i], 0.08*cardWidth, (0.15+0.12*i)*cardWidth);
		}
		
		// draw logo
		var edgeLength = 15;
		var x = 0.08*cardWidth, y = 1.33*cardWidth;
		g.lineWidth = 2;
		g.strokeStyle = color === 'black' ? 'white' : 'black';
		g.moveTo(x, y);
		g.lineTo(x+edgeLength/2, y-edgeLength*Math.sin(Math.PI/3));
		g.lineTo(x+edgeLength, y);
		g.moveTo(x+edgeLength/4, y);
		g.lineTo(x+3*edgeLength/4, y);
		g.stroke();
		
		// draw footer
		g.font = 0.05*cardWidth+'px sans-serif';
		g.fillText("Holograms Against Humanity", x+1.5*edgeLength, y);
		
		// draw card back
		g.font = 'bold '+0.15*cardWidth+'px sans-serif';
		g.fillText('Holograms', 1.1*cardWidth, 0.22*cardWidth);
		g.fillText('Against', 1.1*cardWidth, 0.37*cardWidth);
		g.fillText('Humanity', 1.1*cardWidth, 0.52*cardWidth);
		
		// assign texture
		model.material = new THREE.MeshBasicMaterial({
			map: new THREE.CanvasTexture(bmp)
		});
		
		// return the new card
		cb(model);
	}
}


/***************************
	Render loop
***************************/

function render(timestamp)
{
	// update camera if necessary
	if(camera){
		camera.position.x = 4 * Math.sin(timestamp * 2*Math.PI/10000);
		camera.position.y = 4 * Math.cos(timestamp * 2*Math.PI/10000);
		camera.lookAt( new THREE.Vector3(0, 0, 1.5) );
	}

	// finally, render
	renderer.render(scene, camera);
}

// start animating
window.requestAnimationFrame(function animate(timestamp)
{
	window.requestAnimationFrame(animate);
	render(timestamp);
});
