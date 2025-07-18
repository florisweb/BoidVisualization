import { Vector2D, Vector3D } from './vector.js';
import Boid from './boid.js';
import App from './app.js';
import { GPU } from 'gpu.js';

export default class HeightMap {
	size;
	preCalcedMap = [];

	mapData = {
		wavelengths: [],
		amplitudes: [],
		offsets: [] 
	}

	constructor({size, boidCount, renderer}) {
		this.size = size;

		const compCount = 100;
		const minWavelength = this.size.x * .3 * renderer.pxQualityRatio;

		let points = [[
			500, 500
		], [
			1000, 500
		]]

		for (let i = 0; i < compCount; i++)
		{
			let v = i / compCount + 1;
			let amp = Math.random() * v;
			const wavelengthMax = this.size.x * v;
			this.mapData.wavelengths.push([Math.max(Math.random() * wavelengthMax, minWavelength), Math.max(Math.random() * wavelengthMax, minWavelength)]);
			
			let relAmp = amp / compCount;
			if (relAmp > .01)
			{
				let topPoint = points[Math.floor(Math.random() * points.length)];
				this.mapData.offsets.push([
					topPoint[0] + this.mapData.wavelengths[i][0] * .2 * (1 - 2 * Math.random()), 
					topPoint[1] + this.mapData.wavelengths[i][1] * .2 * (1 - 2 * Math.random())
				]);
			} else {
				this.mapData.offsets.push([Math.random() * this.size.x, Math.random() * this.size.y]);
			}

			// this.mapData.offsets.push([
			// 	this.size.x / 2 + this.mapData.wavelengths[i][0] / 2, 
			// 	Math.random() * this.size.y
			// ]);
			
			this.mapData.amplitudes.push(amp);
		}

	}
	
	getHeightAtPosition(_x, _y) {
		return this.preCalcedMap[Math.min(Math.max(Math.floor(_x), 0), this.size.x) + 1][Math.min(Math.max(Math.floor(_y), 0), this.size.y) + 1];
	}
	getSlopeAtPosition(_x, _y) {
		return new Vector2D(
			(this.getHeightAtPosition(_x + 1, _y) - this.getHeightAtPosition(_x - 1, _y)) / 2,
			(this.getHeightAtPosition(_x, _y + 1) - this.getHeightAtPosition(_x, _y - 1)) / 2,
		);
	}

	preCalcHeightMap(_size) {
		console.time('preCalcHeightMapGPU');

		const gpu = new GPU();
		const calcHeightMap = gpu.createKernel(function(_compCount, wavelengths, offsets, amps) {
			let val = 0;
			for (let i = 0; i < _compCount; i++)
			{
				val += amps[i] *
						Math.cos(2 * Math.PI * (this.thread.x - offsets[i][0]) / wavelengths[i][0]) * 
						Math.cos(2 * Math.PI * (this.thread.y - offsets[i][1]) / wavelengths[i][1]);
			}
			return val;
		}).setOutput([_size.y + 2, _size.x + 2]);

		this.preCalcedMap = calcHeightMap(
			this.mapData.wavelengths.length, 
			this.mapData.wavelengths, 
			this.mapData.offsets, 
			this.mapData.amplitudes
		);

		// Normalize the map
		let max = Math.max(...this.preCalcedMap.map(r => Math.max(...r)));
		let min = Math.min(...this.preCalcedMap.map(r => Math.min(...r)));

		for (let x = 0; x < this.preCalcedMap.length; x++)
		{
			for (let y = 0; y < this.preCalcedMap[x].length; y++)
			{
				this.preCalcedMap[x][y] = (this.preCalcedMap[x][y] - min) / (max - min);
			}
		}

		console.timeEnd('preCalcHeightMapGPU');
		return this.preCalcedMap;
	}
}
