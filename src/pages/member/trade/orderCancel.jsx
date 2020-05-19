import React, { Component } from 'react';
import { connect } from 'react-redux';
import { LoadingRound } from 'component/common';
import { ordermainStatusMap, reasonList } from '../../../js/filters/orderStatus';
import { browserHistory } from 'react-router';
import { concatPageAndType,popupActions, actionAxios } from 'js/actions/actions';
import { PopupTip } from 'component/modal.jsx';
import axios from 'js/util/axios'
import {WXAPI} from 'config/index'
const pageApi ={
	init:{ url: `${WXAPI}/user/order/info`, method: "get" },//查询平台级订单信息
	cancel:{url: `${WXAPI}/user/order/cancelCloseOrder`, method: "post"}
};
const createActions = concatPageAndType("orderCancel");
const axiosCreator =actionAxios('orderCancel');

class OrderCancel extends Component{
	componentWillMount() {
		this.props.resetData();
		this.props.getData();
	}
	render(){
		if( this.props.load ){
			return <LoadingRound/>;
		}
		
		return <div data-page="order-cancel" style={{ minHeight: $(window).height() }}>
			<OrderTop data={ this.props.data } />
			<ReasonChoose changeReason={ this.props.changeReason } otherReason={ this.props.otherReason } cancel_reason={ this.props.cancel_reason } />
			<SubmitBtn submitHandle={ this.props.cancelSubmit } btnText={"取消订单"} />
			
			<PopupTip  active={ this.props.prompt.show } msg={ this.props.prompt.msg } onClose={ this.props.promptClose } />
			</div>
	}
}

class OrderTop extends Component{
    render(){
        let {data} = this.props;
        console.log(data);
        let {discount_summary={},no,total_fee,post_fee,tax_fee} = data;
        let {coupon=0,hb=0,promotion=0} = discount_summary;
        return(
            <div className="cancel-top">
                <div className="list-top g-row-flex">
                    <div className="left g-col-1">订单号：{no}</div>
                    <div className="right ">{ordermainStatusMap[data.status]}</div>
                </div>
                <div className="list-mid">
                    <div className="li  g-row-flex">
                        <div className="left">商品总额</div> <div className="right g-col-1">¥{(+Number(total_fee)).toFixed(2)}</div>
                    </div>
                    <div className="li  g-row-flex">
                        <div className="left">促销优惠</div>
                        <div className="right g-col-1">- ¥{(+promotion).toFixed(2)}</div>
                    </div>
                    <div className="li  g-row-flex">
                        <div className="left">运费</div>
                        <div className="right g-col-1">+ ¥{(+post_fee).toFixed(2)}</div>
                    </div>
                    <div className="li  g-row-flex">
                        <div className="left">税费</div>
                        <div className="right g-col-1">+ ¥{(+tax_fee).toFixed(2)}</div>
                    </div>
                    <div className="li  g-row-flex">
                        <div className="left">优惠券抵扣</div>
                        <div className="right g-col-1">- ¥{(+coupon).toFixed(2)}</div>
                    </div>
                    <div className="li g-row-flex">
                        <div className="left">红包抵扣</div>
                        <div className="right g-col-1">- ¥{(+hb).toFixed(2)}</div>
                    </div>
                </div>
            </div>
        )
    }
}

//取消理由列表
export class ReasonChoose extends Component{
	render(){
        console.log('取消理由列表cancel_reason',cancel_reason);
        const { cancel_reason,changeReason,otherReason } = this.props;
		const list = reasonList.map((item)=>{
			return <div key={item.name} className="list c-clrfix" onTouchTap={(e)=>{ changeReason(item.name) } }>
				<div className="text">{item.text}</div>
                <div className="choose">
                    {cancel_reason === item.name ? <i className="current-green-icon"> </i>:<i className="current-no-icon"> </i>}
                </div>
			</div>
		});
		return (
			<div className="reason-choose">
				<div className="reason-list">
					{list}
				</div>
				{/*{cancel_reason ==="other" &&
				<div className="reason-text">
					<textarea placeholder="请填写取消订单的理由" defaultValue="" onBlur={(e)=>{ otherReason(e.target.value ) } }/>
				</div>}*/}
			</div>
		)
	}
}

export class SubmitBtn extends Component{
	render(){
		let {cancel_reason,btnText,submitHandle} = this.props;
		return(
			<div className={cancel_reason?"btm-btn  colour-btn":"btm-btn"} onClick={cancel_reason?submitHandle:'' } >
				{btnText}
			</div>
		)
	}
}

function orderCancelState( state, props ) {
	return {
		...state.popup,
		...state.orderCancel,
		tid:props.location.query.tid
	}
}

function orderCancelDispatch( dispatch, props ) {
	let { tid } = props.location.query;
	return {
		dispatch,
		resetData(){
			dispatch( createActions('resetData'));
		},
		getData:()=>{
			dispatch( axiosCreator( 'getData', { ...pageApi.init, params:{ no: tid } }) );
		},
		changeReason:( type )=>{
			dispatch( createActions('changeReason',{ reason:type }));
		},
		otherReason:( value )=>{
			dispatch( createActions('otherReason',{value:value }));
		},
		promptClose(){
			dispatch( popupActions('ctrlPrompt',{ prompt:{ show:false,msg:"" } } ) );
		},
	}
}

function orderCancelProps( stateProps, dispatchProps, props ) {
	let request = false;
	let { dispatch } = dispatchProps;
	return {
		...stateProps,
		...dispatchProps,
		...props,
		cancelSubmit:()=>{
			if( request ) return;
			if( !stateProps.cancel_reason ){
				dispatch( popupActions('ctrlPrompt',{ prompt:{ show:true, msg:"请选择取消订单的理由"}}) );
				return;
			}
			if( stateProps.cancel_reason === 'other' && !stateProps.other_reason.trim() ){
				dispatch( popupActions('ctrlPrompt',{ prompt:{ show:true, msg:"请填写取消订单的理由"}}) );
				return;
			}
			request =true;
            stateProps.cancel_reason = stateProps.cancel_reason === 'other'?stateProps.other_reason.trim():reasonList[stateProps.cancel_reason]['text'];
            axios.request({ ...pageApi.cancel, params:{
                no: stateProps.tid,
				closeDesc:  stateProps.cancel_reason
            } }).then( ({data}) =>{
                console.log(data);
                dispatch( popupActions('ctrlPrompt',{ prompt:{ show:true, msg: data.message||"取消成功" }}) );
                if( data.code !== 0){
                    request = false;
                    return ;
                }
                /*setTimeout(()=>{
                    browserHistory.goBack();
                },1000 );*/
                setTimeout(()=>{
                    browserHistory.push('/tradeList/0');
                },1000 );
            }).catch((err) => {
                console.log(err);
                dispatch( popupActions('ctrlPrompt',{ prompt:{ show:true, msg:"服务器繁忙"}}) );
			})
		}
	}
}

export default connect( orderCancelState, orderCancelDispatch, orderCancelProps )( OrderCancel );