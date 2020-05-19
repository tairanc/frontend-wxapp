import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';
import {Link, browserHistory} from 'react-router';
import {LoadingRound} from 'component/common';
import {PopupTip} from 'component/modal';
import {dateUtil} from "js/util/index";
import {WXAPI} from 'config/index';
import Popup from 'component/modal2';
import axios from 'js/util/axios';
import './coupon.scss';

const pageApi  = {
	getCouponList: { url: `${WXAPI}/promotion/getCouponList` },  //获取优惠券列表
    exchangeCoupon: { url: `${WXAPI}/promotion/exchangeCode` }  //兑换优惠券
};

export default class CouponList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			couponData: [],
			update: false,
			listUpdate: false,
			type: 1,
			showStatus: false,
			page: 2,
			hasMore: true,
			sending: false
		};
		this.showMsg = ""
	};

	static contextTypes = {
		store: React.PropTypes.object,
		router: React.PropTypes.object
	};

	componentWillMount() {
		document.title = "优惠券";
	}

	componentDidMount() {
		this.getMsg(1);
	};

	getMsg = (status) => {
		this.setState({
			listUpdate: false,
			page: 2
		});

		axios.request({
			...pageApi.getCouponList,
			params:{
                status: status,
				page: 1,
				page_size: 10
			}
		}).then(({data})=>{
				let { coupon } = data.data;
			this.setState({
                couponData: coupon.data,
                hasMore: coupon.data.length >= 10,
                update: true,
                listUpdate: true,
                type: status
            });
        }).catch(error=>{
			console.log(error);
			this.setState({ sending: false });
            if (error.response && error.response.data.code===401) {
                browserHistory.replace('/login?redirect_uri=%2FcouponList');
            } else {
                Popup.MsgTip({msg: error.response.data.message||'服务器繁忙'});
            }
        });
	};
	//添加数据
	addMsg = (status) => {
		this.setState({ sending: true });

        axios.request({
            ...pageApi.getCouponList,
            params:{
                status: status,
                page: this.state.page,
                page_size: 10
            }
        }).then(({data})=>{
                let { coupon } = data.data;
            this.setState({
                couponData: this.state.couponData.concat(coupon.data),
                    hasMore: coupon.data.length >= 10,
                    sending: false,
                    type: status,
				page: this.state.page + 1
                });
        }).catch(error=>{
            console.log(error);
	        this.setState({ sending: false });
            Popup.MsgTip({msg: error.response.data.message||'服务器繁忙'});
        });
	};

	hideModal = () => {
		this.setState({showStatus: false})
	};

	render() {
		let {type, couponData, showStatus, hasMore, sending} = this.state;
        return (
			this.state.update ?
				<div data-page="coupon-list" style={{minHeight: $(window).height()}}>
					<section id="coupon-list" ref="coupon">
						<CouponNav  fn={this.getMsg}/>
						{this.state.listUpdate ?
							<List fn={this.addMsg} data={couponData} type={type} hasMore={hasMore} sending={sending}/> :
							<LoadingRound />}
					</section>
					<PopupTip active={showStatus} onClose={this.hideModal} msg={this.showMsg}/>
				</div>
				: <LoadingRound />
		)
	}
}

//nav
class CouponNav extends Component {
	componentDidMount() {
		let {fn} = this.props;
		$('.coupon-nav li').click(function (e) {
			if ($(this).attr('class') === "active-one swiper-slide") {
				//..
			} else {
				$(this).addClass('active-one').siblings().removeClass('active-one');
				let status = parseInt($('.active-one').attr('id'));
				fn(status);
			}

		});
	};

	render() {
        return (
			<ul className="coupon-nav c-c35 c-tc c-fs14">
				<li className="active-one swiper-slide" id="1">未使用</li>
				<li className="swiper-slide" id="0">已使用</li>
				<li className="swiper-slide" id="2">已过期</li>
			</ul>
		)
	}
}

