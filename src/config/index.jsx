const protocol = window.location.protocol;

export const WXURL =`${protocol}//wx.tairanmall.com`;
export const APPURL = `${protocol}//m.tairanmall.com`;
export const JRURL = `${protocol}//jr-m.tairanmall.com`;   //金融APP
export const FYURL = `${protocol}//wx.tairanmall.com/fy`;
export const ZXURL = `${protocol}//wx.tairanmall.com/zx`;
export const PAYURL = `${protocol}//pay.tairanmall.com`;
export const COLLECTURL = `${protocol}//collect.trc.com/index.js`; //h5埋点资源链接
// export const SERCVICEURL = `${protocol}//hwdianshang.commonservice.cn:50134/webchat/jsp/standard/interfacePools.jsp`; //客服
export const SERCVICEURL = '/webchat/jsp/standard/interfacePools.jsp'; //客服(通过页面反代方式)

export const UCGEE = '/ucenter/gateway/foundation-captcha'; //用户中心【极验】接口前缀
export const UCAPPID = 'uc6c7f06e54ac77f87'; //用户中心appid

export const UCENTER = '/ucenter/gateway/foundation-user'; //用户中心接口前缀(线上环境)
// export const WXAPI = '/wxapi'; //服务端接口前缀
export const WXAPI = '/trxcx'; //服务端接口前缀
export const VIPCENTER = '/vipcenter';      //会员中心接口前缀
// export const DIR = "/xcx";
export const DIR = "";
