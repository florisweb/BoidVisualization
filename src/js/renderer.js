import { Vector3D, Vector2D } from './vector.js';
import App from './app.js';
import { GPU } from 'gpu.js';

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
		await wait(0);
		this.renderHeightMapToBuff(_preCalcedHeights);
	}

	async drawHeightMap() {
		let buffCtx = this.#bufferCanv.getContext('2d');
		let imageData = buffCtx.getImageData(0, 0, this.#bufferCanv.width, this.#bufferCanv.height);
		ctx.putImageData(imageData, 0, 0);
	}


	renderHeightMapToBuff(_preCalcedHeights) {
		const lineInterval = .1;
		const gpu = new GPU();
		const calcPixels = gpu.createKernel(function(_heights, _lineInterval) {
			let colorArr = [0, 0, 0, 0];
			let offsetX = this.thread.y + 1; // Data stored [y][x]: invert coords
			let offsetY = this.thread.x + 1;

			let height = _heights[offsetX][offsetY];
			let xSlope = (_heights[offsetX + 1][offsetY] - _heights[offsetX - 1][offsetY]) / 2;
			let ySlope = (_heights[offsetX][offsetY + 1] - _heights[offsetX][offsetY - 1]) / 2;
			let slope = Math.abs(xSlope) + Math.abs(ySlope);

			let shadowRate = .9 + .1 * (1 + (xSlope + ySlope) * 2000);
			colorArr[0] = 38 + 100 * shadowRate;
			colorArr[1] = 38 + 100 * shadowRate;
			colorArr[2] = 100 + 100 * shadowRate;
			colorArr[3] = (height * .2) * 255;

			if (height % _lineInterval > (slope) * 10 && (xSlope < 0 && ySlope < 0)) {
				let dist = (height % _lineInterval) * 9;
				colorArr[0] -= 80 * dist;
				colorArr[1] -= 80 * dist;
				colorArr[2] -= 50 * dist;
			}

			
			if (height % _lineInterval > (slope) * 1) return colorArr;
			let heightSlot = Math.floor(height / _lineInterval) * _lineInterval;
			colorArr[0] = 80;
			colorArr[1] = 80 - 30 * (heightSlot);
			colorArr[2] = 220 + 30 * (heightSlot);
			colorArr[3] = heightSlot * 255;

			return colorArr;
		}).setOutput([this.canvas.height, this.canvas.width]);


		let output = calcPixels(_preCalcedHeights, lineInterval);
		let buffCtx = this.#bufferCanv.getContext('2d');
		let imgData = buffCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);

		for (let x = 0; x < output.length; x++)
		{
			for (let y = 0; y < output[x].length; y++)
			{
				let index = (x + y * this.canvas.width) * 4;
				imgData.data[index + 0] = output[x][y][0];
				imgData.data[index + 1] = output[x][y][1];
				imgData.data[index + 2] = output[x][y][2];
				imgData.data[index + 3] = output[x][y][3];
			}
		}

		buffCtx.putImageData(imgData, 0, 0);
		return output;
	}
}


function wait(_ms) {
	return new Promise((resolve) => setTimeout(resolve, _ms));

}