import React, {Component} from 'react';
import {connect} from 'react-redux';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import axios from 'js/util/axios';
import {WXAPI} from 'config/index'
import {Channels} from './modal';
import {tip} from 'component/modules/popup/tip/tip';

const axiosCreator = actionAxios('channel');
const createActions = concatPageAndType('channel');

const pageApi = {
	xtlpBanner: {url: `${WXAPI}/getBanner`, method: "get"},
	xtlpChannel: {url: `${WXAPI}/getChannel`, method: "get"},
	getCartCount: {url: `${WXAPI}/cart/count`, method: "get"},
};

//小泰良品
class XtlpList extends Component {
	constructor(props) {
		super(props);
	}

	static contextTypes = {
		router: React.PropTypes.object
	};

	componentWillMount() {
		this.props.getDiscriminationByChannelType('xtlp');
	}

	componentDidMount() {
		$(window).scrollTop(this.props.disTop);
	}

	componentWillReceiveProps(newProps){
		if (this.props.isLogin !== newProps.isLogin) {
			this.props.getCartCount();
		}
	}

	render() {
		let config = {
			title: '小泰良品',
			type: 'xtlp'
		};
		return <Channels config={config} {...this.props} />
	}
}

//==============
export function xtlpState(state, props) {
	return {
		...state.channel,
		...state.global
	}
}

export function xtlpDispatch(dispatch, props) {
	return {
		getPageData: function () {
			axios.request({...pageApi.xtlpBanner, params: {display_path: 20}})
				.then(result => {
					dispatch(createActions('initSuccess', {result: result.data}));
					let navId = result.data.data.list.list.length ? result.data.data.list.list[0].id : "";
					if (!navId) return;
					dispatch(axiosCreator('getEachList', {
						...pageApi.xtlpChannel,
						params: {nav_id: navId, page: 1}
					}));
				}).catch(error => {
				console.log(error);
				tip.show({msg: error.response.data.message || '服务器繁忙'});
			});
		},
		saveDistanceTop: function () {
			dispatch(createActions('saveTop', {value: $(window).scrollTop()}));
		},
		changeReturn: function (tof) {
			dispatch(createActions('changeReturn', {value: tof}));
		},
		changeGettingList: function (tof) {
			dispatch(createActions('changeGettingList', {value: tof}));
		},
		getDefaultIndex: function (index) {
			dispatch(createActions('getDefaultIndex', {value: index}));
		},
		getDefaultId: function (id) {
			dispatch(createActions('getDefaultId', {value: id}));
		},
		getEachList: function (id) {
			axios.request({
				...pageApi.xtlpChannel,
				params: {nav_id: id, page: 1}
			}).then(result => {
				dispatch(createActions('getEachListSuccess', {result: result.data}));
			}).catch(error => {
				console.error(error);
				tip.show({msg: error.response.data.message || '服务器繁忙'});
			});
		},
		getCartCount: function () {
			axios.request(pageApi.getCartCount)
				.then(result => {
					dispatch(createActions('getCartCountSuccess', {result: result.data}));
				}).catch(error => {
				console.log(error);
				tip.show({msg: error.response.data.message || '服务器繁忙'});
			});
		},
		addEachList: function (id, page) {
			dispatch(createActions('changeGettingMore', {value: true}));
			axios.request({
				...pageApi.xtlpChannel,
				params: {nav_id: id, page: page}
			}).then(result => {
					dispatch(createActions('addEachListSuccess', {result: result.data}));
				}).catch(error => {
				dispatch(createActions('changeGettingMore', {value: false}));
			});
		},
		getDiscriminationByChannelType: function (type) {
			dispatch(createActions('discrimination', {channelType: type}));
		}
	}
}

export default connect(xtlpState, xtlpDispatch)(XtlpList);