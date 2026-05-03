var c={exports:{}},u={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var d;function f(){if(d)return u;d=1;var r=Symbol.for("react.transitional.element"),e=Symbol.for("react.fragment");function o(n,t,i){var a=null;if(i!==void 0&&(a=""+i),t.key!==void 0&&(a=""+t.key),"key"in t){i={};for(var s in t)s!=="key"&&(i[s]=t[s])}else i=t;return t=i.ref,{$$typeof:r,type:n,key:a,ref:t!==void 0?t:null,props:i}}return u.Fragment=e,u.jsx=o,u.jsxs=o,u}var l;function x(){return l||(l=1,c.exports=f()),c.exports}var m=x();function v(r,e){const o=Number(r),n=Number(e);return r===""||e===""?{valid:!1,error:"Both fields are required"}:isNaN(o)||isNaN(n)?{valid:!1,error:"Must be valid numbers"}:!isFinite(o)||!isFinite(n)?{valid:!1,error:"Must be finite numbers"}:{valid:!0}}function R(r){return r.replace(/[<>'"&]/g,"")}function p(r,e){const o=`x,y
`,n=r.map(i=>`${i.x},${i.y}`).join(`
`);let t="";return e&&(t+=`

Method,${e.method}
Equation,${e.equation}
Extrapolated Value,${e.value}
R²,${e.rSquared}
Confidence %,${e.confidence}`),o+n+t}function E(r,e){const o=new Blob([r],{type:"text/csv;charset=utf-8;"}),n=URL.createObjectURL(o),t=document.createElement("a");t.href=n,t.download=e,t.click(),URL.revokeObjectURL(n)}function k(r,e){if(!r)return;const o=r.toDataURL("image/png"),n=document.createElement("a");n.href=o,n.download=e,n.click()}function b(r,e){let o;return((...n)=>{clearTimeout(o),o=setTimeout(()=>r(...n),e)})}export{E as a,k as b,b as d,p as e,m as j,R as s,v};
