import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import Immutable from 'immutable';
import {Link} from 'react-router';
import {
	FilterTradeType,
	createAction,
	PurchaseLimit,
	TradeFade
} from 'filters/index'
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import {loadMask} from 'component/modules/popup/mask/mask';
import {CustomerService} from 'component/common';
import {tip} from 'component/modules/popup/tip/tip';
import {browserHistory} from 'react-router';
import {ItemFix} from 'component/modal';
import {NewModal} from 'component/modules/modal/modal';
import {ChooseAddress} from '../member/goodsReceiveInfo/addressManage'
import {PureComponent} from 'component/modules/HOC/PureComponent';
import axios from 'js/util/axios';
import {WXAPI} from 'config/index';
import {BarrageStrip, homePageDispatch, homePageState} from "../home/index"
import {dateUtil, timeCtrl, judgeIphoneX, addImageSuffix, getQueryString} from "src/js/util/index"
import {miniProgramLogin, miniProgramShopCart,miniProgramMall} from 'js/util/miniProgramLogin';
import {setExtraInfoGwc, setExtraInfoScj,setExtraInfoTjdj} from 'js/util/dcpExtraInfo';

import './item.scss';

const axiosCreator = actionAxios('itemIndex');
const createActions = concatPageAndType('itemIndex');

let bannerSwiper, largeSwiper;
const stateLogin = (state) => ({
	...state.global
});
export let pageApi = {
	toCart: {url: `${WXAPI}/cart/add`, method: "post"},  //加入购物车
	DelFav: {url: `${WXAPI}/user/removeItemCollection`, method: "get"},  //取消收藏
	Fav: {url: `${WXAPI}/user/saveItemCollection`, method: "post"}, //收藏
	GetCoupon: {url: `${WXAPI}/promotion/obtainCoupon`, method: "post"},//领取优惠券
	Coupon: {url: `${WXAPI}/item/coupon`, method: "get"}, //获取可领取的优惠券接口
	CheckGroupBuy: {url: `${WXAPI}/promotion/checkGroupBuy`, method: "post"} //拼团校验
};


export let PromotionInfo = {
	// 直降
	DirectReduction: {
		getValue(props) {
			let {itemdata, deductPrice} = props;
			let price = itemdata.deduct_price;
			return (
				<span>直降{parseFloat(deductPrice || price)}元 </span>
			)
		},
		getTagName: "直降"
	},
	//秒杀
	SecKill: {
		getValue(props) {
			return (<span>限时秒杀,每个ID限购{props.itemdata.rules.user_buy_limit}件</span>)
		},
		getTagName: "秒杀"
	},
	//特卖
	FlashSale: {
		//link: "http://m.tairanmall.com/guide?redirect=" + encodeURIComponent("http://m.tairanmall.com/flashsale"),
		getValue(props) {
			return (<span>限时特卖正在火热抢购中...</span>)
		},
		getTagName: "特卖"
	},
	//满减
	FullMinus: {
		link(itemData) {
			return `/searchResult?promotion_id=${itemData.id}&shop=${itemData.shop_id}`
		},
		getValue(props) {
			let {itemdata} = props;
			let item = itemdata.rules.rule.map((val, i) => `满${val.limit_money}减${val.deduct_money}` + (i !== itemdata.rules.rule.length - 1 ? ";" : ""));
			if (itemdata.rules.no_capped) {
				item.push(";上不封顶")
			}
			return (
				<ul className="full-cut-list c-fl">
					<li className="minus-full-activity">
						{item.join('')}
					</li>
				</ul>
			)
		},
		name: "fullminus",
		getTagName: "满减"
	},
	// 满折
	FullDiscount: {
		link(itemData) {
			return `/searchResult?promotion_id=${itemData.id}&shop=${itemData.shop_id}`
		},
		getValue(props) {
			let {rules} = props.itemdata;

			return (
				<ul className="full-cut-list c-fl">
					<li className="minus-full-activity">
						{rules.map((val, i) => `${val.full}件${val.percent / 10}折` + (i !== rules.length - 1 ? ";" : "")).join('')};
					</li>
				</ul>
			)
		},
		getTagName: "满折"
	},
	//N元任选
	OptionBuy: {
		link(itemData) {
			return `/searchResult?promotion_id=${itemData.id}&shop=${itemData.shop_id}`
		},
		getValue(props) {
			let {itemdata} = props;
			return (<span
				className="option-buy">{`${itemdata.rules.amount}元任选${itemdata.rules.quantity}件`}</span>)
		},
		getTagName: "N元任选"
	},
	//加价换购
	ExchangeBuy: {
		getValue(props) {
			let {itemdata} = props;
			if (props.flag) {
				return (<a
					href={`/searchResult?promotion_id=${itemdata.id}&shop=${itemdata.shop_id}`}><span>满{itemdata.rules.exchange_full}元加价可在购物袋换购热销商品</span><i
					className="icon icon-forward vertical-middle"><img
					src="/src/img/icon/arrow/arrow-right-icon.png"/></i></a>)
			} else {
				return (<span>满{itemdata.rules.exchange_full}元加价可在购物袋换购热销商品</span>)
			}
		},
		getTagName: "加价换购"
	},
	//赠品
	GiftBuy: {
		getValue(props) {
			if (props.flag) {
				let keys = Object.values(props.itemdata.subItems);
				let ret = [];
				keys.forEach((i, keys) => {
					for (let k in i) {
						ret.push(i[k])
					}
				});
				let html = ret.map(function (item, i) {
					return <li key={i}>
						<span className="title">赠品{i + 1}</span>
						<a href={`/item?item_id=${item.item_id}`}><span className="image"><img
							src={item.subItemStatus === "open" ? item.primary_image : "/src/img/item/no-item.png"}/></span>
							<i>×{item.giftNum}</i>
						</a>
					</li>
				});
				return (<div className="gift-title"><p className="gift-p">购买可获赠热销商品，赠完为止</p>
					<div className="gift-wrapper">
						<ul className="gift-buy">
							<div className="wrapper">
								{html}
							</div>
						</ul>
					</div>
				</div>)
			} else {
				return <div className="gift-title" style={{display: "inline-block"}}><p
					style={{display: "inline-block", lineHeight: "28px"}}>购买可获赠热销商品，赠完为止</p>
				</div>
			}
		},
		getTagName: "赠品"
	},
	default() {
		return null
	}
};

let EvaluateGrade = {
	"Good": "好评!",
	"Bad": "差评!",
	"Neutral": "中评!"
}

export let params = {
	newTime: 0,
	oldTime: 0,
	enlarge: false,
	touchesX: 0,
	touchesY: 0,
	FirstX: 0,
	FirstY: 0,
	x1: 0,
	x2: 0,
	y1: 0,
	startX: 0,
	startY: 0,
	endX: 0,
	endY: 0,
	wid: 0,
	hei: 0,
	lef: 0,
	to: 0,
	timerScale: null,
};

function preventScroll(status) {
	let sTop = Math.abs($(window).scrollTop() || $("#item-details")[0] && (-$("#item-details")[0].offsetTop) || preventScroll.disTop);
	if (status && $("#item-details")[0]) {
		preventScroll.disTop = sTop;
		$("#item-details").css({position: "fixed", top: -sTop, width: "100%"});
	} else {
		$("#item-details").css({position: "static", top: ""});
		$(window).scrollTop(preventScroll.disTop || 0);
	}
}

//获取区间价
export function rangePrice(data, sellPrice) {
	let {skus} = data.info, priceArr = [], rangePrice;
	for (let i in skus) {
		if (sellPrice) {  //标准售价
			priceArr.push(parseFloat((parseFloat(skus[i].price).toFixed(2))))
		} else { //市场价
			priceArr.push(parseFloat((parseFloat(skus[i].market_price).toFixed(2))))
		}
	}

	if (priceArr.length > 1) { //多规格
		priceArr = priceArr.sort((a, b) => {
			return a - b;
		});

		if (data.activity_type === "FlashSale" || data.activity_type === "SecKill" || data.groupBuy) {//特卖 秒杀 拼团
			rangePrice = priceArr[0];  //普通售价对应最小价格
		} else {  //直降同普通商品
			rangePrice = priceArr[0] !== priceArr[priceArr.length - 1] ? priceArr[0] + "-" + priceArr[priceArr.length - 1] : priceArr[0];
		}
	} else { //单规格
		rangePrice = priceArr[0]
	}
	return rangePrice
}

//获取已选属性
export function chooseSpec(retState, specs) {
	let {specKey, selectArr} = retState;
	let list = [], spec;
	specKey && specKey.map((val, key) => {
		spec = specs[val].values.filter((item, i) => {
			return item.spec_value_id == selectArr[key];
		});
		// spec = specs[val].values[selectArr[key]];
		list.push(<span key={val}>{spec[0].text} </span>)
	});
	return list
}

function CouponClassFix(data) {
	if (data.isset_limit_money) {
		return "coupon-red"
	} else {
		return "coupon-yellow"
	}
}

//手势缩放图片
export function scaleImg(selectors, swiper1, params) {
	let {newTime, oldTime, enlarge, touchesX, touchesY, FirstX, FirstY, x1, x2, y1, startX, endX, startY, endY, wid, hei, lef, to, timerScale, self, isLarge} = params;
//点击、放大、拖拽、双指事件
	$(selectors + " img").on('touchstart', function (e) {
		e.preventDefault();
		/*e.stopPropagation();*/
		let $this = e.target;
		clearTimeout(timerScale);
		//	图片宽高比
		let ratio = $this.height / $this.width;
		//点击、放大、拖拽、双指事件
		x1 = 2 * ($(e.target).offset().left - $(selectors).offset().left) - e.touches[0].clientX;
		// x1 = -e.touches[0].clientX;
		y1 = 2 * ($(e.target).offset().top - $(selectors).offset().top) - e.touches[0].clientY;
		if (e.touches.length == 2) {
			x2 = e.touches[1].pageX;
			startX = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
			startY = Math.abs(e.touches[0].pageY - e.touches[1].pageY);
			wid = $this.width;
			hei = $this.height;
			lef = $(e.target).offset().left - $(selectors).offset().left;
			to = $(e.target).offset().top - $(selectors).offset().top;
		}
		touchesX = e.touches[0].clientX;
		touchesY = e.touches[0].pageY;
		FirstX = $(e.target).offset().left - $(selectors).offset().left;
		FirstY = $(e.target).offset().top - $(selectors).offset().top;
		oldTime = newTime;
		newTime = new Date().getTime();
		//单击、双击事件
		timerScale = setTimeout(function () {
			if (newTime - oldTime > 300) {//单击
				self.setState({isLarge: false});
				enlarge = false, newTime = 0;
				$($this).css({
					width: `${ratio > 1.8 ? "80%" : "100%"}`, /*"100%"*/
					height: "auto", /*"auto"*/
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					position: "relative"
				});
				swiper1 && swiper1.unlockSwipeToNext();
				swiper1 && swiper1.unlockSwipeToPrev();
			} else {//双击
				if (enlarge === false) {
					$($this).css({
						width: `${ratio > 1.8 ? "160%" : "200%"}`, /*"100%"*/
						height: "auto", /*"auto"*/
						top: y1,
						left: x1,
						transform: "translate(0, 0)",
						position: "relative"
					});
					swiper1 && swiper1.lockSwipeToNext();//放大时禁止swiper
					swiper1 && swiper1.lockSwipeToPrev();
					enlarge = true;
				} else {
					$($this).css({
						width: `${ratio > 1.8 ? "80%" : "100%"}`, /*"100%"*/
						height: "auto", /*"auto"*/
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						position: "relative"
					});
					swiper1 && swiper1.unlockSwipeToNext();
					swiper1 && swiper1.unlockSwipeToPrev();
					enlarge = false;
				}
			}
		}, 300);

		//放大事件
		let handler = function (e) {
			e.preventDefault();
			/* e.stopPropagation();*/
			if (e.targetTouches.length == 1) {
				let touch = e.targetTouches[0];
				if (enlarge) {
					$($this).css({left: touch.pageX - touchesX + FirstX});
					$($this).css({top: touch.pageY - touchesY + FirstY});
				}
				if (Math.abs(touch.pageX - x1) > 2) {
					clearTimeout(timerScale);  //拖动时清除定时器（不执行单击双击动作）
				}
			} else if (e.targetTouches.length == 2) {
				clearTimeout(timerScale);
				let touch1 = e.targetTouches[0],
					touch2 = e.targetTouches[1];
				endX = Math.abs(touch1.clientX - touch2.clientX);
				endY = Math.abs(touch1.pageY - touch2.pageY);
				let newHeight = hei + (endX - startX) * ratio, winHeight = $(window).height();
				let newWidth = wid + (endX - startX), winWidth = $(window).width();
				newWidth = newWidth > winWidth * 2 ? winWidth * 2 : newWidth;
				newWidth = newWidth < winWidth ? winWidth : newWidth;
				if (newWidth > winWidth) {
					$($this).css({margin: 0});
					enlarge = true;
					swiper1 && swiper1.lockSwipeToNext();
					swiper1 && swiper1.lockSwipeToPrev();
				} else {
					enlarge = false;
					swiper1 && swiper1.unlockSwipeToNext();
					swiper1 && swiper1.unlockSwipeToPrev();
				}

				$($this).css({
					width: newWidth + 'px', /*newWidth + 'px'*/
					left: lef - (endX - startX) / 2,
					top: to - ((endX - startX) / 2) * ratio,
					transform: "translate(0, 0)",
					position: "relative"
				});
			}
		};
		$this.addEventListener('touchmove', handler, false);
		$($this).on('touchend', function (e) {//手指离开时移除监听
			e.preventDefault();
			/* e.stopPropagation();*/
			$this.removeEventListener('touchmove', handler, false);
			if ($this.width == $(window).width() || $this.height == $(window).height()) {
				$($this).css({
					width: `${ratio > 1.8 ? "80%" : "100%"}`, /*"100%"*/
					height: "auto", /*"auto"*/
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					position: "relative"
				});
			}
		});
	})
}

