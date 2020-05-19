import createReducers from './createReducers.js';
import Immutable from 'immutable';
import { browserHistory } from 'react-router';

let navList =[
	{text:"全部", status:0, url:"/groupList/0" },
	{text:"拼团中", status:1, url:"/groupList/1" },
	{text:"拼团成功", status:2, url:"/groupList/2" },
	{text:"拼团失败", status:3, url:"/groupList/3" }
];


let initialState ={
	navList:navList,
	list:{
		"4":{
			load:true,
			data:"",
			page:1,
			total:1000
		},
		"1":{
			load:true,
			data:"",
			page:1,
			total:1000
        },
		"2":{
			load:true,
			data:"",
			page:1,
			total:1000
		},
		"0":{
			load:true,
			data:"",
			page:1,
			total:1000
		}
	},
	prompt:{
		show:false,
		msg:""
	},
	request:false
};
function resetList( state, type ) {
	let imData = Immutable.fromJS( state );
	imData = imData.setIn(["list",type.toString() ],{
		load:true,
		data:"",
		page:1,
		total:1000
	});
	return imData.toJS();
}

function setRequestData( state, data ,cbData ) {
	
	/*if( data.biz_code  === 401 ){
		browserHistory.replace( `/login?redirect_uri=${ encodeURIComponent( cbData.url )}`);
		return state;
	}*/
    let imData = Immutable.fromJS( state );
	imData = imData.setIn( [ "list", cbData.type, "load" ], false );
    imData = imData.setIn( [ "list", cbData.type, "page" ], Number( cbData.pages) );
	imData = imData.setIn( [ "list", cbData.type, "total" ], data.data.group.total_count );
	imData = imData.setIn( [ "list", cbData.type, "data" ], data.data.group.data );
    return imData.toJS();
}

function concatRequestData( state, data, type, page ) {
	let imData = Immutable.fromJS( state );
	let newList = imData.getIn([ "list", type.toString(), "data" ]).toJS().concat( data.data.group.data );
	imData = imData.setIn( [ "list", type.toString(), "page" ],  Number( page) );
	imData = imData.setIn( [ "list", type.toString(), "total" ],data.data.group.total_count );
	imData = imData.setIn( [ "list", type.toString(), "data" ], newList );
    return imData.toJS();
}


function groupList( state = initialState, action ){
	switch( action.type ){
		case 'resetData':
			return initialState;
		case 'getDataLoad':
			return resetList( state, action.cbData.type );
		case 'getDataSuccess':
			return  setRequestData( state, action.result, action.cbData );
		case 'concatDataSuccess':
			return  concatRequestData( state, action.result, action.dataType,action.page );
		case 'ctrlPrompt':
			return { ...state, prompt:{ ...action.prompt } };
		default:
			return state;
	}
}

export default createReducers("groupList",groupList,initialState );