export default(nextState, callback)=> {
	require.ensure([], (require) => {
		require('plugin/swiper/swiper.min.js');
		require('pages/member/goodsReceiveInfo/area');
		callback(null, require('pages/giftsCustom/giftsCustom').default);
	}, "giftsCustom")
}