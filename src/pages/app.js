// application's entry
require('es6-promise').polyfill();
import React, {Component} from 'react';
import {render} from 'react-dom';
import {Provider, connect} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {Router, browserHistory} from 'react-router';
import reducers from 'reducers/index';
import {composeWithDevTools} from 'redux-devtools-extension';
import {concatPageAndType} from 'js/actions/actions';
import {browser} from 'js/common/utils';
import {getCookie, setCookie, clearCookie} from 'js/common/cookie';
import {getJSApi} from 'component/common';
import {UCENTER, COLLECTURL} from 'config/index';
import {loadScript, sdkUse} from 'js/util/loadSdk';
import {miniProgramLogin, shareMiniProgramUrl} from 'js/util/miniProgramLogin';
import axios from 'axios';

import createTapEventPlugin from 'react-tap-event-plugin';
createTapEventPlugin(); //添加touchTap事件

//公用scss
import '../scss/common.scss';
import '../scss/grid.scss';
import '../scss/animation.scss';
import 'src/scss/ReactTransition.scss';

//公用插件
import 'plugin/flexible.min.js';
import 'src/plugin/swiper/swiper.scss';

const pageApi = {
	/*uc前缀为用户中心接口*/
	uc_isLogin: {url: `${UCENTER}/user`}, //是否登录
	uc_logout: {url: `${UCENTER}/user/logout`, method: 'post'}  //退出登录
};

const globalActions = concatPageAndType("global");

function getQueryString(name) {
	let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
	let r = window.location.search.substr(1).match(reg);
	if (r != null) return unescape(r[2]);
	return null;
}

//页面最外层
class Application extends Component {
	componentWillMount() {
		let token = getQueryString('token'),
			openId = getQueryString('openId'),
			mini = getQueryString('mini');
		if (token) {
			clearCookie('token');
			setCookie('token', token)
		}
		if (openId) {
			clearCookie('openId');
			setCookie('openId', openId)
		}
		if (mini) {
			clearCookie('mini');
			setCookie('mini', mini)
		}

		this.props.getLogin();
		// const {iPhone, iPad, weixin} = browser.versions;
		// let targetUrl = location.href.split("#")[0];
		// weixin && (iPad || iPhone) && getJSApi(targetUrl);   //ios系统在页面入口处调用微信分享签名(小程序不存在微信的分享)
        window.sessionStorage.removeItem("dcpPageTitle");  //移除话务系统需要的商品标题
	}

	render() {
		return (
			<section id="wap-main">
				{this.props.children}
			</section>
		);
	}
}

function applicationDispatch(dispatch) {
	return {
		getLogin: () => {
			let token = getCookie('token'),
				openId = getCookie('openId');
			if (!token) {
				loadScript(COLLECTURL, sdkUse, "");//埋点存userId
				dispatch(globalActions('changeLogin', {login: false}));
				miniProgramLogin(location.href);
			} else {
				//判断用户是否登录
				axios.request({
					...pageApi.uc_isLogin,
					headers: {'Authorization': "Bearer " + token}
				}).then(({data}) => {
					if (data.code === "401") { //token不可用，token校验不通过(跳转小程序登录页面)
						miniProgramLogin(location.href);
					}
					if (data.code === "200") {
						dispatch(globalActions('changeLogin', {login: true}));
						loadScript(COLLECTURL, sdkUse, data.body.userId);  //埋点存userId
						if (browser.versions.weixin && !openId) {
							//已登录却未绑定则退出登录
							axios.request({
								...pageApi.uc_logout,
								headers: {'Authorization': "Bearer " + token}
							}).then(() => {
								miniProgramLogin(location.href);
							}).catch(() => {
								miniProgramLogin(location.href);
							})
						}
					} else {
						loadScript(COLLECTURL, sdkUse, "");
						dispatch(globalActions('changeLogin', {login: false}));
					}
				}).catch(error => {
					console.error(error);
					dispatch(globalActions('getLoginError'));
				})
			}
		}
	}
}

Application = connect(null, applicationDispatch)(Application);

const store = createStore(reducers, {}, composeWithDevTools(applyMiddleware(thunk)));