//兑换
class Exchange extends Component {
	constructor() {
		super();
		this.state = {showStatus: false};
		this.showMsg = ""
	}

	componentWillMount() {
		this.setState({
			canExchange: true
		})
	};

	componentDidMount() {
		$('.exchange input').on('input', function (e) {
			if ($(this).val()) {
				$(this).next().css({'background-color': '#e60a30'});
			} else {
				$(this).next().css({'background-color': '#c9c9c9'});
			}
		});

		$('.exchange button').click( ()=>{
			let txt = $('.exchange input').val();
			if (txt != '') {
				if (this.state.canExchange) {
					this.setState({
						canExchange: false
					});
					//兑换优惠券
                    axios.request({
						...pageApi.exchangeCoupon,
						params: {
                            exchange_code: txt,
							source: 'exchange'
						}
					}).then(()=>{
	                    this.setState({  canExchange: true });
	                    $('.exchange input').val('');
	                    Popup.MsgTip({msg:'兑换成功'});
	                    setTimeout(function () {
		                    history.go(0);
	                    }, 1000);
					}).catch(error=>{
	                    this.setState({  canExchange: true });
                        $('.exchange input').val('');
                        Popup.MsgTip({msg: error.response.data.message||'服务器繁忙'});
                    });
				}
			}
		});
	};

	hideModal = () => {
		this.setState({showStatus: false})
	};

	render() {
		let {showStatus} = this.state;
		return (
			<div>
				<div className="exchange">
					<input type="text" placeholder="请输入兑换码"/>
					<button>兑换</button>
				</div>
				<PopupTip active={showStatus} onClose={this.hideModal} msg={this.showMsg}/>
			</div>
		)
	}
}

//购物券列表
class List extends Component {
	componentDidMount() {
		let type = parseInt($('.active-one').attr('id'));
		this.setState({
			type: type
		})
	};

	render() {
		let {data, type, fn, hasMore, sending} = this.props;
		let coupons = data.map(function (item, i) {
			return <EachCoupon data={item} type={type} key={i}/>
		});
		return (
			<div className="list-contrl">
				{type === 1 && <Exchange />}
				<div className="each-list">
					{!!data.length ? coupons : <NoCoupon />}
				</div>
				{!!data.length && <NoMoreCoupon type={type} fn={fn} hasMore={hasMore} sending={sending}/>}
			</div>
		)
	}
}

//无购物券
class NoCoupon extends Component {
	render() {
		return (
			<div className="no-coupon">
				<img src="./src/img/evaluate/no-coupon.png"/>
			</div>
		)
	}
}

//列表内单个购物券
class EachCoupon extends Component {
	constructor(props) {
		super(props);
		this.state = {showStatus: false};
		this.showMsg = "";
	}

	getDate = (tm) => {
		let tt = new Date(parseInt(tm) * 1000);
		let ttyear = tt.getFullYear(),
			ttmonth = parseInt(tt.getMonth()) + 1,
			ttday = tt.getDate();
		let couponTime = ttyear + "." + ttmonth + "." + ttday;
		return couponTime;
	};
	noUse = () => {
		this.showMsg = "还未到使用时间哦~";
		this.setState({showStatus: true});
	};

	hideModal = () => {
		this.setState({showStatus: false})
	};
	
	getPrice=(num)=>{
		num = parseFloat(num);
		let a=num.toString().split(".");
		if(a.length==1){
			num=<span>{a[0]}<span className="c-fs14">.00</span></span>;
			return num;
		}
		if(a.length>1){
			if(a[1].length<2){
				num=<span>{a[0]}<span className="c-fs14">.{a[1]}0</span></span>;
			} else {
				num=<span>{a[0]}<span className="c-fs14">.{a[1]}</span></span>;
			}
			return num;
		}
	};

