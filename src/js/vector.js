
export default class Vector {
	#value = [0, 0];
	get value() {
		return this.#value;
	}
	get x() {return this.#value[0]}
	get y() {return this.#value[1]}
	set x(_x) {this.#value[0] = _x}
	set y(_y) {this.#value[1] = _y}

	get angle() {
		return Math.atan(this.y/this.x);
	}

	set angle(_angle) {
		let oldLength = this.length;
		this.x = oldLength * Math.cos(_angle % (2 * Math.PI));
		this.y = oldLength * Math.sin(_angle % (2 * Math.PI));
	}


	get length() {
		return Math.sqrt(this.dotProduct(this));
	}
	set length(_l) {
		this.scale(_l / this.length);
	}

	get lengthSquared() {
		return this.dotProduct(this);
	}
	get unitary() {
		return this.copy().scale(1 / this.length);
	}

	constructor() {
		this.#value = arguments;
	}

	copy() {
		return new Vector(...this.#value);
	}

	dotProduct(_vec) {
		return _vec.x * this.x + _vec.y * this.y;
	}

	add(_vec) {
		this.x += _vec.x;
		this.y += _vec.y;
		return this;
	}
	difference(_vec) { // Defined as: the result is how you get from this to _vec
		return new Vector(
			_vec.x - this.x,
			_vec.y - this.y
		);
	}
	
	scale(_scalar) {
		this.x *= _scalar;
		this.y *= _scalar;
		return this;
	}
}