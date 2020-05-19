import React, {Component} from 'react';
import {browserHistory, Link} from 'react-router';
import AnimateLoad from 'component/modules/popup/loading/AnimateLoad';
import Popup from 'component/modal2';
import {UCENTER, SERCVICEURL} from 'config/index';
import {getCookie} from 'js/common/cookie';
import axios from 'axios';
import styles from "./common.scss";
import {miniProgramLogin, miniProgramMall, miniProgramShopCart, miniProgramMine} from 'js/util/miniProgramLogin';

//没有更多
export let NoMore = () => {
	const style = {
		height: "30px",
		lineHeight: "30px"
	};
	return <div className="no-more c-fs14 c-cc9 c-tc" style={style}>
		别拉了，我是有底线的~
	</div>
};


//加载中 圆圈
export const LoadingRound = AnimateLoad;


/*export const CommonShady = ({ zIndex, clickHandle })=>{
 zIndex = zIndex || 100;
 const styles={zIndex:zIndex, opacity:0.5, background:"#000", top:0, left:0, position:"fixed", width:"100%", height:"100%"};
 return(
 <div style={styles} onClick={ (e)=>{ clickHandle && clickHandle(); } } > </div>
 )
 };*/

//局部 加载中
export const LoadingImg = () => (
	<AnimateLoad style={{padding: 0}}/>
);


//没有更多订单
export const NoMoreOrder = () => {
	return (
		<div className="no-more-order c-tc" style={{paddingTop: "2.8rem", width: "100%"}}>
			<img src="/src/img/icon/order-menu-icon.png" width="100" height="80"/>
			<div className="c-fs14 c-cc9" style={{padding: "0.35rem 0"}}>暂无相关订单哦~</div>
		</div>
	)
};

//没有订单信息
export const NoMoreOrderInfo = () => {
	return (
		<div className="no-more-order c-tc" style={{paddingTop: "2.8rem", width: "100%"}}>
			<img src="/src/img/icon/order-menu-icon.png" width="100" height="80"/>
			<div className="c-fs14 c-cc9" style={{padding: "0.35rem 0"}}>暂无订单信息哦~</div>
		</div>
	)
};


//没有更多订单
export const AllNoMoreOrder = () => {
	return (
		<div className="no-more-order c-tc" style={{paddingTop: "2.8rem", width: "100%"}}>
			<img src="/src/img/icon/order-menu-icon.png" width="100" height="80"/>
			<div className="c-fs14 c-cc9" style={{padding: "0.35rem 0"}}>一个订单都还没有哦~</div>
			<a onClick={(e) => {
				e.preventDefault();
				miniProgramLogin()
			}} style={{
				background: "#e60a30",
				color: "#fff",
				padding: "0.2rem 1.1rem 0.2rem 1.1rem",
				fontSize: "0.4rem",
				borderRadius: '25px',
				display: 'inline-block'
			}}>去商城逛逛</a>
		</div>
	)
};

//没有更多页面
export const NoMorePage = ({text}) => {
	return (
		<div className="no-more-order c-tc" style={{paddingTop: "2.8rem", width: "100%"}}>
			<img src="/src/img/icon/order-menu-icon.png" width="100" height="80"/>
			<div className="c-fs14 c-cc9" style={{padding: "0.35rem 0"}}>{text}</div>
		</div>
	)
};

//没有搜索结果
export const SearchNone = () => {
	return (
		<div className="c-tc" style={{paddingTop: "80px"}}>
			<img src="/src/img/search/search-none.png" width="58" height="56"/>
			<p className="c-fs14 c-mt10">抱歉，暂无相关商品</p>
			<p className="c-cc9">换个关键词试试吧~</p>
		</div>
	)
};

//没有筛选结果
export const FilterNone = () => {
	return (
		<div className="c-tc" style={{paddingTop: "80px"}}>
			<img src="/src/img/search/search-none.png" width="58" height="56"/>
			<p className="c-fs14 c-mt10">没有相关商品</p>
		</div>
	)
};

