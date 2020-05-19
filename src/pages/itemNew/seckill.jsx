import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';
import {Link} from 'react-router';
import {connect} from 'react-redux';
import {concatPageAndType, actionAxios, actionAxiosAll} from 'js/actions/actions'
import {
	createAction,
	PurchaseLimit,
} from 'filters/index'
import {browserHistory} from 'react-router';
import {onAreaResultJSBrige} from "../../js/jsbrige/index";
import {NewModal} from 'component/modules/modal/modal';
import {tip} from 'component/modules/popup/tip/tip';
import {PureComponent} from 'component/modules/HOC/PureComponent';
import axios from 'js/util/axios';
import {BarrageStripConnnect} from "./detail"
import {dateUtil, judgeIphoneX, getQueryString} from 'src/js/util/index'
import {WXAPI} from 'config/index'
import './item.scss';

const pageApi = {
	getRandCaptcha: {url: `${WXAPI}/promotion/getRandCaptcha`, method: "get"},
	checkSeckill: {url: `${WXAPI}/promotion/SecKill/check`, method: "post"}      //秒杀校验
};

import {
	ItemNav,
	ScrollImageState, // 滚动图片
	SeverArea, // 配送区域
	EvaluateArea, //评价区域
	RecommendArea, //推荐区域
	ShopArea, //店铺区域
	GoodsDetail, //商品详情区域
	GoodsTit,
	Price,
	Tag,
	PromotionWrap,
	createBuyAction, //首页 收藏 购物车
	BuyModalTitle,
	chooseSpec,
	LinkChange,
	Specs,
	ExpectTax,
	PromotionInfo,
	rangePrice,
} from "./detail.jsx"


const createActions = concatPageAndType('seckill');
const axiosActions = actionAxios('seckill');


class BuyModalInfo extends Component {

	initList = () => {
		let {specs} = this.props.promotion.info;
		return Object.keys(specs).map((val, i) => {
			return <Specs specs={specs[val]} index={i} {...this.props} key={i}/>
		});
	};

	getLimit = () => {
		let {promotion: {activity_type}, promotionData} = this.props;
		if (activity_type === "SecKill") {
			return (
				<span
					className="limit_buy">限购{promotionData[activity_type].rules.user_buy_limit}件 (已购{promotionData[activity_type].purchased_quantity || 0}件)</span>
			)
		}
		return null
	};


	render() {
		let {num, storeNum} = this.props.retState;
		return (
			<div className="attr-wrap">
				<div className="standard-area stable-standard cur">
					<div className="standard-info">
						{this.initList()}
					</div>
				</div>
				<div className="buy-amount">
					<span className="amount-tit">购买数量：</span>
					<span className="number-increase-decrease">
					<span className="btn btn-action action-decrease dis-click">－</span>
					<input type="number" readOnly className="action-quantity-input"
						   value={num}/>
						<span className="btn btn-action action-increase dis-click">＋</span>
					</span>
					{this.getLimit()}
					<div className="clearfix"></div>
				</div>
				<ExpectTax {...this.props} />
			</div>
		)
	}
}

class BuyModalButton extends Component {
	render() {
		let {onClickBuy, purchaseLimit, toBuyClick, isNonPayment, isLimit, popTips, state, buyActive} = this.props;
		// let isPurchaseLimit = purchaseLimit();
		let isPurchaseLimit = false;    //本期不做
		return (
			<div className="buy-option-btn" style={judgeIphoneX() ? {height: "85px"} : {}}>
				{ isPurchaseLimit ? <span className="purchase-limit">抱歉，海外直邮类商品和跨境保税类商品总价超过限额￥2000，请分次购买。</span> : null}
				{
					!isNonPayment ? (
						<div>
							{
								state == 2 ? (isLimit() ?
									<div className={`btn-tobuy ${isPurchaseLimit ? 'c-bgc9' : ''}`}
										 onTouchTap={isPurchaseLimit ? "" : toBuyClick ? () => {
											 onClickBuy(buyActive)
										 } : ""}>确定</div> :
									<div className="btn-tobuy-disable">确定</div>) :
									<div className="action-notify"
										 onTouchTap={() => popTips("秒杀还未开始，请耐心等待哦~")}>即将开始</div>
							}
						</div>
					) :
						<div type="button" className="btn-tobuy-disable">还有机会</div>
				}
			</div>
		)
	}
}


