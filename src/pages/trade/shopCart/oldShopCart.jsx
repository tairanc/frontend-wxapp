import React, {Component} from 'react';
import {LoadingRound, EmptyPage, Shady} from 'component/common';
import {Link, browserHistory} from 'react-router';
import {actionAxios, concatPageAndType} from 'js/actions/actions';
import Navigator from 'component/modules/navigation/index';
import {loadMask} from 'component/modules/popup/mask/mask';
import {modalA} from 'component/modules/popup/modal/modal';
import {tip} from 'component/modules/popup/tip/tip';
import {connect} from 'react-redux';
import {delay} from 'js/common/utils';
import {DIR} from 'config/index'
import axios from 'axios';
import {miniProgramShopCart} from 'js/util/miniProgramLogin';
import './index.scss';

const createActions = concatPageAndType('shopCart');

const pageApi = {
	init: {url: "/wxapi/initCart.api", method: "get"},
	update: {url: "/wxapi/updateCart.api", method: "post"},
	remove: {url: "/wxapi/removeCart.api", method: "post"},
	clear: {url: "/wxapi/removeDisableCart.api", method: "post"},
	pick: {url: "/wxapi/pickCart.api", method: "post"},
	collect: {url: "/wxapi/moveCollect.api", method: "post"}
};

class ShopCart extends Component {
	componentWillMount() {
		if (this.props.isLogin) {
			this.props.initialData();
		}
	}
	
	
	componentWillReceiveProps(newProps) {
		if (newProps.isLogin && !this.props.isLogin) {
			this.props.initialData();
		}
	}
	
	componentWillUnmount() {
		loadMask.destroy();
		tip.destroy();
		modalA.destroy();
		this.props.dividePayClose();
	}
	
	updateCartNum = () => {
		this.refs.navigator.dispatchProps.getCartNum();
	};
	
	handleCheck = () => {
		this.props.updateData("pick", this.props.handleCheck(this.props.data));
	}
	
	render() {
		let {data} = this.props;
		const hasData = data && ( data.valid_items.length || data.invalid_items.length );
		return <div data-page="shop-cart" style={{minHeight: this.props.winHeight}}>
			{ (() => {
				if (this.props.pending) {
					return <LoadingRound/>;
				} else if (!this.props.isLogin) {
					return <EmptyPage config={{
						msg: "登录后将显示您之前加入的商品~",
						btnText: "登录",
						link: location.href,
						bgImgUrl: "/src/img/shopCart/shop-cart-no-login.png"
					}}/>
				} else if (this.props.load) {
					return <LoadingRound/>;
				} else if (hasData) {
					return <div>
						<CartBody key="cart-body" { ...this.props } updateCartNum={ this.updateCartNum }/>
						<CartTotal data={ this.props.cartTotal }
						           cartCheck={ data.cartCheck }
						           editNum={ this.props.editNum }
						           key="cart-total"
						           updateCartNum={ this.updateCartNum }
						           handleCheck={ this.handleCheck }
						           handleCollects={ this.props.handleCollects }
						           handleRemoves={ this.props.handleRemoves }
						           updateData={ this.props.updateData }
						           formSubmit={ this.props.formSubmit }/>
						
						<PayDivide data={this.props.divideTotal}
						           active={this.props.dividePrompt}
						           promptClose={this.props.dividePayClose}/>
					</div>
				} else {
					return <EmptyPage config={{
						msg: "购物袋没有商品哦，去逛逛吧~",
						btnText: "去首页",
						link: "",
						bgImgUrl: "/src/img/shopCart/bag-no-item.png"
					}}/>
				}
			})()}
			
			
			<Navigator ref="navigator"/>
		</div>
	}
}

