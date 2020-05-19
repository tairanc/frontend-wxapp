import createReducers from './createReducers.js';

let initialState = {
    load: true,
    discrimination:{},
    banner: [],
    list: [],
    disTop: 0,
    eachList: [],
    defaultIndex: 0,
    defaultId: 0,
    pages: {},
    gettingList: true,
    hasMore: true,
    gettingMore: false,
    isReturn: false,
    countCart: 0
};

function initData( result, state ){
    let load = false;
    let banner = result.data.banner;
    let list = result.data.list;
    let defaultId = list.length?list[0].id:'';
    let obj = Object.assign({},{...state},{
        load: load,
        banner: banner,
        list: list,
        defaultId: defaultId
    });
    return obj;
}

function initListData( result, state ){
    let obj;
    if(result.data){
        let eachList = result.data.list[0].item_list;
        let gettingList = false;
        let pages = result.data.pages;
        let hasMore = (pages.current >= pages.total)?false:true;
        obj = Object.assign({},{...state},{
            eachList: eachList,
            gettingList: gettingList,
            pages: pages,
            hasMore: hasMore
        });
    }else{
        obj = Object.assign({},{...state},{
            eachList: [],
            gettingList: false,
            pages: 0,
            hasMore: false
        });
    }
    return obj;
}

function addListData( result, state ){
    let eachList = state.eachList.concat(result.data.list[0].item_list);
    let gettingMore = false;
    let pages = result.data.pages;
    let hasMore = (pages.current === pages.total)?false:true;
    let obj = Object.assign({},{...state},{
        eachList: eachList,
        gettingMore: gettingMore,
        pages: pages,
        hasMore: hasMore
    });
    return obj;
}

function getCartCount( result, state ){
    console.log(result);
    let countCart = result.data.cart_num;
    let obj = Object.assign({},{...state},{
        countCart: countCart
    });
    return obj;
}

function initDiscrimination( type, state ){
    let obj = {};
    if(type=='qyg'){
        obj = Object.assign({},{...state},{
            discrimination:{
                type:type,
                inputShowState: true,
                //有文本和tab切换
                oneMoreItemType: 1,
                //banner在tab导航栏下方
                bannerPosition:'bottom'
            }
        });
    }else if(type=='xtlp'){
        obj = Object.assign({},{...state},{
            discrimination:{
                type:type,
                inputShowState: false,
                //只有文本
                oneMoreItemType: 0,
                //banner在tab导航栏上方
                bannerPosition:'top'
            }
        });
    }
    return obj;
}

function qyg( state = initialState, action ) {
    switch ( action.type ){
        case 'initSuccess':
            return Object.assign({},{...state},initData( action.result,state ));
        case 'saveTop':
            return Object.assign({},{...state},{disTop: action.value});
        case 'changeReturn':
            return Object.assign({},{...state},{isReturn: action.value});
        case 'changeGettingList':
            return Object.assign({},{...state},{gettingList: action.value});
        case 'changeGettingMore':
            return Object.assign({},{...state},{gettingMore: action.value});
        case 'getDefaultIndex':
            return Object.assign({},{...state},{defaultIndex: action.value});
        case 'getDefaultId':
            return Object.assign({},{...state},{defaultId: action.value});
        case 'discrimination':
            return Object.assign({},{...state},initDiscrimination(action.channelType,state));
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

export default createReducers("qygIndex",qyg,initialState );