import { Vector3D, Vector2D } from './vector.js';
import App from './app.js';

let ctx;

export default class Renderer {
	renderDebugInfo = false;
	canvas;
	get size() {
		return new Vector3D(this.canvas.width, this.canvas.height, 800);
	}
	
	pxQualityRatio = 1.2;

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
			worldCanvas.width = worldCanvas.offsetWidth * this.pxQualityRatio;
			worldCanvas.height = worldCanvas.offsetHeight * this.pxQualityRatio;
			this.#bufferCanv.width = worldCanvas.offsetWidth * this.pxQualityRatio;
			this.#bufferCanv.height = worldCanvas.offsetHeight * this.pxQualityRatio;
		}
		window.onresize();
	}

	drawBoids(_boids) {
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
		try {
			const baseSize = 15 * this.pxQualityRatio;
			let floorHeight = App?.heightMap.getHeightAtPosition(_boid.position.x, _boid.position.y) * this.size.z;
			let distanceToFloor = _boid.position.z - floorHeight;
			let normalizedDist = distanceToFloor / (this.size.z - floorHeight);
			let scaleEffect = normalizedDist**1.2;
			
			let opacity = Math.max((.7 - scaleEffect) * .3, 0.01);
			this.#drawBoidShape(_boid, baseSize / 2 + scaleEffect * baseSize * 2, new Vector2D(20, 20).scale(.1 + scaleEffect), `rgba(0, 0, 0, ${opacity})`);
			this.#drawBoidShape(_boid, baseSize, new Vector2D(0, 0));
		} catch (e) {}


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

	#drawBoidShape(_boid, _rawSize, _offset, _color) {
		let percDepth = (_boid.position.z / this.size.z * .9 + .1)**2;
		let tiltPerc = _boid.velocity.D2.length / _boid.velocity.length;
		const size = _rawSize * percDepth;
		const length = size * tiltPerc;

		const angle = Math.PI / 2 * 0.5;
		const widthFactor = .8;
		let centre = _boid.position.copy().add(_offset);
		let dir = _boid.velocity.D2.unitary;
		let leng = dir.copy().scale(length);

		let dYWings = dir.perpendicular.scale(Math.tan(angle) * size);
		let wingBase = centre.copy().add(leng.copy().scale(-1));
		let leftWing = wingBase.copy().add(dYWings);
		let rightWing = wingBase.copy().add(dYWings.copy().scale(-1));
		let tip = centre.copy().add(leng);

		const grd = ctx.createLinearGradient(leftWing.x, leftWing.y, rightWing.x, rightWing.y);
		percDepth = 1;
		grd.addColorStop(0, `rgba(238, 238, 255, ${percDepth})`);
		grd.addColorStop(.5, `rgba(221, 204, 255, ${percDepth})`);
		grd.addColorStop(1, `rgba(238, 238, 255, ${percDepth})`);

		ctx.fillStyle = _color ? _color : grd;
		ctx.beginPath();
	    ctx.moveTo(tip.x, tip.y);
	    ctx.lineTo(leftWing.x, leftWing.y);
	    ctx.lineTo(centre.x, centre.y);
	    ctx.lineTo(rightWing.x, rightWing.y);
	    ctx.lineTo(tip.x, tip.y);
	    ctx.closePath();
	    ctx.fill();
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



	async preDrawHeightmap(_preCalcedHeights) {
		await this.#renderHeightMapToBuff(_preCalcedHeights);
	}

	async drawHeightMap() {
		let buffCtx = this.#bufferCanv.getContext('2d');
		let imageData = buffCtx.getImageData(0, 0, this.#bufferCanv.width, this.#bufferCanv.height);
		ctx.putImageData(imageData, 0, 0);
	}

	#secSize = 400;
	async #renderHeightMapToBuff(_preCalcedHeights) {
		console.time('render');

		let buffCtx = this.#bufferCanv.getContext('2d');
		for (let x = 0; x < this.canvas.width; x += this.#secSize)
		{
			for (let y = 0; y < this.canvas.height; y += this.#secSize)
			{
				this.drawMapSection(_preCalcedHeights, x, y, buffCtx);
				await wait(0);
			}
		}
		console.timeEnd('render');
	}

	drawMapSection(_preCalced, _minX, _minY, _ctx) {
		let imgData = _ctx.getImageData(_minX, _minY, this.#secSize, this.#secSize);
		const lineInterval = .1;
		for (let x = _minX; x < _minX + this.#secSize; x++)
		{
			if (x >= this.canvas.width) break;
			for (let y = _minY; y < _minY + this.#secSize; y++)
			{
				if (y >= this.canvas.height) continue;
				let offsetX = x + 1;
				let offsetY = y + 1;
				
				let height = _preCalced[offsetX][offsetY];
				let xSlope = (_preCalced[offsetX + 1][offsetY] - _preCalced[offsetX - 1][offsetY]) / 2;
				let ySlope = (_preCalced[offsetX][offsetY + 1] - _preCalced[offsetX][offsetY - 1]) / 2;
				let slope = Math.abs(xSlope) + Math.abs(ySlope);


				let locX = x - _minX;
				let locY = y - _minY;
				let index = (locX + locY * this.#secSize) * 4;



				let shadowRate = .9 + .1 * (1 + (xSlope + ySlope) * 2000);
				imgData.data[index + 0] = 38 + 100 * shadowRate;
				imgData.data[index + 1] = 38 + 100 * shadowRate;
				imgData.data[index + 2] = 100 + 100 * shadowRate;
				imgData.data[index + 3] = (height * .2) * 255;

				if (height % lineInterval > (slope) * 10 && (xSlope < 0 && ySlope < 0)) {
					let dist = (height % lineInterval) * 9;
					imgData.data[index + 0] -= 80 * dist;
					imgData.data[index + 1] -= 80 * dist;
					imgData.data[index + 2] -= 50 * dist;
				}

				
				if (height % lineInterval > (slope) * 1) continue;
				let heightSlot = Math.floor(height / lineInterval) * lineInterval;
				imgData.data[index + 0] = 80;
				imgData.data[index + 1] = 80 - 30 * (heightSlot);
				imgData.data[index + 2] = 220 + 30 * (heightSlot);
				imgData.data[index + 3] = heightSlot * 255;
			}
		}

		_ctx.putImageData(imgData, _minX, _minY);
	}
}


function wait(_ms) {
	return new Promise((resolve) => setTimeout(resolve, _ms));

}