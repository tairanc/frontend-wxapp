import createReducers from './createReducers.js';
import Immutable from 'immutable';

let initialState ={
	showPopup:false,
	prompt:false,
	promptMsg: "",
	token: "",
	ident: "",
    openId: ""
};

function userLogin( state = initialState, action ) {
	switch ( action.type ){
		case "ctrlPopup":
			return {...state,showPopup:action.status };
		case 'addToken':
            return { ...state, token:action.token };
        case 'addIdentAndOpenid':
            return { ...state, ident:action.ident, openId: action.openId };
		case "ctrlPrompt":
			return{ ...state, prompt:action.prompt,promptMsg:action.msg };
		default:
			return state;
	}
}

export default createReducers("userLogin",userLogin,initialState );