import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';
import {Link} from 'react-router';
import {LoadingRound} from 'component/common';
import {PopupTip} from 'component/modal';

import './5year.scss';

export default class FiveYears extends Component {
	constructor(props) {
		super(props);
		this.state = {
			update: false,
			showStatus: false,
			errorNetwork: false,
			acTime: false,
			isLogin: false,
			later: false,
			alHave: false,
			unStart: false,
			none: false
		};
		this.showMsg = "";
	}

	componentWillMount() {
		document.title = "泰然5周年";
		//	判断是否登录，登录直接领取优惠券，未登录则去登陆
		this.getCoupon();
	}

	getCoupon = () => {
		let self = this;
		$.ajax({
			url: "/wxapi/activityEnable.api",
			type: "GET",
			dataType: "json",
			success: function (data) {
				self.setState({update: true});
				if (data.status === false && data.code !== 200) {
					switch (data.code) {
						case 400:
							return self.setState({isLogin: false});
						case 401:
							return self.setState({isLogin: true, errorNetwork: true,});
						case 402:
							return self.setState({isLogin: true, unStart: true, acTime: true});
						case 403:
							return self.setState({isLogin: true, unStart: false, acTime: true});
						case 404:
							return self.setState({isLogin: true, none: true, later: true});
						case 405:
							return self.setState({isLogin: true, alHave: true, later: false});
						default:
							return
					}
				} else {
					self.setState({isLogin: true, alHave: false, later: false, none: false})
				}
			},
			error: function () {
				self.setState({update: true, errorNetwork: true})
			}
		})
	};

	componentDidMount() {
		let targetUrl = location.href.split("#")[0];
		let self = this;
		self.getJSApi(targetUrl);
		let shareConfig = {
			title: "泰然5周年 暨泰然城品牌签约活动  百万礼包送不", // 分享标题
			desc: "感恩有你 一路同行  内部专享优惠礼券！", // 分享描述
			link: location.protocol + "//" + location.host + "/5yearsQrcode", // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
			imgUrl: location.protocol + "//" + location.host + "/src/img/qrCode/logo.png", // 分享图标
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

	getJSApi = (targetUrl) => {
		let self = this;
		$.ajax({
			url: '/wxapi/getJSApi.api?url=' + encodeURIComponent(targetUrl),
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
					console.log(JSON.stringify(res));
				});
			},
			error: function (msg) {
				self.showMsg = "绑定域名不正确！";
				self.setState({showStatus: true});
			}
		});
	};

	render() {
		let {errorNetwork, update, showStatus, isLogin, acTime, later, unStart, none, alHave} = this.state;
		return (
			<div data-page="five-years">
				{errorNetwork ? <section className="fy five-years4" style={{height: $(window).height()}}></section> : (update ?
					<section
						className={errorNetwork ? "fy five-years4" : (isLogin ?
							(acTime ? "fy five-years6" : (later ? "fy five-years1" : (alHave ? "fy five-years2" : (none ? "fy five-years1" : "fy five-years3") ))) : "fy five-years0")}
						ref="five-years"
						style={{height: $(window).height()}}>
						<a className="user-name"
							 href={ errorNetwork ? null : (isLogin ? (acTime ? "https://wx.tairanmall.com/home/index" : (later ? "https://wx.tairanmall.com/home/index" : "https://m.tairanmall.com/guide?redirect=trmall://main?page=home")) : "/login?redirect_uri=%2F5years")}>
							<span className="button1"></span>
						</a>
					</section>
					: <LoadingRound />)}
				<PopupTip active={showStatus} onClose={() => {
					this.setState({showStatus: false})
				}} msg={this.showMsg}/>
			</div>
		)
	}
}