import createReducers from './createReducers.js';
import Immutable from 'immutable';

let initialState = {
	load: true,
	address: [],
	amounts: {},
	assist: {},
	cart: {},  //认购对象
	idCards: [],
	enableSubscribe:[],
	invoice: {
		allow_invoice: false,
		status: false,
		tip: false,
		text: "个人-电子",
		type: "ELEC",
		action: 1,
		name: "个人",
		// id: 0
	},  //开票信息
	orderFormRegionList: {}, //订单区块
	buyMessage: {},  //商家留言
	couponStatus: false, //优惠券数据状态
	//优惠券和红包
	couponList: {
		red_packets: [],
		usable_coupons: [],
		unusable_coupons: [],
	},
	//支付类型
	payTypeChoose: {
		show: false,
		type: "10"    //支付类型 10 线上支付 20 线下支
		// type: "online"
	},
	redPacketShow: false, //红包弹窗
	agree: true,
	emptyAddress: false, //空地址
	newAddress: "",  //用于显示地址信息
	nonDetailAddress: "", //省市区
	//优惠券选择
	couponSelect: {
		code: "",
		limit: "",
		desc: 0
	},
	from: "",
	disTop: 0,
	invalidCouponShow: false,//失效优惠券弹窗
	invoiceItemShow: false,//发票商品弹窗

	diffNameModal: false, //身份证与地址名字不同
	alterationModal: false, //信息变动弹窗
	invoiceModal: false, //开具发票时显示提示
	redSelectModal: {
		show: false,
		msg: ""
	}, //红包报错时提示

	itemModal: false,     //优惠券使用页面可用商品弹窗
	overBuyLimitItemModal: false,  //...
	hasNotice: true,
	invalidSupplyGoods:[]
};

function initialData(state, data, chooseAddress) {
	let {newAddress, nonDetailAddress, address, amounts, assist, cart, idCards, invoice, orderFormRegionList, from} = state,
		disabledInvoiceItem = [], shopIdArr = [];
	invoice = {...invoice, ...data.invoice};
	data.invoice.disabled_cart_items.map((id, i) => {
		data.cart.enabled_goods.map((item, i) => {
			if (id === item.unique_id) {
				disabledInvoiceItem.push(item);
			}
		});
	});
	data.orderFormRegionList.map((item, i) => {
		shopIdArr.push(item.shopInfo.shop_id)
	});
	if (chooseAddress && !chooseAddress.address_id) {
		nonDetailAddress = chooseAddress.detail_address;  //用于显示省市区弹框（详情页带过来的）
	} else {
		newAddress = chooseAddress  //用于展示详情页带过来的详细地址和地址选择页的详细地址
	}

	//匹配收货人的身份信息
	let chooseIdCard = [], tempAdd = newAddress || data.address[0];
	chooseIdCard = data.idCards.filter((item, i) => {
		if (tempAdd) {
			return item.name === tempAdd.name
		}
	});
	return {
		...state,
		address: data.address,
		amounts: data.amounts,
		initAmounts: data.amounts,  //应用红包initAmounts  必须为初始化amounts
		assist: data.assist,
		cart: data.cart,
		cartTicket: data.cartTicket,
		enableSubscribe:data.enableSubscribe,
		idCards: chooseIdCard,
		chooseIdCard: {},
		invoice: invoice,
		orderFormRegionList: data.orderFormRegionList,
		disabledInvoiceItem: disabledInvoiceItem,
		shopIdArr: shopIdArr,
		nonDetailAddress: nonDetailAddress,  //省市区
		newAddress: newAddress || data.address[0] || "",  //切换地址成功之后，页面中显示的地址有前端控制，后端返回来的地址不能用（是初始地址）
		load: false
	}
}

function initialDataUpdate(state, data, cartTicket) {
	return {...state, amounts: data, cartTicket: cartTicket}
}

function initCoupon(state, data, couponStatus) {
	let red_packets = redPacketFilter(state.cart.enabled_goods, data.red_packets);
	red_packets.map((item) => {  //初始化红包加is_used is_enable code参数
		item.is_used = false;
		item.is_enable = true;
		item.code = item.coupon_code;
	});
	data.red_packets = red_packets;
	let {amounts, couponSelect} = state;
	let deductMoney = data.usable_coupons[0] ? data.usable_coupons[0].discount_money : 0;
	let useCode = data.usable_coupons[0] && data.usable_coupons[0].coupon_code || "";
	let newPayment = amounts.payment - deductMoney;
	return {
		...state,
		couponList: data,
		couponStatus: couponStatus,
		amounts: {...amounts, discount_coupon: deductMoney, payment: newPayment},
		couponSelect: {...couponSelect, desc: deductMoney, code: useCode},
		initRedPackets: red_packets  //过滤后的可用红包
	};
}

