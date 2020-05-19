import React, {Component} from 'react';
import {connect} from 'react-redux';
import {LoadingRound, Totop} from 'component/common.jsx';
import Navigator from 'component/modules/navigation';
import {Link} from 'react-router';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import axios from 'js/util/axios';
import {WXAPI,DIR} from 'config/index'
import './index.scss';
import {getCookie, clearCookie} from 'js/common/cookie';
import {addImageSuffix} from "src/js/util/index"

const pageApi = {
	initData: {url: `${WXAPI}/getBanner`, method: "get"},    //导航 banner  公告
	getOneItem: {url: `${WXAPI}/getChannel`, method: "get"},
	barrage: {url: `${WXAPI}/recentTenOrders`, method: "get"},  //弹幕
	getFreshGuide: {url: `${WXAPI}/promotion/getFreshGuide`, method: "get"}
};

const axiosCreator = actionAxios('homeIndex');
const createActions = concatPageAndType('homeIndex');
let mySwiperNav, mySwiperList;
class HomePage extends Component {
	constructor(props) {
		super(props);
	}

	static contextTypes = {
		router: React.PropTypes.object
	};

	componentWillMount() {
		if (this.props.load) {
			if (!this.props.flag) {
				this.props.getPageData();
				this.props.getBarrage();
			}
		}
	}

	componentDidMount() {
        $(window).scrollTop(this.props.disTop);
		echo.init({offset: 1500, throttle: 0});
		$(".home-index").css({minHeight: $(window).height(), background: '#f4f4f4'});
	}

	componentDidUpdate() {
		echo.init({offset: 1500, throttle: 0});
	}

	componentWillUnmount() {
		this.props.saveDistanceTop(this.props.activeIndex);
	}

	render() {
		const {load, listState, allSellOut, partSellOut, banner, list, oneList, activeIndex, barrage, resetBarrage, entrance, billboard, page, showNext, flag} = this.props;
		return <div data-page="home-index" style={{height: $(window).height()}}>
			{ load ?
				<LoadingRound/> :
				(allSellOut ?
					<div className="sell-out">
						<img src="/src/img/home/sell-out.png"/>
						<p>上架中，活动即将开始~</p>
					</div> :
					partSellOut ?
						<div>{<BannerSlide data={ banner.list }/>}
							<div className="sell-out1"><img src="/src/img/home/sell-out1.png"/></div>
						</div> :
						<div className="home-index" style={!!list.list.length ? {paddingTop: "41px"} : {}}>
							{!!list.list.length && <HeadNav data={ list.list } activeIndex={activeIndex}/>}
							{barrage && <BarrageStrip data={ barrage } reset={ resetBarrage }/> }
							{!activeIndex && <BannerSlide data={ banner.list } activeIndex={activeIndex}/>}
							{!activeIndex && <Channel data={ entrance }/> }
							{!activeIndex && billboard && <Billboard data={billboard}/>}
							{listState ?
								<GroupList data={ list } oneList={oneList} resetListData={this.props.resetListData}
										   getOneList={this.props.getOneList} activeIndex={activeIndex}
										   saveDistanceTop={this.props.saveDistanceTop}
										   page={page} addMoreItem={this.props.addMoreItem}
										   isSendingState={this.props.isSendingState}
										   isSending={this.props.isSending}
										   handleState={this.props.handleState} showNext={showNext}
										   handleFlagState={this.props.handleFlagState} flag={flag}
										   saveActiveIndex={this.props.saveActiveIndex}
										   index={this.props.index}/> : <LoadingRound/>}
						</div>)
			}
			<Totop />
			{/*<Navigator/>*/}
			{ load ? "" : <NewGift /> }
		</div>
	}
}