//购物车body
class CartBody extends Component {
	render() {
		const {data} = this.props;
		const valHtml = data.valid_items.map((item, i) => {
			return <CartStore { ...this.props } key={ item.shop_id } data={item} invalid={ false }/>;
		});
		const invHtml = data.invalid_items.map((item, i) => {
			return <OneItemHOC key={i} data={item} invalid={true}/>;
		});
		return (
			<div className="cart-body">
				<div className="cart-val">
					{valHtml}
				</div>
				{ !!data.invalid_items.length &&
				<div className="cart-inv">
					{invHtml}
					<div className="clear-inv">
						<p onClick={ (e) => this.props.updateData("clear") }>清空失效商品</p>
					</div>
				</div>
				}
			</div>
		)
	}
}


//购物车store
class CartStore extends Component {
	constructor(props) {
		super(props);
		this.state = {edit: false, data: props.data};
	}
	
	componentWillReceiveProps(props) {
		this.setState({data: props.data});
	}
	
	componentWillUnmount() {
		if (this.state.edit) {
			this.toggleEdit(false);
		}
	}
	
	//改变编辑状态
	toggleEdit = () => {
		this.setState({edit: !this.state.edit});
		this.props.computeEditNum(!this.state.edit);
	};
	//店铺check
	toggleCheck = () => {
		let {data} = this.props;
		let status = Number(!data.storeCheck);
		let sendData = {
			cart_id: {}
		};
		data.storeCheck = status;
		data.activity = data.activity.map((activity) => {
			activity.items = activity.items.map((item) => {
				sendData.cart_id[item.cart_id] = status;
				item.is_checked = status;
				return item;
			});
			return activity;
		});
		this.setState({data: data});
		this.props.updateData("pick", sendData);
	};
	
	render() {
		const {data} = this.state;
		let showTip = data.over_buy_limit;
		return (
			<section className="cart-store c-mb10 c-bgfff ">
				<CartStoreHeader data={data} edit={ this.state.edit } toggleEdit={ this.toggleEdit }
				                 handleCheck={ this.toggleCheck }/>
				<CartStoreBody {...this.props} data={data.activity } edit={this.state.edit } shopId={ data.shop_id }/>
				<CartStoreTotal data={ data.totalCart }/>
				{ showTip ? <CartStoreTip /> : ""}
				{ showTip ?
					[<span className="warn-border border-top" key="border-top"> </span>,
						<span className="warn-border border-btm" key="border-btm"> </span>,
						<span className="warn-border border-left" key="border-left"> </span>,
						<span className="warn-border border-right" key="border-right"> </span>
					] : ""
				}
			</section>
		)
	}
}

//购物车store 头部
class CartStoreHeader extends Component {
	render() {
		const {data, edit} = this.props;
		return (
			<div className="store-header">
				<div className="store-ckbox">
					<CheckIcon isCheck={data.storeCheck } handleCheck={ this.props.handleCheck }/>
				</div>
				<a onClick={(e)=>{
					e.preventDefault();
					data.shop_open_state === "open" ? browserHistory.push(`${DIR}/store/home?shop=${data.shop_id}`) : miniProgramShopCart();
				}}
				      className="store-name">
					{ data.shop_attr === "biz" ? <i className="qyg-shop-icon"> </i>: <i className="store-icon"> </i>} { data.shop_alias_name || data.shop_name}
				</a>
				<div className="store-edit" onClick={ this.props.toggleEdit }><span>{edit ? "完成" : "编辑"}</span></div>
			</div>
		)
	}
}

//购物车store body
class CartStoreBody extends Component {
	render() {
		const {edit, data, shopId, updateCartNum} = this.props;
		const html = data.map((item, i) => {
			return <StoreMarket edit={edit} key={i}
			                    data={item}
			                    shopId={ shopId }
			                    timeStamp={ item.timeStamp }
			                    updateCartNum={ updateCartNum }/>;
		});
		return (
			<div className="store-body">
				{html}
			</div>
		)
	}
}

