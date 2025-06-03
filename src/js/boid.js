import { Vector3D } from './vector.js';

export default class Boid {
	position;
	velocity;
	acceleration;
	mass = 1;

	constructor({position}) {
		this.position = position;
		this.velocity = Vector3D.random.scale(500);
		this.velocity.z *= .1;
		// this.velocity = new Vector3D(30, 0, 0)
		this.acceleration = Vector3D.empty;
	}

	applyForce(_vec3D) {
		this.acceleration.add(_vec3D.copy().scale(1 / this.mass));
	}

	update(_dt) {
		this.velocity.add(this.acceleration.copy().scale(_dt));
		this.position.add(this.velocity.copy().scale(_dt));
		this.acceleration = Vector3D.empty;
	}
}