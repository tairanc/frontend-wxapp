import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';
import {browserHistory} from 'react-router';
import {LoadingRound} from 'component/common';
import {PopupTip} from 'component/modal';
import Popup from 'component/modal2';
import axios from 'js/util/axios';
import {dateUtil} from "js/util/index";
import {WXAPI, DIR} from 'config/index';
import {miniProgramLogin} from 'js/util/miniProgramLogin';
import './red.scss';

const pageApi  = {
    getRedList: { url: `${WXAPI}/promotion/getRedPacketList` } //获取红包列表
};

export default class RedList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			countData: {},
			redData: [],
			update: false,
			listUpdate: false,
			showStatus: false,
			page: 2,
			hasMore: true,
			sending: false,
			rule: '',
			type: 1,
			status: 1
		};
	};
	
	componentWillMount() {
		document.title = "红包";
	}

	componentDidMount() {
		this.getMsg(1);
	};

	getMsg = (status) => {
		let self = this;
		self.setState({
            status: status,
			listUpdate: false,
			page: 2
		});

		//获取红包列表
		axios.request({
			...pageApi.getRedList,
			params:{
				status: status,
                page: 1,
                page_size: 10
			}
		}).then(({data})=>{
            if(data.code===0){
                self.setState({
                    redData: data.data.red_packet.data,
                    hasMore: data.data.red_packet.data.length >= 10,
                    update: true,
                    listUpdate: true,
                    type: status,
                    rule: data.data.red_packet.rule_text

                });
            }else {
                Popup.MsgTip({msg:'服务器繁忙'});
                self.setState({ sending: false });
            }
        }).catch(error=>{
            if (error.response && error.response.data.code) {
            	miniProgramLogin(location.href);
                // browserHistory.replace(`${DIR}/login?redirect_uri=%2FcouponList`);
            } else {
                console.log('Error', error.message);
                Popup.MsgTip({msg:'服务器繁忙'});
            }
        });
	};

	addMsg = (status) => {
		let self = this;
		this.setState({
			sending: true
		});
        axios.request({
            ...pageApi.getRedList,
            params:{
                status: status,
                page: this.state.page,
                page_size: 10
            }
        }).then(({data})=>{
            if(data.code===0){
                self.setState({
                    redData:  self.state.redData.concat(data.data.red_packet.data) ,
                    hasMore: data.data.red_packet.data.length >= 10,
                    sending: false,
                    page: self.state.page + 1
                });
            }else {
                Popup.MsgTip({msg:'服务器繁忙'});
                self.setState({ sending: false });
            }
        }).catch(error=>{
			console.log('Error', error.message);
			Popup.MsgTip({msg:'服务器繁忙'});
            self.setState({ sending: false });
        });

		/*$.ajax({
			url: "/wxapi/redPacketList.api",
			type: "get",
			data: {
				is_valid: status,
				page_size: 10,
				pages: this.state.page
			},
			success: function (data) {
				if (data.code === 200 && data.status === true) {
					self.setState({
						redData: self.state.redData.concat(data.data.data),
						hasMore: data.data.data.length >= 10,
						sending: false,
						page: self.state.page + 1
					});
				} else {
					self.showMsg = "服务器繁忙~";
					self.setState({showStatus: true});
					self.setState({ sending: false });
				}
			},
			error: function (err) {
				self.showMsg = "服务器繁忙~";
				self.setState({showStatus: true});
				self.setState({
					sending: false
				});
			}
		});*/
	};

	render() {
		let {countData, redData, showStatus, hasMore, sending, rule, type, status} = this.state;
		return (
			this.state.update ?
				<div data-page="red-list" style={{minHeight: $(window).height()}}>
					<section id="red-list">
						<CouponNav data={countData} fn={this.getMsg}/>
						<Rule data={rule} />
						{this.state.listUpdate ?
							<List fn={this.addMsg} data={redData} hasMore={hasMore} sending={sending} type={type} status={status}/>
							:
							<LoadingRound />
						}
					</section>
				</div>
				: <LoadingRound />
		)
	}
}

//nav
class CouponNav extends Component {
	componentDidMount() {
		let {fn} = this.props;
		$('.red-nav li').click(function (e) {
			if ($(this).attr('class') === "active-one") {
				//..
			} else {
				$(this).addClass('active-one').siblings().removeClass('active-one');
				let status = parseInt($('.active-one').attr('id'));
				fn(status);
			}

		});
	};

	render() {
		return (
			<ul className="red-nav c-c35 c-tc c-fs14">
				<li className="active-one" id="1"><span>有效红包</span></li>
				<li id="0"><span>失效红包</span></li>
			</ul>
		)
	}
}

