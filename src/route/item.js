export default function ( nextState, callback ){
    require.ensure([], (require)=> {
		require('plugin/photoSwiper/photoswipe.css');
		require('plugin/photoSwiper/default-skin/default-skin.css');
		window.PhotoSwipe = require('plugin/photoSwiper/photoswipe.js');
		window.PhotoSwipeUI_Default=require('plugin/photoSwiper/photoswipe-ui-default.js');
        require('plugin/swiper/swiper.min.js');
        window.secCaptcha = require('plugin/secCaptcha.js');
        require('plugin/zepto.fly.min.js');
		require('pages/member/goodsReceiveInfo/area');
        callback(null, require('pages/itemNew/index').default );
    }, "ItemPage");
}