//网络故障  
export const NetError = () => {
	return (
		<div className="c-tc" style={{paddingTop: "50px"}}>
			<img src="/src/img/search/net-error.png" width="78" height="104"/>
			<p className="c-cc9">网络异常，点击重试~</p>
			<p className="reload-container">
				<div className="reload-button" onClick={() => {
					window.location.reload()
				}}>重新加载
				</div>
			</p>
		</div>
	)
};

//半透明遮罩层
export const Shady = ({options, clickHandle}) => {
	let zIndex = (options && options.zIndex) || 100;
	let bgColor = (options && options.bgColor) || "#000";
	let opa = (options && options.opacity) || "0.5";
	const styles = {
		zIndex: zIndex,
		opacity: opa,
		background: bgColor,
		top: 0,
		left: 0,
		position: "fixed",
		width: "100%",
		height: "100%"
	};
	return (
		<div style={styles} onClick={ (e) => {
			clickHandle && clickHandle();
		} } onTouchMove={ (e) => {
			e.preventDefault();
		} }></div>
	)
};

//透明加载中遮罩层
export const TransShady = ({options, clickHandle}) => {
	let zIndex = (options && options.zIndex) || 105;
	const styles = {
		zIndex: zIndex,
		opacity: 0.5,
		background: "transparent",
		top: 0,
		left: 0,
		position: "fixed",
		width: "100%",
		height: "100%"
	};
	const imgStyles = {position: "absolute", top: "50%", marginTop: "-12px"};
	return (
		<div className="c-tc" style={styles} onTouchStart={ (e) => {
			clickHandle && clickHandle();
		} } onTouchMove={ (e) => {
			e.preventDefault();
		} }>
			<img src={ require('src/img/icon/loading/loading-round-red.gif')} width="24" height="24" style={imgStyles}/>
		</div>
	)
};

//页面为空
export const EmptyPage = ({config}) => {
	return (
		<div data-comp="empty-page">
			<div className="empty-bg" style={{
				background: `url(${config.bgImgUrl}) center top no-repeat transparent`,
				backgroundSize: "57px"
			}}>
				<p className="c-fs13 c-cc9">{config.msg}</p>
				{!config.noBtn ? <Link className="red-btn" onClick={(e) => {
					e.preventDefault();
					config.isH5 ? browserHistory.push(config.link) : miniProgramLogin(config.link);
				}}>{config.btnText}</Link> : null}
			</div>
		</div>
	)
};

export const EmptyPageLink = ({config}) => {
	return (
		<div data-comp="empty-page-link">
			<div className="empty-bg" style={{
				background: `url(${config.bgImgUrl}) center top no-repeat transparent`,
				backgroundSize: "125px 100px"
			}}>
				<p className="c-fs13 c-cc9">{config.msg}</p>
				{!config.noBtn ? <div className={ config.redBtn ? "red-btn" : "pink-btn"}
									  onClick={ config.btnClick }>{config.btnText}</div> : null}
			</div>
		</div>
	)
};

//搜索条
export class SearchBarA extends Component {
	constructor(props) {
		super(props);
		this.state = {
			innerValue: props.defaultValue
		};
	}

	changeHandle = (e) => {
		const value = e.target.value;
		if (this.props.value !== undefined) {
			this.props.onChange && this.props.onChange(value);
		} else {
			this.setState({
				innerValue: value
			});
		}
	};
	clearHandle = (e) => {
		if (this.props.value) {
			this.props.onChange && this.props.onChange("");
		} else {
			this.setState({
				innerValue: ""
			})
		}
	};
	getTerraceHost = () => {
		let terraceHost = "m";
		if (navigator.userAgent.indexOf('51gjj') > -1) {
			terraceHost = "51af-m";
		} else if (document.cookie.platform == 'mall') {
			terraceHost = "m";
		} else if (document.cookie.platform == 'finance') {
			terraceHost = "jr-m";
		} else if (!document.cookie.origin) {
			terraceHost = "wx";
		}
		return terraceHost;
	};
	getLinkByTerrace = (link) => {
		return (link && link.indexOf("tairanmallhost") > -1) ? link.replace('tairanmallhost', this.getTerraceHost()) : link;
	};

