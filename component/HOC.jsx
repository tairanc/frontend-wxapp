import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Link} from 'react-router';
import 'plugin/dropload.js';
import "./HOC.scss";

//弹窗的高阶组件实现
export const HOCPopup = (ModalComponent) => {
    return class extends Component {
        constructor(props) {
            super(props);
            this.existence = false;
            this.openPortal = this.openPortal.bind(this);
            this.renderPortal = this.renderPortal.bind(this);
            this.closePortal = this.closePortal.bind(this);
        }

        renderPortal(props) {
            if (props.active) {
                document.body.appendChild(this.node);
                this.existence = true;
                ReactDOM.unstable_renderSubtreeIntoContainer(
                    this,
                    <ModalComponent {...props} onClose={this.closePortal}/>,
                    this.node
                );
            } else if (this.existence) {
                ReactDOM.unmountComponentAtNode(this.node);
                document.body.removeChild(this.node);
                this.existence = false;
            }
        };

        openPortal(props = this.props) {
            this.renderPortal(props);
        };

        closePortal() {
            this.props.onClose();
            /*if( this.existence ){
                ReactDOM.unmountComponentAtNode( this.node );
                document.body.removeChild(this.node);
                this.existence = false;
            }*/
        };

        unMountPortal() {
            if (this.existence) {
                document.body.removeChild(this.node);
            }
        }

        componentDidMount() {
            this.node = document.createElement('div');
            this.openPortal();
        };

        componentWillUpdate(newProps) {
            this.renderPortal(newProps);
        }

        componentWillUnmount() {
            this.unMountPortal();
        }

        render() {
            return null;
        }
    }
};

//下拉加载
export const DropDownLoad = (ListComponent) => {
    return class extends Component {
        constructor(props) {
            super(props);
        }

        componentDidMount() {
            this.props.didMount && this.props.didMount();
            this.dropLoad = $(this.refs.list).dropload({
                scrollArea: this.props.scrollArea,
                loadDownFn: this.props.dropDown
            });
        }
        componentWillUnmount() {
            this.dropLoad.remove();
        }

        render() {
            return (
                <div data-comp="drop-down-load" ref="list">
                    <ListComponent {...this.props} />
                </div>
            )
        }
    }
};

//link 还是a 标签
export class LinkOrA extends Component {
    render() {
        const {type, className, link} = this.props;
        if (type === "link") {
            return <Link to={link} className={className}>{this.props.children}</Link>
        } else {
            return <a href={link} className={className}>{this.props.children}</a>
        }
    }
}