export default ( nextState, callback )=> {
    require.ensure([], (require) => {
        window.secCaptcha = require('plugin/secCaptcha.js');
        callback(null, require('pages/user/login.jsx').default);
    }, "login");
}