	isResultPage(param) {
		return param.shop || param.coupon_id;
	};

	componentDidMount() {
		const {isMount} = this.props;
		isMount && isMount.call(this);
	};

	render() {
		const {value, listStyle, placeHolder, param} = this.props,
			{innerValue} = this.state;
		return (
			<form data-comp="search-bar-a" className="g-row-flex" onSubmit={(e) => {
				e.preventDefault();
				this.refs.search.value.trim() ?
					this.props.onSearch(this.refs.search.value.trim(), null, param) :
					this.props.onSearch(((!this.isResultPage(param) && placeHolder) ? placeHolder.word : ""), this.getLinkByTerrace(placeHolder ? placeHolder.link : ""), param)
			}}>
				<label className="g-col-1 search-label" ref="label">
					<input ref="search" value={ value !== undefined ? value : innerValue } type="search"
						   placeholder={(param.shop || param.coupon_id) ? "在结果中搜索" : ((placeHolder && placeHolder.word) || "搜索：商品 分类 品牌 国家")}
						   onChange={this.changeHandle} onFocus={this.props.onFocus } className="search-input"/>
					{( value !== undefined ? value : innerValue ) !== "" &&
					<i ref="clear" onTouchTap={this.clearHandle } className="close-x-icon"> </i>}
					<i className="search-icon"> </i>
				</label>
				{this.props.changeType ? (<div className="change-container" onClick={this.props.changeType}><i
					className={listStyle == 1 ? "list-style1-icon" : "list-style2-icon"}> </i></div>) :
					<button type="submit" className="search-btn" id="searchBtn">搜索</button>}
			</form>
		)
	}
}

//分享
export class ShareAndTotop extends Component {
	componentDidMount() {
		let $window = $(window);
		let windowH = $window.height();
		let $toTop = $(".toTop");
		let time;
		$toTop.on("click", function () {
			let h = $window.scrollTop();
			time = setInterval(function () {
				h -= 10;
				$window.scrollTop(h);
				if (h <= 0) {
					clearInterval(time)
				}
			}, 1)

		})
		$window.scroll(function () {
			let $this = $(this);
			let scrollH = $this.scrollTop();
			if (scrollH > 35) {
				$toTop.show()
			} else {
				$toTop.hide()
			}
		})
	}

	render() {
		return (
			<div className="share-toTop" data-comp="share-label">
				<ul>
					<li className="toTop"></li>
				</ul>
			</div>
		)
	}
}

//返回顶部
export class Totop extends Component {
	constructor(props) {
		super(props);
		this.state = {
			click: true
		}
	}

	componentDidMount() {
		let $window = $(window), self = this;
		let windowH = $window.height();
		let $toTop = $(".toTop");
		let timer;
		$toTop.hide();
		$window.bind('scroll.scrollfn', function () {
			let $this = $(this);
			let scrollH = $this.scrollTop();
			if (scrollH > 300) {
				$toTop.show();
			} else {
				$toTop.hide();
			}
		})
	}

	componentWillUnmount() {
		$(window).unbind("scroll.scrollfn");
	}

	clearTime() {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null
		}
	}

	handleClick() {
		this.setState({click: false});
		let $toTop = $(".toTop");
		let h = $(window).scrollTop();
		$toTop.hide();
		this.clearTime();
		this.timer = setInterval(() => {
			h -= 20;
			$(window).scrollTop(h);
			if (h <= 0) {
				this.clearTime();
				this.setState({click: true});
			}
		}, 1);
	};

	render() {
		let {click} = this.state;
		return (
			<div className="share-toTop home" data-comp="share-label">
				<ul>
					<li className="toTop" onClick={() => {
						click ? (this.handleClick.bind(this))() : ""
					}}>
					</li>
				</ul>
			</div>
		)
	}
}


