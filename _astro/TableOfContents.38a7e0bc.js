import{h as m,p as w}from"./hooks.module.1da69da9.js";/* empty css                               */import{o as e}from"./jsxRuntime.module.ab16166f.js";import{k as N}from"./preact.module.0166329b.js";const{replace:T}="",k=/&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g,O={"&amp;":"&","&#38;":"&","&lt;":"<","&#60;":"<","&gt;":">","&#62;":">","&apos;":"'","&#39;":"'","&quot;":'"',"&#34;":'"'},A=n=>O[n],I=n=>T.call(n,k,A);function f(n){return I(n).replaceAll("&#x3C;","<").replaceAll("&#x26;","&")}const L=({toc:n=[],labels:x,isMobile:c})=>{const[i,h]=m({slug:n[0].slug,text:n[0].text}),[u,d]=m(!c),g="on-this-page-heading",v=({children:t})=>c?e("details",{open:u,onToggle:o=>d(o.currentTarget.open),className:"toc-mobile-container",children:t}):e(N,{children:t}),C=({children:t})=>c?e("summary",{className:"toc-mobile-header",children:e("div",{className:"toc-mobile-header-content",children:[e("div",{className:"toc-toggle",children:[t,e("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 1 16 16",width:"16",height:"16","aria-hidden":"true",children:e("path",{fillRule:"evenodd",d:"M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"})})]}),!u&&i?.slug!=="overview"&&e("span",{className:"toc-current-heading",children:f(i?.text||"")})]})}):t;w(()=>{const t=a=>{for(const r of a)if(r.isIntersecting){const{id:l}=r.target;if(l===g)continue;h({slug:r.target.id,text:r.target.textContent||""});break}},o={rootMargin:"-100px 0% -66%",threshold:1},s=new IntersectionObserver(t,o);return document.querySelectorAll("article :is(h1,h2,h3)").forEach(a=>s.observe(a)),()=>s.disconnect()},[]);const b=t=>{c&&(d(!1),h({slug:t.currentTarget.getAttribute("href").replace("#",""),text:t.currentTarget.textContent||""}))},p=({heading:t})=>{const{depth:o,slug:s,text:a,children:r}=t;return e("li",{children:[e("a",{className:`header-link depth-${o} ${i.slug===s?"current-header-link":""}`.trim(),href:`#${s}`,onClick:b,children:f(a)}),r.length>0?e("ul",{children:r.map(l=>e(p,{heading:l},l.slug))}):null]})};return e(v,{children:[e(C,{children:e("h2",{className:"heading",id:g,children:x.onThisPage})}),e("ul",{className:"toc-root",children:n.map(t=>e(p,{heading:t},t.slug))})]})};export{L as default};