class NewGift extends Component {
	componentWillMount() {
		this.setState({
			is_new: false,
			is_login: false,
			guide: null,
			showModal: false,
			gfCookie: false
		})
		let gfCookie = this.judgeGiftCookie()
		if (gfCookie) {
			this.setState({
				showModal: true
			})
		}
		this.setState({
			gfCookie: gfCookie
		})
		axios.request(pageApi.getFreshGuide).then((result) => {
			let data = result.data.data
			let {guide, is_new, is_login} = data.data
			this.setState({
				is_new: is_new,
				is_login: is_login,
				guide: guide
			})
		})
	}

	setGiftCookie = () => {
		let nextDay = new Date()
		// let nextTime = 1 * 24 * 60 * 60 * 1000
		// nextDay.setTime(new Date().getTime() + nextTime)
		let nextDate = nextDay.getDate()
		let nextmonth = nextDay.getMonth() + 1
		let nextyear = nextDay.getFullYear()
		if (nextDate < 10) {
			nextDate = `0${nextDate}`
		}
		if (nextmonth < 10) {
			nextmonth = `0${nextmonth}`
		}
		if (nextyear < 10) {
			nextyear = `0${nextyear}`
		}
		let clearDay = new Date()
		let clearString = `${nextyear}/${nextmonth}/${nextDate} 23:59`
		//let clearString = `${nextyear}/${nextmonth}/${nextDate} 00:00`
		let clearTime = Date.parse(clearString)
		clearDay.setTime(clearTime)
		document.cookie = "gfTime" + "=" + encodeURI(clearTime) + ";expires=" + clearDay.toGMTString() + ';domain=.tairanmall.com;path=/';
	}
	judgeGiftCookie = () => {
		let _v = getCookie("gfTime")
		let _now = new Date().getTime()
		if (!_v) {
			this.setGiftCookie()
			return true
		} else {
			if (_now < _v) {
				return false
			} else {
				clearCookie("gfTime")
				this.setGiftCookie()
				return true
			}
		}
	}
	closeModal = () => {
		this.setState({
			showModal: false
		})
	}

	render() {
		let {guide, is_new, showModal, gfCookie} = this.state
		let _show = is_new && guide
		return (
			<div>
				{
					_show ? (
						!showModal ? (
							<a className="new-gift bounceOut" href={guide.mask_link}>
								<img src={guide.fresh_image} style={{width: '100%'}}/>
							</a>
						) : gfCookie ?
							<GiftModal image={guide.mask_image} link={guide.mask_link} close={this.closeModal}/> : ''
					) : ''
				}
			</div>
		)
	}
}
class GiftModal extends Component {
	constructor(props) {
		super(props);
		this.state = {
			imgload: false
		}
	}
	imgOnload = () => {
		this.setState({
			imgload: true
		})
	}
	render() {
		let {image, link} = this.props
		const {imgload} = this.state
		return (
			<div className="gift-modal">
				<div className="gift-box">
					<a href={link} style={{width: '100%', display: 'block'}}>
						<img src={image} className="big-img" onLoad={this.imgOnload} onError={this.imgOnload}/>
					</a>
					{
						imgload ?
							<div className="close" onClick={this.props.close}>
								<img src="./src/img/home/close.png"/>
							</div> : ''
					}
				</div>
			</div>
		)
	}
}

export class HeadNav extends Component {
	componentDidMount() {
		let self = this;
		let {data} = self.props;
		if (data.length > 1) {
			mySwiperNav = new Swiper(this.refs.swiperNav, {
				slidesPerView: 'auto',
				watchSlidesProgress: true,
				watchSlidesVisibility: true,
				paginationClickable: true,
				onTap: function () {
					mySwiperList.slideTo(mySwiperNav.clickedIndex);
				}
			});
		}

	}


	getNavList() {
		let {activeIndex, data} = this.props;
		return data && data.map((item, i) => {
				return <div className={`swiper-slide ${i === activeIndex ? "active" : ""}`}
							key={item.id}>
					<span>{item.nav_name}</span>
				</div>
			});
	}

	render() {
		return <div data-plugin="swiper" className="home-nav">
			<div className="swiper-container" id="swiper-containerNav" ref="swiperNav">
				<div className="swiper-wrapper">
					{this.getNavList()}
				</div>
			</div>
		</div>
	}
}