//加入购物车动画
export function flyToCart() {
	let offsetImg = $(".posit-img").find('img').offset();
	let offsetCart = $(".cart-toTop .cart").offset();
	let img = $(".posit-img").find('img').attr('src');
	let flyer = Zepto('<img class="u-flyer" src="' + img + '" />');
	flyer.fly({
		start: {
			left: offsetImg.left,
			top: offsetImg.top - document.body.scrollTop,
		},
		end: {
			left: offsetCart.left + 40,
			top: offsetCart.top - document.body.scrollTop + 40,
			width: 0,
			height: 0
		},
		onEnd: function () {
			this.destory();
		}
	});

}

export let CouponType = {
	text(data) {
		return data.apply_text;
	},
	title(data) {
		return data.type === "0" ? "店铺券" : (data.type === "1" ? "跨店券" : (data.type === "2" ? "平台券" : (data.type === "3" ? "红包抵用券" : "免单券")))
	}
};

export class ItemNav extends PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			index: 0,
			ratio: 0
		};
	}

	componentDidMount() {
		this.scrollEvent();
	}

	componentDidUpdate() {
		/*if ($("#item-details").css("position") === "fixed") {  //ios 弹框出现阻止滑动
		 this.scrollEvent();
		 }*/
	}

	/*componentDidUpdate() {
	 window.removeEventListener("scroll", this.addScrollEvent);
	 this.scrollEvent();
	 }*/

	scrollEvent = () => {
		let {ratio} = this.state;
		window.removeEventListener("scroll", this.addScrollEvent);
		this.addScrollEvent = () => {
			let scrollH = $(window).scrollTop();
			let bannerH = $(".scroll-banner").height() - 44;
			ratio = scrollH / bannerH;
			ratio = ratio >= 1 ? 1 : ratio;
			this.setState({ratio: ratio});
			let navIndex = this.state;
			$(".item-nav").css({
				display: ratio <= 0 ? "none" : "block",
				backgroundColor: `rgba(255,255,255,${ratio})`,
				color: `rgba(53,53,53,${ratio})`
			});
			if (scrollH < $(".screen-rate")[0].offsetTop - 44) {
				navIndex !== 0 && this.setState({index: 0});
			} else if (scrollH < $(".screen-detail")[0].offsetTop - 44) {
				navIndex !== 1 && this.setState({index: 1});
			} else {
				navIndex !== 2 && this.setState({index: 2});
			}
		};
		window.addEventListener("scroll", this.addScrollEvent);
	};

	navClick = (index) => {
		if (index === 0) {
			$(window).scrollTop(0);
		} else if (index === 1) {
			$(window).scrollTop($(".screen-rate")[0].offsetTop - 44);
		} else {
			$(window).scrollTop($(".screen-detail")[0].offsetTop - 44);
		}
	};

	componentWillUnmount() {
		window.removeEventListener("scroll", this.addScrollEvent);
	}

	render() {
		let {index, ratio} = this.state;
		return <div className="item-nav c-fs14 c-c666" style={{display: "none"}}>
			<ul>
				<li onClick={() => {
					this.navClick(0)
				}}><span style={index === 0 ? {borderBottom: `2px solid rgba(53,53,53,${ratio})`} : {}}>商品</span></li>
				<li onClick={() => {
					this.navClick(1)
				}}><span className={index === 1 ? "active" : ""}>评价</span></li>
				<li onClick={() => {
					this.navClick(2)
				}} className="c-fr"><span className={index === 2 ? "active" : ""}>详情</span></li>
			</ul>
		</div>
	}
}

export class ScrollImageState extends PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			isLarge: false,
		}
	}

	componentDidMount() {
		let param = {...params, isLarge: this.state.isLarge, self: this};
		this.initSwiper();
		this.initLargeSwiper();
		scaleImg(".swiper-container-large", largeSwiper, param);
	}

	initSwiper() {
		if (bannerSwiper) {
			bannerSwiper.destroy();
		}
		bannerSwiper = new Swiper(this.refs.swiperBanner, {
			pagination: '.swiper-pagination-banner',
			observer: true,
			loop: false,
			paginationType: 'fraction',
			onSlideChangeStart: function (bannerSwiper) {
				largeSwiper.slideTo(bannerSwiper.activeIndex);
			}
		});
	}

	initLargeSwiper() {
		if (largeSwiper) {
			largeSwiper.destroy();
		}
		largeSwiper = new Swiper(this.refs.swiperLarge, {
			pagination: '.swiper-pagination-large',
			observer: true,
			loop: false,
			paginationType: 'fraction',
			onSlideChangeStart: function (largeSwiper) {
				bannerSwiper.slideTo(largeSwiper.activeIndex);
			}
		});
	}

	largeBanner = () => {
		this.setState({isLarge: !this.state.isLarge});
	};

	render() {
		let {images, item_type, activity_type} = this.props.data;
		let {group_data} = this.props;
		let H5_pic = this.props.data.item_tag && this.props.data.item_tag.images.mb_square_img;
		let H5D_pic = this.props.data.item_tag && this.props.data.item_tag.images.mb_rectangular_img;
		let {isLarge} = this.state;
		let html = images && images.length > 0 ? images.map((item, i) => {
			return (
				<div className="swiper-slide" key={i}>
					<img src={addImageSuffix(item, "_l") || '/src/img/item/no-img.png'} onClick={this.largeBanner}/>
				</div>
			)
		}) : <div className="swiper-slide"><img src={'/src/img/item/no-img.png'}/></div>;

		let htmlLarge = images.map((item, i) => {
			return (
				<div className="swiper-slide swiper-slide-large" key={i} onClick={(e) => {
					{/*e.stopPropagation();
					 e.preventDefault();*/
					}
					this.setState({isLarge: false});
				}}>
					<img src={addImageSuffix(item, "_l") || '/src/img/item/no-img.png'} id={`img${i}`}/>
				</div>
			)
		});
		return (
			<div className="c-pr scroll-banner" data-plugin="swiper">
				{isLarge && <div className="shady-banner"></div>}
				{group_data && group_data.group_type === "Rookie" ?
					<img className="c-pa tag2" src="/src/img/activity/new-group.png"/> : (H5_pic ?
						<img className="c-pa tag1" src={H5_pic}/> : "")}
				<div className="swiper-container" ref="swiperBanner">
					<div className="swiper-wrapper">
						{html}
					</div>
					{images.length > 0 && <div className="swiper-pagination swiper-pagination-banner"></div>}
				</div>
				<div className="swiper-container swiper-container-large" ref="swiperLarge"
					 style={isLarge ? {display: "block"} : {display: "none"}}>
					<div className="swiper-wrapper">
						{htmlLarge}
					</div>
					<div className="swiper-pagination swiper-pagination-banner swiper-pagination-large"></div>
				</div>
				{H5D_pic && (item_type === "NORMAL"||item_type === "VIRTUAL"||item_type === "INTERNAL") && activity_type !== "FlashSale" ?
					<img className="H5D_pic" src={H5D_pic}/> : ''}
			</div>
		)
	}
}

export class PriceArea extends PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			flashsaleFlag: false
		}
	}

	judgeFlashsale = (props) => {
		let {intervalT} = this.props;
		let {start_time, now_time, end_time, type} = props.promotion[0];
		now_time = new Date(now_time.replace(/-/g, '/')).getTime() + parseInt(intervalT);
		start_time = new Date(start_time.replace(/-/g, '/')).getTime();
		end_time = new Date(end_time.replace(/-/g, '/')).getTime();
		if (type === "FlashSale" && now_time > start_time && now_time < end_time) {
			this.setState({flashsaleFlag: true});
		}
	};

	componentDidMount() {
		if (this.props.proStatus) {
			if (this.props.data.activity_type === "FlashSale") {
				this.judgeFlashsale(this.props.promotion);
			}
		}
	}

	componentWillReceiveProps(newProps) {
		if (newProps.proStatus && newProps.proStatus !== this.props.proStatus) {
			if (newProps.data.activity_type === "FlashSale") {
				this.judgeFlashsale(newProps.promotion);
			}
		}
	}

	render() {
		let {flashsaleFlag} = this.state;
		let {proStatus, promotion, data} = this.props;
		return (
			<div>
				{flashsaleFlag && proStatus && <FlashsaleNotice {...this.props}/>}
				<div className="price-area">
					{!flashsaleFlag ?
						<Price item={data} proStatus={proStatus} promotion={promotion}/> : null}
					<GoodsTit item={data} promotion={promotion}/>
					<Tag item={data}/>
				</div>
			</div>
		)
	}
}

class FlashsaleNotice extends Component {
	constructor(props) {
		super(props);
		this.state = {
			time: 0
		}
	}

	componentDidMount() {
		let {intervalT} = this.props;
		let {end_time, now_time} = this.props.promotion.promotion[0];
		end_time = new Date(end_time.replace(/-/g, '/')).getTime();
		now_time = new Date(now_time.replace(/-/g, '/')).getTime() + parseInt(intervalT);
		if (now_time < end_time) {
			this.setState({time: parseInt((end_time - now_time) / 1000)});
		}
		this.intervalTime();
	}

	intervalTime() {
		this.timer = setTimeout(() => {
			let t = --this.state.time;
			if (t < 0) {
				location.reload()
			} else {
				this.state.time = t;
				this.setState(this.state);
				this.intervalTime()
			}
		}, 1000)
	}

	componentWillUnmount() {
		window.clearTimeout(this.timer);
		this.timer = null
	}

	//特卖市场价为最小活动价对应的市场价
	getMarketPrice = (data, sellPrice) => {
		let {skus} = data.info, marketPrice;
		for (let i in skus) {
			if (skus[i].price === sellPrice) {
				marketPrice = skus[i].market_price;
				break
			}
		}
		return marketPrice;
	};

	render() {
		let sellPrice = rangePrice(this.props.promotion, true);
		let marketPrice = this.getMarketPrice(this.props.promotion, sellPrice);
		return <div className="flashsale-price c-cfff">
			<span className="c-fs25 c-dpib c-fl"> ¥{sellPrice}</span>
			{marketPrice && marketPrice !== sellPrice ?
				<span className="c-dpib c-fl market-price c-ml5"> ¥{marketPrice}</span> : null}
			<span className="flashsale-tag">限时特卖</span>
			<div className="c-fr c-tr">
				<div className="time-notice">距结束仅剩</div>
				<div className="time-notice">{timeCtrl.formatTextTime(this.state.time)}</div>
			</div>
		</div>
	}
}

/*class BusinessNotice extends PureComponent {

 render() {
 let {businessFlag, data} = this.props;
 let num = businessFlag.threshold;
 return (
 num === 1 ? <div className="business-price1">
 <span className="c-fs20 c-cdred">¥{businessFlag.sell_price}</span>
 <span className="c-fs10 c-cccb c-mr15 market-price style1">¥{data.market_price}</span>
 <span className="c-c8b8a c-fs10 style1">1件起批</span>
 </div> : <ul className="business-price">
 <li className="line0">
 <span className="c-fs20 c-cdred price1">¥{data.sell_price}</span>
 <span className="c-fs10 c-mb5 c-cccb market-price price2">¥{data.market_price}</span>
 <span className="c-c8b8a c-fs10 price2">{num == 2 ? "1件起批" : `1-${num - 1}件`}</span>
 </li>
 <li>
 <span className="c-fs20 c-cdred price1">¥{businessFlag.sell_price}</span>
 <span className="c-fs10 c-mb5 c-cccb market-price price2">¥{data.market_price}</span>
 <span className="c-c8b8a c-fs10 price2">{num}件以上</span>
 </li>
 </ul>
 )
 }
 }*/

export class Price extends Component {
	constructor(props) {
		super(props);
		this.state = {
			sellPrice: parseFloat(parseFloat(this.props.item.sell_price).toFixed(2)),
			marketPrice: parseFloat(parseFloat(this.props.item.market_price).toFixed(2))
		}
	}

	//秒杀市场价为最小活动价对应的市场价
	getMarketPrice = (data, sellPrice) => {
		let {skus} = data.info, marketPrice;
		for (let i in skus) {
			if (skus[i].price === sellPrice) {
				marketPrice = skus[i].market_price;
				break
			}
		}
		return marketPrice;
	};