class BuyModal extends PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			toBuyClick: true,
			seckillSure: false,
			captchaFlag: true
		}
	}

	componentWillMount() {
		let flag = this.judgeSingleSku();
		if (flag) {
			this.changeBusinessPrice();
		}
		console.log(this.props);
		this.props.isLogin && this.state.captchaFlag && this.loadCaptchas();
	}

	//单规格或者无规格初始化价格和skuId
	changeBusinessPrice = () => {
		let {nowPrice, nowSkuId, storeNum, selectArr, specKey} = this.props.retState;
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
		nowSkuId = skus[newSpecKey].sku_id;
		storeNum = skus[newSpecKey].store;
		selectArr = newSpecKey.split("_");
		specKey = Object.keys(specs);
		let newRetState = {...this.props.retState, nowPrice, nowSkuId, storeNum, selectArr, specKey};
		this.props.InitState(newRetState);
	};


	purchaseLimit = () => {
		let {trade_type} = this.props.data;
		if (this.props.retState.num > 1 && this.props.retState.nowSkuId && PurchaseLimit(trade_type)) {
			return this.props.retState.num * this.props.retState.nowPrice > 2000
		}
	};

	getActionData = (result) => {
		let {retState, promotion, areaData} = this.props, extraProArr = [],
			{user_id} = this.props.location.query;
		let addrList = this.props.mix && this.props.mix.addrList;
		let addr_id = addrList ? (addrList.recent_addr.length > 0 && addrList.recent_addr[0].addr_id || addrList.default_addr && addrList.default_addr.addr_id || 0) : 0;
		promotion.promotion && promotion.promotion.map((item, i) => {
			extraProArr.push({"promotion_id": item.id, "role": "main_good", type: item.type})
		});
		let ret = {
			subscribe: [{
				"quantity": retState.num,
				"cart_id": 0,
				"sku_id": retState.nowSkuId,
				"item_id": retState.itemId,
				"created_at": new Date().getTime(),
				"extra": {
					"promotion": extraProArr,
					"commission_user_id": user_id,   // 添加分佣用户id
          "commission_ucenter_id": getQueryString('comUcerterId') || undefined // 邀请关系
				}
			}]
		};
		ret = !result ? {
			...ret,
			buyMode: "fast_buy",
			bizMode: "online",
			bizAttr: "trmall",
			address: areaData.addressData,
		} : {
			sku_record: {
				"quantity": retState.num,
				"price": retState.nowPrice,
				"sku_id": retState.nowSkuId,
				"item_id": retState.itemId,
			},
			extra: {
				"promotion": extraProArr
			},
			captcha_data: {
				"geetest_challenge": result.geetest_challenge,
				"geetest_validate": result.geetest_validate,
				"geetest_seccode": result.geetest_seccode
			}
		}
		;  //立即购买(校验)
		return ret
	};

	onClickBuy = (type) => {
		let {captchaObj} = this.state;
		let flag = this.checkSpec();
		if (flag) {
			tip.show({msg: "请选择" + flag});
			return
		}
		this.state.captchaFlag && this.loadCaptchas();
		captchaObj && captchaObj.verify();
	};

	toCart = (result) => {
		const {itemId} = this.props;
		let loading = false;
		const orderInitParams = this.getActionData(), checkSeckillData = this.getActionData(result);
		if (!loading) {
			axios.request({...pageApi.checkSeckill, data: checkSeckillData}).then(() => {
				loading = true;
				// this.props.OrderInitParams(orderInitParams);  //保存于redux  刷新页面会被重置
				sessionStorage.setItem("fast_buy", JSON.stringify(orderInitParams));
				browserHistory.push('/orderConfirm?item_id=' + itemId);
			}).catch(error => {
				tip.show({msg: error.response && error.response.data.message || '服务器繁忙'});
			});
		}
	};

	loadCaptchas = () => {
		let self = this;
		this.setState({captchaFlag: false});
		axios.request({...pageApi.getRandCaptcha}).then((res) => {
			let data = eval("(" + res.data.data + ")");
			initGeetest({
				gt: data.gt,
				challenge: data.challenge,
				new_captcha: data.new_captcha,
				offline: !data.success,
				product: "bind"
			}, self.handlerEmbed);
			self.setState({captchaFlag: true});
		}).catch(error => {
			console.log(error);
			tip.show({msg: error.response && error.response.data.message || '服务器繁忙'});
		});
	};

	handlerEmbed = (captchaObj) => {
		let self = this;
		captchaObj.onError(function () {
			tip.show({
				msg: "验证错误"
			});
		}).onSuccess(function () {
			let result = captchaObj.getValidate();
			if (!result) {
				tip.show({
					msg: "请完成验证"
				});
			}
			$("input[name='mode']").val("fast_buy");
			self.toCart(result);
		});
		if (captchaObj) {
			this.setState({
				captchaObj: captchaObj,
				seckillSure: true
			});
		}
	};

	checkSpec() {
		let {specKey, nowSkuId} = this.props.retState;
		let {specs} = this.props.promotion.info;
		let unSelectKey;
		if (!nowSkuId) {
			unSelectKey = Object.keys(specs).filter((val, index) => {
				return +val !== specKey[index]
			});
			return specs[unSelectKey[0]].name;
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
		let {realStore} = this.props.promotion;
		let {selectArr, specKey, nowSku, storeNum, newData, nowSkuId, nowPrice, num} = retState, flag, newSpecKey;
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
			storeNum = skus[newSpecKey].store;
			//更新num
			num = num < storeNum ? num : storeNum;
		} else {
			//未选中一个商品规格，价格设为标准价
			nowPrice = rangePrice(this.props.promotion, true);
			storeNum = realStore;
			nowSkuId = "";
			nowSku = "";
		}
		let RetState = {...this.props.retState, nowSku, selectArr, specKey, nowSkuId, nowPrice, num, storeNum};
		this.props.InitState(RetState);
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

	render() {
		let props = {
			isHasStore: this.isHasStore,
			onClickBuy: this.onClickBuy,
			specSelect: this.specSelect,
			judgeSingleSku: this.judgeSingleSku,
			purchaseLimit: this.purchaseLimit,
			...this.props,
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

	componentWillReceiveProps(nextProps) {
		if (nextProps.mixStatus && nextProps.proStatus) {
			this.setState({mixStatus: nextProps.mixStatus, proStatus: nextProps.proStatus});
		}
	}

	active = (tab) => {
		this.props.UpdateBuyModal({buyModal: true, buyActive: tab});
	};

	isNonPayment = () => {
		let {activity_type, realStore} = this.props.promotion;
		if (this.props.promotion.activity_type) {  //秒杀还有机会判断
			let {activity_sales, activity_store} = this.props.promotionData[`${activity_type}`];
			if (!realStore) {
				return activity_sales !== activity_store;
			}
		}
	};

	isLimit = () => {
		let {promotion: {activity_type}, promotionData, isLogin} = this.props;
		return isLogin ? promotionData[activity_type].rules.user_buy_limit > promotionData[activity_type].purchased_quantity || 0 : true
	};

	popTips(msg) {
		tip.show({
			msg: msg
		});
	}

	render() {
		return (
			this.props.mixStatus && this.props.proStatus ?
				<div>
					{this.props.choose ?
						<div>
							<LinkChange className="choose-btn" onClick={() => {
								this.active("chooseSpec")
							}}> </LinkChange>
						</div> : this.props.data.is_charge ? null :
							(this.props.data.status === "SHELVING" ?
									!this.isNonPayment() ? (this.props.promotion.realStore ?
											<div className="action-btn-group  c-fr seckill-btn">
												{
													this.props.state == 2 ? (this.isLimit() ?
														<div>
															<LinkChange
																className="ui-btn  action-addtocart  action-btn-seckill-in c-fl"
																onClick={(e) => {
																	this.active("buy")
																}}>立即秒杀</LinkChange>
														</div> :
														<LinkChange
															className="ui-btn  action-addtocart  action-btn-seckill-disable c-fl">立即秒杀</LinkChange>) :
														this.props.state == 1 ?
															<LinkChange
																className="ui-btn  action-notify">秒杀结束</LinkChange> :
															<LinkChange className="ui-btn  action-notify"
																		onTouchTap={() => this.popTips("秒杀还未开始，请耐心等待哦~")}>即将开始</LinkChange>
												}
											</div>
											:
											<div className="action-btn-group c-fr">
												<LinkChange type="button"
															className="ui-btn action-btn-seckill-disable">已秒完</LinkChange>
											</div>
									) :
										<div className="action-btn-group c-fr">
											<LinkChange type="button"
														className="ui-btn action-btn-seckill-disable">还有机会</LinkChange>
										</div>
									:
									<div className="action-btn-group c-fr">
										<LinkChange type="button"
													className="ui-btn action-btn-seckill-disable">已下架</LinkChange>
									</div>
							)}
				</div> : <div className="action-btn-group c-fr">
				<span className="ui-btn  action-buy-now c-fl incomplete-buy-now" style={{width: "100%"}}>立即秒杀</span>
			</div>
		)
	}
}


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
						<i className="icon icon-forward vertical-middle"><img
							src="/src/img/icon/arrow/arrow-right-icon.png"/></i>
					</div>
					{data.status === "SHELVING" ? (promotion.realStore) ?
						<Buy {...this.props} choose={true}/> : null : null}
					<div className="gap bgf4"></div>
				</div> : null
			)
		}
	}
};
let ChooseSpec = createChooseSpec({Buy});