//rule规则
class Rule extends Component {
	componentWillMount(){
		this.setState({
			showRules: false
		})
	}
	render(){
		let {data} = this.props;
		return(
			<div className="rule">
				<button className="open-btn" onClick={()=>{this.setState({showRules: true})}}>使用规则</button>
				{this.state.showRules?
				<div className="cover">
					<div className="rule-box c-tc c-pr">
						<h3>使 用 规 则</h3>
						<ul className="rule-content c-fs10 c-tl c-mb20">
							{ data.split("\n").map((item,index)=>{return(<li key={index}>{item}</li>)}) }
						</ul>
						<button className="rule-btn c-fs18 c-cfff" onClick={()=>{this.setState({showRules: false})}}>知道了</button>
						<div className="rule-close c-pa">
							<button onClick={()=>{this.setState({showRules: false})}}></button>
						</div>
					</div>
				</div>
				:''}
			</div>
		)
	}
}

//红包列表
class List extends Component {
	componentDidMount() {
		let type = parseInt($('.active-one').attr('id'));
		this.setState({
			type: type
		})
	};

	render() {
		let {data,type,hasMore,fn,sending,status} = this.props;

		let reds = data.filter(item=>item.type===3).map((item,i)=>{
			return <EachRed key={i} data={item} type={type} status={status}/>
		});

		return (
			<div className="list-contrl">
				<div className="each-list">
					{reds.length ? reds : <NoRed />}
				</div>
				{!!reds.length && <NoMoreRed type={type} fn={fn} hasMore={hasMore} sending={sending}/>}
			</div>
		)
	}
}

//无红包
class NoRed extends Component {
	render() {
		return (
			<div className="no-red">
				<img src="./src/img/channels/no-red.png"/>
			</div>
		)
	}
}

//列表内单个红包
class EachRed extends Component {
	getDate = (tm) => {
		let tt = new Date(parseInt(tm) * 1000);
		let ttyear = tt.getFullYear(),
			ttmonth = parseInt(tt.getMonth()) + 1,
			ttday = tt.getDate();
		let couponTime = ttyear + "/" + ttmonth + "/" + ttday;
		return couponTime;
	};
	componentWillMount(){
		this.setState({
			showPop: false,
			isIphone5: false
		})
	};
	closePopup=()=>{
		this.setState({
			showPop: false
		})
	};
	componentDidMount(){
		if($(window).width() < 330){
			this.setState({
				isIphone5: true
			})
		}
	}

    //格式化时间
    formateDate = (T)=>{
        let dateAndTime = T.split(' ');
        let data = dateAndTime[0].split('-').join('/').substring(2),
            time = dateAndTime[1].substring(0,5);
        return data+' '+time;
    };

	//判断优惠券是否生效
	isValid = (time)=>{
		let beginTime = "2009-09-21 00:00:00";
		let endTime = "2009-09-21 00:00:01";
		let beginTimes = beginTime.substring(0, 10).split('-');
		let endTimes = endTime.substring(0, 10).split('-');

		beginTime = beginTimes[1] + '-' + beginTimes[2] + '-' + beginTimes[0] + ' ' + beginTime.substring(10, 19);
		endTime = endTimes[1] + '-' + endTimes[2] + '-' + endTimes[0] + ' ' + endTime.substring(10, 19);

		alert(beginTime + "aaa" + endTime);
		alert(Date.parse(endTime));
		alert(Date.parse(beginTime));
		let a = (Date.parse(endTime) - Date.parse(beginTime)) / 3600 / 1000;
		if (a < 0) {
			alert("endTime小!");
		} else if (a > 0) {
			alert("endTime大!");
		} else if (a == 0) {
			alert("时间相等!");
		} else {
			return 'exception'
		}
	};

	//获取时间戳
	getTime  =  (T)=>{
		return new Date(T.replace(/-/g,'/')).getTime();
	};

	//获取红包状态
	getRedStatus = ()=>{
		const {data:{use_start_time,current_time}, status} = this.props;

		if(status){
			return this.getTime(current_time) > this.getTime(use_start_time)?'valid':'ineffective';
		}else {
			return 'invalid';
		}
	};