export class BarrageStrip extends Component {
	constructor(props) {
		super(props);
		this.state = {
			list: "",
			show: false
		}
	}

	componentWillMount() {
		let {data} = this.props;
		this.setState({list: data.shift()});
		this.addAnimate();
		let oneTimer = () => {
			this.timer = setTimeout(() => {
				let list = data.shift();
				if (list) {
					this.setState({list: list});
					this.addAnimate();
					oneTimer();
				} else {
					clearTimeout(this.timer);
					this.props.reset();
				}
			}, ( Math.ceil(Math.random() * 4) + 6 ) * 1000);
		};
		oneTimer();
	}

	componentWillUnmount() {
		clearTimeout(this.timer);
		clearTimeout(this.showTimer);
		clearTimeout(this.hideIimer);
	}

	addAnimate() {
		this.showTimer = setTimeout(() => {
			this.setState({show: true})
		}, 500);
		this.hideIimer = setTimeout(() => {
			this.setState({show: false})
		}, 3000);
	}

	scrollToPos(pos) {
		let windowH = $(window).height();
		let offsetH = document.body.offsetHeight;
		if (windowH + pos > offsetH) {
			pos = offsetH - windowH;
		}
		clearInterval(this.scrollTimer);
		this.scrollTimer = setInterval(() => {
			let top = $(window).scrollTop();
			if (top - pos > 200) {
				$(window).scrollTop(top - 200);
			} else if (pos - top > 50) {
				$(window).scrollTop(top + 200);
			} else {
				$(window).scrollTop(pos);
				clearInterval(this.scrollTimer);
			}
		}, 10);
	}

	render() {
		let {list} = this.state;
		if (!list) return null;
		return <div className="barrage-strip" data-plugin="barrage">

			<div className={`one-strip ${ this.state.show ? "active" : "" }`}>
				<img className="user-avatar" src="/src/img/icon/avatar/default-avatar.png"/>
				<div className="content">
					最新订单来自{ list.receiver_state }的{ list.user_name}
				</div>
			</div>
		</div>
	}
}

//频道列表
class Channel extends Component {
	getHtml = () => {
		return this.props.data.list && this.props.data.list.map((item, i) => {
				return <a className="wrapper" href={item.add_link} key={i}>
					<img src={item.entrance_icon}/>
				</a>
			})
	};

	render() {
		let {data} = this.props;
		return (
			!!data.list.length ?
				<div className="channel c-clrfix">
					{this.getHtml()}
				</div> : null
		)
	}
}

//公告
class Billboard extends Component {
	componentDidMount() {
		let self = this;
		let {data: {list}} = self.props;
		if (list.length > 1) {
			this.swiper = new Swiper(this.refs.swiperBillboard, {
				autoplay: 3000,
				autoplayDisableOnInteraction: false,
				direction: 'vertical',
				loop: true,
				noSwiping: true,
				noSwipingClass: 'stop-swiping',
			});
		}
	}

	getHtml = () => {
		let {list} = this.props.data;
		return list && list.map((item, i) => {
				return <a className="swiper-slide stop-swiping"
						  href={item.type === 10 ? "/notice?id=" + item.id : item.content} key={i}>
					<div className="active">
						{item.type === 1 ? <span className="btn">公告</span> : <span className="btn">活动</span>}
						<span className="title">{item.title}</span></div>
				</a>
			});
	};

	render() {
		let {list} = this.props.data;
		return list && !!list.length ? <div data-plugin="swiper" className="bill-board">
			<img src="/src/img/home/hot.jpg"/>
			<span className="bl"></span>
			<div className="swiper-container" ref="swiperBillboard">
				<div className="swiper-wrapper">
					{this.getHtml()}
				</div>
				<div className="swiper-pagination"></div>
			</div>
		</div> : null
	}
}

