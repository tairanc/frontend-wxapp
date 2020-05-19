import React, {Component} from 'react';
import {Link, browserHistory} from 'react-router';
import {connect} from 'react-redux'
import {Shady, LoadingRound, LoadingImg} from 'component/common';
import {timeUtils} from 'js/common/utils';
import {ModalAComp} from 'component/modal';
import {HOCPopup} from 'component/HOC';
import {concatPageAndType, actionAxios} from 'js/actions/actions';
import {payType, storeIcon} from 'js/filters/orderStatus';
import {loadMask} from 'component/modules/popup/mask/mask';
import {NoCoupon} from 'component/modules/empty/NoCoupon';
import {tip} from 'component/modules/popup/tip/tip';
import Agreement from 'pages/agreement/agreement.jsx';
import {NewModal} from 'component/modules/modal/modal';
import axios from 'js/util/axios';
import {WXAPI} from 'config/index'
import {dateUtil, handleId, addImageSuffix} from "js/util/index";
import {redPacketFilter} from 'js/reducers/orderConfirm'
import "./index.scss";

//接口请求
const pageApi = {
	initOrderData: {url: `${WXAPI}/order/init`, method: "post"}, //订单确认初始接口
	recalculate: {url: `${WXAPI}/order/recalculate`, method: "post"},  //重计分摊借口（红包 地址 优惠券）
	couponRecalculate: {url: `${WXAPI}/order/applyCouponRecalculate`, method: "post"},  //应用卡券快速重计分摊接口
	initCoupon: {url: `${WXAPI}/promotion/getTradeCoupons`, method: "post"},  //拉取优惠券和红包接口
	orderSubmit: {url: `${WXAPI}/order/create`, method: "post"},  //创建订单接口
	certifyIdentityCard: {url: `${WXAPI}/user/certifyIdentityCard`, method: "get"}, //身份证认证
	getUserInvoice: {url: `${WXAPI}/user/getUserInvoice`, method: "get"}, //判断是否有邮箱
	getInvalidSupplyGoods: {url: `${WXAPI}/order/getInvalidSupplyGoods`, method: "post"}, //获取供应链无库存得商品堆
	getSubscriptionInfoByToken: {url: `${WXAPI}/order/getSubscriptionInfoByToken`, method: "get"}, //获取认购信息
};

const createActions = concatPageAndType("orderConfirm");
const axiosCreator = actionAxios('orderConfirm');
//获取赠品数量
function getGiftsNum(object) {
	let giftNum = 0;
	object && (object instanceof Array) && object.some((item, i) => {
		if (item.gifts) {
			item.gifts.map((item, i) => {
				giftNum += item.gift_num;
			})
		}
	});
	return giftNum;
};

//可用红包数量  //先留着 下期在做
function redPacketsNum(red_packets) {
	const redPacketsNum = [];
	red_packets.map((item, i) => {
		if (!item.disabled) {
			redPacketsNum.push(item)
		}
	});
	return redPacketsNum.length
};

//格式化时间
function formateDate(T) {
	let dateAndTime = T.split(' ');
	let data = dateAndTime[0].split('-').join('/').substring(2),
		time = dateAndTime[1].substring(0, 5);
	return data + ' ' + time;
};

export function preventScroll(status) {
	if (status) {
		$("body").css({overflow: "hidden"})
	} else {
		$("body").css({overflow: "auto"})
	}
}

class OrderConfirm extends Component {
	componentWillMount() {
		if (this.props.cartToken) { //小程序购物袋下单
			axios.request({
				...pageApi.getSubscriptionInfoByToken,
				params: {token: this.props.cartToken}
			}).then(({data}) => {
				window.sessionStorage.setItem("cart_buy", JSON.stringify(data.data.subscriptionInfo));
				if (this.props.from && !this.props.load) {
					if (this.props.from === "address") { //切换地址  调用初始化接口
						this.props.initialData(this.props.from, this.props.newAddress);
					}
					this.props.setOrigin();
				} else {
					this.props.initialData();
				}
			}).catch(error => {
				tip.show({msg: error.message || error.response.data.message || '服务器繁忙'});
				console.error(error);
			})
		} else {
			if (this.props.from && !this.props.load) {
				if (this.props.from === "address") { //切换地址  调用初始化接口
					this.props.initialData(this.props.from, this.props.newAddress);
				}
				this.props.setOrigin();
			} else {
				this.props.initialData();
			}
		}


	}

	componentDidMount() {
		$(window).scrollTop(this.props.disTop);
	}

	componentWillReceiveProps(newProps) {
		let {address, newAddress, nonDetailAddress, load} = newProps;
		if (load !== this.props.load && nonDetailAddress && address.length > 0 && address.length < 20 && (newAddress.detail_address.indexOf(`${nonDetailAddress}`)) === -1) {
			this.props.popupImperfectAddress(true)
		}
	}

	componentWillUnmount() {
		this.props.saveDistanceTop();
		tip.destroy();
		loadMask.destroy();
	}

	//去认证
	goCertify = () => {
		axios.request({
			...pageApi.certifyIdentityCard,
			params: {card_id: this.props.idCards[0].card_id}
		}).then(({data}) => {
				this.props.dispatch(createActions('ctrlModal', {
					modal: "goCertify",
					status: false
				}));
				tip.show({msg: "认证成功"});
			}
		).catch(error => {
			console.log(error);
			tip.show({msg: error.response.data.message || '服务器繁忙'});
		})
	};

	//超额限购2000元 商品
	getOverBuyLimitItem = () => {
		let {over_buy_limit_item, cart} = this.props.data, itemArr = [];
		let skuId = Object.keys(over_buy_limit_item);
		skuId.some((val, i) => {
			cart.some((item, j) => {
				item.object.some((retItem, k) => {
					if (val == retItem.sku_id) {
						itemArr.push(retItem);
					} else {
						return false
					}
				})
			})
		});
		return itemArr.map((item, i) => {
			return <OneItem key={i}
							data={item}
							val={true}/>;
		});
	};

