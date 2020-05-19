import createReducers from './createReducers.js';
import Immutable from 'immutable';
import { browser } from 'js/common/utils';
import { FYURL, PAYURL } from 'config/index';


//订单状态列表
const 	statusData = [
	{
		iconClass:"status-wait-pay-icon",
		text:"待付款",
		numberType:"wait_pay",
		url:"/tradeList/1",
		num:0
	},
	{
		iconClass:"status-wait-send-icon",
		text:"待发货",
		numberType:"wait_send",
		url:"/tradeList/2",
		num:0
	},
	{
		iconClass:"status-wait-receive-icon",
		text:"待收货",
		numberType:"wait_confirm",
		url:"/tradeList/3",
		num:0
	},
	{
		iconClass:"status-wait-evaluate-icon",
		numberType:"wait_rate",
		text:"待评价",
		url:"/tradeList/4",
		num:0
	},
	{
		iconClass:"after-sale-icon",
		text:"退款/售后",
		url:"/afterSale/list"
	}
];
//条形数据
const stripData1 =[
	{
		iconUrl:"/src/img/userCenter/people-grey-icon.png",
		text:"我的拼团",
		url:"/groupList/0",
		type:"link",
		active:false,
		point:true,
		num:0,
		needLogin:true
	},
	{
		iconUrl:"/src/img/userCenter/collect-love-icon.png",
		text:"我的收藏",
		url:"/myCollection",
		type:"link",
		active:false,
		point:false,
		num:0,
		needLogin:true
	},
	{
		iconUrl:"/src/img/userCenter/money-coupon-icon.png",
		text:"优惠券",
		url:"/couponList",
		num:"0张",
		type:"link",
		active:false,
		point:true,
		needLogin:true
	},
	{
		iconUrl:"/src/img/userCenter/red-packet-icon.png",
		text:"红包",
		url:"/redList",
		num:"0个",
		type:"link",
		active:false,
		point:true,
		needLogin:true
	},
	{
		iconUrl:"/src/img/userCenter/package-money-icon.png",
		text:"e卡管理",
		url: `${PAYURL}/fund_h5/#/ecard/index`,
		num:"0元",
		type:"a",
        active:false,
        point:false,
		needLogin:true
	}
];

/*const stripData2 =[
    {
        iconUrl:"/src/img/userCenter/share-grey-icon.png",
        text:"分享赚钱",
        url: FYURL+"/earnMoney",
        num:"",
        type:"a",
        needLogin:true
    }
];*/

let downLoadUrl = browser.versions.ios ?
	"http://a.app.qq.com/o/simple.jsp?pkgname=com.tairanchina.taiheapp" :
	"https://m.tairanmall.com/guide";

const stripData2 =[
	{
		mark: "customerService",
		iconUrl:"/src/img/userCenter/contact-service-grey.png",
		text:"联系客服",
		url:"/customerService",
		type:"link",
		needLogin:false
	}/*,
	{
		iconUrl:"/src/img/userCenter/download-grey-icon.png",
		text:"下载APP",
		url: downLoadUrl,
		type:"a",
		needLogin:false
	},*/
	/*{
		iconUrl:"/src/img/userCenter/kdqb-grey.png",
		text:"口袋钱包",
		url: "http://www.baidu.com",
		type:"a",
		needLogin:false
	}*/
];


let initialState ={
	statusData:statusData,
	stripData1:stripData1,
	stripData2:stripData2,
	//stripData3:stripData3,
	userInfo:""
};

function pageData( state, result ) {
    if( result.code !==0 ){
		return state;
	}
	//解构数量
	let{avail_coupon_count,collection_count,group_success_count,red_packet_count } = result.data;
	let imData = Immutable.fromJS( state );
	
	//拼团数量
    //let littlewxPoint = window.localStorage.getItem("littlewxPoint");
	imData = imData.setIn(["stripData1","0","num"], group_success_count );
	if( group_success_count ){
		imData = imData.setIn(["stripData1","0","active"], true );
		imData = imData.setIn(["stripData1","0","url"], "/groupList/0" );
        //如果数量增加显示小红点
		/*if(imData.toJS().stripData1[0].num>littlewxPoint){
            imData = imData.setIn(["stripData1","0","point"], true );
        }
        window.localStorage.setItem("littlewxPoint",group_success_count);*/
    }else{
		imData = imData.setIn(["stripData1","0","active"], false );
		imData = imData.setIn(["stripData1","0","url"], "/groupList/0" );
	}
	
	//收藏数
	imData = imData.setIn(["stripData1","1","num"], collection_count );
	if(  collection_count ){
		imData = imData.setIn(["stripData1","1","active"], true );
	}else{
		imData = imData.setIn(["stripData1","1","active"], false );
	}
	
	//优惠券数量
	imData = imData.setIn(["stripData1","2","num"],avail_coupon_count +"张" );
	if( avail_coupon_count ){
		imData = imData.setIn(["stripData1","2","active"], true );
	}else{
		imData = imData.setIn(["stripData1","2","active"], false );
	}
	
	//红包数量
	imData = imData.setIn(["stripData1","3","num"],red_packet_count +"个" );
	if( red_packet_count ){
		imData = imData.setIn(["stripData1","3","active"], true );
	}else{
		imData = imData.setIn(["stripData1","3","active"], false );
	}
	
	return imData.toJS();
}

function eCardNum( state, result ) {
	let imData = Immutable.fromJS( state );
	if( result.totalUsableAmount ){
		imData = imData.setIn(["stripData1","4","num"], result.totalUsableAmount+"元" );
		imData = imData.setIn(["stripData1","4","active"], true );
	}else{
		imData = imData.setIn(["stripData1","4","num"], result.totalUsableAmount+"元" );
		imData = imData.setIn(["stripData1","4","active"], false );
	}
	return imData.toJS();
}
function orderNum(state,result){
    //订单数量
    if( result.code !==0 ){
        return state;
    }
    let arrType =["wait_pay","wait_send","wait_confirm","wait_rate"];
    let statusData = state.statusData.map((item,i) => {
        item.num = result.data[ arrType[i] ];
        return item;
    });
    return {...state, statusData}

}


function userCenter( state = initialState, action ){
	switch( action.type ){
		case 'resetState':
			return initialState;
		case 'userInfoSuccess':
            return { ...state, userInfo: action.result.body };
		case 'pageDataSuccess':
			return pageData( state, action.result );
		case 'eCardSuccess':
			return eCardNum( state, action.result );
        case 'orderNumSuccess':
            return orderNum(state,action.result);
		default:
			return state;
	}
}

export default createReducers("userCenter",userCenter,initialState );
