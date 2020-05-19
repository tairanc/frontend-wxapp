import React, { Component } from 'react';
import { Link} from 'react-router';
import {connect} from 'react-redux';
import {concatPageAndType,actionAxios } from 'js/actions/actions';
//import Navigator from 'component/modules/navigation';
import { LinkOrA } from 'component/HOC.jsx';
import {CustomerService} from 'component/common';
import { UCENTER,WXAPI } from 'config/index';
import { getCookie } from 'js/common/cookie';
import styles from './index.scss';

const pageApi ={
    uc_getUserInfo: {url: `${UCENTER}/user`}, //获取用户信息
	getData:{ url:`${WXAPI}/getMoreCount`, method:"get" },
	eCardNum:{ url:"/eCard/card/account/info", method:"get" },
	orderNum:{url:`${WXAPI}/user/order/count`, method:"POST" }
};
const createActions = concatPageAndType("userCenter");
const axiosCreator = actionAxios("userCenter");

//个人中心
class UserCenter extends Component {
	componentWillMount() {
		if( this.props.isLogin ){
			this.getData()
		}else{
			this.props.resetState();
		}
	}
	componentWillReceiveProps( newProps ) {
		if( !this.props.isLogin && newProps.isLogin ){
			this.getData();
		}
	}
	getData=()=>{
		this.props.getUserInfo();
		this.props.getPageData();
		this.props.getECardNum();
		this.props.getorderNum();
	}
	render(){
        return <div data-page="user-center">
			<UserCenterHead data={ this.props.userInfo } isLogin={this.props.isLogin} />
			<AllOrder data={ this.props.statusData }  isLogin={this.props.isLogin} />
			<StripEntry data={this.props.stripData1 }  isLogin={this.props.isLogin} />
			<StripEntry data={this.props.stripData2 }  isLogin={this.props.isLogin} />
			{/*<StripEntry data={this.props.stripData3 }  isLogin={this.props.isLogin} />*/}
			{/*<Navigator/>*/}
		</div>
	}
}
//个人中心头部
class UserCenterHead extends Component{
	render(){
		let { isLogin, data } = this.props;
        return(
			<div className="user-info">
				<Link className="user-avatar" to={ isLogin ? "/userInfo":"/login?redirect_uri=%2FuserCenter"}>
					<img src={ ( isLogin && data.avatar)? data.avatar:"/src/img/icon/avatar/default-avatar-gray.png"} alt="用户头像" />
				</Link>
				<Link className="user-name" to={ isLogin ? "/userInfo":"/login?redirect_uri=%2FuserCenter"} >
					{(isLogin && data) ? (data.nickname ? data.nickname : data.phone.replace(/(\d{3})\d{4}(\d{4})/,"$1****$2") ):"立即登录" }
				</Link>
				{/*<Link className="user-qrcode" to="/userQrCode" >
					<img src="/src/img/userCenter/qrcode-icon.png" alt="二维码"/>
				</Link>*/}
			</div>
		)
	}
}

//全部订单
class AllOrder extends Component{
	render(){
        return(
			<div className="all-order">
				<UserOrder isLogin={this.props.isLogin}/>
				<UserOrderStatus orderStatus={ this.props.data } isLogin={this.props.isLogin} />
			</div>
		)
	}
}

//我的订单
export  class UserOrder extends Component{
	render(){
		return(
			<Link className="user-order c-clrfix" to={this.props.isLogin?"/tradeList/0":"/login?redirect_uri=%2FuserCenter"} >
				<div className="c-fl">我的订单</div>
				<div className="c-fr">
					<span>查看全部</span><i className="arrow-right-icon"> </i>
				</div>
			</Link>
		)
	}
}

//订单状态
export class UserOrderStatus extends  Component{
	getHtml=()=>{
		const { orderStatus,isLogin } = this.props;
		return orderStatus.map((item,i)=>{
			return <OrderStatus key={i}  data={item} isLogin={isLogin} />
		});
	};
	render(){
		return(
			<div className="order-status-list">
				{this.getHtml()}
			</div>
		)
	}
}

//单个订单状态
class OrderStatus extends Component{
	render(){
		const { data,isLogin } = this.props;
        return(
			<Link className="order-icon c-tc" to={ isLogin ?data.url:"/login?redirect_uri=%2FuserCenter"}>
				<i className={`icon-img ${data.iconClass}`}>
					{ ( isLogin && data.num )?<i className="order-status-number">{data.num}</i>:""}
				</i>
				<span>{data.text}</span>
			</Link>
		)
	}
}

//条形入口
class StripEntry extends Component{
	render(){
		const html = this.props.data.map( (item,i)=>{
				return  <div  key={i}   className="strip-grid">
					<OneStrip data={item} isLogin={ this.props.isLogin }/>
				</div>
			});
		return(
			<div className="strip-entry">
				{html}
			</div>
		)
	}
}

//一个条形
class OneStrip extends Component{
	render(){
		const { data } = this.props;
        return (
			<LinkOrA className={styles.oneStrip} link={ ( this.props.isLogin || !data.needLogin ) ? data.url :'/login?redirect_uri=%2FuserCenter'  } type={  ( this.props.isLogin || !data.needLogin ) ? data.type:"link" } >
				<div className={styles.specIcon}><img src={data.iconUrl} className={ styles.specIconImg } /></div>
				<div className={`c-clrfix ${styles.stripText}`}>
					<span className={styles.stripTextLeft}>{data.text }</span>
					{data.active ? <span className={styles.stripTextRight }>{data.num}{ data.active && data.point && <i className={styles.redPoint}> </i>}</span>:""}
				</div>
				<div> <i className={styles.rightIcon}> </i></div>
			</LinkOrA>
		)
	}
}

// 对接小能客服
class CustomerServiceStrip extends Component{
	render(){
		const { data } = this.props;
		return (
			<CustomerService className={styles.oneStrip} >
				<div className={styles.specIcon}><img src={data.iconUrl} className={ styles.specIconImg } /></div>
				<div className={`c-clrfix ${styles.stripText}`}>
					<span className={styles.stripTextLeft}>{data.text }</span>
					{data.active ? <span className={styles.stripTextRight }>{data.num}{data.active && <i className={styles.redPoint}> </i>}</span>:""}
				</div>
				<div> <i className={styles.rightIcon}> </i></div>
			</CustomerService>
		)
	}
}

const stateUserCenter = function ( state, props ) {
	return {
		...state.userCenter,
		...state.global
	}
}
const dispatchUserCenter = function ( dispatch, props ) {
	return {
		resetState(){
			dispatch( createActions('initialState') );
		},
		getUserInfo(){
			let token = getCookie('token');
			dispatch( axiosCreator("userInfo",{
				...pageApi.uc_getUserInfo,
                headers: { 'Authorization': "Bearer " + token },
				params:{needPhone:true}
			}) );
		},
		getPageData(){
			dispatch( axiosCreator('pageData', pageApi.getData ))
		},
		getECardNum(){
			dispatch( axiosCreator( 'eCard', pageApi.eCardNum ) );
		},
		getorderNum(){
			dispatch( axiosCreator ('orderNum',pageApi.orderNum))
		}
		
	}
};
export default connect(stateUserCenter,dispatchUserCenter)( UserCenter );