export class Scroll extends Component {

	static contentsProps = {
		classfix: "scroll-wrap",
		nowState: "INIT",
		scrollArea: window,
		domDown: {
			domInit: () => (<div className="dropload-load">初始化中</div>),
			domRefresh: () => (<div className="dropload-load">上拉加载更多</div>),
			domLoad: () => (<div className="dropload-load">加载中</div>),
			domNoData: () => (<div className="dropload-load">别拉了，我是有底线的~</div>)
		},
		getData: () => {
		}
	}

	createMapState() {
		let {domDown} = this._props;

		this.mapState = {
			"INIT": {dom: domDown.domInit, fn: this.getData},
			"REFRESH": {dom: domDown.domRefresh},
			"LOAD": {dom: domDown.domLoad, fn: this.getData},
			"NODATA": {dom: domDown.domNoData}
		}
	}

	stateInit() {
		this.changeState("INIT")
	}

	stateRefresh() {
		this.changeState("REFRESH")
	}

	stateLoad() {
		this.changeState("LOAD")
	}

	stateNodata() {
		this.changeState("NODATA")
	}

	unLocked(flag) {
		this._props.locked = !!flag;
	}

	clone(target, ...arg) {
		if (!arg.length) {
			return target
		}

		let src, keys, cObj, i = -1;

		while (src = arg[++i]) {
			keys = Object.keys(src);

			keys.forEach((key, i) => {
				if (typeof src[key] == "Object") {
					cObj = target[key] || src[key].length ? [] : {}
					this.clone(cObj, src[key]);
				} else {
					cObj = src[key]
				}

				target[key] = cObj
			})
		}

		return target
	}

	changeState(sState) {
		let state = this.mapState[sState];

		state.nowState = sState;
		this.setState(state);
		if (state.fn) {
			state.fn.call(this)
		}
	}

	getData() {
		this.unLocked(true);
		this.props.getData(this)
	}


	constructor(props) {
		super(props)
		this.state = {}
		this._props = this.clone({
			locked: false
		}, Scroll.contentsProps, props);

		this.createMapState()
	}

	componentWillReceiveProps(np) {
		if (np.nowState == "INIT") {
			this.stateInit()
		}
	}

	componentWillMount() {
		this.changeState(this._props.nowState);
	}

	componentDidMount() {
		this.unmout = this.onMount();
	}

	componentWillUnmount() {
		if (this.unmout)
			this.unmout();
	}

	onMount() {
		let {anchor} = this.refs;
		let self = this;

		self.mount = () => {
			if (self.state.nowState == "NODATA" || self._props.locked) {
				return
			} else if (window.innerHeight > anchor.offsetTop - window.scrollY) {
				self.changeState("LOAD")
			}
		}

		this._props.scrollArea.addEventListener('scroll', self.mount);

		return () => this._props.scrollArea.removeEventListener('scroll', self.mount)
	}


	render() {
		let {classfix} = this._props;
		return (
			<div className={classfix}>
				{this.props.children }
				<div ref="anchor" id="test">
					{this.state.dom()}
				</div>
			</div>
		)

	}

}

//客服
export class CustomerService extends Component {
	getServiceUrl = (queue, loginName, isLogin) => {
		return `${SERCVICEURL}?from=chat&queue=${queue}&loginName=${loginName}&password=&device=mobile&visit=${isLogin}`;
	};