	render() {
		let {load, amounts, assist, cart: {disabled_goods, enabled_goods}, idCards, invoice, orderFormRegionList, newAddress, nonDetailAddress, hasNotice, couponSelect, firstChooseAddress, setOrigin, changeCrossBorderNoticeStatus, addBuyMessage, buyMessage, couponStatus, couponList, onRedPacket, onPayPopup, payTypeChoose, toggleInvoice, popupItem, shopIdArr, redPacketShow, applyRed, paymentSelect, agree, agreeHandle, formSubmit, disabledInvoiceItem, overBuyLimitItemModal, invoiceItemShow, invalidCouponShow, emptyAddress, imperfectAddress, alterationModal, invoiceModal, redSelectModal, diffNameModal} = this.props;
		if (invoiceItemShow || invalidCouponShow || emptyAddress || imperfectAddress || alterationModal || invoiceModal || redSelectModal.show || diffNameModal || redPacketShow || overBuyLimitItemModal) {
			preventScroll(true)
		} else {
			preventScroll(false)
		}
		return (
			<div data-page="order-confirm" ref="orderPage"
				 style={{minHeight: $(window).height()}}>{/*this.props.winHeight*/}
				{ load ? <LoadingRound /> :
					<form id="orderConfirm" onSubmit={ (e) => e.preventDefault() }>
						{enabled_goods.length > 0 && assist.need_id_card && <CrossBorderNotice
							hasNotice={hasNotice}
							changeCrossBorderNoticeStatus={changeCrossBorderNoticeStatus}/>}
						<OrderHeader enabled_goods={enabled_goods}
									 address={ newAddress }
									 identify={ idCards }
									 overSeas={ assist.contain.hai_tao }
									 needId={ assist.need_id_card }
									 firstChooseAddress={firstChooseAddress}
									 setOrigin={ this.props.setOrigin }/>
						{enabled_goods.length > 0 ? <div>
							<OrderShop data={ orderFormRegionList }
									   messageHandle={ addBuyMessage }
									   buyMessage={ buyMessage }/>
							<InvaildItem data={ disabled_goods }/>
							{couponStatus && <div>
								<OrderTotal item_id={this.props.location.query.item_id}
											amounts={ amounts }
											couponList={couponList}
											couponSelect={couponSelect}
											onRedPacket={ onRedPacket }
											assist={assist}
											onPayment={ onPayPopup }
											payTypeChoose={ payTypeChoose.type }
											invoice={invoice}
											toggleInvoice={ toggleInvoice }
											popupItem={ popupItem.bind(null, true)}
											shopIdArr={ shopIdArr}
											setOrigin={ this.props.setOrigin }
											dispatch={this.props.dispatch}
								/>
								<PopupRedPacket data={ couponList.red_packets }
												show={ redPacketShow }
												applyRed={ applyRed }
												onRedPacket={ onRedPacket }/>
							</div>}
							{/*{ assist.allow_offline && <PopupPayment data={ payTypeChoose }
																	paymentSelect={ paymentSelect }
																	modalCtrl={ onPayPopup }/> }*/}
							<UserAgreement agree={ agree }
										   agreeHandle={ agreeHandle }/>
							<AddressTip address={ newAddress }/>
						</div> : <InvaildItem data={ disabled_goods }/>}
						<OrderForm amounts={ amounts }
								   enabled_goods={enabled_goods}
								   couponSelect={couponSelect}
								   formSubmit={ () => {
									   formSubmit(this.props)
								   } }
								   agree={ agree }
						/>
					</form>
				}
				<PopupItemCtrl active={ this.props.invoiceItemShow }
							   onClose={ this.props.popupItem.bind(null, false) }
							   disabledInvoiceItem={ disabledInvoiceItem }/>
				<ModalAComp active={ this.props.invalidCouponShow }
							msg={"优惠券已失效，已为您重新选择"}
							btns={[{
								text: "我知道了", cb: () => {
									this.props.initialData();
								}
							}] }/>
				<ModalAComp active={ this.props.emptyAddress }
							msg={this.props.firstCA ? "请先选择收货地址" : "您还没有收货地址，先去创建一个吧！"}
							btns={[
								{
									text: "取消", cb: () => {
									this.props.dispatch(createActions('ctrlModal', {
										modal: "emptyAddress",
										status: false
									}))
								}
								},
								{
									text: "确定", cb: () => {
									this.props.setOrigin("address");
									browserHistory.push('/goodsReceiveInfo/addressManage?from=2');
									this.props.dispatch(createActions('ctrlModal', {
										modal: "emptyAddress",
										status: false
									}))
								}
								}
							]}
				/>
				<ModalAComp active={ this.props.imperfectAddress }
							msg={`您在浏览商品过程中选择了 ${nonDetailAddress} ，若确认配送到该地区请新建一个收货地址`}
							btns={[
								{
									text: "取消", cb: () => {
									this.props.dispatch(createActions('ctrlModal', {
										modal: "imperfectAddress",
										status: false
									}));
								}
								},
								{
									text: "去新建", cb: () => {
									this.props.setOrigin("address");
									browserHistory.push('/goodsReceiveInfo/addressManage?from=2');
									this.props.dispatch(createActions('ctrlModal', {
										modal: "imperfectAddress",
										status: false
									}))
								}
								}
							]}
				/>


				<ModalAComp active={ this.props.alterationModal }
							msg={"商品信息变动，请刷新页面或返回修改？"}
							btns={[
								{
									text: "刷新", cb: () => {
									this.props.initialData();
								}
								},
								{
									text: "返回", cb: () => {
										if(this.props.cartToken) { // 来自购物袋
											wx.miniProgram.navigateBack()
										} else {
                      browserHistory.goBack();
										}
								}
								}
							]}
				/>
				<ModalAComp active={ this.props.goCertify }
							msg={"身份信息未认证，请先认证"}
							btns={[
								{
									text: "取消", cb: () => {
									this.props.dispatch(createActions('ctrlModal', {
										modal: "goCertify",
										status: false
									}));
								}
								},
								{
									text: "认证", cb: () => {
									this.goCertify()
								}
								}
							]}
				/>
				<ModalAComp active={ this.props.uploadIdImg }
							msg={"请上传身份证照片"}
							btns={[
								{
									text: "取消", cb: () => {
									this.props.dispatch(createActions('ctrlModal', {
										modal: "uploadIdImg",
										status: false
									}));
								}
								},
								{
									text: "去上传", cb: () => {
									browserHistory.push(`/goodsReceiveInfo/identityManage?from=1&&status=${ assist.contain.hai_tao }`)
								}
								}
							]}
				/>
				<ModalAComp active={ this.props.invoiceModal } closeModal={() => {
					this.props.dispatch(createActions('invoiceModal'))
				}}
							msg={"泰然城默认开具电子发票，请填写您的收票邮箱"}
							btns={[{
								text: "取消", cb: () => {
									this.props.dispatch(createActions('invoiceModal'))
								}
							}, {
								text: "去填写", cb: () => {
									this.props.dispatch(createActions('invoiceModal'));
									browserHistory.push(`/invoiceSelect?shop_ids=${ shopIdArr.join(",")}&invoice=ELEC&action=${ invoice.action }`)
								}
							}] }/>

				<ModalAComp active={ this.props.redSelectModal.show }
							msg={ this.props.redSelectModal.msg }
							btns={[
								{
									text: "我知道了", cb: () => {
									this.props.initialData();
									this.props.dispatch(createActions('redSelectModal', {
										modal: {
											show: false,
											msg: ""
										}
									}))
								}
								}
							]}
				/>
				{/*<ModalAComp active={ this.props.overBuyLimitModal }
				 msg="部分商品总价超过海关限额￥2000，请分次购买"
				 btns={[
				 {
				 text: "返回", cb: () => {
				 browserHistory.goBack();
				 }
				 }, {
				 text: "刷新", cb: () => {
				 this.props.initialData();
				 }
				 }
				 ] }/>*/}
				<ModalAComp active={ this.props.diffNameModal }
							msg={"点击确认修改，收货人姓名将变更为身份证姓名，但不影响收货地址，是否修改？"}
							title={"收货人姓名与身份证姓名不一致！"}
							btns={[
								{
									text: "返回编辑", cb: () => {
									this.props.dispatch(createActions('ctrlModal', {
										modal: "diffNameModal",
										status: false
									}));
								}
								},
								{
									text: "确定修改", cb: () => {
									this.props.dispatch(createActions('equalName'));
									setTimeout(() => {
										this.props.formSubmit(this.props);
									}, 0);
								}
								}
							]}

				/>
				{/*{overBuyLimitItemModal && <NewModal isOpen={this.props.overBuyLimitItemModal}
				 title=""
				 onClose={(e) => {
				 e.stopPropagation();
				 this.props.changeOverBuyLimitModal(false)
				 }}>
				 <div className="over-buy-limit-modal">
				 <div className="over-buy-limit-title">
				 以下商品总价（使用优惠券、红包前+运费）已超过国家政策规定的最高可购买限额<span className="c-cdred"> ¥ 2000</span>，请您返回至购物袋修改商品数量再下单，谢谢
				 </div>
				 <div className="over-buy-limit-item">{this.getOverBuyLimitItem()}</div>
				 <div className="button-wrapper">
				 <button className="button" onClick={(e) => {
				 e.stopPropagation();
				 this.props.changeOverBuyLimitModal(false);
				 browserHistory.goBack()
				 }}>返回修改
				 </button>
				 </div>
				 </div>
				 </NewModal>}*/}
			</div>

		)

	}
}