class BannerSlide extends Component {
	componentDidMount() {
		let self = this;
		let {data} = this.props;
		if (data.length > 1) {
			this.swiper = new Swiper(this.refs.swiperBanner, {
				autoplay: 3000,
				autoplayDisableOnInteraction: false,
				pagination: '.swiper-pagination',
				paginationType: 'fraction',
				loop: true
			});
		}
	}

	getHtml() {
		return this.props.data && this.props.data.map((item, i) => {
				return <a className="swiper-slide" href={item.link} key={i}>
					<img src={item.banner_image}/>
				</a>
			});
	}

	render() {
		let {data} = this.props, style;
		data.length > 1 ? style = {display: "block"} : style = {display: "none"};
		return (
			!!data.length ? <div data-plugin="swiper" className="home-banner">
				<div className="swiper-container" ref="swiperBanner">
					<div className="swiper-wrapper">
						{this.getHtml()}
					</div>
					<div className="swiper-pagination" style={style}></div>
				</div>
			</div> : null
		)
	}
}

class GroupList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			currentPage: this.props.page.current_page,
		}
	}

	componentWillReceiveProps(newProps) {
		this.state.currentPage = newProps.page.current_page;
	}

	componentWillUnmount() {
		$(window).unbind('scroll.loadmore');
	}

	componentDidMount() {
		let self = this;
		let {data, getOneList, addMoreItem, activeIndex, index} = self.props, indexA;
		if (data.list.length > 1) {  //少于一个类目 不初始化swiper
			mySwiperList = new Swiper(this.refs.swiperList, {
				initialSlide: activeIndex ? activeIndex : "",
				resistanceRatio: 0,
				onSlideChangeStart: function () {
					if (self.props.flag) {
						self.props.handleFlagState(false);  //改变flag的状态
						self.props.isSendingState(false);
					}
					indexA = data["list"][mySwiperList.activeIndex].id;
					self.props.saveActiveIndex(mySwiperList.activeIndex);
					if (!self.props.flag) {
						self.props.resetListData();
						self.props.handleState(false);
						self.props.getOneList(indexA, 1);
					}
					self.updateNavPosition();
					let sindex = (mySwiperList.activeIndex - 2 > 0) ? (mySwiperList.activeIndex - 2) : 0;
					mySwiperNav.slideTo(sindex);
					$(window).scrollTop(0);
				},
				onSlideChangeEnd: function (swiper) {
					mySwiperNav.update();
				}
			});
		}

		$(window).bind('scroll.loadmore', function () {
			if (indexA == null) {  //这里不清楚为什么这个写
				indexA = data.list[0].id;
			}
			let $this = $(this);
			let scrollH = $this.scrollTop();
			let scrollHeight = $("#swiper-containerList").height() - $(window).height();
			if (scrollH > scrollHeight) {
				if ($('.add span').html() === "下拉加载更多") {
					self.addM(indexA, self.state.currentPage + 1)
				}
			}
		});
	}

	addM = (index, current_page) => {
		this.props.isSendingState(true);
		this.props.addMoreItem(index, current_page);
	};

	updateNavPosition = () => {
		$('#swiper-containerNav .active').removeClass('active');
		let activeNav = $('#swiper-containerNav .swiper-slide').eq(mySwiperList.activeIndex).addClass('active');
		if (!activeNav.hasClass('swiper-slide-visible')) {
			if (activeNav.index() > mySwiperNav.activeIndex) {
				let thumbsPerNav = Math.floor(mySwiperNav.width / activeNav.width()) - 1;
				mySwiperNav.slideTo(activeNav.index() - thumbsPerNav)
			}
			else {
				mySwiperNav.slideTo(activeNav.index())
			}
		}
	};

	render() {
		let {oneList, data: {list}, activeIndex, flag, showNext, page, isSending} = this.props;
		let cN;
		if (activeIndex % 5 === 0) {
			cN = "group-title c-clrfix bg1"
		} else if (activeIndex % 5 === 1) {
			cN = "group-title c-clrfix bg2"
		} else if (activeIndex % 5 === 2) {
			cN = "group-title c-clrfix bg3"
		} else if (activeIndex % 5 === 3) {
			cN = "group-title c-clrfix bg4"
		} else if (activeIndex % 5 === 4) {
			cN = "group-title c-clrfix bg5"
		}
		let html = list && list.map((item, i) => {
				if (i === activeIndex) {
					return <div className="swiper-slide" key={item.id}>
						{!list[activeIndex].show_default_img ?
							<img className="channel-img" src={list[activeIndex].channel_image}></img> :
							<div className={cN}>
								<h3>{list[activeIndex].nav_name}</h3>
							</div>}
						{!!oneList.item_list.length ? <GroupColumn data={oneList.item_list} type={item.style}/> :
							<div className="c-tc" style={{width: "100%", marginTop: "80px"}}>
								<img className="no-goods" src="/src/img/home/no-goods.png"/>
							</div>}
					</div>
				} else {
					return <div className="swiper-slide" key={item.id}>
						<LoadingRound/>
					</div>
				}
			});
		return (<div data-plugin="swiper" className="group-list">
			<div className="swiper-container" id="swiper-containerList" ref="swiperList" style={{zIndex: 0}}>
				<div className="swiper-wrapper">
					{html}
				</div>
			</div>
			{showNext && <NoMoreItem data={ list } page={page}
									 isSending={isSending}
									 activeIndex={activeIndex}
									 flag={flag}/>}
		</div>)
	}
}

