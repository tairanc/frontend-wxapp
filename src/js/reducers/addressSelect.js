import createReducers from './createReducers.js';

let initialState ={
	load:true,
	data:"",
	from:""
};

function initialPage( state, data ) {
	return {...state, load:false,data:data };
}

function addressSelect( state = initialState, action ) {
	switch ( action.type ){
		case 'resetState':
			return initialState;
		case 'setFrom':
			return { ...state, from:action.from };
		case 'initialDataSuccess':
			return initialPage( state, action.result.list );
		default:
			return state;
	}
}

export default createReducers("addressSelect",addressSelect,initialState );