//订单头部地址
class OrderHeader extends Component {
	toSelect = (origin, url) => {
		this.props.setOrigin(origin);
		browserHistory.push(url);
	};

	render() {
		let {address, identify, needId, overSeas, enabled_goods} = this.props;
		//from 1:有地址，跳转到地址列表页  2:跳转到新增/编辑地址页面
		return (
			<div className="order-header">
				<div
					onClick={ this.toSelect.bind(null, "address", address.address_id ? "/goodsReceiveInfo/addressManage?from=1" : "/goodsReceiveInfo/addressManage?from=2")}
					className="user-address g-row-flex g-col-mid g-col-ctr">
					{!!address.address_id ?
						<div className="content-text g-col-1">
							<div className="text-top g-row-flex">
								<span className="c-fs18 c-mr15">{address.name}</span>
								<span className="c-fs18">{address.mobile}</span>
							</div>
							<div className="text-bottom">
								{!!address.is_default && <span className="btn btn1">默认</span>}
								<span className="btn btn2">收货地址</span>
								{address.detail_address} </div>
						</div> :
						<div className="g-col-1 c-fs15">
							您的收货地址为空，点击添加
						</div>
					}
					<div className="right-icon">
						<i className="arrow-right-icon"> </i>
					</div>
				</div>
				{ !!enabled_goods.length && needId ? /*!!identify.length ? `/goodsReceiveInfo/identityManage?from=1&&status=${ overSeas }` : `/goodsReceiveInfo/identityManage?from=2&status=${ overSeas }`*/
					<div
						onClick={ address.address_id ? this.toSelect.bind(null, "origin", `/goodsReceiveInfo/identityManage?from=1&&status=${ overSeas }`) : this.props.firstChooseAddress }
						className="user-idtf g-row-flex g-col-ctr g-col-mid">
						<div className="idtf-center g-col-1">
							{ identify.length > 0 ?
								<span>身份证信息：{ handleId(identify[0].id_number) } </span> :
								<span>因海关清关需要，请填写收货人的身份证号</span>    }
						</div>
						<div className="right-icon">
							<i className="arrow-right-icon"> </i>
						</div>
					</div> : ""}
				<div className="order-header-bottom"></div>
			</div>
		)
	}
}


