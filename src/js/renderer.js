import { Vector3D, Vector2D } from './vector.js';

let ctx;

export default class Renderer {
	canvas;
	get size() {
		return new Vector3D(this.canvas.width, this.canvas.height, 200);
	}
	constructor({canvas}) {
		this.canvas = canvas;
		ctx = this.canvas.getContext('2d');


	}

	drawBoids(_boids) {
		ctx.clearRect(0, 0, this.size.x, this.size.y);
		for (let boid of _boids) this.drawBoid(boid);
	}

	drawBoid(_boid) {
		let percDepth = _boid.position.z / this.size.z;
		let tiltPerc = _boid.velocity.D2.length / _boid.velocity.length;
		const size = 20 * percDepth;
		const length = size * tiltPerc;

		const angle = Math.PI / 2 * 0.5;
		const widthFactor = .8;
		let centre = _boid.position.copy();
		let dir = _boid.velocity.D2.unitary;
		let leng = dir.copy().scale(length);

		let dYWings = dir.perpendicular.scale(Math.tan(angle) * size);
		let wingBase = centre.copy().add(leng.copy().scale(-1));
		let leftWing = wingBase.copy().add(dYWings);
		let rightWing = wingBase.copy().add(dYWings.copy().scale(-1));
		let tip = centre.copy().add(leng);

		ctx.strokeStyle = '#777';
		ctx.beginPath();
	    ctx.moveTo(tip.x, tip.y);
	    ctx.lineTo(leftWing.x, leftWing.y);
	    ctx.lineTo(centre.x, centre.y);
	    ctx.lineTo(rightWing.x, rightWing.y);
	    ctx.lineTo(tip.x, tip.y);
	    ctx.closePath();
	    ctx.stroke();
	}
}