function getArrayByArrays(arrays) {
	let arr = [""];
	for (let i = 0; i < arrays.length; i++) {
		arr = getValuesByArray(arr, arrays[i]);
	}
	return arr;
}

function getValuesByArray(arr1, arr2) {
	let arr = [];
	for (let i = 0; i < arr1.length; i++) {
		let v1 = arr1[i];
		for (let j = 0; j < arr2.length; j++) {
			let v2 = arr2[j];
			let value = v1 + v2;
			arr.push(value);
		}
	}
	return arr;
}


//红包过滤
/*export function redPacketFilter(enabledGoods, redData) {
 let redPacket = [];
 //红包价格过滤
 /!*let itemPrices = {
 10: 0,          //Normal
 20: 0,         //Virtual
 30: 0,         //Internal
 };

 let shopAttr = [1, 2, 3];  //适用店铺性质：ALL 所有渠道；1 泰然易购；2 小泰良品；3 企业购
 let shopModel = [1, 2, 3];  //适用店铺模式：ALL 所有渠道；1 网店；2 无人店；3 餐饮店*!/
 let itemPrices = {};
 let newArr = getArrayByArrays([[10, 20, 30], [1, 2, 3], [1, 2, 3]]);
 newArr.map((item, i) => {
 itemPrices[item] = 0
 });
 if (enabledGoods && enabledGoods.length) {
 let cartPrice = {};
 enabledGoods.map((item, i) => {
 let itemApply = String(item.type) + String(item.shop.attr) + String(item.shop.model);
 if (itemApply in itemPrices) {
 cartPrice[item.sku_id] = {
 price: item.amounts.payment,
 type: itemApply
 }
 }
 });
 let prices = Object.keys(cartPrice);
 prices.forEach((id, i) => {
 itemPrices[cartPrice[id].type] += cartPrice[id].price;
 })
 }
 redData.map((item) => {
 let limitPrice = 0;
 let type = item.applicable_item_type === "ALL" ? [10, 20, 30] : item.applicable_item_type.split(",");
 let attr = (item.applicable_shop_attr === "ALL" || !item.applicable_shop_attr) ? [1, 2, 3] : item.applicable_shop_attr.split(",");
 let model = (item.applicable_shop_model === "ALL" || !item.applicable_shop_model) ? [1, 2, 3] : item.applicable_shop_model.split(",");
 let platform = getArrayByArrays([type, attr, model]);
 limitPrice = platform.reduce((prev, next) => {
 return prev + itemPrices[next]
 }, 0);
 /!*if (item.applicable_item_type === "ALL") {
 limitPrice = itemPrices[10] + itemPrices[20] + itemPrices[30];
 } else {
 let platform = item.applicable_item_type.split(",");
 limitPrice = platform.reduce((prev, next) => {
 return prev + itemPrices[next]
 }, 0);
 }*!/
 if (limitPrice > item.deduct_money) {
 redPacket.push(item);
 }
 });
 return redPacket;
 }*/
export function redPacketFilter(enabledGoods, redData) {
	let redPacket = [];
	//红包价格过滤
	let itemPrices = {
		10: 0,          //Normal
		20: 0,         //Virtual
		30: 0,         //Internal
	};
	if (enabledGoods && enabledGoods.length) {
		let cartPrice = {};
		enabledGoods.map((item, i) => {
			if (item.type in itemPrices) {
				cartPrice[item.sku_id] = {
					price: item.amounts.payment,
					type: item.type
				}
			}
		});
		let prices = Object.keys(cartPrice);
		prices.forEach((id, i) => {
			itemPrices[cartPrice[id].type] += cartPrice[id].price;
		})
	}

	redData.map((item) => {
		let limitPrice = 0;
		if (item.applicable_item_type === "ALL") {
			limitPrice = itemPrices[10] + itemPrices[20] + itemPrices[30];
		} else {
			let platform = item.applicable_item_type.split(",");
			limitPrice = platform.reduce((prev, next) => {
				return prev + itemPrices[next]
			}, 0);
		}
		if (limitPrice > item.deduct_money) {
			redPacket.push(item);
		}
	});
	return redPacket;
}

function filterRed(state, list) {
	let {couponList, couponList: {red_packets}} = state, newRedList = [];
	red_packets.map((item, i) => {
		let filterRed = list.filter((data) => {
			return data.code === item.coupon_code;
		});
		item.disabled = !filterRed[0].is_enable;
	});
	return {...state, couponList: {...couponList, red_packets: red_packets}};
}

function resetRedPacket(state, data) {
	let {couponList} = state;
	data.map((item, i) => {
		item.disabled = !item.is_enable;
	});
	return {
		...state,
		couponList: {...couponList, red_packets: data}
	};
}

function equalName(state) {
	let {newAddress, idCards} = state;
	newAddress = {...newAddress, name: idCards[0].name};
	return {...state, newAddress: newAddress, diffNameModal: false}
}

