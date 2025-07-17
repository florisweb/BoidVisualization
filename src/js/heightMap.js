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

	constructor({size, boidCount}) {
		this.size = size;
		// this.size.y *

		const compCount = 50;
		const minWavelength = 300;

		for (let i = 0; i < compCount; i++)
		{
			let v = i / compCount + 1;

			this.mapData.wavelengths.push([Math.max(Math.random() * this.size.x * v, minWavelength), Math.max(Math.random() * this.size.y * v, minWavelength)]);
			this.mapData.offsets.push([Math.random() * this.size.x, Math.random() * this.size.y]);
			this.mapData.amplitudes.push(Math.random() * v);
		}

	}
	
	getHeightAtPosition(_x, _y) {
		return this.preCalcedMap[Math.floor(_x) + 1][Math.floor(_y) + 1];
		// return PerlinNoise.noise(_x / this.size.x, _y / this.size.y, .5);
	}


	preCalcHeightMap(_size) {
		console.time('preCalcHeightMapGPU');

		const gpu = new GPU();
		const calcHeightMap = gpu.createKernel(function(_compCount, wavelengths, offsets, amps) {
			let val = 0;
			for (let i = 0; i < _compCount; i++)
			{
				val += amps[i] *
						Math.cos(2 * Math.PI * this.thread.x / wavelengths[i][0] + offsets[i][0]) * 
						Math.cos(2 * Math.PI * this.thread.y / wavelengths[i][1] + offsets[i][1]);
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
		console.log('mm', min, max);
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