	//格式化时间
	formateDate = (T)=>{
		let dateAndTime = T.split(' ');
		let data = dateAndTime[0].split('-').join('/').substring(2),
			time = dateAndTime[1].substring(0,5);
		return data+' '+time;
	};

	//获取时间戳
	getTime  =  (T)=>{
		return new Date(T.replace(/-/g,'/')).getTime();
	};

	render() {
		let {showStatus} = this.state;
		let {data, type} = this.props;
		const couponTypeArr = ['店铺券','跨店券','平台券','免单券'];
		let startTime = this.formateDate(data.use_start_time),
			endTime = this.formateDate(data.use_end_time);

		const couponStart = this.getTime(data.current_time) > this.getTime(data.use_start_time);
		const couponLink = data.type=== 4 ?
			`/item?item_id=${data.item_id}`
			:
			`/searchResult?coupon_id=${data.coupon_id}${data.type===0 && data.shop_attr===3 ?'&type=biz':''}`;  //店铺券并且是企业购商品跳转链接中有type属性

		return (
			<div className="each-coupon c-pr">
				<div
					className={(type === 1) ? (data.isset_limit_money ? "coupon-bg" : "coupon-bg coupon-bg2") : "coupon-bg coupon-bg3"}>
					<div className="coupon-left c-fl">
						<h2 className={(type === 1) ? (data.isset_limit_money ? "c-cdred" : "c-cdyellow") : "c-c999"}>
							¥ <span className={String(parseInt(data.deduct_money)).length < 4 ? " price-a " : " price-b "}
											style={{lineHeight: '46px'}}>
								{data.type === 4 ? this.getPrice(data.deduct_money) :parseInt(data.deduct_money)}
							</span>
						</h2>
						<p className="c-c999">
							{data.type === 4 ?('原价'+data.limit_money):('满'+(data.limit_money ? parseFloat(data.limit_money) : '')+'使用')}
						</p>
					</div>
					<div className={`coupon-right c-fl ${data.isset_limit_money ? '':'coupon-right2'}`}>
						<p className="c-c999 coupon-title">
							<span className="c-fs16 c-c35">
								{couponTypeArr[data.type]}
							</span>
						</p>
						<div className="c-c999 c-pr title-txt">
							{data.apply_text}
							<span className="c-pa disc-dot"></span>
						</div>
						<p className="c-fs10 c-c999 c-fs10" style={{
							lineHeight: '14px',
							display: 'block',
							paddingTop: '12px'
						}}>{startTime}至{endTime}</p>
						
					</div>
				</div>
				<PopupTip active={showStatus} onClose={this.hideModal} msg={this.showMsg}/>

				{type === 1 && <Link to={ couponLink }>
					<div className={`use-coupon ${type === 1 ? (data.isset_limit_money ? '' : 'use-coupon2') : 'use-coupon3'}`}>
						{`${couponStart? '去使用':'去查看'}`}
					</div>
				</Link>}
			</div>
		)
	}
}

//没有更多
class NoMoreCoupon extends Component {
	componentWillUnmount() {
		$(window).unbind('scroll.loadmore');
	}

	componentDidMount() {
		let {fn} = this.props;
		let page = 1,
			status = parseInt($('.active-one').attr('id'));
		let self = this;
		$(window).bind('scroll.loadmore', function () {
			let $this = $(this);
			let scrollH = $this.scrollTop();
			let scrollHeight = $(".list-contrl").height() - $(window).height();
			if (scrollH > scrollHeight) {
				if (self.props.hasMore && (!self.props.sending)) {
					fn(status);
				}
			}
		});
	};

	render() {
		let {hasMore, sending, type} = this.props;
		return (
			<div className="no-more">
				<div className="line c-pr"></div>
				<div className="txt c-c999 c-tc c-fs14">{hasMore ? (sending ? '加载中...' : '下拉加载更多') :  (type === 2? '仅保留90天内的记录' : '别拉了，我是有底线的~')}</div>
			</div>
		)
	}
}

