import Vector from './vector.js';
import Simulation from './simulation.js';
import Renderer from './renderer.js';


const App = new class {
	simulation;
	renderer;

	constructor() {
		window.Vector = Vector;
		window.App = this;
		this.renderer = new Renderer({canvas: document.querySelector('#worldCanvas')});
		this.simulation = new Simulation({size: this.renderer.size, boidCount: 10});

		this.update();
	}

	update() {
		this.simulation.update();
		this.renderer.drawBoids(this.simulation.boids);
		requestAnimationFrame(() => this.update());
	}
}

export default App;