//订单商品列表
class OrderShop extends Component {
	render() {
		const {data, messageHandle, buyMessage} = this.props;
		const valHtml = data && data.map((item, i) => {
				return <ItemStore key={i}
								  data={item}
								  messageHandle={ messageHandle }
								  buyMessage={ buyMessage }/>
			});
		return (
			<div className="order-box">
				<div className="item-val">
					{valHtml}
				</div>
			</div>
		)
	}
}

//商品store
class ItemStore extends Component {
	render() {
		const {shopInfo: {shop_icon, name, alias, shop_id}, amount, goods} = this.props.data;
		const itemList = goods && goods.map(function (item, i) {
				return <OneItem key={i}
								data={item}
								val={true}/>;
			});
		/*const exchangeList = exchange && (exchange instanceof Array) && exchange.map(function (item, i) {
		 return <OneItem key={i}
		 data={item}
		 val={true}
		 addTag={true}
		 />;
		 });
		 const showTax = total.total_tax && object && (object instanceof Array) && object.reduce((prev, current) => {
		 return prev || current.type !== "Domestic";
		 }, false);
		 const totalPrice = (+total.total_price) - (+total.total_discount_promotion) + (+total.total_dlyfee) + (+total.total_tax);*/
		return (
			<div className="item-store">
				<div className="store-header">
					<span style={{position: "absolute"}}>{storeIcon(shop_icon)}</span>
					<span className="title">{ alias || name }</span>
				</div>
				<div className="store-body">
					{ itemList }
				</div>
				{/*{ exchange && (exchange instanceof Array) &&
				 <div className="store-middle">
				 <h4>换购商品</h4>
				 { exchangeList }
				 </div>
				 }*/}

				<div className="list-total">
					{amount.discount_promotion > 0 && <div className="list g-row-flex">
						<div className="list-left">店铺优惠</div>
						<div className="list-right">- ¥ {(+amount.discount_promotion).toFixed(2)}</div>
					</div>}
                    {amount.discount_vip > 0 && <div className="list g-row-flex">
                        <div className="list-left">会员折扣</div>
                        <div className="list-right">- ¥ {(+amount.discount_vip).toFixed(2)}</div>
                    </div>}
					{amount.tax > 0 &&
					<div className="list g-row-flex">
						<div className="list-left">税费</div>
						<div className="list-right">¥ {(+amount.tax).toFixed(2)}</div>
					</div>
					}
					<div className="list g-row-flex">
						<div className="list-left">运费</div>
						<div className="list-right">
							{amount.freight && " ¥" + (+amount.freight).toFixed(2) || " ¥0.00"}</div>
					</div>
					<div className="list g-row-flex list-input">
						<div className="input-wrapper">
							<input type="text" defaultValue={ this.props.buyMessage[shop_id] }
								   onBlur={ this.props.messageHandle.bind(this, shop_id)}
								   placeholder="给商家留言"
								   maxLength="200"/>
						</div>
					</div>
					<div className="list store-price">
						共{amount.good_num}件商品 &nbsp;&nbsp;小计：<span
						className="c-cdred">¥ <i className="c-fs16 c-fb">{(+amount.payment).toFixed(2) }</i></span>
					</div>
				</div>
			</div>
		)
	}
}

//一个商品
export class OneItem extends Component {
	render() {
		const {data, val, noLabel} = this.props;
		//val true:有效商品   false:失效商品
		let buyLimit = data.promotion ? +data.promotion.real_store : +data.store.real;
		let lowStock = buyLimit < data.quantity;
		return (
			<div className="one-item-grid"
				 style={val && data.formatPromotionsToApp[0] && data.formatPromotionsToApp[0].type === "ExchangeBuy" ? {backgroundColor: "#ffe7e7"} : {}}>
				<div className={`one-item ${!val ? "inval" : ""}`}>
					<div className="item-img">
						<img src={addImageSuffix(data.primary_image, '_s')}/>
					</div>
					<div className="item-info">
						<div className="info-title c-fb">
							{data.title}
						</div>
						<div className="info-spec c-c999">
							{data.spec_text}
						</div>
						<div className="info-price c-cdred c-fs13">
							¥{ data.current_price }
						</div>
						{val && <div className="tags">
							{!!data.formatPromotionsToApp.length &&
							<span className="act-label">{data.formatPromotionsToApp[0].tag}</span> }
							{!!data.freeRefund && <span className="free-refund">七天可退</span> }
						</div>}
						{data.invalid_message &&
						<div className="invalid-message c-fs12 c-c35 c-fb">{data.invalid_message}</div>}
						<div className="info-btm c-fs13">
							×{data.quantity}
						</div>
					</div>
				</div>
				{/*<div className="item-info g-col-1">

				 </div>*/}
				{/*{ data.gifts && data.gifts.map((item, i) => {
				 return <div key={i} className="one-item g-row-flex">
				 <div className="item-img">className={ !item.is_gray ? "item-give val" : "item-give"}
				 <img src={item.primary_image + '_s.jpg'} width="70" height="70"/>
				 { Boolean(item.is_gray) && <span className="store-status">无货</span> }
				 </div>
				 <div className="item-info g-col-1">
				 <div className="info-top g-row-flex">
				 <div className="info-text g-col-1">
				 <div className="info-title">
				 {item.title}
				 </div>
				 <div className="info-props">
				 {item.spec_info}
				 </div>
				 </div>
				 <div className="info-price">¥ 0</div>
				 </div>
				 {!noLabel && <span className="act-label  c-fb gift-item">{item.promotion_tag}</span> }
				 <div className="info-btm">
				 ×{item.gift_num}
				 </div>
				 </div>
				 </div>
				 })}*/
				}
			</div>

		)
	}
}

