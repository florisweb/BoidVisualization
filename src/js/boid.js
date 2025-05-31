import Vector from './vector.js';

export default class Boid {
	position;
	velocity;
	constructor({position}) {
		this.position = position;
		this.velocity = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1).scale(200);
		// this.velocity = new Vector(1, 0).scale(0.001);
	}

	update(_dt) {
		this.position.add(this.velocity.copy().scale(_dt));
	}
}