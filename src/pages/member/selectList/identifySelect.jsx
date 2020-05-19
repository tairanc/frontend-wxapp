import React, {Component} from 'react';
import {Link, browserHistory} from 'react-router';
import {connect} from 'react-redux'
import {LoadingRound} from 'component/common';
import {PopupTip} from 'component/modal';
import {concatPageAndType, actionAxios} from 'js/actions/actions';
import axios from 'axios';
import './identifySelect.scss';

const createActions = concatPageAndType('identifySelect');
const axiosCreator = actionAxios("identifySelect");

const orderConfirmActions = concatPageAndType("orderConfirm");
const popupActions = concatPageAndType('popup');

const pageApi = {
	init: {url: "/wxapi/IDCardList.api", method: "get"},
	goCertify: {url: "/wxapi/certify.api", method: "get"}
}

class IdentifySelect extends Component {
	componentWillMount() {
		this.props.initialPage();
	}

	componentDidMount() {
		this.props.getData();
	}

	render() {
		if (this.props.load) {
			return <LoadingRound/>;
		}
		return <div data-page="identify-select" style={{minHeight: $(window).height()}}>
			<div className="colour-strip"></div>
			<IdentifyList data={ this.props.data } status={ this.props.selectStatus } getData={ this.props.getData}
										goCertify={this.props.goCertify}/>
			<Link className="manage-btn" to="/goodsReceiveInfo/identityManage">管理身份证</Link>
			<PopupTip active={ this.props.prompt.show } msg={ this.props.prompt.msg } onClose={ this.props.promptClose }/>
		</div>
	}
}

class IdentifyList extends Component {
	getHtml() {
		return this.props.data.map((list, i) => {
			return <div className="one-list-grid" key={ i }>
				<OneListConnect data={ list } status={ this.props.status } getData={ this.props.getData }
												goCertify={this.props.goCertify}/>
			</div>
		});
	}

	render() {
		return <div className="identify-list">
			{  this.getHtml()}
		</div>

	}
}

class OneList extends Component {
	render() {
		let {data, status} = this.props, self = this;
		return <div className="one-list">
			<div className="list-info">
				<div className="text" onClick={ this.props.listSelect }>
					<div className="top">{ data.name }
						{data.is_certify ? <img src="/src/img/addressAndIdentityInfo/is_certify.png" className="is-certify"/> :
							<span className="no-certify" onClick={(e) => {
								e.stopPropagation();
								self.props.goCertify(data.card_id, self.props);
							}
							}>去认证</span>}
					</div>
					<div className="main"><span>身份证号</span>{ data.idnumber }</div>
				</div>
				<Link className="edit" to={`/goodsReceiveInfo/identityManage?id=${ data.card_id }&is_certify=${data.is_certify}`}>
					<i className="edit-icon"> </i>
				</Link>
			</div>
			<div className={`list-status ${ data.hasPhoto ? 'success' : ( status ? 'error' : 'warn' ) }`}>
				<i> </i>
				{ data.hasPhoto ? '已上传身份证照片' :
					( status ? '您购买的是海淘商品，请上传身份证照片' : '未上传身份证照片' )
				}
			</div>
		</div>
	}
}

function oneListDispatch(dispatch, props) {
	return {
		listSelect: () => {
			if(!props.data.is_certify){
				dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "身份信息未认证，请修改后选择"}}));
				return;
			}
			if (props.status && !props.data.hasPhoto) {
				dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: "您购买的是海淘商品，请上传身份证照片"}}));
				return;
			}
			dispatch(orderConfirmActions('selectIdentify', {data: props.data}));
			setTimeout(() => {
				browserHistory.goBack();
			}, 500);
		}
	}
}

const OneListConnect = connect(null, oneListDispatch)(OneList);

function identifySelectState(state, props) {
	return {
		...state.popup,
		...state.identifySelect,
		confirmLoad: state.orderConfirm.load,
	}
}

function identifySelectDispatch(dispatch, props) {
	let selectStatus = Number(props.location.query.status);
	return {
		dispatch,
		getData: (status) => {
			if (!status) dispatch(createActions('resetState'));
			dispatch(axiosCreator('initialData', pageApi.init, {status: selectStatus}));
		},
		promptClose: () => {
			dispatch(popupActions('ctrlPrompt', {prompt: {show: false, msg: ""}}));
		},
		goCertify: (id, param) => {
			axios.request({...pageApi.goCertify, params: {card_id: id}})
				.then(result => {
					dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: result.data.msg}}));
					if (!result.data.status) {
						return;
					}
					param.getData(true);
				}).catch(error => {
				dispatch(popupActions('ctrlPrompt', {prompt: {show: true, msg: result.data.msg}}));

			})
		}
	}
}

function identifySelectProps(stateProps, dispatchProps, props) {
	let {dispatch} = dispatchProps;
	return {
		...stateProps,
		...dispatchProps,
		...props,
		initialPage: () => {
			if (stateProps.confirmLoad) {
				browserHistory.goBack();
				return;
			}
			dispatch(orderConfirmActions('setOrigin', {origin: 'id'}));
		},
	}
}

export default connect(identifySelectState, identifySelectDispatch, identifySelectProps)(IdentifySelect);