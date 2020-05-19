export default ( nextState, callback )=> {
	require.ensure([], (require) => {
		window.IScroll = window.IScroll || require('plugin/iscroll/iscroll.js');
		window.echo = window.echo || require('plugin/echo.js');
		callback( null, require('pages/search/result3').default );
	}, "searchResult");
}