import Vector from './vector.js';

let ctx;

export default class Renderer {
	canvas;
	get size() {
		return new Vector(this.canvas.width, this.canvas.height);
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
		const size = 10;
		const angle = Math.PI / 2 * 1.35;
		const widthFactor = .8;
		let centre = _boid.position.copy();

		let leng = _boid.velocity.unitary.copy().scale(size);
		let leftOffset = leng.copy().scale(widthFactor);
		let rightOffset = leftOffset.copy();
		leftOffset.angle += angle;
		rightOffset.angle -= angle;

		let leftWing = centre.copy().add(leftOffset);
		let rightWing = centre.copy().add(rightOffset);
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