	componentWillReceiveProps(newProps) {
		if (newProps.proStatus && newProps.proStatus !== this.props.proStatus) {
			this.setState({
				sellPrice: rangePrice(newProps.promotion, true),
				marketPrice: newProps.item.item_type === "seckill" ? this.getMarketPrice(newProps.promotion, rangePrice(newProps.promotion, true)) : rangePrice(newProps.promotion, false)
			});
		}
	}

	componentDidMount() {
		if (this.props.proStatus) {
			this.setState({sellPrice: rangePrice(this.props.promotion, true)});
			this.setState({marketPrice: this.props.item.item_type === "seckill" ? this.getMarketPrice(this.props.promotion, rangePrice(this.props.promotion, true)) : rangePrice(this.props.promotion, false)})
		}
	}

	render() {
		let {is_free, trade_type, tax_rate, item_type, shop, activity_type} = this.props.item;
		let {sellPrice, marketPrice} = this.state;
		return (
			<div className="price-info c-clrfix">
				<span className="c-dpib c-fl standard-price"> ¥{sellPrice}</span>
				{marketPrice ?
					<span className="c-dpib c-fl market-price"> ¥{marketPrice}</span> : null}
				{item_type === "NORMAL" && shop.attr !== 3 && activity_type !== "FlashSale" &&
				<FreePostage data={{is_free, trade_type, tax_rate}} className="c-fl"/>}
			</div>
		)
	}
}
export class VipArea extends Component{
	render(){
		const { vipInfo = {} } = this.props;
		const { is_support_vip, vip_discount } = vipInfo;
    const discount = is_support_vip && (vip_discount / 10);
		return (
            <div>
                { is_support_vip ? <div className="price-vip">
                    <img src="/src/img/icon/icon-vip.png"/>
                    <span className="vip-title">{`泰享会员${discount}折特惠`}</span>
                </div> : null }
            </div>
		)
	}
}

export function FreePostage({data, className}) {
	return data.is_free || data.trade_type !== "DOMESTIC" && !Number(data.tax_rate) ?
		<span className={className + " free-postage-tag"}>
			{data.is_free ? "包邮" : ""}
			{data.trade_type !== "DOMESTIC" && Number(data.tax_rate) === 0 ? "包税" : ""}</span> : null

}

export class GoodsTit extends Component {
	render() {
		const {title, sub_title, vip_info} = this.props.item;
		return (
			<div>
				<VipArea vipInfo={vip_info}/>
				<p className="goods-tit">{title}</p>
				{sub_title && <p className="c-c666 sub-title">{sub_title}</p>}
			</div>
		)
	}
}

export class Tag extends Component {
	getList() {
		let {country, trade_type, shop: {biz_model}} = this.props.item;
		let strFilterTradeType = FilterTradeType(trade_type);
		let ret = [];

		country.imageUrl && ret.push(<li key='brandcountry'><img src={country.imageUrl}/>{country.text}品牌
		</li>);
		strFilterTradeType && ret.push(<li key='tradetype'><img
			src="/src/img/icon/trade-type-icon.png"/> {strFilterTradeType}</li>);
		biz_model === 1 ? ret.push(<li key='trc'><img src="/src/img/icon/trc-logo-icon.png"/> 泰然城自营
		</li>) : ret.push(<li
			key='trc'><img
			src="/src/img/icon/trc-logo-icon.png"/> 泰然城精选商家</li>);
		return ret;
	}

	render() {
		let style = this.getList();
		return (style.length ?
			<ul className="all-tag">{style}</ul> : null)
	}
}

// 活动
export class ActiveArea extends PureComponent {
	render() {
		return (<div className="active-area">
			{/* <StageWrap {...this.props} /> */}
			<CouponWrap {...this.props} />
			<PromotionWrap {...this.props} />
		</div>)
	}
}

// 促销
export class PromotionWrap extends Component {
	getPromotion() {
		let {promotion, activity_type} = this.props.promotion;
		return !!promotion.length ?
			<Promotion promotion={promotion} activity_type={activity_type} retState={this.props.retState}/> : null
	}

	render() {
		return (
			this.getPromotion()
		)
	}
}

@connect(promotionState, promotionDispatch)
class Promotion extends Component {

	getList(flag) {
		let {promotion} = this.props;
		let i = 0, ret = [], item;
		while (item = promotion[i]) {
			ret.push(<PromotionDefault {...this.props} itemdata={item} key={i} hasLink={flag} flag={flag}/>);
			i++
		}
		return ret
	}

	render() {
		return (
			<div>
				<div className="goods-promotion" onClick={() => {
					this.props.ChangePromotionModal(true)
				}}>
					<NewModal isOpen={this.props.promotionModal} title="促销活动"
							  onClose={(e) => {
								  e.stopPropagation();
								  this.props.ChangePromotionModal(false)
							  }}>
						<div className="goods-promotion-modal">
							<section className="promotion-list-modal">
								<div className="list-details-modal">
									<ul className="promotion-ul-modal">
										{this.getList(true)}
									</ul>
								</div>
							</section>
						</div>
					</NewModal>

					<div className="promotion_ti c-fl">促销</div>
					<section className="promotion-list c-fl">
						<div className="list-details">
							<ul className="promotion-ul">
								{this.getList()}
							</ul>
						</div>
					</section>
					<i className="icon icon-forward vertical-middle"><img
						src="/src/img/icon/arrow/arrow-right-icon.png"/></i>
					<p className="clearfix"></p>
				</div>
			</div>
		)
	}
}

export function promotionState(state) {
	let modalStatus = {
		promotionModal: state.itemIndex.promotionModal,
	};
	return modalStatus
}

export function promotionDispatch(dispatch) {
	return {
		BackFlag: () => {
			dispatch(createActions('promotionBackFlag'));
		},
		ChangePromotionModal: (flag) => {
			dispatch(createActions('changePromotionModal', {flag: flag}));
		}
	}
}

class PromotionDefault extends Component {
	linkTo() {
		let link = this.getLink();
		link && browserHistory.push(link);
		this.props.BackFlag();
	}

	getLink() {
		let {itemdata} = this.props;
		let PInfo = PromotionInfo[itemdata.type];
		if (PInfo) {
			return typeof PInfo.link === "function" ? PInfo.link(itemdata) : PInfo.link
		}
	}

	render() {
		let {itemdata, flag, hasLink, retState} = this.props;
		let PInfo = PromotionInfo[itemdata.type];
		return (
			<li className="promotion-li" onClick={() => hasLink && this.linkTo()}>
				<div className="clearfix">
					<button type="button" className="c-fl">{PInfo.getTagName}</button>
					{
						PInfo ? <PInfo.getValue itemdata={itemdata} flag={flag}
												deductPrice={retState && retState.deductPrice}/> :
							<PromotionInfo.default {...this.props} />
					}
					{hasLink && this.getLink() ? <i className="icon icon-forward vertical-middle"><img
						src="/src/img/icon/arrow/arrow-right-icon.png"/></i> : null}
				</div>
			</li>
		)
	}
}

// 优惠劵
export class CouponWrap extends Component {
	getCoupon() {
		let {promotion, shop} = this.props;
		if (promotion.coupon) {
			return <Coupons promotion={promotion} shop={shop}/>
		}
		return null
	}

	render() {
		return this.getCoupon()
	}
}

@connect(couponsState, couponsDispatch)
class Coupons extends Component {
	constructor(props) {
		super(props);
		this.state = {
			couponList: []
		}
	}

	getCouponList() {
		let {coupon} = this.props.promotion;
		let i = 0, ret = [];
		coupon.some((val, i) => {
			if (i <= 2) {
				ret.push(<span key={i}>满{val.limit_money}减{val.deduct_money}</span>);
			} else {
				return false
			}
		});
		return ret
	}

	getModalCouponList = () => {
		let ret = [];
		loadMask.show();
		axios.request({
			...pageApi.Coupon, params: {
				item_id: this.props.item_id,
			}
		}).then(({data}) => {
				loadMask.destroy();
				data.data && data.data.map((item, i) => {
					ret.push(<CouponList {...this.props} itemdata={item} key={i}/>);
				});
				this.setState({couponList: ret})
			}
		).catch(error => {
			loadMask.destroy();
			console.log(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'})
		});
	};

	render() {
		return (
			<div className="addr-ser">
				<NewModal title="领取优惠劵" isOpen={this.props.couponsModal} onClose={(e) => {
					e.stopPropagation();
					this.props.ChangeCouponsModal(false)
				}}>
					<div className="goods-coupon-modal">
						<div className="coupon-wrap">
							<div className="coupone-list">
								{this.state.couponList}
							</div>
						</div>
					</div>
				</NewModal>
				<div className="sever-addr" onClick={() => {
					this.getModalCouponList();
					this.props.ChangeCouponsModal(true)
				}}>
					<span className="coupon-list">
						领券： {this.getCouponList()}
						<i className="icon icon-forward vertical-middle"><img
							src="/src/img/icon/arrow/arrow-right-icon.png"/></i>
					</span>
				</div>
			</div>)
	}
}

export function couponsState(state) {
	let modalStatus = {
		couponsModal: state.itemIndex.couponsModal,
		item_id: state.itemIndex.data.item_id
	};
	return modalStatus
}

export function couponsDispatch(dispatch) {
	return {
		BackFlag: () => {
			dispatch(createActions('couponsBackFlag'));
		},
		ChangeCouponsModal: (flag) => {
			dispatch(createActions('changeCouponsModal', {flag: flag}));
		}
	}
}

class CouponListA extends Component {
	constructor(props) {
		super(props);
		this.state = {
			buttonClick: true
		}
	}

	getCoupon = () => {
		let self = this;
		let {itemdata, shop} = self.props;
		self.setState({buttonClick: false});
		axios.request({
			...pageApi.GetCoupon, params: {
				coupon_id: itemdata.id,
				shop_id: shop.id,
				source: "goods"
			}
		}).then(
			result => {
				if (result && result.status === 200 ){
                    self.setState({buttonClick: true});
                    tip.show({msg: "领取成功"})
				}
			}
		).catch(error => {
            self.setState({buttonClick: true});
			console.log(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'})
		})
	};

	render() {
        let {itemdata, shop, BackFlag,isLogin} = this.props;
		itemdata.shop = shop;
		let i = itemdata.coupon_type;
		return (
			<div className={"coupon " + CouponClassFix(itemdata)}>
				<div className="coupon-li-wrap">
					<div className="c-fl coupon-left">
						<h3 className={String(itemdata.deduct_money).length < 4 ? "h3-a" : "h3-b"}>
							<span>¥</span>{itemdata.deduct_money}</h3>
						<p>满{itemdata.limit_money}使用</p>
					</div>
					<div className="c-fr coupon-right">
						<h3>{CouponType.title(itemdata)}</h3>
						<LinkChange BackFlag={BackFlag} flag={true}>
							<button className="buy-button" onClick={(e) => {
								let cN = $(e.target).parent()[0].href;
								if (this.state.buttonClick && !cN && isLogin) {
									this.getCoupon();
								}
							}}>立即领取
							</button>
						</LinkChange>
						<p className="coupon-right-type">
							&bull;&nbsp;{CouponType.text(itemdata)}
						</p>
						<p className="coupon-right-use-date">{dateUtil.format(new Date(itemdata.use_start_time.replace(/-/g, '/')).getTime(), "Y/M/D H:F").slice(2)}
							至 {dateUtil.format(new Date(itemdata.use_end_time.replace(/-/g, '/')).getTime(), "Y/M/D H:F").slice(2)}
						</p>
					</div>
				</div>
			</div>
		)
	}
}
export const CouponList = connect(stateLogin)(CouponListA)
//配送服务区域
export class SeverArea extends PureComponent {
	render() {
		return (
			<div className="c-pb10">
				<Add/>
				<Charge {...this.props}/>
				<Goods {...this.props} />
			</div>
		)
	}
}

//运费
class Charge extends Component {
	showChargeMsg = (num, money, quantity) => {
		let ret = [];
		switch (num) {
			case 0:
				return <li>该商品已包邮 <span className="tag">包邮</span></li>;
			case 1:
				return <li>{`满 ${ quantity } 件包邮`}</li>;
			case 2:
				return <li>{`满 ${ money } 元包邮`}</li>;
			case 3:
				return <li>{`满 ${quantity} 件，且满 ${ money }元包邮`}</li>;
			case 4:
				return <li>{`${ quantity } kg内包邮`}</li>;
			case 5:
				return <li>{`满 ${ money } 元包邮`}</li>;
			case 6:
				return <li>{`${quantity} kg内，且满 ${ money }元包邮`}</li>;
			default :
				break;
		}
	};
	//包邮规则
	chooseChargeRule1 = (assignArea) => {
		let {nowPrice, num} = this.props.retState;
		if (assignArea.limit_quantity) {
			switch (assignArea.free_type) {
				case 1:
					return /*+assignArea.limit_quantity < num ? this.showChargeMsg(0, null, null) : */this.showChargeMsg(1, null, assignArea.limit_quantity);
				case 2:
					return /*+assignArea.limit_money < nowPrice ? this.showChargeMsg(0, null, null) : */this.showChargeMsg(2, assignArea.limit_money, null);
				case 3:
					return /*+assignArea.limit_quantity < num && +assignArea.limit_money < nowPrice ? this.showChargeMsg(0, null, null) : */this.showChargeMsg(3, assignArea.limit_money, assignArea.limit_quantity);
				default :
					break;
			}
		} else {
			switch (assignArea.free_type) {
				case 1:
					return /*+assignArea.limit_weight < weight ? this.showChargeMsg(0, null, null) : */this.showChargeMsg(4, null, assignArea.limit_weight);
				case 2:
					return /*+assignArea.limit_money < nowPrice ? this.showChargeMsg(0, null, null) : */this.showChargeMsg(5, assignArea.limit_money, null);
				case 3:
					return /*+assignArea.limit_weight < weight && +assignArea.limit_money < nowPrice ? this.showChargeMsg(0, null, null) : */this.showChargeMsg(6, assignArea.limit_money, assignArea.limit_weight);
				default :
					break;
			}
		}

	};
	//按件数（重量）计算运费
	chooseChargeRule2 = (assignArea, valuation_type) => {
		let {start_standard, start_freight, add_standard, add_freight} = assignArea;
		let charge;
		let {num, weight} = this.props.retState;
		if (add_standard && add_freight && (valuation_type === 1 ? (+assignArea.start_standard < num * weight) : (+assignArea.start_standard < num))) {
			charge = valuation_type === 1 ? (+start_freight + Math.ceil((num * weight - start_standard) / add_standard) * add_freight) : (+start_freight + (add_standard && add_freight && Math.ceil((num - start_standard) / add_standard) * add_freight) );  //最终运费
			charge=parseFloat(charge.toFixed(2));
		} else {
			charge = +start_freight;  //首件运费
		}
		return <li>预计运费{charge}元</li>
	};