	render() {
		const RED = {
			'valid': { text:'已生效', classType: ''},
			'ineffective': { text:'未生效', classType: 'each-red-not'},
			'invalid': { text:'已失效', classType: 'each-red-invalid'},
		};

		let {data,type} = this.props;
        const startTime = this.formateDate(data.use_start_time),
              endTime = this.formateDate(data.use_end_time);

		let redStatus = this.getRedStatus();

		return (
			<div className={`each-red ${RED[redStatus].classType}`}>
				<div className="top">
					<div className="price c-fs20 c-cdred c-tc c-fl">
						¥<span className={data.deduct_money<100?"c-fs45":"c-fs30"}>
							{data.deduct_money}
						</span>
					</div>
					<div className="red-msg c-fl c-pr">
						<span className="red-status c-cblue c-fs11 c-pa">{RED[redStatus].text}</span>
						<p className="c-fs16"> {data.name}</p>
						{data.applicable_item_type!=='ALL' && <p className="c-fs11 c-c999">· {data.apply_text}</p>}
						{data.applicable_platform!=='ALL' && <p className="c-fs11 c-c999">· {`${data.applicable_platform}端专用`}</p>}
					</div>
				</div>
				<div className="bottom">
					<span className="c-fl c-c999">有效期: <em>{startTime}</em>至<em>{endTime}</em></span>
					{this.state.isIphone5?
						<button className="c-fr small-screen" onClick={()=>{this.setState({showPop:true})}} >更多</button>
						:
						<button className="c-fr" onClick={()=>{this.setState({showPop:true})}} >查看更多</button>
					}
				</div>
				{this.state.showPop && <PopupBox fn={this.closePopup} data={data} />}
			</div>
		)
	}
}

//底部弹窗
class PopupBox extends Component {
	componentDidMount(){
		setTimeout(function(){
			$('.pop-up').addClass('box-up');
		},100)
	}
	render(){
		let {data,fn} = this.props;
		let records = data.use_records.map(function(item,i){
			return <OneRecord data={item} money={data.deduct_money} key={i} />
		});
		return(
			<div>
				<div className="box" onClick={()=>{fn()}}></div>
				<div className="pop-up c-pr">
					<button onClick={()=>{fn()}}></button>
					<h3>{data.coupon_name}</h3>
					{data.use_records.length?
					<div style={{borderTop:'1px solid #e4e4e4',height: '240px',overflowY: 'scroll'}}>{records}</div>
					:<NoRecords />}
				</div>
			</div>
		)
	}
}

class NoRecords extends Component {
	render(){
		return (
			<div className="no-records">
				<img src="./src/img/channels/no-record.png" />
			</div>
		)
	}
}

class OneRecord extends Component {
	getDate(tt) {
		let d = new Date(tt*1000),
			yy = d.getFullYear() > 9 ? d.getFullYear() : '0' + d.getFullYear(),
			mon = d.getMonth() + 1 > 9 ? d.getMonth() + 1 : '0' + (d.getMonth() + 1),
			dd = d.getDate() > 9 ? d.getDate() : '0' + d.getDate(),
			hh = d.getHours() > 9 ? d.getHours() : '0' + d.getHours(),
			mm = d.getMinutes() > 9 ? d.getMinutes() : '0' + d.getMinutes();
		return yy + '-' + mon + '-' + dd + ' ' + hh + ':' + mm
	};
	render(){
		let {data,money} = this.props,
			dateTime =
				data.used_time?
					//this.getDate(data.used_time)
					data.used_time
					:
					(data.cancel_time?
						//this.getDate(data.cancel_time)
						data.cancel_time
						:
						//this.getDate(data.expire_time)
						data.expire_time
					);
		return(
			<div className="one-record c-pr">
				<p className="c-fs12 c-c35">{data.expire_time?'过期失效':('订单号'+data.order_id+' '+(data.used_time?'下单使用':'取消使用'))}</p>
				<p className="c-fs10 c-c999">{dateTime}</p>
				<span className="c-fs20 c-cdred c-pa" style={{top:'14px',right:'15px'}}>{(data.cancel_time?'+ ¥':'- ¥') + money}</span>
			</div>
		)
	}
}

//没有更多
class NoMoreRed extends Component {
	componentWillUnmount() {
		$(window).unbind('scroll.loadmore');
	}

	componentDidMount() {
		let {fn} = this.props;
		let status = parseInt($('.active-one').attr('id'));
		let self = this;
		$(window).bind('scroll.loadmore', function () {
			let $this = $(this);
			let scrollH = $this.scrollTop();
			let scrollHeight = $(".list-contrl").height() - $(window).height();
			if (scrollH >= scrollHeight) {
				if (self.props.hasMore && (!self.props.sending)) {
					fn(status);
				}
			}
		});
	};

	render() {
		let {hasMore, sending, type} = this.props;
		return (
			<div className="no-more">
				<div className="line c-pr"></div>
				<div className="txt c-c999 c-tc c-fs14">{hasMore ? (sending ? '加载中...' : '下拉加载更多') :  (type === 2? '仅保留90天内的记录' : '别拉了，我是有底线的~')}</div>
			</div>
		)
	}
}