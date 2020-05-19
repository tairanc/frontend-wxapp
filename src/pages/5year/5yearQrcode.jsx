import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';
import {Link} from 'react-router';
import {LoadingRound} from 'component/common';

import './5year.scss';

export default class FiveYears extends Component {
	constructor(props) {
		super(props);
		this.state = {
			showStatus: false
		};
		this.showMsg = "";
	}

	componentWillMount() {
		document.title = "泰然5周年";
	}

	componentDidMount() {
		let targetUrl = location.href.split("#")[0];
		let self = this;
		self.getJSApi(targetUrl);
		let shareConfig = {
			title: "泰然5周年 暨泰然城品牌签约活动  百万礼包送不", // 分享标题
			desc: "感恩有你 一路同行  内部专享优惠礼券！", // 分享描述
			link: location.protocol + "//" + location.host + "/5yearsQrcode", // 分享链接，  该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
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

			}
		});
	};

	render() {
		return (
			<div data-page="five-yearsQrcode">
				<section id="qrcode" ref="five-years">
					<img src="/src/img/5year/fy_qrcode.jpg" style={{width: "100%", height: $(window).height()}}/>
				</section>
			</div>
		)
	}
}
