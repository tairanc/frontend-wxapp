import createReducers from './createReducers.js';
import Immutable from 'immutable';

let initialState = {
	errorState: true,//网络异常
	from: "",//记录跳到哪个页面
	nav: "collection",//商品和店铺判断
	filterUpdate: true,//筛选项是否更新
	goodListUpdate: false,
	windowHeight: 0,//页面高度
	load: false,//是否在请求数据中
	init: false,//是否初始化完成
	isQuickSelect: false,//分类是否展开
	keyWord: "",//关键字
	param: {},//搜索参数
	searchData: "",//搜索入参
	currentPage: "",//当前所在页
	totalPage: "",//总页数
	categoriesList: [],//分类列表
	manage: false,//是否为管理状态
	ifChooseAll: false,//是否选择全部
	delCount: 0,//删除数量
	shady: false,//遮罩层开关
	DisGoods: 1, //失效商品判断开关
	defaultNoSave: false,//默认分类下没有收藏商品
	noSave: false,//没有收藏商品
};

function setData(state, result, filterUpdate) {
	let data = Object.assign({}, { ...state }, {
		load: true,
		goodsList: result.data.item_list
	});
	if (filterUpdate && result.data.statistics) {
		data = Object.assign({}, data, {
			categoriesList: Object.values(result.data.statistics) || []
		});
	}
	return data;
}
function concatData(state, result) {
	state.goodsList = state.goodsList.concat(result.data.item_list);
	return state;
}
function setSearch(state, data) {
	let searchData = { ...state.searchData, ...data };
	return { ...state, searchData: searchData };
}
function goodCollection(state = initialState, action) {
	switch (action.type) {
		case 'isError':
			return { ...state, errorState: action.errorState };
		case 'setFrom':
			return { ...state, from: action.from };
		case 'setNav':
			return { ...state, nav: action.nav };
		case 'setFilterUpdate':
			return { ...state, filterUpdate: action.filterUpdate };
		case 'setGoodListUpdate':
			return { ...state, goodListUpdate: action.goodListUpdate };
		case 'windowHeight':
			return { ...state, windowHeight: action.windowHeight };
		case 'setInit':
			return { ...state, init: action.init };
		case 'resetState':
			return { ...initialState, keyWord: action.keyWord, searchType: action.searchType };
		case 'setInitItem':
			return {
				...state,
				categoriesList: action.result.data.statistics ? Object.values(action.result.data.statistics) : []
			};
		case 'isLoad':
			return { ...state, load: action.load };
		case 'setData':
			return setData(state, action.result, action.filterUpdate);
		case 'setSearch':
			return setSearch(state, action.searchData);
		case 'concatData':
			return concatData(state, action.result);
		case 'setCurrentPage':
			return { ...state, currentPage: action.current };
		case 'setTotalPage':
			return { ...state, totalPage: action.total };
		case 'toggleQuickSelect':
			return { ...state, isQuickSelect: action.isQuickSelect };
		case 'toggleManage':
			return { ...state, manage: action.manage };
		case 'changeChooseAll':
			return { ...state, ifChooseAll: action.ifchooseAll };
		case 'delCount':
			return { ...state, delCount: action.delCount };
		case 'shady':
			return { ...state, shady: action.shady };
		case 'defaultNoSave':
			return { ...state, defaultNoSave: action.defaultNoSave };
		case 'noSave':
			return { ...state, noSave: action.noSave };
		default:
			return state;
	}
}

export default createReducers("goodCollection", goodCollection, initialState);