//购物车store 提示
class CartStoreTip extends Component {
	render() {
		return (
			<div className="store-tip">
				<span>※</span> 抱歉，海外直邮类和跨境保税类商品总价超过限额¥2000，请分多次购买。
				<i className="trig-top-icon"> </i>
			</div>
		)
	}
}

//购物车store 综合
class CartStoreTotal extends Component {
	render() {
		const {data} = this.props;
		return (
			<div className="store-total c-tr">
				<p className="c-fs14">
					<span>活动优惠：- ¥ {data.total_discount.toFixed(2)}</span>
				</p>
				<p className="c-fs14">合计(不含税)：¥ {data.total_after_discount.toFixed(2)}</p>
			
			</div>
		)
	}
}

//购物车store 营销
class StoreMarket extends Component{
	render(){
		let {data,edit,shopId,timeStamp, updateCartNum }=this.props;
		let newItems = data.items.concat(data.subItems);
		const html = newItems && !!newItems.length && newItems.map((item,i)=>{
				if( !item ){
					return "";
				}
				return <OneItemHOC {...data}
				                   edit={edit}
				                   type={data.type}
				                   data={item}
				                   key={i}
				                   updateCartNum={ updateCartNum }
				                   timeStamp={ timeStamp }/>
			});
		return (
			<section className="store-market">
				{ data.type !== "common" && <MarketHeader {...data} shopId={ shopId }/> }
				{html}
			</section>
		)
	}
}

//购物车store 营销 头部信息
class MarketHeader extends Component{
	render(){
		const { tag, rule, no_cap_show, type, is_satisfied, shopId, promotion_id, subItems } = this.props;
		let activity = "";
		switch( type ){
			//满减
			case "fullminus":
				activity = <Link  to={`${DIR}/minusActivity?promotion_id=${ promotion_id }&shop_id=${ shopId }`}
				                  className="c-dpb c-lh20">
					<span className="tag">{tag}</span>{is_satisfied ?
						<span><b>已满足</b>【{rule[0]}】</span>:
						<span>{rule.join("，")}{ no_cap_show?"，上不封顶":"" }</span>} &gt;
				</Link>;
				break;
			//满折
			case "fulldiscount":
				activity = <Link  to={`${DIR}/discountActivity?promotion_id=${ promotion_id }&shop_id=${ shopId }`}
				                  className="c-dpb c-lh20">
					<span className="tag">{tag}</span>{is_satisfied ?
						<span><b>已满足</b>【{rule[0]}】</span>:
						<span>{rule.join("，")}{ no_cap_show?"，上不封顶":"" }</span>} &gt;
				</Link>;
				break;
			//N元任选
			case "optionbuy":
				activity = <Link  to={`${DIR}/optionBuyActivity?promotion_id=${ promotion_id }&shop_id=${ shopId }`}
				                  className="c-dpb c-lh20">
					<span className="tag">{tag}</span>{is_satisfied ?
					<span><b>已满足</b>【{rule[0]}】</span>:
					<span>{rule.join("，")}{ no_cap_show?"，上不封顶":"" }</span>} &gt;
				</Link>;
				break;
			//换购
			case "exchangebuy":
				activity = <div>
					<Link to={`${DIR}/exchangeBuy?promotion_id=${ promotion_id }&shop_id=${ shopId }`} className="c-dpb c-lh20">
						<span className="tag">{tag}</span>
						{is_satisfied ?
							<span>【{rule[0]}】</span>:
							<span>{rule.join("，")}{ no_cap_show?"，上不封顶":"" }</span>} &gt;
					</Link>
					<div className="c-tr">
						{is_satisfied ?
							<Link to={`${DIR}/exchangeItem?promotion_id=${ promotion_id }&shop_id=${ shopId }`}
							      className="red-btn c-dpib c-tc">
								{ (subItems && subItems.length ) ? "重新换购": "立即换购"}
							</Link>:
							<Link to={`${DIR}/exchangeItem?look=1&promotion_id=${ promotion_id }&shop_id=${ shopId }`}
							      className="red-btn c-dpib c-tc">查看换购商品</Link>
						}
					</div>
					</div>;
			default:
				break;
		}
		return (
			<div className="market-header">
				{ activity }
			</div>
		)
	}
}

