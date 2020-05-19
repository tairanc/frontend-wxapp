import React, {Component} from 'react';
import {LoadingRound} from 'component/common';
import {PopupTip} from 'component/modal';
import Popup from 'component/modal2';


import './qrCode.scss'
export default class QrCodeShare extends Component {
	constructor(props) {
		super(props);
		this.state = {
			update: true,
			showStatus: false
		};
		this.showMsg = "";
	}

	componentWillMount() {
		document.title = "邀请好友";
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
					console.log(JSON.stringify(res));
				});
			},
			error: function (msg) {
				self.showMsg = "绑定域名不正确！";
				self.setState({showStatus: true});
			}
		});
	};

	componentDidMount() {
		let targetUrl = location.href.split("#")[0];
		let self = this;
		self.getJSApi(targetUrl);
		let shareConfig = {
			title: "邀请您关注二维码", // 分享标题
			desc: "你的好友" + name + "，喊你来逛泰然城!", // 分享描述
			link: location.protocol + "//" + location.host + "/userQrCode", // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
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

	hideModal = () => {
		this.setState({showStatus: false})
	};

	render() {
		let style = {minHeight: $(window).height()};
		let {update, showStatus} = this.state;
		return (
			update ?
				<div data-page="user-code">
					<section className="wrapper" style={style}>
						<p className="user-title">欢迎加入泰然城~</p>
						<div className="c-tc c-c35 code">
							<img src="/src/img/qrCode/qrcode_for.png" className="imgbg"
									 style={{width: "160px", marginBottom: "20px"}}/>
							<p className="c-fs13 c-c666 tip">扫一扫我的二维码，立马加入</p>
						</div>
					</section>
					<PopupTip active={showStatus} onClose={this.hideModal} msg={this.showMsg}/>
				</div> : <LoadingRound />
		)
	}
}