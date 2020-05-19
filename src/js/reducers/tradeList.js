import createReducers from './createReducers.js';
import Immutable from 'immutable';

let navList = [
    {text: "全部", status: 0, url: "/tradeList/0"},
    {text: "待付款", status: 1, url: "/tradeList/1"},
    {text: "待发货", status: 2, url: "/tradeList/2"},
    {text: "待收货", status: 3, url: "/tradeList/3"},
    {text: "待评价", status: 4, url: "/tradeList/4"}
];


let initialState = {
    navList: navList,
    list: {
        all: {
            load: true,
            data: [],
            page: 1,
            total: 1000
        },
        waitPay: {
            load: true,
            data: [],
            page: 1,
            total: 1000
        },
        waitSend: {
            load: true,
            data: [],
            page: 1,
            total: 1000
        },
        waitConfirm: {
            load: true,
            data: [],
            page: 1,
            total: 1000
        },
        waitRate: {
            load: true,
            data: [],
            page: 1,
            total: 1000
        }
    },
    hasMore:true,
    isSending:false,
    prompt: {
        show: false,
        msg: ""
    },
    modal: {
        show: false,
        msg: "",
        modalSure: ""
    },
    request: false,
    custom: {
        show: false,
        tid: ''
    },
    PopupCancelMsg:{
        show: false,
        Msg:""
    },
    cancel_reason:'',
    flag:false,
    saveTop:0,
    currentPage:1,
    userAction:false
};
function resetList(state, type) {
    let imData = Immutable.fromJS(state);
    imData = imData.setIn(["list", type], {
        load: true,
        data: "",
        page: 1,
        total: 1000
    });
    imData = imData.setIn(["hasMore"],true);
    imData = imData.setIn(["isSending"],false);
    return imData.toJS();
}

function setRequestData(state, data, cbData) {
    if (data.code === 401) {
        browserHistory.replace(`/login?redirect_uri=${ encodeURIComponent(cbData.url)}`);
        return state;
    }
    let imData = Immutable.fromJS(state);
    if (data.code !== 0) {
        imData.setIn("prompt", {show: true, msg: data.message});
        return imData.toJS();
    }
    imData = imData.setIn(["list", cbData.type, "load"], false);
    imData = imData.setIn(["list", cbData.type, "page"], cbData.page);
    imData = imData.setIn(["list", cbData.type, "total"], data.data.page.total_page);
    imData = imData.setIn(["hasMore"], data.data.page.current_page<data.data.page.total_page);
    imData = imData.setIn(["isSending"], false);


    let addCurrentlist = data.data.list.map((item,i)=>{
        return {...item,currentPage:data.data.page.current_page}
    });
    imData = imData.setIn(["list", cbData.type, "data"], addCurrentlist);
    return imData.toJS();
}
function setbackData(state, data, cbData){
    let imData = Immutable.fromJS(state);
    let addCurrentlist = data.data.list.map((item,i)=>{
        return {...item,currentPage:data.data.page.current_page}
    });
    //删除当前页以后数据
    let delList = imData.getIn(["list", cbData.type, "data"]).toJS();
    delList = delList.filter(item=>item.currentPage < cbData.page);

    //链接请求页数据
    delList.splice((cbData.page-1)*10,0,...addCurrentlist);
    imData = imData.setIn(["list", cbData.type, "data"], delList);
    imData = imData.setIn(["list", cbData.type, "page"], cbData.page);
    imData = imData.setIn(["list", cbData.type, "total"], data.data.page.total_page);
    imData = imData.setIn(["hasMore"], data.data.page.current_page<data.data.page.total_page);
    imData = imData.setIn(["isSending"], false);
    return imData.toJS();
}
function concatRequestData(state, data, type, page) {
    let imData = Immutable.fromJS(state);
    let addCurrentlist = data.data.list.map((item,i)=>{
        return {...item,currentPage:data.data.page.current_page}
    });
    let newList = imData.getIn(["list", type, "data"]).toJS().concat(addCurrentlist);
    imData = imData.setIn(["list", type, "page"], page);
    imData = imData.setIn(["list", type, "total"], data.data.page.total_page);
    imData = imData.setIn(["list", type, "data"], newList);
    imData = imData.setIn(["hasMore"], data.data.page.current_page<data.data.page.total_page);
    imData = imData.setIn(["isSending"], false);
    return imData.toJS();
}

function deleteOrder(state, tid, status) {
    let imData = Immutable.fromJS(state);
    let list = imData.getIn(["list", status, "data"]).toJS();
    if(list.length > 1){
        if (status === "all") {
            let itemTemp, listTemp = [];
            list.map((item, i) => {
                item.order_shops.map((key, j) => {
                    itemTemp = {...item};
                    if (key.no === tid) {
                        itemTemp.order_shops.splice(j, 1);
                    }
                });
                listTemp.push(itemTemp);
            });
            imData = imData.setIn(["list", status, "data"], listTemp);
        }else if(status === "waitRate"){
            list.map((item, i) => {
                if (item.no === tid) {
                    delete list[i]
                }
            });
            imData = imData.setIn(["list", status, "data"], list);
        }
        return imData.toJS();
    }else {
        location.reload()
    }

}

function tradeList(state = initialState, action) {
    switch (action.type) {
        case 'resetData':
            return initialState;
        case 'getDataLoad':
            return resetList(state, action.cbData.type);
        case 'getDataSuccess':
            return setRequestData(state, action.result, action.cbData);
        case 'concatDataSuccess':
            return concatRequestData(state, action.result, action.dataType, action.page);
        case 'ctrlPrompt':
            return {...state, prompt: {...action.prompt}};
        case 'ctrlModal':
            return {...state, modal: {...action.modal}};
        case 'ctrlCustom':
            return {...state, custom: {...action.custom}};
        case 'deleteOrder':
            return deleteOrder(state, action.tid, action.status);
        case 'cancelPopup':
            return { ...state, PopupCancelMsg: {...action.status}};
        case 'changeReason':
            return { ...state,
                cancel_reason:action.reason
            };
        case 'saveHistroy':
            return { ...state, flag:action.flag,saveTop:action.saveTop,currentPage:action.currentPage};
        case 'getbackDataLoad':
            return {...state};
        case 'getbackDataSuccess' :
            return setbackData(state,action.result,action.cbData);
        case 'changeSending' :
            return { ...state,isSending:action.isSending};
        case 'changeHasmore':
            return { ...state,hasMore:action.hasMore};

        default:
            return state;
    }
}

export default createReducers("tradeList", tradeList, initialState);