//订单总和
class OrderTotal extends Component {
	render() {
		const {amounts, couponList: {red_packets, usable_coupons, unusable_coupons}, couponSelect, onRedPacket, assist: {allow_offline, allow_invoice}, onPayment, payTypeChoose, invoice, popupItem, toggleInvoice, shopIdArr, item_id, dispatch} = this.props;
		return (
			<div className="order-total c-fs13">
				<div className="order-discounts">
					<span onClick={ e => {
						this.props.setOrigin("useCoupon");
						browserHistory.push(`/useCoupon?item_id=${item_id}`);
					}}>
						<div className="order-discounts-list g-row-flex">
							<div className="list-left">优惠券</div>
							<div className="list-right">
								{ amounts.discount_coupon ? <span className="c-cdred list-right-text">
									{`已减${couponSelect.desc}元`}
									</span> :
									(  !!usable_coupons.length ?
										<span className="c-cdred">{usable_coupons.length}
											张可用</span> : <span>无可用</span> ) }
							</div>
							<div className="list-icon">
								<i className="arrow-right-icon"> </i>
							</div>
						</div>
					</span>
					<div className="order-discounts-list g-row-flex"
						 onClick={ this.props.onRedPacket.bind(this, true) }>
						<div className="list-left">红包</div>
						<div className="list-right">
							{!!redPacketsNum(red_packets) ? (<span
								className="c-cdred list-right-text">{ amounts.discount_hb ? `已减${amounts.discount_hb}元` : `${redPacketsNum(red_packets)}个可用`  }</span> ) :
								<span>无可用</span>}
						</div>
						{<div className="list-icon">
							<i className="arrow-right-icon"> </i>
						</div>}
					</div>
				</div>


				{/*{allow_offline &&
				<div className="order-pay-invoice g-row-flex" onClick={ allow_offline && onPayment.bind(this, true) }>
					<div className="list-left">支付方式</div>
					<div className="list-right">
						<span className="list-right-text">{ payType[payTypeChoose] }</span>
					</div>
					<div className="list-icon">
						<i className="arrow-right-icon"> </i>
					</div>
				</div>}*/}


				<div className="order-pay-invoice">
					<div className="list g-row-flex">
						{invoice.allow_invoice ? <div className="list-left-spec">
							{invoice.status ?
								<i className="trc-choose" onClick={() => {
									toggleInvoice()
								}}></i> :
								<i className="trc-no-choose" onClick={() => {
									axios.request({
										...pageApi.getUserInvoice,
										params: {shop_id: shopIdArr.join(",")}
									}).then(result => {
										if (result.data.data.invoice.has_electronic_invoice) {  //有邮箱
											toggleInvoice(result.data.data.invoice.user_invoice)
										} else {
											dispatch(createActions('invoiceModal'));
										}
									}).catch(error => {
										tip.show({msg: error.response.data.message || '小泰发生错误，请稍后再试~'});
										console.error(error);
									})

								}}> </i>}
							开具发票
						</div> : <div className="list-left-spec"><i className="trc-not-choose"></i></div>}
						<div className="list-middle-spec">
							{invoice.allow_invoice ? ( invoice.disabled_sku_ids.length > 0 && invoice.status &&
							<span> <span className="tip">部分商品不支持</span>
						 <i onClick={ popupItem } className="question-symbol-icon"> </i>
						 </span>) : <span className="tip">所有商品均不支持开具发票</span>}
						</div>
						{invoice.allow_invoice && <div className="list-right list-right-invoice c-c999">
							{invoice.status ? <Link
								to={`/invoiceSelect?shop_ids=${ shopIdArr.join(",")}&invoice=${ invoice.type }&action=${ invoice.action }`}><span><span
								className="c-fb c-fs13 list-right-text">{invoice.text.split("-")[1]}发票</span><i
								className="arrow-right-icon list-icon"> </i></span></Link> :
								<span>不开发票</span>}
						</div>}
					</div>
					<p className="invoice-tip">活动e卡不支持开具发票，如需使用活动e卡请不要选择开具发票</p>
				</div>
			</div>
		)
	}
}

//失效商品
class InvaildItem extends Component {
	render() {
		const {data} = this.props;
		const invHtml = data && data.map((item, i) => {  //失效商品
				return <OneItem key={`item${i}`}
								data={item}
								val={false}/>
			});
		return data.length ? <div className="invaild-item">
			<p className="title c-cdred c-fs14">失效商品</p>
			<div>{ invHtml }</div>
		</div> : null
	}
}

//订单提交
class OrderForm extends Component {
	/*//订单件数总计
	 getOrderTotal = () => {
	 let {cart} = this.props.data;
	 let orderCount = 0;
	 cart.map((item, i) => {
	 orderCount += item.total.total_quantity;
	 let {object} = item;
	 let giftNum = getGiftsNum(object);
	 orderCount += giftNum;
	 });
	 return orderCount
	 };*/

	render() {
		let {amounts, enabled_goods, agree, couponSelect} = this.props;
		return (
			<div className="order-form g-row-flex">
				<div
					className="money-total g-col-1 g-row-flex">
					<div className="c-fs13 g-col-1 c-c35">合计：<span
						className={`c-fs18 c-fb ${!!enabled_goods.length ? "c-cdred" : "c-c35"}`}>¥ {(+amounts.payment).toFixed(2)}</span>
					</div>
				</div>
				{ agree && !!enabled_goods.length ?
					<div className="form-btn c-bgdred" onClick={ this.props.formSubmit }>提交订单</div> :
					<div className="form-btn c-bgc9">提交订单</div>
				}
			</div>
		)
	}
}

//红包窗口
class PopupRedPacket extends Component {
	onSure = () => {
		this.props.onRedPacket(false);
	};

	render() {
		const {data, show} = this.props;
		return <div onClick={ this.props.onRedPacket.bind(this, false)}>
			{ show && <Shady/> }
			<div className={`popup-red-packet ${show ? "active" : ""}`} onClick={ e => e.stopPropagation()}>
				<div className="popup-top  c-c999 c-fb">
					红包
				</div>
				{!!data.length ?
					<div className="popup-body">
						<RedPacketList data={ data } applyRed={ this.props.applyRed }/>
						<div className="popup-btm">
							<div className="close-btn" onClick={ this.onSure }>确定</div>
						</div>
					</div> :
					<NoRedPacket />}
			</div>
		</div>

	}
}

