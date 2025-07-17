import { Vector2D, Vector3D } from './vector.js';
import Simulation from './simulation.js';
import Renderer from './renderer.js';
import HeightMap from './heightMap.js';


let trackedElement = document.querySelector('#element');
document.body.onscroll = (_e) => {
	let offset = element.getBoundingClientRect().top / App.renderer.canvas.offsetHeight * App.renderer.size.y;
	for (let point of App.simulation.avoidPoints)
	{
		point.loc.y = offset;
	}
}


const App = new class {
	simulation;
	renderer;
	heightMap;

	constructor() {
		window.Vector3D = Vector3D;
		window.Vector2D = Vector2D;
		window.App = this;

		this.renderer = new Renderer({canvas: document.querySelector('#worldCanvas')});
		this.simulation = new Simulation({size: this.renderer.size, boidCount: 100});
		this.heightMap = new HeightMap({size: this.renderer.size});
		this.heightMap.preCalcHeightMap(this.renderer.size);
		
		this.update();
	}

	update(_dt) {
		this.renderer.drawHeightMap(this.heightMap.preCalcedMap);
		this.renderer.drawBoids(this.simulation.boids);
		this.simulation.update(_dt);
		requestAnimationFrame(() => this.update());
	}
}







export default App;