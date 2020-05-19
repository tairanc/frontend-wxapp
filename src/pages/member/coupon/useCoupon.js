/**
 * Created by hzhdd on 2018/4/8.
 */
import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';
import {browserHistory} from 'react-router';
import {connect} from 'react-redux';
import {concatPageAndType, actionAxios} from 'js/actions/actions';
import {Shady, LoadingRound} from 'component/common';
import {NewModal} from 'component/modules/modal/modal';
import {NoCoupon} from 'component/modules/empty/NoCoupon';
import {tip} from 'component/modules/popup/tip/tip';
import {dateUtil} from "js/util/index";
import {OneItem, preventScroll} from '../../trade/orderConfirm/index'
import {WXAPI, DIR} from 'config/index'
import axios from 'js/util/axios';

import './coupon.scss';
//接口请求
const pageApi = {
	couponRecalculate: {url: `${WXAPI}/order/applyCouponRecalculate`, method: "post"},  //应用卡券快速重计分摊接口
};

const createActions = concatPageAndType("orderConfirm");

class UseCoupon extends Component {
	componentDidMount() {
		$(window).scrollTop(0);
	}

	render() {
		const {usable_coupons, unusable_coupons} = this.props.couponList;
		const {couponSelect, changeItemModal, itemModal} = this.props;
		if (this.props.itemModal) {
			preventScroll(true)
		} else {
			preventScroll(false)
		}
		return (
			<div data-page="use-coupon" className="use-coupon">
				<div style={{minHeight: $(window).height(), backgroundColor: "#f4f4f4", paddingTop: "10px"}}>
					<div className="non-use-coupon" onClick={ () => {
						this.props.onSelectCoupon(null)
					} }>
						<span className="c-c35 c-fs16">不使用优惠券</span>
						{ !couponSelect.code ? <i className="current-green-icon current-icon"> </i> :
							<i className="current-no-icon current-icon"> </i> }
					</div>
					<div className="coupon">
						<div className="coupon-body">
							<CouponList type="val" usable_coupons={ usable_coupons } unusable_coupons={unusable_coupons}
										couponSelect={ couponSelect }
										changeItemModal={changeItemModal} itemModal={itemModal}
										onSelectCoupon={this.props.onSelectCoupon}/>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

//优惠券列表
class CouponList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			couponData: {}
		}
	}

	//格式化时间
	formateDate = (T) => {
		let dateAndTime = T.split(' ');
		let data = dateAndTime[0].split('-').join('/').substring(2),
			time = dateAndTime[1].substring(0, 5);
		return data + ' ' + time;
	};

	getDetail = (item, i, type) => {
		//type  表示券的不同状态 可用 不可用
		let colour = (type ? ( item.isset_limit_money ? "red" : "yellow") : "grey");
		let {couponSelect} = this.props;
		let apply_records = !type && Object.values(item.apply_records);
		if (!type && apply_records.length > 0) {
			let couponId = item.coupon_id;
			this.state.couponData.couponId = apply_records;
		}
		let use_start_time = new Date(item.use_start_time.replace(/-/g, '/')).getTime();
		let current_time = new Date(item.current_time.replace(/-/g, '/')).getTime();
		//item.type 优惠券类型：0 店铺券；1 跨店券； 2 平台券；4 免单券
		return (
			<div key={`coupon${i}`}>
				<div className={`one-coupon g-row-flex ${colour}`} style={!type ? {marginBottom: 0} : {}}
					 onClick={ () => {
						 type && this.props.onSelectCoupon({
							 code: item.coupon_code,
							 limit: +item.limit_money,
							 desc: item.type === "4" ? +item.discount_money : +item.deduct_money
						 })
					 } }>
					<div className={`left ` + colour }>
						<p className="one">
							¥<b>{item.type === "4" ? "0.01" : parseInt(item.deduct_money)}</b>{/*this.getPrice(item.price) */}
						</p>
						<p
							className="two">{item.type === "4" ? ('原价' + parseFloat(item.limit_money)) : ('满' + item.limit_money + '使用')}</p>
					</div>
					<div className="right g-col-1">
						<p className="coupon-name"><span
							className={ colour }>{item.type === "4" ? "免单券" : (item.type === "0" ? "店铺券" : (item.type === "1" ? "跨店券" : "平台券"))}</span>
						</p>
						<p className="two">• &nbsp;{ item.apply_text }</p>
						<p>{this.formateDate(item.use_start_time)}至{this.formateDate(item.use_end_time)}</p>
					</div>
					{ type && (couponSelect.code === item.coupon_code ?
						<i className="current-green-icon current-icon"> </i> :
						<i className="current-no-icon current-icon"> </i>) }
				</div>
				{!type && <div className="invalid-bottom">
					<span
						className="left-msg c-fs12 c-cf55">{use_start_time > current_time ? "优惠券未到使用时间" : (item.balance ? `还差 ¥ ${parseFloat(item.balance)} 可用该券` : "订单中无可用商品")}</span>
					{/*{apply_records.length > 0 && <span className="c-fr" onClick={() => {
					 this.props.changeItemModal(true);
					 }}>查看可用商品</span>}*/}
				</div>}
			</div>
		);
	};