class RedPacketList extends Component {
	applyPlatform = (plat) => {
		if (plat === "ALL") {
			return ""
		} else {
			return "• " + plat.toUpperCase() + "端专用";
		}
	};
	itemType = {
		"10": "普通商品",
		"20": "虚拟商品",
		"30": "内购商品",
	};
	applyItem = (typeStr) => {
		if (typeStr === "ALL") {
			return "";
		}
		return "• 仅限" + typeStr.split(",").map((type) => {
				return this.itemType[type];
			}).join("、") + "使用";
	};

	getList = () => {
		let {data, applyRed} = this.props;
		return data && data.map((item, index) => {
				return <div className={`one-red-packet ${ !item.check && item.disabled ? "inv" : "" }`} key={ index }
							onClick={ !item.disabled && applyRed.bind(this, index) }>
					<div className="red-main g-row-flex">
						<div className={`left c-fb ${item.deduct_money > 999.99 ? "small" : ""}`}>
							¥ <span>{ item.deduct_money }</span>
						</div>
						<div className="right g-col-1">
							<div className="top c-fb">{ item.name }</div>
							<div className="main">
								<p>{ this.applyItem(item.applicable_item_type) }</p>
								<p>{ this.applyPlatform(item.applicable_platform)}</p>
							</div>
						</div>
						{ item.check ? <i className="check-green-icon"> </i> : item.disabled ?
							<i className="no-check-grey-icon"> </i> :
							<i className="no-check-white-icon"> </i>}
					</div>
					<div className="red-time">
						有效期：{formateDate(item.use_start_time)} 至 {formateDate(item.use_end_time)}
					</div>
				</div>
			})
	};

	unRed = () => {
		let {data} = this.props;
		return data && data.every((item, i) => {
				return !item.check;
			})
	}

	render() {
		let {data} = this.props;
		return <div className="red-packet-list">
			<div className="list-top c-fb">{ redPacketsNum(data) }个可用</div>
			<div className="list-body">
				{ this.getList()}
				<div className="empty-red" onClick={ () => this.props.applyRed(-1) }>
					不使用红包
					{ this.unRed() ? <i className="check-green-icon"> </i> : <i className="no-check-white-icon"> </i> }
				</div>
			</div>
		</div>
	}
}

//支付方式
class PopupPayment extends Component {
	render() {
		return <div onClick={ this.props.modalCtrl.bind(null, false)}>
			{ this.props.data.show && <Shady /> }
			<div className={`payment-select ${ this.props.data.show ? "active" : ""}`}
				 onClick={ e => e.stopPropagation()}>
				<div className="title">支付方式</div>
				<div className="select-list">
					<div className="select-li g-row-flex" onClick={ this.props.paymentSelect.bind(null, "10")}>
						<div className="left g-col-1">线上支付</div>
						<div className="right"><span
							className={`check-icon ${this.props.data.type === "10" ? "check" : ""}`}> </span></div>
					</div>
					<div className="select-li g-row-flex" onClick={ this.props.paymentSelect.bind(null, "20")}>
						<div className="left g-col-1">线下支付</div>
						<div className="right"><span
							className={`check-icon ${this.props.data.type === "20" ? "check" : ""}`}> </span></div>
					</div>
				</div>
				<div className="coupon-btm" onClick={ this.props.modalCtrl.bind(null, false) }>
					<div className="close-btn">
						关闭
					</div>
				</div>
			</div>
		</div>
	}
}


class PopupItem extends Component {
	getList = () => {
		return this.props.disabledInvoiceItem.map((data, i) => {
			return <div className="one-list" key={i}>
				<div className="img">
					<img src={ addImageSuffix(data.primary_image, '_s')}/>
				</div>
				<div className="content">
					<div className="title">
						{ data.title }
					</div>
					<div className="props">{ data.spec_text }</div>
				</div>
			</div>
		})
	};

	render() {
		return <div data-page="order-confirm" onClick={ this.props.onClose }>
			<Shady options={{zIndex: 108}}/>
			<div className="popup-item">
				<div className="popup-body" onClick={ (e) => {
					e.stopPropagation()
				}}>
					<h3>不可开发票商品</h3>
					<div className="list">
						{ this.getList() }
					</div>
				</div>
				<div className="popup-bottom">
					<i className="close-l-x-icon"> </i>
				</div>
			</div>
		</div>
	}
}

const PopupItemCtrl = HOCPopup(PopupItem);

class CrossBorderNotice extends Component {

	render() {
		let {hasNotice} = this.props;
		return hasNotice ? <div>
			<div className="cross-border-notice">
				<img src="/src/img/orderConfirm/bell.png"/>
				<p className="notice">温馨提示：为保障顺利清关，收货地址使用的收货人姓名、身份证号请与付款人真实信息保持一致。</p>
				<span className="close" onClick={() => {
					this.props.changeCrossBorderNoticeStatus(false)
				}}>×</span>
			</div>
			<div style={{height: "50px"}}></div>
		</div> : null
	}
}


const NoRedPacket = () => (
	<div className="c-tc" style={{padding: "57px 0 100px"}}>
		<img src={ require('../../../img/orderConfirm/red-packet.png')} width="58" height="54"/>
		<p className="c-cc9 c-fs12 c-mt15">您还没有红包哦</p>
	</div>
);

class UserAgreement extends Component {
	constructor(props) {
		super(props);
		this.state = {
			agreement: ""
		}
	}

	agreementHandle = (state) => {
		this.setState({agreement: state});
	};

	render() {
		return <div className="user-agreement">
				<span onClick={ this.props.agreeHandle }>{ this.props.agree ? <i className="current-agree-icon"> </i> :
					<i className="current-no-agree-icon"> </i>}</span>
			<span onClick={ this.agreementHandle.bind(this, "agreement")}>我已同意并接受《泰然城服务协议》</span>
			{ this.state.agreement === "agreement" && <Agreement onClose={ this.agreementHandle.bind(this, "") }/> }
		</div>
	}
}

class AddressTip extends Component {
	constructor(props) {
		super(props);
		this.state = {
			show: false
		}
	}

