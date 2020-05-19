import React, { Component } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import  { concatPageAndType, actionAxios,popupActions } from 'js/actions/actions';
import {popupData} from 'js/filters/orderStatus';
import { PopupTip } from 'component/modal.jsx';
import { LoadingRound } from 'component/common';
import axios from 'js/util/axios';
import {WXAPI} from 'config/index'
import Popup from "../../../../component/modal2";

const pageApi ={
    init:{ url:`${WXAPI}/user/sold/info`,method:"get"},
    logistics:{ url:`${WXAPI}/user/sold/send`, method:"post"}
};

const createActions = concatPageAndType("afterSaleLogistics");
const axiosCreator = actionAxios("afterSaleLogistics");

class AfterSaleLogistics extends Component{
	componentWillMount() {
		this.props.resetData();
		this.props.getData();
	}
	render(){
		if( this.props.load ){
			return <LoadingRound />
		}
		return (
			<div data-page="after-sale-logistics" id="logisticsForm">
				<InfoBlock data={this.props.data.receiver } changeLogistics={ this.props.changeText } changeNumber={ this.props.changeNum } />
				
				<SubBtn onSubmit={this.props.formSubmit } />
				
				<PopupTip  active={ this.props.prompt.show } msg={ this.props.prompt.msg } onClose={ this.props.promptClose } />
			</div>
		)
	}
}

const InfoBlock =({data,changeLogistics,changeNumber })=>(
	<div className="info-block">
		<div className="info-list">
			<h3><i className="location-address-icon"> </i>退货地址</h3>
			<div className="text">
				<div className="address">
					<span>地址：</span> <div className="g-col-1">{data.address}</div></div>
				<p>收件人：{data.name}</p>
				<p>电话：{data.mobile}</p>
			</div>
		</div>
		<div className="info-list">
			<h3><i className="black-car-icon"> </i>退货物流信息</h3>
			<div className="text">
				<div className="top">请填写您回寄的物流信息</div>
				<div className="input-strip">
					<div className="left">物流公司</div>
					<div className="right"><input type="text" maxLength="38" onInput={ changeLogistics } placeholder="请填写物流公司" /></div>
				</div>
				<div className="input-strip">
					<div className="left">货运单号</div>
					<div className="right"><input type="text" maxLength="38" onInput={ changeNumber } placeholder="请填写货运单号" /></div>
				</div>
			</div>
		</div>
	</div>
);

const SubBtn =({ onSubmit })=>{
	return <div className="btm-btn colour-btn" onClick={ onSubmit }>提交</div>
};

function afterSaleLogisticsState( state ) {
	return{
		...state.popup,
		...state.afterSaleLogistics
	}
}

function afterSaleLogisticsDispatch( dispatch, props ) {
	return {
		dispatch: dispatch,
		resetData:()=>{
		 dispatch( createActions( 'resetData', {query:{ ...props.location.query } } ));
		},
		getData:()=>{
			dispatch( axiosCreator('getData', { ...pageApi.init, params:{after_sale_bn: props.location.query.asid } }) );
		},
		promptClose(){
			dispatch( popupActions('ctrlPrompt',{ prompt:{ show:false,msg:"" } } ) );
		},
		changeNum:( e )=>{
			dispatch( createActions('inputChange', { name:"logisticsNum", value: e.target.value.trim() } ) );
		},
		changeText:( e )=>{
			dispatch( createActions('inputChange', { name:"name", value: e.target.value.trim() } ) );
		}
	}
}

function afterSaleLogisticsProps( stateProps, dispatchProps, props ) {
	let request = false;
	let { dispatch } = dispatchProps;
	return{
		...stateProps,
		...dispatchProps,
		...props,
		formSubmit:()=>{
			if( request ){
				return;
			}
			if( stateProps.name ==="" ){
				dispatch( popupActions('ctrlPrompt', { prompt:{ show:true, msg:"请输入物流公司" }} ) );
				return;
			}
			if( stateProps.logisticsNum ==="" ){
				dispatch( popupActions('ctrlPrompt', { prompt:{ show:true, msg:"请输入货运单号" }} ) );
				return;
			}
			request = true;
            axios.request({ ...pageApi.logistics, data:{
                    after_sale_bn: stateProps.asid,
                    delivery:{
                        corp_name: stateProps.name,
                        delivery_no: stateProps.logisticsNum
                    }
                }

            }).then( result =>{
                dispatch( popupActions('ctrlPrompt', { prompt:{ show:true, msg: "提交成功" }} ) );
                if( result.data.code !== 0 ){
                    request = false;
                    return;
                }
                setTimeout( ()=>{
                    browserHistory.push('/afterSale/list');
                },1000 );
            }).catch( error =>{
                Popup.MsgTip({msg: "服务器繁忙"});
                request = false;
                throw new Error( error );
            })
		}
	}
}



export default connect( afterSaleLogisticsState, afterSaleLogisticsDispatch,afterSaleLogisticsProps )( AfterSaleLogistics );