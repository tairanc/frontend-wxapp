export default(nextState, callback)=> {
    require.ensure([], (require) => {
        require('plugin/swiper/swiper.min.js');
        require('pages/member/userCenter/enterpriseBuy/area');
        callback(null, require('pages/member/userCenter/enterpriseBuy/register').default);
    }, "registerEnterprise")
}