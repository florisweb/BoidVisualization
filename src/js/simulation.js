import { Vector2D, Vector3D } from './vector.js';
import Boid from './boid.js';
import App from './app.js';

export default class Simulation {
	config = {
		viewingRange: 100,
		targetFlockSpacingDistance: 30,
		maxDt: 0.01
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
			pos.z *= Math.random();
			this.boids.push(new Boid({position: pos}));
			// this.boids.push(new Boid({position: this.size.copy().scale(.5)}));
		}
	}

	#lastUpdate = new Date();
	updates = 0;
	update() {
		this.updates++;
		let dt = Math.min((new Date() - this.#lastUpdate) / 1000, this.config.maxDt);
		this.#applyBoidForces(dt);
		this.#enforceBoundaryConditions(dt);
		this.#lastUpdate = new Date();
	}
	
	#applyBoidForces(_dt) {
		let preAvgVelocity = this.boids.map(r => r.velocity.length).reduce((a, b) => a + b, 0) / this.boids.length;
		for (let boid of this.boids)
		{
			let rangeInfo = this.#getBoidsInRange(boid.position, this.config.viewingRange, boid);
			let neighbours = rangeInfo.neighbours;
			if (neighbours.length === 0) continue;

			let avVelocity = new Vector3D(0, 0, 0);
			let avVelocityLength = 0;
			let avPos = new Vector3D(0, 0, 0);
			for (let neighbour of neighbours) 
			{
				avVelocityLength += neighbour.velocity.length;
				avVelocity.add(neighbour.velocity);
				avPos.add(neighbour.position);
			}
			avVelocityLength /= neighbours.length;
			avVelocity.scale(1 / neighbours.length);
			avPos.scale(1 / neighbours.length);

			let dVelocity = boid.velocity.unitary.difference(avVelocity.unitary);


			// Direction matching
			boid.applyForce(dVelocity.scale(100));
			
			// Velocity matching
			boid.applyForce(boid.velocity.unitary.scale((avVelocityLength - boid.velocity.length) * 1));

			// Steer towards centre of local flock
			// let scalar = -(deltaPos.length - this.config.targetFlockSpacingDistance) * .01;
			boid.applyForce(boid.position.difference(avPos).scale(0.1));

			// Avoid collisions -> per definition an energy loss = type of friction
			let deltaPos = boid.position.difference(rangeInfo.closest.position);
			let closestDist = Math.min(deltaPos.length - this.config.targetFlockSpacingDistance, 0);
			boid.applyForce(deltaPos.scale(closestDist * .1));


			try {
				if (!App.renderer.renderDebugInfo) continue;
				// App.renderer.drawVector(boid.position, dVelocity);
				App.renderer.drawVector(boid.position, boid.acceleration, '#0f0');

				for (let n of trueNeighbours) {
					App.renderer.drawVectorTo(boid.position, n.position, '#eee');
				}
			} catch (e) {}


			// let dVelocityAngle = boid.velocity.angle.difference(avVelocity.angle);
			// let dVelocityLength = avVelocity.length - boid.velocity.length;
			
			// let dPosAngle = boid.velocity.angle.difference(boid.position.difference(avPos).angle);
			// deltaVAngleVecs[b] = dVelocityAngle.scale(-.1).add(dPosAngle.scale(-.5)).add(Vector2D.random.scale(5));
			// deltaVAngleVecs[b].y *= .1 ;
			// deltaVLengths[b] = dVelocityLength * .1 + (1 - 2 * Math.random()) * 5;
		}
		let targetVelocity = 200;

		let deltaV = targetVelocity - preAvgVelocity;
		console.log(preAvgVelocity);

		for (let boid of this.boids) boid.applyForce(boid.velocity.unitary.scale(deltaV));

		// for (let b = 0; b < this.boids.length; b++) 
		// {
		// 	this.boids[b].velocity.angle = this.boids[b].velocity.angle.add(
		// 		deltaVAngleVecs[b] ? deltaVAngleVecs[b].scale(_dt) : new Vector2D(0, 0)
		// 	);
		// 	this.boids[b].velocity.length += deltaVLengths[b] * _dt || 0;
		// }
	}

	// #updateBoidVelocities(_dt) {
	// 	let deltaVAngleVecs = [];
	// 	let deltaVLengths = [];
	// 	for (let b = 0; b < this.boids.length; b++)
	// 	{
	// 		let boid = this.boids[b];
	// 		let neighbours = this.#getBoidsInRange(boid.position, this.config.viewingRange);
	// 		let trueNeighbours = neighbours.filter(n => n !== boid);
	// 		if (trueNeighbours.length === 0) continue;

	// 		let avVelocity = new Vector3D(0, 0, 0);
	// 		let avPos = new Vector3D(0, 0, 0);
	// 		for (let neighbour of trueNeighbours) 
	// 		{
	// 			avVelocity.add(neighbour.velocity);
	// 			avPos.add(neighbour.position);
	// 		}
	// 		avVelocity.scale(1 / trueNeighbours.length);
	// 		avPos.scale(1 / avPos.length);

	// 		let dVelocityAngle = boid.velocity.angle.difference(avVelocity.angle);
	// 		let dVelocityLength = avVelocity.length - boid.velocity.length;
			
	// 		let dPosAngle = boid.velocity.angle.difference(boid.position.difference(avPos).angle);
	// 		deltaVAngleVecs[b] = dVelocityAngle.scale(-.1).add(dPosAngle.scale(-.5)).add(Vector2D.random.scale(5));
	// 		deltaVAngleVecs[b].y *= .1 ;
	// 		deltaVLengths[b] = dVelocityLength * .1 + (1 - 2 * Math.random()) * 5;
	// 	}

	// 	for (let b = 0; b < this.boids.length; b++) 
	// 	{
	// 		this.boids[b].velocity.angle = this.boids[b].velocity.angle.add(
	// 			deltaVAngleVecs[b] ? deltaVAngleVecs[b].scale(_dt) : new Vector2D(0, 0)
	// 		);
	// 		this.boids[b].velocity.length += deltaVLengths[b] * _dt || 0;
	// 	}
	// }
	#getBoidsInRange(_pos, _range, _self) {
		const rangeSquared = _range**2;
		let boids = new Set();

		let posses = [_pos];
		let closestBoid;
		let closestDistance = Infinity;
		// posses.push(_pos.copy().add(new Vector(this.size.x, 0)));
		// posses.push(_pos.copy().add(new Vector(this.size.x, this.size.y)));
		// posses.push(_pos.copy().add(new Vector(0, this.size.y)));
		for (let boid of this.boids)
		{
			if (boid === _self) continue;
			for (let pos of posses)
			{
				let distance = boid.position.difference(_pos).lengthSquared
				if (distance > rangeSquared) continue;
				boids.add(boid);
				if (closestDistance < distance) break;
				closestBoid = boid;
				closestDistance = distance;
				break;
			}
		}

		return {closest: closestBoid, neighbours: Array.from(boids)};
	}

	#enforceBoundaryConditions(_dt) {
		for (let boid of this.boids) 
		{
			boid.update(_dt);
			boid.position.x = boid.position.x % this.size.x;
			boid.position.y = boid.position.y % this.size.y;
			if (boid.position.x < 0) boid.position.x += this.size.x;
			if (boid.position.y < 0) boid.position.y += this.size.y;

			// boid.position.z = boid.position.z % this.size.z;
			// if (boid.position.z < 0) boid.position.z += this.size.z;
			if (boid.position.z < 0) boid.velocity.z = Math.abs(boid.velocity.z);
			if (boid.position.z > this.size.z) boid.velocity.z = -Math.abs(boid.velocity.z);
		}
	}
}
