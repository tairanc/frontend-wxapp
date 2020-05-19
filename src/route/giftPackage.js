export default ( nextState, callback )=> {
	require.ensure([], (require) => {
		callback(null, require('pages/activity/11giftPackage/index').default);
	}, "giftPackage");
}