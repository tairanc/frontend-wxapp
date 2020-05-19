import createReducers from './createReducers.js';

let initialState ={
	cartNum:0
};

function navigation( state = initialState, action ) {
	switch ( action.type ){
		case 'setCartNum':
			return { ...state, cartNum: action.num };
		default:
			return state;
	}
}

export default createReducers("navigation", navigation, initialState );