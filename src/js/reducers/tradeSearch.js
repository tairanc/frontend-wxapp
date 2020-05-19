import createReducers from './createReducers.js';
import Immutable from 'immutable';

let initialState = {
    load: true,
    list: [],
    page: 1,
    total: 1000,
    keyword: '',
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
};

function deleteOrder(state, tid, status) {
    let list = state.list;
    if(status==="all"){
        list.map((item, i)=>{
            if(item.no === tid){
                list.splice(i,1);
            }
        });
        return {...state}
    }
}

function tradeSearch(state = initialState, action) {
    switch (action.type) {
        case 'resetData':
            return initialState;
        case 'keyword':
            return {...state, keyword: action.keyword};
        case 'getDataLoad':
            return {
                ...state, load: true, blank: false,
                list: [],
                page: 1,
                total: 100
            };
        case 'getDataSuccess':
            let {list, page: {current_page, total_page}} = action.result.data;
            return {
                ...state, load: false,
                list: list,
                page: current_page,
                total: total_page
            };
        case 'concatDataSuccess':
            return {
                ...state, load: false,
                list: state.list.concat(action.result.data.list),
                page: Number(action.result.data.page.current_page),
                total: action.result.data.page.total_page
            };
        case 'ctrlPrompt':
            return {...state, prompt: {...action.prompt}};
        case 'ctrlModal':
            return {...state, modal: {...action.modal}};
        case 'deleteOrder':
            return deleteOrder(state, action.tid, action.status);
        case 'ctrlCustom':
            return {...state, custom: {...action.custom}};
        default:
            return state;
    }
}

export default createReducers("tradeSearch", tradeSearch, initialState);