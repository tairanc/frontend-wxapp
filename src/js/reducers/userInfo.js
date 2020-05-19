import createReducers from './createReducers.js';

let initialState ={
  hasShowFromVip: false // 个人中心是否展示过 '请确认您的生日是否准确'弹窗
};

function userInfo( state = initialState, action ) {
  switch ( action.type ){
    case 'changeShowFromVip':
      return { ...state, hasShowFromVip: action.status || false};
    default:
      return state;
  }
}

export default createReducers("userInfo",userInfo,initialState );