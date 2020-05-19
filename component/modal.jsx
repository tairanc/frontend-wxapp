import React, {Component, DOM} from 'react';
import ReactDOM, {render} from 'react-dom';
import {HOCPopup} from './HOC.jsx';
import {Shady} from './common.jsx';
import './modal.scss';

//动画
import ReactTransition from 'react-addons-css-transition-group';

// modal
function pipeModal(ModalType, Transition) {

	const div = document.createElement('div');
	document.body.appendChild(div);
	let ContainerObj = ReactDOM.render(<Container Transition={Transition}/>, div);

	let zIndex = 10;
	let id = 1000;

	class Modal extends Component {

		constructor(prop) {

			super(prop);
			this.id = ++id
			this.zIndex = prop.zIndex || ++zIndex;
		}

		componentDidMount() {
			if (this.props.isOpen) {
				this.renderModal(this.props);
			}
		}

		componentWillReceiveProps(nextProp) {

			nextProp.isOpen ? this.renderModal(nextProp) : Modal.close(this.id)
		}

		componentWillUnmount() {
			Modal.close(this.id);
		}

		renderModal(prop) {
			ContainerObj.addModal({
				id: this.id,
				zIndex: this.zIndex,
				...prop,
				ModalType
			});
		}

		render() {
			return DOM.noscript();
		}
	}

	Modal.open = (prop) => {
		ContainerObj.addModal({
			id: ++id,
			zIndex: ++zIndex,
			...prop,
			ModalType
		});
		return id
	};

	Modal.close = (id) => {
		ContainerObj.removeModals(id);
	};

	return Modal
}

class Container extends Component {
	constructor(prop) {
		super(prop);

		this.state = {
			modals: {},
			ids: []
		};

		this.addMoal = this.addModal.bind(this);
		this.removeModal = this.removeModal.bind(this);
	}

	addModal(prop) {

		let {modals, ids} = this.state;

		modals[prop.id] = prop;

		if (!~ids.indexOf(prop.id)) {
			ids.push(prop.id);
		}
		this.setState({modals, ids});
		this.updateHeight()
	}

	removeModal(id) {
		let {modals, ids} = this.state;
		let index = ids.indexOf(id);
		let props = modals[id];
		if (index < 0) return
		props && props.onClose && props.onClose()
		delete modals[id];
		ids.splice(index, 1);
	}

	removeModals(id) {
		let ids = id ? [id] : this.state.ids;
		ids.forEach((v) => {
			this.removeModal(v)
		})
		this.setState(this.state);
		this.updateHeight()
	}

	updateHeight() {
		let hasIds = this.state.ids.length;
		let overflow = hasIds ? "hidden" : "";
		let height = hasIds ? "100%" : "";
		let pos = hasIds ? "fixed" : "";
		document.body.style.position = pos;
		document.body.style.overflow = overflow;
		document.body.style.height = height;
	}

	renderModal() {
		var Modal = [];
		this.state.ids.map((value, key) => {
			let prop = this.state.modals[value];
			let {ModalType} = prop
			Modal.push(
				<ModalType {...prop} key={value} onClose={this.removeModal}/>
			)
		});

		return Modal
	}

	render() {
		let hasIds = this.state.ids.length;
		let cls = "modalContainer " + (hasIds ? 'modalEnter' : 'modalLeave');
		return (
			<ReactTransition transitionName="slide" data-comp="animate" transitionEnterTimeout={200}
							 transitionLeaveTimeout={200} {...this.props.Transition} component="div" className={cls}>
				{this.renderModal()}
			</ReactTransition>
		)
	}
}

class ModalView extends Component {

	closeHandle() {
		this.props.onClose(this.props.id)
	}

	initHeader() {
		return (
			<div className="popModalHeader">{this.props.title}<span className="close-btn" onClick={ (events) => {
				return this.closeHandle(events)
			}}><i className="icon icon-close"></i></span></div>
		)
	}

	initFooter() {
		let {buttons = []} = this.props;
		let btns = [];

		buttons.map((item, i) => {

			let handle = () => {
				if (!item.cb) {
					this.closeHandle()
				} else {
					item.cb() && this.closeHandle()
				}
			};
			btns.push(<a href="javascript:;" onClick={handle}
						 className={"modal-btn " + item.className}><span>{item.text}</span></a>)
		});

		return (
			<div className="modal-footer">{btns}</div>
		)
	}

	render() {
		let {width, height, children, zIndex} = this.props;
		return (
			<div className={"modal " + this.props.className} style={{zIndex: zIndex}}>
				{this.initHeader()}
				<div className="popModalContent" style={{width: width || '100%', height: height || '50%'}}>
					{children}
				</div>
				{this.initFooter()}
			</div>
		)
	}
}

export class Fix extends Component {
	constructor() {
		super();
		this.state = {}
	}

