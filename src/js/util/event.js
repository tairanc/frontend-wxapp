class Events {
	constructor(){
		this.events = {};
	}
	on(){
		let args = [].slice.call( arguments );
		let key = args.shift();
		if( typeof key !=="string"){
			throw new TypeError( `${key} must be a string`);
		}
		if( !args.length ){
			return this;
		}
		
		if( !this.events[key] ){
			this.events[key] = []
		}
		this.events[key].push( ...args );
		return this;
	}
	
	all(){
		let args = [].slice.call( arguments );
		let fun = args.pop();
		if( typeof fun !== "function" ){
			throw new TypeError(`${ fun } must be a function`);
		}
		args.forEach( key =>{
			if( !this.events[key] ){
				this.events[key] = []
			}
			this.events[key].push( fun );
		});
		return this;
	}
	
	emit(){
		let args = [].slice.call( arguments );
		let key = args.shift();
		if( typeof key !=="string" ){
			throw new TypeError( `${key} must be a string`);
		}
		 if ( this.events[key] && this.events[key].length ){
			this.events[key].forEach( event =>{
				event.apply( null, args );
			})
		 }
		return this;
	}
	
	emitAll(){
		let args = [].slice.call( arguments );
		if( !args.length ){
			return this;
		}
		args.forEach( ( key )=>{
			this.events[key] && this.events[key].forEach( ( event ) =>{
					event();
				});
		});
		
		return this;
	}
	
	remove() {
		let args = [].slice.call( arguments );
		let key = args.shift();
		if( typeof key !=="string"){
			throw new TypeError( `${key} must be a string`);
		}
		if (!this.events[key]) {
			return this;
		}
		if (arguments.length === 0) {
			delete this.events[key];
			return this;
		}
		args.forEach( fn =>{
			if( typeof fn === "function" ){
				let index = this.events[key].indexOf( fn );
				if( index > -1 ){
					this.events[key].splice(index, 1);
				}
			}
		});
		return this;
	}
	
	_onceWrapper( type, listener ){
		let self = this;
		let state = { isFile: false, type, listener };
		return function () {
			if( !state.isFile ){
				self.remove( type, listener );
				state.listener.apply( null, arguments );
				state.isFile = true;
			}
		}
	
	}
	
	once( type, listener ){
		if (typeof listener !== 'function')
			throw new TypeError('"listener" argument must be a function');
		
	 this.on( type, this._onceWrapper( type, listener ) );
	 return this;
	}
}

module.exports = Events;