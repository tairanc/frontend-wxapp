export default (nextState, callback)=>{
	require.ensure([], () => {
		require('plugin/swiper/swiper.min.js');
		callback(null, require('pages/eCard/myECard/myECard').default);
	}, "ECard")
}