	//按金额计算运费
	chooseChargeRule3 = (assignArea) => {
		let {rules} = assignArea;
		if (!(rules instanceof Array)) { //默认地区运费规则
			let rulesArr = [];
			for (let i in rules) {
				rulesArr.push(rules[i])
			}
			rules = rulesArr;
		}
		let {nowPrice, num, groupPrice} = this.props.retState;
		nowPrice = groupPrice ? groupPrice : nowPrice
		let rangeLen = String(nowPrice).split("-").length;//区间价取标准售价算运费
		nowPrice = rangeLen === 1 ? nowPrice * num : this.props.data.sell_price * num;
		let charge;
		rules.filter((val, index) => {
			if (val.upper ? (nowPrice >= +val.boundary && nowPrice < +val.upper) : (nowPrice >= +val.boundary)) {
				charge = val.freight;
			}
		});
		return <li>预计运费{charge}元</li>
	};

	chooseAssignArea = (free_conf, areaCode) => {
		return free_conf.filter((val, index) => {
			let rowArea = val.area && val.area.split(",");
			return rowArea && rowArea.some((v) => {
					if (v === areaCode[0] || v === areaCode[1]) {
						return free_conf[index]
					}
				})
		});
	};

	//计算运费【重量1 件数2 金额3】
	calculateCharge = () => {
		let {dlytmplInfo} = this.props.mix;
		let {areaCode} = this.props.areaData;
		let assignArea = [];
		let {freight_conf, free_conf, valuation_type, is_free} = dlytmplInfo;
		let {num, weight} = this.props.retState;
		if (+is_free) {
			return <li>该商品已包邮 <span className="tag">包邮</span></li>;
		}
		if (valuation_type === 1 || valuation_type === 2) {  //按重量  //按件数
			if (free_conf) { //为指定地区设置包邮规则
				assignArea = this.chooseAssignArea(free_conf, areaCode);
				if (assignArea.length > 0 && ((assignArea[0].free_type === 3 && (assignArea[0].limit_weight || assignArea[0].limit_quantity) && assignArea[0].limit_money) || (assignArea[0].free_type === 2 && assignArea[0].limit_money) || (assignArea[0].free_type === 1 && (assignArea[0].limit_quantity || assignArea[0].limit_weight)))) {//指定地区设置包邮规则
					return this.chooseChargeRule1(assignArea[0])
				} else if (free_conf[0] && ((free_conf[0].free_type === 3 && (free_conf[0].limit_weight || free_conf[0].limit_quantity) && free_conf[0].limit_money) || (free_conf[0].free_type === 2 && free_conf[0].limit_money) || (free_conf[0].free_type === 1 && (free_conf[0].limit_quantity || free_conf[0].limit_weight)))) {
					return this.chooseChargeRule1(free_conf[0])
				}
			}
			//为指定地区城市设置运费+默认运费
			assignArea = this.chooseAssignArea(freight_conf, areaCode);
			let {start_standard, start_freight, add_standard, add_freight} = assignArea.length > 0 && assignArea[0];
			if (assignArea.length && ((start_standard != "" && start_freight != "" && add_standard != "" && add_freight != "") || (add_standard != "" && add_freight != "" && (valuation_type === 1 ? weight <= start_standard : num <= start_standard)))) { //指定地区城市
				return this.chooseChargeRule2(assignArea[0], valuation_type);
			} else {  //全国
				return this.chooseChargeRule2(freight_conf[0], valuation_type);
			}

		} else {  //按金额
			assignArea = this.chooseAssignArea(freight_conf, areaCode);
			if (assignArea.length) {
				return this.chooseChargeRule3(assignArea[0]);
			} else {
				return this.chooseChargeRule3(freight_conf[0]);
			}
		}
	};

	render() {
		let html = this.calculateCharge();
		return <ul className="charge c-fs13">
			<li className="c-mr15">运费</li>
			{html}
		</ul>
	}
}

//配送
@connect(addState, addDispatch)
class Add extends Component {
	constructor(props) {
		super(props);
		this.state = {
			flag: true,
			shadySlide: false,
			addSlideIn: false,
			addStart: false,
			animalStatus: false,
			slideIn: false,
		}
	}

	// 判断当前选择区域是否在指定区域内
	isInArea = (provinceId, cityId) => {
		let {delivery_regions} = this.props.mix;
		if (!(delivery_regions instanceof Array)) {
			return true
		} else {
			return delivery_regions.some((val) => {
				if (val == provinceId || val == cityId) {
					return true
				}
			})
		}

	};

	changeState = (stateName) => {
		this.setState(stateName);
	};
	//确定/取消地址选择
	confirmAnimal = (provincetxt, citytxt, countytxt, provinceId, cityId, countyId) => {
		if (!this.isInArea(provinceId, cityId)) {
			tip.show({msg: "不在配送区域"});
			return
		}
		if (countytxt) {
			this.props.ChangeAreaData({
				areaData: {
					area: provincetxt + "/" + citytxt + "/" + countytxt,
					areaCode: [provinceId, cityId],
					addressData: {
						"area": {
							"province": {
								"code": provinceId,
								"text": provincetxt
							},
							"city": {
								"code": cityId,
								"text": citytxt
							},
							"district": {
								"code": countyId,
								"text": countytxt
							}
						},
						"detail_address": provincetxt + citytxt + countytxt
					}
				}
			});
		} else {
			this.props.ChangeAreaData({
				areaData: {
					area: provincetxt + "/" + citytxt,
					areaCode: [provinceId, cityId],
					addressData: {
						"area": {
							"province": {
								"code": provinceId,
								"text": provincetxt
							},
							"city": {
								"code": cityId,
								"text": citytxt
							}
						},
						"detail_address": provincetxt + citytxt
					}
				}
			});
		}
		this.setState({animalStatus: false, slideIn: false, shadySlide: false, addSlideIn: false})
	};
	//遮罩层取消
	cancel = () => {
		let {animalStatus, slideIn} = this.state;
		let {addrList} = this.props.mix;
		let {isLogin} = this.props;
		if (!isLogin || isLogin && (addrList.recent_addr.length === 0) && !addrList.default_addr.area) {
			this.changeState({slideIn: false, shadySlide: false, addSlideIn: false, flag: true});
			return
		}
		if (animalStatus && slideIn) {
			this.changeState({slideIn: false, flag: true})
		} else {
			this.changeState({shadySlide: false, addSlideIn: false, flag: true})
		}
	};

	render() {
		let {mix, areaData, ChangeAreaData, isLogin} = this.props;
		let {dlytmplInfo, addrList} = mix;
		let departAdd = mix.storehouse && mix.storehouse.name;
		let {shadySlide, addSlideIn, addStart, animalStatus, slideIn, flag} = this.state;
		let html = (
			<div className="addr-solected">
				<span className="c-mr15">配送</span>
				<span className="addr-fh"></span>{departAdd}至{/*{dlytmplInfo && dlytmplInfo.depart_add}*/}
				<i className="icon place-icon"></i>
				<span>{areaData.area}</span>
				<i className="icon icon-forward vertical-middle"><img
					src="/src/img/icon/arrow/arrow-right-icon.png"/></i></div>
		);
		return (
			<div className="addr-ser">
				<div className={`shady ${shadySlide ? '' : 'c-dpno'}`} style={{height: $(window).height()}}
					 onClick={this.cancel}></div>
				<AddPop addrList={addrList} addStart={addStart} shadySlide={shadySlide} flag={flag}
						addSlideIn={addSlideIn}
						areaData={areaData}
						animalStatus={animalStatus} slideIn={slideIn} cancel={this.cancel}
						changeState={this.changeState} confirm={this.confirmAnimal} ChangeAreaData={ChangeAreaData}
						isInArea={this.isInArea}/>
				<div className="sever-addr">
					<div className="addr-a" onClick={() => {
						this.changeState({addStart: true, shadySlide: true, addSlideIn: true, flag: false});
						if (!isLogin || isLogin && addrList.recent_addr.length < 0 || isLogin && !addrList.default_addr) {
							this.setState({animalStatus: true, slideIn: true})
						}
					}}>{html}</div>
				</div>
			</div>
		)
	}
}

export function addState(state) {
	let data = {
		mix: state.itemIndex.mix,
		areaData: state.itemIndex.areaData,
		...state.global
	};
	return data
}

export function addDispatch(dispatch) {
	return {
		ChangeAreaData: (data) => {
			dispatch(createActions('changeAreaData', data));
		}
	}
}

//地址选择弹窗
class AddPop extends Component {
	render() {
		if (this.props.addSlideIn) {
			preventScroll(true)
		} else {
			preventScroll(false)
		}
		let {addSlideIn, addStart, animalStatus, slideIn, addrList, areaData} = this.props;
		let recentOrDefaultAdd = addrList ? (addrList.recent_addr.length > 0 ? addrList.recent_addr : addrList.default_addr) : [];
		let recentAdd = recentOrDefaultAdd.length > 0 && recentOrDefaultAdd.map((item, i) => {
				let Hei = $(`.addr-d${i}`).height();
				return <li key={i} className="choose-add add-detail"
						   style={Hei > 19 ? {paddingTop: "8px"} : {paddingTop: "15px"}}
						   onClick={() => {
							   let {province, city, district} = item.area, areaCode = [];
							   if (!this.props.isInArea(item.area.province.code, item.area.city.code)) {
								   tip.show({msg: "不在配送区域"});
								   return
							   }
							   areaCode.push(province.code), areaCode.push(city.code), district.code && areaCode.push(district.code);
							   item.address_id = item.id;
							   this.props.ChangeAreaData({
								   areaData: {
									   area: item.detail_address,
									   areaCode: areaCode,
									   addressData: item
								   }
							   });
							   this.props.changeState({shadySlide: false, addSlideIn: false})
						   }}>
					<img className="img-l"
						 src={areaData.area === item.detail_address ? "/src/img/icon/orientation-icon-red.png" : "/src/img/icon/orientation-icon.png"}/>
					<div
						className={`addr-d${i} ${areaData.area === item.detail_address ? "c-cdred" : ""}`}>{item.detail_address}</div>
				</li>
			});
		return (
			<div className="add-pop">
				<ChooseAddress animalStatus={animalStatus} slideIn={slideIn} confirm={this.props.confirm}/>
				<div className={`animation-add ${addStart ? (addSlideIn ? "animation1" : "animation2") : ""}`}>
					<div className="title">
						<li className="c-fr" onClick={this.props.cancel}>
							<img src="/src/img/icon/close/icon-modal-close.png"/>
						</li>
						<li className="c-c35 c-fs15">配送至</li>
					</div>
					<ul className="c-fs13 ">
						{recentAdd}
						<li className="c-cdred choose-add" onClick={() => {
							this.props.changeState({animalStatus: true, slideIn: true})
						}}>
							<img className="img-l" src="/src/img/icon/choose-add.png"/>
							选择其他区域
						</li>
					</ul>
				</div>
			</div>
		)
	}
}

@connect(searverState, searverDispatch)
class Goods extends Component {

	onClose = () => {
		this.props.ChangeSearverModal(false)
	};

