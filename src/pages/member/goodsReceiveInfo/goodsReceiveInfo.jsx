import React, {Component} from 'react';
import ReactDOM, {render} from 'react-dom';
import {Link} from 'react-router';
import {LoadingRound} from 'component/common';
import {PopupModal} from 'component/modal';

import './addressAndIdentityInfo.scss';

export default class GoodsReceiveInfo extends Component {
	constructor(props) {
		super(props);
		this.state = {}
	}

	componentWillMount() {
		document.title = "收货信息";
	}

	componentDidMount() {
		$("#goods-receive").css({minHeight: $(window).height()})
	}

	render() {
		return (
			<div data-page="goods-receive">
				<section id="goods-receive" ref="goods-receive">
					<div className="wrapper c-fs15 c-c35">
						<Link to="/goodsReceiveInfo/addressManage">
							<div className="address">地址管理
								<img src="../src/img/addressAndIdentityInfo/trArror.png"/>
							</div>
						</Link>
						<Link to="/goodsReceiveInfo/identityManage">
							<div>身份证管理
								<img src="../src/img/addressAndIdentityInfo/trArror.png"/>
							</div>
						</Link>
					</div>
				</section>
			</div>
		)
	}
}
