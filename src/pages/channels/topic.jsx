import React, {Component} from 'react';
import {connect} from 'react-redux';
import {browserHistory} from 'react-router';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import axios from 'js/util/axios';
import {WXAPI, DIR} from 'config/index'
import {Channels} from './topicModal';
import {tip} from 'component/modules/popup/tip/tip';

const axiosCreator = actionAxios('channel'); //单个请求
const createActions = concatPageAndType('channel'); //拼接页面名和类型

const pageApi = {
	topicChannel: {url: `${WXAPI}/getChannel`, method: "get"},
	getCartCount: {url: `${WXAPI}/cart/count`, method: "get"},
};

class Topic extends Component {
	constructor(props) {
		super(props);
	}

	static contextTypes = {
		router: React.PropTypes.object
	};

	componentDidMount() {
		$(window).scrollTop(this.props.disTop);
	}

	componentWillReceiveProps(newProps){
		if (this.props.isLogin !== newProps.isLogin) {
			this.props.getCartCount();
		}
	}

	render() {
		return <Channels {...this.props} />
	};
}
//专题页
export function topicState(state, props) {
	return {
		...state.channel,
		...state.global
	}
}

export function topicDispatch(dispatch, props) {
	const {topicId} = props.location.query;
	return {
		saveDistanceTop: () => {
			dispatch(createActions('saveTop', {value: $(window).scrollTop()}));
		},
		changeReturn: (tof) => {
			dispatch(createActions('changeReturn', {value: tof}));
		},
		changeGettingList: (tof) => {
			dispatch(createActions('changeGettingList', {value: tof}));
		},
		getDefaultId: (id) => {
			dispatch(createActions('getDefaultId', {value: id}));
		},
		getDataList: () => {
			axios.request({
				...pageApi.topicChannel,
				params: {nav_id: topicId, page: 1, is_topic: true}
			}).then(result => {
				dispatch(createActions('getEachListSuccess', {result: result.data}));
				document.title = result.data.data.data.list.nav_name;
			}).catch(error => {
				console.error(error);
				browserHistory.replace(`${DIR}/`);   //无数据跳转至首页
				// tip.show({msg: error.response.data.message || '服务器繁忙'});
				//..
			});
		},
		getCartCount: function () {
			axios.request(pageApi.getCartCount)
				.then(result => {
					dispatch(createActions('getCartCountSuccess', {result: result.data}));
				}).catch(error => {
				console.log(error);//..
				tip.show({msg: error.response.data.message || '服务器繁忙'});
			});
		},
		addEachList: function (page) {
			dispatch(createActions('changeGettingMore', {value: true}));
			axios.request({
				...pageApi.topicChannel,
				params: {nav_id: topicId, page: page, is_topic: true}
			}).then(result => {
				dispatch(createActions('addEachListSuccess', {result: result.data}));
			}).catch(error => {
				dispatch(createActions('changeGettingMore', {value: false}));
			});
		}
	}
}

export default connect(topicState, topicDispatch)(Topic);