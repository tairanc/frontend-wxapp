import React, {Component} from 'react';
import {LoadingRound} from 'component/common';
import {tip} from 'component/modules/popup/tip/tip';
import {Link} from 'react-router';
import axios from 'js/util/axios';
import {WXAPI,DIR} from 'config/index'
import {miniProgramLogin} from 'js/util/miniProgramLogin';
import "./index.scss"

const pageApi = {
    Notice: {url: `${WXAPI}/getNoticeById`, method: "get"} //注意
};


export default class Notice extends Component {
	constructor(props) {
		super(props);
		let {id} = props.location.query;
		this.state = {
			update: false,
			noData: false,
			id: id
		};
	}

	componentWillMount() {
		document.title = "小泰公告";
	}


	componentDidMount() {
		let self = this;
		axios.request({...pageApi.Notice,params :{id:self.state.id} }).then(
			result => {
                if (result.data.code!==0) {
                    self.setState({noData: true, update: true});
                    return
                }
                self.setState({data: result.data.data, update: true})
			}
		)

	}

	getLocalTime = (nS) => {
		return new Date(parseInt(nS) * 1000).toLocaleString().replace(/:\d{1,2}$/, ' ');
	};

	getDate(tt) {
		let d = new Date(tt),
			yy = d.getFullYear() > 9 ? d.getFullYear() : '0' + d.getFullYear(),
			mon = d.getMonth() + 1 > 9 ? d.getMonth() + 1 : '0' + (d.getMonth() + 1),
			dd = d.getDate() > 9 ? d.getDate() : '0' + d.getDate(),
			hh = d.getHours() > 9 ? d.getHours() : '0' + d.getHours(),
			mm = d.getMinutes() > 9 ? d.getMinutes() : '0' + d.getMinutes(),
			ss = d.getSeconds() > 9 ? d.getSeconds() : '0' + d.getSeconds();
		return yy + '年' + mon + '月'
	};

	render() {
		let style = {minHeight: $(window).height(), padding: "22px 20px"};
		let {update, data, noData} = this.state;
		let time, title;
		if (update && !noData) {
			time = this.getDate(new Date(data.updated_time.replace(/-/g, '/')).getTime());
			title = data.title;
			if (title.length > 30) {
				title = title.substring(0, 30) + "..."
			}
		}
		return (
			update ?
				<div data-page="user-code">
					{noData ?
						<div className="no-data">
							<img src="/src/img/home/no-notice.png" className="no-data-img"/>
							<p className="no-text">暂无公告</p>
							<a onClick={(e)=>{
								e.preventDefault();
								miniProgramLogin();
							}}>返回首页</a>
						</div>
						:
						<section className="wrapper" style={style}>
							<div className="notice"><img src="src/img/home/notice.png"/>小泰公告</div>
							<div className="title">{title}</div>
							<div className="time">{time}更新</div>
							<div className="border"></div>
							<div className="text">{data.content} </div>
						</section>}
				</div> : <LoadingRound />
		)
	}
}