	render() {
		const {usable_coupons, unusable_coupons} = this.props;
		const usableCouponsList = usable_coupons && usable_coupons.map((item, i) => {
				return this.getDetail(item, i, true)
			});
		const unusableCouponsList = unusable_coupons && unusable_coupons.map((item, i) => {
				return this.getDetail(item, i, false)
			});
		const itemList = this.props.itemModal && this.state.couponData.couponId.map((item, i) => {
				return <OneItem key={i}
								data={item}
								val={true}
								noLabel={true}
				/>;
			});
		return (
			<div className="coupon-list">
				{this.props.itemModal && <NewModal isOpen={this.props.itemModal} title="订单中可用商品"
												   onClose={(e) => {
													   e.stopPropagation();
													   this.props.changeItemModal(false)
												   }}>
					<div className="item-modal">
						{itemList}
						<div className="button-wrapper">
							<button className="button" onClick={(e) => {
								e.stopPropagation();
								this.props.changeItemModal(false)
							}}>确定
							</button>
						</div>
					</div>
				</NewModal>}
				{!(usableCouponsList.length + unusableCouponsList.length) &&
				<div className="c-tc no-coupon">
					<img src={ require('img/orderConfirm/trcNoCoupon.png')} width="100" height="100"/>
					<p className="c-cc9 c-fs16 c-mt15">您没有相关优惠券哦</p>
				</div>}
				{usableCouponsList}
				{!!unusableCouponsList.length && <div className="coupon-tip">本订单不可用的优惠券</div>}
				{unusableCouponsList}
			</div>
		)
	}
}

function useCouponState(state, props) {
	return {
		...state.orderConfirm,
	}
}

function useCouponDispatch(dispatch, props) {
	return {
		dispatch,
		changeItemModal: (flag) => {
			dispatch(createActions('changeItemModal', {flag: flag}));
		}
	}
}

function useCouponProps(stateProps, dispatchProps, props) {
	let {item_id} = props.location.query;
	let {dispatch} = dispatchProps;
	return {
		...stateProps,
		...dispatchProps,
		...props,
		//选择优惠券
		onSelectCoupon: (couponSelect) => {
			if (!couponSelect) {
				couponSelect = {code: "", limit: "", desc: 0};
			}
			dispatch((dispatch, getState) => {
				let state = getState().orderConfirm;
				let orderData = JSON.stringify({"amounts": state.initAmounts, "cart": state.cart});
				axios.request({
					...pageApi.couponRecalculate,
					data: {
						hbCodes: JSON.stringify(state.initRedPackets),
						couponCode: couponSelect.code,
						orderData: orderData
					}
				}).then(({data}) => {
					dispatch(createActions('initialDataUpdate', {
						data: data.data.amounts,
						cartTicket: data.data.cartTicket
					}));
					dispatch(createActions('resetRedPacket', {data: data.data.hbList}));  //重置红包
					dispatch(createActions('selectCoupon', {couponSelect}));
					//+item_id ? browserHistory.replace(`/orderConfirm?item_id=${item_id}`) : browserHistory.replace(`/orderConfirm?mode=cart_buy`)
					//browserHistory.replace(`${DIR}/orderConfirm?${+item_id? 'item_id='+item_id : 'mode=cart_buy' }`);
                    browserHistory.goBack();
				}).catch(error => {
					tip.show({msg: error.response.data.message || '服务器繁忙'});
					console.error(error);
				})
			});
		}
	};
}

export default connect(useCouponState, useCouponDispatch, useCouponProps)(UseCoupon);