//一个商品
class OneItem extends Component {
	constructor(props) {
		super(props);
		this.state = {
			statusTip: false,
			quantity: props.data.quantity,
			initQuantity: props.data.quantity,
		};
		this.delayNumUpdate = delay(props.updateData, 200);
	}
	
	componentWillMount() {
		this.initBuyLimit();
	}
	
	componentWillReceiveProps(newProps) {
		if (newProps.edit === this.props.edit) {
			this.setState({
				quantity: newProps.data.quantity,
				initQuantity: newProps.data.quantity
			})
		}
	}
	
	//初始化商品可购买最大数量
	initBuyLimit = () => {
		const {data} = this.props;
		const {promotion, store} = data;
		let max = store.total - store.freeze;
		let real = max;
		if( promotion && promotion.real_store ){
			max = promotion.real_store;
			real = max;
		}
		if (promotion && promotion.promotion_type === "flashsale") {
			max = promotion.user_buy_limit - promotion.user_buy_count;
		}
		this.setState({
			buyLimit: max,
			realStore: real
		});
	};
	
	toggleTip = () => {
		this.setState({statusTip: !this.state.statusTip})
	};
	//切换check
	handleCheck = () => {
		let {data} = this.props;
		this.props.updateData("pick", {cart_id: {[data.cart_id]: Number(!data.is_checked)}});
	};
	
	//input数量 change 变化
	handleNum = (e) => {
		if (!Number.isInteger(+e.target.value)) {
			return;
		}
		this.setState({
			quantity: +e.target.value
		});
	};
	
	//input数量 blur 变化
	handleInputNum = (e) => {
		let dom = e.target,
			{data, dispatch} = this.props,
			{initQuantity, quantity} = this.state;
		let min = +dom.getAttribute("min");
		if (quantity === initQuantity) {
			return;
		}
		if (!Number.isInteger(quantity)) {
			tip.show({msg: "请输入正确的数量哦"});
			this.setState({
				quantity: initQuantity
			});
			return;
		}
		if (quantity < min) {
			tip.show({msg: "至少需要1件哦"});
			this.setState({
				quantity: initQuantity
			});
			return;
		}
		this.props.updateData("update", {
			cart_id: data.cart_id,
			cart_num: quantity,
			mode: "deal"
		});
	};
	//点击减少
	handleReduce = () => {
		let {cart_id} = this.props.data;
		let {quantity} = this.state;
		this.setState({quantity: quantity - 1});
		this.delayNumUpdate("update", {
			cart_id: cart_id,
			cart_num: quantity - 1,
			mode: "deal"
		});
	};
	//点击增加
	handlePlus = () => {
		let {cart_id} = this.props.data;
		let {quantity} = this.state;
		this.setState({quantity: quantity + 1});
		this.delayNumUpdate("update", {
			cart_id: cart_id,
			cart_num: quantity + 1,
			mode: "deal"
		});
	};
	
	//移入收藏夹
	handleCollect = (cb) => {
		let {data, dispatch} = this.props;
		modalA.show({
			msg:"当前选中的商品移入收藏夹成功后，将从购物袋删除哦",
			sure: () => {
				this.props.updateData("collect", {
					cart_id: [data.cart_id],
					item_id: [data.item_id]
				}, cb)
			}
		})
	};
	//点击删除
	handleDelete = (cb) => {
		let {data, dispatch} = this.props;
		modalA.show({
			msg:"确定将这1件商品删除？",
			sure: () => {
				this.props.updateData("remove", {
					cart_id: {
						[ data.cart_id ]: data.cart_id
					}
				}, cb)
			}
		})
	};
	
