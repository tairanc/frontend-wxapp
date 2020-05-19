import { combineReducers } from 'redux';

import global from './global.js';
import userCenter from './userCenter.js';
import orderConfirm from './orderConfirm.js';
import homeIndex from './homeIndex.js';
import userLogin from './userLogin.js';
import tradeList from './tradeList.js';
import tradeSearch from './tradeSearch.js';
import groupList from './groupList.js';
import tradeDetail from './tradeDetail.js';
import orderCancel from './orderCancel.js';
import identifySelect from './identifySelect.js';
import addressSelect from './addressSelect.js';
import shopCart from './shopCart.js';
import searchIndex from './searchIndex.js';
import qygSearch from './qygSearch.js';
import searchResult from './searchResult.js';
import searchResult3 from './searchResult3.js';
import afterSaleList from './afterSaleList.js';
import logicompany from  './logicompany.js';
import consultrecord from  './afterconsultrecord.js';
import afterSaleApply from './afterSaleApply.js';
import afterSaleDetail from './afterSaleDetail.js';
import afterSaleLogistics from './afterSaleLogistics.js';
import invoiceSelect from './invoiceSelect.js';
import exchangeItem from './exchangeItem.js';
import minusActivity from './minusActivity.js';
import storeIndex from './storeIndex.js';
import qygIndex from './qygIndex.js';
import popup from './popup.js';
import navigation from './navigation.js';
import channel from './channel.js';
import itemIndex from './itemIndex'
import topic from './topic.js';
import seckill from './seckill.js';
import goodCollection from './goodCollection.js';
import goodCollectionSearch from './goodCollectionSearch.js';
import goodOverdue from './goodOverdue.js';
import userInfo from './userInfo.js';

const rootReducer = combineReducers({
	global,
	popup,
	userCenter,
	orderConfirm,
	identifySelect,
	addressSelect,
	shopCart,
	searchIndex,
	qygSearch,
	searchResult,
	searchResult3,
	orderCancel,
	tradeList,
	tradeSearch,
	groupList,
	tradeDetail,
	afterSaleList,
	afterSaleApply,
	afterSaleDetail,
	afterSaleLogistics,
    consultrecord,
    logicompany,
	exchangeItem,
	minusActivity,
	homeIndex,
	userLogin,
	navigation,
	channel,
	invoiceSelect,
	storeIndex,
	itemIndex,
	topic,
	seckill,
	qygIndex,
	goodCollection,
	goodCollectionSearch,
	goodOverdue,
  userInfo
});

export default rootReducer;