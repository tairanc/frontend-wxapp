import createReducers from './createReducers.js';
import Immutable from 'immutable';

let initialState ={
    load: true,
    data: null,
    limit:0
};

function initData( state, result ) {
    let promotionId = result['promotionId']
    if(state.data && state.data[promotionId] && result.data) {
        result.data.map((r) => {
            const { sku_id } = r
            state.data[promotionId].some((d) => {
                if( d.sku_id === sku_id ) {
                    r.check = d.check
                    return true
                } else {
                    return false
                }
            })
        })
    }
    return {
        load: false,
        data: {...state.data, [promotionId]: result.data},
        limit: result.rules.limit,
        fullPrice: result.rules.fullPrice
    }
}

function itemSelect( state, result ) {
    let imData = Immutable.fromJS( state.data[result['promotionId']] );
    imData = imData.updateIn([result['index'],"check"],( check )=>{
        return !check;
    });
    let _data = {...state.data, [result['promotionId']]:imData.toJS()}
    return { ...state, data: _data};
}

function itemDelete( state, result ) {
    let _data = {...state.data }
    delete _data[result['promotionId']]
    return { ...state, data: _data};
}

function exchangeItem( state = initialState, action ) {
    switch ( action.type ){
        case "resetState":
            return initialState;
        case "initData":
            return initData( state, action.result );
        case "itemSelect":
            return itemSelect( state, action.result );
        case "itemDelete":
            return itemDelete( state, action.result );
        default:
            return state;
    }
}

export default createReducers("exchangeItem",exchangeItem,initialState );