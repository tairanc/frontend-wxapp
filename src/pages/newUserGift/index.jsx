import React, { Component } from 'react';
import ReactDOM,{ render } from 'react-dom';
import { Link } from 'react-router';
import { LoadingRound } from 'component/common';
import {browserHistory} from 'react-router';
import Popup from 'component/modal2';
import { DIR } from 'config/index';
import {miniProgramLogin} from 'js/util/miniProgramLogin';
import './newUserGift.scss';

//礼包正在打包中，请您耐心等待！
export default class NewUserGift extends Component{
	componentWillMount(){
		this.setState({
			showRule: false,
			update: false,
			data: ''
		});
		document.title = '新人专享大礼包';
		let targetUrl = location.href.split("#")[0];
		this.getJSApi(targetUrl);
		let self = this;
		$.ajax({
			url: `/wxapi/getFreshGift.api?t=${+(new Date())}`,
			type: 'get',
			success: function(data){
				if(!data.data.deploy.banner){
					browserHistory.push(`${DIR}/`);
					return;
				}
				if(data.status === true){
					self.setState({
						update: true,
						data: data.data
					});
				}
                $("[data-page='new-gift']").css({ minHeight: $(window).height() });
				//微信分享
		  		let shareConfig = {
					title: '你的好友邀请你领取泰然城1000元新人专享礼', // 分享标题
					desc: '泰然城·一站式品质生活综合服务平台，百万用户的安心选择！', // 分享描述
					link: location.protocol + '//' + location.host + '/newUserGift', // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
					imgUrl: location.protocol + '//' + location.host + '/src/img/newUserGift/share.png', // 分享图标
					type: '', // 分享类型,music、video或link，不填默认为link
					dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
					success: function () {
						// 用户确认分享后执行的回调函数
						//Popup.MsgTip({msg: '分享成功'});
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
			error: function(err){
				Popup.MsgTip({msg: err.msg?err.msg:'服务器繁忙'});
			}
		})
	};
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
				wx.error(function(res){
					console.log(JSON.stringify(res))
				});
			},
			error: function (msg) {
				self.showMsg = "绑定域名不正确！";
				self.setState({showStatus: true});
			}
		});
	};
	changeShow=()=>{
		this.setState({
			showRule: !this.state.showRule
		})
	}
	render(){
		let {showRule,update,data} = this.state;
	    return(
	    	update?
	        <section data-page="new-gift" >
		        <div id="new-gift">
					<div className="banner">
						<a href={data.deploy.wx_head_link?data.deploy.wx_head_link:'javascript:void(0);'}>
							<img src={data.deploy.head_image?data.deploy.head_image:'./src/img/newUserGift/banner.png'} />
						</a>
						{data.deploy.fresh_rule?
							<button onClick={this.changeShow}>活动规则</button>:''
						}
					</div>
					<ShoppingGift image={data.deploy.promotion_image} data={data} />
					<Banner data={data.deploy.banner} />
					{showRule?<Rule fn={this.changeShow} data={data.deploy.fresh_rule} />:''}
				</div>
			</section>
			:<LoadingRound />
	    )
	}
}

//活动规则
class Rule extends Component{
	render(){
		return(
			<div className="rule-box">
				<div className="rule">
					<h2 className="c-fs18 c-tc">活 动 规 则</h2>
					<p className="c-fs10">
						{/*1.2017年5月30日起，泰然城新注册用户可在活动页面领取新人专享礼包（888元+1000T币）；<br />
						2.新人专享礼包包含泰然金融588元返现礼包+1000T币和电商300元组合优惠券礼包两部分；<br />
						3.泰然金融新手福利具体可“金融—新人福利”中查看；<br />
						4.电商300元组合优惠券请在领取后7日内使用，其中包含：10元无门槛1张、满199元减20元2张、满499元减50元1张、满999元减100元2张；<br />
						5.新人专享礼包仅限在泰然城APP领取，电商优惠券在“我的——优惠券”中查看；<br />
						6.单个用户限领1次新人礼包（单个用户指：同一手机号、同一身份证、同一设备、同一IP地址、同一收货人等满足任意条件或其他可视为同一用户的情形），活动过程中凡以恶意手段（作弊、虚假交易、攻击系统、恶意套现等）参与该活动的用户，泰然城有权终止其参与活动并取消其领券资格；<br />
						7.如有疑问请联系在线客服或者拨打400-669-6610。*/}
						{this.props.data}
					</p>
					<button className="btn c-fs18" onClick={this.props.fn}>知道了</button>
					<div className="line"><div className="close" onClick={this.props.fn}></div></div>
				</div>
			</div>
		)
	}
}

