import createReducers from './createReducers.js';

const initialState ={
	load:true,
	tid:"",
	oid:"",
	refund:"",
	paymentLarg:"",
	listType:"SELECT",
    reasonList:[],
	reason:"0",
	money:"",
	description:"",
	popup:"",
	popupShow:false,
	imgArr:[],
    subArr:[],
	modal:{
		show:false,
		msg:"",
		modalSure:""
	},
	data:""

};

function afterSaleApply( state=initialState, action ){
	switch( action.type ){
		case 'resetData':
			return { ...initialState, ...action.query };
		case 'getDataSuccess':
			return { ...state, load:false, data:action.result.data,money:action.result.data.payment,
				paymentLarg:action.result.data.payment };
		case 'ctrlModal':
			return { ...state, modal:{ ...action.modal } };
		case 'changeMoney':
			return { ...state, money: action.money };
		case 'changeDescribe':
			return { ...state, description: action.description };
		case 'ctrlPopup':
			return { ...state, popup: action.popup, popupShow:action.show };
		case 'hidePopup':
			return { ...state, popupShow: action.show };
		case 'reasonChange':
			return { ...state, reason: action.reason, popupShow:false };
		case 'setImgArr':
			return { ...state, imgArr: action.imgArr };
        case 'setsubImgArr':
            return { ...state, subArr: action.subArr };
		case 'typeChange':
			return { ...state, listType:action.listType, reasonList:action.reasonList, popupShow:false };
		default:
			return state;
	}
}
export default createReducers("afterSaleApply",afterSaleApply,initialState );