import createReducers from './createReducers.js';
import {browserHistory} from 'react-router';

const initialState = {
    load: true,
    data: "",
    modal: {
        show: false,
        msg: "",
        modalSure: ""
    },
    msg:"",
    hasMore: true,
    sending: false,
    page: 2,
    Know: false
};

function afterSaleList(state = initialState, action) {
    switch (action.type) {
        case 'resetData':
            return initialState;
        case 'getDataSuccess':
            if (action.result.code === 401) {
                browserHistory.replace(`/login?redirect_uri=${ encodeURIComponent('/afterSale/list')}`);
                return state;
            }
            return {
                ...state,
                load: false,
                data: action.result.data.list,
                hasMore: action.result.data.pager.total_page <= action.cbData.page ? false : true
            };
        case 'addDataSuccess':
            if (action.result.code !== 0) {
                return {...state, sending: false}
            }
            return {
                ...state,
                load: false,
                data: state.data.concat(action.result.data.list),
                hasMore: action.result.data.pager.total_page <= action.cbData.page ? false : true,
                page: (state.page + 1),
                sending: false
            };
        case 'ctrlModal':
            return {...state, [action.modal]: action.status,msg:action.msg};
        case 'changeSending':
            return {...state, sending: {...action.tof}};
        default:
            return state;
    }
}

export default createReducers("afterSaleList", afterSaleList, initialState);