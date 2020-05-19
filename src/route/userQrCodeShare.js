
export default function ( nextState, callback ){
    require.ensure([], (require)=> {
        require('plugin/qr-code.js');
        callback(null, require('pages/member/qrCode/qrCodeShare.jsx').default );
    }, "userQrCodeOne");
}