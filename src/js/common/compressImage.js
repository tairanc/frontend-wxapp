import EXIF from 'exif-js';
import { browser } from 'js/common/utils.js';

//压缩图片
function compressImg( img ) {
    let width = img.width;
    let height = img.height;
    //如果图片大于四百万像素，计算压缩比并将大小压至400万以下
    let ratio;
    //    用于压缩图片的canvas
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext('2d');
    //    瓦片canvas
    let tCanvas = document.createElement("canvas");
    let tctx = tCanvas.getContext("2d");
    
    if (( ratio = width * height / 4000000) > 1) {
        //图片质量进行适当压缩
        ratio = Math.sqrt(ratio);
        width /= ratio;
        height /= ratio;
    } else {
        ratio = 1;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    //如果图片像素大于100万则使用瓦片绘制
    let count;
    if ((count = width * height / 1000000) > 1) {
        count = ~~(Math.sqrt(count) + 1); //计算要分成多少块瓦片
        
        //计算每块瓦片的宽和高
        let nw = ~~(width / count);
        let nh = ~~(height / count);
        
        tCanvas.width = nw;
        tCanvas.height = nh;
        
        for (let i = 0; i < count; i++) {
            for (let j = 0; j < count; j++) {
                tctx.drawImage(img, i * nw * ratio, j * nh * ratio, nw * ratio, nh * ratio, 0, 0, nw, nh);
                //把大图片画到一个小画布
                ctx.drawImage(tCanvas, i * nw, j * nh, nw, nh);
            }
        }
    } else {
        ctx.drawImage(img, 0, 0, width, height);
    }
    //进行最小压缩,导出图片为base64
    let ndata = canvas.toDataURL("image/jpeg", 0.1);
    
    tCanvas.width = tCanvas.height = canvas.width = canvas.height = 0;
    return ndata;
}

class ImageProcess{
    constructor(file,img) {
        this.img = img;
        //    用于压缩图片的canvas
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext('2d');
        //    瓦片canvas
        this.tCanvas = document.createElement("canvas");
        this.tctx = this.tCanvas.getContext("2d");
        this.file = file;
    }
    init(){
        let self = this;
        return new Promise( resolve => {
            EXIF.getData(this.file, function(){
                let Orientation = EXIF.getTag(this, 'Orientation');
                resolve(self.rotate(Orientation));
            })
        })
    }
    
    compress(){
        let { width, height } = this.img;
        if (( this.ratio =  width *  height / 4000000) > 1) {
            this.ratio = Math.sqrt(this.ratio);
            width /= this.ratio;
            height /= this.ratio;
        } else {
            this.ratio = 1;
        }
        this.canvas.width =  width;
        this.canvas.height =  height;
        
        let count;
        if ((count =  width *  height / 1000000) > 1) {
            count = ~~(Math.sqrt(count) + 1); //计算要分成多少块瓦片
            
            //计算每块瓦片的宽和高
            let nw = ~~( width / count);
            let nh = ~~( height / count);
            
            this.tCanvas.width = nw;
            this.tCanvas.height = nh;
            
            for (let i = 0; i < count; i++) {
                for (let j = 0; j < count; j++) {
                    this.tctx.drawImage(this.img, i * nw * this.ratio, j * nh * this.ratio, nw * this.ratio, nh * this.ratio, 0, 0, nw, nh);
                    
                    this.ctx.drawImage( this.tCanvas, i * nw, j * nh, nw, nh);
                }
            }
        } else {
            this.ctx.drawImage(this.img, 0, 0, width, height);
        }
        //进行最小压缩
        let nData = this.canvas.toDataURL("image/jpeg", 0.1);
        this.tCanvas.width =  this.tCanvas.height =  this.canvas.width =  this.canvas.height = 0;
        return nData;
    }
    
    rotate=( Orientation )=>{
        let { width, height } = this.img;
        switch (Orientation) {
            case 5:
            case 6:
            case 7:
            case 8:
                this.canvas.width = height;
                this.canvas.height = width;
                break;
            default:
                this.canvas.width = width;
                this.canvas.height = height;
        }
        if (browser.versions.ios) {
            switch (Orientation) {
                case 2:
                    this.ctx.translate(width, 0);
                    this.ctx.scale(-1, 1);
                    this.ctx.drawImage(this.img, 0, 0, width, height);
                    break;
                case 3:
                    this.ctx.rotate(180 * Math.PI / 180);
                    this.ctx.drawImage(this.img, -width, -height, width, height);
                    break;
                case 4:
                    this.ctx.translate(width, 0);
                    this.ctx.scale(-1, 1);
                    this.ctx.rotate(180 * Math.PI / 180);
                    this.ctx.drawImage(this.img, -width, -height, width, height);
                    break;
                case 5:
                    this.ctx.translate(width, 0);
                    this.ctx.scale(-1, 1);
                    this.ctx.rotate(90 * Math.PI / 180);
                    this.ctx.drawImage(this.img, 0, -width, height, width);
                    this.ctx.drawImage(this.img, 0, -height, -width, height);
                    break;
                case 6:
                    this.ctx.rotate(90 * Math.PI / 180);
                    //this.ctx.drawImage(this.img, 0, -width, height, width);
                    this.ctx.drawImage(this.img, 0, -height, width, height);
                    break;
                case 7:
                    this.ctx.translate(width, 0);
                    this.ctx.scale(-1, 1);
                    this.ctx.rotate(270 * Math.PI / 180);
                    //this.ctx.drawImage(this.img, -height, 0, height, width);
                    this.ctx.drawImage(this.img, -width, 0, width, height);
                    break;
                case 8:
                    this.ctx.rotate(270 * Math.PI / 180);
                    //this.ctx.drawImage(this.img, -height, 0, height, width);
                    this.ctx.drawImage(this.img, -width, 0, width, height);
                    break;
                default:
                    this.ctx.drawImage(this.img, 0, 0, width,height);
            }
        }
        //进行最小压缩
        return this.canvas.toDataURL("image/jpeg", 0.1);
    }
}

export function compress( file ) {
    return new Promise(( resolve, reject )=>{
        let reader = new FileReader();
        let img = new Image();
        let maxsize = 100 * 1024;
        reader.onload = function (){
            img.src = this.result;
            if ( this.result.length <= maxsize) {
                img = null;
                resolve(this.result);
            }else{
                img.onload = function() {
                    if(browser.versions.ios) {
                        new ImageProcess(file, img).init().then(resolve);
                    }else {
                        resolve(compressImg(img));
                    }
                }
            }
        };
        //把二进制图片内容转成base64的格式
        reader.readAsDataURL(file);
    }).catch((error)=>{
        console.log(error);
    })
}