export class PriceArea extends PureComponent {
	render() {
		let {data, proStatus, promotion, state} = this.props;
		return (
			<div className="price-area">
				{!state && <Price item={data} proStatus={proStatus} promotion={promotion}/>}
				<GoodsTit item={data} promotion={promotion}/>
				<Tag item={data}/>
			</div>
		)
	}
}

class Notice extends PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			intervalT: this.props.intervalT
		}
	}

	componentDidMount() {
		this.changeTime();
		this.intervalTime();
	}

	changeTime = () => {
		let {now_time, end_time, start_time} = this.props.promotion.promotion[0];
		let {intervalT} = this.state;
		now_time = new Date(new Date(now_time.replace(/-/g, '/')).getTime() + parseInt(intervalT)).getTime();
		end_time = new Date(end_time.replace(/-/g, '/')).getTime();
		start_time = new Date(start_time.replace(/-/g, '/')).getTime();
		now_time = parseInt(now_time / 1000);
		end_time = parseInt(end_time / 1000);
		start_time = parseInt(start_time / 1000);
		this.props.initData({now_time, end_time, start_time});
	};

	intervalTime = () => {
		this.timer = setInterval(() => {
			this.props.observeState();
		}, 1000)
	};

	componentWillReceiveProps(props) {
		if (props.state == 1) {
			location.reload();
		}
		if (this.state.intervalT !== props.intervalT) {
			this.setState({intervalT: props.intervalT}, function () {
				clearInterval(this.timer);
				this.changeTime();
				this.intervalTime();
			})

		}
	}

	componentWillUnmount() {
		clearInterval(this.timer);
		this.props.clearData()
	}

	render() {
		let {state, toend, data, proStatus, promotion, start_time} = this.props;
		return (
			state == 1 ? null :
				<div className="detail-seckil-state-area">
					<div className="seckil-state-area-l c-fl">
						{state == 2 && <Price item={data} proStatus={proStatus} promotion={promotion}/>}
						{state == 2 ? <span className="in-seckil c-tc c-dpib">秒杀中</span> :
							<span className="former-seckil c-tc c-dpib">秒杀</span>}
					</div>
					{
						!state ?
							<div className="seckil-state-area-r-no c-fr">
								预计{start_time && dateUtil.format(new Date(start_time * 1000).getTime(), "M月D日H:F:S")}开始</div>
							:
							<div className="seckil-state-area-r-in c-fr">
								<div>
									<div className="c-dpb c-tc">离结束还剩</div>
									<div className="time-remain c-tc">
										<div className="c-dpib">
											<font>{dateUtil.formatNum(parseInt(toend / 3600))}</font>
											:
											<font>{dateUtil.formatNum(parseInt(toend % 3600 / 60))}</font>
											:
											<font>{dateUtil.formatNum(parseInt(toend % 60))}</font>
										</div>
									</div>
								</div>
							</div>
					}
				</div>
		)
	}
}

