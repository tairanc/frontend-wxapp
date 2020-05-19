/**
 * Created by hzhdd on 2017/10/31.
 */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import axios from 'js/util/axios';
import {browser} from 'js/common/utils';
import {LoadingRound, ShareConfig, getJSApi, EmptyPage} from 'component/common';
import {browserHistory} from 'react-router';
import {Modal, Fix} from 'component/modal';
import {WXAPI} from 'config/index'
import {redirectURL} from 'js/util/index'
import {tip} from 'component/modules/popup/tip/tip';
import {getCookie, setCookie, clearCookie} from 'js/common/cookie';

import './item.scss';

import Detail from "./detail.jsx"
import Seckill from "./seckill.jsx"
import GroupBuy from "./groupBuy.jsx"
const pageApi = {
	Detail: {url: `${WXAPI}/item/detail`, method: "get"},         //详情
	Mix: {url: `${WXAPI}/item/mix`, method: "get"},               //混合
	Promotion: {url: `${WXAPI}/item/promotion`, method: "get"},  //促销和规格数据
	Rate: {url: `${WXAPI}/item/rate`, method: "get"},            //评价
	//Recommend: {url: `${WXAPI}/item/recommend`, method: "get"}, //推荐
	Recommend: {url: `${WXAPI}/recommend/getViewBack`, method: "get"}, //推荐
	GetCart: {url: `${WXAPI}/cart/count`, type: "get"},  //购物车信息
};
const axiosCreator = actionAxios('itemIndex');
const createActions = concatPageAndType('itemIndex');

// 加入渠道码 脚本start
function getURLParameter(name) {
	var parameterStr = window.location.search.replace(/^\?/, ''),
		reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)'),
		value = parameterStr.match(reg);
	return value ? value[2] : null;
}

function addChannel(obj) {
	obj.find("a").each(function () {
		let org_href = $(this).attr('href');
		let reg_schem = /^t/;
		let reg_channel = /channel/;
		if (org_href && !reg_schem.test(org_href) && !reg_channel.test(org_href)) {
			let reg_requrey = /\?/, href;
			href = org_href + (reg_requrey.test(org_href) ? "&" : "?" ) + "channel=" + channel;
			$(this).attr('href', href)
		}
	})
}

/*function preventScroll(status) {
 let sTop = $(window).scrollTop() || preventScroll.disTop;
 if (status) {
 $("#item-details").css({position: "fixed", top: -sTop, width: "100%"});
 preventScroll.disTop = sTop;
 } else {
 $("#item-details").css({position: "static", top: ""});
 $(window).scrollTop(preventScroll.disTop || 0);
 }

 if ($("#item-details")[0] && $("#item-details")[0].offsetTop === 0) {
 preventScroll.disTop = 0;
 }
 }*/

export function preventScroll(status) {
	if (status) {
		$("body").css({overflow: "hidden"})
	} else {
		$("body").css({overflow: "auto"})
	}
}

class ItemPage extends Component {
	constructor(props) {
		super(props);
	}

	componentWillMount() {
		const mini = this.props.location.query.mini || getCookie('mini');
		//redirectURL(location.pathname + location.search, mini);
		document.title = '商品详情';

		const {iPhone, iPad, weixin} = browser.versions;
		let targetUrl = location.href.split("#")[0];
		// weixin && !iPad && !iPhone && getJSApi(targetUrl); //非ios系统在相关页面中调用微信分享签名

		let {item_id} = this.props.location.query;
		let firstT = this.props.firstT || (+new Date() + ""); //初次进入页面保存当前浏览器时间
		let returnT = this.props.data && this.props.data.item_id ? (+new Date() + "") : 0;  //回退到当前页面再次保存下浏览器时间
		if (!item_id) {
			browserHistory.push("/");
		}

		if (item_id != this.props.data.item_id || this.props.loginBack === "loginBack") {
			this.props.InitAndClearData();
			this.props.Detail(item_id);
			this.props.Promotion(item_id);
			this.props.Rate(item_id);
			this.props.isLogin && this.props.GetCart();
		}

		//存商品标题到sessionStorage中，供话务系统调用
        this.props.data.title ? window.sessionStorage.setItem("dcpPageTitle", this.props.data.title) : null;

		this.props.UpdataTimer(firstT, returnT);
	}

	componentDidMount() {
		let channel = getURLParameter('channel');
		if (channel) addChannel($('body'));
		if (this.props.buyModal || this.props.promotionModal || this.props.couponsModal || this.props.searverModal) {
			preventScroll(true)
		} else {
			preventScroll(false)
		}
	}

