import createReducers from './createReducers.js';

const initialState ={
	load:true,
	asid:"",
	data:"",
	name:"",
	logisticsNum:"",
};

function afterSaleLogistics( state=initialState, action ){
	switch( action.type ){
		case 'resetData':
			return {...initialState, ...action.query} ;
		case 'getDataSuccess':
            return { ...state, load:false, data:action.result.data.delivery };
        case 'ctrlModal':
			return { ...state, modal:{ ...action.modal } };
		case 'inputChange':
			return { ...state, [ action.name ]: action.value };
		default:
			return state;
	}
}
export default createReducers("afterSaleLogistics",afterSaleLogistics,initialState );