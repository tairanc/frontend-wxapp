import createReducers from './createReducers.js';
import Immutable from 'immutable';

let initialState = {
	load: true,
	listState: false,
	banner: {},
	list: {},
	entrance: {},
	page: {},
	oneList: {},
	item_list: {},
	barrage: "",
	billboard: "",
	disTop: 0,
	activeIndex: 0,
	isSending: false,
	showNext: true,  //切换滑块[加载数据]中间状态
	flag: false,  //返回页面的标记[为true 不请求接口]
	allSellOut: false,  //无导航 无banner 无列表商品
	partSellOut: false, //只有banner 无导航 无列表商品
	itemStatus: false
};
function initData(result, state) {
	let {allSellOut, partSellOut} = state;
	if (!result.list.list.length && !result.banner.list.length) {
		allSellOut = true;
	}
	if (!result.list.list.length && result.banner.list.length) {
		partSellOut = true;
	}
	return {
		...state,
		banner: result.banner,
		list: result.list,
		entrance: result.entrance,
		billboard: result.notice,
		allSellOut: allSellOut,
		partSellOut: partSellOut,
		load: false
	};
}


function initListData(result, state) {
	if (result.code !== 0) {
		return {...state};
	}
	return {
		...state,
		oneList: result.data.data.list,
		page: result.data.data.page,
		listState: true,
		showNext: true,
		flag: true
	};
}

function addMoreItemData(result, state) {
	if (result.code !== 0) {
		return {...state};
	}
	let {oneList} = state;
	oneList = {...oneList, item_list: oneList.item_list.concat(result.data.data.list.item_list)};
	return {...state, oneList: oneList, page: result.data.data.page, isSending: false, load: false};
}

function homeIndex(state = initialState, action) {
	switch (action.type) {
		case 'resetListData':
			return {...state, listState: false};
		case 'initData':
			return initData(action.result, state);
		case 'oneListSuccess':
			return initListData(action.result, state);
		case 'addMoreItem':
			return addMoreItemData(action.result, state);
		case 'barrageSuccess':
			let {barrage} = state;
			barrage = action.result.code === 0 ? action.result.data : "";
			return {...state, barrage: barrage};
		case 'resetBarrage':
			return {...state, barrage: ""};
		case 'saveTop':
			return {...state, disTop: action.value, activeIndex: action.index, flag: true};
		case 'isSendingState':
			return {...state, isSending: action.isSending};
		case 'handleState':
			return {...state, showNext: action.showNext};
		case 'handleFlagState':
			return {...state, flag: action.flag};
		case 'saveActiveIndex':
			return {...state, activeIndex: action.activeIndex};
		default:
			return state;
	}
}

export default createReducers("homeIndex", homeIndex, initialState);