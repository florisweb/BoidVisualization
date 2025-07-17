import { Vector3D, Vector2D } from './vector.js';
import App from './app.js';

let ctx;

export default class Renderer {
	renderDebugInfo = false;
	canvas;
	get size() {
		return new Vector3D(this.canvas.width, this.canvas.height, 800);
	}
	#bufferCanv;
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
		this.#bufferCanv = document.createElement('canvas');
		this.#bufferCanv.width = this.canvas.width;
		this.#bufferCanv.height = this.canvas.height;


		window.onresize = () => {
			worldCanvas.width = worldCanvas.offsetWidth;
			worldCanvas.height = worldCanvas.offsetHeight;
			this.#bufferCanv.width = worldCanvas.offsetWidth;
			this.#bufferCanv.height = worldCanvas.offsetHeight;
		}
		window.onresize();
	}

	drawBoids(_boids) {
		// ctx.clearRect(0, 0, this.size.x, this.size.y);
		for (let boid of _boids) this.drawBoid(boid);
		if (!this.renderDebugInfo) return;
		try {
			for (let point of App.simulation.avoidPoints)
			{
				ctx.strokeStyle = '#f00';
			    ctx.circle(point.loc.x, point.loc.y, point.range);
			    ctx.stroke();	
			}
	    } catch (e) {}
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
		grd.addColorStop(0, `rgba(238, 238, 255, ${percDepth})`);
		grd.addColorStop(.5, `rgba(221, 204, 255, ${percDepth})`);
		grd.addColorStop(1, `rgba(238, 238, 255, ${percDepth})`);

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

	#renderedHeightMap = false;
	async drawHeightMap(_func) {
		if (!this.#renderedHeightMap) await this.#renderHeightMapToBuff(_func);	
		let buffCtx = this.#bufferCanv.getContext('2d');
		let imageData = buffCtx.getImageData(0, 0, this.#bufferCanv.width, this.#bufferCanv.height);
		ctx.putImageData(imageData, 0, 0);
	}

	#secSize = 100;
	#pxSize = 1;
	async #renderHeightMapToBuff(_func) {
		this.#renderedHeightMap = true;
		console.time('render');
		console.time('preCalc');
		let preCalcedHeights = this.#preCalcHeights(_func);
		window.p = preCalcedHeights;
		console.timeEnd('preCalc');

		let buffCtx = this.#bufferCanv.getContext('2d');
		for (let x = 0; x < this.canvas.width; x += this.#secSize)
		{
			for (let y = 0; y < this.canvas.height; y += this.#secSize)
			{
				// this.drawMapSection(_func, x, y, buffCtx, preCalcedHeights);
				this.drawMapSection(preCalcedHeights, x, y, buffCtx);
				await wait(0);
			}
		}
		console.timeEnd('render');
	}

	#preCalcHeights(_func) {
		let heights = [];
		for (let x = -this.#pxSize; x < this.canvas.width + this.#pxSize; x += this.#pxSize)
		{
			for (let y = -this.#pxSize; y < this.canvas.height + this.#pxSize; y += this.#pxSize)
			{
				let index = x + y * this.canvas.width;
				heights[index] = _func(x, y);
			}
		}
		return heights;
	}

	drawMapSection(_preCalced, _minX, _minY, _ctx) {
		let imgData = _ctx.getImageData(_minX, _minY, this.#secSize, this.#secSize);
		const lineInterval = .025;
		for (let x = _minX; x < _minX + this.#secSize; x += this.#pxSize)
		{
			for (let y = _minY; y < _minY + this.#secSize; y += this.#pxSize)
			{
				let locX = x - _minX;
				let locY = y - _minY;
				let index = (locX + locY * this.#secSize) * 4;
				let trueIndex = x + y * this.canvas.width;
				let height = _preCalced[trueIndex];

				let xSlope = (_preCalced[trueIndex + 1] - _preCalced[trueIndex - 1]) / 2;
				let ySlope = (_preCalced[trueIndex + this.canvas.width] - _preCalced[trueIndex - this.canvas.width]) / 2;
				let slope = Math.abs(xSlope) + Math.abs(ySlope);


				_ctx.fillStyle = `rgba(138, 138, 200, ${height * .5})`; //`rgba(255, 0, 0, ${height * .2})`;
				_ctx.beginPath();
				_ctx.fillRect(x, y, this.#pxSize, this.#pxSize);
				_ctx.closePath();
				_ctx.fill();

				// imgData.data[index + 0] = 238;
				// imgData.data[index + 1] = 238;
				// imgData.data[index + 2] = 255;
				// imgData.data[index + 3] = height * .2 * 255;
				
				if (height % lineInterval > (slope) * this.#pxSize * 1) continue;
				let heightSlot = Math.floor(height / lineInterval) * lineInterval;


				_ctx.fillStyle = `rgba(50, 50, 200, ${heightSlot})`; 
				_ctx.beginPath();
				_ctx.fillRect(x, y, this.#pxSize, this.#pxSize);
				_ctx.closePath();
				_ctx.fill();

				// imgData.data[index + 0] = 221;
				// imgData.data[index + 1] = 204;
				// imgData.data[index + 2] = 255;
				// imgData.data[index + 3] = heightSlot * 255;
			}
		}

		// _ctx.putImageData(imgData, _minX, _minY);
	}
}

function wait(_ms) {
	return new Promise((resolve) => setTimeout(resolve, _ms));

}