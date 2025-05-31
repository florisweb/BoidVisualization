import { Vector3D } from './vector.js';

export default class Boid {
	position;
	velocity;
	constructor({position}) {
		this.position = position;
		this.velocity = Vector3D.random.scale(200);
		// this.velocity.z *= 0.1;
		this.velocity.z = 0;
	}

	update(_dt) {
		this.position.add(this.velocity.copy().scale(_dt));
	}
}