/**
 * 获取url参数
 * @param name
 * @returns {*}
 */
function getQueryString(name) {
  const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
  const r = window.location.search.substr(1).match(reg);
  if (r != null) return unescape(r[2]);
  return null;
}

//动态创建js加载
/**
 * @param url
 */
export function miniProgramLogin(url){
	if(url){
		wx.miniProgram.navigateTo({url: `/pages/login/login?redirect_uri=${encodeURIComponent(url)}&comUcerterId=${getQueryString('comUcerterId')}`});
	}else {
		wx.miniProgram.reLaunch({url: '/pages/mall/index'});
	}
}

export function miniProgramShopCart(url){
	wx.miniProgram.reLaunch({url: '/pages/shopCart/index'});
}

export function miniProgramGroup(url){
	wx.miniProgram.reLaunch({url: '/pages/group/index'});
}

export function miniProgramBags(url){
	wx.miniProgram.reLaunch({url: '/pages/jumppage/index'});
}

/**
 *
 * @param url
 * @param shouldPayRedirect 收银台页面onUnload生命周期，是否需要执行wx.redirectTo
 */
export function miniProgramMine(url, shouldPayRedirect = true){
	wx.miniProgram.reLaunch({url: '/pages/mine/index'});
    wx.miniProgram.postMessage({ data: { shouldPayRedirect } });
}

/**
 *
 * @param url
 * @param shouldPayRedirect 收银台页面onUnload生命周期，是否需要执行wx.redirectTo
 */
export function miniProgramMall(url, shouldPayRedirect = true){
	wx.miniProgram.reLaunch({url: '/pages/mall/index'});
    wx.miniProgram.postMessage({ data: { shouldPayRedirect } });
}

/**
 * 跳转到vip页面
 * @param inviter 邀请人
 */
export function miniProgramVip(inviter = ''){
	if(inviter) {
    wx.miniProgram.redirectTo({url: `/pages/vipPage/vipPage?query=${inviter}`});
	} else {
    wx.miniProgram.redirectTo({url: `/pages/vipPage/vipPage`});
	}
}


/**
 * 跳转到实名认证
 * @param hasCertifyInfo 是否实名
 * @constructor
 */
export function miniProgramUrlVerifyName(hasCertifyInfo = false) {
	if (hasCertifyInfo) {
    wx.miniProgram.navigateTo({url: '/pages/mine/verifyOK/verifyOK'})
	} else {
    wx.miniProgram.redirectTo({url: '/pages/mine/verifyName/verifyName?from=userInfo'})
	}
}

export function shareMiniProgramUrl(url){
	wx.miniProgram.postMessage({data: {url: url}})
}
