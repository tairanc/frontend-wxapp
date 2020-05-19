import createReducers from './createReducers.js';

const initialState ={
	load:true,
	data:"",
	cancel_reason:"",
	other_reason:""
};
function orderCancel( state= initialState ,action){
	switch( action.type ){
		case 'resetData':
			return initialState;
		case 'getDataSuccess':
			return { ...state, load:false, data:action.result.data };
		case 'changeReason':
			return { ...state,
				cancel_reason:action.reason,
				other_reason:action.reason === 'other' ? state.other_reason:""
			};
		case 'otherReason':
			return { ...state, other_reason:action.value };
		default:
			return state;
	}
}

export default createReducers("orderCancel",orderCancel,initialState )