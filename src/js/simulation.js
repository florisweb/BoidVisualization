import Vector from './vector.js';
import Boid from './boid.js';

export default class Simulation {
	config = {
		viewingRange: 100,
	}
	size;
	boids = [];
	constructor({size, boidCount}) {
		this.size = size;

		for (let i = 0; i < boidCount; i++)
		{
			let pos = this.size.copy();
			pos.x *= Math.random();
			pos.y *= Math.random();
			// this.boids.push(new Boid({position: pos}));
			this.boids.push(new Boid({position: this.size.copy().scale(.5)}));
		}
		// this.boids[1].velocity = new Vector(10**-5, 0);

		this.update();
	}

	#lastUpdate = new Date();
	update() {
		let dt = (new Date() - this.#lastUpdate)/1000;
		this.#updateBoidVelocities(dt);
		this.#updateBoidPositions(dt);
		this.#lastUpdate = new Date();
	}
	
	#updateBoidVelocities(_dt) {
		let deltaVAngles = [];
		let deltaVLengths = [];
		for (let b = 0; b < this.boids.length; b++)
		{
			let boid = this.boids[b];
			let neighbours = this.#getBoidsInRange(boid.position, this.config.viewingRange);
			let trueNeighbours = neighbours.filter(n => n !== boid);
			if (trueNeighbours.length === 0) continue;

			let avVelocity = new Vector(0, 0);
			let avPos = new Vector(0, 0);
			for (let neighbour of trueNeighbours) 
			{
				avVelocity.add(neighbour.velocity);
				avPos.add(neighbour.position);
			}
			avVelocity.scale(1 / trueNeighbours.length);
			avPos.scale(1 / avPos.length);
			// avPos = this.size.copy().scale(.5);

			let dVelocityAngle = (boid.velocity.angle - avVelocity.angle);
			let dVelocityLength = boid.velocity.length - avVelocity.length;
			
			let dPosAngle = (boid.velocity.angle - boid.position.difference(avPos).angle);
			deltaVAngles[b] = -dVelocityAngle * .1 - dPosAngle * .5;
			deltaVLengths[b] = -dVelocityLength * .5;
		}
		for (let b = 0; b < this.boids.length; b++) this.boids[b].velocity.angle += deltaVAngles[b] * _dt || 0;
		for (let b = 0; b < this.boids.length; b++) this.boids[b].velocity.length += deltaVLengths[b] * _dt || 0;
	}
	#getBoidsInRange(_pos, _range) {
		const rangeSquared = _range**2;
		let boids = new Set();

		let posses = [_pos];
		// posses.push(_pos.copy().add(new Vector(this.size.x, 0)));
		// posses.push(_pos.copy().add(new Vector(this.size.x, this.size.y)));
		// posses.push(_pos.copy().add(new Vector(0, this.size.y)));
		for (let boid of this.boids)
		{
			for (let pos of posses)
			{
				if (boid.position.difference(_pos).lengthSquared > rangeSquared) continue;
				boids.add(boid);
				break;
			}
		}

		return Array.from(boids);
	}

	#updateBoidPositions(_dt) {
		for (let boid of this.boids) 
		{
			boid.update(_dt);
			boid.position.x = boid.position.x % this.size.x;
			boid.position.y = boid.position.y % this.size.y;
			if (boid.position.x < 0) boid.position.x += this.size.x;
			if (boid.position.y < 0) boid.position.y += this.size.y;
		}
	}
}