	componentDidMount() {
		let el = this.refs.el;
		let {isFix = false} = this.props;

		this.pos = el.offsetTop;
		this.left = el.offsetLeft;

		this.setState({isFix});
		this.addEvent()
	}

	addEvent() {
		this.handle = (events) => {
			let isC = $(window).scrollTop() > this.pos ? true : false;

			if (isC !== this.state.isFix) {
				this.setState({
					isFix: isC
				})
			}
		};
		window.addEventListener("scroll", this.handle);
	}

	componentWillUnmount() {
		window.removeEventListener("scroll", this.handle);
	}

	render() {
		let style = this.state.isFix ? {
			position: "fixed",
			top: 0,
			width: "100%",
			"borderBottom": "1px solid #f4f4f4",
			left: this.left
		} : {}
		return (
			<div ref="el">
				<div style={style}>
					{this.props.children}
				</div>
			</div>
		)
	}
}
export class ItemFix extends Component {
	constructor() {
		super();
		this.state = {}
	}

	componentDidUpdate() {
		window.removeEventListener("scroll", this.handle);
		this.addEvent()
	}

	componentDidMount() {
		let {isFix = false} = this.props;
		this.setState({isFix});
		this.addEvent()
	}

	addEvent() {
		let el = this.refs.el;
		this.pos = el.offsetTop - 44;
		this.left = el.offsetLeft;
		this.handle = (events) => {
			let isC = $(window).scrollTop() > this.pos ? true : false;

			if (isC !== this.state.isFix) {
				this.setState({
					isFix: isC
				})
			}
		};
		window.addEventListener("scroll", this.handle);
	}

	componentWillUnmount() {
		window.removeEventListener("scroll", this.handle);
	}

	render() {
		let style = this.state.isFix ? {
			position: "fixed",
			top: "44px",
			width: "100%",
			"borderBottom": "1px solid #f4f4f4",
			left: this.left,
			zIndex: "10"
		} : {};
		return (
			<div ref="el">
				<div style={style}>
					{this.props.children}
				</div>
				<div style={this.state.isFix ? {height: "46px"} : {height: 0}}></div>
			</div>
		)
	}
}

export let Modal = pipeModal(ModalView);


//对话框
class ModalComp extends Component {
	constructor(props) {
		super(props);
		// 初始状态
		this.state = {isOpen: false};
	}

	componentDidMount() {
		this.setState({isOpen: true});
	}

	modalClose = () => {
		this.setState({isOpen: false});
		setTimeout(() => {
			this.props.onClose();
		}, 200);
	};
	modalSure = () => {
		this.modalClose();
		this.props.onSure();
	}

	render() {
		return (
			<div data-comp="modal" id="modal">
				<Shady clickHandle={this.modalClose}/>
				<ReactTransition transitionName="modal"
								 data-comp="animate"
								 transitionEnterTimeout={200}
								 transitionLeaveTimeout={200}
								 component="div">
					{this.state.isOpen ?
						<div ref="modal" className="modal">
							{this.props.title && <div className="modal-title">this.props.title</div>}
							<div className="modal-text" style={this.props.title ? {
								fontSize: "13px",
								fontWeight: "normal"
							} : {}}>{this.props.msg}</div>
							<div className="modal-btn c-fr">
								<div onClick={ this.modalClose  } className="g-col-1 one-btn c-fl " ref="cancel">
									<span>取消</span>
								</div>
								<div onClick={ this.modalSure } className="g-col-1 one-btn c-fr" ref="sure">
									<span>确定</span>
								</div>
							</div>
						</div>
						: ""}
				</ReactTransition>
			</div>
		)
	}
}

export const PopupModal = HOCPopup(ModalComp);

//提示文字
class TipComp extends Component {
	constructor(props) {
		super(props);
		this.state = {
			show: false
		};
	}

	componentDidMount() {
		this.setState({show: true});
		this.showTime = setTimeout(() => {
			this.setState({show: false});
			this.handleTime = setTimeout(() => {
				this.props.onClose();
			}, 200);
		}, 2000);
	}

	componentWillUnmount() {
		clearTimeout(this.showTime);
		clearTimeout(this.handleTime);
	}

	render() {
		return (
			<ReactTransition data-comp="animate msg-tip"
							 id="msgTip"
							 transitionName="prompt"
							 transitionEnterTimeout={200}
							 transitionLeaveTimeout={200}
							 component="div">
				{this.state.show ?
					<div className="msg-text">
						{this.props.msg }
					</div>
					: ""}
			</ReactTransition>
		)
	}
}

export const PopupTip = HOCPopup(TipComp);

class TipCompBig extends Component {
	constructor(props) {
		super(props);
		this.state = {
			show: false
		};
	}

	componentDidMount() {
		const self = this;
		this.setState({
			show: true
		});
		self.showTime = window.setTimeout(() => {
			self.setState({show: false});
			self.handleTime = window.setTimeout(() => {
				self.props.onClose();
			}, 200);
		}, 2000);
	}