	toCustomService = () => {
		//客服中心接待组队列号
		const serviceQueue = {1: 3101, 2: 3201};
		let {shopAttr} = this.props;
		shopAttr = shopAttr == 2 ? 2 : 1;
		//未登录用户跳转链接
		const visitorUrl = this.getServiceUrl(serviceQueue[shopAttr], sdk.getDeviceId(), 1);

		//初始化值为未登录状态
		const token = getCookie('token');
		if (token) {
			//判断用户是否登录,token是否有效
			axios.request({
				url: `${UCENTER}/user`,
				headers: {'Authorization': "Bearer " + token},
				params: {needPhone: true}
			}).then(({data}) => {
				if (data.code === "200") {
					//登录用户跳转链接
					location.href = this.getServiceUrl(serviceQueue[shopAttr], data.body.phone, 0);
				} else {
					location.href = visitorUrl;
				}
			}).catch(err => {
				console.log(err);
				location.href = visitorUrl;
			})
		} else {
			location.href = visitorUrl;
		}
	};

	render() {
		return (
			<a className={this.props.className} onClick={this.toCustomService}>
				{this.props.children }
			</a>
		)
	}
}

//微信分享链接
export const ShareConfig = (shareInfo) => {
	let shareConfig = {
		title: shareInfo.title, // 分享标题
		desc: shareInfo.desc, // 分享描述
		link: shareInfo.link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
		imgUrl: shareInfo.imgUrl, // 分享图标
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
};

export const getJSApi = (targetUrl) => {
	axios.request({
		url: `/wxapi/getJSApi?url=${encodeURIComponent(targetUrl)}`
	}).then(({data}) => {
		wx.config({
			debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
			appId: data.appId, // 必填，公众号的唯一标识
			timestamp: data.timestamp, // 必填，生成签名的时间戳
			nonceStr: data.nonceStr, // 必填，生成签名的随机串
			signature: data.signature,// 必填，签名，见附录1
			jsApiList: ["onMenuShareTimeline", "onMenuShareAppMessage", "onMenuShareQQ", "onMenuShareWeibo", "onMenuShareQZone"] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
		});
		wx.error((res) => {
			console.log('wx.error', JSON.stringify(res))
		});
	}).catch(error => {
		console.log(error);
		Popup.MsgTip({msg: error.response.data.message || '服务器繁忙'});
	});
	/*    $.ajax({
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
	 wx.error(function (res) {
	 console.log(JSON.stringify(res));
	 });
	 },
	 error: function () {
	 Popup.MsgTip({ msg: "绑定域名不正确！" });
	 }
	 });*/
};

//放大缩小方法
export const scaleImg = (event, largeSwiper) => {
	let timer = null;//定时器
	let newTime = 0, oldTime = 0, enlarge = false;
	let relativeX = 0, relativeY = 0, x1 = 0, x2 = 0;
	let startX = 0, endX = 0, wid = 0, hei = 0, lef = 0, to = 0;
	//点击、放大、拖拽、双指事件

	event.preventDefault();
	//	记录触摸开始位置
	x1 = event.touches[0].pageX;
	if (event.touches.length == 2) {
		x2 = event.touches[1].pageX;
		startX = Math.abs(x1 - x2);
		wid = $(event.target).width();
		hei = $(event.target).height();
		lef = $(event.target).offset().left;
		to = $(event.target).offset().top - $(window).scrollTop();
	}
	relativeX = x1 - $(event.target).offset().left;//获取手指在容器中的位置
	relativeY = event.touches[0].pageY - ($(event.target).offset().top - $(window).scrollTop());
	clearTimeout(timer);
	oldTime = newTime;
	newTime = new Date().getTime();
	let ele = $(event.target), eleID = ele.attr('id');
	//单击、双击事件
	timer = setTimeout(function () {
		if (newTime - oldTime > 300) {//单击
			ele.css({width: '100%'});
			ele.parent().parent().parent().parent().css({display: 'none'});
			// largeSwiper.unlockSwipeToNext();
			// largeSwiper.unlockSwipeToPrev();
			enlarge = false;
		} else {//双击
			if (enlarge === false) {
				ele.css({width: '200%', left: -relativeX + 'px', top: 0, margin: 0});
				// largeSwiper.lockSwipeToNext();//放大时禁止swiper
				// largeSwiper.lockSwipeToPrev();
				enlarge = true;
			} else {
				ele.css({width: '100%', top: 0, left: 0, right: 0, bottom: 0, margin: 'auto'});
				// largeSwiper.unlockSwipeToNext();
				// largeSwiper.unlockSwipeToPrev();
				enlarge = false;
			}
		}
	}, 300);
	//放大事件
	let moveBox = document.getElementById(eleID);
	let handler = function (event) {
		event.preventDefault();
		if (event.targetTouches.length == 1) {
			let touch = event.targetTouches[0];
			if (enlarge) {
				ele.css({margin: 0});
				moveBox.style.left = touch.pageX - relativeX + 'px';
				moveBox.style.top = touch.pageY - relativeY + 'px';
			}
			if (Math.abs(touch.pageX - x1) > 2) {
				clearTimeout(timer);
			}
		} else if (event.targetTouches.length == 2) {
			clearTimeout(timer);
			let touch1 = event.targetTouches[0],
				touch2 = event.targetTouches[1];
			endX = Math.abs(touch1.pageX - touch2.pageX);
			let newWidth = wid + (endX - startX), winWidth = $(window).width();
			newWidth = newWidth > winWidth * 2 ? winWidth * 2 : newWidth;
			newWidth = newWidth < winWidth ? winWidth : newWidth;
			if (newWidth > winWidth) {
				ele.css({margin: 0});
				enlarge = true;
				// largeSwiper.lockSwipeToNext();
				// largeSwiper.lockSwipeToPrev();
			} else {
				enlarge = false;
				// largeSwiper.unlockSwipeToNext();
				// largeSwiper.unlockSwipeToPrev();
			}
			ele.css({
				width: newWidth + 'px',
				left: lef - (endX - startX) / 2,
				top: to - (endX - startX) / 2
			});
		}
	};
	moveBox.addEventListener('touchmove', handler, false);
	$(moveBox).on('touchend', function (event) {//手指离开时移除监听
		moveBox.removeEventListener('touchmove', handler, false);
		if (ele.width() == $(window).width()) {
			ele.css({width: '100%', top: 0, left: 0, right: 0, bottom: 0, margin: 'auto'});
		}
	});
};

//快速导航
export class FastGuide extends Component {
	constructor(props) {
		super(props);
		this.state = {
			show: true
		}
	}

	handleButton = () => {
		this.setState({show: !this.state.show})
	};

	render() {
		let {show} = this.state;
		let {orderPage, hideShopCart, showUseInfo, top, shouldPayRedirect = true} = this.props;
		let style;
		if (orderPage) {
			style = show ? {top: "459px"} : {top: "337px"}
		} else {
			style = show ? {top: "459px"} : {top: "283px"}
		}
		if(top && show) {
      style.top = `${top}px`
		}
		return (<div data-comp="fast-guide">
			<div className="fast-guide" style={style}>
				{show ? <img className="guide" src="/src/img/icon/common/trc_guid.png" onClick={this.handleButton}/> :
					<div className="guide-wraper">
						{!orderPage && <div>
							我的订单
							<img src="/src/img/icon/common/trc_order.png" onClick={() => {
								browserHistory.push('/tradeList/0')
							}
							}/>
						</div>}
						{
							hideShopCart ? '':
              <div>
                购物袋
                <img src="/src/img/icon/common/trc_shop_cart.png" onClick={() => {
                  miniProgramShopCart(shouldPayRedirect)
                }}/>
              </div>
						}

						{
              showUseInfo ?
								<div>
                我的
                <img src="/src/img/icon/common/trc_order.png" onClick={() => {
                  miniProgramMine(shouldPayRedirect)
                }}/> </div>: ''
						}

						<div>
							首页
							<img src="/src/img/icon/common/trc_home.png" onClick={() => {
								miniProgramMall()
							}}/>
						</div>
						<div className="close">
							<img src="/src/img/icon/common/trc_close.png" onClick={this.handleButton}/>
						</div>
					</div>}
			</div>
			{!show && <Shady />}
		</div>)
	}
	;
}