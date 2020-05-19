import createReducers from './createReducers.js';

const initialState = {
    load: true,
    list: [],
    disTop: 0,
    eachList: [],
    defaultId: 0,
    pages: {},
    hasMore: true,
    gettingMore: false,
    isReturn: false,
    countCart: 0,
};

function initData( result, state ){
    let load = false;
    let list = result.data.list;
    let defaultId = result.data.list[0].id;
    let obj = {
        ...state,
        load: load,
        list: list,
        defaultId: defaultId
    };
    return obj;
}

function initListData( result, state ){
    let list = result.data.list;
    let load = false;
    let defaultId = result.data.list[0].id;
    let eachList = result.data.list[0].item_list;
    let pages = result.data.pages;
    let hasMore = pages.current < pages.total;
    let obj = {
        ...state,
        list: list,
        load: load,
        eachList: eachList,
        pages: pages,
        hasMore: hasMore,
        defaultId: defaultId
    };
    return obj;
}

function addListData( result, state ){
    let eachList = state.eachList.concat(result.data.list[0].item_list);
    let gettingMore = false;
    let pages = result.data.pages;
    let hasMore = pages.current !== pages.total;
    let obj = {
        ...state,
        eachList: eachList,
        gettingMore: gettingMore,
        pages: pages,
        hasMore: hasMore
    };
    return obj;
}

function getCartCount( result, state ){
    let countCart = result.data.count;
    let obj = {...state,countCart: countCart};
    return obj;
}

function topic( state = initialState, action ) {
    switch ( action.type ){
        case 'initSuccess':
            return Object.assign({},{...state},initData( action.result,state ));
        case 'saveTop':
            return Object.assign({},{...state},{disTop: action.value});
        case 'changeReturn':
            return Object.assign({},{...state},{isReturn: action.value});
        case 'changeGettingMore':
            return Object.assign({},{...state},{gettingMore: action.value});
        case 'getDefaultId':
            return Object.assign({},{...state},{defaultId: action.value});
        case 'getEachListSuccess':
            return Object.assign({},{...state},initListData( action.result,state ));
        case 'addEachListSuccess':
            return Object.assign({},{...state},addListData( action.result,state ));
        case 'getCartCountSuccess':
            return Object.assign({},{...state},getCartCount( action.result,state ));
        default:
            return state;
    }
}

export default createReducers("topic",topic,initialState );