class GroupColumn extends Component {
	componentDidMount() {
		echo.init({offset: 1500, throttle: 0});
	}

	render() {
		return <div className="group-body">
			{this.props.data && this.props.data.map((list, i) => {
				return <GroupItem data={list} key={i} type={this.props.type}/>
			})}
		</div>
	}
}

class GroupItem extends Component {
	render() {
		const {data} = this.props;
		let priceInt, priceMod;
		if (data.is_group) {
			priceInt = String(data.group_data.group_price).split(".")[0];
			priceMod = String(data.group_data.group_price).split(".")[1];
		} else {
			priceInt = String(data.sell_price).split(".")[0];
			priceMod = String(data.sell_price).split(".")[1];
		}
		let type = (this.props.type === 10) ? 'goods3' : (this.props.type === 20 ? "goods1" : "goods2");
		return data.is_group ? <div className={type}>
			<Link to={`${DIR}/item?item_id=${ data.id }`}>
				<div className="goods-img">
					{data.group_data.group_type && data.group_data.group_type === "ROOKIE_GROUP" ?
						<img className="new-group" src="src/img/activity/new-group.png"/> : ""}
					<img data-echo={addImageSuffix(data.primary_image, '_m')}
						 src="/src/img/icon/loading/default-watermark.png"/>
					{ data.store === 0 ? <div className="sale-out">抢完了</div> : ""}
				</div>
			</Link>
			<div className="goods-msg">
				<div className="goods-m">
					<ul className="label c-clrfix">
						{data.trade_type === 10 ? "" : (data.trade_type === 30 ?
							<li className="blue">跨境保税</li> :
							<li className="yellow">海外直邮</li>)}
					</ul>
					<Link to={`${DIR}/item?item_id=${ data.id }`}>
						<div className="title">{type === 'goods3' &&
						<span className="label1">
							{data.trade_type === 10 ? "" : (data.trade_type === 30 ?
								<span className="blue">跨境保税</span> :
								<span className="yellow">海外直邮</span>)}</span>}<span>{data.title}</span></div>
						<div className="title-add">{data.sub_title}</div>
					</Link>
				</div>
				<div className="price">
					<div className="now c-fs12">
						{type != "goods2" ? <i className="group c-mr2">{data.group_data.group_person}人团</i> : ""}
						{priceMod > 0 ? <span> ¥
									<span className="c-fs19">{priceInt}</span>
									<span style={{fontWeight: 700}}>.{priceMod}</span>
							</span> : <span> ¥
									<span className="c-fs19">{priceInt}</span>
									<span style={{fontWeight: 700}}></span>
							</span>}
					</div>
					{data.is_group ? (<span
						className={type === "goods1" ? "c-c999 c-fs12 buy-separately" : "c-c999 c-fs12"}>{type === "goods1" ? "单独购买" : (type === "goods3" ? "单买" : "") }
						<del> ¥{+data.sell_price }</del></span>) : (<span
						className={type === "goods1" ? "c-c999 c-fs12 buy-separately" : "c-c999 c-fs12"}>{type === "goods1" ? "单独购买" : (type === "goods3" ? "单买" : "")}
						<del> ¥{+data.sell_price }</del></span>)}
					{type != "goods2" ? <Link className="btn" to={`${DIR}/item?item_id=${ data.id }`}>
						{!!data.store ? "去开团" : "去看看"}
						<i className="arrow-right-white-icon"></i>
					</Link> : ""}
				</div>
			</div>
		</div> : null
	}
}