// 活动
class ActiveArea extends PureComponent {
	render() {
		return ( <div className="active-area">
			<PromotionWrap {...this.props} />
		</div>)
	}
}


class Seckill extends Component {

	constructor(props) {
		super(props);
		this.state = {
			index: 0
		};
	}

	//弹框的一些方法  最好提取成成全局方法，避免重复与传递
	closeModal = () => {
		this.props.UpdateBuyModal({buyModal: false});
	};

	isNonPayment = () => {
		let {activity_type, realStore} = this.props.promotion;
		if (this.props.promotion.activity_type) {  //秒杀还有机会判断
			let {activity_sales, activity_store} = this.props.promotionData[`${activity_type}`];
			if (!realStore) {
				return activity_sales !== activity_store;
			}
		}
	};

	isLimit = () => {
		let {promotion: {activity_type}, promotionData, isLogin} = this.props;
		return isLogin ? promotionData[activity_type].rules.user_buy_limit > promotionData[activity_type].purchased_quantity || 0 : true
	};

	popTips(msg) {
		tip.show({
			msg: msg
		});
	}

	//弹框方法

	render() {
		let {location, data, mix, rate, recommend, promotion, cartNum, isLogin, pending, mixStatus, rateStatus, recommendStatus, proStatus, cartInfoStatus, retState, areaData, UpdateBuyModal, InitState, UpdateCartInfo, buyModal, buyActive, promotionData, intervalT} = this.props;
		let {item_id} = data;
		let {initData, observeState, clearData, state, toend, start_time, loadCaptcha} = this.props;
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
			UpdateBuyModal: UpdateBuyModal,
			InitState: InitState,
			UpdateCartInfo: UpdateCartInfo,
			buyModal: buyModal,
			buyActive: buyActive,
			loadCaptcha: loadCaptcha,
			state: state,
			areaData: areaData,
			isLogin: isLogin
		};