//购物礼包
class ShoppingGift extends Component{
	constructor(props) {
	    super(props);
	    this.state = {
	      sending: false
	    }
	};
	static contextTypes ={
		store:React.PropTypes.object,
		isLogin:React.PropTypes.bool
	};
	getCoupon=()=>{
		let {data} = this.props;
		if(!data.isLogin){
			miniProgramLogin(location.href);
			// browserHistory.push(`${DIR}/login?redirect_uri=%2FnewUserGift`);
			return;
		}
		if(!data.coupon.length){
			browserHistory.push(`${DIR}/`);
			return;
		}
		if(!this.state.sending){
			this.setState({
				sending: true
			});
			let self = this;
			$.ajax({
				url: '/wxapi/drawFreshGift.api',
				type: 'POST',
				success: function(data){
					Popup.MsgTip({msg: data.msg});
					self.setState({
						sending: false
					});
				},
				error: function(err){
					Popup.MsgTip({msg: '服务器繁忙'});
					self.setState({
						sending: false
					});
				}
			});
		}
	}
	render(){
		let {data,image} = this.props;
		let coupons = data.coupon.map(function (item,i) {
			return <Coupon key={i} data={item} image={image} />
		})
		return(
			<div className="shopping">
				<div className="title c-pr">
					{data.coupon.length?<p>新人优惠券礼包等你来领！</p>:''}
				</div>
				<div className="coupon-box c-mb20">
					{data.coupon.length?
					<ul className="coupon">
						{coupons}
					</ul>
					:<img style={{width:'60%'}} src="./src/img/newUserGift/no-coupon.png" />}
				</div>
				<div className="get-coupon">
					<div className={'btn '+(data.isNew?'':'btn2')}>
						<button className="c-fs20 c-cfff" onClick={this.getCoupon}>{data.coupon.length?'一键领取':'先随便逛逛'}</button>
					</div>
				</div>
			</div>
		)
	}
}

//优惠券
class Coupon extends Component{
	render(){
		let {data,image} = this.props;
		let styles = image?{
			backgroundImage: 'url('+image+')'
		}:{};
		return(
			<li className="each-coupon c-tc c-pr" style={styles}>
				<p className="c-fs13" style={{color:'#dc4316'}}>¥ <span className="c-fs35 c-fb">{data.deduct_money}</span></p>
				<p className="c-fs10 c-c666 require">指定商品{data.limit_money?('满'+data.limit_money+'元可用'):'无门槛'}</p>
			</li>
		)
	}
}

//底部banner
class Banner extends Component{
	componentDidMount(){
		let {data} = this.props;
		if(data.length>1){
			let mySwiper = new Swiper('.swiper-container',{
		    	autoplay: 2000,
				autoplayDisableOnInteraction: false,
				loop: true,
			});
		}
	};
	render(){
		let {data} = this.props;
		let banners = data.map(function (item,i) {
			return <li key={i} className='swiper-slide'>
				<a href={item.wx_banner_link?item.wx_banner_link:'javascript:void(0);'}>
					<img src={item.banner_image} />
				</a>
			</li>
		})
		return(
			<div className="banner" data-plugin="swiper">
				<div className="swiper-container" style={{width:'100%'}}>
					<ul className="swiper-wrapper">
						{banners}
					</ul>
				</div>
			</div>
		)
	}
}