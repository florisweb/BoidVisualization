import { Vector2D, Vector3D } from './vector.js';
import Simulation from './simulation.js';
import Renderer from './renderer.js';


let trackedElement = document.querySelector('#element');
document.body.onscroll = (_e) => {
	let offset = element.getBoundingClientRect().top / App.renderer.canvas.offsetHeight * App.renderer.size.y;
	for (let point of App.simulation.avoidPoints)
	{
		point.loc.y = offset;
	}
}


window.onresize = () => {
	worldCanvas.width = worldCanvas.offsetWidth;
	worldCanvas.height = worldCanvas.offsetHeight;
}
window.onresize();

const App = new class {
	simulation;
	renderer;

	constructor() {
		window.Vector3D = Vector3D;
		window.Vector2D = Vector2D;
		window.App = this;

		this.renderer = new Renderer({canvas: document.querySelector('#worldCanvas')});
		this.simulation = new Simulation({size: this.renderer.size, boidCount: 300});

		this.update();
	}

	update(_dt) {
		this.renderer.drawBoids(this.simulation.boids);
		this.simulation.update(_dt);
		requestAnimationFrame(() => this.update());
	}
}







export default App;