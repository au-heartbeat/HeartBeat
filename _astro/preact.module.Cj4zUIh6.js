var T,a,J,ne,C,z,K,$,Q,D={},X=[],oe=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,N=Array.isArray;function b(e,_){for(var t in _)e[t]=_[t];return e}function Y(e){var _=e.parentNode;_&&_.removeChild(e)}function re(e,_,t){var i,o,r,l={};for(r in _)r=="key"?i=_[r]:r=="ref"?o=_[r]:l[r]=_[r];if(arguments.length>2&&(l.children=arguments.length>3?T.call(arguments,2):t),typeof e=="function"&&e.defaultProps!=null)for(r in e.defaultProps)l[r]===void 0&&(l[r]=e.defaultProps[r]);return S(e,l,i,o,null)}function S(e,_,t,i,o){var r={type:e,props:_,key:t,ref:i,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,constructor:void 0,__v:o??++J,__i:-1,__u:0};return o==null&&a.vnode!=null&&a.vnode(r),r}function ae(){return{current:null}}function A(e){return e.children}function W(e,_){this.props=e,this.context=_}function w(e,_){if(_==null)return e.__?w(e.__,e.__i+1):null;for(var t;_<e.__k.length;_++)if((t=e.__k[_])!=null&&t.__e!=null)return t.__e;return typeof e.type=="function"?w(e):null}function Z(e){var _,t;if((e=e.__)!=null&&e.__c!=null){for(e.__e=e.__c.base=null,_=0;_<e.__k.length;_++)if((t=e.__k[_])!=null&&t.__e!=null){e.__e=e.__c.base=t.__e;break}return Z(e)}}function I(e){(!e.__d&&(e.__d=!0)&&C.push(e)&&!H.__r++||z!==a.debounceRendering)&&((z=a.debounceRendering)||K)(H)}function H(){var e,_,t,i,o,r,l,u,c;for(C.sort($);e=C.shift();)e.__d&&(_=C.length,i=void 0,r=(o=(t=e).__v).__e,u=[],c=[],(l=t.__P)&&((i=b({},o)).__v=o.__v+1,a.vnode&&a.vnode(i),O(l,i,o,t.__n,l.ownerSVGElement!==void 0,32&o.__u?[r]:null,u,r??w(o),!!(32&o.__u),c),i.__v=o.__v,i.__.__k[i.__i]=i,te(u,i,c),i.__e!=r&&Z(i)),C.length>_&&C.sort($));H.__r=0}function ee(e,_,t,i,o,r,l,u,c,s,p){var n,m,f,h,k,v=i&&i.__k||X,d=_.length;for(t.__d=c,ie(t,_,v),c=t.__d,n=0;n<d;n++)(f=t.__k[n])!=null&&typeof f!="boolean"&&typeof f!="function"&&(m=f.__i===-1?D:v[f.__i]||D,f.__i=n,O(e,f,m,o,r,l,u,c,s,p),h=f.__e,f.ref&&m.ref!=f.ref&&(m.ref&&R(m.ref,null,f),p.push(f.ref,f.__c||h,f)),k==null&&h!=null&&(k=h),65536&f.__u||m.__k===f.__k?c=_e(f,c,e):typeof f.type=="function"&&f.__d!==void 0?c=f.__d:h&&(c=h.nextSibling),f.__d=void 0,f.__u&=-196609);t.__d=c,t.__e=k}function ie(e,_,t){var i,o,r,l,u,c=_.length,s=t.length,p=s,n=0;for(e.__k=[],i=0;i<c;i++)l=i+n,(o=e.__k[i]=(o=_[i])==null||typeof o=="boolean"||typeof o=="function"?null:typeof o=="string"||typeof o=="number"||typeof o=="bigint"||o.constructor==String?S(null,o,null,null,null):N(o)?S(A,{children:o},null,null,null):o.constructor===void 0&&o.__b>0?S(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):o)!=null?(o.__=e,o.__b=e.__b+1,u=ue(o,t,l,p),o.__i=u,r=null,u!==-1&&(p--,(r=t[u])&&(r.__u|=131072)),r==null||r.__v===null?(u==-1&&n--,typeof o.type!="function"&&(o.__u|=65536)):u!==l&&(u===l+1?n++:u>l?p>c-l?n+=u-l:n--:u<l?u==l-1&&(n=u-l):n=0,u!==i+n&&(o.__u|=65536))):(r=t[l])&&r.key==null&&r.__e&&!(131072&r.__u)&&(r.__e==e.__d&&(e.__d=w(r)),B(r,r,!1),t[l]=null,p--);if(p)for(i=0;i<s;i++)(r=t[i])!=null&&!(131072&r.__u)&&(r.__e==e.__d&&(e.__d=w(r)),B(r,r))}function _e(e,_,t){var i,o;if(typeof e.type=="function"){for(i=e.__k,o=0;i&&o<i.length;o++)i[o]&&(i[o].__=e,_=_e(i[o],_,t));return _}e.__e!=_&&(t.insertBefore(e.__e,_||null),_=e.__e);do _=_&&_.nextSibling;while(_!=null&&_.nodeType===8);return _}function le(e,_){return _=_||[],e==null||typeof e=="boolean"||(N(e)?e.some(function(t){le(t,_)}):_.push(e)),_}function ue(e,_,t,i){var o=e.key,r=e.type,l=t-1,u=t+1,c=_[t];if(c===null||c&&o==c.key&&r===c.type&&!(131072&c.__u))return t;if(i>(c!=null&&!(131072&c.__u)?1:0))for(;l>=0||u<_.length;){if(l>=0){if((c=_[l])&&!(131072&c.__u)&&o==c.key&&r===c.type)return l;l--}if(u<_.length){if((c=_[u])&&!(131072&c.__u)&&o==c.key&&r===c.type)return u;u++}}return-1}function G(e,_,t){_[0]==="-"?e.setProperty(_,t??""):e[_]=t==null?"":typeof t!="number"||oe.test(_)?t:t+"px"}function M(e,_,t,i,o){var r;e:if(_==="style")if(typeof t=="string")e.style.cssText=t;else{if(typeof i=="string"&&(e.style.cssText=i=""),i)for(_ in i)t&&_ in t||G(e.style,_,"");if(t)for(_ in t)i&&t[_]===i[_]||G(e.style,_,t[_])}else if(_[0]==="o"&&_[1]==="n")r=_!==(_=_.replace(/(PointerCapture)$|Capture$/i,"$1")),_=_.toLowerCase()in e?_.toLowerCase().slice(2):_.slice(2),e.l||(e.l={}),e.l[_+r]=t,t?i?t.u=i.u:(t.u=Date.now(),e.addEventListener(_,r?q:V,r)):e.removeEventListener(_,r?q:V,r);else{if(o)_=_.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(_!=="width"&&_!=="height"&&_!=="href"&&_!=="list"&&_!=="form"&&_!=="tabIndex"&&_!=="download"&&_!=="rowSpan"&&_!=="colSpan"&&_!=="role"&&_ in e)try{e[_]=t??"";break e}catch{}typeof t=="function"||(t==null||t===!1&&_[4]!=="-"?e.removeAttribute(_):e.setAttribute(_,t))}}function V(e){if(this.l){var _=this.l[e.type+!1];if(e.t){if(e.t<=_.u)return}else e.t=Date.now();return _(a.event?a.event(e):e)}}function q(e){if(this.l)return this.l[e.type+!0](a.event?a.event(e):e)}function O(e,_,t,i,o,r,l,u,c,s){var p,n,m,f,h,k,v,d,y,x,U,P,j,E,F,g=_.type;if(_.constructor!==void 0)return null;128&t.__u&&(c=!!(32&t.__u),r=[u=_.__e=t.__e]),(p=a.__b)&&p(_);e:if(typeof g=="function")try{if(d=_.props,y=(p=g.contextType)&&i[p.__c],x=p?y?y.props.value:p.__:i,t.__c?v=(n=_.__c=t.__c).__=n.__E:("prototype"in g&&g.prototype.render?_.__c=n=new g(d,x):(_.__c=n=new W(d,x),n.constructor=g,n.render=fe),y&&y.sub(n),n.props=d,n.state||(n.state={}),n.context=x,n.__n=i,m=n.__d=!0,n.__h=[],n._sb=[]),n.__s==null&&(n.__s=n.state),g.getDerivedStateFromProps!=null&&(n.__s==n.state&&(n.__s=b({},n.__s)),b(n.__s,g.getDerivedStateFromProps(d,n.__s))),f=n.props,h=n.state,n.__v=_,m)g.getDerivedStateFromProps==null&&n.componentWillMount!=null&&n.componentWillMount(),n.componentDidMount!=null&&n.__h.push(n.componentDidMount);else{if(g.getDerivedStateFromProps==null&&d!==f&&n.componentWillReceiveProps!=null&&n.componentWillReceiveProps(d,x),!n.__e&&(n.shouldComponentUpdate!=null&&n.shouldComponentUpdate(d,n.__s,x)===!1||_.__v===t.__v)){for(_.__v!==t.__v&&(n.props=d,n.state=n.__s,n.__d=!1),_.__e=t.__e,_.__k=t.__k,_.__k.forEach(function(L){L&&(L.__=_)}),U=0;U<n._sb.length;U++)n.__h.push(n._sb[U]);n._sb=[],n.__h.length&&l.push(n);break e}n.componentWillUpdate!=null&&n.componentWillUpdate(d,n.__s,x),n.componentDidUpdate!=null&&n.__h.push(function(){n.componentDidUpdate(f,h,k)})}if(n.context=x,n.props=d,n.__P=e,n.__e=!1,P=a.__r,j=0,"prototype"in g&&g.prototype.render){for(n.state=n.__s,n.__d=!1,P&&P(_),p=n.render(n.props,n.state,n.context),E=0;E<n._sb.length;E++)n.__h.push(n._sb[E]);n._sb=[]}else do n.__d=!1,P&&P(_),p=n.render(n.props,n.state,n.context),n.state=n.__s;while(n.__d&&++j<25);n.state=n.__s,n.getChildContext!=null&&(i=b(b({},i),n.getChildContext())),m||n.getSnapshotBeforeUpdate==null||(k=n.getSnapshotBeforeUpdate(f,h)),ee(e,N(F=p!=null&&p.type===A&&p.key==null?p.props.children:p)?F:[F],_,t,i,o,r,l,u,c,s),n.base=_.__e,_.__u&=-161,n.__h.length&&l.push(n),v&&(n.__E=n.__=null)}catch(L){_.__v=null,c||r!=null?(_.__e=u,_.__u|=c?160:32,r[r.indexOf(u)]=null):(_.__e=t.__e,_.__k=t.__k),a.__e(L,_,t)}else r==null&&_.__v===t.__v?(_.__k=t.__k,_.__e=t.__e):_.__e=se(t.__e,_,t,i,o,r,l,c,s);(p=a.diffed)&&p(_)}function te(e,_,t){_.__d=void 0;for(var i=0;i<t.length;i++)R(t[i],t[++i],t[++i]);a.__c&&a.__c(_,e),e.some(function(o){try{e=o.__h,o.__h=[],e.some(function(r){r.call(o)})}catch(r){a.__e(r,o.__v)}})}function se(e,_,t,i,o,r,l,u,c){var s,p,n,m,f,h,k,v=t.props,d=_.props,y=_.type;if(y==="svg"&&(o=!0),r!=null){for(s=0;s<r.length;s++)if((f=r[s])&&"setAttribute"in f==!!y&&(y?f.localName===y:f.nodeType===3)){e=f,r[s]=null;break}}if(e==null){if(y===null)return document.createTextNode(d);e=o?document.createElementNS("http://www.w3.org/2000/svg",y):document.createElement(y,d.is&&d),r=null,u=!1}if(y===null)v===d||u&&e.data===d||(e.data=d);else{if(r=r&&T.call(e.childNodes),v=t.props||D,!u&&r!=null)for(v={},s=0;s<e.attributes.length;s++)v[(f=e.attributes[s]).name]=f.value;for(s in v)f=v[s],s=="children"||(s=="dangerouslySetInnerHTML"?n=f:s==="key"||s in d||M(e,s,null,f,o));for(s in d)f=d[s],s=="children"?m=f:s=="dangerouslySetInnerHTML"?p=f:s=="value"?h=f:s=="checked"?k=f:s==="key"||u&&typeof f!="function"||v[s]===f||M(e,s,f,v[s],o);if(p)u||n&&(p.__html===n.__html||p.__html===e.innerHTML)||(e.innerHTML=p.__html),_.__k=[];else if(n&&(e.innerHTML=""),ee(e,N(m)?m:[m],_,t,i,o&&y!=="foreignObject",r,l,r?r[0]:t.__k&&w(t,0),u,c),r!=null)for(s=r.length;s--;)r[s]!=null&&Y(r[s]);u||(s="value",h!==void 0&&(h!==e[s]||y==="progress"&&!h||y==="option"&&h!==v[s])&&M(e,s,h,v[s],!1),s="checked",k!==void 0&&k!==e[s]&&M(e,s,k,v[s],!1))}return e}function R(e,_,t){try{typeof e=="function"?e(_):e.current=_}catch(i){a.__e(i,t)}}function B(e,_,t){var i,o;if(a.unmount&&a.unmount(e),(i=e.ref)&&(i.current&&i.current!==e.__e||R(i,null,_)),(i=e.__c)!=null){if(i.componentWillUnmount)try{i.componentWillUnmount()}catch(r){a.__e(r,_)}i.base=i.__P=null,e.__c=void 0}if(i=e.__k)for(o=0;o<i.length;o++)i[o]&&B(i[o],_,t||typeof e.type!="function");t||e.__e==null||Y(e.__e),e.__=e.__e=e.__d=void 0}function fe(e,_,t){return this.constructor(e,t)}function ce(e,_,t){var i,o,r,l;a.__&&a.__(e,_),o=(i=typeof t=="function")?null:t&&t.__k||_.__k,r=[],l=[],O(_,e=(!i&&t||_).__k=re(A,null,[e]),o||D,D,_.ownerSVGElement!==void 0,!i&&t?[t]:o?null:_.firstChild?T.call(_.childNodes):null,r,!i&&t?t:o?o.__e:_.firstChild,i,l),te(r,e,l)}function pe(e,_){ce(e,_,pe)}function de(e,_,t){var i,o,r,l,u=b({},e.props);for(r in e.type&&e.type.defaultProps&&(l=e.type.defaultProps),_)r=="key"?i=_[r]:r=="ref"?o=_[r]:u[r]=_[r]===void 0&&l!==void 0?l[r]:_[r];return arguments.length>2&&(u.children=arguments.length>3?T.call(arguments,2):t),S(e.type,u,i||e.key,o||e.ref,null)}function he(e,_){var t={__c:_="__cC"+Q++,__:e,Consumer:function(i,o){return i.children(o)},Provider:function(i){var o,r;return this.getChildContext||(o=[],(r={})[_]=this,this.getChildContext=function(){return r},this.shouldComponentUpdate=function(l){this.props.value!==l.value&&o.some(function(u){u.__e=!0,I(u)})},this.sub=function(l){o.push(l);var u=l.componentWillUnmount;l.componentWillUnmount=function(){o.splice(o.indexOf(l),1),u&&u.call(l)}}),i.children}};return t.Provider.__=t.Consumer.contextType=t}T=X.slice,a={__e:function(e,_,t,i){for(var o,r,l;_=_.__;)if((o=_.__c)&&!o.__)try{if((r=o.constructor)&&r.getDerivedStateFromError!=null&&(o.setState(r.getDerivedStateFromError(e)),l=o.__d),o.componentDidCatch!=null&&(o.componentDidCatch(e,i||{}),l=o.__d),l)return o.__E=o}catch(u){e=u}throw e}},J=0,ne=function(e){return e!=null&&e.constructor==null},W.prototype.setState=function(e,_){var t;t=this.__s!=null&&this.__s!==this.state?this.__s:this.__s=b({},this.state),typeof e=="function"&&(e=e(b({},t),this.props)),e&&b(t,e),e!=null&&this.__v&&(_&&this._sb.push(_),I(this))},W.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),I(this))},W.prototype.render=A,C=[],K=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,$=function(e,_){return e.__v.__b-_.__v.__b},H.__r=0,Q=0;export{le as $,pe as B,de as E,he as F,ae as _,W as b,A as g,a as l,ce as q,ne as t,re as y};