	render() {
		let {mix, data, searverModal} = this.props;
		let departAdd = mix.storehouse && mix.storehouse.name;
		let isTradeFade = TradeFade(data);
		let {delivery_regions, tags} = mix;
		return (
			<div>
				<GoodsModal mix={mix} isTradeFade={isTradeFade} data={data} searverModal={searverModal}
							onClose={() => this.onClose()}/>
				<div className="goods-tax"
					 onClick={() => {
						 this.props.ChangeSearverModal(true)
					 }}>
					<ul>
						<li className={`${data.support_ecard ? "" : "no-support"}`}><i
							className={`${data.support_ecard ? "detail-serve-icon" : "point-notice-icon"}`}></i>{data.support_ecard ? "支持活动e卡" : "不支持活动e卡"}
						</li>
						{
							isTradeFade && data.trade_type !== "DOMESTIC" ?
								<li><i className="detail-serve-icon"></i>商品税费</li> : null
						}
						<li className={`${tags.free_refund ? "" : "no-support"}`}><i
							className={`${tags.free_refund ? "detail-serve-icon" : "point-notice-icon"}`}></i>{tags.free_refund ? "支持" : "不支持"}七天无理由退换货
						</li>
						{data.is_free ? <li><i className="detail-serve-icon"></i>包邮</li> : null}
						<li><i className="detail-serve-icon"></i>正品保证</li>
						{departAdd ?
							<li><i className="detail-serve-icon"></i>{departAdd}</li>
							: ""}
						<li><i className="detail-serve-icon"></i>担保交易</li>
						{typeof (delivery_regions) !== "number" ?
							<li><i className="detail-serve-icon"></i>部分区域配送</li> : ""}
					</ul>
					<p className="clearfix"></p>
				</div>
			</div>
		)
	}
}

export function searverState(state) {
	return {
		searverModal: state.itemIndex.searverModal
	}
}

export function searverDispatch(dispatch) {
	return {
		ChangeSearverModal: (flag) => {
			dispatch(createActions('changeSearverModal', {flag: flag}));
		}
	}
}

class GoodsModal extends Component {
	render() {
		let {mix, isTradeFade, data} = this.props;
		let departAdd = mix.storehouse && mix.storehouse.name;
		let {delivery_regions, tags} = mix;
        // let rate = Math.ceil((+data.tax_rate).toFixed(5) * 10000) / 100; //税率不做处理
        let rate = ((+data.tax_rate)* 10000/10000*100).toFixed(2);
		return (
			<NewModal isOpen={this.props.searverModal} title="服务说明" onClose={this.props.onClose}>
				<section className="modal-wrap-container" style={{height: "335px"}}>
					<ul>
						<li>
							<div className="hd">
								<i className={`${data.support_ecard ? "mark-icon" : "no-mark-icon"}`}></i> {data.support_ecard ? "支持活动e卡" : "不支持活动e卡"}
							</div>
							<div className="tax-cont">
								{data.support_ecard ? "店铺为支持活动e卡，商品贸易类型为一般贸易的商品。" : "不支持活动e卡。"}
							</div>
						</li>
						{isTradeFade && data.trade_type !== "DOMESTIC" ?
							<li>
								<div className="hd">
									<i className="mark-icon"></i> 商品税费
								</div>
								<div className="tax-cont">
									按照国家规定，本商品适用于跨境综合税，税率为{rate}%， 实际结算税费请以提交订单时的应付总额明细为准。
								</div>
							</li> : null
						}

						<li>
							<div className="hd">
								<i
									className={`${tags.free_refund ? "mark-icon" : "no-mark-icon"}`}></i> {!tags.free_refund ? "不支持" : null}七天无理由退换货
							</div>
							<div className="tax-cont">
								{tags.free_refund ? "此商品支持7天无理由退换货，在商品签收之日起7天内可发起退换货申请，退回商品应不影响第二次销售" : "此商品不支持七天无理由退换货"}
							</div>
						</li>
						{data.is_free ? <li>
							<div className="hd">
								<i className="mark-icon"></i> 包邮
							</div>
							<div className="tax-cont">
								此商品全国地区包邮。
							</div>
						</li> : null}
						<li>
							<div className="hd">
								<i className="mark-icon"></i> 正品保证
							</div>
							<div className="tax-cont">
								泰然城每件商品都经过严苛的质量把关，保障正品、保障品质，杜绝一切假货，让您购物无忧。
							</div>
						</li>
						{departAdd ?
							<li>
								<div className="hd">
									<i className="mark-icon"></i> {departAdd}
								</div>

								<div className="tax-cont">
									本商品由{departAdd}发货。
								</div>
							</li> : null}
						<li>
							<div className="hd">
								<i className="mark-icon"></i> 担保交易
							</div>
							<div className="tax-cont">
								担保交易，放心购买。
							</div>
						</li>
						{typeof (delivery_regions) !== "number" ? <li>
							<div className="hd">
								<i className="mark-icon"></i> 部分区域配送
							</div>
							<div className="tax-cont">
								本商品只支持部分配送区域。
							</div>
						</li> : null}
					</ul>
				</section>
			</NewModal>
		)
	}
}

//评价
export class EvaluateArea extends PureComponent {
	render() {
		let {rate, itemId} = this.props;
		let {rates, total, good_rate_ratio} = rate;
		return (
			<div className="evaluate-area detail">
				<div className="hd">
					<Link to={`/evaluate?item_id=${itemId}`} data-notLogin={true}>
						商品评价 ({total})
						<i className="icon icon-forward">
							<span className="c-cdred">好评{good_rate_ratio}%</span>
							<img src="/src/img/icon/arrow/arrow-right-icon.png"/>
						</i>
					</Link>
				</div>
				{rates.length > 0 && <EvaluateAreaContents rates={rates} itemId={itemId}/>}
			</div>
		)
	}
}

export class EvaluateAreaContents extends Component {

	getList() {
		let {rates, itemId} = this.props;
		return rates.map((item, i) => <EvaluateAreaContent data={item} key={i} itemId={itemId}/>);
	}

	componentDidMount() {
		if (this.refs.swiper) {
			this.initSwiper();
		}
	}

	initSwiper() {
		this.swiper = new Swiper(this.refs.swiper, {
			loop: false,
			slidesPerView: 1.35,
		});
	}

	render() {
		let html = this.getList();
		let i = this.props.rates.length;
		return (
			i === 7 ?
				<div data-plugin="swiper">
					<div className="swiper-container evaluate-swiper-container" ref="swiper">
						<div className="swiper-wrapper">
							{html}
							<div className="swiper-slide more-evaluate c-fs12 c-c666" key={i}>
								<Link to={`/evaluate?item_id=${this.props.itemId}`} data-notLogin={true}>
									<ul className="more">
										<li>查看更多</li>
										<li className="line-wrap">
											<i className="line"> </i>
										</li>
										<li>See more</li>
									</ul>
								</Link>
							</div>

						</div>
					</div>
				</div>
				: null
		)
	}
}

class EvaluateAreaContent extends Component {
	getName = (name) => {
		return name ? (name.length > 2 ? name.substring(0, 1) + "**" + name.substring(name.length - 1) : name) : null
	};
	getPhone = (phone) => {
		let phoneD = String(phone);
		return phone ? phoneD.substring(0, 3) + "***" + phoneD.substring(phoneD.length - 3) : null
	};

	render() {
		let {data, itemId} = this.props;
		return (
			<div className="swiper-slide each-evaluate">
				<Link to={`/evaluate?item_id=${itemId}`} data-notLogin={true}>
					<div className="c-fl" style={data.images.length === 0 ? {width: "100%"} : {}}>
						<h2>
							<div className="head"><img
								src={data.head_portrait ? addImageSuffix(data.head_portrait, "_t") : "/src/img/icon/avatar/default-avatar.png"}/>
							</div>
							<font>{data.user_name}</font>
						</h2>
						<div className="evaluate-content">
							{data.content || EvaluateGrade[data.experience]}
						</div>
					</div>
					{data.images.length > 0 && <div className="c-fr">
						<img src={addImageSuffix(data.images[0], "_s")}/>
						<span className="img-num">{data.images.length}张</span>
					</div>}
				</Link>
				<p className="c-cb"></p>
			</div>
		)
	}
}

export class LinkAndChange extends Component {

	render() {
		let {notLogin, onTouchTap, onClick, className, style, children, isLogin, to, href, flag, BackFlag, GoScrollHeght} = this.props;
		let props = {
			onTouchTap, onClick, className, style, href, to
		};
		let props1 = {
			className, style, href, to
		};
		// let redirect_uri = encodeURIComponent(to || location.href.slice(location.origin.length));
		return (!(notLogin === true || isLogin) ?
			<Link {...props1} onClick={(e) => {
				e.preventDefault();
				if (flag) {  //领取优惠券
					BackFlag();
				} else {
					GoScrollHeght($(window).scrollTop());
				}
				miniProgramLogin(location.href);
			}}>{children}</Link>
			: <Link  {...props}>{children}</Link>)
	}
}

export const LinkChange = connect(stateLogin, function markScroGllHeight(dispatch) {
	return {
		GoScrollHeght: (height) => {
			dispatch(createActions('goScrollHeght', {height: height}));
		}
	}
})(LinkAndChange);


export class RecommendArea extends PureComponent {
	componentDidMount() {
		if (this.refs.swiperRecommend) {
			this.initSwiper();
		}
	}

	initSwiper() {
		this.swiper = new Swiper(this.refs.swiperRecommend, {
			pagination: '.swiper-pagination-recommend',
		});
	}

	render() {

        let {recommend,orderNumber} = this.props, recArr = [];
		if (recommend.length <= 6) {
			recArr = [recommend];
		} else if (recommend.length > 6 && recommend.length <= 12) {
			recArr = [recommend.slice(0, 6), recommend.slice(6, recommend.length)]
		} else {
			recArr = [recommend.slice(0, 6), recommend.slice(6, 12), recommend.slice(12, recommend.length)]
		}
		let html = recArr.map((item, i) => {
			return <RecommendContent key={i} data={item} orderNumber={orderNumber}/>
		});
		return recommend.length > 0 ? <div className="recommend-area c-fs14" data-plugin="swiper">
			<p>为您推荐</p>
			<div className="swiper-container recommend-swiper-container" ref="swiperRecommend">
				<div className="swiper-wrapper">
					{html}
				</div>
				{recArr.length > 1 && <div className="swiper-pagination swiper-pagination-recommend"></div>}
			</div>
		</div> : null
	}
}

class RecommendContent extends Component {
    setRecommendDcp = (e,id,orderNumber) => {
        let extraInfo = setExtraInfoTjdj(id,orderNumber, "", "", "推荐商品点击成功");
        sdk.dispatch('click',e.currentTarget, extraInfo)
		browserHistory.push(`/item?item_id=${id}`)
	}
	render() {
    	let {data,orderNumber} = this.props;
		let html = data.map((data, i) => {
			return <li key={i} className="rec-item" style={(i + 1) % 3 === 0 ? {marginRight: "0px"} : {}}>
				{/*<Link to={`/item?item_id=${data.item_id}`}>*/}
				<div onClick={(e)=>{
					this.setRecommendDcp(e,data.id,orderNumber)
                }}>
					<div className="img-wraper">
						<img src={data.primary_image && addImageSuffix(data.primary_image, "_m") || '/src/img/item/no-img.png'}/>
						{data.promotion.tag && <span className="tag">{data.promotion.tag}</span>}
					</div>
					<div className="title">{data.title}</div>
					<div className="price">
						<span className="c-fs11 c-cdred">¥{data.sell_price}</span>
						{/*{<span className="c-fs10 c-cc9 market-price">¥{data.market_price}</span>}*/}
					</div>
                </div>
				{/*</Link>*/}
			</li>
		});
		return <div className="swiper-slide recommend-content">
			{html}
		</div>
	}
}

//店铺
export class ShopArea extends Component {
	render() {
		let {shop} = this.props;
		return (
			shop.is_open ?
				<Link className="link" to={`/store/home?shop=${+shop.id}`}>
					<ul className="shop-arer">
						<li className="image">
							<img src={addImageSuffix(shop.logo, "_s")}/>
						</li>
						<li className="name">
							<p className="shop-name c-fs15">{shop.alias ? shop.alias : shop.name}</p>
							<p className="shop-msg c-fs10 c-c999">{shop.biz_model === 1 ? "泰然城自营" : "泰然城精选商家"}</p>
						</li>
						<li className="button">
							进入店铺
						</li>
					</ul>
                    <div className="gap bgf4"></div>
				</Link> : null
		)
	}
}

class DangerouslySet extends Component {
	constructor(props) {
		super(props);
		this.state = {
			imgUrl: "",
		}
	}

	onClickImage = (e) => {
		let radio = $(e.target).height() / $(e.target).width();
		let width = e.target.width;
		// let width = radio > 1.8 ? $(window).width() * 0.8 : $(window).width();
		let height = e.target.height;
		this.props.changeImgData($(e.target)[0].src, width, height);
	};

	componentDidMount() {
		$('.goods-pic img').click(this.onClickImage);
	}