	render() {
		const {data, invalid, updateCartNum} = this.props;
		return (
			<div className="one-item">
				<OneItemBody  {...this.props} {...this.state}
				              toggleTip={this.toggleTip }
				              handleCheck={ this.handleCheck }
				              handleNum={ this.handleNum }
				              handleInputNum={ this.handleInputNum }
				              handleReduce={ this.handleReduce }
				              handlePlus={ this.handlePlus }
				              handleDelete={ this.handleDelete.bind( null, updateCartNum ) }
				              handleCollect={ this.handleCollect.bind( null, updateCartNum ) } />
				{ ( data.tax_rate && this.state.statusTip ) ? <TaxRateTip taxRate={ data.tax_rate} tax={ data.tax} /> :""}
				<OneItemBottom invalid={invalid}
				               data={this.props.data}
				               type={this.props.type}
				               quantity={this.state.quantity}/>
			</div>
		)
	}
}

//分开支付
class PayDivide extends Component {
	render() {
		let { data } = this.props;
		return <div onClick={ this.props.promptClose }>
			{ this.props.active && <Shady /> }
			<div className={`pay-divide ${this.props.active ? "active" : "" }`}
			     onTouchMove={ (e)=> e.preventDefault() }>
				<h3>请分开结算以下商品</h3>
				<div className="body">
					<div className="one-list">
						<div className="top">企业购商品</div>
						<div className="middle g-row-flex">
							<div className="num">共计{data.qygNum}件</div>
							<div className="price g-col-1">合计：<i>¥{data.qygPrice.toFixed(2)}</i></div>
							<Link className="button c-dpb" to={`${DIR}/orderConfirm?mode=cart_buy&buy_type=1`}>去结算</Link>
						</div>
					</div>
					<div className="one-list">
						<div className="top">普通商品</div>
						<div className="middle g-row-flex">
							<div className="num">共计{data.commonNum}件</div>
							<div className="price g-col-1">合计：<i>¥{data.commonPrice.toFixed(2)}</i></div>
							<Link className="button  c-dpb" to={`${DIR}/orderConfirm?mode=cart_buy&buy_type=0`}>去结算</Link>
						</div>
					</div>
				</div>
				<div className="divide-btn">
					<div className="btn" onClick={ this.props.promptClose }>关闭</div>
				</div>
			</div>
		</div>
		
	}
}

function oneItemDispatch(dispatch, props) {
	return {
		dispatch,
		updateData(api, data, cb){
			loadMask.show();
			axios.request({
				...pageApi[api],
				data: data
			}).then(result => {
				loadMask.destroy();
				if( !result.data.status ){
					tip.show({msg: result.data.msg });
				}
				dispatch(createActions('initialData', {result: result.data, update: true}));
				if (cb) cb();
				
			}).catch(error => {
				loadMask.destroy();
				console.error(error);
			})
		}
	}
}

const OneItemHOC = connect(null, oneItemDispatch)(OneItem);

