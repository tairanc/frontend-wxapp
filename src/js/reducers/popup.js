import createReducers from './createReducers.js';

let initialState ={
	//提示框
	prompt:{
		show:false,
		msg:""
	},
};

function popup( state = initialState, action ) {
	switch ( action.type ){
		case 'ctrlPrompt':
			return { ...state, prompt:{ ...action.prompt } };
		default:
			return state;
	}
}

export default createReducers("popup", popup , initialState );