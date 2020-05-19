import createReducers from './createReducers.js';

let initialState ={
	winHeight:$(window).height(),
	isLogin:false,
	pending:true
};

function global( state = initialState, action ) {
	switch ( action.type ){
		case "changeLogin":
			return { ...state,isLogin:action.login, pending:false };
		case "getLoginSuccess":
			if( action.result.isLogined ==="true" ){
				return { ...state,isLogin:true,pending: false };
			}else{
				return { ...state,isLogin:false,pending: false };
			}
		case 'getLoginError':
			return { ...state, pending:false };
		default:
			return state;
	}
}

export default createReducers("global",global,initialState );