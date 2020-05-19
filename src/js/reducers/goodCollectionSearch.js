import createReducers from './createReducers.js';
import Immutable from 'immutable';

let initialState = {
	errorState:true,
	from:"",
	filterUpdate:true,
	windowHeight:0,
	load:false,
	init:false,
	isQuickSelect:false,
	prompt:{
		show:false,
		msg:""
	},
	keyWord:"",
	param:{},
	searchData:"",
	currentPage:"",
	totalPage:"",
	categoriesList:[]
};

function setData( state, result,filterUpdate ) {
	let data = Object.assign({}, {...state},{
		load: true,
		goodsList: (result.data.item_list)
	});
	if (filterUpdate && result.data.statistics) {
		data = Object.assign({}, data, {
			categoriesList: Object.values(result.data.statistics) || []
		});
	}
	return data;
}
function concatData( state,result ){
	state.goodsList = state.goodsList.concat(result.data.item_list);
	return state;
}
function setSearch(state,data){
	let searchData = {...state.searchData,...data};
	return {...state,searchData:searchData};
}
function goodCollectionSearch( state = initialState, action ) {
	switch ( action.type ){
		case 'isError':
			return {...state,errorState:action.errorState};
		case 'setFrom':
			return {...state,from:action.from};
		case 'ctrlPrompt':
			return { ...state, prompt:{ ...action.prompt } };
		case 'setFilterUpdate':
			return {...state,filterUpdate:action.filterUpdate};
		case 'windowHeight':
			return {...state,windowHeight:action.windowHeight};
		case 'setInit':
			return {...state,init:action.init};
		case 'resetState':
			return { ...initialState, keyWord: action.keyWord, searchType: action.searchType };
		case 'setInitItem':
			return {
				...state,
				categoriesList: action.result.data.statistics?Object.values(action.result.data.statistics):[]
			};
		case 'isLoad':
			return { ...state, load:action.load };
		case 'setData':
			return setData( state, action.result,action.filterUpdate );
		case 'setSearch':
			return setSearch( state,action.searchData);
		case 'concatData':
			return concatData( state,action.result);
		case 'setCurrentPage':
			return { ...state,currentPage:action.current };
		case 'setTotalPage':
			return { ...state,totalPage:action.total };
		case 'toggleQuickSelect':
			return {...state,isQuickSelect:action.isQuickSelect};
		default:
			return state;
	}
}

export default createReducers("goodCollectionSearch", goodCollectionSearch, initialState );