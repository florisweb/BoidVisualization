import { Vector3D, Vector2D } from './vector.js';
import App from './app.js';

let ctx;

export default class Renderer {
	renderDebugInfo = false;
	canvas;
	get size() {
		return new Vector3D(this.canvas.width, this.canvas.height, 800);
	}
	constructor({canvas}) {
		this.canvas = canvas;
		ctx = this.canvas.getContext('2d');
		ctx.constructor.prototype.circle = function(x, y, size) {
		    if (size < 0) return;
		    this.beginPath();
		    this.ellipse(
		      x, 
		      y, 
		      size,
		      size,
		      0,
		      0,
		      2 * Math.PI
		    );
		    this.closePath();
		  }
	}

	drawBoids(_boids) {
		ctx.clearRect(0, 0, this.size.x, this.size.y);
		for (let boid of _boids) this.drawBoid(boid);
	}

	drawBoid(_boid) {
		let percDepth = (_boid.position.z / this.size.z / 2 + .5);
		let tiltPerc = _boid.velocity.D2.length / _boid.velocity.length;
		const size = 13 * percDepth;
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

		const grd = ctx.createLinearGradient(leftWing.x, leftWing.y, rightWing.x, rightWing.y);
		grd.addColorStop(0, "rgba(238, 238, 255, 1)");
		grd.addColorStop(.5, "#dcf");
		grd.addColorStop(1, "rgba(238, 238, 255, 1)");

		ctx.fillStyle = grd;
		ctx.beginPath();
	    ctx.moveTo(tip.x, tip.y);
	    ctx.lineTo(leftWing.x, leftWing.y);
	    ctx.lineTo(centre.x, centre.y);
	    ctx.lineTo(rightWing.x, rightWing.y);
	    ctx.lineTo(tip.x, tip.y);
	    ctx.closePath();
	    ctx.fill();

	    if (!this.renderDebugInfo) return;
	    try {
		    ctx.strokeStyle = '#ddd';
		    ctx.circle(centre.x, centre.y, App.simulation.config.viewingRange);
		    ctx.stroke();

		    ctx.strokeStyle = '#ccc';
		    ctx.circle(centre.x, centre.y, App.simulation.config.targetFlockSpacingDistance);
		    ctx.stroke();
	    } catch (e) {}
	}

	drawVector(_start, _delta, _color = '#f00') {
		let end = _start.copy().add(_delta);
		this.drawVectorTo(_start, end, _color);
	}
	drawVectorTo(_start, _end, _color = '#f00') {
		ctx.strokeStyle = _color;
		ctx.beginPath();
	    ctx.moveTo(_start.x, _start.y);
	    ctx.lineTo(_end.x, _end.y);
	    ctx.closePath();
	    ctx.stroke();
	}
}
