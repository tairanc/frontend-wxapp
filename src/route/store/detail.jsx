export default(nextState, callback)=> {
	require.ensure([], (require) => {
		callback(null, require("pages/store/home/detail").default);
	}, "StoreIndex");
}