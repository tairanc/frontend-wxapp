import React, { Component } from 'react';
import { connect } from 'react-redux';
import { reasonList } from '../../../js/filters/orderStatus';
import { Shady} from 'component/common';
import { browserHistory } from 'react-router';
import { concatPageAndType,popupActions, actionAxios } from 'js/actions/actions';
import axios from 'js/util/axios'
import {WXAPI} from 'config/index'
import Popup from "../../../../component/modal2";
const pageApi ={
    cancel:{url: `${WXAPI}/user/order/cancelCloseOrder`, method: "post"}
};
//取消理由列表
class ReasonChoose extends Component{
    render(){
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

class SubmitBtn extends Component{
    render(){
        let {cancel_reason,btnText,submitHandle} = this.props;
        return(
            <div className={cancel_reason?"btm-btn  colour-btn":"btm-btn"} onClick={cancel_reason?submitHandle:'' } >
                {btnText}
            </div>
        )
    }
}


//取消订单弹窗
export class PopupCancelDetail extends Component {
    cancelSubmit = () => {
        let {cancel_reason,PopupCancelMsg,webcancelFrom} = this.props; //webcancelFrom取消订单来源 处理返回(平台级订单取消不能删除所以browserHistory.goBack())
        let {Msg} = PopupCancelMsg;
        axios.request({
            ...pageApi.cancel, params: {
                no: Msg,
                closeDesc: reasonList[cancel_reason].text
            }
        }).then(({data}) => {
            Popup.MsgTip({msg: data.message || "取消成功"});
            webcancelFrom==='tradeDetail'?browserHistory.goBack():location.reload();
        }).catch((err) => {
            console.log(err);
            Popup.MsgTip({msg: error.response.data.message || "服务器繁忙"});
        })

    };

    render() {
        let {PopupCancelMsg, cancelOrderPoup, changeReason, cancel_reason,dispatch,createActions} = this.props;
        return (<div onClick={() => {
            cancelOrderPoup({show: false})
        }}>
            {PopupCancelMsg.show && <Shady/>}
            <div data-page="order-cancel" className={`popup-total ${PopupCancelMsg.show ? "active" : ""}`}
                 onClick={(e) => e.stopPropagation()}>
                <div className="popup-top">
                    <span>取消订单</span>
                    <i className="close-nobg-icon" onClick={() => {
                        cancelOrderPoup({show: false});dispatch(createActions('changeReason', {reason: ""}));
                    }}></i>

                </div>

                <ReasonChoose changeReason={changeReason} cancel_reason={cancel_reason}/>

                <SubmitBtn cancel_reason={cancel_reason} submitHandle={this.cancelSubmit} btnText={"确定"}/>
            </div>
        </div>)
    }
}