	componentDidMount() {
		let self = this;
		$(window).bind('scroll', function () {
			let $this = $(this);
			let scrollH = $this.scrollTop();
			if (scrollH > $(".user-address").height()) {
				self.setState({show: true});
			} else {
				self.setState({show: false});
			}
		})
	}

	componentWillUnmount() {
		$(window).unbind('scroll');
	}

	render() {
		let {address} = this.props;
		return !!address.address_id && this.state.show ?
			<div>
				<div className="address-tip">送至: {address.detail_address || (address.area + address.addr)} </div>
				<div style={{height: "33px"}}></div>
			</div>
			: null
	}
}


function orderConfirmState(state, props) {
	return {
		...state.orderConfirm,
		...state.global,
	}
}

function orderConfirmDispatch(dispatch, props) {
	let request = false;
	let {item_id, cartToken} = props.location.query;
	let address = item_id ? window.sessionStorage.getItem("areaData")&&JSON.parse(window.sessionStorage.getItem("areaData")) : "";
	let params = item_id ? window.sessionStorage.getItem("fast_buy")&&JSON.parse(window.sessionStorage.getItem("fast_buy")) : (window.sessionStorage.getItem("cart_buy")!=="undefined") && JSON.parse(window.sessionStorage.getItem("cart_buy"));
	// let subscribe = params && JSON.stringify(params.subscribe);

	return {
		cartToken,
		dispatch,
		setOrigin(origin){
			dispatch(createActions('setOrigin', {origin: origin}));
		},
		//初始化订单数据
		initialData: (from, newAddress) => {
			params = item_id ? JSON.parse(window.sessionStorage.getItem("fast_buy")) : (window.sessionStorage.getItem("cart_buy")!=="undefined") && JSON.parse(window.sessionStorage.getItem("cart_buy"));
			let subscribe = params && JSON.stringify(params.subscribe);
			let chooseAddress = from === "address" ? newAddress : address && address.address_id && address || "";  //用于传递给服务端
			let showChooseAddress = from === "address" ? newAddress : address;  //用于前端展示
			from !== "address" && dispatch(createActions('resetState'));
			axios.request({
				...pageApi.initOrderData,
				data: {
					...params,
					subscribe: subscribe,
					address: JSON.stringify(chooseAddress)
				},
				transformRequest: [function (data) {
					let ret = '';
					for (let it in data) {
						ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
					}
					return ret
				}],
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			}).then(({data}) => {
				dispatch(createActions('initialData', {result: data.data, showChooseAddress}));
				let orderData = {"amounts": data.data.amounts, "cart": data.data.cart};
				//初始化优惠券和红包
				axios.request({
					...pageApi.initCoupon,
					data: {enabled_goods: JSON.stringify(data.data.cart.enabled_goods)}
				}).then(({data}) => {
					dispatch(createActions('couponData', {result: data.data, couponStatus: true}));
					if (data.data.usable_coupons[0]) { //使用第一张优惠券 红包重计分摊
						let red_packets = redPacketFilter(orderData.cart.enabled_goods, data.data.red_packets);
						red_packets.map((item) => {
							item.is_used = false;
							item.is_enable = true;
							item.code = item.coupon_code;
						});
						axios.request({
							...pageApi.couponRecalculate,
							data: {
								hbCodes: JSON.stringify(red_packets),
								couponCode: data.data.usable_coupons[0].coupon_code,
								orderData: JSON.stringify(orderData)
							}
						}).then(({data}) => {
							dispatch(createActions('initialDataUpdate', {
								data: data.data.amounts,
								cartTicket: data.data.cartTicket
							}));
							dispatch(createActions('resetRedPacket', {data: data.data.hbList}));  //重置红包
						}).catch(error => {
							tip.show({msg: error.response.data.message || '服务器繁忙'});
							console.error(error);
						})
					}
				});
				if (!data.data.address.length) {
					dispatch(createActions('ctrlModal', {modal: "emptyAddress", status: true, firstCA: false}));
				}
			}).catch(error => {
				tip.show({msg: error.message || error.response.data.message || '服务器繁忙'});
				console.error(error);
			})
		},
		//表单提交
		formSubmit: (props) => {
			let {newAddress, idCards, assist, invoice, payTypeChoose, buyMessage, data, couponSelect, couponList: {red_packets}, orderFormRegionList, cartTicket, enableSubscribe} = props;
			let GroupBuy = !!orderFormRegionList[0].goods[0].extra.length && orderFormRegionList[0].goods[0].extra.promotion[0].type === "GroupBuy" ? true : false;
			let promotionId = !!orderFormRegionList[0].goods[0].extra.length && orderFormRegionList[0].goods[0].extra.promotion[0].promotion_id || 0;
			let buyMessShopId = buyMessage.id;
			let hbCodes = [];
			red_packets && red_packets.map((item, i) => {
				if (item.check) {
					hbCodes.push(item.coupon_code)
				}
			});
			if (!newAddress.address_id) {
				tip.show({msg: "请先选择收货地址！"});
				return;
			}
			if (assist.need_id_card) {
				if (!idCards.length) {
					tip.show({msg: "请先选择身份信息！"});
					return;
				}
				if (newAddress.name !== idCards[0].name) {
					dispatch(createActions('ctrlModal', {modal: "diffNameModal", status: true}));
					return;
				}
			}
			if (request) return;
			let formData = {
				address: JSON.stringify(newAddress),
				cardId: assist.need_id_card ? idCards[0].card_id : "",
				invoiceId: invoice.status ? invoice.id : "",
				couponCode: couponSelect.code,
				hbCodes: JSON.stringify(hbCodes),
				subscribe: JSON.stringify(enableSubscribe),
				buyMode: params.buyMode,
				bizMode: params.bizMode,
				bizAttr: params.bizAttr,
				paymentType: payTypeChoose.type,
				cartTicket: cartTicket
			};
			for (let id in buyMessage) {
				formData["buyMessages[" + id + "]"] = buyMessage[`${id}`];
			}
			request = true;
			//获取供应链无库存得商品堆
			axios.request({
				...pageApi.getInvalidSupplyGoods,
				data: {address: JSON.stringify(newAddress), subscribe: JSON.stringify(enableSubscribe),}
			}).then(({data}) => {
				if (data.data.length) {  //供应链无库存商品
					dispatch(createActions('invalidSupplyGoods', {data: data.data}));
					setTimeout(function () {
						request = false;
						browserHistory.replace('/unStockItem')
					})
				} else {
					axios.request({
						...pageApi.orderSubmit, data: formData,
						transformRequest: [function (data) {
							let ret = '';
							for (let it in data) {
								ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
							}
							return ret
						}],
						headers: {'Content-Type': 'application/x-www-form-urlencoded'},
					}).then(({data}) => {
						setTimeout(() => {
							request = false;
							browserHistory.replace(`/cashier?tid=${ data.data.order_id }&GroupBuy=${GroupBuy}&promotionId=${promotionId}&backUrl=${location.origin}/tradeList/1`);
						}, 1000);
					}).catch((error) => {
						/*1001:红包失效  1002:优惠券失效  1003:商品信息变动，请刷新页面或返回修改  1011:地址未选择  1021:缺少身份信息  1022:身份信息未认 1023:海淘    请上传身份证照片*/
						request = false;
						if (error.response.data.code === 1001) {
							dispatch(createActions('redSelectModal', {
								modal: {
									msg: error.response.data.message,
									show: true
								}
							}));
							return;
						}
						if (error.response.data.code === 1002) {
							dispatch(createActions('ctrlModal', {modal: "invalidCouponShow", status: true}));
							return;
						}
						if (error.response.data.code === 1003) {
							dispatch(createActions('ctrlModal', {modal: "alterationModal", status: true}));
							return;
						}
						if (error.response.data.code === 1022) { //去认证
							dispatch(createActions('ctrlModal', {modal: "goCertify", status: true}));
							return;
						}
						if (error.response.data.code === 1023) {
							dispatch(createActions('ctrlModal', {modal: "uploadIdImg", status: true}));
							return;
						}
						tip.show({msg: error.response.data.message || '服务器繁忙'});
						console.log(error.response);
					})
				}
			}).catch(error => {
				request = false;
				tip.show({msg: error.response.data.message || '服务器繁忙'});
				console.log(error.response);
			});
		},
		//是否要发票
		toggleInvoice: (data) => {
			dispatch(createActions('toggleInvoice', {invoiceData: data}));
		},
		//同意协议
		agreeHandle: () => {
			dispatch(createActions('agreeChange'));
		},
		//红包弹窗
		onRedPacket(status){
			dispatch(createActions('redPacketPopup', {status: status}));
		},
		//红包选择
		redSelect(arr){
			dispatch(createActions('redSelect', {selectArr: arr}));
		},
		//红包清空
		redClear(){
			dispatch(createActions('redClear'));
		},
		//支付方式弹窗
		onPayPopup(status){
			dispatch(createActions('paymentPopup', {status: status}));
		},
		paymentSelect(type){
			dispatch(createActions('paymentSelect', {status: type}));
		},
		//添加留言
		addBuyMessage(id, e){
			dispatch(createActions('addMessage', {id: id, value: e.target.value}));
		},
		saveDistanceTop() {
			dispatch(createActions('saveTop', {value: $(window).scrollTop()}));
		},
		popupItem: (status) => {
			dispatch(createActions('ctrlModal', {modal: "invoiceItemShow", status: status}));
		},
		popupImperfectAddress: (status) => {
			dispatch(createActions('ctrlModal', {modal: "imperfectAddress", status: status}));
		},
		firstChooseAddress: (status) => {
			dispatch(createActions('ctrlModal', {modal: "emptyAddress", status: status, firstCA: true}));
		},
		//	详细地址替换成商品详情页选择的详细地址
		selectAddress: (data) => {
			dispatch(createActions('selectAddress', {data: data}));
		},
		changeOverBuyLimitModal: (flag) => {
			dispatch(createActions('changeOverBuyLimitModal', {flag: flag}));
		},
		changeCrossBorderNoticeStatus: (status) => {
			dispatch(createActions('changeCrossBorderNoticeStatus', {hasNotice: status}));
		}
	}
}