const rootRoute = {
	childRoutes: [
		{
			path: "/",
			component: Application,
			indexRoute: {
				/*首页*/
				onEnter: (nextState, replaceState) => replaceState("/userCenter")
			},
			childRoutes: [
				/*个人信息*/
				{
					path: "userInfo", getComponent: require('src/route/userInfo').default, onEnter: () => {
					document.title = "个人信息"
				}
				},

				/*用户修改昵称*/
				{
					path: "userNickname",
					component: require('./member/userCenter/userNickname').default,
					onEnter: () => {
						document.title = "昵称"
					}
				},

        /*用户修改邀请人*/
        {
          path: "userInviter",
          component: require('./member/userCenter/userInviter').default,
          onEnter: () => {
            document.title = "填写邀请人"
          }
        },

				{
					path: "/homeIndex", getComponent: require('src/route/homeIndex').default, onEnter: () => {
					document.title = "小泰拼团"
				}
				},
				{
					path: "/notice", component: require('./home/notice').default, onEnter: () => {
					document.title = "公告"
				}
				},

				/*用户中心*/
				{
					path: "/userCenter", component: require('./member/userCenter/index').default, onEnter: () => {
					document.title = "我的拼团";
					shareMiniProgramUrl(location.href)
				}
				},

				/*用户登录*/
				//{path: "/login", component: require('./user/login.jsx').default, onEnter:( )=>{ document.title="登录" } },
				{
					path: "/login", getComponent: require('src/route/login').default, onEnter: () => {
					document.title = "登录"
				}
				},
				//{path: "/wapLogin", getComponent: require('src/route/wapLogin').default },
				/*用户登录中转*/
				{
					path: "/loginTransfer", component: require('./user/loginTransfer.jsx').default, onEnter: () => {
					document.title = "登录"
				}
				},

				{
					path: "/loginTest", component: require('./user/loginTest.jsx').default, onEnter: () => {
					document.title = '订单确认';
					shareMiniProgramUrl(location.href)
				}
				},

				/*WAP登录*/
				/*{path: "/wapLogin", component: require('./user/wapLogin.jsx').default },*/
				{path: "/wapLogin", getComponent: require('src/route/wapLogin').default},

				/*忘记密码*/
				{path: "/forgetPwd", getComponent: require('src/route/forgetPwd').default},

				/*用户二维码*/
				{
					path: "/userQrCode", getComponent: require('src/route/userQrCodeShare').default, onEnter: () => {
					document.title = '邀请好友'
				}
				},
				// { path:"/userQrCodeShare", getComponent: require('src/route/userQrCodeShare').default, onEnter:()=>{ document.title='邀请好友'} },

				/*购物袋*/
				{
					path: "/shopCart", component: require('./trade/shopCart/index').default, onEnter: () => {
					document.title = "购物袋";
					shareMiniProgramUrl(location.href)
				}
				},

				/*搜索页*/
				{
					path: "/search", component: require('./search/index').default, onEnter: () => {
					document.title = "搜索";
					shareMiniProgramUrl(location.href)
				}
				},

				/*搜索结果页*/
				{
					path: "/searchResult", getComponent: require('src/route/searchResult').default, onEnter: () => {
					document.title = "搜索结果";
					shareMiniProgramUrl(location.href)
				}
				},

				/*确认订单页*/
				{
					path: "/orderConfirm", component: require('./trade/orderConfirm/index').default, onEnter: () => {
					document.title = '订单确认';
					shareMiniProgramUrl(location.href)
				}
				},

				//供应链无库存商品列表
				{
					path: "/unStockItem",
					component: require('./trade/orderConfirm/invalidSupplyGoods').default, onEnter: () => {
						document.title = '缺货商品';
						shareMiniProgramUrl(location.href)
					}
				},

				/*普通订单列表*/
				{
					path: 'tradeList/:status', getComponent: require('src/route/tradeList').default, onEnter: () => {
					document.title = '我的订单';
					shareMiniProgramUrl(location.href)
				}
				},
				/*订单搜索*/
				{
					path: 'tradeSearch', getComponent: require('src/route/tradeSearch').default, onEnter: () => {
					document.title = '订单搜索';
					shareMiniProgramUrl(location.href)
				}
				},
				/*拼团订单列表*/
				{
					path: 'groupList/:status', getComponent: require('src/route/groupList').default, onEnter: () => {
					document.title = '我的拼团';
					shareMiniProgramUrl(location.href)
				}
				},

				/*订单详情*/
				{
					path: "/tradeDetail", component: require('./member/trade/tradeDetail').default, onEnter: () => {
					document.title = '订单详情';
					shareMiniProgramUrl(location.href)
				}
				},

				/*取消订单页*/
				{
					path: "/orderCancel", component: require('./member/trade/orderCancel').default, onEnter: () => {
					document.title = "取消订单";
					shareMiniProgramUrl(location.href)
				}
				},

				/*客户服务*/
				{path: 'customerService', component: require('./customerService/index').default},

				/*拼团详情页*/
				{
					path: "/groupDetail", component: require('./item/groupDetail/groupDetail').default, onEnter: () => {
					document.title = "拼团详情";
					shareMiniProgramUrl(location.href)
				}
				},

				/*优惠券列表页*/
				{
					path: "/couponList", getComponent: require('src/route/couponList').default, onEnter: () => {
					document.title = "优惠券";
					shareMiniProgramUrl(location.href)
				}
				},

				/*使用优惠券页面*/
				{path: "/useCoupon", component: require('./member/coupon/useCoupon').default, onEnter: () => {
					shareMiniProgramUrl(location.href)
				}},

				/*红包列表页*/
				{path: "/redList", getComponent: require('src/route/redList').default, onEnter: () => {
					document.title = "红包";
					shareMiniProgramUrl(location.href)
				}},

				/*发票选择*/
				{
					path: "invoiceSelect", component: require('./member/selectList/invoice').default, onEnter: () => {
					document.title = "发票信息";
					shareMiniProgramUrl(location.href)
				}
				},

				/*订单售后列表页*/
				{
					path: "/afterSale", component: require('./member/afterSale/index').default,
					childRoutes: [

						/*订单售后列表页*/
						{
							path: "list", component: require('./member/afterSale/list').default, onEnter: () => {
							document.title = "退款/售后";
							shareMiniProgramUrl(location.href)
						}
						},

						/*订单售后申请页*/
						{
							path: "apply", component: require('./member/afterSale/apply').default, onEnter: () => {
							document.title = "售后申请单";
							shareMiniProgramUrl(location.href)
						}
						},

						/*售后订单详情页*/
						{
							path: "detail", component: require('./member/afterSale/detail').default, onEnter: () => {
							document.title = "售后申请单详情";
							shareMiniProgramUrl(location.href)
						}
						},
						/*物流公司列表页*/
						{
							path: "logicompany",
							component: require('./member/afterSale/logicompany').default,
							onEnter: () => {
								document.title = "物流公司";
								shareMiniProgramUrl(location.href)
							}
						},
						/*协商记录*/
						{
							path: "consultrecord",
							component: require('./member/afterSale/consultrecord').default,
							onEnter: () => {
								document.title = "协商记录";
								shareMiniProgramUrl(location.href)
							}
						}

						/*售后填写物流页*/
						//{ path:"logistics",  component:require('./member/afterSale/logistics').default,onEnter:()=>{ 	document.title =" 物流填写"; } },

					]
				},

				/*收银台*/
				{
					path: "cashier", component: require('./trade/cashier/cashier').default, onEnter: () => {
					document.title = " 订单支付";
				}
				},

				/*付款结果*/
				{
					path: "payResult", component: require('./trade/cashier/payResult').default, onEnter: () => {
					document.title = '支付详情'
				}
				},

				/*收货信息*/
				{
					path: "goodsReceiveInfo", component: require('./member/goodsReceiveInfo/info').default,
					indexRoute: {component: require('./member/goodsReceiveInfo/goodsReceiveInfo').default},
					childRoutes: [
						/*地址管理编辑页面*/
						{path: "addressManage", getComponent: require('src/route/addressManage').default, onEnter: () => {
								shareMiniProgramUrl(location.href)
							}},

						/*身份管理*/
						{
							path: "identityManage",
							component: require('./member/goodsReceiveInfo/identityManage').default, onEnter: () => {
							shareMiniProgramUrl(location.href)
						}
						},

						/*照片示例*/
						{
							path: "identityExample",
							component: require('./member/goodsReceiveInfo/identityExample').default, onEnter: () => {
							shareMiniProgramUrl(location.href)
						}
						}
					]
				},

				/*商品详情页*/
				{path: "/item", getComponent: require('src/route/item').default, onEnter: () => {
					shareMiniProgramUrl(location.href)
				}},
				/*  评团玩法 */
				{path: "pintuan-rules", component: require('./item/groupDetail/pintuanRules').default, onEnter: () => {
						shareMiniProgramUrl(location.href)
					}},
				/*评价页面&物流*/
				{path: "/evaluate", getComponent: require('src/route/evaluate').default, onEnter: () => {
					shareMiniProgramUrl(location.href)
				}},

				{path: "/evaluateInput", component: require('./member/trade/evaluateInput').default, onEnter: () => {
					shareMiniProgramUrl(location.href)
				}},

				// { path: "/logistics", getComponent: require('src/route/logistics').default },
				//重构物流页
				{
					path: "logistics", getComponent: require('src/route/logisticsList').default, onEnter: () => {
					document.title = "订单跟踪";
					shareMiniProgramUrl(location.href)
				}
				},
				//物流详情页
				{
					path: "logisticDetail", getComponent: require('src/route/logisticDetail').default, onEnter: () => {
					document.title = "物流详情";
					shareMiniProgramUrl(location.href)
				}
				},
				/*换购商品*/
				{
					path: "/exchangeItem", component: require('./activity/exchangeItem').default, onEnter: () => {
					document.title = '换购商品';
					shareMiniProgramUrl(location.href)
				}
				},

				/*频道页---小泰良品*/
				{path: "/xtlp", getComponent: require('src/route/xtlp').default},
				/*/!*频道页---企业购*!/
				{path: "/qyg", getComponent: require('src/route/qyg').default},*/

				/* 专题页 */
				{path: "/topic", getComponent: require('src/route/topic').default},

				/*我的收藏*/
				// { path: "/myCollection", getComponent: require('src/route/collection').default },

				/*商品收藏*/
				{path: "/myCollection", getComponent: require('src/route/goodCollection').default, onEnter: () => {
					shareMiniProgramUrl(location.href)
				}},
				/*商品收藏搜索*/
				{path: "/goodCollectionSearch", getComponent: require('src/route/goodCollectionSearch').default, onEnter: () => {
						shareMiniProgramUrl(location.href)
					}},
				/*失效商品列表*/
				{path: "/goodOverdue", getComponent: require('src/route/goodOverdue').default, onEnter: () => {
					shareMiniProgramUrl(location.href)
				}},

				/*  泰然5周年 */
				{path: "/5years", component: require('./5year/5year').default},
				{path: "/5yearsQrcode", component: require('./5year/5yearQrcode').default},

				/* 双十一礼包领取 */
				{path: "/giftPackage", getComponent: require('src/route/giftPackage').default},

				/*/!*满减活动*!/
				{path: "/minusActivity", getComponent: require('src/route/minusActivity').default},

				/!*满折活动*!/
				{path: "/discountActivity", getComponent: require('src/route/discountActivity').default},

				/!* n元任选 *!/
				{path: "/optionBuyActivity", getComponent: require('src/route/optionBuyActivity').default},

				/!*  加价换购 *!/
				{path: "/exchangeBuy", getComponent: require('src/route/exchangeBuy').default},*/

				/*店铺首页*/
				{
					path: "store/home",
					getComponent: require('src/route/store/home').default, onEnter: () => {
					shareMiniProgramUrl(location.href)
				}
				},
				{
					path: "store/detail",
					getComponent: require('src/route/store/detail').default, onEnter: () => {
					shareMiniProgramUrl(location.href)
				}
				},

				/* 新人礼包 */
				{path: "/newUserGift", getComponent: require('src/route/newUserGift').default, onEnter: () => {
					shareMiniProgramUrl(location.href)
				}},

				/*/!* 企业礼品定制 *!/
				{path: "/giftsCustom", getComponent: require('src/route/giftsCustom').default},*/

				/*联合58活动登录领劵*/
				{
					path: "/cooperlogin",
					component: require('./activity/cooperActivity58/cooper58').default,
					onEnter: () => {
						document.title = "泰然城新人福利"
					}
				},

				// H5 到 泰然城小程序的中转页
        {
          path: "/wxappTransit",
          getComponent: require('src/route/wxappTransit').default,
          onEnter: () => {
            document.title = ""
          }
        },


				/*未匹配的重定向*/
				{path: "*", onEnter: (nextState, replaceState) => replaceState("/")},

			]
		},
		/*未匹配的重定向*/
		{path: "*", onEnter: (nextState, replaceState) => replaceState("/")}
	]
};

render((
		<Provider store={store}>
			<Router history={browserHistory} routes={rootRoute}/>
		</Provider>
	),
	document.getElementById('app')
);