//一个商品 中间信息
class OneItemBody extends Component {
	render() {
		const {edit, data, invalid, quantity, buyLimit, realStore} = this.props;
		const {promotion, item_id} = data;
		return (
			<div className="item-body">
				<div className="item-ckbox">
					<CheckIcon handleCheck={ this.props.handleCheck }
					           invalid={invalid}
					           isCheck={data.is_checked }
					           seckill={ data.promotion && data.promotion.promotion_type === "seckill"}
					           disable={ data.obj_type === "exchange" } />
				</div>
				<div className="item-detail" style={{paddingRight:"0.34667rem"}}>
					<Link className="item-img c-dpb"
					      to={`${DIR}/item?item_id=${item_id}`}
					      onClick={(e)=>{ if(edit){ e.preventDefault() } } } >
						<img src={data.image_default_id } width="70" height="70" />
						{ data.is_gray ? <img className="no-item" src={require('../../../img/shopCart/no-item.png')}/>: "" }
					</Link>
					<div className="item-info">
						<div className="info-top">
							<div className="info-text">
								{ edit ?
									<NumCtrl data={data}
									         disable={data.obj_type === "exchange"}
									         handlePlus={this.props.handlePlus}
									         quantity={ this.props.quantity }
									         handleReduce={this.props.handleReduce }
									         handleNum={this.props.handleNum }
									         handleInputNum={this.props.handleInputNum}
									         buyLimit={this.props.buyLimit }/> :
									<Link className="info-title" to={`${DIR}item?item_id=${item_id}`}>
										{data.type === "Direct" && <span className="label yellow-label">海外直邮</span>}
										{data.type === "Bonded" && <span className="label blue-label">跨境保税</span>}
										{promotion &&
										<span className="act-label  c-fb">{promotion.promotion_tag}</span> }
										{data.title}
									</Link>
								}
								<div className="info-props">
									{data.spec_info }
								</div>
							</div>
							<div className="info-price">
								<p>
									¥{ promotion ? (+promotion.promotion_price).toFixed(2) : (+data.price).toFixed(2) }</p>
								<p>×{ quantity }</p>
								{ !edit && !invalid && ( realStore < quantity ) &&
								<p className="c-cf88 c-fs12">库存不足</p>}
							</div>
						</div>
						<div className="info-btm c-tr">
							{ !invalid ?
								( edit ?
										<i className="delete-box-icon" onClick={ this.props.handleDelete }> </i> :
										( data.tax_rate ?
												<div className="info-btm-text" onClick={ this.props.toggleTip }>
													税费：¥{ Number(data.tax).toFixed(2)} <i ref="arrow"
													                                      className={this.props.statusTip ? "arrow-btm-s-icon active" : "arrow-btm-s-icon"}> </i>
												</div> : ""
										)
								) :
								<div className="black-btn" onClick={ this.props.handleCollect }>移入收藏夹</div>
							}
						</div>
					</div>
				</div>
			</div>
		)
	}
}

//一个商品 底部信息
class OneItemBottom extends Component {
	render() {
		let {invalid, data} = this.props;
		let {store, promotion} = data;
		let max = store.total - store.freeze;
		if( promotion && promotion.real_store ){
			max =  promotion.real_store;
		}
		let qygInfo = "";
		if(  data.buy_type ===1 ){
			try{
				let itemNums = Object.keys(data.marks.business.rules);
				qygInfo = itemNums.map( item =>{
					return `满${item}件，每件${ data.marks.business.rules[item]}元`
				}).join(";");
			}catch (err){}
		}
		return(
			<div className={`item-bottom ${this.props.type !=="common" ? "no-border": "" }`}>
				{ !invalid?
					<div className="item-limit c-cf88">
						{ (promotion && promotion.promotion_type === "flashsale") ?
							<span>限购{ promotion.user_buy_limit - promotion.user_buy_count }件 </span> :
							( max < 6 ?
									<span>仅剩{max}件</span> :
									( qygInfo && <span>{qygInfo}</span> )
							) }
					</div> :
					<div className="item-limit c-c666">
						{(data.status === "Stock" || data.status === "Shelving" || Number(data.valid) === 0 ) ? "商品已下架" : ( max <= 0 ? "商品暂不销售" : "") }
					</div>
				}
				{ !this.props.invalid &&
				data.gifts && data.gifts.map((item, i)=>{
					// let noGoods = item.item_status !== "Shelves" || item.store <= 0 ;
					return  <Link to={`${DIR}/item?item_id=${item.item_id}`} key={i} className={ !item.is_gray ?"item-give val":"item-give"}>
						<div className="give-info">
							{ Boolean(item.is_gray) && <i>[无货]</i>}<span>【赠品】</span>{item.title}
						</div>
						<div className="give-num">×{item.gift_num}</div>
					</Link>
				})
				}
			
			</div>
		
		)
	}
}


