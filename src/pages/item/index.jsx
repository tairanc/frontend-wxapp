import React, {Component} from 'react';
import './itemDetail/item.scss';
import {FilterTrade, FilterTradeType, createMSG, createAction} from 'filters/index'
import {LoadingRound, EmptyPage, ShareAndTotop} from 'component/common';
import {browserHistory} from 'react-router';
import {DIR} from 'config/index';


import GroupBuy from "./itemDetail/groupBuy"
import Detail from "./itemDetail/detail.jsx"
import Seckill from "./itemDetail/seckill.jsx"

let Action = createAction({
	Promotion: {
		url: '/wxapi/promotion.api',
		type: "get"
	},
	Item: {
		url: "/wxapi/item.api",
		type: "get"
	},
	Spec: {
		url: "/wxapi/spec.api",
		type: "get"
	},
	getCart: {
		url: "/wxapi/getCartCount.api",
		type: "get"
	},
});


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

export default class ItemPage extends Component {

	constructor(props) {
		super(props);

		let {item_id} = props.location.query;

		this.state = {
			itemId: item_id,
			update: false,
			status: false
		}
	}

	static contextTypes = {
		isApp: React.PropTypes.bool
	};

	componentWillMount() {
		document.title = '泰然城';

		if (!this.state.itemId) {
			browserHistory.push(`${DIR}/`);
		}
		let self = this;
		let targetUrl = location.href.split("#")[0];

		function pajax(option) {
			let promise = new Promise((resolve) => {
				option.success = (res) => {
					resolve(res);
				};
				$.ajax(option)
			});
			return promise
		}

		Promise.all([
			pajax(Action("Item", {
				data: {
					"item_id": this.state.itemId
				}
			})),
			pajax(Action("Promotion", {
				data: {
					"item_id": this.state.itemId
				}
			})),
			pajax(Action("Spec", {
				data: {
					"item_id": this.state.itemId
				}
			})),
			pajax(Action("getCart"))
		]).then((res) => {
			self.state.update = true;
			if (res[0].status && res[3].status) {
				self.state.data = res[0].data;
				self.state.cartInfo = res[3].data;
				self.state.status = true;
				//	微信分享
				self.getJSApi(targetUrl);
				let {itemId} = this.state;
				let shareConfig = {
					title: res[0].data.item.title, // 分享标题
					desc: "我在泰然城发现了一个不错的商品，赶紧来看看吧！", // 分享描述
					link: location.protocol + "//" + location.host + "/item?item_id=" + itemId, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
					imgUrl: res[0].data.item.images[0], // 分享图标
					type: '', // 分享类型,music、video或link，不填默认为link
					dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
					success: function () {
						// 用户确认分享后执行的回调函数
					},
					cancel: function () {
						// 用户取消分享后执行的回调函数
					}
				};
				wx.ready(function () {
					wx.onMenuShareTimeline(shareConfig);
					wx.onMenuShareAppMessage(shareConfig);
					wx.onMenuShareQQ(shareConfig);
					wx.onMenuShareQZone(shareConfig);
				});
			}
			self.state.promotion = res[1];
			self.state.itemRules = res[1].itemRules || {};
			self.state.specs = res[2];
			self.setState(self.state);
		});
	}

	componentDidMount() {
		let self = this;
		let channel = getURLParameter('channel');
		if (channel) addChannel($('body'));
	}

	getCart() {
		let self=this;
		$.ajax({
			url: "/wxapi/getCartCount.api",
			type: "GET",
			success: function (data) {
				if (data.status) {
					self.setState({cartInfo: data.data})
				}
			}
		})
	}

	selectModel() {
		let {data} = this.state;
		let ret;
		switch (data.item_type) {
			case "groupbuy":
				ret = <GroupBuy {...this.state} {...this.props} />
				break;
			case "seckill":
				ret = <Seckill {...this.state} {...this.props} />;
				break;
			default:
				ret = <Detail {...this.state} {...this.props} getCart={this.getCart.bind(this)}/>
		}

		return ret
	}

	getJSApi = (targetUrl) => {
		let self = this;
		$.ajax({
			url: '/wxapi/getJSApi?url=' + encodeURIComponent(targetUrl),
			type: 'GET',
			dataType: 'json',
			contentType: 'application/json;chartset=utf-8',
			success: function (data) {
				wx.config({
					debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
					appId: data.appId, // 必填，公众号的唯一标识
					timestamp: data.timestamp, // 必填，生成签名的时间戳
					nonceStr: data.nonceStr, // 必填，生成签名的随机串
					signature: data.signature,// 必填，签名，见附录1
					jsApiList: ["onMenuShareTimeline", "onMenuShareAppMessage", "onMenuShareQQ", "onMenuShareWeibo", "onMenuShareQZone"] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
				});
				self.setState({config: true});
				wx.error(function (res) {
					console.log(JSON.stringify(res))
				});
			},
			error: function (msg) {
				self.showMsg = "绑定域名不正确！";
				self.setState({showStatus: true});
			}
		});
	};

	render() {
		return (
			this.state.update ?
				this.state.status ?
					this.selectModel()
					: <EmptyPage config={{
					bgImgUrl: "/src/img/shopCart/item-noexist-icon.png",
					msg: "商品过期不存在",
					noBtn: true
				}}/>
				: <LoadingRound />
		)
	}
}

