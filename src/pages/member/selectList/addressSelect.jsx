import React, { Component } from 'react';
import { Link, browserHistory } from 'react-router';
import { connect } from 'react-redux'
import {  LoadingRound } from 'component/common';
import { concatPageAndType,actionAxios } from 'js/actions/actions';
import './addressSelect.scss';

const pageApi ={
	init: { url:"/wxapi/addressList.api"  ,method:"get" }
}

const createActions = concatPageAndType('addressSelect');
const axiosCreator = actionAxios("addressSelect");

const orderConfirmActions =  concatPageAndType("orderConfirm");
const invoiceActions =  concatPageAndType("invoiceSelect")
const popupActions = concatPageAndType('popup');

class AddressSelect extends Component{
	componentWillMount() {
		this.props.initialPage();
	}
	componentDidMount() {
		this.props.getData();
	}
	render(){
		if( this.props.load ){
			return <LoadingRound/>;
		}
		return <div data-page="address-select"  style={{ minHeight: this.props.winHeight }}>
			<div className="colour-strip"> </div>
			<AddressList data={ this.props.data } from={ this.props.from } />
			<Link className="manage-btn" to="/goodsReceiveInfo/addressManage?from=submit">管理地址</Link>
		</div>
	}
}

class AddressList extends Component{
	getHtml(){
		return this.props.data.map( ( list, i )=>{
			return <div className="one-list-grid" key={ i } >
				<OneListConnect data={ list } from={ this.props.from } />
			</div>
		});
	}
	render(){
		return <div className="address-list">
			{	this.getHtml()}
		</div>
		
	}
}

class OneList extends Component{
	render(){
		let { data } = this.props;
		return <div className="one-list" >
			<div className="list-info" onClick={ this.props.listSelect }>
				<div className="top">
					<span>{ data.name }</span> { data.mobile }
				</div>
				<div className="text">
					{ data.def_addr ? <span>[默认地址]</span> :"" } {data.area_string}{ data.addr }
				</div>
			</div>
			<Link className="edit" to={`/goodsReceiveInfo/addressManage?id=${ data.addr_id }`}>
				<i className="edit-icon"> </i>
			</Link>
		</div>
	}
}

const selectAddress = {
	orderConfirm:function ( dispatch, data ) {
		dispatch( orderConfirmActions( 'selectAddress', { data:data } ));
		browserHistory.goBack();
	},
	invoice:function ( dispatch, data ) {
		dispatch( invoiceActions('selectAddress', { data: data }));
		browserHistory.goBack();
	}
};

function oneListDispatch( dispatch, props ) {
	return {
		listSelect:()=>{
			selectAddress[ props.from ]( dispatch, props.data );
		}
	}
}

const OneListConnect = connect( null, oneListDispatch)( OneList );

const fromCtrl = {
	orderConfirm:function( dispatch ){
		dispatch( orderConfirmActions('setOrigin',{ origin:'address' }) );
		dispatch( createActions('setFrom',{ from:"orderConfirm"}));
	},
	invoice:function ( dispatch ) {
		dispatch( invoiceActions('setOrigin',{ origin:'address' }) );
		dispatch( createActions('setFrom', { from:"invoice" }));
	}
};

function addressSelectState( state, props ) {
	return {
		...state.popup,
		...state.addressSelect,
		...state.global
	}
}

function addressSelectDispatch( dispatch, props ) {
	let { from } = props.location.query;
	return {
		initialPage:()=>{
			dispatch( createActions('resetState') );
			if( !from ){
				browserHistory.goBack();
				return;
			}
			fromCtrl[from]( dispatch );
		},
		getData:()=>{
		
			dispatch( axiosCreator('initialData', pageApi.init ) );
		},
		promptClose:()=>{
			dispatch( popupActions('ctrlPrompt',{ prompt:{ show:false, msg:"" } } ) );
		}
	}
}


export default connect( addressSelectState, addressSelectDispatch )( AddressSelect );