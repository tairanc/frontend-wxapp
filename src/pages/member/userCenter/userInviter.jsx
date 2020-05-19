import React, { Component } from 'react';
import Popup from 'component/modal2';
import { browserHistory } from 'react-router';
import { WXAPI, VIPCENTER } from 'config/index';
import { getCookie } from 'js/common/cookie';
import axios from 'js/util/axios';
import './userInviter.scss';

const pageApi = {
  updateVipUser: {url: `${WXAPI}/vip/updateVipUser`, method: "post"}, // 更新会员
  vipCheck: {url: `${VIPCENTER}/inviter/check`, method: "get"},       // 是否是邀请人检查（白名单）
};

export default class UserInviter extends Component {
  constructor(props) {
    super(props);
    let {inviter} = props.location.query;
    this.state = {
      originInviter: inviter,
      inviter: inviter
    };
  };

  componentWillMount() {
    document.title = '填写邀请人';
    this.context.isApp && (window.location.href = "jsbridge://set_title?title=填写邀请人");
  }

  componentDidMount() {
    this.refs.inviter.focus()
  }

  handleChange = (event) => {
    const _inviter = event.target.value||"";
    if(_inviter.length > 11) {
      return;
    }
    this.setState({ inviter: event.target.value||"" });
  }

  /**
   * 用户白名单检查，只有白名单用户才有邀请码
   * @param phone 用户手机号
   */
  checkVip = (phone) => {
    return new Promise((resolve, reject) => {
      axios.request({
        ...pageApi.vipCheck,
        params:{ phone }
      }).then(({ data }) => {
        const { code, message } = data;
        if(code && code == 200) {
          resolve()
        } else {
          Popup.MsgTip({ msg: message || '保存失败' });
          reject()
        }
      }).catch((err) => {
        const msg = err.response.data && err.response.data.message ? err.response.data.message: '服务器繁忙';
        Popup.MsgTip({ msg: msg });
        reject()
      })
    })
  }

  saveInviter = () => {
    this.checkVip(this.state.inviter).then(() => {
      axios.request({
        ...pageApi.updateVipUser,
        data: {inviter: this.state.inviter}
      }).then(({data}) => {
        if(data.code === 0 ){
          Popup.MsgTip({msg: "邀请码填写成功"});
          setTimeout(() => {
            browserHistory.replace('/userInfo');
          }, 200)
        }else{
          Popup.MsgTip({msg: data.message || "保存失败"});
        }
      }).catch(err => {
        Popup.MsgTip({msg: err.response.data.message||"小泰发生错误，请稍后再试~"});
      })
    })
  }

  render() {
    const {inviter} = this.state;
    return (
      <div data-page="user-inviter" style={{minHeight: $(window).height()}}>
        <div className="c-pr inviter-box">
          <div>请正确填写邀请人手机号</div>
          <input type="number" className='inviter-val' ref='inviter' onChange={this.handleChange} value={inviter}/>
          <input type="button" className="save-btn" value="保存" onClick={this.saveInviter}/>
        </div>
      </div>
    )
  }
}