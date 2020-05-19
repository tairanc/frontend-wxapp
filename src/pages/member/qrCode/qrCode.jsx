import React, {Component} from 'react';
// import {LoadingRound} from 'component/common';
import AnimateLoad from 'component/modules/popup/loading/AnimateLoad';
import {PopupTip} from 'component/modal';
import Popup from 'component/modal2';


import './qrCode.scss'
export default class QrCode extends Component {
	constructor(props) {
		super(props);
		this.state = {
			update: false,
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
                    console.log(JSON.stringify(res))
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
		$.ajax({
			url: '/account/user/profile',
			type: 'GET',
			success: function (data) {
				self.setState({data: data});
				self.paramQRCode(data);
				let name = data.nickName;
				let shareConfig = {
					title: name + "给您送大礼了", // 分享标题
					desc: "关注泰然城，关注品质好生活!", // 分享描述
					link: location.protocol + "//" + location.host + "/userQrCodeShare", // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
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
			},
			error: function (data) {
				data = JSON.parse(data.response);
				Popup.MsgTip({msg: data.error.description});
				/*self.showMsg = data.error.description;
				 self.setState({showStatus: true});*/
			}
		});
	}

	hideModal = () => {
		this.setState({showStatus: false})
	};

	//参数二维码
	paramQRCode = (param) => {
		let self = this;
		$.ajax({
			url: '/wxapi/getAccessToken.api',
			type: 'GET',
			success: function (data) {
				let accessToken = data;
				$.ajax({
					url: ' /wx/cgi-bin/qrcode/create?access_token=' + accessToken,
					type: 'POST',
					data: JSON.stringify({
						"expire_seconds": 2592000,
						"action_name": "QR_SCENE",
						"action_info": {"scene": {"scene_id": "5555555"}}
					}),
					success: function (data) {
						self.setState({update: true});
						self.generateQRCode("canvas", 160, 160, data.url, param.avatar);
						let margin = ($("#qrcode").height() - $("#codeico").height()) / 2;
						$("#codeico").css("margin", margin);
					},
					error: function (data) {
						//
					}
				});
			},
			error: function (data) {
				self.showMsg = data.errmsg;
				self.setState({showStatus: true});
			}
		});
	};

	generateQRCode = (rendermethod, picwidth, picheight, url, url_img) => {
		console.log(url_img);
		let qrcode = $("#qrCode").qrcode({
			render: rendermethod, // 渲染方式有table方式（IE兼容）和canvas方式
			width: picwidth, //宽度
			height: picheight, //高度
			text: url, //内容
			typeNumber: -1,//计算模式
			correctLevel: 2,//二维码纠错级别
			background: "#ffffff",//背景颜色
			foreground: "#000000",  //二维码颜色,
		}).hide();
		let canvas = qrcode.find('canvas').get(0);
		$('#imgOne').attr('src', canvas.toDataURL('image/jpg'));
		this.getQCImg();
	};

	//合成带logo的二维码图片
	getQCImg = () => {
		let canvas = document.getElementById("canvas");
		let img1 = new Image();
		let img2 = new Image();
		img1.crossOrigin = "*";
		img2.crossOrigin = "*";
		img1.src = $("#imgOne")[0].src;
		img2.src = $(".imgCode")[0].src;
		img2.className = $(".imgCode")[0].className;
		let img1P = new Promise(function (resolve, reject) {
			img1.onload = function () {
				resolve(img1);
			}
		});
		let img2P = new Promise(function (resolve, reject) {
			img2.onload = function () {
				resolve(img2);
			}
		});

		Promise.all([img1P, img2P]).then(function (resolve, reject) {
			canvas.getContext("2d").drawImage(img1, 0, 0, 160, 160);
			canvas.getContext("2d").drawImage(img2, 63, 60, 32, 32);
			$('#imgRet').attr('src', canvas.toDataURL('image/jpg'))
		});

		/*img2.onload = function () {
			canvas.getContext("2d").drawImage(img1, 0, 0, 160, 160);
			canvas.getContext("2d").drawImage(img2, 63, 60, 32, 32);
			$('#imgRet').attr('src', canvas.toDataURL('image/jpg'))
		};*/
	};

	render() {
		let style = {minHeight: $(window).height()};
		let {update, showStatus, data} = this.state;
		let phone = "", nickName;
		if (update) {
			let phone1 = data.phone.substr(0, 3);
			let phone2 = data.phone.substr(9, 11);
			let name = data.nickName.split(""), retName1 = [], retName2 = [];
			phone = phone1.concat("******").concat(phone2);
			if (name.length > 5) {
				for (let i = 0; i < name.length; i++) {
					if (i === 0 || i === 1) {
						retName1.push(name[i]);
					} else if (i === name.length - 1 || i === name.length - 2) {
						retName2.push(name[i]);
					}
				}
				nickName = retName1.join("") + "**" + retName2.join("");
			} else {
				nickName = data.nickName;
			}
		}
		return (
			update ?
				<div data-page="user-code">
					<section className="wrapper" style={style}>
						<p className="title"><span>{nickName}</span>邀请你加入泰然城~</p>
						<div className="c-tc c-c35 code">
							<canvas id="canvas" style={{display: "none"}}></canvas>
							<div className="img-qr">
								<img id="imgRet"/>
							</div>
							<div style={{position: "relative", display: "none"}}>
								<img id="imgOne"/>
								<img src={data.avatar} className="imgCode"/>
							</div>
							<div id="qrCode">
								<div id="codeico"></div>
							</div>
							<p className="c-fs13 c-c666 tip">扫一扫我的二维码，立马加入</p>
							<p className="c-fs13 c-c666">{phone}</p>
						</div>
					</section>
					<PopupTip active={showStatus} onClose={this.hideModal} msg={this.showMsg}/>
				</div> : <AnimateLoad />
		)
	}
}