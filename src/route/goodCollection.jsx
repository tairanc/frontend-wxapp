export default ( nextState, callback )=> {
	require.ensure([], (require) => {
//		require('plugin/swiper/swiper.min.js');
		callback(null, require('pages/collection/goodCollection').default);
	}, "GoodCollection");
}