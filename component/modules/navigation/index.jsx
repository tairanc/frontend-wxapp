import React, {Component} from 'react';
import {Link, browserHistory} from 'react-router';
import styles from './index.scss';
import {DIR} from 'config/index';
import {miniProgramLogin,miniProgramShopCart,miniProgramMine,miniProgramBags,miniProgramGroup,miniProgramMall} from 'js/util/miniProgramLogin';

export default class Navigator extends Component {

	replaceUrl = (url, e) => {
		e.preventDefault();
		browserHistory.replace(url);
	};

	render() {
		return <div className={ styles.navigation }>
				<Link onClick={(e)=>{
					e.preventDefault();
					miniProgramMall();
				}} activeClassName={styles.navActive} className={ styles.navLink }>
					<div className={styles.navIcon + " " + styles.navHome}></div>
					<div className={ styles.navText}>首页</div>
				</Link>
				<Link onClick={(e)=>{
					e.preventDefault();
					miniProgramGroup();
				}} activeClassName={styles.navActive} className={ styles.navLink }>
					<div className={styles.navIcon + " " + styles.navGroup}></div>
					<div className={ styles.navText}>拼团</div>
				</Link>
				<Link onClick={(e)=>{
					e.preventDefault();
					miniProgramBags();
				}} activeClassName={styles.navActive} className={ styles.navLink }>
					<div className={styles.navIcon + " " + styles.navCart}></div>
					<div className={ styles.navText} style={{color:"#e60a30"}}>购物袋</div>
				</Link>
				<Link onClick={(e)=>{
					e.preventDefault();
					miniProgramMine();
				}} activeClassName={styles.navActive} className={ styles.navLink }>
					<div className={styles.navIcon + " " + styles.navUser}></div>
					<div className={ styles.navText}>我的</div>
				</Link>
			{/* <a className={ styles.navLink }
			   onClick={(e) => {
				   e.preventDefault();
				   miniProgramLogin()
			   }}
			   activeClassName={styles.navActive}>
				<div className={styles.navIcon + " " + styles.navHome}></div>
				<div className={ styles.navText}>推荐</div>
			</a>
			<a
				  className={ styles.navLink }
				  onClick={ (e)=>{
				  	e.preventDefault();
				  	miniProgramShopCart();
				  }
				  }
				  activeClassName={styles.navActive}>
				<div className={styles.navIcon + " " + styles.navCart}>
				</div>
				<div className={ styles.navText}>购物袋</div>

			</a>
			<Link to={`${DIR}/userCenter`}
				  className={ styles.navLink }
				  onClick={ this.replaceUrl.bind(this, `${DIR}/userCenter`)}
				  activeClassName={styles.navActive}>
				<div className={styles.navIcon + " " + styles.navUser}></div>
				<div className={ styles.navText}>我的</div>
			</Link> */}
		</div>
	}
}