function orderConfirmProps(stateProps, dispatchProps, props) {
	let {dispatch} = dispatchProps;
	return {
		...stateProps,
		...dispatchProps,
		...props,
		//应用红包
		applyRed(index){
			if (index === -1) { //不使用红包
				let isEmpty = stateProps.couponList.red_packets.every((item, i) => {
					return !item.check
				});
				if (isEmpty) return;
				dispatchProps.redClear();
			} else {
				dispatchProps.redSelect([index]);
			}
			dispatch((dispatch, getState) => {
				let state = getState().orderConfirm;
				let couponCode = state.couponSelect.code;
				let orderData = JSON.stringify({"amounts": state.initAmounts, "cart": state.cart});
				let hbCodes = [];
				state.couponList.red_packets.forEach((list, i) => {
					hbCodes.push({
						"is_used": list.check || false,
						"code": list.coupon_code
					});
				});
				hbCodes = JSON.stringify(hbCodes);
				loadMask.show();
				axios.request({
					...pageApi.couponRecalculate,
					data: {
						hbCodes: hbCodes,
						couponCode: couponCode,
						orderData: orderData
					}
				}).then(({data}) => {
					loadMask.destroy();
					dispatch(createActions('initialDataUpdate', {
						data: data.data.amounts,
						cartTicket: data.data.cartTicket
					}));
					dispatch(createActions('filterRed', {data: data.data.hbList}));
				}).catch(error => {
					loadMask.destroy();
					if (index !== -1 && state.couponList.red_packets[index].check) {  //选中红包数据请求不成功  在取消选中
						dispatchProps.redSelect([index]);
					}
					tip.show({msg: error.response.data.message || '服务器繁忙'});
					console.error(error);
				})
			})
		},
	};
}

export default connect(orderConfirmState, orderConfirmDispatch, orderConfirmProps)(OrderConfirm);
