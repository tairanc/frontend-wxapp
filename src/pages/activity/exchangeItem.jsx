import React, { Component } from 'react';
import { LoadingRound, TransShady, EmptyPageLink } from 'component/common';
import { tip } from 'component/modules/popup/tip/tip';
import { connect } from 'react-redux';
import { Link, browserHistory } from 'react-router';
import { concatPageAndType, actionAxios, actionAxiosAll } from 'js/actions/actions';
import { loadMask } from 'component/modules/popup/mask/mask';
import CheckIcon from '../trade/shopCart/CheckIcon';
import axios from 'axios';
import './exchangeItem.scss';
import {WXAPI} from 'config/index'
import {addImageSuffix} from "src/js/util/index"

const pageApi = {
    init: { url:`${WXAPI}/promotion/getExchangesList`, method:"get" },
    // select:{ url:"/wxapi/cartAddBatch.api", method: "post" }
};
const createActions = concatPageAndType('exchangeItem');

class ExchangeItem extends Component{
    componentWillMount() {
        this.props.initPage();
    }

    componentWillUnmount() {
        loadMask.destroy();
        tip.destroy();
    }
    render(){
        let { promotion_id } = this.props.location.query;
        let hasData = (this.props.data && this.props.data[promotion_id] && this.props.data[promotion_id].length) ? true: false;
        if( this.props.load ){
            return <LoadingRound/>;
        }
        if(  !hasData ){
            return <EmptyPageLink config={{
                bgImgUrl:"/src/img/activity/item-none-page.png",
                msg:"暂时没有活动商品",
                redBtn:true,
                btnText:"返回",
                btnClick:()=> browserHistory.goBack()
            }} />
        }
        let { limit, buyNum,fullPrice } = this.props;
        return <div data-page="exchange-item" style={{minHeight:this.props.winHeight}}>
            <div className="m-header">
                {this.props.look ?`购满${fullPrice}元可换购${limit}件热销商品`: `最多可换购${limit}件，已选${buyNum}件`}
            </div>
            {  hasData ?
                <ItemList data={ this.props.data[promotion_id] }
                          look={ this.props.look }
                          itemCheck={ this.props.itemCheck }
                />:""
            }
            {this.props.look ?
                <div className="single-btn"
                     onClick={this.props.toExchangeBuy}>
                    去凑单
                </div> :
                <TotalCtrl buyNum={buyNum}
                           limit={limit}
                           itemLength={ hasData }
                           look={ this.props.look }
                           onSubmit={ this.props.submitHandle } />
            }

        </div>;
    }
}

class ItemList extends Component{
    getList=()=>{
        return this.props.data.map(( item, i )=>{
            return <OneItem key={ i }
                            data={item}
                            look={ this.props.look }
                            itemCheck={ this.props.itemCheck.bind(this,i)} />
        })
    }
    render(){
        return <div className="m-content">
            { this.getList() }
        </div>
    }
}

class OneItem extends Component{
    render(){
        let { data } = this.props;
        let inv = data.store <= 0 || data.shelf_status != 30; //10 仓库中；20 审核中；30 上架中
        return <div className={`one-item g-row-flex ${ inv && "inv"}`}>
            <div className="item-check">
                <CheckIcon isCheck={ data.check }
                           invalid={ inv }
                           disable={ this.props.look }
                           handleCheck={ this.props.itemCheck } />
            </div>
            <Link className="item-info g-col-1 g-row-flex" to={`/item?item_id=${data.item_id}`}>
                <div className="item-img">
                    <img src={ data.image ? addImageSuffix(data.image, '_t') : require('../../img/icon/loading/default-no-item.png')} />
                    { data.store <= 0 ? <img className="img-noItem" src={require('../../img/shopCart/no-item.png')}/> : "" }
                </div>
                <div className="item-detail g-col-1">
                    <div className="title">
                        {data.title}
                    </div>
                    <div className="props">
                        {data.spec_text}
                    </div>
                    <div className="item-price g-row-flex">
                        <p className="price">换购价 ¥{+data.price}</p>
                        { +data.market_price ? <p className="origin-price">原价{+data.sell_price}</p>: ""}
                        <p className="num g-col-1">×1</p>
                    </div>
                </div>
            </Link>
        </div>
    }
}



class TotalCtrl extends Component{
    render(){
        return <div className="total-ctrl c-clrfix">
            <div className="c-fl">已选择{this.props.buyNum}/{this.props.limit}</div>
            <div className="red-btn c-fr" onClick={ this.props.onSubmit } >
                { ( this.props.look || !this.props.itemLength ) ? "返回":"确定"}
            </div>
        </div>
    }
}

function exchangeItemState(state, props) {
    let { promotion_id } = props.location.query;
    let buyNum = (state.exchangeItem.data && state.exchangeItem.data[promotion_id]) ? state.exchangeItem.data[promotion_id].filter((item,i)=>{
        return item.check;
    }).length : 0;
    return {
        ...state.exchangeItem,
        ...state.global,
        buyNum
    }
}

function exchangeItemDispatch(dispatch, props) {
    let { promotion_id , look, fullPrice, limit} = props.location.query;
    let { pathname, search } = props.location;
    return {
        look: look,
        toExchangeBuy(){
            browserHistory.replace(`${DIR}/searchResult?promotion_id=${promotion_id}`);
        },
        initPage(){
            // dispatch( createActions("resetState"));
            axios.request({
                ...pageApi.init,
                params:{
                    promotion_id:promotion_id
                }
            }).then( result =>{
                let _result = {data:result.data.data, rules:{fullPrice, limit}, promotionId: promotion_id}
                dispatch(createActions( "initData",{ result: _result } ));
            }).catch(error => {
                loadMask.destroy();
                tip.show({msg: error.message || error.response.data.message||'小泰发生错误，请稍后再试~'});
                console.log(error);
            })
        },
        itemCheck: ( index )=> {
            return dispatch( ( dispatch, getState )=>{
                let state = getState().exchangeItem;
                let newList = state.data[promotion_id].filter(( item, i )=>{
                    if( index === i ){
                        return !item.check;
                    }else{
                        return item.check;
                    }
                });
                if( newList.length > state.limit ){
                    tip.show({msg:`您最多只能换购${state.limit}件`});
                    return true;
                }else{
                    dispatch(createActions('itemSelect',{ result: {index: index, promotionId: promotion_id }}));
                }
            });
        },
        submitHandle(){
            browserHistory.goBack();
            return
        }
    }
}

export default connect( exchangeItemState, exchangeItemDispatch)(ExchangeItem);