	render() {
		let {data} = this.props;
		return (
			<div>
				<div className="goods-pic" dangerouslySetInnerHTML={{__html: data.desc && data.desc.wap}}></div>
			</div>
		)
	}
}

//图文详情
export class GoodsDetail extends PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			active: 0,
			imgSrc: "",
			width: 0,
			height: 0
		}
	}

	componentWillUnmount() {
		this.unMount && this.unMount()
	}

	componentDidMount() {
		this.unMount = this.mount();
	}

	mount() {
		let height = $(window).height();
		let self = this;
		let twOffset = $(this.refs.twContent).offset().top;
		$(this.refs.detail).css('min-height', height - 140);

		function fn() {
			if (window.scrollY + height >= twOffset) {
				self.setState(self.state);
				$(window).unbind("scroll", fn);
			}
		}

		$(window).bind('scroll', fn);
		return () => $(window).unbind("scroll", fn)
	}

	changeTag(active) {
		if (active != this.state.active) {
			this.setState({
				active
			})
		}
	}

	checkTag(active) {
		return this.state.active === active ? "active" : "";
	}

	getList() {
		let {properties, art_no, shelved_at, weight} = this.props.data;
		let ret = [
			<li key="id">商品编号：<span className="c-fr">{art_no}</span></li>,
			<li key="time">{shelved_at && "上架时间："}<span className="c-fr">{shelved_at && shelved_at.split(" ")[0]}</span>
			</li>,
			<li key="weight">商品毛重：<span className="c-fr">{weight}kg</span></li>
		];
		for (let i in properties) {
			ret.push(<li key={i}>{properties[i].name}：<span className="c-fr">{properties[i].text}</span></li>)
		}
		return ret
	}

	changeImgData = (url, width, height) => {
		this.setState({
			imgSrc: url,
			width: width,
			height: height,
		})
	}

	render() {
		let {data} = this.props;
		let item_t_type = data.trade_type;
		let {imgSrc, width, height} = this.state;
		return (
			<div className="pic-area detail goods-detail" ref="twContent">
				<ItemFix>
					<div className="tab-ti-wrap">
						<div className="tab-ti">
							<ul>
								<li className={this.checkTag(0)} onClick={() => this.changeTag(0)}><span>商品介绍</span>
								</li>
								<li className={this.checkTag(1)} onClick={() => this.changeTag(1)}><span>商品参数</span>
								</li>
							</ul>
						</div>
					</div>
				</ItemFix>
				<div className="tab-con">
					<div className={"tw-con " + this.checkTag(0)}>
						{item_t_type == 'Direct' || item_t_type == 'Overseas' ?
							<div className='zhiyou img-w'>
								<img src="/src/img/pintuan/zhiyou.jpg" onClick={(e) => {
									this.changeImgData("/src/img/pintuan/zhiyou.jpg", $(window).width(), e.target.height);
								}}/>
							</div>
							: null
						}
						<DangerouslySet data={data} changeImgData={this.changeImgData}/>
						{item_t_type == 'Direct' || item_t_type == 'Bonded' || item_t_type == 'Overseas' ?
							<div className="goods_text img-w">
								<img src="/src/img/pintuan/goods_text.jpg" onClick={(e) => {
									this.changeImgData("/src/img/pintuan/goods_text.jpg", $(window).width(), e.target.height);
								}}/>
							</div>
							: ''
						}
						<div className="price_text img-w">
							<img src="/src/img/pintuan/price_text.jpg" onClick={(e) => {
								this.changeImgData("/src/img/pintuan/price_text.jpg", $(window).width(), e.target.height);
							}}/>
						</div>
					</div>
					<div className={"cs-con " + this.checkTag(1)} ref="detail">
						<ul className="goods-detail">
							{this.getList()}
						</ul>
					</div>
				</div>
				{imgSrc && <PhotoSwiper imgSrc={imgSrc} width={width} height={height} changeImgSrc={() => {
					this.state.imgSrc = ""
				}}/>}
			</div>
		)
	}
}

class PhotoSwiper extends Component {
	constructor(props) {
		super(props);
		this.state = {
			gallery: ""
		}
	}

	componentDidMount() {
		this.photoSwiper();
	}

	componentDidUpdate() {
		this.photoSwiper()
	}

	photoSwiper = (close) => {
		let {gallery} = this.state;
		let pswpElement = document.querySelectorAll('.pswp')[0];
		// build items array
		let items = [
			{
				src: this.props.imgSrc,
				w: this.props.width,
				h: this.props.height
			},
		];
		let options = {
			history: false,
			focus: false,
			tapToClose: true, //默认关闭
			showAnimationDuration: 0,
			hideAnimationDuration: 0
		};
		gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
		gallery.init();
	};

