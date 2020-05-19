export default ( nextState, callback )=> {
  require.ensure([], (require) => {
    callback(null, require('pages/wxappTransit/wxappTransit.jsx').default);
  }, "wxappTransit");
}