	componentWillUnmount() {
		clearInterval(this.showTime);
		clearInterval(this.handleTime);
	}

	render() {
		return (
			<ReactTransition data-comp="animate msg-tip"
							 id="msgTipBig"
							 transitionName="prompt"
							 transitionEnterTimeout={100}
							 transitionLeaveTimeout={200}
							 component="div">
				{this.state.show ?
					<div className="msg-text">
						{this.props.msg }
					</div>
					: ""}
			</ReactTransition>
		)
	}
}

export const PopupTipBig = HOCPopup(TipCompBig);

//提醒框
/*class ModalA extends Component{
 render(){
 const {btns,msg,title="提示"} = this.props;
 const btnGroup = btns.map(( btn,i)=>{
 return <div key={i} className="g-col-1 one-btn" onClick={ (e)=>{ btn.cb(); } } >{btn.text}</div>
 });
 return(
 <div>
 <Shady options={{zIndex:105}} clickHandle ={btns[0].cb}/>
 <div data-comp="modal" id="modalA">
 <div className="top">{title}</div>
 <div className="content">{msg}</div>
 <div className="btn-group g-row-flex">
 { btnGroup }
 </div>
 </div>
 </div>
 )
 }
 }*/

class ModalA extends Component {
	render() {
		const {btns, msg, title} = this.props;
		const btnGroup = btns.map((btn, i) => {
			return <button key={i} className="one-btn" onClick={ (e) => {
				btn.cb();
			} }>{btn.text}</button>
		});
		return (
			<div>
				<Shady options={{zIndex: 105}} clickHandle={btns[0].cb}/>
				<div data-comp="modal" id="modalA">
					{title && <div className="top">{title}</div>}
					<div className="content" style={title ? {fontSize: "13px", fontWeight: "normal"} : {}}>{msg}</div>
					<div className="btn-group">
						{ btnGroup }
					</div>
				</div>
			</div>
		)
	}
}

export const ModalAComp = HOCPopup(ModalA);

class ModalC extends Component {
	render() {
		const {btns, msg, title = "提示"} = this.props;
		const btnGroup = btns.map((btn, i) => {
			return <div key={i} className="g-col-1 one-btn" onClick={ (e) => {
				btn.cb();
			} }>{btn.text}</div>
		});
		return (
			<div>
				<Shady options={{zIndex: 105}} clickHandle={btns[0].cb}/>
				<div data-comp="modal" id="modalC" style={{width: "270px", height: "125px"}}>
					<div className="top">{title}</div>
					<div className="content">{msg}</div>
					<div className="btn-group g-row-flex">
						{ btnGroup }
					</div>
				</div>
			</div>
		)
	}
}

export const ModalCComp = HOCPopup(ModalC);

class ModalB extends Component {
	constructor(props) {
		super(props);
		// 初始状态
		this.state = {
			isOpen: false
		};
	}

	componentDidMount() {
		this.setState({
			isOpen: true
		});
	}

	modalHide = (cb) => {
		let self = this;
		this.setState({
			isOpen: false
		});
		setTimeout(() => {
			cb && cb();
		}, 200);
	};

	render() {
		const {btns, title, msg} = this.props;
		const btnGroup = btns.map((btn, i) => {
			return <div key={i} className="g-col-1 one-btn" onClick={ (e) => {
				btn.cb();
			} }><span>{btn.text}</span></div>
		});
		return (
			<div data-comp="modal" id="modalB">
				<Shady options={{zIndex: 105}} clickHandle={btns[0].cb}/>
				<ReactTransition transitionName="modal"
								 data-comp="animate"
								 transitionEnterTimeout={200}
								 transitionLeaveTimeout={200}
								 component="div">
					{this.state.isOpen ?
						<div ref="modal" className="modal">
							<div className="modal-title">{ title }</div>
							<div className="modal-text">
								{ msg }
							</div>
							<div className="btn-group g-row-flex">
								{ btnGroup }
							</div>
						</div>
						: ""}
				</ReactTransition>
			</div>
		)
	}
}

export const ModalBComp = HOCPopup(ModalB);

/**
 * 自定义内容的模态框
 */
class ModalBox extends Component {
	constructor(prop) {
		super(prop)
	}
	render() {
		return (
			<div data-comp="modal" id="modalBox">
        <Shady options={{zIndex: 999}}/>
				<ReactTransition
          transitionName="modal"
          data-comp="animate"
          transitionEnterTimeout={200}
          transitionLeaveTimeout={200}
          component="div"
				>
					<div className="modal" style={{zIndex: 9999}}>
            {this.props.children}
					</div>
				</ReactTransition>
			</div>
		)
	}
}

export const ModalBoxComp = HOCPopup(ModalBox);