	render() {
		return (
			<div>
				<div className="pswp" tabIndex="-1" role="dialog" aria-hidden="true">
					<div className="pswp__bg" onClick={this.props.changeImgSrc()}></div>
					<div className="pswp__scroll-wrap">
						<div className="pswp__container">
							<div className="pswp__item"></div>
							<div className="pswp__item"></div>
							<div className="pswp__item"></div>
						</div>
						<div className="pswp__ui pswp__ui--hidden">
							<div className="pswp__top-bar">
								<div className="pswp__counter"></div>
								{/*<button className="pswp__button pswp__button--close" title="Close (Esc)"></button>
								 <button className="pswp__button pswp__button--share" title="Share"></button>
								 <button className="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>
								 <button className="pswp__button pswp__button--zoom" title="Zoom in/out"></button>*/}
								<div className="pswp__preloader">
									<div className="pswp__preloader__icn">
										<div className="pswp__preloader__cut">
											<div className="pswp__preloader__donut"></div>
										</div>
									</div>
								</div>
							</div>
							<div className="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
								<div className="pswp__share-tooltip"></div>
							</div>
							<button className="pswp__button pswp__button--arrow--left" title="Previous (arrow left)">
							</button>
							<button className="pswp__button pswp__button--arrow--right" title="Next (arrow right)">
							</button>
							<div className="pswp__caption">
								<div className="pswp__caption__center"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

// 收藏
@connect(collectState, collectDispatch)
export class Collect extends Component {
	locked(flag) {
		if (flag != null) {
			this.update = flag;
		}
		return this.update
	}

	onCollect = () => {
		let {favorite} = this.props;
		if (!this.locked()) {
			this.locked(true);
			let action = favorite ? {...pageApi.DelFav, params: {item_id: this.props.data.item_id}} : {
				...pageApi.Fav, params: {item_id: this.props.data.item_id}
			};
			axios.request(action).then(
				result => {
					this.props.ChangeCollectStatus(favorite?0:1);
					this.locked(false) //请求完成执行
                    //埋点操作
                    let {item_id,title} = this.props.data;
                    let extraInfo = setExtraInfoScj(item_id, title, null, result.status, result.data.code, '商品加入收藏成功');
                    !favorite ? sdk.dispatch('click', document.getElementById('add-collect'), extraInfo) : null;
				}
			).catch(error => {
                let {status, data} = error.response;
                tip.show({msg: data.message || '服务器繁忙'})
                this.locked(false)  //请求完成执行
                //埋点操作
                let {item_id,title} = this.props.data;
                let extraInfo = setExtraInfoScj(item_id, title, null, status, data.code, data.message);
                !favorite ? sdk.dispatch('click', document.getElementById('add-collect'), extraInfo) :null;
			})
		}
	};

	render() {
		let {favorite} = this.props;
		return (
			<div className="collect">
				<LinkChange className={favorite ? "save curr uncollect-goods" : "save collect-goods"}
							onClick={() => this.onCollect()}>
					{
						favorite ? [<span className="icon icon-favor text_sc" key="0" id="add-collect"><img
							src="/src/img/icon/collected-icon.png"/></span>,
							<span className="icon-title" key="1">已收藏</span>] :
							[<span className="shoucang" key="0" id="add-collect"><img src="/src/img/icon/collect-icon.png"/></span>,
								<span className="icon-title" key="1"> 收藏</span>]
					}
				</LinkChange>

			</div>
		)
	}
}

export function collectState(state) {
	return {
		favorite: state.itemIndex.favorite
	}
}

export function collectDispatch(dispatch) {
	return {
		ChangeCollectStatus: (status) => {
			dispatch(createActions('changeCollectStatus', {status: status}));
		}
	}
}

//回到顶部+跳到购物车
export class TotopAndCart extends Component {
	componentWillUnmount() {
		$(window).unbind('scroll.top');
	}

	componentDidMount() {
		let $window = $(window);
		let windowH = $window.height();
		let $toTop = $(".toTop");
		let time;
		$toTop.on("click", function () {
			clearInterval(time);
			let h = $window.scrollTop();
			time = setInterval(function () {
				h -= 100;
				$window.scrollTop(h);
				if (h <= 0) {
					clearInterval(time)
				}
			}, 1)

		});
		$(window).bind('scroll.top', function () {
			let $this = $(this);
			let scrollH = $this.scrollTop();
			if (scrollH > $(window).height()) {
				$toTop.show()
			} else {
				$toTop.hide()
			}
		})
	}

	render() {
		let countCart = this.props.cartNum;
		/*if (countCart >= 99) {
			tip.show({
				msg: "您的购物车宝贝总数已满99件，建议您先去结算或清理"
			});
		}*/
		return (
			<div className="cart-toTop" style={judgeIphoneX() ? {bottom: "80px"} : {}}>
				<ul>
					<div onClick={() => {
						window.sessionStorage.setItem("areaData", "");
						miniProgramShopCart();
					}}>
						<li className="cart"><span
							className={!countCart ? "c-dpno" : (countCart >= 10 ? "width2" : "width1")}>{countCart}</span>
						</li>
					</div>
					<li className="toTop"></li>
				</ul>
			</div>
		)
	}
}

export class BuyModalTitle extends Component {
	constructor() {
		super();
		this.state = {
			isLarge: false
		}
	}

	getImg() {
		let {data} = this.props;
		let {specKey, selectArr} = this.props.retState;
		let {info} = this.props.promotion;
		let ret, spec;
		specKey && specKey.some((val, key) => {
			spec = info.specs[val].values.filter((item, i) => {
				return item.spec_value_id == selectArr[key];
			});
			// spec = info.specs[val].values[selectArr[key]];
			ret = spec[0].image;
			return ret
		});
		if (!ret) {
			return data.primary_image;
		} else {
			return ret
		}
	}

	componentDidUpdate() {
		if (this.state.isLarge) {
			let params = {
				newTime: 0,
				oldTime: 0,
				enlarge: false,
				relativeX: 0,
				relativeY: 0,
				x1: 0,
				x2: 0,
				y1: 0,
				startX: 0,
				endX: 0,
				wid: 0,
				hei: 0,
				lef: 0,
				to: 0,
				timerScale: null,
				self: this,
				isLarge: this.state.isLarge
			};
			scaleImg(".ui-table-view-large-wrapper", null, params);
		}
	}

	render() {
		let {data, retState, promotion} = this.props;
		let {specs} = promotion.info;
		let {isLarge} = this.state;
        let {storeNum} = this.props.retState;
		let choosedSpec = chooseSpec(retState, specs);
		return (
			<div>
				{isLarge && <div className="ui-table-view-large-img"
								 style={{height: $(window).height(), top: $(".action-buy-modal").height()}}>
					<div className="buy-shady" onClick={() => {
						this.setState({isLarge: false});
					}}></div>
					<div className="ui-table-view-large-wrapper" style={{height: $(window).height()}}>
						<img src={addImageSuffix(this.getImg(), "_l")}/>
					</div>
				</div>}
				<ul className="ui-table-view">
					<li className="ui-table-view-cell">
					<span className="posit-img"><img className="ui-media-object ui-pull-left"
													 src={this.getImg() ? addImageSuffix(this.getImg(), "_s") : '/src/img/item/no-img.png'}
													 width="80" height="80" onClick={() => {
						this.setState({isLarge: true});
					}}/></span>
						<div className="ui-media-body window-head">
							<div className="price-tag">
								<p className="ui-ellipsis text-price action-update-price">
									¥{retState.nowPrice}</p>
							</div>
                            <span className="c-c999">库存{storeNum}</span>
							{!(specs instanceof Array) && choosedSpec.length > 0 &&
							<p className="text-price-sel" style={{display: "block"}}> 已选：{choosedSpec} </p>}
						</div>
					</li>
				</ul>
			</div>
		)
	}
}

class BuyModalInfo extends Component {
	initList = () => {
		let {specs} = this.props.promotion.info;
		return Object.keys(specs).map((val, i) => {
			return <Specs specs={specs[val]} index={i} {...this.props} key={i}/>
		});
	};

	getLimit = () => {
		let {activity_type} = this.props.promotion;
		let {promotionData} = this.props;
		if (activity_type === "FlashSale") {     //特卖限购
			return (
				<span
					className="limit_buy">限购{promotionData[activity_type].rules.user_buy_limit}件 (已购{promotionData[activity_type].purchased_quantity}件)</span>
			)
		}
		return null
	};
    numValid = (type) => {
         let {addMinNum, promotionData} = this.props;
         let {activity_type} = this.props.promotion;
         let {num, storeNum, once, min} = this.props.retState;
         num = +num;
         let limitNum = activity_type === "FlashSale" ? promotionData[activity_type].rules.user_buy_limit - promotionData[activity_type].purchased_quantity : null;
         switch (type) {
			 case "plus":
                 if(once){
                     if(num + once <= storeNum){
                         num += once
                     }
                     addMinNum(num)
                 }else{
                     num === storeNum || num === "" || (limitNum === null ? false : num >= limitNum) || storeNum === 0 ? "" :  addMinNum(num+1)
                 }
                 break;
			 case "minus":
                 if(num > min){
                 	if(once){
                        if(num % once) {
                            num = parseInt(num / once) * once
                        }else{
                            num - once >= once ? num -= once : null
                        }

					}else{
                       num -= 1
					}
                     addMinNum(num)
				 }

                 break;
			 }
	 };

	render() {
        let {changeNum, importNum, promotionData, focusNum} = this.props;
		let {activity_type} = this.props.promotion;
		let {num, storeNum, min, once, moqAmount} = this.props.retState;
        let limitNum = activity_type === "FlashSale" ? promotionData[activity_type].rules.user_buy_limit - promotionData[activity_type].purchased_quantity : null;
        return (
			<div className="attr-wrap">
				<div className="standard-area stable-standard cur">
					<div className="standard-info">
						{this.initList()}
					</div>
				</div>
				<div className="buy-amount">
					<span className="amount-tit row-title">购买数量：</span>
					{!once && moqAmount ? <span className="c-c999 c-fs10">({moqAmount}件起售)</span> : ""}
                    {once ? <span className="c-c999 c-fs10">({once}倍购买)</span> : ""}
					<span className="number-increase-decrease">
					<span className={`btn btn-action action-decrease ${num <= min || num === "" ? "dis-click" : ""}`}
						  onTouchTap={ ()=>{this.numValid("minus")} }>－</span>
					<input type="number" className="action-quantity-input"
						   value={num} onBlur={importNum} onChange={changeNum} onFocus={focusNum}/>
						<span
							className={`btn btn-action action-increase ${num >= storeNum || num === "" || (limitNum === null ? false : num >= limitNum) || storeNum === 0 || (once?num + once > storeNum:false) ?  "dis-click" : ""}`}
							onTouchTap={ ()=>{this.numValid("plus")} }>＋</span>
					</span>
					{this.getLimit()}
					<div className="clearfix"></div>
				</div>
				<ExpectTax {...this.props} />
			</div>
		)
	}
}

export class BuyModalButton extends Component {
	render() {
		let {buyActive, onClickCart, onClickBuy, purchaseLimit, toCartClick, isNonPayment, retState} = this.props;
		let {realStore} = this.props.promotion;
		// let isPurchaseLimit = purchaseLimit();
		let isPurchaseLimit = false;    //本期不做
		return (
			<div>
			{ retState.optionBtnShow ?
			<div className="buy-option-btn" style={judgeIphoneX() ? {height: "85px"} : {}}>
				{isNonPayment ? <div className="btn-tobuy-disable" style={{width: "100%"}}>还有机会</div> :
					<div>
						{realStore ? <div
							className={`btn-addcart ${buyActive === "chooseSpec" ? 'btn-group btn-group-cart' : buyActive === 'buy' ? 'c-dpno' : ''} ${buyActive === "cart" ? 'btn-cart-only' : '' }`}
							onTouchTap={toCartClick ? onClickCart : ""} id="add-package">加入购物袋
						</div> : <div className="btn-tobuy-disable">已售罄</div>}
						{/*<div
						 className={`btn-addcart ${buyActive === "chooseSpec" ? 'btn-group' : buyActive === 'buy' ? 'c-dpno' : ''}`}
						 onTouchTap={toCartClick ? onClickCart : ""}>加入购物袋
						 </div>*/}
						<div>
							{isPurchaseLimit ?
								<span className="purchase-limit">抱歉，海外直邮类商品和跨境保税类商品总价超过限额￥2000，请分次购买。</span> : null}
							<div
								className={`btn-tobuy ${isPurchaseLimit ? 'c-bgc9' : (buyActive === "chooseSpec" ? 'btn-group btn-group-buy' : buyActive === 'cart' ? 'c-dpno' : '')}`}
								onTouchTap={isPurchaseLimit ? "" : () => {
									onClickBuy(buyActive)
								}}>立即购买
							</div>
						</div>
					</div>}
			</div> : null }
            </div>
		)
	}
}

export class Specs extends Component {
	initList() {
		let {isHasStore, specs, promotion, index, judgeSingleSku} = this.props;
		let {newData, selectArr} = this.props.retState;
		let oneRow = specs.values;
		let specKey = specs.spec_id;
		return oneRow.map((item, i) => {
			let spec = item.spec_value_id;
			let hasStore = isHasStore({spec, index}, newData, selectArr);
			return <li key={i}
					   onClick={(e) => {
						   !judgeSingleSku() && hasStore && this.props.specSelect(spec, index, specKey)
					   }}
					   className={ hasStore ? (judgeSingleSku() || selectArr[index] === spec ? "on" : "abled") : "disabled"}>
					<span title={item.text}>
					{item.show_type == "Text" || !item.image ? item.text :
						<span><img src={item.image} width="25" height="25"
								   style={{marginTop: "-4px"}}/> <span> {item.text} </span></span> }
					</span>
			</li>
		})
	}

	render() {
		let {specs} = this.props;
		return (
			<div className="color parameter">
				<span className="tit row-title">{specs.name}</span>
				<ul className="size_ul">{this.initList()}</ul>
			</div>

		)
	}
}

export class ExpectTax extends Component {
	constructor(props) {
		super(props);
		this.state = {
			rateShow: false
		}
	}

	getRate() {
		let {data, buyActive, promotion} = this.props;
		let {nowPrice, num} = this.props.retState;
		let isTradeFade = TradeFade(data);
		if (!isTradeFade || data.trade_type === "DOMESTIC") {
			return null
		}
		let rate = ((+data.tax_rate)* 10000/10000*100).toFixed(2);
        let rangeLen = String(nowPrice).split("-").length;//区间价去标准售价算运费
		nowPrice = buyActive === "groupBuy" ? promotion.promotion[0].rules.group_price : (rangeLen === 1 ? nowPrice : data.sell_price);
		num = buyActive === "groupBuy" ? 1 : num;
		let tax = (num * data.tax_rate * nowPrice);
		tax = (+tax.toFixed(2) + (parseFloat((tax - tax.toFixed(2)).toFixed(10)) >= 0.00001 ? 0.01 : 0)).toFixed(2);
		return (+tax ? <div>
			<div className="expect_tax" onClick={() => this.setState({rateShow: !this.state.rateShow})}>
				预计税费
				<span className={"icon_slide c-fr " + (this.state.rateShow ? "rotate" : "")}><img
					src="/src/img/icon/arrow/arrow-btm-icon.png"/></span>
				<span className="tax_count c-fr" style={{display: this.state.rateShow ? "none" : "block"}}>￥{tax}</span>
			</div>
			<div className="expect_tax_con disnon" style={{display: this.state.rateShow ? "block" : "none"}}>
				<div className="tax_count">￥{tax}</div>
				<div className="c-pl15 c-pr15">
					<div className="hd">
						<img src="/src/img/icon/checked-icon.png"/> 税率<span id="tax_cou">{rate}</span>%
					</div>
					<div className="tax_cont tax_cont1"> 按照国家规定，本商品适用于跨境综合税，税率为{rate}%， 实际结算税费请以提交订单时的应付总额明细为准。</div>
					<div className="hd">
						<img src="/src/img/icon/checked-icon.png"/> 税费计算
					</div>
					<div className="tax_cont">
						进口税费=商品完税价格*税率
					</div>
				</div>
			</div>
		</div> : null)
	}

	render() {
		return this.getRate()
	}
}

export class BuyModal extends Component {
	constructor(props) {
        super(props);
		this.state = {
			toCartClick: true,
		}
	}

	componentWillMount() {
		let flag = this.judgeSingleSku();
		if (flag) {
			this.changeBusinessPrice();
		}
	}

	//单规格或者无规格初始化价格和skuId 及规格属性
	changeBusinessPrice = () => {
		let {num, nowPrice, nowSkuId, storeNum, selectArr, specKey, originalPrice, min, once} = this.props.retState;
		let skus = this.props.promotion.info.skus;
		let specs = this.props.promotion.info.specs;
		let keys = Object.keys(skus), newSpecKey;
		keys.map((item) => {
			if (skus[`${item}`].store !== 0) {
				newSpecKey = item;
			}
		});
		newSpecKey = newSpecKey ? newSpecKey : keys[0];
		nowPrice = skus[newSpecKey].price;
		originalPrice = skus[newSpecKey].price;
		nowSkuId = skus[newSpecKey].sku_id;
		storeNum = skus[newSpecKey].store;
		selectArr = newSpecKey.split("_");
		specKey = Object.keys(specs);
		let newRetState = {...this.props.retState, nowPrice, nowSkuId, storeNum, selectArr, specKey, originalPrice};
		this.props.InitState(newRetState);
	};

	//判断是否是单规格(无规格)
	judgeSingleSku = () => {
		let {skus} = this.props.promotion.info, skusArr = [];
		let keys = Object.keys(skus);
		keys.map((item) => {
			if (skus[`${item}`].store !== 0) {
				skusArr.push(skus[`${item}`])
			}
		});
		if (keys.length === 1 || skusArr.length === 1) {
			return true;
		} else {
			return false
		}
	};

	addMinNum = (data) => {
		let {num, nowPrice, nowSkuId, selectArr, oldNum} = this.props.retState;
		// let cnum = num + data;
		num = oldNum = data;

		let newRetState = {...this.props.retState, num, oldNum, nowPrice};
		this.props.InitState(newRetState);
	};

	purchaseLimit = () => {
		let {trade_type} = this.props.data;
		if (this.props.retState.num > 1 && this.props.retState.nowSkuId && PurchaseLimit(trade_type)) {
			return this.props.retState.num * this.props.retState.nowPrice > 2000
		}
	};

	getActionData = (flag) => {
		let {retState, promotion, areaData, data: {shop_id, shop: {attr}}, itemId} = this.props, extraProArr = [],
			{user_id} = this.props.location.query;
		let addrList = this.props.mix && this.props.mix.addrList;
		promotion.promotion && promotion.promotion.map((item, i) => {
			extraProArr.push({"promotion_id": item.id, "role": "main_good", type: item.type})
		});
		let ret = {
			subscribe: [{
				"quantity": retState.num,
				"cart_id": 0,
				"sku_id": retState.nowSkuId,
				"item_id": itemId,
				"created_at": new Date().getTime(),
				"extra": {
					"promotion": extraProArr,
					"commission_user_id": user_id,   // 添加分佣用户id
          "commission_ucenter_id": getQueryString('comUcerterId') || undefined // 邀请关系
				}
			}],
		};
		ret = flag ? {
			...ret,
			buyMode: "fast_buy",
			bizMode: "online",
			bizAttr: "trmall",
			address: areaData.addressData
		} : {
			"item_id": itemId,
			"sku_id": retState.nowSkuId,
			"quantity": retState.num,
			"shop_id": shop_id,
			"extra": {
				// "promotion": extraProArr,
				"price": retState.originalPrice,
				"commission_user_id": user_id,
        "commission_ucenter_id": getQueryString('comUcerterId') || undefined // 邀请关系
			}
		};
		return ret
	};

	onClickCart = () => {
		let self = this;
		let flag = this.checkSpec();
        let {data:{title}} = this.props;
		if (flag) {
			tip.show({msg: "请选择规格"});
			return
		}
		self.setState({toCartClick: false});
		axios.request({
			...pageApi.toCart,
			params: this.getActionData()
		}).then(result => {
				self.setState({toCartClick: true});
				//更新购物车信息
				self.props.UpdateCartInfo(result.data.data);
				flyToCart();
				self.props.closeModal();
				//埋点操作
				let {item_id, quantity, sku_id} = this.getActionData();
				let extraInfo = setExtraInfoGwc(title, item_id, sku_id, quantity, result.status, result.data.code, '加入购物车成功');
				sdk.dispatch('click', document.getElementById('add-package'), extraInfo);
			}
		).catch(error => {
			let {status, data} = error.response;
            tip.show({msg: data.message || '服务器繁忙'});
            self.setState({toCartClick: true});
            //埋点操作
			let {item_id, quantity, sku_id} = this.getActionData();
			let extraInfo = setExtraInfoGwc(title, item_id, sku_id, quantity, status, data.code, data.message);
			sdk.dispatch('click', document.getElementById('add-package'), extraInfo);
		})
	};

	onClickBuy = (type) => {
		let {item_id} = this.props.location.query;
		let flag = this.checkSpec();
		if (flag) {
			tip.show({msg: "请选择规格"});
			return
		}
		let orderInitParams = this.getActionData(true);
		// this.props.OrderInitParams(orderInitParams);  //保存于redux  刷新页面会被重置
		sessionStorage.setItem("fast_buy", JSON.stringify(orderInitParams));
		browserHistory.push('/orderConfirm?item_id=' + item_id);
	};

	//判断选择规格属性
	checkSpec() {
		let {specKey, nowSkuId} = this.props.retState;
		let {specs} = this.props.promotion.info;
		let unSelectKey;
		if (!nowSkuId) {/* && !(typeof specs === "array")*/
			unSelectKey = Object.keys(specs).filter((val, index) => {
				return +val !== specKey[index]
			});
			return /*specs[unSelectKey[0]].name;*/ true
		} else {
			return false
		}
	}

	//判断库存
	isHasStore = (sku, data, select) => {
		return data && data.some((list, i) => {
				if (list.ids[sku.index] == sku.spec) {
					let newSelect = select.slice();
					if (newSelect[sku.index]) {
						delete newSelect[sku.index];
					}
					if (newSelect.every((item, j) => {
							return select[j] == list.ids[j]
						})) {
						return list.skus.store > 0
					} else {
						return false;
					}
				} else {
					return false;
				}
			});
	};

	//选择规格属性
	specSelect = (spec, index, key) => {
		let {retState} = this.props;
		let {skus} = this.props.promotion.info;
		let {realStore, activity_type} = this.props.promotion;
		let {selectArr, specKey, nowSku, storeNum, newData, nowSkuId, nowPrice, num, min, oldNum, deductPrice, originalPrice} = retState,
			newSpecKey;
		selectArr = selectArr.slice();
		if (selectArr[index] === spec) {
			delete selectArr[index];
			delete specKey[index]
		} else {
			selectArr[index] = spec;
			specKey[index] = key;
		}

		// 选中一个商品规格，更新数据
		newSpecKey = selectArr.join("_");
		if (selectArr.length == newData[0].ids.length && skus[newSpecKey]) {
			//更新对应skuId及其价格  sku 库存
			nowSku = skus[newSpecKey];
			nowSkuId = skus[newSpecKey].sku_id;
			nowPrice = skus[newSpecKey].price;
			originalPrice = skus[newSpecKey].price;
			storeNum = skus[newSpecKey].store;
			//更新num
			num = +min;//切换规格重置num为最小值
			num = num < storeNum ? num : storeNum;
            oldNum = num;
			deductPrice = skus[newSpecKey].deduct_price;
		} else {
			//未选中一个商品规格，价格设为标准价
			nowPrice = rangePrice(this.props.promotion, true);
			storeNum = realStore;
			nowSkuId = "";
			nowSku = "";
			deductPrice = "";
			originalPrice = "";
            num = +min
		}
		let RetState = {
			...this.props.retState,
			nowSku,
			selectArr,
			specKey,
			nowSkuId,
			nowPrice,
			num,
            min,
			oldNum,
			storeNum,
			deductPrice,
			originalPrice
		};
		this.props.InitState(RetState);
	};

	//失去焦点保存num
    importNum = (e) => {
        let val = +e.target.value,message;
        let {num, storeNum, nowPrice, once, oldNum, min, optionBtnShow} = this.props.retState;
        let { promotionData, promotion:{activity_type}} = this.props;
        let limitNum = activity_type === "FlashSale" ? promotionData[activity_type].rules.user_buy_limit - promotionData[activity_type].purchased_quantity : null;
        if (!val) {
            num = oldNum;
        }else if(once){
            if(val % once){
                num = oldNum
                message = `仅支持${once}倍购买`
            }else{
                if(val > storeNum){
                    num = oldNum = storeNum
                }else{
                    num = oldNum = val
                }
            }
        }else{
            if(val < min){
                message = `该商品${min}件起售`
                if(storeNum < min){
                    num = oldNum = storeNum
                }else{
                    num = oldNum
				}
			}else{
                if(storeNum < min){
                    num = oldNum = storeNum
                }else if(val > storeNum){
                    num = oldNum = storeNum
				}else{
                    num = oldNum = val
				}
			}
		}
		if(limitNum){
            num = oldNum = num > limitNum ? limitNum : num
		}
        message ? tip.show({msg:message}) : null
        optionBtnShow = true;
        let RetState = {...this.props.retState, num, oldNum, nowPrice, optionBtnShow};
        this.props.InitState(RetState);
    };
	//更改num
	changeNum = (e) => {
		let {num} = this.props.retState;
		let val = e.target.value;
        num = val.replace(/[^\d]/g, '');
		let RetState = {...this.props.retState, num};
		this.props.InitState(RetState);
	};
	//输入框获得焦点
    focusNum = () => {
        let {optionBtnShow} = this.props.retState;
        optionBtnShow = false
        let RetState = {...this.props.retState, optionBtnShow};
        this.props.InitState(RetState)
    };

	render() {
		let props = {
            focusNum: this.focusNum,
			addMinNum: this.addMinNum,
			changeNum: this.changeNum,
			importNum: this.importNum,
			isHasStore: this.isHasStore,
			onClickCart: this.onClickCart,
			onClickBuy: this.onClickBuy,
			specSelect: this.specSelect,
			judgeSingleSku: this.judgeSingleSku,
			purchaseLimit: this.purchaseLimit,
			retState: this.props.retState,  //数据状态
			promotion: this.props.promotion,
			promotionData: this.props.promotionData,
			data: this.props.data,
			buyActive: this.props.buyActive,
			isNonPayment: this.props.isNonPayment,
			...this.state
		};
		return (
			<NewModal isOpen={this.props.buyModal} onClose={this.props.closeModal}>
				<div className="action-buy-modal" style={judgeIphoneX() ? {paddingBottom: "34px"} : {}}>
					<BuyModalTitle {...props} />
					<BuyModalInfo {...props} />
					<BuyModalButton {...props} />
				</div>
			</NewModal>
		)
	}
}

export class Buy extends Component {
	active = (tab) => {
		this.props.UpdateBuyModal({buyModal: true, buyActive: tab});
	};
	isNonPayment = () => {
		let {activity_type, realStore} = this.props.promotion;
		if (activity_type) {  //还有机会[特卖]
			let {activity_sales, activity_store} = this.props.promotionData[`${activity_type}`];
			if (!realStore) {
				return activity_sales !== activity_store;
			}
		}
	};

	render() {
		return (
			this.props.mixStatus && this.props.proStatus ?
				<div>
					{this.props.choose ?
						<LinkChange className="choose-btn" onClick={() => {
							this.active("chooseSpec")
						}}></LinkChange>
						: this.props.data.is_charge ? null :
							this.props.data.status === "SHELVING" ?
								!this.isNonPayment() ?
									this.props.promotion.realStore ?
										<div className="action-btn-group c-fr">
											<LinkChange className="ui-btn  action-addtocart c-fl" onClick={() => {
												this.active("cart")
											}}>加入购物袋</LinkChange>
											<LinkChange className="ui-btn  action-buy-now c-fl" onClick={() => {
												this.active("buy")
											}}>立即购买</LinkChange>
										</div>
										:
										<div className="action-btn-group c-fr">
											<LinkChange type="button" className="ui-btn action-disable">已售罄</LinkChange>
										</div>
									:
									<div className="action-btn-group c-fr">
										<LinkChange type="button" className="ui-btn action-disable">还有机会</LinkChange>
									</div>
								:
								<div className="action-btn-group c-fr">
									<LinkChange type="button" className="ui-btn action-disable">已下架</LinkChange>
								</div>}
				</div> : <div className="action-btn-group c-fr">
				<span className="ui-btn  action-addtocart c-fl incomplete-addtocart">加入购物袋</span>
				<span className="ui-btn  action-buy-now c-fl incomplete-buy-now">立即购买</span>
			</div>
		)
	}
}

export let createBuyAction = function ({Buy}) {
	return class BuyAction extends PureComponent {
		render() {
			let {data, data: {shop: {attr}}, mix, cartNum, cartInfoStatus, mixStatus} = this.props;
			return (
				<div className="buy-action" style={judgeIphoneX() ? {height: "85px"} : {}}>
					{/*首页*/}
					<div className="collect serve_kf">
						<a onClick={(e)=>{
							e.preventDefault();
                            //miniProgramLogin();
                            miniProgramMall();
						}} className="save">
							<span className="details_kf"><img src="/src/img/icon/home-icon.png"/></span>
							<span className="icon-title">首页</span>
						</a>
					</div>
					{/*  客服 */}
					<div className="collect serve_kf">
						<CustomerService className="save" shopAttr={attr}>
							<span className="details_kf">
								<img src="/src/img/icon/serve-phone-icon.png"/>
							</span>
							<span className="icon-title">客服</span>
						</CustomerService>
					</div>
					{/* 收藏 */}
					<Collect mix={mix} data={data} mixStatus={mixStatus}/>
					{/* 购物袋 */}
					{cartInfoStatus && <TotopAndCart cartNum={cartNum}/>}
					{/* 加入购物袋 立即购买*/}
					<Buy {...this.props}/>
				</div>
			)
		}
	}
};

let BuyAction = createBuyAction({Buy});

//选择规格
export let createChooseSpec = function ({Buy}) {
	return class ChooseSpec extends PureComponent {
		render() {
			let {specs} = this.props.promotion.info;
			let {retState, data, promotion} = this.props;
			let chooseSpecs = chooseSpec(retState, specs);
			return (
				!(specs instanceof Array) ? <div className="choose-col">
					<div className="choose-spec c-fs13">
						<span
							className="c-mr15">{chooseSpecs.length > 0 ? "已选择 " : "选择 "}</span>{/*&& retState.nowSkuId*/}
						{chooseSpecs.length > 0 && chooseSpec(retState, specs)}{/* && retState.nowSkuId*/}
						<i className="icon icon-forward vertical-middle">
							<img src="/src/img/icon/arrow/arrow-right-icon.png"/>
						</i>
					</div>
					{data.status === "SHELVING" ? promotion.realStore ?
						<Buy {...this.props} choose={true}/> : null : null}
					<div className="gap bgf4"></div>
				</div> : null
			)
		}
	}
};
let ChooseSpec = createChooseSpec({Buy});

export class BarrageStripWrap extends Component {
	componentWillMount() {
		this.props.getBarrage()
	}

	render() {
		return (this.props.barrage ? <BarrageStrip data={this.props.barrage} reset={this.props.resetBarrage}/> : null)
	}
}

export let BarrageStripConnnect = connect(homePageState, homePageDispatch)(BarrageStripWrap);


export default class Detail extends Component {

	closeModal = () => {
		this.props.UpdateBuyModal({buyModal: false});
	};

	isNonPayment = () => {
		let {activity_type, realStore} = this.props.promotion;
		if (activity_type) {  //还有机会[特卖]
			let {activity_sales, activity_store} = this.props.promotionData[`${activity_type}`];
			if (!realStore) {
				return activity_sales !== activity_store;
			}
		}
	};

	componentWillUnmount() {
		window.sessionStorage.removeItem("dcpPageTitle");  //移除话务系统需要的商品标题
	}

	render() {
		let {location, data, mix, rate, recommend, promotion, cartNum, isLogin, pending, mixStatus, rateStatus, recommendStatus, proStatus, cartInfoStatus, retState, areaData, UpdateBuyModal, InitState, OrderInitParams, UpdateCartInfo, buyModal, buyActive, promotionData, intervalT} = this.props;
		let {item_id} = data;
		let props = {
			itemId: item_id,
			location: location,
			retState: retState,
			data: data,
			mix: mix,
			promotion: promotion,
			promotionData: promotionData,
			mixStatus: mixStatus,
			proStatus: proStatus,
			buyModal: buyModal,
			buyActive: buyActive,
			UpdateBuyModal: UpdateBuyModal,
			InitState: InitState,
			UpdateCartInfo: UpdateCartInfo,
			OrderInitParams: OrderInitParams,
			areaData: areaData
		};
		let buyModalProps = {
			...props,
			isNonPayment: this.isNonPayment(),
			closeModal: this.closeModal,
		};
		return (
			<div data-page="item-detail" id="item-details" ref="details">
				<BarrageStripConnnect/>
				<ItemNav />
				{mixStatus && proStatus && <BuyModal {...buyModalProps}/>}
				<div>
					<ScrollImageState data={data} ref="scrollImage"/>
					<PriceArea data={data} proStatus={proStatus} promotion={promotion} intervalT={intervalT}/>
					{proStatus && <ActiveArea promotion={promotion} shop={data.shop} retState={retState}/>}
					<div className="gap bgf4"></div>
					{mixStatus && proStatus && <ChooseSpec {...props}/>}
					{mixStatus && <SeverArea mix={mix} data={data} retState={retState}
											 areaData={areaData} isLogin={isLogin}
											 pending={pending}/>}
					<div className="gap bgf4"></div>
				</div>
				<div className="screen-rate">
					{rateStatus && <EvaluateArea rate={rate} itemId={item_id}/>}
					<div className="gap bgf4"></div>
					{recommendStatus && <RecommendArea recommend={recommend.items} orderNumber={recommend.orderNumber}/>}
                    {recommendStatus && <div className="gap bgf4"></div>}
					<ShopArea shop={data.shop}/>
				</div>
				<div className="screen-detail">
					<GoodsDetail data={data}/>
				</div>
				<BuyAction cartNum={cartNum} cartInfoStatus={cartInfoStatus} {...props}/>
			</div>
		)
	}
}
