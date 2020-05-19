import React, { Component } from 'react';
import Popup from 'component/modal2';
import { browserHistory } from 'react-router';
import { UCENTER, WXAPI } from 'config/index';
import { getCookie } from 'js/common/cookie';
import axios from 'axios';
import './userNickname.scss';

const pageApi = {
    /*uc前缀为用户中心接口*/
    //uc_setUserInfo: { url: `${UCENTER}/user`, method: 'put' } //修改用户信息
    updateVipUser: { url: `${WXAPI}/vip/updateVipUser`, method:'post' }    //更改会员信息
};

//选择昵称
export default class UserNickname extends Component {
    constructor(props) {
        super(props);
        let {nickname} = props.location.query;
        this.state = {
            originName: nickname,
            nickname: nickname
        };
    };

    componentWillMount() {
        document.title= '昵称';
        this.context.isApp && (window.location.href="jsbridge://set_title?title=昵称");
    }

    componentDidMount() {
        $(".nick-val").val(this.state.nickname).focus();
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    //删除手机号
    delHandle = (e)=> {
        $(e.target).prev().val("").focus();
        this.setState({
            nickname: ""
        });
    }

    //输入信息填写完整，注册按钮高亮
    handleChange = ()=> {
        let nickVal = $(".nick-val").val();
        this.setState({ nickname: nickVal||"" });
    }

    saveNickname = ()=>{
        let nickVal = $(".nick-val").val();
        if(nickVal.length < 4){
            Popup.MsgTip({msg: "至少需要四个字符哦~"});
            return false;
        }else if(!/^[a-zA-Z0-9\u4e00-\u9fa5]{4,20}$/.test(nickVal)){
            Popup.MsgTip({msg: "只支持中英文和数字哦~"});
            return false;
        }else{
            let token = getCookie('token');
            //修改性别
            axios.request({
                ...pageApi.updateVipUser,
                data:{ member_name: nickVal }
            }).then(({data})=>{
                if(data.code === 0){
                    Popup.MsgTip({msg: "昵称修改成功"});
                    setTimeout(()=>{
                        browserHistory.replace('/userInfo')
                    },600)
                }else{
                    Popup.MsgTip({msg: "昵称修改失败"});
                }
            });
        }
    };

    render() {
        let { nickname } = this.state;
        return(
            <div data-page="user-nick-name" style={{minHeight: $(window).height()}}>
                <div className="c-pr">
                    <input type="text" className="nick-val" maxLength="20" onChange={this.handleChange}/>
                    <img className={`del-icon c-pa ${ nickname ? '':'c-dpno'}`} src="/src/img/user/delete.png" onClick={this.delHandle}/>
                </div>
                <div className="nick-rule">昵称仅在论坛、评论等场景显示，4-20个字符，支持中英文，数字</div>
                <input type="button" className="save-btn" value="保存" onClick={this.saveNickname}/>
            </div>
        );
    }
}