class NoMoreItem extends Component {
	render() {
		let {data, activeIndex, page: {current_page, total_page}} = this.props;
		let length = this.props.data.length;
		let html, index;
		if (length === 1) {
			html = "";
		} else {
			if (activeIndex >= length - 1) {  //最后一个类目  返回第一个类目
				html = data[0].nav_name;
				index = 0;
			} else {
				html = data[activeIndex + 1].nav_name;
				index = activeIndex + 1;
			}
		}
		return (
			<div className="add">
				{!!total_page && current_page !== total_page ? (this.props.isSending ?
					<span className="loading">加载中...</span> :
					<span style={{height: "30px", lineHeight: "50px"}}>下拉加载更多</span>) :
					<span className="go-next" onClick={() => {
						length !== 1 && mySwiperList.slideTo(index);
					}}>{length === 1 ? "别拉了，我是有底线的~" : ("继续浏览 " + html)} <i
						className="arrow-right-black-icon"> </i></span>}
			</div>
		)
	}
}

export function homePageState(state, props) {
	return {
		...state.homeIndex
	}
}

export function homePageDispatch(dispatch, props) {
	let navId, oneList;
	return {
		resetListData: function () {
			dispatch(createActions('resetListData'));
		},
		getPageData: function () {
			axios.request({...pageApi.initData, params: {display_path: 10}})
				.then(({data}) => {
					dispatch(createActions('initData', {result: data.data}));
					navId = data.data.list.list[0] && data.data.list.list[0].id;
					if (navId) {
						dispatch(axiosCreator('oneList', {
							...pageApi.getOneItem,
							params: {nav_id: navId, page: 1}
						}));
					}
				}).catch(error => {
				console.log(error);
			});
		},
		getOneList: function (navId, page) {
			dispatch(axiosCreator('oneList', {
				...pageApi.getOneItem,
				params: {nav_id: navId, page: page}
			}));
		},
		addMoreItem: function (navId, page) {
			axios.request({...pageApi.getOneItem, params: {nav_id: navId, page: page}})
				.then(result => {
					if (result.data.code !== 0) {
						return;
					}
					dispatch(createActions('addMoreItem', {result: result.data, isSending: false}));
				})
		},
		getBarrage: function () {
			dispatch(axiosCreator('barrage', pageApi.barrage));
		},
		resetBarrage: function () {
			dispatch(createActions('resetBarrage'));
			dispatch(axiosCreator('barrage', pageApi.barrage));
		},
		saveDistanceTop: function (index) {
			dispatch(createActions('saveTop', {value: $(window).scrollTop(), index: index, flag: true}));
		},
		isSendingState: function (state) {
			dispatch(createActions('isSendingState', {isSending: state}));
		},
		handleState: function (state) {
			dispatch(createActions('handleState', {showNext: state}));
		},
		handleFlagState: function (state) {
			dispatch(createActions('handleFlagState', {flag: state}));
		},
		saveActiveIndex: function (activeIndex) {
			dispatch(createActions('saveActiveIndex', {activeIndex: activeIndex}));
		}
	}
}

export default connect(homePageState, homePageDispatch)(HomePage);