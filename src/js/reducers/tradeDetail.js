import createReducers from './createReducers.js';
import { browserHistory }  from 'react-router';

const initialState ={
	load:true,
	data:"",
	modal:{
		show:false,
		msg:"",
		modalSure:""
	},
	payPopupMsg:{
		show: false,
		Msg:""
	},
    PopupCancelMsg:{
        show: false,
        Msg:""
	},
    cancel_reason:'',
    modalAS:{
        show:false,
        msg:""
    },
};

function tradeDetail( state=initialState, action ){
	switch( action.type ){
		case 'resetData':
            return initialState;
		case 'getDataSuccess':
			if( action.result.code === 401 ){
				browserHistory.replace( `/login?redirect_uri=${ encodeURIComponent(action.cbData)}` );
				return state;
			}
            return { ...state, load:false, data:action.result };
		case 'ctrlModal':
			return { ...state, modal:{ ...action.modal } };
		case 'payPopup':
            return { ...state, payPopupMsg: {...action.status}};
        case 'cancelPopup':
            return { ...state, PopupCancelMsg: {...action.status}};
        case 'changeReason':
            return { ...state,
                cancel_reason:action.reason
            };
        case 'ctrlModalapply':
            return {...state, modalAS:{ ...action.modalAS }};
        default:
			return state;
	}
}
export default createReducers("tradeDetail",tradeDetail,initialState );