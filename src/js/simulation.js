import { Vector2D, Vector3D } from './vector.js';
import Boid from './boid.js';
import App from './app.js';

export default class Simulation {
	config = {
		viewingRange: 130,
		targetFlockSpacingDistance: 50,
		maxDt: 0.01,
		mapFollowProbeDistance: 30,
		mapFollowRelevantHeightPerc: .1,
		mapFollowCorrectionStrength: 1000,
	}

	avoidPoints = [];
	// 	{
	// 		loc: new Vector2D(350, 400),
	// 		range: 80
	// 	},
	// 	{
	// 		loc: new Vector2D(400, 400),
	// 		range: 80
	// 	},
	// 	{
	// 		loc: new Vector2D(450, 400),
	// 		range: 80
	// 	}
	// ];

	size;
	boids = [];
	#heightMap;
	constructor({size, boidCount, heightMap}) {
		this.#heightMap = heightMap;
		this.size = size;

		for (let i = 0; i < boidCount; i++)
		{
			let pos = this.size.copy();
			pos.x *= Math.random();
			pos.y *= Math.random();
			pos.z *= Math.random();
			
			this.boids.push(new Boid({position: pos}));
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
		const speed = 10;

		let preAvgVelocity = this.boids.map(r => r.velocity.length).reduce((a, b) => a + b, 0) / this.boids.length;
		for (let boid of this.boids)
		{
			let rangeInfo = this.#getBoidsInRange(boid.position, this.config.viewingRange, boid);
			let neighbours = rangeInfo.neighbours;



			// Avoid collision with point/cylinder
			for (let point of this.avoidPoints)
			{

				let deltaPos = boid.position.D2.difference(point.loc)
				let pointDist = Math.min(Math.min(deltaPos.length - point.range, 0), 1e10);
				if (pointDist === 0) continue;

				let dir = boid.velocity.D2.projectOnTo(deltaPos.perpendicular).unitary; 
				let force = dir.scale(-pointDist * 10 * speed);


				let deltaVelocity = force.copy().scale(_dt / boid.mass);
				let endVelocity = boid.velocity.D2.copy().add(deltaVelocity);
				let targetEndVelocity = endVelocity.copy();
				targetEndVelocity.length = boid.velocity.length;

				let delta = endVelocity.difference(targetEndVelocity);
				let effectiveForce = force.add(delta.copy().scale(boid.mass / _dt));

				let endVelocity2 = boid.velocity.D2.copy().add(effectiveForce.copy().scale(_dt / boid.mass));
				boid.applyForce(new Vector3D(effectiveForce.x, effectiveForce.y, 0));

				// try {
				// 	App.renderer.drawVector(boid.position, boid.velocity, '#f00');
				// 	App.renderer.drawVector(boid.position, deltaVelocity.copy().scale(1), '#0f0');
				// 	App.renderer.drawVector(boid.position, targetEndVelocity.copy().scale(1), '#00f');
				// 	App.renderer.drawVector(boid.position.copy().add(endVelocity), delta.copy().scale(.5), '#f0f');

				// 	App.renderer.drawVector(boid.position, endVelocity2.copy().scale(1), '#0ff');

				// } catch (e) {}
			}




			// Avoid collidions with mountains / Fly towards lower spots
			{
				let protPoint = boid.position.copy().add(boid.velocity.copy().scale(_dt * this.config.mapFollowProbeDistance));
	
				let h = this.#heightMap.getHeightAtPosition(protPoint.x, protPoint.y) * this.size.z;
				let dh = boid.position.z - h;
				if (dh < this.size.z * this.config.mapFollowRelevantHeightPerc) {
					
					let slope = this.#heightMap.getSlopeAtPosition(protPoint.x, protPoint.y).scale(this.size.z);
					let correction = slope.projectOnTo(boid.velocity.perpendicular.unitary).scale(-this.config.mapFollowCorrectionStrength);


					let deltaVelocity = correction.copy().scale(_dt / boid.mass);
					let endVelocity = boid.velocity.D2.copy().add(deltaVelocity);
					let targetEndVelocity = endVelocity.copy();
					targetEndVelocity.length = boid.velocity.length;

					let delta = endVelocity.difference(targetEndVelocity);
					let effectiveForce = correction.add(delta.copy().scale(boid.mass / _dt));

					let endVelocity2 = boid.velocity.D2.copy().add(effectiveForce.copy().scale(_dt / boid.mass));
					boid.applyForce(new Vector3D(effectiveForce.x, effectiveForce.y, 0));

					try {
						if (!App.renderer.renderDebugInfo) continue;
						App.renderer.drawVector(boid.position, correction.scale(.2), '#f00');
					} catch (e) {}
				}
			}


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


			// Direction matching
			let dVelocity = boid.velocity.unitary.difference(avVelocity.unitary);
			boid.applyForce(dVelocity.scale(100 * speed));
			
			// Velocity matching
			boid.applyForce(boid.velocity.unitary.scale((avVelocityLength - boid.velocity.length) * 1 * speed));

			// Steer towards centre of local flock
			boid.applyForce(boid.position.difference(avPos).scale(0.1 * speed));

			// Avoid collisions -> per definition an energy loss = type of friction
			let deltaClosestPos = boid.position.difference(rangeInfo.closest.position);
			let closestDist = Math.min(deltaClosestPos.length - this.config.targetFlockSpacingDistance, 0);
			boid.applyForce(deltaClosestPos.scale(closestDist * .1 * speed));
			

			try {
				if (!App.renderer.renderDebugInfo) continue;
				// App.renderer.drawVector(boid.position, dVelocity);
				App.renderer.drawVector(boid.position, boid.acceleration, '#0f0');

				for (let n of trueNeighbours) {
					App.renderer.drawVectorTo(boid.position, n.position, '#eee');
				}
			} catch (e) {}
		}

		let targetVelocity = 200;
		let deltaV = targetVelocity - preAvgVelocity;
		for (let boid of this.boids) boid.applyForce(boid.velocity.unitary.scale(deltaV));
	}
	
	// #preCalcBoidsInRangeOfOneAnother(_range) {
	// 	let boidPosses = this.boids.map(r => r.position);
	// 	let list = [];

	// 	for (let boid of boidPosses)



	// }
	
	#getBoidsInRange(_pos, _range, _self) {
		const rangeSquared = _range**2;
		let boids = [];

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
				boids.push(boid);
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

			let height = this.#heightMap.getHeightAtPosition(boid.position.x, boid.position.y) * this.size.z;
			if (boid.position.z < height) {
				boid.velocity.z = Math.abs(boid.velocity.z);
				boid.position.z = height;
			}
			if (boid.position.z > this.size.z) boid.velocity.z = -Math.abs(boid.velocity.z);
		}
	}
}