		let seckillProps = {
			promotion: promotion,
			initData: initData,
			observeState: observeState,
			clearData: clearData,
			state: state,
			toend: toend,
			start_time: start_time
		};

		let buyModalProps = mixStatus && proStatus && {
				...props,
				isNonPayment: this.isNonPayment(),
				isLimit: this.isLimit,
				popTips: this.popTips,
				closeModal: this.closeModal
			};
		return (
			<div data-page="item-detail" id="item-details" ref="details">
				<BarrageStripConnnect />
				<ItemNav />
				{mixStatus && proStatus && <BuyModal {...buyModalProps}/>}
				<div>
					<ScrollImageState data={data} ref="scrollImage"/>
					{proStatus &&
					<Notice {...seckillProps} data={data} proStatus={proStatus} promotion={promotion}
							intervalT={intervalT}/>}
					<PriceArea data={data} proStatus={proStatus} promotion={promotion} state={state}/>
					{proStatus && <ActiveArea promotion={promotion} shop={data.shop}/>}
					<div className="gap bgf4"></div>
					{mixStatus && proStatus && <ChooseSpec {...props}/>}
					{mixStatus &&
					<SeverArea mix={mix} data={data} retState={retState} areaData={areaData} isLogin={isLogin}
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
function seckillState(state) {
	return {
		...state.seckill
	}
}

function seckillDispatch(dispatch) {
	let loading = false;
	let rCom;
	return {
		clearData() {
			dispatch(createActions("clearData", {}))
		},
		initData(props) {
			dispatch(createActions("initData", props))
		},
		observeState() {
			dispatch(createActions("observeState", {}))
		}
	}
}
export default connect(seckillState, seckillDispatch)(Seckill);