//一个商品 税率提示
class TaxRateTip extends Component {
	render() {
		if (this.props.taxRate && !(+this.props.tax )) {
			return <div className="tax-tip">
				※商品已包税，无需再额外缴纳
			</div>
		} else {
			return <div className="tax-tip">
				※税率{(this.props.taxRate * 100).toFixed(2)}%，结算税费以提交订单时应付总额明细为准
			</div>
		}
	}
}

//购物车总和
class CartTotal extends Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		let {data, cartCheck, updateCartNum} = this.props;
		return (
			<section className="cart-total">
				<div className="select-all" onClick={ this.props.handleCheck }><CheckIcon isCheck={ cartCheck }/>全选
				</div>
				{  this.props.editNum ?
					<div className="cart-collect"
					     onClick={  this.props.handleCollects.bind(null, data.strip, updateCartNum) }>
						<div className="black-btn btn">移入收藏夹</div>
					</div> :
					<div className="cart-total-dtl">
						<p className="c-fs12">合计(不含税)：<span
							className="c-fs15 c-cf00"><i>¥</i>{ data.price.toFixed(2)}</span></p>
						<p className="c-fs10 c-c999">预计税费：<i>¥</i>{data.tax.toFixed(2)}</p>
					</div>
				}
				{ this.props.editNum ?
					<div className="cart-delete"
					     onClick={ this.props.handleRemoves.bind(null, data.strip, updateCartNum) }>
						<div className="red-btn btn">删除商品</div>
					</div> :
					(data.canSub && data.num ?
							<div className="cart-submit btn c-bgdred" onClick={ this.props.formSubmit }>
								<span>结算({ data.num })</span>
							</div> :
							<div className="cart-submit btn c-bgc9">
								<span>结算{ data.num ? `(${ data.num })` : ""}</span>
							</div>
					)
				}
			</section>
		)
	}
}

//check标签
class CheckIcon extends Component {
	constructor(props) {
		super(props);
		this.state = {
			check: this.props.isCheck
		};
	}
	
	componentWillReceiveProps(props) {
		this.setState({check: props.isCheck});
	}
	
	checkHandle = () => {
		this.props.handleCheck && this.props.handleCheck();
		this.setState({check: !this.state.check});
	}
	
	render(){
		if( this.props.seckill ){
			return <span className="label red-label c-br3">秒杀</span>;
		}
		if(this.props.invalid ){
			return <span className="label grey-label c-br3">失效</span>;
		}else if(this.props.disable) {
			return null;
		}else{
			return <div onClick={ !this.props.disable && this.checkHandle }>
				<span className={ this.state.check ?"check-icon check": "check-icon" }> </span>
			</div>
		}
	}
}

//数量控制
class NumCtrl extends Component{
	scrollView(e){
		let aimPos = 70;
		window.scrollTo(0, window.scrollY + e.target.getBoundingClientRect().top - aimPos );
	}
	render(){
		const { buyLimit,quantity, disable } = this.props;
		return(
			<div className="num-ctrl">
				{quantity<=1 || disable ?
					<div className="link c-bgf4" ><i className="sub-l-dis-icon"> </i></div>:
					<div className="link" onTouchTap={this.props.handleReduce }><i className="sub-l-icon"> </i></div>
				}
				<input type="number" min="1"
				       value={this.props.quantity }
				       onChange={ this.props.handleNum }
				       max={ buyLimit }
				       onFocus={ this.scrollView }
				       onBlur={ this.props.handleInputNum }/>
				{quantity >= buyLimit || disable ?
					<div  className="link c-bgf4" ><i className="plus-l-dis-icon"> </i></div> :
					<div className="link" onTouchTap={this.props.handlePlus }><i className="plus-l-icon"> </i></div>
				}
			</div>
		)
	}
}


