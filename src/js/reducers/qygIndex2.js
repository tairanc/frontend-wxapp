import createReducers from './createReducers.js';
import Immutable from 'immutable';

const initialState ={
    jumpPage: "",
    disTop: 0,
    activeIndex:0,
    qygLoad:false,
    listLoad:false,
    isSending:false,
    noData:false,
    pages:"",
    qygData:"",
    oneTabData:"",
    listData:{}
};
function initQygData(result, state) {
    let imState = Immutable.fromJS(state);
    imState = imState.set('qygData',result);
    imState = imState.set('qygLoad',true);
    return imState.toJS();
}


function initOneTabData(result, state) {
    let oneTabData = result.data.list;
    let imState = Immutable.fromJS(state);
    if (oneTabData[0].item_list.length === 0) {
        imState = imState.set("noListData", true);
        imState = imState.set("oneTabData", oneTabData);
        imState = imState.set("listData", state.listData);
        imState = imState.set("pages", {current: 0, total: 0});
        imState = imState.set("listLoad", true);
        return imState.toJS();
    } else {
        state.listData[oneTabData[0].id] = result.data.list[0].item_list;
        let pages = result.data.pages;
        imState = imState.set("noListData", false);
        imState = imState.set("oneTabData", oneTabData);
        imState = imState.set("listData", state.listData);
        imState = imState.set("pages", pages);
        imState = imState.set("listLoad", true);
        return imState.toJS();
    }
}
function addMoreItemData(result, state) {
    state.oneTabData = result.data.list;
    let pages = result.data.pages;
    let imState = Immutable.fromJS(state);
    state.isSending = false;
    state.flag = false;
    state.listData[state.oneTabData[0].id] = state.listData[state.oneTabData[0].id].concat(result.data.list[0].item_list);
    imState = imState.set("oneTabData", state.oneTabData);
    imState = imState.set("listData", state.listData);
    imState = imState.set("pages", pages);
    imState = imState.set("isSending", state.isSending);
    imState = imState.set("listLoad", true);
    return imState.toJS();
}
function getCartCount( result, state ){
    let countCart = result.data.cartInfo.countCart;
    let obj = Object.assign({},{...state},{
        countCart: countCart
    });
    return obj;
}
function qygIndex( state=initialState, action ){
    switch( action.type ){
        case 'jumpPage':
            return { ...state,jumpPage:action.jumpPage};
        case 'disTop':
            return { ...state,disTop:action.top};
        case 'activeIndex':
            return { ...state,activeIndex:action.index};
        case 'load':
            return { ...state,load:action.load};
        case 'qygLoad':
            return { ...state,qygLoad:action.load};
        case 'listLoad':
            return { ...state,listLoad:action.load};
        case 'isSendingState':
            return {...state, isSending: action.isSending};
        case 'qygData':
            return initQygData(action.result, state);
        case 'oneTabData':
            return initOneTabData(action.result, state);
        case 'addMoreItemData':
            return addMoreItemData(action.result, state);
        case 'getCartCountSuccess':
            return Object.assign({},{...state},getCartCount( action.result,state ));
        default:
            return state;
    }
}
export default createReducers("qygIndex2",qygIndex,initialState );