	componentWillReceiveProps(newProps) {
		let {item_id: newItem_id} = newProps.location.query;
		let {item_id} = this.props.location.query;
		let {status, mixStatus, rateStatus, recommendStatus, proStatus, cartInfoStatus} = newProps;
		let hasScrollHeight = window.mapScrollHeight && window.mapScrollHeight[item_id];
		if (status && mixStatus && rateStatus && recommendStatus && proStatus && cartInfoStatus && hasScrollHeight) {
			this.timer = setTimeout(function () {
				$(window).scrollTop(hasScrollHeight);
			}, 1);
			this.timer = null;
			window.mapScrollHeight.item_id = null;
		}
		if (this.props.isLogin !== newProps.isLogin) {
			this.props.GetCart();
		}
		if (newItem_id != item_id) {
			this.props.InitAndClearData();
			this.props.Detail(newItem_id);
			this.props.Promotion(newItem_id);
			this.props.Rate(newItem_id);
			this.props.GetCart();
			let height = $(window).scrollTop();
			(window.mapScrollHeight = window.mapScrollHeight || {})[item_id] = height;
		}

		if (newProps.buyModal || newProps.promotionModal || newProps.couponsModal || newProps.searverModal) {
			preventScroll(true)
		} else {
			preventScroll(false)
		}
	}

	componentWillUnmount() {
		//卸载的时候保存页面卷曲的高度
		let {item_id} = this.props.data, height = $(window).scrollTop();
		(window.mapScrollHeight = window.mapScrollHeight || {})[item_id] = height;
	}

	selectModel = () => {
		let {data} = this.props;
		let ret;
		switch (data.item_type) {
			case "GroupBuy":
				ret = <GroupBuy {...this.props} />;
				break;
			case "SecKill":
				ret = <Seckill {...this.props}/>;
				break;
			default:
				ret = <Detail {...this.props}/>
		}
		return ret
	};

	render() {
		return (
			this.props.updata ?
				this.props.status ?
					this.selectModel()
					: <EmptyPage config={{
					bgImgUrl: "/src/img/item/item-noexist-icon.png",
					msg: "商品过期不存在",
					noBtn: true
				}}/>
				: <LoadingRound />
		)
	}
}

export function ItemPageState(state, props) {
	return {
		...state.itemIndex,
		...state.global,
	}
}

export function ItemPageDispatch(dispatch, props) {
	return {
		InitAndClearData: () => {
			dispatch(createActions('initAndClearData'))
		},
		Detail: (item_id) => {
			axios.request({...pageApi.Detail, params: {"item_id": item_id}}).then(
				({data}) => {
					if (data.code !== 0) {
						return
					}
					/*let shareInfo = {
					 title: data.data.title, // 分享标题
					 desc: "我在泰然城发现了一个不错的商品，赶紧来看看吧！", // 分享描述
					 link: location.protocol + "//" + location.host + "/item?item_id=" + item_id, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
					 imgUrl: data.data.images[0], // 分享图标
					 };
					 ShareConfig(shareInfo);*/
					dispatch(createActions('initData', {data: data.data, status: true, updata: true, itemId: item_id}));
					dispatch(axiosCreator('recommendData', {
						...pageApi.Recommend,
						params: {
							"item_id": item_id,
							terminal: 'H5',
							page_count: 6
						}
					}));
					dispatch(axiosCreator('mixData', {...pageApi.Mix, params: {"item_id": item_id}}));
				}
			).catch(error => {
				console.log(error);
				// tip.show({msg: error.response.data.message || '服务器繁忙'});  //不提示
				dispatch(createActions('changeStatus', {updata: true, status: false}));
			});
		},
		Promotion: (item_id) => {
			dispatch(axiosCreator('promotionData', {...pageApi.Promotion, params: {"item_id": item_id}}));
		},
		Rate: (item_id) => {
			dispatch(axiosCreator('rateData', {...pageApi.Rate, params: {"item_id": item_id}}));
		},
		GetCart: () => {
			dispatch(axiosCreator('cartInfoData', pageApi.GetCart));
		},

		UpdateBuyModal: (data) => {
			dispatch(createActions('updateBuyModal', data));
		},
		InitState: (ret) => { //初始化弹框规格数据
			dispatch(createActions('initState', {ret: ret}));
		},
		/*OrderInitParams: (data) => { //立即购买保存订单初始化接口参数
		 dispatch(createActions('orderInitParams', {orderInitParams: data}));
		 },*/
		UpdateCartInfo: (data) => { //更新购物车数据
			dispatch(createActions('updateCartInfo', data));
		},
		UpdataTimer: (T1, T2) => {  //计算返回当前页面的时间差，倒计时问题
			dispatch(createActions('UpdataTimer', {T1, T2}));
		}
	}
}
export default connect(ItemPageState, ItemPageDispatch)(ItemPage);

























