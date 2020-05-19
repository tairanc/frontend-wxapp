export default(nextState, callback)=> {
	require.ensure([], (require) => {
		window.IScroll = require('plugin/iscroll/iscroll.js');
		require('plugin/swiper/swiper.min.js');
		callback(null, require("pages/store/home/index").default);
	}, "StoreIndex");
}