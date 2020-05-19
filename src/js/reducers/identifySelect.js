import createReducers from './createReducers.js';
import Immutable from 'immutable';

let initialState ={
	load:true,
	data:"",
	selectStatus:0
};

function initialPage( state, data,cbData ) {
	data = data.map( ( list, i )=>{
		if( list.face && list.inverse ){
			list.hasPhoto = true;
		}else{
			list.hasPhoto = false;
		}
		return list;
	});
	
	return { ...state, load:false, data: data, selectStatus: cbData.status ? 1:0 };
}

function identifySelect( state = initialState, action ) {
	switch ( action.type ){
		case 'resetState':
			return initialState;
		case 'initialDataSuccess':
			return initialPage( state, action.result.data, action.cbData );
		default:
			return state;
	}
}

export default createReducers("identifySelect",identifySelect,initialState );