function getCheckData(data, keyArr) {
	if (!( data && data.length )) {
		return {};
	}
	let result = {};
	
	const typeData = function (arr, data) {
		arr.forEach((key) => {
			if (!result[key]) {
				result[key] = [];
			}
			result[key].push(data[key]);
		})
	};
	data.forEach((sotre) => {
		sotre.activity.forEach((act) => {
			act.items.forEach((item) => {
				if (item.is_checked) {
					typeData(keyArr, item);
				}
			});
		});
	});
	return result;
}

//connect state
function shopCartState(state, props) {
	return {
		...state.global,
		...state.shopCart
	}
}

//connect dispatch
function shopCartDispatch(dispatch, props) {
	return {
		dispatch,
		dividePayClose:()=>{
			dispatch( createActions('dividePrompt', { status: false }));
		},
		initialData(){
			createActions('resetState');
			axios.request(pageApi.init).then(result => {
				if( !result.data.status ){
					tip.show({msg: result.data.msg });
				}
				dispatch(createActions('initialData', {result: result.data }));
			}).catch(error => {
				tip.show({msg: "小泰发生错误，请稍后再试~"});
				console.log(error);
			})
		},
		computeEditNum(status){
			dispatch(createActions('computeEdit', {status: status}))
		},
		handleCheck(data){
			let status = Number(!data.cartCheck);
			let time = new Date().getTime();
			data.cartCheck = status;
			let sendData = {cart_id: {}};
			data.cartCheck = status;
			if (data.valid_items && data.valid_items.length) {
				data.valid_items = data.valid_items.map((store) => {
					store.storeCheck = status;
					store.activity.map((activity) => {
						activity.timeStamp = time;
						activity.items.map((item) => {
							sendData.cart_id[item.cart_id] = status;
							item.is_checked = status;
							return item;
						});
						return activity;
					});
					return store;
				});
			}
			dispatch(createActions('updateCartCheck', {data: data}));
			return sendData;
		},
		
		updateData(api, data, cb){
			loadMask.show();
			axios.request({
				...pageApi[api],
				data: data
			}).then(result => {
				loadMask.destroy();
				if( !result.data.status ){
					tip.show({ msg: result.data.msg });
				}
				dispatch(createActions('initialData', {result: result.data, update: true}));
				if (cb) cb();
				
			}).catch(error => {
				loadMask.destroy();
				console.log(error);
			})
		},
		formSubmit(){
			dispatch( (dispatch,getState)=>{
				let { divideTotal } = getState().shopCart;
				if( divideTotal.commonNum &&  divideTotal.qygNum ) {
					dispatch( createActions('dividePrompt', { status: true }));
				}
				if( divideTotal.commonNum && !divideTotal.qygNum ){
					browserHistory.push('/orderConfirm?mode=cart_buy&buy_type=0');
				}
				if( !divideTotal.commonNum && divideTotal.qygNum ){
					browserHistory.push('/orderConfirm?mode=cart_buy&buy_type=1');
				}
			});
		}
	}
}

function shopCartProps(stateProps, dispatchProps, props) {
	let {dispatch} = dispatchProps;
	return {
		...stateProps,
		...dispatchProps,
		...props,
		//批量移入收藏夹
		handleCollects(num, cb){
			if (!num) {
				tip.show({ msg:"您还没有选择商品哦" });
				return;
			}
			let sendData = getCheckData(stateProps.data.valid_items, ["item_id", "cart_id"]);
			dispatchProps.updateData("collect", sendData, cb);
		},
		//批量删除
		handleRemoves(num, cb){
			if (!num) {
				tip.show({ msg:"您还没有选择商品哦" });
				return;
			}
			let sendData = getCheckData(stateProps.data.valid_items, ["cart_id"]);
			modalA.show({
				msg: `确定将这${ num }件商品删除？`,
				sure:()=>{
					dispatchProps.updateData("remove", sendData, cb)
				}
			});
		},
	}
}

export default connect(shopCartState, shopCartDispatch, shopCartProps)(ShopCart);