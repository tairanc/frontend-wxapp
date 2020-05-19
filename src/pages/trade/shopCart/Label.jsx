import React,{Component} from 'react';
import styles from './Label.scss';


export function RedLabel(props) {
	return <span className={`${styles.redLabel}${props.className ? " "+props.className: "" }`}>{props.children}</span>
}

export function GreyLabel(props) {
	return <span className={`${styles.greyLabel}${props.className ? " "+props.className: "" }`}>{props.children}</span>
}

export function RedBgLabel(props) {
	return <span className={`${styles.bgLabel}${props.className ? " "+props.className: "" }`}>{props.children}</span>
}