function selectIdentify(state, data) {
	let {idCards} = state;
	idCards = [];
	idCards.push(data);
	return {...state, idCards: idCards}
}


function selectAddress(state, data, from) {
	return {...state, newAddress: data, from: from};
}

function selectAddressForOther(state, data, from, name) {
	let temp = {};
	temp[`newAddressFor${name}`] = data;
	return {...state, ...temp};
}

function redSelect(state, arr) {
	let {couponList, couponList: {red_packets}} = state;
	arr.forEach((index) => {
		red_packets[index].check = !red_packets[index].check;
	});
	return {...state, couponList: {...couponList, red_packets: red_packets}};
}

function redClear(state) {
	let {couponList, couponList: {red_packets}} = state;
	red_packets.map((item) => {
		item.check = false;
	});
	return {...state, couponList: {...couponList, red_packets: red_packets}};
}

function toggleInvoice(state, invoiceData) {
	let {invoice} = state;
	if (invoiceData) {  //有电子发票
		invoiceData.map((item, i) => {
			if (item.type == 3) {
				invoice = {...invoice, id: item.invoice_id};
			}
		})
	} else { //重置invoice
		invoice = {
			...invoice, type: "ELEC", text: "个人-电子", action: 1, name: "个人", tip: false,
		};
	}

	invoice = {...invoice, status: !invoice.status};

	return {...state, invoice: invoice};
}


const dataToStr = {
	typeToStr: {
		NORMAL: "普通",
		ELEC: "电子"
	},
};

function infoToStr(type, head, unit) {
	if (type === "VAT") {
		return unit + "-增值税";
	}
	return head + "-" + dataToStr.typeToStr[type];
}


function updateInvoice(state, type, action, invoiceName, unitName, id) {
	let imData = Immutable.fromJS(state);
	imData = imData.setIn(["invoice", "type"], type);
	imData = imData.setIn(["invoice", "action"], action);
	imData = imData.setIn(["invoice", "text"], infoToStr(type, invoiceName, unitName));
	imData = imData.setIn(["invoice", "name"], invoiceName);
	imData = imData.setIn(["invoice", "id"], id);
	imData = imData.setIn(["invoice", "status"], true);
	return imData.toJS();
}

function orderConfirm(state = initialState, action) {
	switch (action.type) {
		case 'resetState':
			return initialState;
		case 'initialData':
			return initialData(state, action.result, action.showChooseAddress);
		case 'initialDataUpdate':
			return initialDataUpdate(state, action.data, action.cartTicket);
		case 'addMessage':
			return {...state, buyMessage: {...state.buyMessage, [action.id]: action.value}};
		case 'couponData':
			return initCoupon(state, action.result, action.couponStatus);
		/*case 'couponPopup':
		 return {...state, couponShow: action.status};*/
		case 'redPacketPopup':
			return {...state, redPacketShow: action.status};
		case 'filterRed':
			return filterRed(state, action.data);
		case 'redSelect':
			return redSelect(state, action.selectArr);
		case 'redClear':
			return redClear(state);
		case 'resetRedPacket':
			return resetRedPacket(state, action.data);

		case 'selectCoupon':
			let {amounts} = state;
			return {
				...state,
				couponSelect: action.couponSelect,
			};
		case 'changeItemModal':
			return {...state, itemModal: action.flag};

		case 'paymentPopup':
			return {...state, payTypeChoose: {...state.payTypeChoose, show: action.status}};
		case 'paymentSelect':
			return {...state, payTypeChoose: {show: false, type: action.status}};

		case 'ctrlModal':
			return {...state, [ action.modal ]: action.status, firstCA: action.firstCA};
		case 'invoiceModal':
			let {invoiceModal} = state;
			return {...state, invoiceModal: !invoiceModal};
		case 'redSelectModal':
			return {...state, redSelectModal: {...action.modal}};
		case 'setOrigin':
			return {...state, from: action.origin};
		case 'saveTop':
			return {...state, disTop: action.value};
		case 'selectIdentify':
			return selectIdentify(state, action.data);
		case 'selectAddress':
			if (action.name) {
				return selectAddressForOther(state, action.data, action.from, action.name);
			} else {
				return selectAddress(state, action.data, action.from);
			}
		case 'selectInvoice':
			return updateInvoice(state, action.invoice, action.action, action.invoiceName, action.unitName, action.id);
		case 'agreeChange':
			return {...state, agree: !state.agree};
		case 'toggleInvoice':
			return toggleInvoice(state, action.invoiceData);
		case 'equalName':
			return equalName(state);
		case 'changeOverBuyLimitModal':
			return {...state, overBuyLimitItemModal: action.flag};
		case 'changeCrossBorderNoticeStatus':
			return {...state, hasNotice: action.hasNotice};
		case 'invalidSupplyGoods':
			return {...state, invalidSupplyGoods: action.data};
		default:
			return state;
	}
}

export default createReducers("orderConfirm", orderConfirm, initialState);